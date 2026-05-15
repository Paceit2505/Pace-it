export type TreinoTipo =
  | "musculacao"
  | "cardio"
  | "hiit"
  | "yoga"
  | "pilates"
  | "natacao"
  | "ciclismo"
  | "corrida"
  | "outro";

export interface Treino {
  id: string;
  data: string; // ISO date
  tipo: TreinoTipo;
  duracaoMin: number;
  intensidade: number; // 1-10
  exercicios: string;
  calorias?: number;
  notas?: string;
}

export interface Sono {
  id: string;
  data: string;
  horaDormir: string; // HH:mm
  horaAcordar: string; // HH:mm
  duracaoHoras: number;
  qualidade: number; // 1-5
  notas?: string;
}

export interface ResultadoExame {
  nome: string;
  valor: string;
  unidade: string;
  referencia?: string;
  status?: "normal" | "alto" | "baixo";
}

export interface ExameSangue {
  id: string;
  data: string;
  laboratorio?: string;
  resultados: ResultadoExame[];
  notas?: string;
}

export interface Bioimpedancia {
  id: string;
  data: string;
  peso: number;
  gorduraCorporal: number; // %
  massaMuscular: number; // kg
  agua: number; // %
  massaOssea?: number; // kg
  metabolismoBasal?: number; // kcal
  idadeMetabolica?: number;
  notas?: string;
}

export interface Medidas {
  id: string;
  data: string;
  peso: number;
  altura: number; // cm
  imc?: number;
  cintura?: number; // cm
  quadril?: number; // cm
  braco?: number; // cm
  coxa?: number; // cm
  panturrilha?: number; // cm
  peito?: number; // cm
  notas?: string;
}

export interface Nutricao {
  id: string;
  data: string;
  calorias?: number;
  proteinas?: number; // g
  carboidratos?: number; // g
  gorduras?: number; // g
  aguaML: number;
  notas?: string;
}

export interface HealthData {
  treinos: Treino[];
  sono: Sono[];
  examesSangue: ExameSangue[];
  bioimpedancias: Bioimpedancia[];
  medidas: Medidas[];
  nutricao: Nutricao[];
}
