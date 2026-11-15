import { encryptBackup, encryptWithKey, isEncryptedBackup, openEncrypted } from "./backup-crypto";
import type { EncryptedBackup } from "./backup-crypto";

export const DATA_KEY = "vertice-workspace-data";
export const SETTINGS_KEY = "vertice-settings";
export const AUDIT_KEY = "vertice-audit";
export const DEFAULT_LOCK_MINUTES = 15;
export function validMasterPassword(password: string) { return [...password.normalize("NFC")].length >= 12; }
export function lockMinutes(value: unknown) { return typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 1440 ? value : DEFAULT_LOCK_MINUTES; }
export function shouldAutoLock(lastActivity: number, now: number, minutes: number) { return now - lastActivity >= lockMinutes(minutes) * 60_000; }
export type VaultPayload = { data: Record<string, unknown>; settings: Record<string, unknown>; audit: unknown[] };
export function readLegacy(storage: Pick<Storage, "getItem">): VaultPayload {
  const read = (key: string, fallback: unknown) => { const value = storage.getItem(key); return value === null ? fallback : JSON.parse(value); };
  const data = read(DATA_KEY, {}); const settings = read(SETTINGS_KEY, {}); const audit = read(AUDIT_KEY, []);
  if (!data || typeof data !== "object" || Array.isArray(data) || !settings || typeof settings !== "object" || Array.isArray(settings) || !Array.isArray(audit)) throw new Error("Los datos anteriores no tienen un formato válido. No se modificó ningún archivo.");
  for (const key of ["projects", "findings", "clients", "templates", "authorizations", "reports"]) {
    if (key in data && (!Array.isArray(data[key]) || data[key].some((row: unknown) => !row || typeof row !== "object" || Array.isArray(row)))) throw new Error("Hay registros anteriores inválidos. No se modificaron los datos.");
  }
  return { data, settings, audit };
}
function encode(payload: VaultPayload) { return JSON.stringify({ ...payload.data, settings: payload.settings, audit: payload.audit }); }
function decode(text: string): VaultPayload {
  const raw = JSON.parse(text);
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new Error("Datos cifrados inválidos.");
  const { settings = {}, audit = [], ...data } = raw;
  if (!settings || typeof settings !== "object" || Array.isArray(settings) || !Array.isArray(audit)) throw new Error("Datos cifrados inválidos.");
  return { data, settings, audit };
}
export function hasVault(storage: Pick<Storage, "getItem">) {
  const text = storage.getItem(DATA_KEY); if (!text) return false;
  return isEncryptedBackup(JSON.parse(text));
}
export class VaultSession {
  private key: CryptoKey | null;
  private queue: Promise<void> = Promise.resolve();
  private failed = false;
  private active = true;
  private pending = 0;
  get unsaved() { return this.pending > 0 || this.failed; }
  constructor(private storage: Pick<Storage, "getItem" | "setItem" | "removeItem">, key: CryptoKey, private kdf: EncryptedBackup["kdf"], public payload: VaultPayload, private onError: () => void) { this.key = key; }
  update(next: Partial<VaultPayload>) {
    if (!this.active || !this.key) throw new Error("El espacio de trabajo está bloqueado.");
    this.payload = { ...this.payload, ...next }; const snapshot = encode(this.payload); const key = this.key;
    this.pending++;
    this.queue = this.queue.then(async () => {
      try { const encrypted = await encryptWithKey(snapshot, key, this.kdf); this.storage.setItem(DATA_KEY, encrypted); this.failed = false; }
      catch { this.failed = true; this.onError(); }
      finally { this.pending--; }
    });
  }
  async flush() { await this.queue; if (this.failed) throw new Error("No se pudieron guardar los cambios cifrados."); }
  async backup() { await this.queue; if (!this.key) throw new Error("Bloqueado"); return encryptWithKey(encode(this.payload), this.key, this.kdf); }
  async lock() { await this.flush(); this.active = false; this.key = null; this.payload = { data: {}, settings: {}, audit: [] }; }
}
export async function createVault(storage: Storage, password: string, onError: () => void) {
  if (!validMasterPassword(password)) throw new Error("La contraseña debe tener al menos 12 caracteres.");
  if (hasVault(storage)) throw new Error("Ya existe un espacio de trabajo cifrado.");
  const payload = readLegacy(storage);
  const encrypted = await encryptBackup(encode(payload), password);
  const opened = await openEncrypted(encrypted, password);
  if (opened.plain !== encode(payload)) throw new Error("No se pudo verificar la migración.");
  storage.setItem(DATA_KEY, encrypted);
  if (storage.getItem(DATA_KEY) !== encrypted) throw new Error("No se pudo verificar el guardado cifrado.");
  // Only remove legacy plaintext AFTER the authenticated encrypted copy is stored and verified.
  storage.removeItem(SETTINGS_KEY); storage.removeItem(AUDIT_KEY);
  return new VaultSession(storage, opened.key, opened.kdf, decode(opened.plain), onError);
}
export async function unlockVault(storage: Storage, password: string, onError: () => void) {
  const encrypted = storage.getItem(DATA_KEY); if (!encrypted) throw new Error("No hay datos cifrados.");
  const opened = await openEncrypted(encrypted, password);
  if (opened.kdf.iterations < 600_000) throw new Error("Los datos locales no cumplen el mínimo de derivación de clave.");
  return new VaultSession(storage, opened.key, opened.kdf, decode(opened.plain), onError);
}