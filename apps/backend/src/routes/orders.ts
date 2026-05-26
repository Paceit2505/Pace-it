import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { PaymentMethod, OrderStatus } from '@prisma/client'
import { createBlingOrder } from '../lib/bling'
import { createBoleto, createPix } from '../lib/pagbrasil'

const FREIGHT_FREE_ABOVE = Number(process.env.FREIGHT_MIN_VALUE_FREE ?? 500)
const FREIGHT_FIXED = Number(process.env.FREIGHT_FIXED_VALUE ?? 25)

function calcFreight(subtotal: number): number {
  return subtotal >= FREIGHT_FREE_ABOVE ? 0 : FREIGHT_FIXED
}

export async function orderRoutes(fastify: FastifyInstance) {
  fastify.addHook('onRequest', (fastify as any).authenticate)

  // Criar pedido
  fastify.post('/', async (request, reply) => {
    const { id: userId } = request.user as { id: string }

    const store = await prisma.store.findUnique({ where: { userId } })
    if (!store) return reply.status(404).send({ error: 'NotFound', message: 'Loja não encontrada', statusCode: 404 })

    const body = z.object({
      items: z.array(z.object({
        productId: z.string(),
        qty: z.number().int().positive(),
        unitPrice: z.number().positive(),
      })).min(1),
      paymentMethod: z.nativeEnum(PaymentMethod),
      notes: z.string().optional(),
    }).parse(request.body)

    // Valida quantidade mínima por produto
    for (const item of body.items) {
      const product = await prisma.product.findUnique({ where: { id: item.productId } })
      if (!product) {
        return reply.status(404).send({ error: 'NotFound', message: `Produto ${item.productId} não encontrado`, statusCode: 404 })
      }
      if (item.qty % product.minOrder !== 0) {
        return reply.status(400).send({
          error: 'BadRequest',
          message: `Quantidade de "${product.name}" deve ser múltiplo de ${product.minOrder}`,
          statusCode: 400,
        })
      }
    }

    const subtotal = body.items.reduce((sum, i) => sum + i.unitPrice * i.qty, 0)
    const freight = calcFreight(subtotal)
    const total = subtotal + freight

    const order = await prisma.order.create({
      data: {
        storeId: store.id,
        status: OrderStatus.SUBMITTED,
        subtotal,
        freight,
        discount: 0,
        total,
        paymentMethod: body.paymentMethod,
        notes: body.notes,
        items: {
          create: body.items.map((i) => ({
            productId: i.productId,
            qty: i.qty,
            unitPrice: i.unitPrice,
          })),
        },
      },
      include: { items: { include: { product: true } } },
    })

    // Log de auditoria
    await prisma.auditLog.create({
      data: { orderId: order.id, action: 'ORDER_CREATED', details: { userId, total } },
    })

    // Envia pedido para o Bling ERP em background (não bloqueia a resposta)
    if (process.env.BLING_CLIENT_ID && process.env.BLING_CLIENT_SECRET) {
      const storeData = await prisma.store.findUnique({ where: { id: store.id } })
      createBlingOrder({
        orderId: order.id,
        storeId: store.id,
        cnpj: storeData?.cnpj ?? '',
        razaoSocial: storeData?.razaoSocial ?? '',
        items: order.items.map((i) => ({
          productId: i.productId,
          sku: i.product.sku,
          name: i.product.name,
          qty: i.qty,
          unitPrice: i.unitPrice,
        })),
        total: order.total,
        paymentMethod: order.paymentMethod,
        notes: order.notes ?? undefined,
      })
        .then(async (blingOrderId) => {
          if (blingOrderId) {
            await prisma.order.update({
              where: { id: order.id },
              data: { blingOrderId },
            })
            console.log(`[Bling] Pedido ${order.id} criado no Bling: ${blingOrderId}`)
          }
        })
        .catch((err) => {
          console.error(`[Bling] Erro ao criar pedido ${order.id} no Bling:`, err.message)
        })
    }

    // Gera cobrança no PagBrasil em background
    if (process.env.PAGBRASIL_API_KEY) {
      const storeWithAddress = await prisma.store.findUnique({ where: { id: store.id } })
      const address = storeWithAddress?.address as any

      const payer = {
        cnpj: storeWithAddress?.cnpj ?? '',
        name: storeWithAddress?.razaoSocial ?? '',
        email: storeWithAddress?.email ?? '',
        phone: storeWithAddress?.phone ?? '',
        address: {
          street: address?.street ?? '',
          number: address?.number ?? '',
          complement: address?.complement,
          neighborhood: address?.neighborhood ?? '',
          city: address?.city ?? '',
          state: address?.state ?? '',
          zipCode: address?.zipCode ?? '',
        },
      }

      const paymentPromise =
        order.paymentMethod === 'PIX'
          ? createPix(order.id, order.total, payer)
          : createBoleto(
              order.id,
              order.total,
              new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // vence em 3 dias
              payer
            )

      paymentPromise
        .then(async (result) => {
          await prisma.order.update({
            where: { id: order.id },
            data: { pagbrasilId: result.pagbrasilId },
          })
          console.log(`[PagBrasil] Cobrança gerada para pedido ${order.id}: ${result.pagbrasilId}`)
        })
        .catch((err) => {
          console.error(`[PagBrasil] Erro ao gerar cobrança para pedido ${order.id}:`, err.message)
        })
    }

    return reply.status(201).send({ data: order })
  })

  // Listar pedidos da loja
  fastify.get('/', async (request, reply) => {
    const { id: userId } = request.user as { id: string }
    const { limit = '20', page = '1' } = z.object({
      limit: z.string().optional(),
      page: z.string().optional(),
    }).parse(request.query)

    const store = await prisma.store.findUnique({ where: { userId } })
    if (!store) return reply.status(404).send({ error: 'NotFound', message: 'Loja não encontrada', statusCode: 404 })

    const orders = await prisma.order.findMany({
      where: { storeId: store.id },
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    })

    return reply.send({ data: orders })
  })

  // Dados do boleto
  fastify.get('/:id/boleto', async (request, reply) => {
    const { id: userId } = request.user as { id: string }
    const { id } = z.object({ id: z.string() }).parse(request.params)

    const store = await prisma.store.findUnique({ where: { userId } })
    if (!store) return reply.status(404).send({ error: 'NotFound', message: 'Loja não encontrada', statusCode: 404 })

    const order = await prisma.order.findFirst({ where: { id, storeId: store.id } })
    if (!order) return reply.status(404).send({ error: 'NotFound', message: 'Pedido não encontrado', statusCode: 404 })

    if (!order.pagbrasilId) {
      return reply.status(404).send({ error: 'NotFound', message: 'Boleto não disponível ainda', statusCode: 404 })
    }

    return reply.send({
      data: {
        pagbrasilId: order.pagbrasilId,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        dueDate: order.dueDate,
      },
    })
  })

  // Dados da NF-e
  fastify.get('/:id/nfe', async (request, reply) => {
    const { id: userId } = request.user as { id: string }
    const { id } = z.object({ id: z.string() }).parse(request.params)

    const store = await prisma.store.findUnique({ where: { userId } })
    if (!store) return reply.status(404).send({ error: 'NotFound', message: 'Loja não encontrada', statusCode: 404 })

    const order = await prisma.order.findFirst({ where: { id, storeId: store.id } })
    if (!order) return reply.status(404).send({ error: 'NotFound', message: 'Pedido não encontrado', statusCode: 404 })

    if (!order.nfeKey) {
      return reply.status(404).send({ error: 'NotFound', message: 'NF-e não disponível ainda', statusCode: 404 })
    }

    return reply.send({
      data: {
        nfeKey: order.nfeKey,
        nfeUrl: `https://www.nfe.fazenda.gov.br/portal/consultaRecaptcha.aspx?tipoConsulta=completa&chave=${order.nfeKey}`,
      },
    })
  })

  // Detalhe de pedido
  fastify.get('/:id', async (request, reply) => {
    const { id: userId } = request.user as { id: string }
    const { id } = z.object({ id: z.string() }).parse(request.params)

    const store = await prisma.store.findUnique({ where: { userId } })
    if (!store) return reply.status(404).send({ error: 'NotFound', message: 'Loja não encontrada', statusCode: 404 })

    const order = await prisma.order.findFirst({
      where: { id, storeId: store.id },
      include: { items: { include: { product: true } } },
    })

    if (!order) return reply.status(404).send({ error: 'NotFound', message: 'Pedido não encontrado', statusCode: 404 })

    return reply.send({ data: order })
  })

  // Repetir pedido
  fastify.post('/:id/reorder', async (request, reply) => {
    const { id: userId } = request.user as { id: string }
    const { id } = z.object({ id: z.string() }).parse(request.params)

    const store = await prisma.store.findUnique({ where: { userId } })
    if (!store) return reply.status(404).send({ error: 'NotFound', message: 'Loja não encontrada', statusCode: 404 })

    const originalOrder = await prisma.order.findFirst({
      where: { id, storeId: store.id },
      include: { items: { include: { product: true } } },
    })

    if (!originalOrder) return reply.status(404).send({ error: 'NotFound', message: 'Pedido não encontrado', statusCode: 404 })

    // Valida estoque atual e monta itens
    const reorderItems = []
    for (const item of originalOrder.items) {
      const stock = await prisma.stock.findUnique({ where: { productId: item.productId } })
      if (!stock || stock.qty < item.qty) {
        return reply.status(409).send({
          error: 'Conflict',
          message: `Estoque insuficiente para "${item.product.name}"`,
          statusCode: 409,
        })
      }
      reorderItems.push({ productId: item.productId, qty: item.qty, unitPrice: item.unitPrice })
    }

    return reply.send({ data: { items: reorderItems } })
  })
}
