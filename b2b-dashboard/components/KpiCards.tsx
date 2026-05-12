"use client";

import { KPIs } from "@/lib/types";
import { fmtBRL } from "@/lib/format";

interface Props {
  kpis: KPIs;
  totalPedidos: number;
}

function Card({
  icon,
  title,
  value,
  sub,
  accent,
}: {
  icon: string;
  title: string;
  value: string;
  sub?: string;
  accent: string;
}) {
  return (
    <div
      className="bg-white rounded-xl shadow-sm p-5 flex flex-col gap-1"
      style={{ borderLeft: `5px solid ${accent}` }}
    >
      <p className="text-xs text-gray-500 font-medium">
        {icon} {title}
      </p>
      <p className="text-2xl font-bold text-gray-900 leading-tight">{value}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

export default function KpiCards({ kpis, totalPedidos }: Props) {
  const pctRecompra =
    totalPedidos > 0 ? ((kpis.qtdRecompras / totalPedidos) * 100).toFixed(1) : "0";
  const pctNova =
    totalPedidos > 0 ? ((kpis.qtdNovasLojas / totalPedidos) * 100).toFixed(1) : "0";

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
      <Card
        icon="💰"
        title="Total Faturado"
        value={fmtBRL(kpis.totalFaturamento)}
        accent="#1E3A5F"
      />
      <Card
        icon="📦"
        title="Total de Pedidos"
        value={String(kpis.totalPedidos)}
        accent="#2E5FA3"
      />
      <Card
        icon="🎯"
        title="Ticket Médio"
        value={fmtBRL(kpis.ticketMedio)}
        accent="#2E5FA3"
      />
      <Card
        icon="🔄"
        title="Recompras"
        value={String(kpis.qtdRecompras)}
        sub={`${pctRecompra}% dos pedidos · ${fmtBRL(kpis.faturamentoRecompras)}`}
        accent="#2ECC71"
      />
      <Card
        icon="🆕"
        title="Novas Lojas"
        value={String(kpis.qtdNovasLojas)}
        sub={`${pctNova}% dos pedidos · ${fmtBRL(kpis.faturamentoNovasLojas)}`}
        accent="#2ECC71"
      />
    </div>
  );
}
