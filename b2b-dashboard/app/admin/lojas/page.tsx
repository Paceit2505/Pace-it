'use client'

import { useState } from 'react'

// Tipos
interface Store {
  id: string
  cnpj: string
  razaoSocial: string
  nomeFantasia: string
  email: string
  phone: string
  status: 'ACTIVE' | 'PENDING' | 'BLOCKED'
  priceTable: { name: string }
  createdAt: string
}

// Mock data — em produção vem da API
const MOCK_STORES: Store[] = [
  {
    id: '1',
    cnpj: '12345678000195',
    razaoSocial: 'Loja Esporte Ltda',
    nomeFantasia: 'Run Store SP',
    email: 'contato@runstore.com.br',
    phone: '11999991111',
    status: 'ACTIVE',
    priceTable: { name: 'Gold' },
    createdAt: '2025-01-15T10:00:00Z',
  },
  {
    id: '2',
    cnpj: '98765432000100',
    razaoSocial: 'Fitness World Comercio Ltda',
    nomeFantasia: 'Fitness World',
    email: 'compras@fitnessworld.com.br',
    phone: '21999992222',
    status: 'PENDING',
    priceTable: { name: 'Tabela Padrão' },
    createdAt: '2025-05-18T14:30:00Z',
  },
  {
    id: '3',
    cnpj: '11122233000144',
    razaoSocial: 'Endurance Suplementos ME',
    nomeFantasia: 'Endurance Shop',
    email: 'pedidos@enduranceshop.com.br',
    phone: '31999993333',
    status: 'PENDING',
    priceTable: { name: 'Tabela Padrão' },
    createdAt: '2025-05-19T09:00:00Z',
  },
  {
    id: '4',
    cnpj: '55566677000188',
    razaoSocial: 'Tri Sports Comercio Ltda',
    nomeFantasia: 'Tri Sports',
    email: 'adm@trisports.com.br',
    phone: '41999994444',
    status: 'BLOCKED',
    priceTable: { name: 'Tabela Padrão' },
    createdAt: '2024-11-01T00:00:00Z',
  },
]

const STATUS_STYLES = {
  ACTIVE: 'bg-green-500/20 text-green-400 border border-green-500/30',
  PENDING: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
  BLOCKED: 'bg-red-500/20 text-red-400 border border-red-500/30',
}

const STATUS_LABELS = {
  ACTIVE: 'Ativa',
  PENDING: 'Pendente',
  BLOCKED: 'Bloqueada',
}

function formatCNPJ(cnpj: string) {
  const d = cnpj.replace(/\D/g, '')
  return d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
}

export default function LojasPage() {
  const [stores, setStores] = useState(MOCK_STORES)
  const [filter, setFilter] = useState<'all' | 'ACTIVE' | 'PENDING' | 'BLOCKED'>('all')
  const [search, setSearch] = useState('')
  const [approving, setApproving] = useState<string | null>(null)

  const handleApprove = async (storeId: string) => {
    setApproving(storeId)
    // Em produção: await fetch(`/api/admin/stores/${storeId}/approve`, { method: 'PUT' })
    await new Promise((r) => setTimeout(r, 800))
    setStores((prev) =>
      prev.map((s) => (s.id === storeId ? { ...s, status: 'ACTIVE' as const } : s))
    )
    setApproving(null)
  }

  const handleBlock = async (storeId: string) => {
    setStores((prev) =>
      prev.map((s) => (s.id === storeId ? { ...s, status: 'BLOCKED' as const } : s))
    )
  }

  const filtered = stores.filter((s) => {
    const matchFilter = filter === 'all' || s.status === filter
    const matchSearch =
      !search ||
      s.nomeFantasia.toLowerCase().includes(search.toLowerCase()) ||
      s.cnpj.includes(search.replace(/\D/g, ''))
    return matchFilter && matchSearch
  })

  const pendingCount = stores.filter((s) => s.status === 'PENDING').length

  return (
    <div className="p-8">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-white">Lojas</h2>
          <p className="text-muted mt-1">
            {stores.length} lojas cadastradas ·{' '}
            {pendingCount > 0 && (
              <span className="text-yellow-400">{pendingCount} aguardando aprovação</span>
            )}
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 mb-6">
        <input
          type="text"
          placeholder="Buscar por nome ou CNPJ..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-surface border border-border rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-accent/50"
        />
        {(['all', 'ACTIVE', 'PENDING', 'BLOCKED'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
              filter === f
                ? 'bg-accent text-black border-accent'
                : 'bg-surface text-muted border-border hover:text-white'
            }`}
          >
            {f === 'all' ? 'Todas' : STATUS_LABELS[f]}
          </button>
        ))}
      </div>

      {/* Tabela */}
      <div className="bg-surface border border-border rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-muted text-xs font-mono px-6 py-4">LOJA</th>
              <th className="text-left text-muted text-xs font-mono px-6 py-4">CNPJ</th>
              <th className="text-left text-muted text-xs font-mono px-6 py-4">TABELA</th>
              <th className="text-left text-muted text-xs font-mono px-6 py-4">STATUS</th>
              <th className="text-left text-muted text-xs font-mono px-6 py-4">AÇÕES</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((store) => (
              <tr key={store.id} className="border-b border-border/50 hover:bg-white/2 transition-colors">
                <td className="px-6 py-4">
                  <p className="text-white font-medium">{store.nomeFantasia}</p>
                  <p className="text-muted text-xs">{store.email}</p>
                </td>
                <td className="px-6 py-4">
                  <span className="font-mono text-white text-sm">{formatCNPJ(store.cnpj)}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-muted text-sm">{store.priceTable.name}</span>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`text-xs px-3 py-1 rounded-full font-medium ${STATUS_STYLES[store.status]}`}
                  >
                    {STATUS_LABELS[store.status]}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    {store.status === 'PENDING' && (
                      <button
                        onClick={() => handleApprove(store.id)}
                        disabled={approving === store.id}
                        className="px-3 py-1.5 bg-accent text-black text-xs font-bold rounded-lg hover:bg-accent/90 disabled:opacity-50 transition-colors"
                      >
                        {approving === store.id ? '...' : 'APROVAR'}
                      </button>
                    )}
                    {store.status === 'ACTIVE' && (
                      <button
                        onClick={() => handleBlock(store.id)}
                        className="px-3 py-1.5 bg-red-500/20 text-red-400 text-xs font-bold rounded-lg border border-red-500/30 hover:bg-red-500/30 transition-colors"
                      >
                        BLOQUEAR
                      </button>
                    )}
                    {store.status === 'BLOCKED' && (
                      <button
                        onClick={() => handleApprove(store.id)}
                        className="px-3 py-1.5 bg-green-500/20 text-green-400 text-xs font-bold rounded-lg border border-green-500/30 hover:bg-green-500/30 transition-colors"
                      >
                        REATIVAR
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">🏪</p>
            <p className="text-white font-medium">Nenhuma loja encontrada</p>
            <p className="text-muted text-sm">Tente outro filtro</p>
          </div>
        )}
      </div>
    </div>
  )
}
