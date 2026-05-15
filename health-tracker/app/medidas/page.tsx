"use client";

import { useEffect, useState } from "react";
import { loadData, saveData, uid } from "@/lib/storage";
import { Medidas } from "@/lib/types";
import { fmtDate, today, calcIMC, imcCategoria } from "@/lib/utils";
import PageHeader from "@/components/PageHeader";
import Card from "@/components/Card";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { fmtDateShort } from "@/lib/utils";

const blank = {
  data: today(), peso: "", altura: "", cintura: "", quadril: "",
  braco: "", coxa: "", panturrilha: "", peito: "", notas: "",
};

export default function MedidasPage() {
  const [registros, setRegistros] = useState<Medidas[]>([]);
  const [form, setForm] = useState({ ...blank });
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  useEffect(() => {
    const d = loadData();
    setRegistros([...d.medidas].sort((a, b) => b.data.localeCompare(a.data)));
  }, []);

  function persist(updated: Medidas[]) {
    const d = loadData();
    d.medidas = updated;
    saveData(d);
    setRegistros([...updated].sort((a, b) => b.data.localeCompare(a.data)));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const peso = +form.peso;
    const altura = +form.altura;
    const imc = peso && altura ? calcIMC(peso, altura) : undefined;
    const entry: Medidas = {
      id: editId ?? uid(),
      data: form.data,
      peso,
      altura,
      imc,
      cintura: form.cintura ? +form.cintura : undefined,
      quadril: form.quadril ? +form.quadril : undefined,
      braco: form.braco ? +form.braco : undefined,
      coxa: form.coxa ? +form.coxa : undefined,
      panturrilha: form.panturrilha ? +form.panturrilha : undefined,
      peito: form.peito ? +form.peito : undefined,
      notas: form.notas || undefined,
    };
    const d = loadData();
    if (editId) {
      d.medidas = d.medidas.map((m) => (m.id === editId ? entry : m));
    } else {
      d.medidas.push(entry);
    }
    persist(d.medidas);
    setForm({ ...blank });
    setOpen(false);
    setEditId(null);
  }

  function handleEdit(m: Medidas) {
    setForm({
      data: m.data, peso: String(m.peso), altura: String(m.altura),
      cintura: m.cintura ? String(m.cintura) : "", quadril: m.quadril ? String(m.quadril) : "",
      braco: m.braco ? String(m.braco) : "", coxa: m.coxa ? String(m.coxa) : "",
      panturrilha: m.panturrilha ? String(m.panturrilha) : "",
      peito: m.peito ? String(m.peito) : "", notas: m.notas ?? "",
    });
    setEditId(m.id);
    setOpen(true);
  }

  function handleDelete(id: string) {
    const d = loadData();
    d.medidas = d.medidas.filter((m) => m.id !== id);
    persist(d.medidas);
  }

  const chartData = [...registros].reverse().slice(-12).map((m) => ({
    data: fmtDateShort(m.data),
    peso: m.peso,
    imc: m.imc,
    cintura: m.cintura,
  }));

  const ultimo = registros[0];
  const imcInfo = ultimo?.imc ? imcCategoria(ultimo.imc) : null;

  // Relação cintura/quadril
  const rcq = ultimo?.cintura && ultimo?.quadril
    ? (ultimo.cintura / ultimo.quadril).toFixed(2)
    : null;

  return (
    <div>
      <PageHeader
        icon="📏"
        title="Medidas Corporais"
        description="Registre peso, altura e circunferências"
        action={
          <button onClick={() => { setOpen(true); setEditId(null); setForm({ ...blank }); }}
            className="bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            + Nova Medição
          </button>
        }
      />

      {ultimo && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Peso</p>
            <p className="text-xl font-bold text-gray-800 mt-1">{ultimo.peso} kg</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Altura</p>
            <p className="text-xl font-bold text-gray-800 mt-1">{ultimo.altura} cm</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide">IMC</p>
            <p className={`text-xl font-bold mt-1 ${imcInfo?.color ?? "text-gray-800"}`}>{ultimo.imc}</p>
            <p className="text-xs text-gray-400">{imcInfo?.label}</p>
          </div>
          {rcq && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Rel. Cintura/Quadril</p>
              <p className="text-xl font-bold text-gray-800 mt-1">{rcq}</p>
              <p className="text-xs text-gray-400">Ideal: H &lt;0.90 | M &lt;0.85</p>
            </div>
          )}
        </div>
      )}

      {chartData.length > 0 && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-6">
          <Card>
            <h2 className="font-semibold text-gray-700 mb-3">Evolução do Peso (kg)</h2>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="data" tick={{ fontSize: 11 }} />
                <YAxis domain={["auto", "auto"]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="peso" stroke="#0d9488" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
          {chartData.some((d) => d.cintura) && (
            <Card>
              <h2 className="font-semibold text-gray-700 mb-3">Circunferência da Cintura (cm)</h2>
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="data" tick={{ fontSize: 11 }} />
                  <YAxis domain={["auto", "auto"]} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="cintura" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          )}
        </div>
      )}

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">{editId ? "Editar" : "Nova"} Medição</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Data</label>
                <input type="date" className="input" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Peso (kg) *</label>
                  <input type="number" step="0.1" className="input" required value={form.peso} onChange={(e) => setForm({ ...form, peso: e.target.value })} />
                </div>
                <div>
                  <label className="label">Altura (cm) *</label>
                  <input type="number" step="0.1" className="input" required value={form.altura} onChange={(e) => setForm({ ...form, altura: e.target.value })} />
                </div>
              </div>
              <p className="text-xs text-gray-500 font-medium">Circunferências (cm) — opcionais</p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { key: "cintura", label: "Cintura" },
                  { key: "quadril", label: "Quadril" },
                  { key: "peito", label: "Peito" },
                  { key: "braco", label: "Braço" },
                  { key: "coxa", label: "Coxa" },
                  { key: "panturrilha", label: "Panturrilha" },
                ].map(({ key, label }) => (
                  <div key={key}>
                    <label className="label">{label}</label>
                    <input type="number" step="0.1" className="input" value={form[key as keyof typeof form]}
                      onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
                  </div>
                ))}
              </div>
              {form.peso && form.altura && (
                <div className="bg-teal-50 rounded-lg p-3 text-center">
                  <span className="text-sm text-teal-700 font-medium">
                    IMC calculado: {calcIMC(+form.peso, +form.altura)} — {imcCategoria(calcIMC(+form.peso, +form.altura)).label}
                  </span>
                </div>
              )}
              <div>
                <label className="label">Notas</label>
                <textarea className="input h-14 resize-none" placeholder="Observações..." value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} />
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => { setOpen(false); setEditId(null); }} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
                <button type="submit" className="px-4 py-2 text-sm bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {registros.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-5xl mb-3">📐</p>
          <p>Nenhuma medição registrada ainda.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {registros.map((m) => (
            <Card key={m.id} className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-gray-800">{fmtDate(m.data)}</span>
                  <span className="text-sm font-medium text-teal-700">{m.peso} kg</span>
                  <span className="text-sm text-gray-500">{m.altura} cm</span>
                  {m.imc && (
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${imcCategoria(m.imc).color} bg-gray-50`}>
                      IMC {m.imc}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-gray-500">
                  {m.cintura && <span>Cintura: {m.cintura}cm</span>}
                  {m.quadril && <span>Quadril: {m.quadril}cm</span>}
                  {m.peito && <span>Peito: {m.peito}cm</span>}
                  {m.braco && <span>Braço: {m.braco}cm</span>}
                  {m.coxa && <span>Coxa: {m.coxa}cm</span>}
                  {m.panturrilha && <span>Pant.: {m.panturrilha}cm</span>}
                </div>
                {m.notas && <p className="text-xs text-gray-400 italic mt-0.5">{m.notas}</p>}
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => handleEdit(m)} className="text-xs text-blue-500 hover:text-blue-700">Editar</button>
                <button onClick={() => handleDelete(m.id)} className="text-xs text-red-400 hover:text-red-600">Excluir</button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
