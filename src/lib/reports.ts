import type { FindingDetails } from "./finding-details";
import { normalizeFindingDetails } from "./finding-details";
import type { Authorization } from "@/components/authorizations";

export type ReportProject = { id: string; name: string; client: string; type: string; status: string; start: string; end: string };
export type ReportFinding = FindingDetails & { id: string; title: string; severity: string; status: string; description: string; projectId?: string | undefined; project: string };
export type ReportBranding = { organization: string; latexLogo: string; latexPrimaryColor: string };
export type FinalReport = {
  id: string; projectId: string; project: ReportProject; findings: ReportFinding[];
  type: "Técnico completo" | "Ejecutivo"; createdAt: string; status: "En preparación" | "Entregado";
  version: string; confidentiality: string; summary: string; methodology: string;
  branding: ReportBranding; authorization: Authorization | null;
  revisions: { version: string; date: string; description: string }[];
};
export const REPORT_SEVERITIES = ["Crítica", "Alta", "Media", "Baja", "Informativa", "Sin clasificar"];
export function reportSeverity(value: string) {
  const text = (value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  return text.startsWith("crit") ? "Crítica" : text.startsWith("alt") ? "Alta" : text.startsWith("med") ? "Media" : text.startsWith("baj") ? "Baja" : text.startsWith("info") ? "Informativa" : "Sin clasificar";
}
export function projectFindings(findings: ReportFinding[], project: ReportProject) {
  return findings.filter(f => f.projectId ? f.projectId === project.id : (f.project ?? "").trim().toLowerCase() === project.name.trim().toLowerCase());
}
export function sortReportFindings(findings: ReportFinding[]) {
  return [...findings].sort((a, b) => REPORT_SEVERITIES.indexOf(reportSeverity(a.severity)) - REPORT_SEVERITIES.indexOf(reportSeverity(b.severity)));
}
export function signedAuthorization(items: Authorization[], projectId: string) {
  return items.filter(a => a.projectId === projectId && a.status === "Firmada").sort((a, b) => (b.signedAt ?? b.createdAt).localeCompare(a.signedAt ?? a.createdAt))[0] ?? null;
}
export function deliveredReportCount(reports: FinalReport[]) { return reports.filter(r => r.status === "Entregado").length; }
export function createFinalReport(input: Omit<FinalReport, "id" | "createdAt" | "status" | "revisions">, now = new Date().toISOString()): FinalReport {
  return structuredClone({ ...input, findings: sortReportFindings(input.findings.map(f => ({ ...f, ...normalizeFindingDetails(f) }))), id: crypto.randomUUID(), createdAt: now, status: "En preparación", revisions: [{ version: input.version, date: now, description: "Emisión del informe" }] });
}
export const REPORT_PALETTE = { paper: "FFFFFF", ink: "15110D", muted: "555555", line: "D7D7D7", primary: "CB520D" };
export function reportColor(value: string) { return /^#[0-9a-f]{6}$/i.test(value) ? value.slice(1) : REPORT_PALETTE.primary; }
export function localImage(value: string) { return /^data:image\/(png|jpeg);base64,[A-Za-z0-9+/=\s]+$/.test(value); }
export type ReportBlock = { kind: "title" | "heading" | "text"; text: string } | { kind: "table"; rows: string[][] } | { kind: "chart"; counts: { severity: string; count: number }[] } | { kind: "image"; dataUrl: string; caption: string; logo?: boolean } | { kind: "break" };
export function reportBlocks(r: FinalReport): ReportBlock[] {
  const blocks: ReportBlock[] = [];
  const text = (value: string) => blocks.push({ kind: "text", text: value || "—" });
  const heading = (value: string) => blocks.push({ kind: "heading", text: value });
  if (localImage(r.branding.latexLogo)) blocks.push({ kind: "image", dataUrl: r.branding.latexLogo, caption: "", logo: true });
  text(r.branding.organization);
  blocks.push({ kind: "title", text: r.project.name });
  text(`Informe ${r.type === "Ejecutivo" ? "ejecutivo" : "técnico completo"} de pentest`);
  blocks.push({ kind: "table", rows: [["Documento", r.id], ["Cliente", r.project.client], ["Fechas de evaluación", `${r.project.start} — ${r.project.end}`], ["Fecha de emisión", r.createdAt.slice(0, 10)], ["Versión", r.version], ["Confidencialidad", r.confidentiality]] });
  blocks.push({ kind: "break" });
  heading("Control de versiones");
  blocks.push({ kind: "table", rows: [["Versión", "Fecha", "Cambios"], ...r.revisions.map(v => [v.version, v.date.slice(0, 10), v.description])] });
  heading("Resumen ejecutivo"); text(r.summary);
  text(`Total de hallazgos incluidos: ${r.findings.length}`);
  blocks.push({ kind: "chart", counts: REPORT_SEVERITIES.map(severity => ({ severity, count: r.findings.filter(f => reportSeverity(f.severity) === severity).length })) });
  heading("Alcance y metodología");
  text(r.authorization?.scope || "Sin alcance registrado en una autorización firmada del proyecto.");
  if (r.authorization) { text(`Autorización: ${r.authorization.id} · Firmante: ${r.authorization.signedBy || r.authorization.signer} · Fecha de firma: ${r.authorization.signedAt?.slice(0, 10) || "—"}`); text(`Exclusiones: ${r.authorization.exclusions || "—"}`); text(`Ventana autorizada: ${r.authorization.windowStart} — ${r.authorization.windowEnd}`); }
  text(r.methodology);
  heading("Tabla resumen de hallazgos");
  blocks.push({ kind: "table", rows: [["ID", "Título", "Severidad", "CVSS", "Estado"], ...r.findings.map(f => [f.id, f.title, reportSeverity(f.severity), f.cvssScore?.toFixed(1) ?? "—", f.status])] });
  if (r.type === "Técnico completo") {
    blocks.push({ kind: "break" }); heading("Detalle de hallazgos");
    r.findings.forEach(f => {
      heading(`${f.id} — ${f.title}`);
      text(`Severidad: ${reportSeverity(f.severity)} · Estado: ${f.status}`);
      text(`Activo afectado: ${f.affectedAsset || "—"}`);
      text(`CVSS: ${f.cvssScore?.toFixed(1) ?? "—"} · Vector: ${f.cvssVector || "—"}`);
      text(`CWE: ${f.cwe || "—"}`);
      for (const [label, value] of [["Descripción", f.description], ["Impacto", f.impact], ["Pasos para reproducir", f.reproductionSteps]] as const) { heading(label); text(value ?? ""); }
      heading("Evidencias");
      const images = (f.evidences ?? []).filter(e => localImage(e.dataUrl));
      if (!images.length) text("Sin evidencias adjuntas.");
      images.forEach(e => blocks.push({ kind: "image", dataUrl: e.dataUrl, caption: e.caption || e.name }));
      heading("Recomendación"); text(f.recommendation ?? "");
      heading("Referencias"); (f.references?.length ? f.references : ["—"]).forEach(text);
    });
  }
  return blocks;
}
const escapeHtml = (text: string) => String(text ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] ?? c));
export function finalReportHtml(r: FinalReport) {
  const color = reportColor(r.branding.latexPrimaryColor);
  const body = reportBlocks(r).map(b => {
    if (b.kind === "break") return '<div class="page-break"></div>';
    if (b.kind === "image") return `<figure class="${b.logo ? "logo" : "evidence"}"><img src="${b.dataUrl}" alt="${escapeHtml(b.caption)}"><figcaption>${escapeHtml(b.caption)}</figcaption></figure>`;
    if (b.kind === "table") return `<table>${b.rows.map((row, i) => `<tr>${row.map(cell => `<${i ? "td" : "th"}>${escapeHtml(cell)}</${i ? "td" : "th"}>`).join("")}</tr>`).join("")}</table>`;
    if (b.kind === "chart") return `<div class="chart" role="img" aria-label="Hallazgos por severidad">${b.counts.map(c => `<div><span>${escapeHtml(c.severity)}</span><meter min="0" max="${Math.max(1, r.findings.length)}" value="${c.count}">${c.count}</meter><b>${c.count}</b></div>`).join("")}</div>`;
    return `<${b.kind === "title" ? "h1" : b.kind === "heading" ? "h2" : "p"}>${escapeHtml(b.text)}</${b.kind === "title" ? "h1" : b.kind === "heading" ? "h2" : "p"}>`;
  }).join("");
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; style-src 'unsafe-inline';"><title>${escapeHtml(r.project.name)} — Informe</title><style>:root{color-scheme:only light;--paper:#${REPORT_PALETTE.paper};--ink:#${REPORT_PALETTE.ink};--primary:#${color};--line:#${REPORT_PALETTE.line}}*{box-sizing:border-box}body{background:var(--paper);color:var(--ink);font:14px Arial,sans-serif;margin:0;padding:36px;overflow-wrap:anywhere}h1{font-size:30px;margin:32px 0}h2{font-size:19px;border-bottom:2px solid var(--primary);padding-bottom:8px;margin-top:28px}p{white-space:pre-wrap;line-height:1.6}table{border-collapse:collapse;width:100%;table-layout:fixed;font-size:12px}th,td{padding:8px;border:1px solid var(--line);text-align:left;white-space:pre-wrap}figure{margin:20px 0;break-inside:avoid}img{max-width:100%;max-height:650px;object-fit:contain}.logo img{max-width:180px;max-height:100px}figcaption{margin-top:8px;white-space:pre-wrap}.chart>div{display:grid;grid-template-columns:110px 1fr 32px;gap:10px;margin:12px 0}meter{width:100%;accent-color:var(--primary)}meter::-webkit-meter-optimum-value{background:var(--primary)}.page-break{border-top:1px solid var(--line);margin:48px 0;break-before:page}@page{size:A4;margin:20mm}@media print{body{padding:0}.page-break{border:0;margin:0}}</style></head><body>${body}</body></html>`;
}