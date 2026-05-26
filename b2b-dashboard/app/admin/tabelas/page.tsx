'use client'

import { useState } from 'react'

interface PriceTable {
  id: string
  name: string
  discount: number
  storeCount: number
  active: boolean
}

const INITIAL_TABLES: PriceTable[] = [
  { id: '1', name: 'Tabela Padrão', discount: 0, storeCount: 28, active: true },
  { id: '2', name: 'Gold', discount: 10, storeCount: 12, active: true },
  { id: '3', name: 'Platinum', discount: 18, storeCount: 4, active: true },
]

export default function TabelasPage() {
  const [tables, setTables] = useState(INITIAL_TABLES)
  const [showForm, setShowForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDiscount, setNewDiscount] = useState('')

  const handleCreate = () => {
    if (!newName || !newDiscount) return
    const table: PriceTable = {
      id: Date.now().toString(),
      name: newName,
      discount: Number(newDiscount),
      storeCount: 0,
      active: true,
    }
    setTables((prev) => [...prev, table])
    setNewName('')
    setNewDiscount('')
    setShowForm(false)
  }

  return (
    <div className="p-8">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-white">Tabelas de Preço</h2>
          <p className="text-muted mt-1">Gerencie os tiers de preço para lojistas</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2.5 bg-accent text-black text-sm font-bold rounded-xl hover:bg-accent/90 transition-colors"
        >
          + Nova Tabela
        </button>
      </div>

      {/* Formulário de criação */}
      {showForm && (
        <div className="bg-surface border border-border rounded-2xl p-6 mb-6">
          <h3 className="text-white font-bold mb-4">Nova Tabela de Preço</h3>
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="Nome da tabela"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="flex-1 bg-background border border-border rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-accent/50"
            />
            <div className="relative">
              <input
                type="number"
                placeholder="Desconto %"
                value={newDiscount}
                onChange={(e) => setNewDiscount(e.target.value)}
                min="0"
                max="100"
                className="w-36 bg-background border border-border rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-accent/50"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted text-sm">%</span>
            </div>
            <button
              onClick={handleCreate}
              className="px-6 py-2.5 bg-accent text-black text-sm font-bold rounded-xl hover:bg-accent/90 transition-colors"
            >
              CRIAR
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2.5 text-muted hover:text-white transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Tabelas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {tables.map((table) => (
          <div key={table.id} className="bg-surface border border-border rounded-2xl p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-white font-bold text-xl">{table.name}</h3>
              {table.discount > 0 && (
                <span className="bg-green-500/20 text-green-400 border border-green-500/30 text-xs px-3 py-1 rounded-full font-medium">
                  -{table.discount}%
                </span>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted text-sm">Desconto</span>
                <span className="text-white text-sm font-mono">
                  {table.discount === 0 ? 'Sem desconto' : `${table.discount}%`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted text-sm">Lojas usando</span>
                <span className="text-white text-sm font-mono">{table.storeCount}</span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-border">
              <button className="text-accent text-sm hover:text-accent/80 transition-colors">
                Editar preços →
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
