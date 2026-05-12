"use client";

import { PedidoProcessado } from "@/lib/types";
import { fmtBRL } from "@/lib/format";

interface RowData {
  pos: number;
  cliente: string;
  cnpj: string;
  cidadeUf: string;
  vendedor: string;
  totalVenda: number;
  tipo: "Nova loja" | "Recompra";
}

interface Props {
  pedidos: PedidoProcessado[];
  topVendedor: string;
  topLojista: string;
}

function buildRanking(pedidos: PedidoProcessado[]): RowData[] {
  const map = new Map<
    string,
    { cliente: string; cnpj: string; cidadeUf: string; vendedor: string; total: number; tipo: "Nova loja" | "Recompra" }
  >();

  for (const p of pedidos) {
    const existing = map.get(p.cnpj);
    if (existing) {
      existing.total += p.totalVenda;
    } else {
      map.set(p.cnpj, {
        cliente: p.cliente,
        cnpj: p.cnpj,
        cidadeUf: `${p.cidade}/${p.uf}`,
        vendedor: p.vendedor,
        total: p.totalVenda,
        tipo: p.tipo,
      });
    }
  }

  return [...map.values()]
    .sort((a, b) => b.total - a.total)
    .map((r, i) => ({
      pos: i + 1,
      cliente: r.cliente,
      cnpj: r.cnpj,
      cidadeUf: r.cidadeUf,
      vendedor: r.vendedor,
      totalVenda: r.total,
      tipo: r.tipo,
    }));
}

export default function RankingTable({ pedidos, topVendedor, topLojista }: Props) {
  const rows = buildRanking(pedidos);

  return (
    <section className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-lg font-bold text-gray-800 mb-4">🏆 Ranking de Lojistas</h2>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-gray-500">
              <th className="pb-2 pr-3">#</th>
              <th className="pb-2 pr-3">Cliente</th>
              <th className="pb-2 pr-3">CNPJ</th>
              <th className="pb-2 pr-3">Cidade/UF</th>
              <th className="pb-2 pr-3">Vendedor</th>
              <th className="pb-2 pr-3 text-right">Total Venda</th>
              <th className="pb-2">Tipo</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.cnpj} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-2 pr-3 font-medium text-gray-400">{r.pos}</td>
                <td className="py-2 pr-3 font-medium text-gray-800">{r.cliente}</td>
                <td className="py-2 pr-3 text-gray-500 font-mono text-xs">{r.cnpj}</td>
                <td className="py-2 pr-3 text-gray-600">{r.cidadeUf}</td>
                <td className="py-2 pr-3 text-gray-600">{r.vendedor}</td>
                <td className="py-2 pr-3 text-right font-semibold text-gray-800">
                  {fmtBRL(r.totalVenda)}
                </td>
                <td className="py-2">
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                      r.tipo === "Nova loja"
                        ? "bg-green-100 text-green-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {r.tipo}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
          <p className="text-xs text-blue-500 mb-1">🥇 Top Vendedor</p>
          <p className="font-semibold text-blue-900">{topVendedor}</p>
        </div>
        <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
          <p className="text-xs text-blue-500 mb-1">🏅 Top Lojista</p>
          <p className="font-semibold text-blue-900">{topLojista}</p>
        </div>
      </div>
    </section>
  );
}
