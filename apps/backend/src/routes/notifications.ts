import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../lib/prisma'

export async function notificationRoutes(fastify: FastifyInstance) {
  fastify.addHook('onRequest', (fastify as any).authenticate)

  fastify.get('/', async (request, reply) => {
    const { id } = request.user as { id: string }
    const notifications = await prisma.notification.findMany({
      where: { userId: id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
    return reply.send({ data: notifications })
  })

  fastify.put('/:id/read', async (request, reply) => {
    const { id: userId } = request.user as { id: string }
    const { id } = z.object({ id: z.string() }).parse(request.params)

    const notification = await prisma.notification.findFirst({ where: { id, userId } })
    if (!notification) return reply.status(404).send({ error: 'NotFound', message: 'Notificação não encontrada', statusCode: 404 })

    await prisma.notification.update({ where: { id }, data: { read: true } })
    return reply.send({ data: { success: true } })
  })
}
