"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { PedidoProcessado } from "@/lib/types";
import { fmtBRL } from "@/lib/format";

interface Props {
  pedidos: PedidoProcessado[];
}

function buildTopValor(pedidos: PedidoProcessado[], n = 10) {
  const map = new Map<string, number>();
  for (const p of pedidos) {
    for (const item of p.itens) {
      map.set(item.descricao, (map.get(item.descricao) ?? 0) + item.valorTotal);
    }
  }
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([name, value]) => ({ name, value }))
    .reverse();
}

function buildTopQtd(pedidos: PedidoProcessado[], n = 10) {
  const map = new Map<string, number>();
  for (const p of pedidos) {
    for (const item of p.itens) {
      map.set(item.descricao, (map.get(item.descricao) ?? 0) + item.quantidade);
    }
  }
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([name, value]) => ({ name, value }))
    .reverse();
}

function truncate(str: string, max = 32): string {
  return str.length > max ? str.slice(0, max) + "…" : str;
}

export default function MixProdutos({ pedidos }: Props) {
  const topValor = buildTopValor(pedidos);
  const topQtd = buildTopQtd(pedidos);

  if (topValor.length === 0) {
    return (
      <section className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-2">📊 Mix de Produtos</h2>
        <p className="text-gray-400 text-sm">Nenhum item de produto encontrado.</p>
      </section>
    );
  }

  return (
    <section className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-lg font-bold text-gray-800 mb-4">📊 Mix de Produtos</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <p className="text-sm text-gray-500 mb-3 font-medium">Top 10 por Valor (R$)</p>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart
              data={topValor}
              layout="vertical"
              margin={{ top: 4, right: 16, bottom: 4, left: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
              <YAxis
                type="category"
                dataKey="name"
                width={130}
                tick={{ fontSize: 10 }}
                tickFormatter={(v) => truncate(v, 22)}
              />
              <Tooltip formatter={(v: number) => fmtBRL(v)} />
              <Bar dataKey="value" fill="#1E3A5F" radius={[0, 4, 4, 0]} name="Valor" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div>
          <p className="text-sm text-gray-500 mb-3 font-medium">Top 10 por Quantidade</p>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart
              data={topQtd}
              layout="vertical"
              margin={{ top: 4, right: 16, bottom: 4, left: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis
                type="category"
                dataKey="name"
                width={130}
                tick={{ fontSize: 10 }}
                tickFormatter={(v) => truncate(v, 22)}
              />
              <Tooltip formatter={(v: number) => `${v} un.`} />
              <Bar dataKey="value" fill="#2E5FA3" radius={[0, 4, 4, 0]} name="Qtd" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}
