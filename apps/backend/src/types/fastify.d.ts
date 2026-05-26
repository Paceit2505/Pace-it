import '@fastify/jwt'
import { UserRole } from '@prisma/client'

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { id: string; role: UserRole }
    user: { id: string; role: UserRole }
  }
}
