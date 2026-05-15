import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export function fmtDate(iso: string) {
  return format(parseISO(iso), "dd/MM/yyyy", { locale: ptBR });
}

export function fmtDateShort(iso: string) {
  return format(parseISO(iso), "dd/MM", { locale: ptBR });
}

export function today() {
  return format(new Date(), "yyyy-MM-dd");
}

export function calcIMC(peso: number, alturaCm: number): number {
  const alturaM = alturaCm / 100;
  return parseFloat((peso / (alturaM * alturaM)).toFixed(1));
}

export function imcCategoria(imc: number): { label: string; color: string } {
  if (imc < 18.5) return { label: "Abaixo do peso", color: "text-blue-500" };
  if (imc < 25) return { label: "Peso normal", color: "text-green-500" };
  if (imc < 30) return { label: "Sobrepeso", color: "text-yellow-500" };
  if (imc < 35) return { label: "Obesidade I", color: "text-orange-500" };
  if (imc < 40) return { label: "Obesidade II", color: "text-red-500" };
  return { label: "Obesidade III", color: "text-red-700" };
}

export function calcSonoDuracao(dormir: string, acordar: string): number {
  const [dh, dm] = dormir.split(":").map(Number);
  const [ah, am] = acordar.split(":").map(Number);
  let mins = ah * 60 + am - (dh * 60 + dm);
  if (mins < 0) mins += 24 * 60;
  return parseFloat((mins / 60).toFixed(1));
}

export function treinoTipoLabel(tipo: string): string {
  const map: Record<string, string> = {
    musculacao: "Musculação",
    cardio: "Cardio",
    hiit: "HIIT",
    yoga: "Yoga",
    pilates: "Pilates",
    natacao: "Natação",
    ciclismo: "Ciclismo",
    corrida: "Corrida",
    outro: "Outro",
  };
  return map[tipo] ?? tipo;
}
