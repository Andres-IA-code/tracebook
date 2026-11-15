import { describe, test } from "node:test";
import { strict as assert } from "node:assert";
import { calculateCvss, parseVector, roundup, severityForScore, validCwe, validScore, canonicalSeverity } from "./cvss";
import { detailsFromTemplate } from "./finding-details";

describe("CVSS 3.1 base scoring", () => {
  for (const [vector, score] of [
    ["CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H", 9.8],
    ["CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H", 10],
    ["CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:N", 0],
    ["CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:H", 8.8],
    ["CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:C/C:H/I:H/A:H", 9.9],
    ["CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:C/C:L/I:L/A:N", 6.1],
  ] as const) {
    test(`official base equation: ${score} for ${vector}`, () => {
      const metrics = parseVector(vector); assert.ok(metrics);
      const result = calculateCvss(metrics);
      assert.equal(result.score, score); assert.equal(result.vector, vector);
    });
  }
  test("Appendix A rounds up to one decimal without floating-point artifacts", () => {
    assert.equal(roundup(0.1 + 0.2), 0.3); assert.equal(roundup(4.01), 4.1); assert.equal(roundup(4), 4);
  });
  for (const [scores, severity] of [[[0], "Informativa"], [[0.1, 3.9], "Baja"], [[4, 6.9], "Media"], [[7, 8.9], "Alta"], [[9, 10], "Crítica"]] as const) {
    test(`user severity thresholds: ${severity}`, () => { for (const score of scores) assert.equal(severityForScore(score), severity); });
  }
  test("saved vectors restore all eight metrics including changed scope", () => {
    assert.deepEqual(parseVector("CVSS:3.1/AV:P/AC:H/PR:H/UI:R/S:C/C:L/I:H/A:N"), { AV: "P", AC: "H", PR: "H", UI: "R", S: "C", C: "L", I: "H", A: "N" });
  });
  test("rejects incomplete, duplicate, wrong-version or invalid base vectors", () => {
    for (const value of ["CVSS:3.0/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H", "CVSS:3.1/AV:N", "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/I:H", "CVSS:3.1/AV:X/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H"]) assert.equal(parseVector(value), null);
  });
  test("CWE is optional but must use CWE-89 format", () => {
    for (const value of ["", "CWE-89", "CWE-1234"]) assert.equal(validCwe(value), true);
    for (const value of ["89", "CWE89", "cwe-89", "CWE-0", "CWE-89x"]) assert.equal(validCwe(value), false);
  });
  test("score is optional or 0.0–10.0 with at most one decimal", () => {
    for (const value of ["", "0.0", "3.9", "10.0"]) assert.equal(validScore(value), true);
    for (const value of ["-0.1", "10.1", "11", "9.85", "NaN"]) assert.equal(validScore(value), false);
  });
  test("templates carry distinct CWE, CVSS score and vector fields", () => {
    const value = detailsFromTemplate({ cwe: "CWE-89", cvssScore: 9.8, cvssVector: "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H" });
    assert.equal(value.cwe, "CWE-89"); assert.equal(value.cvssScore, 9.8); assert.ok(parseVector(value.cvssVector ?? ""));
  });
  test("legacy severity labels remain recognized", () => { assert.equal(canonicalSeverity("Crítico"), "Crítica"); assert.equal(canonicalSeverity("Bajo"), "Baja"); });
});