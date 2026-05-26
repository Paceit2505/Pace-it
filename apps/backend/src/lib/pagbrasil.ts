import axios from 'axios'
import crypto from 'crypto'

const PAGBRASIL_BASE_URL = process.env.PAGBRASIL_BASE_URL ?? 'https://api.pagbrasil.com'
const PAGBRASIL_API_KEY = process.env.PAGBRASIL_API_KEY ?? ''

const pagbrasilApi = axios.create({
  baseURL: PAGBRASIL_BASE_URL,
  headers: {
    Authorization: `Bearer ${PAGBRASIL_API_KEY}`,
    'Content-Type': 'application/json',
  },
})

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface BoletoResult {
  pagbrasilId: string
  boletoUrl: string
  barcode: string
  expirationDate: string
}

export interface PixResult {
  pagbrasilId: string
  qrCode: string
  pixKey: string
  expiresAt: string
}

interface PagbrasilPayer {
  cnpj: string
  name: string
  email: string
  phone: string
  address: {
    street: string
    number: string
    complement?: string
    neighborhood: string
    city: string
    state: string
    zipCode: string
  }
}

// ─── Boleto ───────────────────────────────────────────────────────────────────

export async function createBoleto(
  orderId: string,
  amount: number,
  dueDate: Date,
  payer: PagbrasilPayer
): Promise<BoletoResult> {
  const response = await pagbrasilApi.post('/v1/charges', {
    reference: orderId,
    amount: Math.round(amount * 100), // em centavos
    currency: 'BRL',
    payment_method: 'boleto',
    due_date: dueDate.toISOString().split('T')[0],
    payer: {
      type: 'company',
      document: payer.cnpj.replace(/\D/g, ''),
      name: payer.name,
      email: payer.email,
      phone: payer.phone.replace(/\D/g, ''),
      address: {
        street: payer.address.street,
        number: payer.address.number,
        complement: payer.address.complement,
        neighborhood: payer.address.neighborhood,
        city: payer.address.city,
        state: payer.address.state,
        zip_code: payer.address.zipCode.replace(/\D/g, ''),
      },
    },
  })

  const data = response.data

  return {
    pagbrasilId: data.id,
    boletoUrl: data.boleto_url,
    barcode: data.barcode,
    expirationDate: data.due_date,
  }
}

// ─── PIX ──────────────────────────────────────────────────────────────────────

export async function createPix(
  orderId: string,
  amount: number,
  payer: PagbrasilPayer
): Promise<PixResult> {
  const response = await pagbrasilApi.post('/v1/pix', {
    reference: orderId,
    amount: Math.round(amount * 100),
    currency: 'BRL',
    expires_in: 900, // 15 minutos
    payer: {
      type: 'company',
      document: payer.cnpj.replace(/\D/g, ''),
      name: payer.name,
      email: payer.email,
    },
  })

  const data = response.data
  const expiresAt = new Date(Date.now() + 900_000).toISOString()

  return {
    pagbrasilId: data.id,
    qrCode: data.qr_code,
    pixKey: data.pix_key,
    expiresAt,
  }
}

// ─── Validação de Webhook HMAC-SHA256 ─────────────────────────────────────────

export function validatePagbrasilWebhook(payload: string, signature: string): boolean {
  const secret = process.env.PAGBRASIL_WEBHOOK_SECRET
  if (!secret) return false

  const expected = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')

  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
  } catch {
    return false
  }
}
