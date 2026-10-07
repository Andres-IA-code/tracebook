import { useState, type FormEvent } from "react";
import { AlertTriangle, CalendarClock, Check, FileDown, FileSignature, Pencil, Plus, Printer, Search, Send, ShieldCheck, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { printHtml } from "@/lib/print-html";

export type AuthStatus = "Borrador" | "Enviada" | "Firmada" | "Rechazada" | "Revocada";
export type Authorization = {
  id: string; projectId: string; projectName: string; client: string;
  signer: string; signerRole: string; signerEmail: string;
  scope: string; exclusions: string; testTypes: string[];
  windowStart: string; windowEnd: string; hours: string;
  emergencyContact: string; notes: string;
  status: AuthStatus; createdAt: string; sentAt?: string; signedAt?: string; signedBy?: string; reason?: string;
};
type ProjectRef = { id: string; name: string; client: string; start: string; end: string };

const TEST_TYPES = ["Caja negra", "Caja gris", "Caja blanca", "Ingeniería social", "Denegación de servicio", "Pruebas físicas"];
const FILTERS = ["Todas", "Borrador", "Enviada", "Firmada", "Vencida", "Rechazada", "Revocada"] as const;

const today = () => new Date().toISOString().slice(0, 10);
export function effectiveStatus(a: Authorization): AuthStatus | "Vencida" {
  return a.status === "Firmada" && a.windowEnd && a.windowEnd < today() ? "Vencida" : a.status;
}
const tone: Record<string, string> = {
  Borrador: "status-neutral", Enviada: "status-info", Firmada: "status-success",
  Vencida: "status-warning", Rechazada: "status-danger", Revocada: "status-danger",
};
const fmt = (d?: string) => d ? new Date(d.length === 10 ? d + "T00:00:00" : d).toLocaleDateString("es-AR") : "—";

export function Authorizations({ items = [], projects = [], onChange, goProjects, notify }: {
  items: Authorization[]; projects: ProjectRef[];
  onChange: (next: Authorization[]) => void; goProjects: () => void; notify: (m: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("Todas");
  const [selected, setSelected] = useState<string | null>(null);
  const [editing, setEditing] = useState<Authorization | "new" | null>(null);
  const [signing, setSigning] = useState<Authorization | null>(null);

  const current = items.find(a => a.id === selected) ?? null;
  const visible = items.filter(a => (filter === "Todas" || effectiveStatus(a) === filter)
    && `${a.projectName} ${a.client} ${a.signer}`.toLowerCase().includes(query.toLowerCase()));
  const count = (s: string) => items.filter(a => effectiveStatus(a) === s).length;
  const withoutAuth = projects.filter(p => !items.some(a => a.projectId === p.id && ["Firmada", "Enviada", "Borrador"].includes(a.status)));

  const save = (a: Authorization) => {
    const exists = items.some(i => i.id === a.id);
    onChange(exists ? items.map(i => i.id === a.id ? a : i) : [...items, a]);
    setEditing(null); setSelected(a.id); notify(exists ? "Autorización actualizada" : "Autorización creada");
  };
  const patch = (id: string, p: Partial<Authorization>, msg: string) => { onChange(items.map(i => i.id === id ? { ...i, ...p } : i)); notify(msg); };
  const [pendingRemove, setPendingRemove] = useState<Authorization | null>(null);
  const [confirmSigned, setConfirmSigned] = useState(false);
  const remove = (a: Authorization) => { setConfirmSigned(false); setPendingRemove(a); };
  const applyRemove = () => {
    if (!pendingRemove) return;
    onChange(items.filter(i => i.id !== pendingRemove.id)); setSelected(null);
    notify("Autorización eliminada"); setPendingRemove(null);
  };

  return <>
    <header className="page-head"><div><h1>Autorizaciones</h1><p>Documentos de alcance y permisos de prueba firmados por el cliente</p></div>
      <div className="head-actions"><label className="search"><Search /><input aria-label="Buscar autorización" placeholder="Buscar proyecto, cliente o firmante" value={query} onChange={e => setQuery(e.target.value)} /></label>
        <Button onClick={() => projects.length ? setEditing("new") : goProjects()}><Plus />Nueva autorización</Button></div></header>

    <div className="metric-grid">
      {([["Firmadas vigentes", count("Firmada"), ShieldCheck], ["Pendientes de firma", count("Enviada"), Send], ["Borradores", count("Borrador"), Pencil], ["Proyectos sin autorización", withoutAuth.length, CalendarClock]] as const).map(([l, v, I]) =>
        <div className="metric" key={l}><span><I />{l}</span><strong>{v}</strong></div>)}
    </div>

    {!projects.length ? <section className="surface"><div className="empty-state"><span><ShieldCheck /></span><h3>Primero carga un proyecto</h3><p>Cada autorización se vincula a un proyecto existente.</p><Button onClick={goProjects}><Plus />Ir a proyectos</Button></div></section>
    : !items.length ? <section className="surface"><div className="empty-state"><span><FileSignature /></span><h3>Sin autorizaciones cargadas</h3><p>Define el alcance, la ventana de pruebas y el firmante responsable del cliente.</p><Button onClick={() => setEditing("new")}><Plus />Crear autorización</Button></div></section>
    : <>
      <div className="auth-filters">{FILTERS.map(f => <button key={f} className={cn(filter === f && "active")} onClick={() => setFilter(f)}>{f}{f !== "Todas" ? <i>{count(f)}</i> : null}</button>)}</div>
      <div className="findings-grid">
        <section className="surface"><div className="finding-list">{visible.length ? visible.map(a => { const s = effectiveStatus(a); return <button key={a.id} className={selected === a.id ? "active" : ""} onClick={() => setSelected(a.id)}>
          <span><FileSignature /></span><div><b>{a.projectName}</b><small>{a.client} · {fmt(a.windowStart)} — {fmt(a.windowEnd)}</small></div><span className={cn("status", tone[s])}>{s}</span></button>; })
          : <p className="auth-none">No hay autorizaciones con este filtro.</p>}</div></section>
        <section className="surface">{current ? <AuthDetail a={current}
          onEdit={() => setEditing(current)} onDelete={() => remove(current)}
          onSend={() => patch(current.id, { status: "Enviada", sentAt: new Date().toISOString() }, "Marcada como enviada al cliente")}
          onSign={() => setSigning(current)}
          onReject={() => { const reason = window.prompt("Motivo del rechazo"); if (reason !== null) patch(current.id, { status: "Rechazada", reason }, "Autorización rechazada"); }}
        /> : <div className="empty-state"><span><ShieldCheck /></span><h3>Selecciona una autorización</h3><p>El documento y sus acciones se mostrarán aquí.</p></div>}</section>
      </div>
    </>}

    {editing ? <AuthForm initial={editing === "new" ? null : editing} projects={projects} onClose={() => setEditing(null)} onSave={save} /> : null}
    {signing ? <SignDialog a={signing} onClose={() => setSigning(null)} onSign={(name) => { patch(signing.id, { status: "Firmada", signedAt: new Date().toISOString(), signedBy: name }, "Firma registrada"); setSigning(null); }} /> : null}
    {pendingRemove ? (() => { const s = effectiveStatus(pendingRemove); const signed = s === "Firmada" || s === "Vencida"; return <div className="modal-backdrop" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) setPendingRemove(null); }}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="auth-delete-title">
      <div className="modal-head"><div><small>Autorizaciones</small><h2 id="auth-delete-title">Eliminar autorización</h2></div><Button variant="ghost" size="icon" aria-label="Cerrar" onClick={() => setPendingRemove(null)}><X /></Button></div>
      <form onSubmit={event => { event.preventDefault(); if (!signed || confirmSigned) applyRemove(); }}>
        <p><AlertTriangle style={{display:"inline",width:14,height:14}} /> Se eliminará la autorización de <b>{pendingRemove.projectName}</b> ({pendingRemove.client}).</p>
        {signed ? <><div className="warning-banner"><AlertTriangle /><p>{s === "Vencida" ? "La ventana de pruebas venció. " : ""}{pendingRemove.signedBy ? <>La firmó <b>{pendingRemove.signedBy}</b></> : "Fue firmada"}{pendingRemove.signedAt ? <> el {fmt(pendingRemove.signedAt)}</> : null}. Al eliminarla se pierden el registro de la firma y el alcance aprobado.</p></div>
          <label className="auth-consent"><input type="checkbox" checked={confirmSigned} onChange={e => setConfirmSigned(e.target.checked)} />Entiendo que se elimina el registro de la firma y que no puedo recuperarlo.</label></> : <p>Esta acción no se puede deshacer.</p>}
        <div className="modal-actions"><Button type="button" variant="outline" onClick={() => setPendingRemove(null)}>Cancelar</Button><Button type="submit" disabled={signed && !confirmSigned}><Trash2 />Eliminar</Button></div>
      </form></section></div>; })() : null}
  </>;
}

function AuthDetail({ a, onEdit, onDelete, onSend, onSign, onReject }: { a: Authorization; onEdit: () => void; onDelete: () => void; onSend: () => void; onSign: () => void; onReject: () => void }) {
  const s = effectiveStatus(a);
  const editable = a.status === "Borrador" || a.status === "Enviada";
  return <div className="detail-body auth-detail">
    <div className="detail-head"><span className={cn("status", tone[s])}>{s}</span><h2>{a.projectName}</h2><p className="auth-sub">{a.client}</p></div>
    <div className="auth-facts">
      <div><small>Firmante</small><b>{a.signer}</b><span>{a.signerRole}{a.signerEmail ? ` · ${a.signerEmail}` : ""}</span></div>
      <div><small>Ventana de pruebas</small><b>{fmt(a.windowStart)} — {fmt(a.windowEnd)}</b><span>{a.hours || "Horario sin restricción"}</span></div>
      <div><small>Contacto de emergencia</small><b>{a.emergencyContact || "—"}</b></div>
      <div><small>Tipo de prueba</small><b>{a.testTypes.join(", ") || "—"}</b></div>
    </div>
    <div><div className="field-title">Alcance autorizado</div><pre className="text-box auth-pre">{a.scope}</pre></div>
    <div><div className="field-title">Exclusiones</div><pre className="text-box auth-pre">{a.exclusions || "Sin exclusiones declaradas"}</pre></div>
    {a.notes ? <div><div className="field-title">Condiciones adicionales</div><pre className="text-box auth-pre">{a.notes}</pre></div> : null}
    <ol className="auth-timeline">
      <li className="done">Creada · {fmt(a.createdAt)}</li>
      <li className={a.sentAt ? "done" : ""}>Enviada al cliente · {fmt(a.sentAt)}</li>
      <li className={a.signedAt ? "done" : ""}>Firmada{a.signedBy ? ` por ${a.signedBy}` : ""} · {fmt(a.signedAt)}</li>
      {a.reason ? <li className="bad">{a.status}: {a.reason || "sin motivo"}</li> : null}
    </ol>
    <div className="auth-actions">
      {a.status === "Borrador" ? <Button onClick={onSend}><Send />Marcar como enviada</Button> : null}
      {editable ? <Button onClick={onSign} variant={a.status === "Enviada" ? "default" : "outline"}><FileSignature />Registrar firma</Button> : null}
      {a.status === "Enviada" ? <Button variant="outline" onClick={onReject}><X />Rechazada</Button> : null}
      <Button variant="outline" onClick={() => downloadAuthPdf(a)}><FileDown />Descargar PDF</Button>
      <Button variant="outline" onClick={() => printAuth(a)}><Printer />Imprimir</Button>
      {editable ? <Button variant="ghost" onClick={onEdit}><Pencil />Editar</Button> : null}
      <Button variant="ghost" onClick={onDelete}><Trash2 />Eliminar</Button>
    </div>
  </div>;
}

function AuthForm({ initial, projects, onClose, onSave }: { initial: Authorization | null; projects: ProjectRef[]; onClose: () => void; onSave: (a: Authorization) => void }) {
  const [projectId, setProjectId] = useState(initial?.projectId ?? projects[0]?.id ?? "");
  const project = projects.find(p => p.id === projectId);
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault(); const f = new FormData(e.currentTarget); const g = (k: string) => String(f.get(k) ?? "").trim();
    if (g("windowEnd") < g("windowStart")) { window.alert("La fecha de fin debe ser posterior a la de inicio."); return; }
    onSave({
      ...(initial ?? { id: crypto.randomUUID(), status: "Borrador" as AuthStatus, createdAt: new Date().toISOString() }),
      projectId, projectName: project?.name ?? initial?.projectName ?? "", client: project?.client ?? initial?.client ?? "",
      signer: g("signer"), signerRole: g("signerRole"), signerEmail: g("signerEmail"),
      scope: g("scope"), exclusions: g("exclusions"), testTypes: f.getAll("testTypes").map(String),
      windowStart: g("windowStart"), windowEnd: g("windowEnd"), hours: g("hours"),
      emergencyContact: g("emergencyContact"), notes: g("notes"),
    });
  };
  return <div className="modal-backdrop" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
    <section className="modal auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-title">
      <div className="modal-head"><div><small>Autorización de pruebas</small><h2 id="auth-title">{initial ? "Editar autorización" : "Nueva autorización"}</h2></div><Button variant="ghost" size="icon" aria-label="Cerrar" onClick={onClose}><X /></Button></div>
      <form onSubmit={submit} key={projectId}>
        <label className="form-field">Proyecto<select value={projectId} onChange={e => setProjectId(e.target.value)} required>{projects.map(p => <option key={p.id} value={p.id}>{p.name} — {p.client}</option>)}</select></label>
        <div className="form-grid">
          <label className="form-field">Firmante del cliente<input name="signer" required defaultValue={initial?.signer} /></label>
          <label className="form-field">Cargo<input name="signerRole" required defaultValue={initial?.signerRole} placeholder="CISO, CTO…" /></label>
          <label className="form-field">Correo del firmante<input name="signerEmail" type="email" defaultValue={initial?.signerEmail} /></label>
          <label className="form-field">Contacto de emergencia<input name="emergencyContact" defaultValue={initial?.emergencyContact} placeholder="Nombre y teléfono" /></label>
          <label className="form-field">Inicio de ventana<input name="windowStart" type="date" required defaultValue={initial?.windowStart ?? project?.start} /></label>
          <label className="form-field">Fin de ventana<input name="windowEnd" type="date" required defaultValue={initial?.windowEnd ?? project?.end} /></label>
        </div>
        <label className="form-field">Horario permitido<input name="hours" defaultValue={initial?.hours} placeholder="Ej.: lunes a viernes 20:00–06:00" /></label>
        <label className="form-field">Alcance autorizado (un objetivo por línea)<textarea name="scope" rows={4} required defaultValue={initial?.scope} placeholder={"app.cliente.com\n10.0.0.0/24"} /></label>
        <label className="form-field">Exclusiones<textarea name="exclusions" rows={2} defaultValue={initial?.exclusions} /></label>
        <fieldset className="auth-checks"><legend>Tipo de prueba</legend>{TEST_TYPES.map(t => <label key={t}><input type="checkbox" name="testTypes" value={t} defaultChecked={initial?.testTypes.includes(t)} />{t}</label>)}</fieldset>
        <label className="form-field">Condiciones adicionales<textarea name="notes" rows={2} defaultValue={initial?.notes} /></label>
        <div className="modal-actions"><Button type="button" variant="outline" onClick={onClose}>Cancelar</Button><Button type="submit"><Check />Guardar</Button></div>
      </form>
    </section>
  </div>;
}

function SignDialog({ a, onClose, onSign }: { a: Authorization; onClose: () => void; onSign: (name: string) => void }) {
  const [name, setName] = useState(a.signer); const [ok, setOk] = useState(false);
  return <div className="modal-backdrop" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
    <section className="modal" role="dialog" aria-modal="true" aria-labelledby="sign-title">
      <div className="modal-head"><div><small>{a.projectName}</small><h2 id="sign-title">Registrar firma</h2></div><Button variant="ghost" size="icon" aria-label="Cerrar" onClick={onClose}><X /></Button></div>
      <form onSubmit={e => { e.preventDefault(); if (ok && name.trim()) onSign(name.trim()); }}>
        <label className="form-field">Nombre de quien firma<input value={name} onChange={e => setName(e.target.value)} required /></label>
        <div className="auth-signature">{name || "Firma"}</div>
        <label className="auth-consent"><input type="checkbox" checked={ok} onChange={e => setOk(e.target.checked)} />Confirmo que el cliente aprobó el alcance y la ventana de pruebas descritos en este documento.</label>
        <div className="modal-actions"><Button type="button" variant="outline" onClick={onClose}>Cancelar</Button><Button type="submit" disabled={!ok || !name.trim()}><FileSignature />Confirmar firma</Button></div>
      </form>
    </section>
  </div>;
}

async function downloadAuthPdf(a: Authorization) {
  try {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 20;
    const maxW = pageW - margin * 2;
    let y = margin;

    const ensureSpace = (needed: number) => {
      if (y + needed > pageH - margin) { doc.addPage(); y = margin; }
    };
    const heading = (text: string) => {
      ensureSpace(12);
      y += 6;
      doc.setFont("helvetica", "bold"); doc.setFontSize(12); doc.setTextColor(20, 20, 20);
      doc.text(text, margin, y);
      y += 6;
    };
    const body = (text: string) => {
      doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(60, 60, 60);
      const lines = doc.splitTextToSize(text, maxW) as string[];
      for (const line of lines) { ensureSpace(5); doc.text(line, margin, y); y += 5; }
    };

    // Encabezado
    doc.setFillColor(217, 100, 30);
    doc.rect(0, 0, pageW, 4, "F");
    doc.setFont("helvetica", "bold"); doc.setFontSize(18); doc.setTextColor(20, 20, 20);
    doc.text("Autorización de pruebas de penetración", margin, y + 4);
    y += 12;
    doc.setDrawColor(217, 100, 30); doc.setLineWidth(0.8);
    doc.line(margin, y, pageW - margin, y);
    y += 8;

    doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(60, 60, 60);
    body(`Proyecto: ${a.projectName}`);
    body(`Cliente: ${a.client}`);
    body(`Estado: ${effectiveStatus(a)}`);

    heading("Ventana de pruebas");
    body(`${fmt(a.windowStart)} al ${fmt(a.windowEnd)}${a.hours ? ` — ${a.hours}` : ""}`);

    heading("Tipo de prueba");
    body(a.testTypes.join(", ") || "—");

    heading("Alcance autorizado");
    body(a.scope);

    heading("Exclusiones");
    body(a.exclusions || "Sin exclusiones declaradas");

    if (a.notes) { heading("Condiciones adicionales"); body(a.notes); }

    heading("Contacto de emergencia");
    body(a.emergencyContact || "—");

    // Firma
    ensureSpace(30);
    y += 18;
    doc.setDrawColor(20, 20, 20); doc.setLineWidth(0.4);
    doc.line(margin, y, margin + 80, y);
    y += 5;
    doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(20, 20, 20);
    doc.text(a.signedBy || a.signer, margin, y); y += 5;
    doc.text(a.signerRole, margin, y); y += 5;
    if (a.signedAt) { doc.text(`Firmado el ${fmt(a.signedAt)}`, margin, y); }

    const slug = a.projectName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "autorizacion";
    doc.save(`autorizacion-${slug}.pdf`);
  } catch {
    window.alert("No se pudo generar el PDF. Probá con la opción Imprimir.");
  }
}

function printAuth(a: Authorization) {
  const esc = (s: string) => s.replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));
  printHtml(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Autorización — ${esc(a.projectName)}</title><style>body{font-family:Georgia,serif;max-width:720px;margin:40px auto;color:#141414;line-height:1.5}h1{font-size:22px;border-bottom:2px solid #D9641E;padding-bottom:8px}h2{font-size:15px;margin-top:22px}pre{white-space:pre-wrap;font-family:inherit;background:#f7f7f7;padding:10px}.sig{margin-top:48px;border-top:1px solid #141414;width:300px;padding-top:6px}</style></head><body>
  <h1>Autorización de pruebas de penetración</h1>
  <p><b>Proyecto:</b> ${esc(a.projectName)}<br><b>Cliente:</b> ${esc(a.client)}<br><b>Estado:</b> ${esc(effectiveStatus(a))}</p>
  <h2>Ventana de pruebas</h2><p>${fmt(a.windowStart)} al ${fmt(a.windowEnd)}${a.hours ? ` — ${esc(a.hours)}` : ""}</p>
  <h2>Tipo de prueba</h2><p>${esc(a.testTypes.join(", ") || "—")}</p>
  <h2>Alcance autorizado</h2><pre>${esc(a.scope)}</pre>
  <h2>Exclusiones</h2><pre>${esc(a.exclusions || "Sin exclusiones declaradas")}</pre>
  ${a.notes ? `<h2>Condiciones adicionales</h2><pre>${esc(a.notes)}</pre>` : ""}
  <h2>Contacto de emergencia</h2><p>${esc(a.emergencyContact || "—")}</p>
  <div class="sig">${esc(a.signedBy || a.signer)}<br>${esc(a.signerRole)}${a.signedAt ? `<br>Firmado el ${fmt(a.signedAt)}` : ""}</div>
  </body></html>`);
}
