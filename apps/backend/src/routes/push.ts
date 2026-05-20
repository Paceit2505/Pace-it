import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../lib/prisma'

export async function pushRoutes(fastify: FastifyInstance) {
  fastify.addHook('onRequest', (fastify as any).authenticate)

  // Registra token de push do dispositivo
  fastify.post('/push/token', async (request, reply) => {
    const { id: userId } = request.user as { id: string }

    const { token, platform } = z.object({
      token: z.string().min(10),
      platform: z.enum(['ios', 'android', 'web']),
    }).parse(request.body)

    await prisma.pushToken.upsert({
      where: { token },
      update: { userId, platform },
      create: { userId, token, platform },
    })

    return reply.send({ data: { registered: true } })
  })

  // Remove token (logout do dispositivo)
  fastify.delete('/push/token', async (request, reply) => {
    const { token } = z.object({ token: z.string() }).parse(request.body)

    await prisma.pushToken.deleteMany({ where: { token } })

    return reply.send({ data: { removed: true } })
  })
}
