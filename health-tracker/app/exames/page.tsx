"use client";

import { useEffect, useState } from "react";
import { loadData, saveData, uid } from "@/lib/storage";
import { ExameSangue, ResultadoExame } from "@/lib/types";
import { fmtDate, today } from "@/lib/utils";
import PageHeader from "@/components/PageHeader";
import Card from "@/components/Card";

const MARCADORES_COMUNS = [
  { nome: "Glicose", unidade: "mg/dL", referencia: "70–99" },
  { nome: "Hemoglobina", unidade: "g/dL", referencia: "H: 13.5–17.5 | M: 12–16" },
  { nome: "Hematócrito", unidade: "%", referencia: "H: 41–53 | M: 36–46" },
  { nome: "Leucócitos", unidade: "/mm³", referencia: "4.000–11.000" },
  { nome: "Plaquetas", unidade: "/mm³", referencia: "150.000–400.000" },
  { nome: "Colesterol Total", unidade: "mg/dL", referencia: "< 200" },
  { nome: "HDL", unidade: "mg/dL", referencia: "> 40" },
  { nome: "LDL", unidade: "mg/dL", referencia: "< 130" },
  { nome: "Triglicerídeos", unidade: "mg/dL", referencia: "< 150" },
  { nome: "TSH", unidade: "mUI/L", referencia: "0.4–4.0" },
  { nome: "T4 Livre", unidade: "ng/dL", referencia: "0.8–1.8" },
  { nome: "Vitamina D", unidade: "ng/mL", referencia: "30–100" },
  { nome: "Vitamina B12", unidade: "pg/mL", referencia: "200–900" },
  { nome: "Ferritina", unidade: "ng/mL", referencia: "H: 20–250 | M: 10–120" },
  { nome: "PCR", unidade: "mg/L", referencia: "< 5" },
  { nome: "Creatinina", unidade: "mg/dL", referencia: "H: 0.7–1.3 | M: 0.5–1.1" },
  { nome: "Ureia", unidade: "mg/dL", referencia: "15–45" },
  { nome: "TGO/AST", unidade: "U/L", referencia: "< 40" },
  { nome: "TGP/ALT", unidade: "U/L", referencia: "< 40" },
  { nome: "Testosterona Total", unidade: "ng/dL", referencia: "H: 270–1070 | M: 15–70" },
];

const emptyResult: ResultadoExame = { nome: "", valor: "", unidade: "", referencia: "", status: "normal" };

export default function ExamesPage() {
  const [exames, setExames] = useState<ExameSangue[]>([]);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ data: today(), laboratorio: "", notas: "" });
  const [resultados, setResultados] = useState<ResultadoExame[]>([{ ...emptyResult }]);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    const d = loadData();
    setExames([...d.examesSangue].sort((a, b) => b.data.localeCompare(a.data)));
  }, []);

  function persist(updated: ExameSangue[]) {
    const d = loadData();
    d.examesSangue = updated;
    saveData(d);
    setExames([...updated].sort((a, b) => b.data.localeCompare(a.data)));
  }

  function addMarcador(m: typeof MARCADORES_COMUNS[0]) {
    if (resultados.some((r) => r.nome === m.nome)) return;
    setResultados((prev) => [...prev, { nome: m.nome, valor: "", unidade: m.unidade, referencia: m.referencia, status: "normal" }]);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const valid = resultados.filter((r) => r.nome && r.valor);
    const d = loadData();
    const entry: ExameSangue = { ...form, id: editId ?? uid(), resultados: valid };
    if (editId) {
      d.examesSangue = d.examesSangue.map((x) => (x.id === editId ? entry : x));
    } else {
      d.examesSangue.push(entry);
    }
    persist(d.examesSangue);
    setOpen(false);
    setEditId(null);
    setForm({ data: today(), laboratorio: "", notas: "" });
    setResultados([{ ...emptyResult }]);
  }

  function handleDelete(id: string) {
    const d = loadData();
    d.examesSangue = d.examesSangue.filter((x) => x.id !== id);
    persist(d.examesSangue);
  }

  const statusColor = (s?: string) =>
    s === "alto" ? "text-red-600 bg-red-50" : s === "baixo" ? "text-blue-600 bg-blue-50" : "text-green-600 bg-green-50";

  return (
    <div>
      <PageHeader
        icon="🩸"
        title="Exames de Sangue"
        description="Registre e acompanhe seus resultados laboratoriais"
        action={
          <button onClick={() => { setOpen(true); setEditId(null); setForm({ data: today(), laboratorio: "", notas: "" }); setResultados([{ ...emptyResult }]); }}
            className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            + Novo Exame
          </button>
        }
      />

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl p-6 my-4">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Novo Exame de Sangue</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Data do Exame</label>
                  <input type="date" className="input" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} required />
                </div>
                <div>
                  <label className="label">Laboratório (opcional)</label>
                  <input type="text" className="input" placeholder="Nome do laboratório" value={form.laboratorio} onChange={(e) => setForm({ ...form, laboratorio: e.target.value })} />
                </div>
              </div>

              {/* Marcadores comuns */}
              <div>
                <p className="label mb-2">Adicionar marcadores comuns:</p>
                <div className="flex flex-wrap gap-1.5">
                  {MARCADORES_COMUNS.map((m) => (
                    <button type="button" key={m.nome} onClick={() => addMarcador(m)}
                      className={`text-xs px-2 py-1 rounded-full border transition-colors ${resultados.some((r) => r.nome === m.nome) ? "bg-red-100 text-red-700 border-red-200" : "border-gray-200 text-gray-600 hover:bg-gray-100"}`}>
                      {m.nome}
                    </button>
                  ))}
                </div>
              </div>

              {/* Resultados */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="label">Resultados</p>
                  <button type="button" onClick={() => setResultados((p) => [...p, { ...emptyResult }])}
                    className="text-xs text-green-600 hover:text-green-800 font-medium">+ Adicionar linha</button>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {resultados.map((r, i) => (
                    <div key={i} className="grid grid-cols-12 gap-2 items-center">
                      <input className="input col-span-4" placeholder="Exame" value={r.nome}
                        onChange={(e) => setResultados((prev) => prev.map((x, j) => j === i ? { ...x, nome: e.target.value } : x))} />
                      <input className="input col-span-2" placeholder="Valor" value={r.valor}
                        onChange={(e) => setResultados((prev) => prev.map((x, j) => j === i ? { ...x, valor: e.target.value } : x))} />
                      <input className="input col-span-2" placeholder="Unidade" value={r.unidade}
                        onChange={(e) => setResultados((prev) => prev.map((x, j) => j === i ? { ...x, unidade: e.target.value } : x))} />
                      <input className="input col-span-2" placeholder="Referência" value={r.referencia}
                        onChange={(e) => setResultados((prev) => prev.map((x, j) => j === i ? { ...x, referencia: e.target.value } : x))} />
                      <select className="input col-span-1 text-xs" value={r.status}
                        onChange={(e) => setResultados((prev) => prev.map((x, j) => j === i ? { ...x, status: e.target.value as ResultadoExame["status"] } : x))}>
                        <option value="normal">OK</option>
                        <option value="alto">Alto</option>
                        <option value="baixo">Baixo</option>
                      </select>
                      <button type="button" onClick={() => setResultados((p) => p.filter((_, j) => j !== i))}
                        className="col-span-1 text-red-400 hover:text-red-600 text-lg text-center">×</button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">Notas</label>
                <textarea className="input h-14 resize-none" placeholder="Observações médicas, próximo exame..." value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} />
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => { setOpen(false); setEditId(null); }} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
                <button type="submit" className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {exames.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-5xl mb-3">🧪</p>
          <p>Nenhum exame registrado ainda.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {exames.map((ex) => (
            <Card key={ex.id}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-800">{fmtDate(ex.data)}</span>
                    {ex.laboratorio && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{ex.laboratorio}</span>}
                    <span className="text-xs text-gray-400">{ex.resultados.length} marcador{ex.resultados.length !== 1 ? "es" : ""}</span>
                  </div>
                  {ex.notas && <p className="text-xs text-gray-400 italic mt-0.5">{ex.notas}</p>}
                </div>
                <div className="flex gap-2 items-center shrink-0">
                  <button onClick={() => setExpanded(expanded === ex.id ? null : ex.id)} className="text-xs text-blue-500 hover:text-blue-700">
                    {expanded === ex.id ? "Fechar" : "Ver detalhes"}
                  </button>
                  <button onClick={() => handleDelete(ex.id)} className="text-xs text-red-400 hover:text-red-600">Excluir</button>
                </div>
              </div>

              {expanded === ex.id && (
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs text-gray-500 border-b">
                        <th className="text-left py-2 pr-4">Exame</th>
                        <th className="text-left py-2 pr-4">Resultado</th>
                        <th className="text-left py-2 pr-4">Unidade</th>
                        <th className="text-left py-2 pr-4">Referência</th>
                        <th className="text-left py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ex.resultados.map((r, i) => (
                        <tr key={i} className="border-b border-gray-50">
                          <td className="py-1.5 pr-4 font-medium text-gray-700">{r.nome}</td>
                          <td className="py-1.5 pr-4 font-semibold">{r.valor}</td>
                          <td className="py-1.5 pr-4 text-gray-500">{r.unidade}</td>
                          <td className="py-1.5 pr-4 text-gray-400 text-xs">{r.referencia}</td>
                          <td className="py-1.5">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor(r.status)}`}>
                              {r.status === "alto" ? "Alto" : r.status === "baixo" ? "Baixo" : "Normal"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
