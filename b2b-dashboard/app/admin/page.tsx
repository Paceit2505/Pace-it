import { Suspense } from 'react'
import Link from 'next/link'

async function getAdminStats() {
  // Em produção, busca da API backend
  // Aqui retornamos dados mock para desenvolvimento
  return {
    totalStores: 48,
    activeStores: 35,
    pendingStores: 8,
    totalOrders: 312,
    ordersThisMonth: 47,
    gmvThisMonth: 89420.5,
    avgTicket: 1902.56,
  }
}

function StatCard({
  label,
  value,
  sub,
  accent = false,
}: {
  label: string
  value: string
  sub?: string
  accent?: boolean
}) {
  return (
    <div className="bg-surface border border-border rounded-2xl p-6">
      <p className="text-muted text-xs font-mono mb-2">{label}</p>
      <p className={`text-3xl font-bold ${accent ? 'text-accent' : 'text-white'}`}>
        {value}
      </p>
      {sub && <p className="text-muted text-sm mt-1">{sub}</p>}
    </div>
  )
}

export default async function AdminPage() {
  const stats = await getAdminStats()

  const gmv = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(stats.gmvThisMonth)

  const avgTicket = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(stats.avgTicket)

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white">Dashboard</h2>
        <p className="text-muted mt-1">Visão geral da operação B2B</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="GMV DO MÊS" value={gmv} accent />
        <StatCard label="PEDIDOS MÊS" value={String(stats.ordersThisMonth)} />
        <StatCard label="TICKET MÉDIO" value={avgTicket} />
        <StatCard
          label="LOJAS ATIVAS"
          value={String(stats.activeStores)}
          sub={`${stats.pendingStores} aguardando aprovação`}
        />
      </div>

      {/* Ações rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/admin/lojas?filter=pending"
          className="bg-surface border border-accent/30 rounded-2xl p-6 hover:border-accent transition-colors"
        >
          <p className="text-accent text-2xl font-bold mb-1">{stats.pendingStores}</p>
          <p className="text-white font-medium">Lojas pendentes</p>
          <p className="text-muted text-sm mt-1">Aguardando aprovação →</p>
        </Link>
        <Link
          href="/admin/pedidos"
          className="bg-surface border border-border rounded-2xl p-6 hover:border-white/20 transition-colors"
        >
          <p className="text-white text-2xl font-bold mb-1">{stats.totalOrders}</p>
          <p className="text-white font-medium">Total de pedidos</p>
          <p className="text-muted text-sm mt-1">Ver todos →</p>
        </Link>
        <Link
          href="/admin/sync"
          className="bg-surface border border-border rounded-2xl p-6 hover:border-white/20 transition-colors"
        >
          <p className="text-white text-2xl font-bold mb-1">🔄</p>
          <p className="text-white font-medium">Sync Bling</p>
          <p className="text-muted text-sm mt-1">Sincronizar produtos e estoque →</p>
        </Link>
      </div>
    </div>
  )
}
