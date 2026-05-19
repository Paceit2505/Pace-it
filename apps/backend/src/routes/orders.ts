import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { PaymentMethod, OrderStatus } from '@prisma/client'

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
