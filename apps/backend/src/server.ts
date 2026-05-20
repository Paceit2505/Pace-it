import 'dotenv/config'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import fastifyJwt from '@fastify/jwt'
import rateLimit from '@fastify/rate-limit'
import { authRoutes } from './routes/auth'
import { storeRoutes } from './routes/stores'
import { productRoutes } from './routes/products'
import { orderRoutes } from './routes/orders'
import { notificationRoutes } from './routes/notifications'
import { adminRoutes } from './routes/admin'
import { repRoutes } from './routes/representative'
import { blingWebhookRoutes } from './routes/webhooks/bling'
import { pagbrasilWebhookRoutes } from './routes/webhooks/pagbrasil'
import { pushRoutes } from './routes/push'
import { startBlingSyncJob } from './jobs/blingSync'

const server = Fastify({ logger: true })

async function start() {
  // CORS
  await server.register(cors, {
    origin: process.env.FRONTEND_URL ?? '*',
    credentials: true,
  })

  // Rate limit global
  await server.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  })

  // JWT
  await server.register(fastifyJwt, {
    secret: process.env.JWT_SECRET ?? 'dev-secret-change-in-production',
  })

  // Decorator de autenticação reutilizável
  server.decorate('authenticate', async function (request: any, reply: any) {
    try {
      await request.jwtVerify()
    } catch {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'Token inválido ou expirado',
        statusCode: 401,
      })
    }
  })

  // Necessário para validar assinatura HMAC dos webhooks
  server.addContentTypeParser('application/json', { parseAs: 'string' }, (req, body, done) => {
    ;(req as any).rawBody = body
    try {
      done(null, JSON.parse(body as string))
    } catch (err: any) {
      done(err, undefined)
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
  await server.register(blingWebhookRoutes)

  // Health check
  server.get('/health', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
  }))

  const port = Number(process.env.PORT ?? 3001)
  const host = process.env.HOST ?? '0.0.0.0'

  await server.listen({ port, host })
  console.log(`🚀 Pace It B2B Backend rodando em http://${host}:${port}`)
  startBlingSyncJob()
}

start().catch((err) => {
  console.error(err)
  process.exit(1)
})
