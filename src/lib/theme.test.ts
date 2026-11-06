import { describe, test } from "node:test";
import { strict as assert } from "node:assert";
import { readTheme, saveTheme } from "./theme";

describe("appearance preference", () => {
  for (const theme of ["light", "dark"] as const) {
    test(`remembers ${theme} after reopening`, () => {
      const entries = new Map<string, string>();
      const storage = {
        getItem: (key: string) => entries.get(key) ?? null,
        setItem: (key: string, value: string) => { entries.set(key, value); },
      };
      saveTheme(storage, theme);
      assert.equal(entries.get("vertice-theme"), theme);
      assert.equal(readTheme(storage), theme);
    });
  }
  test("defaults to dark without a saved choice", () => {
    assert.equal(readTheme({ getItem: () => null }), "dark");
  });
});