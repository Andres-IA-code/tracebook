import { CVSS31 } from "@pandatix/js-cvss";

export const CVSS_METRICS = [
  { key: "AV", label: "Vector de ataque", options: [["N", "Red"], ["A", "Adyacente"], ["L", "Local"], ["P", "Físico"]] },
  { key: "AC", label: "Complejidad del ataque", options: [["L", "Baja"], ["H", "Alta"]] },
  { key: "PR", label: "Privilegios requeridos", options: [["N", "Ninguno"], ["L", "Bajos"], ["H", "Altos"]] },
  { key: "UI", label: "Interacción del usuario", options: [["N", "Ninguna"], ["R", "Requerida"]] },
  { key: "S", label: "Alcance", options: [["U", "Sin cambios"], ["C", "Modificado"]] },
  { key: "C", label: "Confidencialidad", options: [["N", "Ninguna"], ["L", "Baja"], ["H", "Alta"]] },
  { key: "I", label: "Integridad", options: [["N", "Ninguna"], ["L", "Baja"], ["H", "Alta"]] },
  { key: "A", label: "Disponibilidad", options: [["N", "Ninguna"], ["L", "Baja"], ["H", "Alta"]] },
] as const;
export type BaseMetrics = Record<(typeof CVSS_METRICS)[number]["key"], string>;
export const DEFAULT_METRICS: BaseMetrics = { AV: "N", AC: "L", PR: "N", UI: "N", S: "U", C: "N", I: "N", A: "N" };
export const SEVERITIES = ["Informativa", "Baja", "Media", "Alta", "Crítica"];
export function severityForScore(score: number) {
  if (score === 0) return "Informativa";
  if (score < 4) return "Baja";
  if (score < 7) return "Media";
  if (score < 9) return "Alta";
  return "Crítica";
}
export function canonicalSeverity(value: string) {
  return ({ Crítico: "Crítica", Alto: "Alta", Medio: "Media", Bajo: "Baja" } as Record<string, string>)[value] ?? value;
}
export function validCwe(value: string) { return value === "" || /^CWE-[1-9]\d*$/.test(value); }
export function validScore(value: string) { return value === "" || (/^(?:\d(?:\.\d)?|10(?:\.0)?)$/.test(value) && Number(value) <= 10); }
export function vectorFromMetrics(metrics: BaseMetrics) { return `CVSS:3.1/${CVSS_METRICS.map(m => `${m.key}:${metrics[m.key]}`).join("/")}`; }
export function parseVector(vector: string): BaseMetrics | null {
  const parts = vector.trim().split("/");
  if (parts.shift() !== "CVSS:3.1" || parts.length !== 8) return null;
  const result = { ...DEFAULT_METRICS }; const seen = new Set<string>();
  for (const part of parts) {
    const [key, value] = part.split(":");
    const metric = CVSS_METRICS.find(m => m.key === key);
    if (!metric || !value || seen.has(metric.key) || part.split(":").length !== 2 || !metric.options.some(o => o[0] === value)) return null;
    result[metric.key] = value; seen.add(metric.key);
  }
  return result;
}
// FIRST CVSS 3.1 Appendix A. The library's BaseScore uses %1000 instead of %10000;
// keep its proven impact/exploitability engine and apply the official rounding here.
export function roundup(value: number) {
  const integer = Math.round(value * 100000);
  return integer % 10000 === 0 ? integer / 100000 : (Math.floor(integer / 10000) + 1) / 10;
}
export function calculateCvss(metrics: BaseMetrics) {
  const vector = vectorFromMetrics(metrics);
  const engine = new CVSS31(vector);
  const impact = engine.Impact();
  const score = impact <= 0 ? 0 : roundup(Math.min((metrics.S === "C" ? 1.08 : 1) * (impact + engine.Exploitability()), 10));
  return { vector, score, severity: severityForScore(score) };
}