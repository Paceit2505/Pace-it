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
import { PedidoProcessado, ItemPedido } from "@/lib/types";
import { fmtBRL, isoToDisplay } from "@/lib/format";

interface Props {
  pedidos: PedidoProcessado[];
}

interface GelItem extends ItemPedido {
  data: string;
  cliente: string;
}

function buildGelItems(pedidos: PedidoProcessado[]): GelItem[] {
  const items: GelItem[] = [];
  for (const p of pedidos) {
    for (const item of p.itens) {
      if (item.descricao.toLowerCase().includes("gel")) {
        items.push({ ...item, data: p.dataPedido.slice(0, 10), cliente: p.cliente });
      }
    }
  }
  return items;
}

function buildPivot(items: GelItem[]) {
  const produtos = [...new Set(items.map((i) => i.descricao))].sort();
  const datas = [...new Set(items.map((i) => i.data))].sort();

  const map = new Map<string, Map<string, number>>();
  for (const item of items) {
    if (!map.has(item.data)) map.set(item.data, new Map());
    const row = map.get(item.data)!;
    row.set(item.descricao, (row.get(item.descricao) ?? 0) + item.quantidade);
  }

  return {
    produtos,
    rows: datas.map((d) => {
      const row: Record<string, string | number> = { Data: isoToDisplay(d) };
      for (const p of produtos) row[p] = map.get(d)?.get(p) ?? 0;
      return row;
    }),
  };
}

function buildBarData(items: GelItem[]) {
  const map = new Map<string, number>();
  for (const i of items) map.set(i.descricao, (map.get(i.descricao) ?? 0) + i.quantidade);
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value }));
}

export default function GelSection({ pedidos }: Props) {
  const items = buildGelItems(pedidos);

  return (
    <section className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-lg font-bold text-gray-800 mb-4">🧴 Géis: Saída Diária + Resultado Semanal</h2>

      {items.length === 0 ? (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-blue-700 text-sm">
          Nenhum produto de gel encontrado no período selecionado.
        </div>
      ) : (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {(() => {
              const totalUnidades = items.reduce((s, i) => s + i.quantidade, 0);
              const totalFat = items.reduce((s, i) => s + i.valorTotal, 0);

              const byQtd = new Map<string, number>();
              const byFat = new Map<string, number>();
              for (const i of items) {
                byQtd.set(i.descricao, (byQtd.get(i.descricao) ?? 0) + i.quantidade);
                byFat.set(i.descricao, (byFat.get(i.descricao) ?? 0) + i.valorTotal);
              }
              const maisVendido = [...byQtd.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "-";
              const maisFaturado = [...byFat.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "-";

              const cards = [
                { icon: "📦", label: "Total unidades", value: String(totalUnidades), accent: "#1E3A5F" },
                { icon: "💰", label: "Total faturado (géis)", value: fmtBRL(totalFat), accent: "#2E5FA3" },
                { icon: "🏆", label: "Mais vendido (un.)", value: maisVendido, accent: "#2ECC71" },
                { icon: "💎", label: "Mais faturado (R$)", value: maisFaturado, accent: "#2ECC71" },
              ];

              return cards.map((c) => (
                <div
                  key={c.label}
                  className="bg-white rounded-xl shadow-sm p-4 flex flex-col gap-1"
                  style={{ borderLeft: `4px solid ${c.accent}` }}
                >
                  <p className="text-xs text-gray-500">{c.icon} {c.label}</p>
                  <p className="font-bold text-gray-800 text-sm leading-snug">{c.value}</p>
                </div>
              ));
            })()}
          </div>

          {/* Pivot table */}
          {(() => {
            const { produtos, rows } = buildPivot(items);
            return (
              <div className="mb-6">
                <p className="text-sm font-medium text-gray-600 mb-2">Quantidade vendida por dia</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 text-left text-gray-500">
                        <th className="pb-2 pr-4">Data</th>
                        {produtos.map((p) => (
                          <th key={p} className="pb-2 pr-4 text-right">{p}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row) => (
                        <tr key={String(row.Data)} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-1.5 pr-4 font-medium text-gray-700">{row.Data}</td>
                          {produtos.map((p) => (
                            <td key={p} className="py-1.5 pr-4 text-right text-gray-600">
                              {row[p] || "—"}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}

          {/* Bar chart */}
          <p className="text-sm font-medium text-gray-600 mb-2">Quantidade total por produto gel</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={buildBarData(items)} margin={{ top: 4, right: 8, bottom: 60, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11 }}
                angle={-30}
                textAnchor="end"
                interval={0}
              />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => `${v} un.`} />
              <Bar dataKey="value" fill="#2ECC71" radius={[4, 4, 0, 0]} name="Unidades" />
            </BarChart>
          </ResponsiveContainer>
        </>
      )}
    </section>
  );
}
