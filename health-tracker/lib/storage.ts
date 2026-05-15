"use client";

import { HealthData } from "./types";

const KEY = "health_tracker_data";

const empty: HealthData = {
  treinos: [],
  sono: [],
  examesSangue: [],
  bioimpedancias: [],
  medidas: [],
  nutricao: [],
};

export function loadData(): HealthData {
  if (typeof window === "undefined") return empty;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty;
    return { ...empty, ...JSON.parse(raw) };
  } catch {
    return empty;
  }
}

export function saveData(data: HealthData): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(data));
}

export function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}
