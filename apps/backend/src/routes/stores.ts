import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../lib/prisma'

export async function storeRoutes(fastify: FastifyInstance) {
  fastify.addHook('onRequest', (fastify as any).authenticate)

  fastify.get('/me', async (request, reply) => {
    const { id } = request.user as { id: string }
    const store = await prisma.store.findUnique({
      where: { userId: id },
      include: { priceTable: true, representative: { include: { user: true } } },
    })
    if (!store) return reply.status(404).send({ error: 'NotFound', message: 'Loja não encontrada', statusCode: 404 })
    return reply.send({ data: store })
  })

  fastify.put('/me', async (request, reply) => {
    const { id } = request.user as { id: string }
    const store = await prisma.store.findUnique({ where: { userId: id } })
    if (!store) return reply.status(404).send({ error: 'NotFound', message: 'Loja não encontrada', statusCode: 404 })

    const body = z.object({
      email: z.string().email().optional(),
      phone: z.string().optional(),
      nomeFantasia: z.string().optional(),
    }).parse(request.body)

    const updated = await prisma.store.update({ where: { id: store.id }, data: body })
    return reply.send({ data: updated })
  })
}
