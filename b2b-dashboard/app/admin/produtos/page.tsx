'use client'

import { useState } from 'react'

interface Product {
  id: string
  sku: string
  name: string
  category: string
  stock: number
  active: boolean
  prices: { tableName: string; price: number }[]
}

const MOCK_PRODUCTS: Product[] = [
  {
    id: '1', sku: 'HG-001', name: 'Hidrogelé Pace It Neutro 40g', category: 'Hidrogéis',
    stock: 120, active: true,
    prices: [{ tableName: 'Tabela Padrão', price: 8.9 }, { tableName: 'Gold', price: 7.9 }],
  },
  {
    id: '2', sku: 'HG-002', name: 'Hidrogelé Pace It Laranja 40g', category: 'Hidrogéis',
    stock: 85, active: true,
    prices: [{ tableName: 'Tabela Padrão', price: 8.9 }, { tableName: 'Gold', price: 7.9 }],
  },
  {
    id: '3', sku: 'EL-001', name: 'Eletrólito Pace It Limão 10g', category: 'Eletrólitos',
    stock: 200, active: true,
    prices: [{ tableName: 'Tabela Padrão', price: 4.5 }, { tableName: 'Gold', price: 3.9 }],
  },
  {
    id: '4', sku: 'EL-002', name: 'Eletrólito Pace It Tropical 10g', category: 'Eletrólitos',
    stock: 8, active: true,
    prices: [{ tableName: 'Tabela Padrão', price: 4.5 }, { tableName: 'Gold', price: 3.9 }],
  },
  {
    id: '5', sku: 'PT-001', name: 'Proteína Whey Pace It Chocolate 2kg', category: 'Proteínas',
    stock: 45, active: true,
    prices: [{ tableName: 'Tabela Padrão', price: 189.9 }, { tableName: 'Gold', price: 169.9 }],
  },
  {
    id: '6', sku: 'AC-001', name: 'Cinto de Hidratação Pace It', category: 'Acessórios',
    stock: 0, active: true,
    prices: [{ tableName: 'Tabela Padrão', price: 89.9 }, { tableName: 'Gold', price: 79.9 }],
  },
  {
    id: '7', sku: 'MR-001', name: 'Camiseta Pace It Run Tech P', category: 'Merch',
    stock: 30, active: true,
    prices: [{ tableName: 'Tabela Padrão', price: 129.9 }, { tableName: 'Gold', price: 115.9 }],
  },
]

function formatBRL(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export default function ProdutosPage() {
  const [products] = useState(MOCK_PRODUCTS)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')

  const categories = ['all', ...Array.from(new Set(products.map((p) => p.category)))]

  const filtered = products.filter((p) => {
    const matchCat = category === 'all' || p.category === category
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.includes(search)
    return matchCat && matchSearch
  })

  return (
    <div className="p-8">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-white">Produtos</h2>
          <p className="text-muted mt-1">{products.length} produtos cadastrados</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <input
          type="text"
          placeholder="Buscar por nome ou SKU..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-48 bg-surface border border-border rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-accent/50"
        />
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-3 py-2 rounded-xl text-xs font-medium border transition-colors ${
              category === cat
                ? 'bg-accent text-black border-accent'
                : 'bg-surface text-muted border-border hover:text-white'
            }`}
          >
            {cat === 'all' ? 'Todos' : cat}
          </button>
        ))}
      </div>

      {/* Tabela */}
      <div className="bg-surface border border-border rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-muted text-xs font-mono px-6 py-4">SKU</th>
              <th className="text-left text-muted text-xs font-mono px-6 py-4">PRODUTO</th>
              <th className="text-left text-muted text-xs font-mono px-6 py-4">CATEGORIA</th>
              <th className="text-left text-muted text-xs font-mono px-6 py-4">ESTOQUE</th>
              <th className="text-left text-muted text-xs font-mono px-6 py-4">PREÇO PADRÃO</th>
              <th className="text-left text-muted text-xs font-mono px-6 py-4">PREÇO GOLD</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((product) => {
              const defaultPrice = product.prices.find((p) => p.tableName === 'Tabela Padrão')
              const goldPrice = product.prices.find((p) => p.tableName === 'Gold')
              const lowStock = product.stock > 0 && product.stock < 10
              const outOfStock = product.stock === 0

              return (
                <tr key={product.id} className="border-b border-border/50 hover:bg-white/2 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-mono text-muted text-sm">{product.sku}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-white text-sm">{product.name}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-muted text-sm">{product.category}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`font-mono text-sm ${
                        outOfStock ? 'text-red-400' : lowStock ? 'text-yellow-400' : 'text-green-400'
                      }`}
                    >
                      {product.stock}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-mono text-white text-sm">
                      {defaultPrice ? formatBRL(defaultPrice.price) : '—'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-mono text-accent text-sm">
                      {goldPrice ? formatBRL(goldPrice.price) : '—'}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
