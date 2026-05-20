'use client'

import { useState } from 'react'

interface Order {
  id: string
  storeName: string
  status: string
  paymentMethod: string
  paymentStatus: string
  total: number
  createdAt: string
  itemCount: number
}

const MOCK_ORDERS: Order[] = [
  { id: 'clx001', storeName: 'Run Store SP', status: 'CONFIRMED', paymentMethod: 'BOLETO', paymentStatus: 'PENDING', total: 2670.0, createdAt: '2025-05-20T10:00:00Z', itemCount: 5 },
  { id: 'clx002', storeName: 'Fitness World', status: 'SUBMITTED', paymentMethod: 'PIX', paymentStatus: 'PAID', total: 890.5, createdAt: '2025-05-20T09:30:00Z', itemCount: 3 },
  { id: 'clx003', storeName: 'Endurance Shop', status: 'SHIPPED', paymentMethod: 'BOLETO', paymentStatus: 'PAID', total: 4150.0, createdAt: '2025-05-19T14:00:00Z', itemCount: 8 },
  { id: 'clx004', storeName: 'Tri Sports', status: 'DELIVERED', paymentMethod: 'CREDIT_CARD', paymentStatus: 'PAID', total: 1299.9, createdAt: '2025-05-18T11:00:00Z', itemCount: 2 },
  { id: 'clx005', storeName: 'Run Store SP', status: 'INVOICED', paymentMethod: 'PIX', paymentStatus: 'PAID', total: 5600.0, createdAt: '2025-05-17T08:00:00Z', itemCount: 12 },
]

const STATUS_COLORS: Record<string, string> = {
  SUBMITTED: 'text-yellow-400',
  CONFIRMED: 'text-green-400',
  INVOICED: 'text-blue-400',
  SHIPPED: 'text-purple-400',
  DELIVERED: 'text-green-400',
  CANCELLED: 'text-red-400',
}

const PAY_STATUS_COLORS: Record<string, string> = {
  PENDING: 'text-yellow-400',
  PAID: 'text-green-400',
  EXPIRED: 'text-red-400',
}

const PAY_METHODS: Record<string, string> = {
  BOLETO: 'Boleto',
  PIX: 'PIX',
  CREDIT_CARD: 'Cartão',
}

function formatBRL(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function exportCSV(orders: Order[]) {
  const header = 'ID,Loja,Status,Pagamento,Status Pag.,Total,Data,Itens'
  const rows = orders.map((o) =>
    [
      o.id,
      o.storeName,
      o.status,
      PAY_METHODS[o.paymentMethod] ?? o.paymentMethod,
      o.paymentStatus,
      o.total.toFixed(2).replace('.', ','),
      formatDate(o.createdAt),
      o.itemCount,
    ].join(',')
  )
  const csv = [header, ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `pedidos_paceit_${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function PedidosPage() {
  const [orders] = useState(MOCK_ORDERS)
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')

  const filtered = orders.filter((o) => {
    const matchStatus = statusFilter === 'all' || o.status === statusFilter
    const matchSearch = !search || o.storeName.toLowerCase().includes(search.toLowerCase()) || o.id.includes(search)
    return matchStatus && matchSearch
  })

  const totalGMV = filtered.reduce((sum, o) => sum + o.total, 0)

  return (
    <div className="p-8">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-white">Pedidos</h2>
          <p className="text-muted mt-1">
            {filtered.length} pedidos · GMV: <span className="text-accent">{formatBRL(totalGMV)}</span>
          </p>
        </div>
        <button
          onClick={() => exportCSV(filtered)}
          className="flex items-center gap-2 px-4 py-2.5 bg-accent text-black text-sm font-bold rounded-xl hover:bg-accent/90 transition-colors"
        >
          ⬇ Exportar CSV
        </button>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <input
          type="text"
          placeholder="Buscar por loja ou ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-48 bg-surface border border-border rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-accent/50"
        />
        {['all', 'SUBMITTED', 'CONFIRMED', 'INVOICED', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-2 rounded-xl text-xs font-medium border transition-colors ${
              statusFilter === s
                ? 'bg-accent text-black border-accent'
                : 'bg-surface text-muted border-border hover:text-white'
            }`}
          >
            {s === 'all' ? 'Todos' : s}
          </button>
        ))}
      </div>

      {/* Tabela */}
      <div className="bg-surface border border-border rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-muted text-xs font-mono px-6 py-4">PEDIDO</th>
              <th className="text-left text-muted text-xs font-mono px-6 py-4">LOJA</th>
              <th className="text-left text-muted text-xs font-mono px-6 py-4">STATUS</th>
              <th className="text-left text-muted text-xs font-mono px-6 py-4">PAGAMENTO</th>
              <th className="text-left text-muted text-xs font-mono px-6 py-4">TOTAL</th>
              <th className="text-left text-muted text-xs font-mono px-6 py-4">DATA</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((order) => (
              <tr key={order.id} className="border-b border-border/50 hover:bg-white/2 transition-colors">
                <td className="px-6 py-4">
                  <span className="font-mono text-white text-sm">#{order.id.slice(-8).toUpperCase()}</span>
                  <p className="text-muted text-xs">{order.itemCount} itens</p>
                </td>
                <td className="px-6 py-4">
                  <span className="text-white text-sm">{order.storeName}</span>
                </td>
                <td className="px-6 py-4">
                  <span className={`text-sm font-medium ${STATUS_COLORS[order.status] ?? 'text-muted'}`}>
                    {order.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div>
                    <span className="text-white text-sm">{PAY_METHODS[order.paymentMethod]}</span>
                    <span className={`block text-xs ${PAY_STATUS_COLORS[order.paymentStatus] ?? 'text-muted'}`}>
                      {order.paymentStatus}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="font-mono text-accent">{formatBRL(order.total)}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-muted text-sm">{formatDate(order.createdAt)}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">📋</p>
            <p className="text-white font-medium">Nenhum pedido encontrado</p>
          </div>
        )}
      </div>
    </div>
  )
}
