import { test } from "node:test";
import { strict as assert } from "node:assert";
import { createVault, unlockVault, validMasterPassword, DEFAULT_LOCK_MINUTES, shouldAutoLock, DATA_KEY, SETTINGS_KEY, AUDIT_KEY, lockMinutes } from "./data-vault";
import { decryptBackup } from "./backup-crypto";
function storage() {
  const values = new Map<string, string>();
  return { getItem: (k: string) => values.get(k) ?? null, setItem: (k: string, v: string) => { values.set(k, v); }, removeItem: (k: string) => { values.delete(k); }, clear: () => values.clear(), key: (i: number) => [...values.keys()][i] ?? null, get length() { return values.size; } };
}
const password = "Frase-maestra-de-prueba-82";
test("master password requires at least 12 characters", () => { assert.equal(validMasterPassword("12345678901"), false); assert.equal(validMasterPassword("123456789012"), true); });
test("auto lock defaults to 15 minutes and triggers at the configured boundary", () => { assert.equal(DEFAULT_LOCK_MINUTES, 15); assert.equal(shouldAutoLock(0, 899999, 15), false); assert.equal(shouldAutoLock(0, 900000, 15), true); assert.equal(shouldAutoLock(0, 120000, 2), true); assert.equal(lockMinutes(0), 15); });
test("migration encrypts all legacy data including settings and audit without storing password or key", async () => {
  const s = storage(); const data = { projects: [{ id: "p", name: "Confidencial" }], authorizations: [{ scope: "Alcance privado" }], findings: [{ evidences: [{ dataUrl: "imagen privada" }] }], reports: [{ summary: "Informe privado" }] };
  s.setItem(DATA_KEY, JSON.stringify(data)); s.setItem(SETTINGS_KEY, JSON.stringify({ organization: "Cliente privado" })); s.setItem(AUDIT_KEY, JSON.stringify([{ detail: "Auditoría privada" }]));
  const session = await createVault(s, password, () => assert.fail("save failed"));
  const encrypted = s.getItem(DATA_KEY) ?? ""; const envelope = JSON.parse(encrypted);
  assert.equal(envelope.kdf.iterations, 600000); assert.equal(envelope.kdf.hash, "SHA-256"); assert.equal(envelope.cipher.name, "AES-GCM");
  for (const text of [password, "Confidencial", "Cliente privado", "Auditoría privada", "imagen privada"]) assert.equal(encrypted.includes(text), false);
  assert.equal(s.getItem(SETTINGS_KEY), null); assert.equal(s.getItem(AUDIT_KEY), null);
  assert.deepEqual(session.payload.data, data);
  const backup = JSON.parse(await decryptBackup(await session.backup(), password)); assert.deepEqual(backup.projects, data.projects); assert.equal(backup.audit[0].detail, "Auditoría privada");
  await session.lock(); assert.deepEqual(session.payload, { data: {}, settings: {}, audit: [] }); assert.throws(() => session.update({ data }));
  const unlocked = await unlockVault(s, password, () => {}); assert.deepEqual(unlocked.payload.data, data);
  await assert.rejects(unlockVault(s, "contraseña incorrecta", () => {}));
});
test("serialized writes preserve newest data, use fresh IVs and authenticate against tampering", async () => {
  const s = storage(); const session = await createVault(s, password, () => {}); const before = JSON.parse(s.getItem(DATA_KEY) ?? "{}");
  session.update({ data: { projects: [{ id: "first" }] } }); session.update({ data: { projects: [{ id: "last" }] } }); session.update({ audit: [{ detail: "latest" }] }); await session.flush();
  const after = JSON.parse(s.getItem(DATA_KEY) ?? "{}"); assert.notEqual(before.cipher.iv, after.cipher.iv);
  const restored = await unlockVault(s, password, () => {}); assert.deepEqual(restored.payload.data["projects"], [{ id: "last" }]); assert.deepEqual(restored.payload.audit, [{ detail: "latest" }]);
  after.data = (after.data[0] === "A" ? "B" : "A") + after.data.slice(1); s.setItem(DATA_KEY, JSON.stringify(after)); await assert.rejects(unlockVault(s, password, () => {}));
});
test("failed migration keeps original plaintext intact", async () => {
  const s = storage(); s.setItem(DATA_KEY, '{"projects":[{"name":"Original"}]}'); s.setItem(SETTINGS_KEY, '{"organization":"Original"}');
  const original = s.getItem(DATA_KEY); s.setItem = () => { throw new Error("Disk full"); };
  await assert.rejects(createVault(s, password, () => {})); assert.equal(s.getItem(DATA_KEY), original); assert.equal(s.getItem(SETTINGS_KEY), '{"organization":"Original"}');
});