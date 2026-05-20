import axios, { AxiosInstance } from 'axios'
import { prisma } from './prisma'

const BLING_BASE_URL = 'https://www.bling.com.br/Api/v3'

interface BlingTokens {
  access_token: string
  refresh_token: string
  expires_in: number
}

// Cache de token em memória (renovado automaticamente)
let cachedToken: { token: string; expiresAt: number } | null = null

async function getBlingToken(): Promise<string> {
  // Retorna token em cache se ainda válido (com margem de 60s)
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.token
  }

  const clientId = process.env.BLING_CLIENT_ID
  const clientSecret = process.env.BLING_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error('BLING_CLIENT_ID e BLING_CLIENT_SECRET são obrigatórios')
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

  const response = await axios.post<BlingTokens>(
    'https://www.bling.com.br/Api/v3/oauth/token',
    new URLSearchParams({
      grant_type: 'client_credentials',
    }),
    {
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  )

  cachedToken = {
    token: response.data.access_token,
    expiresAt: Date.now() + response.data.expires_in * 1000,
  }

  return cachedToken.token
}

function createBlingClient(): AxiosInstance {
  const client = axios.create({ baseURL: BLING_BASE_URL })

  client.interceptors.request.use(async (config) => {
    const token = await getBlingToken()
    config.headers.Authorization = `Bearer ${token}`
    return config
  })

  return client
}

export const blingApi = createBlingClient()

// ─── Sync de Produtos ─────────────────────────────────────────────────────────

interface BlingProduct {
  id: number
  codigo: string
  descricao: string
  tipo: string
  situacao: string
  categoria: { id: number; descricao: string }
  estoque: { minimo: number; maximo: number; crossdocking: number; localizacao: string }
  peso: { bruto: number; liquido: number }
  unidade: string
  precoCusto: number
  preco: number
  imageThumbnail: string
}

export async function syncBlingProducts(): Promise<{ synced: number; errors: number }> {
  let page = 1
  let synced = 0
  let errors = 0

  while (true) {
    const response = await blingApi.get('/produtos', {
      params: { pagina: page, limite: 100, situacao: 'A' },
    })

    const products: BlingProduct[] = response.data?.data ?? []
    if (products.length === 0) break

    for (const p of products) {
      try {
        await prisma.product.upsert({
          where: { sku: p.codigo },
          update: {
            name: p.descricao,
            category: p.categoria?.descricao ?? 'Outros',
            weight: p.peso?.bruto ?? 0,
            active: p.situacao === 'A',
            blingId: String(p.id),
            images: p.imageThumbnail ? [p.imageThumbnail] : [],
          },
          create: {
            sku: p.codigo,
            name: p.descricao,
            category: p.categoria?.descricao ?? 'Outros',
            unit: p.unidade ?? 'unidade',
            unitQty: 1,
            minOrder: 1,
            weight: p.peso?.bruto ?? 0,
            active: p.situacao === 'A',
            blingId: String(p.id),
            images: p.imageThumbnail ? [p.imageThumbnail] : [],
          },
        })
        synced++
      } catch {
        errors++
      }
    }

    page++
  }

  console.log(`[Bling Sync Produtos] Sincronizados: ${synced}, Erros: ${errors}`)
  return { synced, errors }
}

// ─── Sync de Estoque ──────────────────────────────────────────────────────────

interface BlingStock {
  id: number
  codigo: string
  saldoFisicoTotal: number
}

export async function syncBlingStock(): Promise<{ synced: number }> {
  let page = 1
  let synced = 0

  while (true) {
    const response = await blingApi.get('/estoques/saldos', {
      params: { pagina: page, limite: 100 },
    })

    const items: BlingStock[] = response.data?.data ?? []
    if (items.length === 0) break

    for (const item of items) {
      const product = await prisma.product.findUnique({ where: { sku: item.codigo } })
      if (!product) continue

      await prisma.stock.upsert({
        where: { productId: product.id },
        update: { qty: Math.max(0, item.saldoFisicoTotal) },
        create: { productId: product.id, qty: Math.max(0, item.saldoFisicoTotal) },
      })
      synced++
    }

    page++
  }

  console.log(`[Bling Sync Estoque] Atualizados: ${synced}`)
  return { synced }
}

// ─── Criação de Pedido de Venda no Bling ──────────────────────────────────────

interface BlingOrderItem {
  productId: string
  sku: string
  name: string
  qty: number
  unitPrice: number
}

interface BlingOrderPayload {
  orderId: string
  storeId: string
  cnpj: string
  razaoSocial: string
  items: BlingOrderItem[]
  total: number
  paymentMethod: string
  notes?: string
}

export async function createBlingOrder(payload: BlingOrderPayload): Promise<string> {
  const response = await blingApi.post('/pedidos/vendas', {
    numero: payload.orderId.slice(-8).toUpperCase(),
    observacoes: payload.notes ?? '',
    observacoesInternas: `Pedido B2B Hub #${payload.orderId}`,
    data: new Date().toISOString().split('T')[0],
    contato: {
      tipoPessoa: 'J',
      nome: payload.razaoSocial,
      numeroDocumento: payload.cnpj,
    },
    itens: payload.items.map((item) => ({
      codigo: item.sku,
      descricao: item.name,
      quantidade: item.qty,
      valor: item.unitPrice,
    })),
    parcelas: [
      {
        valor: payload.total,
        formaPagamento: mapPaymentMethod(payload.paymentMethod),
      },
    ],
  })

  return String(response.data?.data?.id ?? '')
}

function mapPaymentMethod(method: string): { id: number } {
  // IDs padrão de formas de pagamento do Bling
  const map: Record<string, number> = {
    BOLETO: 15,
    PIX: 17,
    CREDIT_CARD: 3,
  }
  return { id: map[method] ?? 15 }
}

// ─── Validação de Webhook HMAC ─────────────────────────────────────────────────

import crypto from 'crypto'

export function validateBlingWebhook(payload: string, signature: string): boolean {
  const secret = process.env.BLING_WEBHOOK_SECRET
  if (!secret) return false

  const expected = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')

  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
}
