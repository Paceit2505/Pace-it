"use client";

import { createClient } from "./supabase/client";
import {
  Treino,
  Sono,
  ExameSangue,
  Bioimpedancia,
  Medidas,
  Nutricao,
} from "./types";

// ─── helpers ────────────────────────────────────────────────────────────────

async function userId() {
  const sb = createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) throw new Error("not authenticated");
  return user.id;
}

// ─── TREINOS ─────────────────────────────────────────────────────────────────

function rowToTreino(r: Record<string, unknown>): Treino {
  return {
    id: r.id as string,
    data: r.data as string,
    tipo: r.tipo as Treino["tipo"],
    duracaoMin: r.duracao_min as number,
    intensidade: r.intensidade as number,
    exercicios: (r.exercicios as string) ?? "",
    calorias: r.calorias as number | undefined,
    notas: (r.notas as string) ?? "",
  };
}

export async function getTreinos(): Promise<Treino[]> {
  const sb = createClient();
  const { data } = await sb
    .from("treinos")
    .select("*")
    .order("data", { ascending: false });
  return (data ?? []).map(rowToTreino);
}

export async function upsertTreino(t: Omit<Treino, "id"> & { id?: string }): Promise<void> {
  const sb = createClient();
  const uid = await userId();
  const row = {
    user_id: uid,
    data: t.data,
    tipo: t.tipo,
    duracao_min: t.duracaoMin,
    intensidade: t.intensidade,
    exercicios: t.exercicios,
    calorias: t.calorias ?? null,
    notas: t.notas ?? null,
  };
  if (t.id) {
    await sb.from("treinos").update(row).eq("id", t.id);
  } else {
    await sb.from("treinos").insert(row);
  }
}

export async function deleteTreino(id: string): Promise<void> {
  const sb = createClient();
  await sb.from("treinos").delete().eq("id", id);
}

// ─── SONO ─────────────────────────────────────────────────────────────────────

function rowToSono(r: Record<string, unknown>): Sono {
  return {
    id: r.id as string,
    data: r.data as string,
    horaDormir: r.hora_dormir as string,
    horaAcordar: r.hora_acordar as string,
    duracaoHoras: Number(r.duracao_horas),
    qualidade: r.qualidade as number,
    notas: (r.notas as string) ?? "",
  };
}

export async function getSono(): Promise<Sono[]> {
  const sb = createClient();
  const { data } = await sb
    .from("sono")
    .select("*")
    .order("data", { ascending: false });
  return (data ?? []).map(rowToSono);
}

export async function upsertSono(s: Omit<Sono, "id"> & { id?: string }): Promise<void> {
  const sb = createClient();
  const uid = await userId();
  const row = {
    user_id: uid,
    data: s.data,
    hora_dormir: s.horaDormir,
    hora_acordar: s.horaAcordar,
    duracao_horas: s.duracaoHoras,
    qualidade: s.qualidade,
    notas: s.notas ?? null,
  };
  if (s.id) {
    await sb.from("sono").update(row).eq("id", s.id);
  } else {
    await sb.from("sono").insert(row);
  }
}

export async function deleteSono(id: string): Promise<void> {
  const sb = createClient();
  await sb.from("sono").delete().eq("id", id);
}

// ─── EXAMES DE SANGUE ─────────────────────────────────────────────────────────

function rowToExame(r: Record<string, unknown>): ExameSangue {
  return {
    id: r.id as string,
    data: r.data as string,
    laboratorio: (r.laboratorio as string) ?? "",
    resultados: (r.resultados as ExameSangue["resultados"]) ?? [],
    notas: (r.notas as string) ?? "",
  };
}

export async function getExames(): Promise<ExameSangue[]> {
  const sb = createClient();
  const { data } = await sb
    .from("exames_sangue")
    .select("*")
    .order("data", { ascending: false });
  return (data ?? []).map(rowToExame);
}

export async function upsertExame(e: Omit<ExameSangue, "id"> & { id?: string }): Promise<void> {
  const sb = createClient();
  const uid = await userId();
  const row = {
    user_id: uid,
    data: e.data,
    laboratorio: e.laboratorio ?? null,
    resultados: e.resultados,
    notas: e.notas ?? null,
  };
  if (e.id) {
    await sb.from("exames_sangue").update(row).eq("id", e.id);
  } else {
    await sb.from("exames_sangue").insert(row);
  }
}

export async function deleteExame(id: string): Promise<void> {
  const sb = createClient();
  await sb.from("exames_sangue").delete().eq("id", id);
}

// ─── BIOIMPEDÂNCIA ─────────────────────────────────────────────────────────────

function rowToBio(r: Record<string, unknown>): Bioimpedancia {
  return {
    id: r.id as string,
    data: r.data as string,
    peso: Number(r.peso),
    gorduraCorporal: Number(r.gordura_corporal),
    massaMuscular: Number(r.massa_muscular),
    agua: Number(r.agua),
    massaOssea: r.massa_ossea != null ? Number(r.massa_ossea) : undefined,
    metabolismoBasal: r.metabolismo_basal != null ? Number(r.metabolismo_basal) : undefined,
    idadeMetabolica: r.idade_metabolica != null ? Number(r.idade_metabolica) : undefined,
    notas: (r.notas as string) ?? "",
  };
}

export async function getBioimpedancias(): Promise<Bioimpedancia[]> {
  const sb = createClient();
  const { data } = await sb
    .from("bioimpedancias")
    .select("*")
    .order("data", { ascending: false });
  return (data ?? []).map(rowToBio);
}

export async function upsertBioimpedancia(b: Omit<Bioimpedancia, "id"> & { id?: string }): Promise<void> {
  const sb = createClient();
  const uid = await userId();
  const row = {
    user_id: uid,
    data: b.data,
    peso: b.peso,
    gordura_corporal: b.gorduraCorporal,
    massa_muscular: b.massaMuscular,
    agua: b.agua,
    massa_ossea: b.massaOssea ?? null,
    metabolismo_basal: b.metabolismoBasal ?? null,
    idade_metabolica: b.idadeMetabolica ?? null,
    notas: b.notas ?? null,
  };
  if (b.id) {
    await sb.from("bioimpedancias").update(row).eq("id", b.id);
  } else {
    await sb.from("bioimpedancias").insert(row);
  }
}

export async function deleteBioimpedancia(id: string): Promise<void> {
  const sb = createClient();
  await sb.from("bioimpedancias").delete().eq("id", id);
}

// ─── MEDIDAS ──────────────────────────────────────────────────────────────────

function rowToMedidas(r: Record<string, unknown>): Medidas {
  return {
    id: r.id as string,
    data: r.data as string,
    peso: Number(r.peso),
    altura: Number(r.altura),
    imc: r.imc != null ? Number(r.imc) : undefined,
    cintura: r.cintura != null ? Number(r.cintura) : undefined,
    quadril: r.quadril != null ? Number(r.quadril) : undefined,
    braco: r.braco != null ? Number(r.braco) : undefined,
    coxa: r.coxa != null ? Number(r.coxa) : undefined,
    panturrilha: r.panturrilha != null ? Number(r.panturrilha) : undefined,
    peito: r.peito != null ? Number(r.peito) : undefined,
    notas: (r.notas as string) ?? "",
  };
}

export async function getMedidas(): Promise<Medidas[]> {
  const sb = createClient();
  const { data } = await sb
    .from("medidas")
    .select("*")
    .order("data", { ascending: false });
  return (data ?? []).map(rowToMedidas);
}

export async function upsertMedida(m: Omit<Medidas, "id"> & { id?: string }): Promise<void> {
  const sb = createClient();
  const uid = await userId();
  const row = {
    user_id: uid,
    data: m.data,
    peso: m.peso,
    altura: m.altura,
    imc: m.imc ?? null,
    cintura: m.cintura ?? null,
    quadril: m.quadril ?? null,
    braco: m.braco ?? null,
    coxa: m.coxa ?? null,
    panturrilha: m.panturrilha ?? null,
    peito: m.peito ?? null,
    notas: m.notas ?? null,
  };
  if (m.id) {
    await sb.from("medidas").update(row).eq("id", m.id);
  } else {
    await sb.from("medidas").insert(row);
  }
}

export async function deleteMedida(id: string): Promise<void> {
  const sb = createClient();
  await sb.from("medidas").delete().eq("id", id);
}

// ─── NUTRIÇÃO ─────────────────────────────────────────────────────────────────

function rowToNutricao(r: Record<string, unknown>): Nutricao {
  return {
    id: r.id as string,
    data: r.data as string,
    aguaML: Number(r.agua_ml),
    calorias: r.calorias != null ? Number(r.calorias) : undefined,
    proteinas: r.proteinas != null ? Number(r.proteinas) : undefined,
    carboidratos: r.carboidratos != null ? Number(r.carboidratos) : undefined,
    gorduras: r.gorduras != null ? Number(r.gorduras) : undefined,
    notas: (r.notas as string) ?? "",
  };
}

export async function getNutricao(): Promise<Nutricao[]> {
  const sb = createClient();
  const { data } = await sb
    .from("nutricao")
    .select("*")
    .order("data", { ascending: false });
  return (data ?? []).map(rowToNutricao);
}

export async function upsertNutricao(n: Omit<Nutricao, "id"> & { id?: string }): Promise<void> {
  const sb = createClient();
  const uid = await userId();
  const row = {
    user_id: uid,
    data: n.data,
    agua_ml: n.aguaML,
    calorias: n.calorias ?? null,
    proteinas: n.proteinas ?? null,
    carboidratos: n.carboidratos ?? null,
    gorduras: n.gorduras ?? null,
    notas: n.notas ?? null,
  };
  if (n.id) {
    await sb.from("nutricao").update(row).eq("id", n.id);
  } else {
    await sb.from("nutricao").insert(row);
  }
}

export async function deleteNutricao(id: string): Promise<void> {
  const sb = createClient();
  await sb.from("nutricao").delete().eq("id", id);
}
