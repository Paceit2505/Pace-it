'use client'

import { useState } from 'react'

interface SyncLog {
  id: string
  type: 'products' | 'stock' | 'all'
  status: 'success' | 'error' | 'running'
  result?: string
  startedAt: string
  duration?: number
}

const INITIAL_LOGS: SyncLog[] = [
  { id: '1', type: 'stock', status: 'success', result: '42 itens atualizados', startedAt: '2025-05-20T09:45:00Z', duration: 3200 },
  { id: '2', type: 'stock', status: 'success', result: '42 itens atualizados', startedAt: '2025-05-20T09:30:00Z', duration: 2900 },
  { id: '3', type: 'all', status: 'success', result: 'Produtos: 7 sync | Estoque: 42 atualizados', startedAt: '2025-05-20T09:00:00Z', duration: 8100 },
  { id: '4', type: 'stock', status: 'error', result: 'Timeout ao conectar com Bling API', startedAt: '2025-05-20T08:45:00Z', duration: 30000 },
]

const TYPE_LABELS = {
  products: 'Produtos',
  stock: 'Estoque',
  all: 'Produtos + Estoque',
}

const STATUS_STYLES = {
  success: 'text-green-400',
  error: 'text-red-400',
  running: 'text-yellow-400',
}

export default function SyncPage() {
  const [logs, setLogs] = useState(INITIAL_LOGS)
  const [syncing, setSyncing] = useState<string | null>(null)

  const handleSync = async (type: 'products' | 'stock' | 'all') => {
    setSyncing(type)
    const newLog: SyncLog = {
      id: Date.now().toString(),
      type,
      status: 'running',
      startedAt: new Date().toISOString(),
    }
    setLogs((prev) => [newLog, ...prev])

    const start = Date.now()

    try {
      // Em produção: await fetch('/api/admin/sync/bling', { method: 'POST', body: JSON.stringify({ type }) })
      await new Promise((r) => setTimeout(r, 2000 + Math.random() * 2000))

      const duration = Date.now() - start
      setLogs((prev) =>
        prev.map((l) =>
          l.id === newLog.id
            ? {
                ...l,
                status: 'success' as const,
                result:
                  type === 'stock'
                    ? '42 itens de estoque atualizados'
                    : type === 'products'
                    ? '7 produtos sincronizados'
                    : 'Produtos: 7 sync | Estoque: 42 atualizados',
                duration,
              }
            : l
        )
      )
    } catch {
      setLogs((prev) =>
        prev.map((l) =>
          l.id === newLog.id ? { ...l, status: 'error' as const, result: 'Erro na sincronização' } : l
        )
      )
    } finally {
      setSyncing(null)
    }
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleString('pt-BR')
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white">Sync Bling ERP</h2>
        <p className="text-muted mt-1">
          Sincronização automática a cada 15min (estoque) e 1h (produtos)
        </p>
      </div>

      {/* Ações */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {(['stock', 'products', 'all'] as const).map((type) => (
          <button
            key={type}
            onClick={() => handleSync(type)}
            disabled={!!syncing}
            className="bg-surface border border-border rounded-2xl p-6 text-left hover:border-accent/40 transition-colors disabled:opacity-50"
          >
            <p className="text-2xl mb-3">
              {type === 'stock' ? '📊' : type === 'products' ? '📦' : '🔄'}
            </p>
            <p className="text-white font-bold">Sync {TYPE_LABELS[type]}</p>
            <p className="text-muted text-sm mt-1">
              {type === 'stock'
                ? 'Atualiza saldos de estoque'
                : type === 'products'
                ? 'Atualiza catálogo de produtos'
                : 'Sincronização completa'}
            </p>
            {syncing === type && (
              <p className="text-yellow-400 text-sm mt-3 animate-pulse">Sincronizando...</p>
            )}
          </button>
        ))}
      </div>

      {/* Histórico */}
      <h3 className="text-white font-bold text-xl mb-4">Histórico de Sincronizações</h3>
      <div className="bg-surface border border-border rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-muted text-xs font-mono px-6 py-4">TIPO</th>
              <th className="text-left text-muted text-xs font-mono px-6 py-4">STATUS</th>
              <th className="text-left text-muted text-xs font-mono px-6 py-4">RESULTADO</th>
              <th className="text-left text-muted text-xs font-mono px-6 py-4">INICIADO EM</th>
              <th className="text-left text-muted text-xs font-mono px-6 py-4">DURAÇÃO</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-b border-border/50">
                <td className="px-6 py-4">
                  <span className="text-white text-sm">{TYPE_LABELS[log.type]}</span>
                </td>
                <td className="px-6 py-4">
                  <span className={`text-sm font-medium ${STATUS_STYLES[log.status]}`}>
                    {log.status === 'running' ? '⟳ Executando' : log.status === 'success' ? '✓ Sucesso' : '✗ Erro'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-muted text-sm">{log.result ?? '—'}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-muted text-sm">{formatDate(log.startedAt)}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="font-mono text-muted text-sm">
                    {log.duration != null ? `${(log.duration / 1000).toFixed(1)}s` : '—'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
