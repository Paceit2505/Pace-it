"use client";

import { useEffect, useState } from "react";
import { loadData, saveData, uid } from "@/lib/storage";
import { Sono } from "@/lib/types";
import { fmtDate, today, calcSonoDuracao } from "@/lib/utils";
import PageHeader from "@/components/PageHeader";
import Card from "@/components/Card";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine,
} from "recharts";
import { fmtDateShort } from "@/lib/utils";

const blank = { data: today(), horaDormir: "23:00", horaAcordar: "07:00", qualidade: 3, notas: "" };

const qualidadeLabel: Record<number, string> = {
  1: "Péssima 😣", 2: "Ruim 😕", 3: "Regular 😐", 4: "Boa 😊", 5: "Ótima 😄",
};

export default function SonoPage() {
  const [registros, setRegistros] = useState<Sono[]>([]);
  const [form, setForm] = useState({ ...blank });
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  useEffect(() => {
    const d = loadData();
    setRegistros([...d.sono].sort((a, b) => b.data.localeCompare(a.data)));
  }, []);

  function persist(updated: Sono[]) {
    const d = loadData();
    d.sono = updated;
    saveData(d);
    setRegistros([...updated].sort((a, b) => b.data.localeCompare(a.data)));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const duracao = calcSonoDuracao(form.horaDormir, form.horaAcordar);
    const d = loadData();
    const entry: Sono = { ...form, id: editId ?? uid(), duracaoHoras: duracao };
    if (editId) {
      d.sono = d.sono.map((s) => (s.id === editId ? entry : s));
    } else {
      d.sono.push(entry);
    }
    persist(d.sono);
    setForm({ ...blank });
    setOpen(false);
    setEditId(null);
  }

  function handleEdit(s: Sono) {
    setForm({ data: s.data, horaDormir: s.horaDormir, horaAcordar: s.horaAcordar, qualidade: s.qualidade, notas: s.notas ?? "" });
    setEditId(s.id);
    setOpen(true);
  }

  function handleDelete(id: string) {
    const d = loadData();
    d.sono = d.sono.filter((s) => s.id !== id);
    persist(d.sono);
  }

  const chartData = [...registros].reverse().slice(-14).map((s) => ({
    data: fmtDateShort(s.data), horas: s.duracaoHoras, qualidade: s.qualidade,
  }));

  const media = registros.length
    ? (registros.reduce((acc, s) => acc + s.duracaoHoras, 0) / registros.length).toFixed(1)
    : null;

  return (
    <div>
      <PageHeader
        icon="😴"
        title="Sono"
        description="Monitore suas horas e qualidade de sono"
        action={
          <button onClick={() => { setOpen(true); setEditId(null); setForm({ ...blank }); }} className="bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            + Registrar Sono
          </button>
        }
      />

      {chartData.length > 0 && (
        <Card className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-700">Horas de Sono — Últimos 14 dias</h2>
            {media && <span className="text-sm text-gray-500">Média: <strong>{media}h</strong></span>}
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="data" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 12]} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => [`${v}h`, "Sono"]} />
              <ReferenceLine y={8} stroke="#a855f7" strokeDasharray="4 2" label={{ value: "8h ideal", fontSize: 11, fill: "#a855f7" }} />
              <Bar dataKey="horas" fill="#a855f7" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">{editId ? "Editar" : "Registrar"} Sono</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Data</label>
                <input type="date" className="input" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Hora de Dormir</label>
                  <input type="time" className="input" value={form.horaDormir} onChange={(e) => setForm({ ...form, horaDormir: e.target.value })} required />
                </div>
                <div>
                  <label className="label">Hora de Acordar</label>
                  <input type="time" className="input" value={form.horaAcordar} onChange={(e) => setForm({ ...form, horaAcordar: e.target.value })} required />
                </div>
              </div>
              <div>
                <label className="label">Qualidade do Sono</label>
                <div className="flex gap-2 mt-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button type="button" key={n} onClick={() => setForm({ ...form, qualidade: n })}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${form.qualidade === n ? "bg-purple-600 text-white border-purple-600" : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}>
                      {n}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-1 text-center">{qualidadeLabel[form.qualidade]}</p>
              </div>
              <div>
                <label className="label">Notas</label>
                <textarea className="input h-16 resize-none" placeholder="Dormiu bem? Acordou várias vezes?" value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} />
              </div>
              <div className="bg-purple-50 rounded-lg p-3 text-center">
                <span className="text-sm text-purple-700 font-medium">
                  Duração estimada: {calcSonoDuracao(form.horaDormir, form.horaAcordar)}h
                </span>
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => { setOpen(false); setEditId(null); }} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
                <button type="submit" className="px-4 py-2 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {registros.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-5xl mb-3">🌙</p>
          <p>Nenhum registro de sono ainda.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {registros.map((s) => (
            <Card key={s.id} className="flex items-center justify-between gap-4">
              <div className="flex gap-4 items-center flex-1">
                <div className="text-2xl">
                  {s.duracaoHoras >= 7 ? "😊" : s.duracaoHoras >= 5 ? "😐" : "😞"}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-800">{s.duracaoHoras}h de sono</span>
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Qualidade {s.qualidade}/5</span>
                    <span className="text-xs text-gray-400">{fmtDate(s.data)}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{s.horaDormir} → {s.horaAcordar}</p>
                  {s.notas && <p className="text-xs text-gray-400 italic">{s.notas}</p>}
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => handleEdit(s)} className="text-xs text-blue-500 hover:text-blue-700">Editar</button>
                <button onClick={() => handleDelete(s.id)} className="text-xs text-red-400 hover:text-red-600">Excluir</button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
