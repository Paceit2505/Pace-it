"use client";

import { useEffect, useState } from "react";
import {
  getTreinos,
  getSono,
  getMedidas,
  getBioimpedancias,
} from "@/lib/db";
import { Treino, Sono, Medidas, Bioimpedancia } from "@/lib/types";
import { fmtDate, fmtDateShort, imcCategoria, treinoTipoLabel } from "@/lib/utils";
import StatCard from "@/components/StatCard";
import Card from "@/components/Card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";

export default function Dashboard() {
  const [treinos, setTreinos] = useState<Treino[]>([]);
  const [sono, setSono] = useState<Sono[]>([]);
  const [medidas, setMedidas] = useState<Medidas[]>([]);
  const [bios, setBios] = useState<Bioimpedancia[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getTreinos(), getSono(), getMedidas(), getBioimpedancias()])
      .then(([t, s, m, b]) => {
        setTreinos(t);
        setSono(s);
        setMedidas(m);
        setBios(b);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <p>Carregando...</p>
      </div>
    );
  }

  const ultimaMedida = medidas[0];
  const ultimoBio = bios[0];
  const ultimoSono = sono[0];

  const treinosMes = treinos.filter((t) => {
    const d = new Date(t.data + "T00:00:00");
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const pesoData = [...medidas]
    .sort((a, b) => a.data.localeCompare(b.data))
    .slice(-12)
    .map((m) => ({ data: fmtDateShort(m.data), peso: m.peso }));

  const sonoData = [...sono]
    .sort((a, b) => a.data.localeCompare(b.data))
    .slice(-14)
    .map((s) => ({ data: fmtDateShort(s.data), horas: s.duracaoHoras }));

  const treinosPorTipo = treinos.reduce<Record<string, number>>((acc, t) => {
    acc[t.tipo] = (acc[t.tipo] ?? 0) + 1;
    return acc;
  }, {});
  const treinosChartData = Object.entries(treinosPorTipo).map(([tipo, qtd]) => ({
    tipo: treinoTipoLabel(tipo),
    qtd,
  }));

  const gorduraData = [...bios]
    .sort((a, b) => a.data.localeCompare(b.data))
    .slice(-8)
    .map((b) => ({
      data: fmtDateShort(b.data),
      gordura: b.gorduraCorporal,
      muscular: b.massaMuscular,
    }));

  const imc = ultimaMedida?.imc;
  const imcInfo = imc ? imcCategoria(imc) : null;
  const empty = !treinos.length && !sono.length && !medidas.length;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard de Saúde</h1>
        <p className="text-sm text-gray-500">Visão geral do seu acompanhamento</p>
      </div>

      {empty && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center mb-6">
          <p className="text-4xl mb-3">👋</p>
          <h2 className="text-lg font-semibold text-green-800">Bem-vindo ao Pace-it Health!</h2>
          <p className="text-sm text-green-600 mt-1">
            Use o menu lateral para registrar seus dados de treino, sono, exames e muito mais.
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon="⚖️"
          label="Peso Atual"
          value={ultimaMedida?.peso ?? "—"}
          unit={ultimaMedida ? "kg" : ""}
          sub={ultimaMedida ? fmtDate(ultimaMedida.data) : "Nenhum registro"}
        />
        <StatCard
          icon="💪"
          label="Treinos no Mês"
          value={treinosMes.length}
          sub={`${treinos.length} no total`}
          color="text-blue-600"
        />
        <StatCard
          icon="😴"
          label="Último Sono"
          value={ultimoSono?.duracaoHoras ?? "—"}
          unit={ultimoSono ? "h" : ""}
          sub={ultimoSono ? `Qualidade ${ultimoSono.qualidade}/5` : "Nenhum registro"}
          color="text-purple-600"
        />
        <StatCard
          icon="🫀"
          label="% Gordura Corporal"
          value={ultimoBio?.gorduraCorporal ?? "—"}
          unit={ultimoBio ? "%" : ""}
          sub={ultimoBio ? fmtDate(ultimoBio.data) : "Nenhum registro"}
          color="text-orange-600"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-4">
        <Card className="flex flex-col gap-3">
          <h2 className="font-semibold text-gray-700">IMC</h2>
          {ultimaMedida && imc ? (
            <>
              <p className="text-4xl font-bold text-gray-800">{imc}</p>
              <span className={`text-sm font-medium ${imcInfo?.color}`}>{imcInfo?.label}</span>
              <div className="text-xs text-gray-400 space-y-0.5 mt-1">
                <p>Altura: {ultimaMedida.altura} cm</p>
                <p>Peso: {ultimaMedida.peso} kg</p>
              </div>
              <div className="mt-2">
                <div className="h-2 bg-gradient-to-r from-blue-400 via-green-400 via-yellow-400 to-red-500 rounded-full relative">
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white border-2 border-gray-700 rounded-full"
                    style={{ left: `${Math.min(Math.max(((imc - 15) / 25) * 100, 0), 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>15</span><span>18.5</span><span>25</span><span>30</span><span>40</span>
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-400">Registre suas medidas para calcular o IMC.</p>
          )}
        </Card>

        <Card className="col-span-2">
          <h2 className="font-semibold text-gray-700 mb-3">Evolução do Peso (kg)</h2>
          {pesoData.length > 0 ? (
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={pesoData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="data" tick={{ fontSize: 11 }} />
                <YAxis domain={["auto", "auto"]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="peso" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-gray-400">Nenhum dado de peso registrado.</p>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card className="col-span-2">
          <h2 className="font-semibold text-gray-700 mb-3">Horas de Sono (últimas 2 semanas)</h2>
          {sonoData.length > 0 ? (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={sonoData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="data" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 12]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="horas" fill="#a855f7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-gray-400">Nenhum dado de sono registrado.</p>
          )}
        </Card>

        <Card>
          <h2 className="font-semibold text-gray-700 mb-3">Treinos por Tipo</h2>
          {treinosChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={treinosChartData} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="tipo" type="category" tick={{ fontSize: 11 }} width={80} />
                <Tooltip />
                <Bar dataKey="qtd" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-gray-400">Nenhum treino registrado.</p>
          )}
        </Card>

        {gorduraData.length > 0 && (
          <Card className="col-span-3">
            <h2 className="font-semibold text-gray-700 mb-3">
              Composição Corporal — Gordura vs Massa Muscular
            </h2>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={gorduraData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="data" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="gordura" stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} name="Gordura %" />
                <Line type="monotone" dataKey="muscular" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} name="Massa Musc. (kg)" />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        )}
      </div>
    </div>
  );
}
