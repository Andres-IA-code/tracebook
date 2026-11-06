export type Theme = "light" | "dark";
const THEME_KEY = "vertice-theme";

export function readTheme(storage: Pick<Storage, "getItem">): Theme {
  try { return storage.getItem(THEME_KEY) === "light" ? "light" : "dark"; }
  catch { return "dark"; }
}

export function saveTheme(storage: Pick<Storage, "setItem">, theme: Theme) {
  storage.setItem(THEME_KEY, theme);
}

export function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.classList.toggle("light", theme === "light");
}