'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: '📊' },
  { href: '/admin/lojas', label: 'Lojas', icon: '🏪' },
  { href: '/admin/pedidos', label: 'Pedidos', icon: '📋' },
  { href: '/admin/tabelas', label: 'Tabelas de Preço', icon: '💰' },
  { href: '/admin/produtos', label: 'Produtos', icon: '📦' },
  { href: '/admin/sync', label: 'Sync Bling', icon: '🔄' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="flex h-screen bg-background text-white">
      {/* Sidebar */}
      <aside className="w-64 bg-surface border-r border-border flex flex-col">
        <div className="p-6 border-b border-border">
          <p className="text-xs text-muted font-mono">PAINEL ADMIN</p>
          <h1 className="text-2xl font-bold text-accent tracking-tight mt-1">PACE IT</h1>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  active
                    ? 'bg-accent text-black'
                    : 'text-muted hover:text-white hover:bg-white/5'
                }`}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <p className="text-xs text-muted text-center">Pace It B2B Hub Admin</p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
