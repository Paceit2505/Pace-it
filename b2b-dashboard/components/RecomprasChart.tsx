"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  Pie,
  PieChart,
} from "recharts";
import { PedidoProcessado } from "@/lib/types";
import { fmtBRL, isoToWeek } from "@/lib/format";

interface Props {
  pedidos: PedidoProcessado[];
}

interface SemanalEntry {
  semana: string;
  Recompra: number;
  "Nova loja": number;
}

function buildSemanal(pedidos: PedidoProcessado[]): SemanalEntry[] {
  const map = new Map<string, SemanalEntry>();
  for (const p of pedidos) {
    const semana = isoToWeek(p.dataPedido);
    if (!map.has(semana)) {
      map.set(semana, { semana, Recompra: 0, "Nova loja": 0 });
    }
    map.get(semana)![p.tipo] += p.totalVenda;
  }
  return [...map.values()];
}

function buildDonut(pedidos: PedidoProcessado[]) {
  const map = new Map<string, number>();
  for (const p of pedidos) {
    map.set(p.tipo, (map.get(p.tipo) ?? 0) + p.totalVenda);
  }
  return [...map.entries()].map(([name, value]) => ({ name, value }));
}

const COLORS: Record<string, string> = {
  Recompra: "#2E5FA3",
  "Nova loja": "#2ECC71",
};

const customTooltipBRL = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow p-3 text-sm">
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {fmtBRL(p.value)}
        </p>
      ))}
    </div>
  );
};

export default function RecomprasChart({ pedidos }: Props) {
  const semanal = buildSemanal(pedidos);
  const donut = buildDonut(pedidos);
  const total = donut.reduce((s, d) => s + d.value, 0);

  return (
    <section className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-lg font-bold text-gray-800 mb-4">🔄 Recompras vs Novas Lojas</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stacked bar */}
        <div>
          <p className="text-sm text-gray-500 mb-3 font-medium">Faturamento semanal por tipo</p>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={semanal} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="semana" tick={{ fontSize: 12 }} />
              <YAxis
                tick={{ fontSize: 11 }}
                tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip content={customTooltipBRL} />
              <Legend />
              <Bar dataKey="Recompra" stackId="a" fill="#2E5FA3" />
              <Bar dataKey="Nova loja" stackId="a" fill="#2ECC71" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Donut */}
        <div>
          <p className="text-sm text-gray-500 mb-3 font-medium">Proporção por valor</p>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={donut}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={110}
                dataKey="value"
                label={({ name, value }) =>
                  `${name}: ${((value / total) * 100).toFixed(1)}%`
                }
                labelLine
              >
                {donut.map((entry) => (
                  <Cell key={entry.name} fill={COLORS[entry.name] ?? "#999"} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => fmtBRL(v)} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}
