import { test } from "node:test";
import { strict as assert } from "node:assert";
import { createFinalReport, deliveredReportCount, projectFindings, reportBlocks, signedAuthorization, sortReportFindings, type ReportFinding, type ReportProject } from "./reports";
import type { Authorization } from "@/components/authorizations";
const project: ReportProject = { id: "p1", name: "Proyecto", client: "Cliente", type: "API", status: "Entregado", start: "2026-11-01", end: "2026-11-15" };
const finding = (id: string, severity: string, projectId = "p1"): ReportFinding => ({ id, severity, projectId, project: "Proyecto", title: id, status: "Revisado", description: "Descripción" });
test("all findings belonging to the project are included by default, not other projects", () => {
  assert.deepEqual(projectFindings([finding("a", "Baja"), finding("b", "Crítica"), finding("other", "Alta", "p2")], project).map(f => f.id), ["a", "b"]);
});
test("reports order every severity descending including legacy and unclassified findings", () => {
  assert.deepEqual(sortReportFindings([finding("low", "Baja"), finding("unknown", ""), finding("critical", "Crítico"), finding("info", "Informativa"), finding("high", "Alta"), finding("medium", "Media")]).map(f => f.id), ["critical", "high", "medium", "low", "info", "unknown"]);
});
const authorization = { id: "signed", projectId: "p1", status: "Firmada", scope: "Alcance firmado", signedAt: "2026-11-02", createdAt: "2026-11-01", testTypes: ["Caja gris"] } as Authorization;
test("only the project's signed authorization supplies scope", () => {
  assert.equal(signedAuthorization([{ ...authorization, id: "draft", status: "Borrador", signedAt: "2026-11-03" }, { ...authorization, projectId: "p2" }, authorization], "p1")?.scope, "Alcance firmado");
});
const input = { projectId: "p1", project, findings: [finding("a", "Alta")], type: "Técnico completo" as const, version: "1.0", confidentiality: "Confidencial", summary: "Resumen", methodology: "Caja gris", branding: { organization: "Consultora", latexLogo: "", latexPrimaryColor: "#CB520D" }, authorization };
test("delivery counter counts report records independently of delivered project status", () => {
  const r = createFinalReport(input);
  assert.equal(deliveredReportCount([r]), 0);
  assert.equal(deliveredReportCount([{ ...r, status: "Entregado" }, { ...r, id: "second", status: "Entregado" }]), 2);
});
test("generated reports retain date and snapshots after findings and project change", () => {
  const original = { ...input, findings: [finding("a", "Alta")], project: { ...project } };
  const r = createFinalReport(original, "2026-11-15T02:23:00.000Z");
  const first = original.findings[0]; if (!first) throw new Error("Missing finding");
  first.description = "Cambio"; original.project.name = "Cambio";
  assert.equal(r.createdAt, "2026-11-15T02:23:00.000Z"); assert.equal(r.findings[0]?.description, "Descripción"); assert.equal(r.project.name, "Proyecto");
});
test("technical reports include full detail and executive reports omit technical detail", () => {
  const technical = createFinalReport({ ...input, findings: [{ ...finding("a", "Alta"), affectedAsset: "/api", cwe: "CWE-89", cvssScore: 9.8, cvssVector: "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H", impact: "Impacto", reproductionSteps: "Pasos", recommendation: "Recomendación", references: ["OWASP"], evidences: [{ id: "e", name: "e.png", dataUrl: "data:image/png;base64,AA==", caption: "Prueba" }] }] });
  const blocks = reportBlocks(technical);
  assert.equal(blocks.filter(b => b.kind === "image").length, 1);
  assert.ok(blocks.some(b => b.kind === "text" && b.text === "Pasos"));
  assert.ok(blocks.some(b => b.kind === "text" && b.text.includes("CWE-89")));
  assert.equal(reportBlocks({ ...technical, type: "Ejecutivo" }).filter(b => b.kind === "image").length, 0);
});