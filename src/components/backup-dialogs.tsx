import { useRef, useState } from "react";
import { AlertTriangle, Copy, Download, Eye, EyeOff, KeyRound, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generatePassphrase, passwordStrength, type Strength } from "@/lib/passphrase";

function StrengthMeter({ value }: { value: string }) {
  if (!value) return null;
  const s: Strength = passwordStrength(value);
  const level = s === "débil" ? 1 : s === "aceptable" ? 2 : 3;
  return <div className="strength-meter" data-level={level} aria-live="polite">
    <span className="strength-bars">{[1, 2, 3].map(i => <i key={i} className={i <= level ? "on" : ""} />)}</span>
    <small>Fortaleza: {s}</small>
  </div>;
}

function PasswordInput({ id, value, onChange, show, onToggle, autoComplete, inputRef }: { id: string; value: string; onChange: (v: string) => void; show: boolean; onToggle?: () => void; autoComplete: string; inputRef?: React.Ref<HTMLInputElement> }) {
  return <div className="password-field">
    <input ref={inputRef} id={id} type={show ? "text" : "password"} value={value} onChange={e => onChange(e.target.value)} autoComplete={autoComplete} spellCheck={false} autoCapitalize="off" autoCorrect="off" />
    {onToggle ? <Button type="button" variant="ghost" size="icon" aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"} onClick={onToggle}>{show ? <EyeOff /> : <Eye />}</Button> : null}
  </div>;
}

export function ExportBackupDialog({ onClose, onExport }: { onClose: () => void; onExport: (mode: "encrypted" | "plain", password: string) => Promise<void> }) {
  const [mode, setMode] = useState<"encrypted" | "plain">("encrypted");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [show, setShow] = useState(false);
  const [generated, setGenerated] = useState("");
  const [copyMsg, setCopyMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const genRef = useRef<HTMLInputElement>(null);

  const clear = () => { setPw(""); setPw2(""); setGenerated(""); setCopyMsg(""); };
  const close = () => { clear(); onClose(); };
  const generate = () => { const p = generatePassphrase(); setPw(p); setPw2(p); setGenerated(p); setShow(true); setCopyMsg(""); };
  const copy = async () => {
    try { await navigator.clipboard.writeText(generated); setCopyMsg("Copiada al portapapeles."); }
    catch { genRef.current?.focus(); genRef.current?.select(); setCopyMsg("Copialo manualmente con Ctrl+C"); }
  };
  const weak = passwordStrength(pw) === "débil";
  const mismatch = pw !== pw2;
  const canExport = !busy && (mode === "plain" || (!weak && !mismatch));
  const submit = async () => {
    if (!canExport) return;
    setBusy(true); setError("");
    try { await onExport(mode, mode === "encrypted" ? pw : ""); clear(); onClose(); }
    catch { setError("No se pudo crear el respaldo."); }
    finally { setBusy(false); }
  };

  return <div className="modal-backdrop" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget && !busy) close(); }}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="export-title">
    <div className="modal-head"><div><small>Respaldo</small><h2 id="export-title">Exportar datos</h2></div><Button variant="ghost" size="icon" aria-label="Cerrar" disabled={busy} onClick={close}><X /></Button></div>
    <form onSubmit={e => { e.preventDefault(); void submit(); }}>
      <div className="backup-options" role="radiogroup" aria-label="Tipo de respaldo">
        <label className="auth-consent"><input type="radio" name="backup-mode" checked={mode === "encrypted"} onChange={() => setMode("encrypted")} /> <span><b>Cifrado con contraseña (recomendado)</b></span></label>
        <label className="auth-consent"><input type="radio" name="backup-mode" checked={mode === "plain"} onChange={() => setMode("plain")} /> <span><b>Sin cifrar</b></span></label>
      </div>
      {mode === "plain" ? <p className="form-error"><AlertTriangle style={{ display: "inline", width: 14, height: 14 }} /> Cualquier persona que tenga el archivo podrá leer tus proyectos, hallazgos y datos de clientes.</p> : <>
        <label className="form-field" htmlFor="backup-pw">Contraseña
          <PasswordInput id="backup-pw" value={pw} onChange={v => { setPw(v); if (generated && v !== generated) setGenerated(""); }} show={show} onToggle={() => setShow(!show)} autoComplete="new-password" />
          <StrengthMeter value={pw} />
        </label>
        <label className="form-field" htmlFor="backup-pw2">Confirmar contraseña
          <PasswordInput id="backup-pw2" value={pw2} onChange={setPw2} show={show} autoComplete="new-password" />
          {pw2 && mismatch ? <small className="form-error">Las contraseñas no coinciden.</small> : null}
        </label>
        <div><Button type="button" variant="outline" size="sm" onClick={generate}><KeyRound />Generar contraseña</Button></div>
        {generated ? <div className="form-field">Frase generada
          <div className="password-field"><input ref={genRef} readOnly value={generated} spellCheck={false} aria-label="Frase generada" /><Button type="button" variant="ghost" size="sm" onClick={() => void copy()}><Copy />Copiar</Button></div>
          <small>Guardala en tu gestor de contraseñas antes de exportar{copyMsg ? ` · ${copyMsg}` : ""}</small>
        </div> : null}
        <p><AlertTriangle style={{ display: "inline", width: 14, height: 14 }} /> Si olvidás esta contraseña no hay forma de recuperar el respaldo.</p>
      </>}
      {error ? <p className="form-error">{error}</p> : null}
      <div className="modal-actions"><Button type="button" variant="outline" disabled={busy} onClick={close}>Cancelar</Button><Button type="submit" disabled={!canExport}><Download />{busy ? "Cifrando…" : "Exportar"}</Button></div>
    </form>
  </section></div>;
}

export function DecryptBackupDialog({ fileName, onClose, onDecrypt }: { fileName: string; onClose: () => void; onDecrypt: (password: string) => Promise<void> }) {
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const close = () => { setPw(""); onClose(); };
  const submit = async () => {
    if (!pw || busy) return;
    setBusy(true); setError("");
    try { await onDecrypt(pw); setPw(""); }
    catch (e) { setError(e instanceof Error ? e.message : "Contraseña incorrecta o archivo dañado."); }
    finally { setBusy(false); }
  };
  return <div className="modal-backdrop" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget && !busy) close(); }}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="decrypt-title">
    <div className="modal-head"><div><small>Importar datos</small><h2 id="decrypt-title">Respaldo cifrado</h2></div><Button variant="ghost" size="icon" aria-label="Cerrar" disabled={busy} onClick={close}><X /></Button></div>
    <form onSubmit={e => { e.preventDefault(); void submit(); }}>
      <p>El archivo <b>{fileName}</b> está protegido con contraseña.</p>
      <label className="form-field" htmlFor="decrypt-pw">Contraseña
        <PasswordInput id="decrypt-pw" value={pw} onChange={setPw} show={show} onToggle={() => setShow(!show)} autoComplete="current-password" />
      </label>
      {error ? <p className="form-error"><AlertTriangle style={{ display: "inline", width: 14, height: 14 }} /> {error}</p> : null}
      <div className="modal-actions"><Button type="button" variant="outline" disabled={busy} onClick={close}>Cancelar</Button><Button type="submit" disabled={!pw || busy}><Upload />{busy ? "Descifrando…" : "Descifrar"}</Button></div>
    </form>
  </section></div>;
}
