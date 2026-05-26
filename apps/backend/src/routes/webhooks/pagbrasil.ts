import { FastifyInstance } from 'fastify'
import { validatePagbrasilWebhook } from '../../lib/pagbrasil'
import { prisma } from '../../lib/prisma'
import { PaymentStatus } from '@prisma/client'
import { sendPushToUser } from '../../lib/notifications'

interface PagbrasilWebhookEvent {
  event: string
  data: {
    id: string
    reference: string // orderId
    amount: number
    status: string
    boleto_url?: string
    barcode?: string
    due_date?: string
    qr_code?: string
    pix_key?: string
  }
}

export async function pagbrasilWebhookRoutes(fastify: FastifyInstance) {
  fastify.post('/webhooks/pagbrasil', async (request, reply) => {
    // Valida assinatura HMAC
    const signature = request.headers['x-pagbrasil-signature'] as string
    if (!signature) {
      return reply.status(400).send({ error: 'Assinatura ausente' })
    }

    const rawBody = (request as any).rawBody as string
    if (!validatePagbrasilWebhook(rawBody, signature)) {
      return reply.status(401).send({ error: 'Assinatura inválida' })
    }

    const event = request.body as PagbrasilWebhookEvent
    const orderId = event.data?.reference

    if (!orderId) {
      return reply.status(200).send({ received: true })
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { store: { include: { user: true } } },
    })

    if (!order) {
      return reply.status(200).send({ received: true })
    }

    switch (event.event) {
      case 'payment.paid': {
        await prisma.order.update({
          where: { id: orderId },
          data: { paymentStatus: PaymentStatus.PAID },
        })

        // Notifica o lojista
        if (order.store.user) {
          await sendPushToUser(order.store.userId, {
            title: 'Pagamento confirmado! ✅',
            body: `Pagamento do pedido #${orderId.slice(-8).toUpperCase()} foi confirmado.`,
            data: { orderId, type: 'payment.paid' },
          })
        }

        await prisma.auditLog.create({
          data: {
            orderId,
            action: 'PAYMENT_PAID',
            details: { pagbrasilId: event.data.id },
          },
        })
        break
      }

      case 'payment.expired': {
        await prisma.order.update({
          where: { id: orderId },
          data: { paymentStatus: PaymentStatus.EXPIRED },
        })

        // Notifica lojista para reemitir
        if (order.store.user) {
          await sendPushToUser(order.store.userId, {
            title: 'Boleto expirado ⚠️',
            body: `O boleto do pedido #${orderId.slice(-8).toUpperCase()} venceu. Acesse o app para reemitir.`,
            data: { orderId, type: 'payment.expired' },
          })
        }

        await prisma.auditLog.create({
          data: { orderId, action: 'PAYMENT_EXPIRED' },
        })
        break
      }

      default:
        break
    }

    return reply.status(200).send({ received: true })
  })
}
