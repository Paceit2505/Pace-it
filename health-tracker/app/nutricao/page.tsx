"use client";

import { useEffect, useState } from "react";
import { loadData, saveData, uid } from "@/lib/storage";
import { Nutricao } from "@/lib/types";
import { fmtDate, today } from "@/lib/utils";
import PageHeader from "@/components/PageHeader";
import Card from "@/components/Card";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { fmtDateShort } from "@/lib/utils";

const blank = { data: today(), calorias: "", proteinas: "", carboidratos: "", gorduras: "", aguaML: "", notas: "" };

export default function NutricaoPage() {
  const [registros, setRegistros] = useState<Nutricao[]>([]);
  const [form, setForm] = useState({ ...blank });
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  useEffect(() => {
    const d = loadData();
    setRegistros([...d.nutricao].sort((a, b) => b.data.localeCompare(a.data)));
  }, []);

  function persist(updated: Nutricao[]) {
    const d = loadData();
    d.nutricao = updated;
    saveData(d);
    setRegistros([...updated].sort((a, b) => b.data.localeCompare(a.data)));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const entry: Nutricao = {
      id: editId ?? uid(),
      data: form.data,
      aguaML: +form.aguaML,
      calorias: form.calorias ? +form.calorias : undefined,
      proteinas: form.proteinas ? +form.proteinas : undefined,
      carboidratos: form.carboidratos ? +form.carboidratos : undefined,
      gorduras: form.gorduras ? +form.gorduras : undefined,
      notas: form.notas || undefined,
    };
    const d = loadData();
    if (editId) {
      d.nutricao = d.nutricao.map((n) => (n.id === editId ? entry : n));
    } else {
      d.nutricao.push(entry);
    }
    persist(d.nutricao);
    setForm({ ...blank });
    setOpen(false);
    setEditId(null);
  }

  function handleEdit(n: Nutricao) {
    setForm({
      data: n.data, calorias: n.calorias ? String(n.calorias) : "",
      proteinas: n.proteinas ? String(n.proteinas) : "",
      carboidratos: n.carboidratos ? String(n.carboidratos) : "",
      gorduras: n.gorduras ? String(n.gorduras) : "",
      aguaML: String(n.aguaML), notas: n.notas ?? "",
    });
    setEditId(n.id);
    setOpen(true);
  }

  function handleDelete(id: string) {
    const d = loadData();
    d.nutricao = d.nutricao.filter((n) => n.id !== id);
    persist(d.nutricao);
  }

  const chartData = [...registros].reverse().slice(-14).map((n) => ({
    data: fmtDateShort(n.data),
    agua: Math.round(n.aguaML / 100) / 10, // litros
    calorias: n.calorias,
    proteinas: n.proteinas,
  }));

  const mediaAgua = registros.length
    ? (registros.reduce((acc, n) => acc + n.aguaML, 0) / registros.length / 1000).toFixed(1)
    : null;

  const ultimoMacros = registros.find((n) => n.calorias || n.proteinas);

  return (
    <div>
      <PageHeader
        icon="🥗"
        title="Nutrição & Hidratação"
        description="Monitore sua alimentação e consumo de água"
        action={
          <button onClick={() => { setOpen(true); setEditId(null); setForm({ ...blank }); }}
            className="bg-lime-600 hover:bg-lime-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            + Registrar Dia
          </button>
        }
      />

      {chartData.length > 0 && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-6">
          <Card>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-700">Hidratação (litros/dia)</h2>
              {mediaAgua && <span className="text-sm text-gray-500">Média: <strong>{mediaAgua}L</strong></span>}
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="data" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 4]} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [`${v}L`, "Água"]} />
                <Bar dataKey="agua" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {chartData.some((d) => d.calorias) && (
            <Card>
              <h2 className="font-semibold text-gray-700 mb-3">Calorias e Proteínas</h2>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="data" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="calorias" fill="#f97316" radius={[4, 4, 0, 0]} name="Kcal" />
                  <Bar dataKey="proteinas" fill="#22c55e" radius={[4, 4, 0, 0]} name="Proteína (g)" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          )}
        </div>
      )}

      {ultimoMacros && (
        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            { label: "Calorias", value: ultimoMacros.calorias, unit: "kcal", color: "text-orange-600" },
            { label: "Proteínas", value: ultimoMacros.proteinas, unit: "g", color: "text-green-600" },
            { label: "Carboidratos", value: ultimoMacros.carboidratos, unit: "g", color: "text-yellow-600" },
            { label: "Gorduras", value: ultimoMacros.gorduras, unit: "g", color: "text-red-500" },
          ].map((m) => (
            <div key={m.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
              <p className="text-xs text-gray-500 uppercase tracking-wide">{m.label}</p>
              <p className={`text-lg font-bold mt-1 ${m.color}`}>
                {m.value ?? "—"}{m.value ? <span className="text-xs font-normal text-gray-400 ml-1">{m.unit}</span> : ""}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">{editId ? "Editar" : "Registrar"} Alimentação</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Data</label>
                <input type="date" className="input" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} required />
              </div>
              <div>
                <label className="label">Água consumida (mL) *</label>
                <input type="number" className="input" min={0} required value={form.aguaML} onChange={(e) => setForm({ ...form, aguaML: e.target.value })} placeholder="Ex: 2500" />
                {form.aguaML && <p className="text-xs text-blue-500 mt-0.5">{(+form.aguaML / 1000).toFixed(1)} litros</p>}
              </div>
              <p className="text-xs text-gray-500 font-medium">Macronutrientes — opcionais</p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { key: "calorias", label: "Calorias (kcal)" },
                  { key: "proteinas", label: "Proteínas (g)" },
                  { key: "carboidratos", label: "Carboidratos (g)" },
                  { key: "gorduras", label: "Gorduras (g)" },
                ].map(({ key, label }) => (
                  <div key={key}>
                    <label className="label">{label}</label>
                    <input type="number" step="0.1" className="input" value={form[key as keyof typeof form]}
                      onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
                  </div>
                ))}
              </div>
              <div>
                <label className="label">Notas</label>
                <textarea className="input h-14 resize-none" placeholder="Como foi sua alimentação hoje?" value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} />
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => { setOpen(false); setEditId(null); }} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
                <button type="submit" className="px-4 py-2 text-sm bg-lime-600 hover:bg-lime-700 text-white rounded-lg font-medium">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {registros.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-5xl mb-3">🥤</p>
          <p>Nenhum registro de nutrição ainda.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {registros.map((n) => (
            <Card key={n.id} className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-gray-800">{fmtDate(n.data)}</span>
                  <span className="text-sm text-blue-600 font-medium">💧 {(n.aguaML / 1000).toFixed(1)}L</span>
                  {n.calorias && <span className="text-sm text-orange-600">🔥 {n.calorias} kcal</span>}
                  {n.proteinas && <span className="text-sm text-green-600">💪 {n.proteinas}g prot</span>}
                  {n.carboidratos && <span className="text-xs text-gray-500">{n.carboidratos}g carb</span>}
                  {n.gorduras && <span className="text-xs text-gray-500">{n.gorduras}g gord</span>}
                </div>
                {n.notas && <p className="text-xs text-gray-400 italic mt-0.5">{n.notas}</p>}
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => handleEdit(n)} className="text-xs text-blue-500 hover:text-blue-700">Editar</button>
                <button onClick={() => handleDelete(n.id)} className="text-xs text-red-400 hover:text-red-600">Excluir</button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
