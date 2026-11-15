export type Evidence = { id: string; name: string; dataUrl: string; caption: string };
export type TechnicalDetails = { cwe?: string; cvssScore?: number | undefined; cvssVector?: string; description?: string; impact?: string; recommendation?: string; references?: string[] };
export type FindingDetails = TechnicalDetails & { affectedAsset?: string; reproductionSteps?: string; evidences?: Evidence[] };

export function normalizeFindingDetails(value: FindingDetails) {
  return { affectedAsset: value.affectedAsset ?? "", impact: value.impact ?? "", reproductionSteps: value.reproductionSteps ?? "", recommendation: value.recommendation ?? "", references: Array.isArray(value.references) ? value.references.filter(r => typeof r === "string") : [], evidences: Array.isArray(value.evidences) ? value.evidences.filter(e => e && typeof e.id === "string" && typeof e.dataUrl === "string" && /^data:image\/(png|jpeg);base64,/.test(e.dataUrl)).map(e => ({ ...e, caption: e.caption ?? "" })) : [] };
}

export function detailsFromTemplate(template: TechnicalDetails) {
  return { ...(template.cwe !== undefined ? { cwe: template.cwe } : {}), ...(template.cvssScore !== undefined ? { cvssScore: template.cvssScore } : {}), ...(template.cvssVector !== undefined ? { cvssVector: template.cvssVector } : {}), description: template.description ?? "", impact: template.impact ?? "", recommendation: template.recommendation ?? "", references: [...(template.references ?? [])] };
}

export function parseReferences(text: string) {
  return text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
}

export function moveEvidence(items: Evidence[], id: string, direction: -1 | 1) {
  const index = items.findIndex(item => item.id === id);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= items.length) return items;
  const next = [...items];
  const first = next[index]; const second = next[target];
  if (!first || !second) return items;
  next[index] = second; next[target] = first;
  return next;
}