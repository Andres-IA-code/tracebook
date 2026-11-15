import { useEffect, useRef, useState, type ReactNode } from "react";
import { Eye, EyeOff, LockKeyhole, ShieldCheck } from "lucide-react";
import { Button } from "./ui/button";
import { BRAND } from "@/brand";
import logo from "@/assets/tracebook-logo.png";
import { passwordStrength } from "@/lib/passphrase";
import { applyTheme, readTheme } from "@/lib/theme";
import { createVault, hasVault, unlockVault, validMasterPassword, shouldAutoLock, lockMinutes, type VaultSession } from "@/lib/data-vault";

export function VaultGate({ children }: { children: (session: VaultSession, lock: () => void) => ReactNode }) {
  const [initialized, setInitialized] = useState(false); const [exists, setExists] = useState(false);
  const [session, setSession] = useState<VaultSession | null>(null); const current = useRef<VaultSession | null>(null);
  const [password, setPassword] = useState(""); const [repeat, setRepeat] = useState(""); const [confirmed, setConfirmed] = useState(false);
  const [show, setShow] = useState(false); const [busy, setBusy] = useState(false); const [error, setError] = useState(""); const [saveError, setSaveError] = useState(false);
  const locking = useRef(false);
  useEffect(() => { applyTheme(readTheme(window.localStorage)); try { setExists(hasVault(window.localStorage)); setInitialized(true); } catch { setError("No se pudieron leer los datos locales. No se modificaron ni borraron."); } }, []);
  const lock = async () => {
    const value = current.current; if (!value || locking.current) return; locking.current = true;
    try { await value.lock(); current.current = null; setSession(null); setPassword(""); setRepeat(""); setConfirmed(false); setShow(false); setError(""); setExists(true); }
    catch { setSaveError(true); }
    finally { locking.current = false; }
  };
  useEffect(() => {
    if (!session) return;
    let last = Date.now();
    const expired = () => shouldAutoLock(last, Date.now(), lockMinutes(session.payload.settings["autoLockMinutes"]));
    const activity = () => { if (expired()) void lock(); else last = Date.now(); };
    const check = () => { if (expired()) void lock(); };
    const events = ["pointerdown", "pointermove", "keydown", "wheel", "touchstart"];
    events.forEach(e => window.addEventListener(e, activity, { passive: true }));
    document.addEventListener("visibilitychange", check); window.addEventListener("focus", check);
    const timer = window.setInterval(check, 1000);
    const preventLoss = (event: BeforeUnloadEvent) => { if (session.unsaved) { event.preventDefault(); event.returnValue = ""; } };
    window.addEventListener("beforeunload", preventLoss);
    return () => { events.forEach(e => window.removeEventListener(e, activity)); document.removeEventListener("visibilitychange", check); window.removeEventListener("focus", check); window.removeEventListener("beforeunload", preventLoss); window.clearInterval(timer); };
  }, [session]);
  const submit = async () => {
    if (busy || !initialized || (!exists && (!validMasterPassword(password) || password !== repeat || !confirmed))) return;
    setBusy(true); setError("");
    try {
      const next = await (exists ? unlockVault : createVault)(window.localStorage, password, () => setSaveError(true));
      current.current = next; setSession(next); setExists(true); setPassword(""); setRepeat(""); setConfirmed(false); setShow(false); setSaveError(false);
    } catch (e) { setError(e instanceof Error ? e.message : "No se pudo desbloquear."); }
    finally { setBusy(false); }
  };
  if (session) return <>{children(session, () => void lock())}{saveError && <div className="vault-save-warning" role="alert">No se pudieron guardar los cambios cifrados. No cierres la app: creá una copia de seguridad o liberá espacio e intentá guardar otra vez.<Button variant="outline" onClick={() => { session.update({}); void session.flush().then(() => setSaveError(false)).catch(() => setSaveError(true)); }}>Reintentar</Button></div>}</>;
  const strength = passwordStrength(password); const level = strength === "fuerte" ? 3 : strength === "aceptable" ? 2 : 1;
  return <main className="vault-screen"><div className="vault-brand"><img src={logo} alt=""/><h1>{BRAND.name}</h1><p>{BRAND.tagline}</p></div><form className="vault-form" onSubmit={e => { e.preventDefault(); void submit(); }}><div className="section-head"><h2>{exists ? "Desbloquear" : "Crear contraseña maestra"}</h2><LockKeyhole/></div>
    <label className="form-field" htmlFor="master-password">Contraseña maestra<div className="password-field"><input id="master-password" type={show ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} autoComplete={exists ? "current-password" : "new-password"} required minLength={exists ? 1 : 12}/><Button type="button" variant="ghost" size="icon" aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"} onClick={() => setShow(!show)}>{show ? <EyeOff/> : <Eye/>}</Button></div></label>
    {!exists && <><div className="strength-meter" data-level={level} aria-live="polite"><span className="strength-bars">{[1, 2, 3].map(i => <i key={i} className={password && i <= level ? "on" : ""}/>)}</span><small>Fortaleza: {password ? strength : "mínimo 12 caracteres"}</small></div><label className="form-field" htmlFor="master-repeat">Confirmar contraseña<input id="master-repeat" type={show ? "text" : "password"} value={repeat} onChange={e => setRepeat(e.target.value)} autoComplete="new-password" required minLength={12}/></label>{repeat && repeat !== password && <p className="form-error">Las contraseñas no coinciden.</p>}<p className="form-error">Si olvidás la contraseña maestra, no podrás recuperar tus datos. No existe una opción para restablecerla.</p><label className="auth-consent"><input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)}/>Entiendo que si olvido la contraseña maestra perderé el acceso a mis datos.</label></>}
    {exists && <p className="field-help">Si olvidás la contraseña maestra, no podrás recuperar los datos.</p>}
    {error && <p className="form-error" role="alert">{error}</p>}
    <Button type="submit" disabled={busy || !initialized || !password || (!exists && (!validMasterPassword(password) || password !== repeat || !confirmed))}><ShieldCheck/>{busy ? "Procesando…" : exists ? "Desbloquear" : "Crear y proteger datos"}</Button>
  </form></main>;
}