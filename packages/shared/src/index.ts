// Enums de status
export enum StoreStatus {
  ACTIVE = 'ACTIVE',
  PENDING = 'PENDING',
  BLOCKED = 'BLOCKED',
}

export enum OrderStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  CONFIRMED = 'CONFIRMED',
  INVOICED = 'INVOICED',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentMethod {
  BOLETO = 'BOLETO',
  PIX = 'PIX',
  CREDIT_CARD = 'CREDIT_CARD',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  EXPIRED = 'EXPIRED',
}

export enum UserRole {
  LOJISTA = 'lojista',
  REPRESENTANTE = 'representante',
  ADMIN = 'admin',
}

// Tipos de endereço
export interface Address {
  street: string
  number: string
  complement?: string
  neighborhood: string
  city: string
  state: string
  zipCode: string
}

// Tipos de entidade
export interface Store {
  id: string
  cnpj: string
  razaoSocial: string
  nomeFantasia: string
  email: string
  phone: string
  address: Address
  priceTableId: string
  representativeId?: string
  status: StoreStatus
  createdAt: string
}

export interface Product {
  id: string
  sku: string
  name: string
  description?: string
  category: string
  images: string[]
  unit: string
  unitQty: number
  minOrder: number
  weight: number
  active: boolean
  blingId?: string
  price?: number // preço da tabela do lojista autenticado
  stock?: Stock
}

export interface Stock {
  id: string
  productId: string
  qty: number
  updatedAt: string
}

export interface PriceTable {
  id: string
  name: string
  discount: number
}

export interface Order {
  id: string
  storeId: string
  representativeId?: string
  status: OrderStatus
  items: OrderItem[]
  subtotal: number
  freight: number
  discount: number
  total: number
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
  dueDate?: string
  blingOrderId?: string
  nfeKey?: string
  pagbrasilId?: string
  notes?: string
  createdAt: string
  store?: Store
}

export interface OrderItem {
  id: string
  orderId: string
  productId: string
  qty: number
  unitPrice: number
  product?: Product
}

export interface Representative {
  id: string
  name: string
  email: string
  phone: string
  active: boolean
}

// Tipos de API request/response
export interface LoginRequest {
  cnpj?: string
  email?: string
  password: string
}

export interface LoginResponse {
  accessToken: string
  refreshToken: string
  user: {
    id: string
    role: UserRole
    store?: Store
    representative?: Representative
  }
}

export interface RegisterRequest {
  cnpj: string
  razaoSocial: string
  nomeFantasia: string
  email: string
  phone: string
  address: Address
  password: string
}

export interface CreateOrderRequest {
  items: { productId: string; qty: number; unitPrice: number }[]
  paymentMethod: PaymentMethod
  notes?: string
}

export interface ApiResponse<T> {
  data: T
  message?: string
}

export interface ApiError {
  error: string
  message: string
  statusCode: number
}

// Formatadores
export const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

export const formatCNPJ = (cnpj: string): string => {
  const digits = cnpj.replace(/\D/g, '')
  return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
}

export const formatDate = (date: string | Date): string => {
  const d = new Date(date)
  return d.toLocaleDateString('pt-BR')
}

export const PRODUCT_CATEGORIES = [
  'Hidrogéis',
  'Eletrólitos',
  'Proteínas',
  'Acessórios',
  'Merch',
] as const

export type ProductCategory = typeof PRODUCT_CATEGORIES[number]
