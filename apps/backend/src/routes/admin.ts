import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { requireRole } from '../lib/auth'
import { StoreStatus } from '@prisma/client'
import { syncBlingProducts, syncBlingStock } from '../lib/bling'

export async function adminRoutes(fastify: FastifyInstance) {
  fastify.addHook('onRequest', (fastify as any).authenticate)
  fastify.addHook('onRequest', requireRole('admin'))

  // Listar lojas
  fastify.get('/stores', async (request, reply) => {
    const stores = await prisma.store.findMany({
      include: { priceTable: true, representative: true },
      orderBy: { createdAt: 'desc' },
    })
    return reply.send({ data: stores })
  })

  // Aprovar loja
  fastify.put('/stores/:id/approve', async (request, reply) => {
    const { id } = z.object({ id: z.string() }).parse(request.params)

    const store = await prisma.store.update({
      where: { id },
      data: { status: StoreStatus.ACTIVE },
    })

    // Cria notificação para o lojista
    await prisma.notification.create({
      data: {
        userId: store.userId,
        title: 'Conta aprovada!',
        body: 'Sua conta foi aprovada. Bem-vindo à Pace It B2B Hub! 🏃',
      },
    })

    return reply.send({ data: store })
  })

  // Criar tabela de preços
  fastify.post('/price-tables', async (request, reply) => {
    const body = z.object({
      name: z.string().min(2),
      discount: z.number().min(0).max(100),
    }).parse(request.body)

    const priceTable = await prisma.priceTable.create({ data: body })
    return reply.status(201).send({ data: priceTable })
  })

  // Atualizar tabela de preços
  fastify.put('/price-tables/:id', async (request, reply) => {
    const { id } = z.object({ id: z.string() }).parse(request.params)
    const body = z.object({
      name: z.string().optional(),
      discount: z.number().min(0).max(100).optional(),
    }).parse(request.body)

    const priceTable = await prisma.priceTable.update({ where: { id }, data: body })
    return reply.send({ data: priceTable })
  })

  // Trigger sync Bling
  fastify.post('/sync/bling', async (request, reply) => {
    const { type } = z.object({
      type: z.enum(['products', 'stock', 'all']).optional().default('all'),
    }).parse(request.body ?? {})

    const results: Record<string, unknown> = {}

    if (type === 'products' || type === 'all') {
      results.products = await syncBlingProducts()
    }

    if (type === 'stock' || type === 'all') {
      results.stock = await syncBlingStock()
    }

    return reply.send({ data: results })
  })

  // Listar todos os pedidos
  fastify.get('/orders', async (request, reply) => {
    const orders = await prisma.order.findMany({
      include: { store: true, items: { include: { product: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })
    return reply.send({ data: orders })
  })
}
