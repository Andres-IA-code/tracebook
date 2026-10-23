// Respaldos cifrados con contraseña usando solo la Web Crypto API (sin librerías ni red).
export const ENCRYPTED_FORMAT = "tracebook-encrypted-backup";
const AAD = new TextEncoder().encode("tracebook-encrypted-backup:v1");
const ITERATIONS = 600_000;
const MIN_ITER = 100_000;
const MAX_ITER = 10_000_000;

const ERR_PASSWORD = "Contraseña incorrecta o archivo dañado.";
const ERR_INVALID = "El archivo de respaldo no es válido.";
const ERR_VERSION = "Este respaldo fue creado con una versión más nueva de Tracebook.";

export type EncryptedBackup = {
  format: typeof ENCRYPTED_FORMAT;
  version: 1;
  app: "Tracebook";
  kdf: { name: "PBKDF2"; hash: "SHA-256"; iterations: number; salt: string };
  cipher: { name: "AES-GCM"; iv: string };
  data: string;
};

function toBase64(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}
function fromBase64(text: unknown): Uint8Array {
  if (typeof text !== "string") throw new Error(ERR_INVALID);
  try {
    const bin = atob(text);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  } catch { throw new Error(ERR_INVALID); }
}

async function deriveKey(password: string, salt: Uint8Array, iterations: number) {
  const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", hash: "SHA-256", salt: salt as BufferSource, iterations },
    base, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"],
  );
}

export function isEncryptedBackup(obj: unknown): boolean {
  return !!obj && typeof obj === "object" && (obj as { format?: unknown }).format === ENCRYPTED_FORMAT;
}

export async function encryptBackup(plainText: string, password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt, ITERATIONS);
  const cipher = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv, additionalData: AAD }, key, new TextEncoder().encode(plainText)));
  const file: EncryptedBackup = {
    format: ENCRYPTED_FORMAT, version: 1, app: "Tracebook",
    kdf: { name: "PBKDF2", hash: "SHA-256", iterations: ITERATIONS, salt: toBase64(salt) },
    cipher: { name: "AES-GCM", iv: toBase64(iv) },
    data: toBase64(cipher),
  };
  return JSON.stringify(file, null, 2);
}

export async function decryptBackup(fileText: string, password: string): Promise<string> {
  let obj: Record<string, unknown>;
  try { obj = JSON.parse(fileText) as Record<string, unknown>; } catch { throw new Error(ERR_INVALID); }
  if (!isEncryptedBackup(obj)) throw new Error(ERR_INVALID);
  if (obj["version"] !== 1) throw new Error(ERR_VERSION);
  const kdf = obj["kdf"] as Record<string, unknown> | undefined;
  const cipher = obj["cipher"] as Record<string, unknown> | undefined;
  if (!kdf || kdf["name"] !== "PBKDF2" || kdf["hash"] !== "SHA-256" || !cipher || cipher["name"] !== "AES-GCM") throw new Error(ERR_INVALID);
  const iterations = kdf["iterations"];
  if (typeof iterations !== "number" || !Number.isInteger(iterations) || iterations < MIN_ITER || iterations > MAX_ITER) throw new Error(ERR_INVALID);
  const salt = fromBase64(kdf["salt"]);
  const iv = fromBase64(cipher["iv"]);
  const data = fromBase64(obj["data"]);
  if (salt.length !== 16 || iv.length !== 12 || data.length < 16) throw new Error(ERR_INVALID);
  try {
    const key = await deriveKey(password, salt, iterations);
    const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: iv as BufferSource, additionalData: AAD }, key, data as BufferSource);
    return new TextDecoder().decode(plain);
  } catch { throw new Error(ERR_PASSWORD); }
}
