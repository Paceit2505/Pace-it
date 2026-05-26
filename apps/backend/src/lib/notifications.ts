import axios from 'axios'
import { prisma } from './prisma'

interface PushPayload {
  title: string
  body: string
  data?: Record<string, unknown>
}

// Busca tokens Expo do usuário e envia push via Expo Push API
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<void> {
  // Busca tokens salvos do usuário (tabela PushToken)
  const tokens = await prisma.pushToken.findMany({
    where: { userId },
    select: { token: true },
  })

  if (tokens.length === 0) return

  const messages = tokens.map((t) => ({
    to: t.token,
    title: payload.title,
    body: payload.body,
    data: payload.data ?? {},
    sound: 'default',
    priority: 'high',
  }))

  // Expo Push API aceita até 100 mensagens por chamada
  const chunks = chunkArray(messages, 100)

  for (const chunk of chunks) {
    try {
      await axios.post('https://exp.host/--/api/v2/push/send', chunk, {
        headers: { 'Content-Type': 'application/json' },
      })
    } catch (err: any) {
      console.error('[Push] Erro ao enviar notificação:', err.message)
    }
  }

  // Salva notificação no banco para listagem no app
  await prisma.notification.createMany({
    data: [
      {
        userId,
        title: payload.title,
        body: payload.body,
        data: payload.data ?? {},
      },
    ],
  })
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size))
  }
  return chunks
}

// Notificações específicas do domínio

export async function notifyOrderConfirmed(userId: string, orderId: string) {
  await sendPushToUser(userId, {
    title: 'Pedido confirmado pela Pace It 🏃',
    body: `Pedido #${orderId.slice(-8).toUpperCase()} foi confirmado e está em preparação.`,
    data: { orderId, type: 'order.confirmed' },
  })
}

export async function notifyNfeIssued(userId: string, orderId: string) {
  await sendPushToUser(userId, {
    title: 'Nota fiscal emitida 📄',
    body: `NF-e do pedido #${orderId.slice(-8).toUpperCase()} disponível no app.`,
    data: { orderId, type: 'nfe.issued' },
  })
}

export async function notifyBoletoGenerated(userId: string, orderId: string, dueDate: string) {
  await sendPushToUser(userId, {
    title: 'Boleto gerado 🏦',
    body: `Boleto do pedido #${orderId.slice(-8).toUpperCase()} vence em ${dueDate}.`,
    data: { orderId, type: 'boleto.generated' },
  })
}

export async function notifyOrderShipped(userId: string, orderId: string) {
  await sendPushToUser(userId, {
    title: 'Pedido enviado! 🚚',
    body: `Pedido #${orderId.slice(-8).toUpperCase()} saiu para entrega.`,
    data: { orderId, type: 'order.shipped' },
  })
}

export async function notifyRepresentativeNewOrder(
  repUserId: string,
  storeName: string,
  orderId: string
) {
  await sendPushToUser(repUserId, {
    title: `Nova compra de ${storeName}`,
    body: `Pedido #${orderId.slice(-8).toUpperCase()} realizado.`,
    data: { orderId, type: 'rep.order.placed' },
  })
}
