"use client";

import { useState, useCallback } from "react";
import { DashboardData } from "@/lib/types";
import KpiCards from "./KpiCards";
import RankingTable from "./RankingTable";
import RecomprasChart from "./RecomprasChart";
import EvolucaoChart from "./EvolucaoChart";
import MixProdutos from "./MixProdutos";
import GelSection from "./GelSection";

function getMonday(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().slice(0, 10);
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function Dashboard() {
  const [dataInicio, setDataInicio] = useState(getMonday());
  const [dataFim, setDataFim] = useState(today());
  const [vendedor, setVendedor] = useState("Todos");
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tokenAlert, setTokenAlert] = useState<{ access: string; refresh: string } | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);

  const buscar = useCallback(async () => {
    setLoading(true);
    setError(null);
    setTokenAlert(null);
    try {
      const res = await fetch(
        `/api/pedidos?dataInicio=${dataInicio}&dataFim=${dataFim}`
      );
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Erro ao buscar dados.");
        return;
      }
      setData(json as DashboardData);
      setVendedor("Todos");
      setLastUpdate(new Date().toLocaleString("pt-BR"));
      if (json.tokenRenovado) {
        setTokenAlert({
          access: json.novoAccessToken,
          refresh: json.novoRefreshToken,
        });
      }
    } catch (e) {
      setError("Erro de conexão com a API.");
    } finally {
      setLoading(false);
    }
  }, [dataInicio, dataFim]);

  const pedidosFiltrados =
    data && vendedor !== "Todos"
      ? data.pedidos.filter((p) => p.vendedor === vendedor)
      : data?.pedidos ?? [];

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      {/* Sidebar */}
      <aside className="fixed top-0 left-0 h-full w-64 bg-[#1E3A5F] text-white flex flex-col p-5 z-10 overflow-y-auto">
        <div className="mb-6">
          <h1 className="text-xl font-bold">📦 Dashboard B2B</h1>
          <p className="text-xs text-blue-300 mt-1">Bling v3</p>
        </div>

        <div className="flex flex-col gap-4 flex-1">
          <div>
            <label className="text-xs text-blue-300 font-medium block mb-1">Data início</label>
            <input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="w-full rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-blue-300 font-medium block mb-1">Data fim</label>
            <input
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              className="w-full rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none"
            />
          </div>

          <button
            onClick={buscar}
            disabled={loading}
            className="w-full bg-[#2ECC71] hover:bg-green-400 disabled:bg-gray-500 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors"
          >
            {loading ? "Buscando…" : "🔄 Atualizar dados"}
          </button>

          {data && (
            <div>
              <label className="text-xs text-blue-300 font-medium block mb-1">Vendedor</label>
              <select
                value={vendedor}
                onChange={(e) => setVendedor(e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none"
              >
                <option value="Todos">Todos</option>
                {data.vendedores.map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {lastUpdate && (
          <p className="text-xs text-blue-300 mt-4">
            Atualizado: {lastUpdate}
          </p>
        )}
      </aside>

      {/* Main */}
      <main className="ml-64 p-6 flex flex-col gap-6">
        {/* Token alert */}
        {tokenAlert && (
          <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 text-sm text-amber-800">
            <p className="font-semibold mb-1">⚠️ Token renovado automaticamente</p>
            <p className="mb-2 text-xs">
              Atualize as variáveis de ambiente no Vercel para evitar reautenticação:
            </p>
            <div className="font-mono text-xs bg-amber-100 rounded p-2 break-all">
              <p>BLING_ACCESS_TOKEN={tokenAlert.access}</p>
              <p>BLING_REFRESH_TOKEN={tokenAlert.refresh}</p>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
            <span className="font-semibold">Erro: </span>{error}
          </div>
        )}

        {/* Empty state */}
        {!data && !loading && !error && (
          <div className="flex flex-col items-center justify-center h-96 text-gray-400">
            <p className="text-5xl mb-4">📦</p>
            <p className="text-lg font-medium">Selecione o período e clique em Atualizar dados</p>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center h-96 text-gray-400">
            <div className="w-10 h-10 border-4 border-[#2E5FA3] border-t-transparent rounded-full animate-spin mb-4" />
            <p>Buscando pedidos no Bling…</p>
          </div>
        )}

        {/* Dashboard sections */}
        {data && !loading && pedidosFiltrados.length === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-yellow-700 text-sm">
            Nenhum pedido B2B encontrado para o período e filtros selecionados.
          </div>
        )}

        {data && !loading && pedidosFiltrados.length > 0 && (() => {
          const kpis = {
            ...data.kpis,
            totalFaturamento: pedidosFiltrados.reduce((s, p) => s + p.totalVenda, 0),
            totalPedidos: pedidosFiltrados.length,
            ticketMedio:
              pedidosFiltrados.reduce((s, p) => s + p.totalVenda, 0) /
              pedidosFiltrados.length,
            qtdRecompras: pedidosFiltrados.filter((p) => p.tipo === "Recompra").length,
            qtdNovasLojas: pedidosFiltrados.filter((p) => p.tipo === "Nova loja").length,
            faturamentoRecompras: pedidosFiltrados
              .filter((p) => p.tipo === "Recompra")
              .reduce((s, p) => s + p.totalVenda, 0),
            faturamentoNovasLojas: pedidosFiltrados
              .filter((p) => p.tipo === "Nova loja")
              .reduce((s, p) => s + p.totalVenda, 0),
          };

          return (
            <>
              <KpiCards kpis={kpis} totalPedidos={kpis.totalPedidos} />
              <RankingTable
                pedidos={pedidosFiltrados}
                topVendedor={kpis.topVendedor}
                topLojista={kpis.topLojista}
              />
              <RecomprasChart pedidos={pedidosFiltrados} />
              <EvolucaoChart pedidos={pedidosFiltrados} />
              <MixProdutos pedidos={pedidosFiltrados} />
              <GelSection pedidos={pedidosFiltrados} />
            </>
          );
        })()}
      </main>
    </div>
  );
}
