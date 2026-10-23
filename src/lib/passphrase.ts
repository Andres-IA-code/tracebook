import { WORDLIST_ES } from "@/lib/wordlist-es";

export type Strength = "débil" | "aceptable" | "fuerte";

/** Índice uniforme en [0, max) con crypto.getRandomValues y descarte para evitar sesgo de módulo. */
function randomIndex(max: number): number {
  const limit = Math.floor(0x1_0000_0000 / max) * max;
  const buf = new Uint32Array(1);
  for (;;) {
    crypto.getRandomValues(buf);
    const v = buf[0]!;
    if (v < limit) return v % max;
  }
}

export function generatePassphrase(words = 5): string {
  return Array.from({ length: words }, () => WORDLIST_ES[randomIndex(WORDLIST_ES.length)]!).join("-");
}

const WORDSET = new Set(WORDLIST_ES);
function isGeneratedPassphrase(pw: string): boolean {
  const parts = pw.split("-");
  return parts.length === 5 && parts.every(p => WORDSET.has(p));
}

const BANNED = ["password", "contraseña", "contrasena", "tracebook", "pentest", "admin", "qwerty", "123456"];
const KEYBOARD_ROWS = ["qwertyuiop", "asdfghjkl", "zxcvbnm", "1234567890"];

function hasSequence(pw: string): boolean {
  const s = pw.toLowerCase();
  for (let i = 0; i + 4 <= s.length; i++) {
    const chunk = s.slice(i, i + 4);
    let up = true, down = true;
    for (let j = 1; j < 4; j++) {
      const d = chunk.charCodeAt(j) - chunk.charCodeAt(j - 1);
      if (d !== 1) up = false;
      if (d !== -1) down = false;
    }
    if ((up || down) && /^[a-z0-9]+$/.test(chunk)) return true;
    if (KEYBOARD_ROWS.some(r => r.includes(chunk))) return true;
  }
  return false;
}

export function passwordStrength(pw: string): Strength {
  if (isGeneratedPassphrase(pw)) return "fuerte";
  const lower = /[a-zñáéíóúü]/.test(pw), upper = /[A-ZÑÁÉÍÓÚÜ]/.test(pw), digit = /[0-9]/.test(pw);
  const symbol = /[^A-Za-z0-9ñáéíóúüÑÁÉÍÓÚÜ]/.test(pw);
  const onlyLetters = /^[A-Za-zñáéíóúüÑÁÉÍÓÚÜ]+$/.test(pw), onlyDigits = /^[0-9]+$/.test(pw);
  const low = pw.toLowerCase();
  if (pw.length < 12) return "débil";
  if ((onlyLetters || onlyDigits) && pw.length < 16) return "débil";
  if (/(.)\1{3,}/u.test(pw)) return "débil";
  if (hasSequence(pw)) return "débil";
  if (BANNED.some(b => low.includes(b))) return "débil";
  const types = [lower, upper, digit, symbol].filter(Boolean).length;
  if (pw.length >= 20 || (pw.length >= 16 && types >= 3)) return "fuerte";
  return "aceptable";
}
