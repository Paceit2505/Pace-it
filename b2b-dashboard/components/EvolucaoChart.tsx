"use client";

import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { PedidoProcessado } from "@/lib/types";
import { fmtBRL, isoToDisplay, isoToWeek } from "@/lib/format";

interface Props {
  pedidos: PedidoProcessado[];
}

interface Entry {
  periodo: string;
  faturamento: number;
  pedidos: number;
}

function agrupar(pedidos: PedidoProcessado[], modo: "dia" | "semana"): Entry[] {
  const map = new Map<string, Entry>();
  for (const p of pedidos) {
    const key = modo === "dia" ? p.dataPedido.slice(0, 10) : "sem " + isoToWeek(p.dataPedido);
    if (!map.has(key)) {
      map.set(key, {
        periodo: modo === "dia" ? isoToDisplay(p.dataPedido) : "Sem " + isoToWeek(p.dataPedido),
        faturamento: 0,
        pedidos: 0,
      });
    }
    const e = map.get(key)!;
    e.faturamento += p.totalVenda;
    e.pedidos += 1;
  }
  return [...map.values()];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow p-3 text-sm">
      <p className="font-semibold mb-1">{label}</p>
      <p className="text-[#1E3A5F]">Faturamento: {fmtBRL(payload[0]?.value ?? 0)}</p>
      <p className="text-gray-500">Pedidos: {payload[0]?.payload?.pedidos ?? 0}</p>
    </div>
  );
};

export default function EvolucaoChart({ pedidos }: Props) {
  const [modo, setModo] = useState<"dia" | "semana">("dia");
  const dados = agrupar(pedidos, modo);
  const media = dados.length ? dados.reduce((s, d) => s + d.faturamento, 0) / dados.length : 0;

  return (
    <section className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-800">📈 Evolução por Período</h2>
        <div className="flex gap-2">
          {(["dia", "semana"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setModo(m)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                modo === m
                  ? "bg-[#1E3A5F] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Por {m}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={dados} margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="periodo" tick={{ fontSize: 11 }} />
          <YAxis
            tick={{ fontSize: 11 }}
            tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine
            y={media}
            stroke="#E74C3C"
            strokeDasharray="6 3"
            label={{
              value: `Média ${fmtBRL(media)}`,
              position: "insideTopRight",
              fontSize: 11,
              fill: "#E74C3C",
            }}
          />
          <Line
            type="monotone"
            dataKey="faturamento"
            stroke="#1E3A5F"
            strokeWidth={2.5}
            dot={{ r: 4, fill: "#1E3A5F" }}
            activeDot={{ r: 6 }}
            name="Faturamento"
          />
          <Legend />
        </LineChart>
      </ResponsiveContainer>
    </section>
  );
}
