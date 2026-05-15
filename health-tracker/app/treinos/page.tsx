"use client";

import { useEffect, useState } from "react";
import { loadData, saveData, uid } from "@/lib/storage";
import { Treino, TreinoTipo } from "@/lib/types";
import { fmtDate, today, treinoTipoLabel } from "@/lib/utils";
import PageHeader from "@/components/PageHeader";
import Card from "@/components/Card";

const TIPOS: TreinoTipo[] = [
  "musculacao", "cardio", "hiit", "yoga", "pilates",
  "natacao", "ciclismo", "corrida", "outro",
];

const blank: Omit<Treino, "id"> = {
  data: today(),
  tipo: "musculacao",
  duracaoMin: 60,
  intensidade: 7,
  exercicios: "",
  calorias: undefined,
  notas: "",
};

export default function TreinosPage() {
  const [treinos, setTreinos] = useState<Treino[]>([]);
  const [form, setForm] = useState({ ...blank });
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  useEffect(() => {
    const d = loadData();
    setTreinos([...d.treinos].sort((a, b) => b.data.localeCompare(a.data)));
  }, []);

  function persist(updated: Treino[]) {
    const d = loadData();
    d.treinos = updated;
    saveData(d);
    setTreinos([...updated].sort((a, b) => b.data.localeCompare(a.data)));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const d = loadData();
    if (editId) {
      d.treinos = d.treinos.map((t) => (t.id === editId ? { ...form, id: editId } : t));
    } else {
      d.treinos.push({ ...form, id: uid() });
    }
    persist(d.treinos);
    setForm({ ...blank });
    setOpen(false);
    setEditId(null);
  }

  function handleEdit(t: Treino) {
    setForm({ data: t.data, tipo: t.tipo, duracaoMin: t.duracaoMin, intensidade: t.intensidade, exercicios: t.exercicios, calorias: t.calorias, notas: t.notas ?? "" });
    setEditId(t.id);
    setOpen(true);
  }

  function handleDelete(id: string) {
    const d = loadData();
    d.treinos = d.treinos.filter((t) => t.id !== id);
    persist(d.treinos);
  }

  const stars = (n: number) => "★".repeat(n) + "☆".repeat(10 - n);

  return (
    <div>
      <PageHeader
        icon="💪"
        title="Treinos"
        description="Registre suas sessões de treino"
        action={
          <button
            onClick={() => { setOpen(true); setEditId(null); setForm({ ...blank }); }}
            className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            + Novo Treino
          </button>
        }
      />

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">
              {editId ? "Editar Treino" : "Novo Treino"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Data</label>
                  <input type="date" className="input" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} required />
                </div>
                <div>
                  <label className="label">Tipo de Treino</label>
                  <select className="input" value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value as TreinoTipo })}>
                    {TIPOS.map((t) => <option key={t} value={t}>{treinoTipoLabel(t)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Duração (min)</label>
                  <input type="number" className="input" min={1} max={600} value={form.duracaoMin} onChange={(e) => setForm({ ...form, duracaoMin: +e.target.value })} required />
                </div>
                <div>
                  <label className="label">Intensidade (1–10)</label>
                  <input type="number" className="input" min={1} max={10} value={form.intensidade} onChange={(e) => setForm({ ...form, intensidade: +e.target.value })} required />
                </div>
                <div>
                  <label className="label">Calorias (opcional)</label>
                  <input type="number" className="input" min={0} value={form.calorias ?? ""} onChange={(e) => setForm({ ...form, calorias: e.target.value ? +e.target.value : undefined })} />
                </div>
              </div>
              <div>
                <label className="label">Exercícios realizados</label>
                <textarea className="input h-20 resize-none" placeholder="Ex: Supino 4x10, Remada 3x12..." value={form.exercicios} onChange={(e) => setForm({ ...form, exercicios: e.target.value })} />
              </div>
              <div>
                <label className="label">Notas</label>
                <textarea className="input h-16 resize-none" placeholder="Como foi o treino?" value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => { setOpen(false); setEditId(null); }} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Cancelar</button>
                <button type="submit" className="px-4 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lista */}
      {treinos.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-5xl mb-3">🏋️</p>
          <p className="text-base">Nenhum treino registrado ainda.</p>
          <p className="text-sm">Clique em "+ Novo Treino" para começar.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {treinos.map((t) => (
            <Card key={t.id} className="flex items-start justify-between gap-4">
              <div className="flex gap-4 items-start flex-1">
                <div className="text-2xl">
                  {t.tipo === "musculacao" ? "🏋️" : t.tipo === "cardio" ? "🚴" : t.tipo === "corrida" ? "🏃" : t.tipo === "yoga" ? "🧘" : t.tipo === "natacao" ? "🏊" : "⚡"}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-800">{treinoTipoLabel(t.tipo)}</span>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{t.duracaoMin} min</span>
                    {t.calorias && <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">🔥 {t.calorias} kcal</span>}
                    <span className="text-xs text-gray-400">{fmtDate(t.data)}</span>
                  </div>
                  <div className="text-xs text-yellow-500 mt-0.5">{stars(t.intensidade)}</div>
                  {t.exercicios && <p className="text-sm text-gray-600 mt-1">{t.exercicios}</p>}
                  {t.notas && <p className="text-xs text-gray-400 mt-0.5 italic">{t.notas}</p>}
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => handleEdit(t)} className="text-xs text-blue-500 hover:text-blue-700">Editar</button>
                <button onClick={() => handleDelete(t.id)} className="text-xs text-red-400 hover:text-red-600">Excluir</button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
