import { FastifyInstance } from 'fastify'
import { validateBlingWebhook } from '../../lib/bling'
import { prisma } from '../../lib/prisma'
import { OrderStatus } from '@prisma/client'
import { notifyOrderConfirmed, notifyNfeIssued } from '../../lib/notifications'

interface BlingWebhookEvent {
  evento: string
  dados: {
    id?: number
    numero?: string
    situacao?: string
    chaveAcesso?: string // NF-e
  }
}

export async function blingWebhookRoutes(fastify: FastifyInstance) {
  fastify.post('/webhooks/bling', {
    config: { rawBody: true },
  }, async (request, reply) => {
    // Valida assinatura HMAC
    const signature = request.headers['x-bling-signature'] as string
    if (!signature) {
      return reply.status(400).send({ error: 'Assinatura ausente' })
    }

    const rawBody = (request as any).rawBody as string
    if (!validateBlingWebhook(rawBody, signature)) {
      return reply.status(401).send({ error: 'Assinatura inválida' })
    }

    const event = request.body as BlingWebhookEvent
    const blingOrderId = String(event.dados?.id ?? '')

    const order = await prisma.order.findFirst({
      where: { blingOrderId },
    })

    if (!order) {
      // Webhook recebido para pedido não rastreado — OK
      return reply.status(200).send({ received: true })
    }

    switch (event.evento) {
      case 'pedido.aprovado':
        await prisma.order.update({
          where: { id: order.id },
          data: { status: OrderStatus.CONFIRMED },
        })
        await prisma.auditLog.create({
          data: {
            orderId: order.id,
            action: 'BLING_ORDER_CONFIRMED',
            details: { blingOrderId },
          },
        })
        // Notifica o lojista
        {
          const storeData = await prisma.order.findUnique({
            where: { id: order.id },
            select: { store: { select: { userId: true } } },
          })
          if (storeData?.store.userId) {
            await notifyOrderConfirmed(storeData.store.userId, order.id)
          }
        }
        break

      case 'nfe.emitida':
        if (event.dados.chaveAcesso) {
          await prisma.order.update({
            where: { id: order.id },
            data: {
              status: OrderStatus.INVOICED,
              nfeKey: event.dados.chaveAcesso,
            },
          })
          await prisma.auditLog.create({
            data: {
              orderId: order.id,
              action: 'BLING_NF_ISSUED',
              details: { nfeKey: event.dados.chaveAcesso },
            },
          })
          // Notifica o lojista
          const storeData = await prisma.order.findUnique({
            where: { id: order.id },
            select: { store: { select: { userId: true } } },
          })
          if (storeData?.store.userId) {
            await notifyNfeIssued(storeData.store.userId, order.id)
          }
        }
        break

      case 'pedido.entregue':
        await prisma.order.update({
          where: { id: order.id },
          data: { status: OrderStatus.DELIVERED },
        })
        await prisma.auditLog.create({
          data: { orderId: order.id, action: 'BLING_ORDER_DELIVERED' },
        })
        break

      default:
        // Evento não tratado — ignora silenciosamente
        break
    }

    return reply.status(200).send({ received: true })
  })
}
