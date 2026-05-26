import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { requireRole } from '../lib/auth'

export async function repRoutes(fastify: FastifyInstance) {
  fastify.addHook('onRequest', (fastify as any).authenticate)
  fastify.addHook('onRequest', requireRole('representante'))

  // Lojas da carteira
  fastify.get('/stores', async (request, reply) => {
    const { id: userId } = request.user as { id: string }
    const rep = await prisma.representative.findUnique({ where: { userId } })
    if (!rep) return reply.status(404).send({ error: 'NotFound', message: 'Representante não encontrado', statusCode: 404 })

    const stores = await prisma.store.findMany({
      where: { representativeId: rep.id },
      include: { priceTable: true },
    })
    return reply.send({ data: stores })
  })

  // Pedidos das lojas
  fastify.get('/orders', async (request, reply) => {
    const { id: userId } = request.user as { id: string }
    const rep = await prisma.representative.findUnique({ where: { userId }, include: { stores: true } })
    if (!rep) return reply.status(404).send({ error: 'NotFound', message: 'Representante não encontrado', statusCode: 404 })

    const storeIds = rep.stores.map((s) => s.id)
    const orders = await prisma.order.findMany({
      where: { storeId: { in: storeIds } },
      include: { store: true, items: { include: { product: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
    return reply.send({ data: orders })
  })

  // Criar pedido em nome de loja
  fastify.post('/orders', async (request, reply) => {
    const { id: userId } = request.user as { id: string }
    const rep = await prisma.representative.findUnique({ where: { userId }, include: { stores: true } })
    if (!rep) return reply.status(404).send({ error: 'NotFound', message: 'Representante não encontrado', statusCode: 404 })

    const body = z.object({
      storeId: z.string(),
      items: z.array(z.object({
        productId: z.string(),
        qty: z.number().int().positive(),
        unitPrice: z.number().positive(),
      })).min(1),
      paymentMethod: z.enum(['BOLETO', 'PIX', 'CREDIT_CARD']),
      notes: z.string().optional(),
    }).parse(request.body)

    const ownsStore = rep.stores.some((s) => s.id === body.storeId)
    if (!ownsStore) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Loja não pertence à sua carteira', statusCode: 403 })
    }

    const subtotal = body.items.reduce((sum, i) => sum + i.unitPrice * i.qty, 0)
    const freight = subtotal >= 500 ? 0 : 25
    const total = subtotal + freight

    const order = await prisma.order.create({
      data: {
        storeId: body.storeId,
        representativeId: rep.id,
        status: 'SUBMITTED',
        subtotal,
        freight,
        discount: 0,
        total,
        paymentMethod: body.paymentMethod as any,
        items: { create: body.items },
      },
      include: { items: { include: { product: true } } },
    })

    return reply.status(201).send({ data: order })
  })
}
