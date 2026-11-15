import { describe, test } from "node:test";
import { strict as assert } from "node:assert";
import { normalizeFindingDetails, detailsFromTemplate, parseReferences, moveEvidence, type Evidence } from "./finding-details";

describe("finding details", () => {
  test("legacy findings have empty new fields", () => {
    assert.deepEqual(normalizeFindingDetails({ description: "Original" }), { affectedAsset: "", impact: "", reproductionSteps: "", recommendation: "", references: [], evidences: [] });
  });
  test("templates populate description, impact, recommendation and references", () => {
    const template = { description: "Descripción técnica", impact: "Acceso no autorizado", recommendation: "Validar permisos", references: ["CWE-284", "OWASP A01"] };
    const result = detailsFromTemplate(template);
    assert.deepEqual(result, template);
    result.references.push("CVE-2026-0001");
    assert.equal(template.references.length, 2);
  });
  test("references are stored as a list", () => {
    assert.deepEqual(parseReferences(" OWASP A01\n\nCWE-284\r\nhttps://example.org/ref "), ["OWASP A01", "CWE-284", "https://example.org/ref"]);
  });
  const images: Evidence[] = [{ id: "a", name: "a.png", dataUrl: "data:image/png;base64,AA==", caption: "Primer paso" }, { id: "b", name: "b.jpg", dataUrl: "data:image/jpeg;base64,AA==", caption: "Segundo paso" }];
  test("multiple images and captions survive serialization", () => {
    assert.deepEqual(normalizeFindingDetails(JSON.parse(JSON.stringify({ evidences: images }))).evidences, images);
  });
  test("reordering retains both images and their captions", () => {
    assert.deepEqual(moveEvidence(images, "b", -1), [images[1], images[0]]);
    assert.deepEqual(moveEvidence(images, "a", 1), [images[1], images[0]]);
    assert.deepEqual(moveEvidence(images, "a", -1), images);
  });
  test("imported evidence cannot load external images or SVG", () => {
    assert.equal(normalizeFindingDetails({ evidences: [...images, { id: "remote", name: "x", dataUrl: "https://example.org/x.png", caption: "" }, { id: "svg", name: "x", dataUrl: "data:image/svg+xml;base64,AA==", caption: "" }] }).evidences.length, 2);
  });
});