"use client";

import { useEffect, useState } from "react";
import { getBioimpedancias, upsertBioimpedancia, deleteBioimpedancia } from "@/lib/db";
import { Bioimpedancia } from "@/lib/types";
import { fmtDate, today, fmtDateShort } from "@/lib/utils";
import PageHeader from "@/components/PageHeader";
import Card from "@/components/Card";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";

const blank = {
  data: today(), peso: "", gorduraCorporal: "", massaMuscular: "", agua: "",
  massaOssea: "", metabolismoBasal: "", idadeMetabolica: "", notas: "",
};

export default function BioimpedanciaPage() {
  const [registros, setRegistros] = useState<Bioimpedancia[]>([]);
  const [form, setForm] = useState({ ...blank });
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setRegistros(await getBioimpedancias());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const entry = {
      data: form.data,
      peso: +form.peso,
      gorduraCorporal: +form.gorduraCorporal,
      massaMuscular: +form.massaMuscular,
      agua: +form.agua,
      massaOssea: form.massaOssea ? +form.massaOssea : undefined,
      metabolismoBasal: form.metabolismoBasal ? +form.metabolismoBasal : undefined,
      idadeMetabolica: form.idadeMetabolica ? +form.idadeMetabolica : undefined,
      notas: form.notas || undefined,
    };
    await upsertBioimpedancia(editId ? { ...entry, id: editId } : entry);
    await load();
    setForm({ ...blank });
    setOpen(false);
    setEditId(null);
    setSaving(false);
  }

  function handleEdit(b: Bioimpedancia) {
    setForm({
      data: b.data, peso: String(b.peso), gorduraCorporal: String(b.gorduraCorporal),
      massaMuscular: String(b.massaMuscular), agua: String(b.agua),
      massaOssea: b.massaOssea ? String(b.massaOssea) : "",
      metabolismoBasal: b.metabolismoBasal ? String(b.metabolismoBasal) : "",
      idadeMetabolica: b.idadeMetabolica ? String(b.idadeMetabolica) : "",
      notas: b.notas ?? "",
    });
    setEditId(b.id);
    setOpen(true);
  }

  async function handleDelete(id: string) {
    await deleteBioimpedancia(id);
    setRegistros((prev) => prev.filter((b) => b.id !== id));
  }

  const chartData = [...registros].reverse().slice(-10).map((b) => ({
    data: fmtDateShort(b.data),
    gordura: b.gorduraCorporal,
    muscular: b.massaMuscular,
    agua: b.agua,
  }));

  const ultimo = registros[0];

  return (
    <div>
      <PageHeader
        icon="⚖️"
        title="Bioimpedância"
        description="Acompanhe sua composição corporal ao longo do tempo"
        action={
          <button onClick={() => { setOpen(true); setEditId(null); setForm({ ...blank }); }}
            className="bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            + Novo Registro
          </button>
        }
      />

      {ultimo && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Peso", value: `${ultimo.peso} kg`, icon: "⚖️", color: "text-gray-700" },
            { label: "Gordura Corporal", value: `${ultimo.gorduraCorporal}%`, icon: "🔶", color: "text-orange-600" },
            { label: "Massa Muscular", value: `${ultimo.massaMuscular} kg`, icon: "💪", color: "text-green-600" },
            { label: "Água Corporal", value: `${ultimo.agua}%`, icon: "💧", color: "text-blue-600" },
          ].map((k) => (
            <div key={k.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide">{k.label}</p>
              <p className={`text-xl font-bold mt-1 ${k.color}`}>{k.icon} {k.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{fmtDate(ultimo.data)}</p>
            </div>
          ))}
        </div>
      )}

      {chartData.length > 0 && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-6">
          <Card>
            <h2 className="font-semibold text-gray-700 mb-3">Gordura x Massa Muscular</h2>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="data" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="gordura" stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} name="Gordura %" />
                <Line type="monotone" dataKey="muscular" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} name="Massa Musc. (kg)" />
              </LineChart>
            </ResponsiveContainer>
          </Card>
          <Card>
            <h2 className="font-semibold text-gray-700 mb-3">Água Corporal (%)</h2>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="data" tick={{ fontSize: 11 }} />
                <YAxis domain={["auto", "auto"]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="agua" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} name="Água %" />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}

      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">{editId ? "Editar" : "Novo"} Registro</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Data</label>
                <input type="date" className="input" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { key: "peso", label: "Peso (kg)", req: true },
                  { key: "gorduraCorporal", label: "Gordura Corporal (%)", req: true },
                  { key: "massaMuscular", label: "Massa Muscular (kg)", req: true },
                  { key: "agua", label: "Água Corporal (%)", req: true },
                  { key: "massaOssea", label: "Massa Óssea (kg)", req: false },
                  { key: "metabolismoBasal", label: "Metabolismo Basal (kcal)", req: false },
                  { key: "idadeMetabolica", label: "Idade Metabólica", req: false },
                ].map(({ key, label, req }) => (
                  <div key={key}>
                    <label className="label">{label}{!req && " (opcional)"}</label>
                    <input type="number" step="0.1" className="input" required={req}
                      value={form[key as keyof typeof form]}
                      onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
                  </div>
                ))}
              </div>
              <div>
                <label className="label">Notas</label>
                <textarea className="input h-14 resize-none" value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} />
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => { setOpen(false); setEditId(null); }} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
                <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white rounded-lg font-medium">
                  {saving ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-16 text-gray-400">Carregando...</div>
      ) : registros.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-5xl mb-3">📊</p>
          <p>Nenhum registro de bioimpedância ainda.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {registros.map((b) => (
            <Card key={b.id} className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-semibold text-gray-800">{fmtDate(b.data)}</span>
                  <span className="text-sm text-orange-600 font-medium">Gordura: {b.gorduraCorporal}%</span>
                  <span className="text-sm text-green-600 font-medium">Músculo: {b.massaMuscular} kg</span>
                  <span className="text-sm text-blue-600">Água: {b.agua}%</span>
                  <span className="text-sm text-gray-500">Peso: {b.peso} kg</span>
                  {b.idadeMetabolica && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Idade metab.: {b.idadeMetabolica}</span>}
                </div>
                {b.notas && <p className="text-xs text-gray-400 italic mt-0.5">{b.notas}</p>}
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => handleEdit(b)} className="text-xs text-blue-500 hover:text-blue-700">Editar</button>
                <button onClick={() => handleDelete(b.id)} className="text-xs text-red-400 hover:text-red-600">Excluir</button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
