import 'dotenv/config'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import rateLimit from '@fastify/rate-limit'
import { authRoutes } from './routes/auth'
import { storeRoutes } from './routes/stores'
import { productRoutes } from './routes/products'
import { orderRoutes } from './routes/orders'
import { notificationRoutes } from './routes/notifications'
import { adminRoutes } from './routes/admin'
import { repRoutes } from './routes/representative'

const server = Fastify({ logger: true })

// Plugins
await server.register(cors, {
  origin: process.env.FRONTEND_URL ?? '*',
  credentials: true,
})

await server.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute',
})

await server.register(jwt, {
  secret: process.env.JWT_SECRET ?? 'dev-secret',
})

// Decorator para autenticação
server.decorate('authenticate', async (request: any, reply: any) => {
  try {
    await request.jwtVerify()
  } catch {
    reply.status(401).send({ error: 'Unauthorized', message: 'Token inválido ou expirado', statusCode: 401 })
  }
})

// Rotas
await server.register(authRoutes, { prefix: '/auth' })
await server.register(storeRoutes, { prefix: '/stores' })
await server.register(productRoutes, { prefix: '/products' })
await server.register(orderRoutes, { prefix: '/orders' })
await server.register(notificationRoutes, { prefix: '/notifications' })
await server.register(adminRoutes, { prefix: '/admin' })
await server.register(repRoutes, { prefix: '/rep' })

// Health check
server.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }))

const port = Number(process.env.PORT ?? 3001)
const host = process.env.HOST ?? '0.0.0.0'

try {
  await server.listen({ port, host })
  console.log(`🚀 Pace It B2B Backend rodando em http://${host}:${port}`)
} catch (err) {
  server.log.error(err)
  process.exit(1)
}
