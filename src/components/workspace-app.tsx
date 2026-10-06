import { BRAND } from "@/brand";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import {
  AlertTriangle, BookOpen, Bug, Download, Building2, Check, ChevronDown, Eye, FileText, FolderOpen,
  LayoutDashboard, LogOut, Menu, Pencil, Plus, RotateCcw, Search, Settings, ShieldCheck, Trash2, Upload, X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { printHtml } from "@/lib/print-html";
import { Authorizations, type Authorization } from "@/components/authorizations";

type View = "panel" | "proyectos" | "autorizaciones" | "hallazgos" | "biblioteca" | "informes" | "clientes" | "configuracion";
type Project = { id: string; name: string; client: string; type: string; status: string; start: string; end: string };
type Finding = { id: string; title: string; severity: string; status: string; project: string; projectId?: string | undefined; description: string };
type Client = { id: string; name: string; industry: string; contact: string; email: string };
type Template = { id: string; title: string; cwe: string; category: string; severity: string };
type DataState = { projects: Project[]; findings: Finding[]; clients: Client[]; templates: Template[]; authorizations: Authorization[] };
type SettingsState = {
  organization: string; userName: string; email: string; role: string; timezone: string;
  emailAlerts: boolean; reportAlerts: boolean;
  latexLogo: string; latexPrimaryColor: string; latexTextColor: string; latexSecondaryColor: string;
  teamPhone: string; teamWebsite: string; teamAddress: string;
};
type CreateKind = "project" | "finding" | "client" | "template" | null;
type PendingDelete = { group: string; heading: string; description: ReactNode; confirmLabel: string; run: () => void };

const PROJECT_STATUSES = ["Preparación", "En prueba", "En revisión", "Entregado"];
const PROJECT_STATUS_TONES: Record<string, string> = { "Preparación": "neutral", "En prueba": "info", "En revisión": "warning", "Entregado": "success" };
const EMPTY_DATA: DataState = { projects: [], findings: [], clients: [], templates: [], authorizations: [] };
const STORAGE_KEY = "vertice-workspace-data";
const SETTINGS_KEY = "vertice-settings";
const DEFAULT_SETTINGS: SettingsState = {
  organization: "", userName: "", email: "", role: "Responsable", timezone: "America/Argentina/Buenos_Aires",
  emailAlerts: true, reportAlerts: true, latexLogo: "", latexPrimaryColor: "#D9641E",
  latexTextColor: "#141414", latexSecondaryColor: "#757575", teamPhone: "", teamWebsite: "", teamAddress: "",
};

type AuditEntry = { id: string; at: string; user: string; action: "Importación" | "Exportación" | "Eliminación" | "Actualización"; detail: string };
const AUDIT_KEY = "vertice-audit";
function normalizeData(parsed: Partial<DataState>): DataState {
  const next = { projects: parsed.projects ?? [], findings: parsed.findings ?? [], clients: parsed.clients ?? [], templates: parsed.templates ?? [], authorizations: parsed.authorizations ?? [] };
  if (![next.projects, next.findings, next.clients, next.templates, next.authorizations].every(Array.isArray)) throw new Error("formato");
  next.findings = next.findings.map(f => {
    if (f.projectId) { const p = next.projects.find(x => x.id === f.projectId); return p ? { ...f, project: p.name } : f; }
    const p = f.project ? next.projects.find(x => x.name === f.project) : undefined;
    return p ? { ...f, projectId: p.id } : f;
  });
  return next;
}
type ImportPayload = { data: DataState; settings: Partial<SettingsState> | null };
function parseBackup(text: string): ImportPayload {
  let raw: unknown;
  try { raw = JSON.parse(text); } catch { throw new Error("El archivo no es un JSON válido."); }
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new Error("El archivo no tiene el formato de un respaldo de La Papa.");
  const obj = raw as Record<string, unknown>;
  const keys = ["projects", "findings", "clients", "templates", "authorizations"];
  if (!keys.some(k => k in obj)) throw new Error("El archivo no contiene proyectos, hallazgos, clientes, plantillas ni autorizaciones.");
  for (const k of keys) if (k in obj && !Array.isArray(obj[k])) throw new Error(`El campo "${k}" no tiene un formato válido.`);
  for (const k of keys) for (const item of (obj[k] as unknown[] | undefined) ?? []) if (!item || typeof item !== "object" || typeof (item as { id?: unknown }).id !== "string") throw new Error(`Hay registros sin identificador en "${k}".`);
  const settings = obj["settings"] && typeof obj["settings"] === "object" && !Array.isArray(obj["settings"]) ? obj["settings"] as Partial<SettingsState> : null;
  return { data: normalizeData(obj as Partial<DataState>), settings };
}
function mergeById<T extends { id: string }>(current: T[], incoming: T[]) { const ids = new Set(current.map(x => x.id)); return [...current, ...incoming.filter(x => !ids.has(x.id))]; }
function exportBackup(data: DataState, settings: SettingsState) {
  const content = JSON.stringify({ ...data, settings, exportedAt: new Date().toISOString(), app: BRAND.name, version: BRAND.version }, null, 2);
  const url = URL.createObjectURL(new Blob([content], { type: "application/json" }));
  const a = document.createElement("a"); a.href = url; a.download = `lapapa-respaldo-${new Date().toISOString().slice(0, 10)}.json`; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const navItems = [
  ["panel", "Panel", LayoutDashboard], ["proyectos", "Proyectos", FolderOpen],
  ["autorizaciones", "Autorizaciones", ShieldCheck], ["hallazgos", "Hallazgos", Bug],
  ["biblioteca", "Biblioteca", BookOpen], ["informes", "Informes", FileText],
  ["clientes", "Clientes", Building2],
] as const;

const sevClass: Record<string, string> = {
  Crítico: "bg-critical text-critical-foreground", Alto: "bg-critical-soft text-critical-strong",
  Medio: "bg-warning-soft text-warning-strong", Bajo: "bg-info-soft text-primary",
};

function Status({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "success" | "warning" | "info" }) {
  return <span className={cn("status", `status-${tone}`)}>{children}</span>;
}
function Section({ title, action, children, className }: { title?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return <section className={cn("surface", className)}>{title ? <div className="section-head"><h2>{title}</h2>{action}</div> : null}{children}</section>;
}
function Header({ title, sub, children }: { title: string; sub?: string; children?: ReactNode }) {
  return <header className="page-head"><div><h1>{title}</h1>{sub ? <p>{sub}</p> : null}</div><div className="head-actions">{children}</div></header>;
}
function EmptyState({ icon: Icon, title, text, action }: { icon: typeof FolderOpen; title: string; text: string; action?: ReactNode }) {
  return <div className="empty-state"><span><Icon /></span><h3>{title}</h3><p>{text}</p>{action}</div>;
}

export function WorkspaceApp() {
  const [view, setView] = useState<View>("panel");
  const [mobileNav, setMobileNav] = useState(false);
  const [notice, setNotice] = useState("");
  const [data, setData] = useState<DataState>(EMPTY_DATA);
  const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS);
  const [createKind, setCreateKind] = useState<CreateKind>(null);
  const [editingFinding, setEditingFinding] = useState<Finding | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [pendingReset, setPendingReset] = useState(false);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  useEffect(() => { try { const a = JSON.parse(window.localStorage.getItem(AUDIT_KEY) ?? "[]"); if (Array.isArray(a)) setAudit(a); } catch { /* ignore */ } }, []);
  const log = (action: AuditEntry["action"], detail: string) => setAudit(current => {
    const next = [{ id: crypto.randomUUID(), at: new Date().toISOString(), user: settings.userName || "Usuario sin nombre", action, detail }, ...current].slice(0, 500);
    window.localStorage.setItem(AUDIT_KEY, JSON.stringify(next)); return next;
  });
  const doExport = () => { exportBackup(data, settings); log("Exportación", `Respaldo completo: ${data.projects.length} proyectos, ${data.findings.length} hallazgos, ${(data.authorizations ?? []).length} autorizaciones`); };
  const saveAudit = (next: AuditEntry[]) => { setAudit(next); window.localStorage.setItem(AUDIT_KEY, JSON.stringify(next)); };
  const [pendingAuditDelete, setPendingAuditDelete] = useState<string | "all" | null>(null);
  const deleteAuditEntry = (id: string) => setPendingAuditDelete(id);
  const clearAudit = () => setPendingAuditDelete("all");
  const applyAuditDelete = () => {
    if (pendingAuditDelete === "all") { saveAudit([]); confirm("Registro de auditoría vaciado"); }
    else if (pendingAuditDelete) { saveAudit(audit.filter(e => e.id !== pendingAuditDelete)); confirm("Registro eliminado"); }
    setPendingAuditDelete(null);
  };
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);
  const importInput = useRef<HTMLInputElement>(null);
  const [pendingImport, setPendingImport] = useState<{ payload: ImportPayload; name: string; confirmReplace: boolean } | null>(null);
  const [importError, setImportError] = useState("");
  const countOf = (d: DataState) => `${d.projects.length} proyectos, ${d.findings.length} hallazgos, ${d.authorizations.length} autorizaciones, ${d.clients.length} clientes, ${d.templates.length} plantillas`;
  const startImport = () => { if (importInput.current) { importInput.current.value = ""; importInput.current.click(); } };
  const onImportFile = async (file?: File) => {
    if (!file) return;
    try {
      const payload = parseBackup(await file.text());
      const hasData = [data.projects, data.findings, data.clients, data.templates, data.authorizations ?? []].some(a => a.length > 0);
      if (hasData) setPendingImport({ payload, name: file.name, confirmReplace: false });
      else applyImport(payload, "replace", file.name);
    } catch (error) { setImportError(error instanceof Error ? error.message : "No se pudo leer el archivo."); }
  };
  const applyImport = (payload: ImportPayload, mode: "merge" | "replace", name: string) => {
    setPendingImport(null);
    if (mode === "replace") {
      updateData(payload.data);
      if (payload.settings) { const next = { ...DEFAULT_SETTINGS, ...payload.settings }; setSettings(next); window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(next)); }
      log("Importación", `Reemplazo total desde ${name}: ${countOf(payload.data)}`);
      confirm("Datos importados");
    } else {
      const cur = { ...data, authorizations: data.authorizations ?? [] };
      const merged = normalizeData({ projects: mergeById(cur.projects, payload.data.projects), findings: mergeById(cur.findings, payload.data.findings), clients: mergeById(cur.clients, payload.data.clients), templates: mergeById(cur.templates, payload.data.templates), authorizations: mergeById(cur.authorizations, payload.data.authorizations) });
      const added = { projects: merged.projects.length - cur.projects.length, findings: merged.findings.length - cur.findings.length, authorizations: merged.authorizations.length - cur.authorizations.length, clients: merged.clients.length - cur.clients.length, templates: merged.templates.length - cur.templates.length };
      updateData(merged);
      log("Importación", `Combinación desde ${name}: se agregaron ${added.projects} proyectos, ${added.findings} hallazgos, ${added.authorizations} autorizaciones, ${added.clients} clientes, ${added.templates} plantillas`);
      confirm("Datos combinados");
    }
  };

  useEffect(() => {
    window.localStorage.removeItem("vertice-theme");
    const savedData = window.localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData) as Partial<DataState>;
        setData(normalizeData(parsed));
      } catch { window.localStorage.removeItem(STORAGE_KEY); }
    }
    const savedSettings = window.localStorage.getItem(SETTINGS_KEY);
    if (savedSettings) {
      try { setSettings({ ...DEFAULT_SETTINGS, ...(JSON.parse(savedSettings) as Partial<SettingsState>) }); }
      catch { window.localStorage.removeItem(SETTINGS_KEY); }
    }
  }, []);

  const updateData = (next: DataState) => { setData(next); window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); };
  const updateSettings = (next: SettingsState) => { setSettings(next); window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(next)); confirm("Configuración guardada"); };
  const resetSettings = () => setPendingReset(true);
  const applyResetSettings = () => {
    setPendingReset(false);
    log("Eliminación", "Configuración restablecida a los valores predeterminados");
    setSettings(DEFAULT_SETTINGS);
    window.localStorage.removeItem(SETTINGS_KEY);
    confirm("Configuración restablecida");
  };
  const confirm = (message: string) => { setNotice(message); window.setTimeout(() => setNotice(""), 2600); };
  const go = (next: View) => { setView(next); setMobileNav(false); };
  const addItem = (kind: Exclude<CreateKind, null>, item: Project | Finding | Client | Template) => {
    const key = kind === "project" ? "projects" : kind === "finding" ? "findings" : kind === "client" ? "clients" : "templates";
    updateData({ ...data, [key]: [...data[key], item] });
    setCreateKind(null);
    confirm("Datos guardados correctamente");
  };
  const deleteProject = (id: string) => {
    const p = data.projects.find(x => x.id === id); if (!p) return;
    const nf = data.findings.filter(f => f.projectId === id).length;
    const na = (data.authorizations ?? []).filter(a => a.projectId === id).length;
    setPendingDelete({
      group: "Proyectos", heading: "Eliminar proyecto",
      description: <>Se eliminará el proyecto <b>{p.name}</b> y también {nf} hallazgo(s) y {na} autorización(es) vinculados.</>,
      confirmLabel: "Eliminar",
      run: () => {
        updateData({ ...data, projects: data.projects.filter(x => x.id !== id), findings: data.findings.filter(f => f.projectId !== id), authorizations: (data.authorizations ?? []).filter(a => a.projectId !== id) });
        log("Eliminación", `Proyecto "${p.name}" con ${nf} hallazgo(s) y ${na} autorización(es)`);
        confirm("Proyecto eliminado");
      },
    });
  };
  const deleteClient = (id: string) => {
    const c = data.clients.find(x => x.id === id); if (!c) return;
    const linked = data.projects.filter(p => p.client === c.name).length;
    setPendingDelete({
      group: "Clientes", heading: "Eliminar cliente",
      description: <>Se eliminará el cliente <b>{c.name}</b>. Sus proyectos no se borran, pero quedarán sin cliente asociado.</>,
      confirmLabel: "Eliminar",
      run: () => {
        updateData({ ...data, clients: data.clients.filter(x => x.id !== id) });
        log("Eliminación", `Cliente "${c.name}"${linked ? ` (${linked} proyecto(s) asociado(s))` : ""}`);
        confirm("Cliente eliminado");
      },
    });
  };
  const saveFindingEdit = (item: Finding) => {
    updateData({ ...data, findings: data.findings.map(f => f.id === item.id ? item : f) });
    setEditingFinding(null);
    confirm("Hallazgo actualizado");
  };
  const saveProjectEdit = (item: Project) => {
    const prev = data.projects.find(p => p.id === item.id);
    updateData({ ...data, projects: data.projects.map(p => p.id === item.id ? item : p) });
    setEditingProject(null);
    if (prev && prev.status !== item.status) log("Actualización", `Proyecto "${item.name}": estado ${prev.status} → ${item.status}`);
    else log("Actualización", `Proyecto "${item.name}" editado`);
    confirm("Proyecto actualizado");
  };
  const setProjectStatus = (id: string, status: string) => {
    const current = data.projects.find(p => p.id === id);
    if (!current || current.status === status) return;
    updateData({ ...data, projects: data.projects.map(p => p.id === id ? { ...p, status } : p) });
    log("Actualización", `Proyecto "${current.name}": estado ${current.status} → ${status}`);
    confirm(`Estado actualizado a ${status}`);
  };
  const deleteFinding = (id: string) => {
    const f = data.findings.find(x => x.id === id); if (!f) return;
    setPendingDelete({
      group: "Hallazgos", heading: "Eliminar hallazgo",
      description: <>Se eliminará el hallazgo <b>{f.title}</b>. Esta acción no se puede deshacer.</>,
      confirmLabel: "Eliminar",
      run: () => {
        updateData({ ...data, findings: data.findings.filter(x => x.id !== id) });
        log("Eliminación", `Hallazgo "${f.title}"`);
        confirm("Hallazgo eliminado");
      },
    });
  };
  const activeProjects = data.projects.filter(project => project.status !== "Entregado").length;
  const openFindings = data.findings.filter(finding => finding.status !== "Cerrado").length;
  const critical = data.findings.filter(finding => finding.severity === "Crítico" && finding.status !== "Cerrado").length;
  const pendingReports = data.projects.filter(project => project.status === "En revisión").length;
  return <div className="app-shell">
    <aside className={cn("sidebar", mobileNav && "sidebar-open")}>
      <div className="brand"><span className="brand-mark" />{BRAND.name}<Button variant="ghost" size="icon" className="close-nav" aria-label="Cerrar menú" onClick={() => setMobileNav(false)}><X /></Button></div>
      <button className="org-switcher" onClick={() => go("configuracion")}><span className="org-avatar">{initials(settings.organization || BRAND.name)}</span><span><b>{settings.organization || "Mi consultora"}</b><small>Espacio de trabajo</small></span><ChevronDown /></button>
      <nav aria-label="Navegación principal">{navItems.map(([key,label,Icon]) => <button key={key} className={cn("nav-item", view === key && "active")} onClick={() => go(key)}><Icon /><span>{label}</span></button>)}</nav>
      <div className="sidebar-foot"><button className={cn("nav-item", view === "configuracion" && "active")} onClick={() => go("configuracion")}><Settings /><span>Configuración</span></button>{isDesktopApp ? <button className="nav-item nav-exit" onClick={() => window.desktopBridge?.quit()}><LogOut /><span>Salir</span></button> : null}<div className="profile"><span>{initials(settings.userName || "Usuario")}</span><div><b>{settings.userName || "Usuario"}</b><small>{settings.role}</small></div></div></div>
    </aside>
    {mobileNav ? <button className="nav-scrim" aria-label="Cerrar menú" onClick={() => setMobileNav(false)} /> : null}
    <div className="workspace"><div className="mobile-bar"><Button variant="ghost" size="icon" aria-label="Abrir menú" onClick={() => setMobileNav(true)}><Menu /></Button><div className="brand"><span className="brand-mark" />{BRAND.name}</div></div>
      <main className="page">
        {view === "panel" && <Dashboard data={data} counts={[activeProjects,openFindings,critical,pendingReports]} go={go} create={() => setCreateKind("project")} exportData={doExport} importData={startImport} />}
        {view === "proyectos" && <Projects projects={data.projects} create={() => setCreateKind("project")} onEdit={setEditingProject} onStatus={setProjectStatus} onDelete={deleteProject} />}
        {view === "autorizaciones" && <Authorizations items={data.authorizations ?? []} projects={data.projects} onChange={authorizations => { (data.authorizations ?? []).filter(a => !authorizations.some(x => x.id === a.id)).forEach(a => log("Eliminación", `Autorización de "${a.projectName}" (${a.client})`)); updateData({ ...data, authorizations }); }} goProjects={() => go("proyectos")} notify={confirm} />}
        {view === "hallazgos" && <Findings findings={data.findings} create={() => setCreateKind("finding")} onEdit={setEditingFinding} onDelete={deleteFinding} />}
        {view === "biblioteca" && <Library templates={data.templates} create={() => setCreateKind("template")} onDelete={id => { const t = data.templates.find(x => x.id === id); if (!t) return; setPendingDelete({ group: "Biblioteca de hallazgos", heading: "Eliminar plantilla", description: <>Se eliminará la plantilla <b>{t.title}</b> del catálogo reutilizable.</>, confirmLabel: "Eliminar", run: () => { updateData({ ...data, templates: data.templates.filter(x => x.id !== id) }); log("Eliminación", `Plantilla "${t.title}"`); confirm("Plantilla eliminada"); } }); }} />}
        {view === "informes" && <Reports projects={data.projects} findings={data.findings} settings={settings} />}
        {view === "clientes" && <Clients clients={data.clients} create={() => setCreateKind("client")} onDelete={deleteClient} />}
        {view === "configuracion" && <SettingsPage settings={settings} onSave={updateSettings} exportData={doExport} importData={startImport} audit={audit} onDeleteAudit={deleteAuditEntry} onClearAudit={clearAudit} onResetSettings={resetSettings} />}
      </main>
    </div>
    {createKind ? <CreateDialog kind={createKind} projects={data.projects} templates={data.templates} onClose={() => setCreateKind(null)} onSave={addItem} /> : null}
    {editingFinding ? <CreateDialog kind="finding" editing={editingFinding} projects={data.projects} onClose={() => setEditingFinding(null)} onSave={(_kind, item) => saveFindingEdit(item as Finding)} /> : null}
    {editingProject ? <CreateDialog kind="project" editing={editingProject} projects={data.projects} onClose={() => setEditingProject(null)} onSave={(_kind, item) => saveProjectEdit(item as Project)} /> : null}
    {pendingAuditDelete ? (() => { const entry = pendingAuditDelete === "all" ? null : audit.find(e => e.id === pendingAuditDelete); return <div className="modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setPendingAuditDelete(null); }}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="audit-title">
      <div className="modal-head"><div><small>Registro de auditoría</small><h2 id="audit-title">{pendingAuditDelete === "all" ? "Borrar todo el registro" : "Eliminar registro"}</h2></div><Button variant="ghost" size="icon" aria-label="Cerrar" onClick={() => setPendingAuditDelete(null)}><X /></Button></div>
      <form onSubmit={event => { event.preventDefault(); applyAuditDelete(); }}>
        {pendingAuditDelete === "all"
          ? <p><AlertTriangle style={{display:"inline",width:14,height:14}} /> Se borrarán los {audit.length} registro(s) del historial de auditoría: exportaciones y eliminaciones registradas hasta ahora.</p>
          : <p><AlertTriangle style={{display:"inline",width:14,height:14}} /> Se eliminará este registro: <b>{entry ? `${entry.action} — ${entry.detail}` : "registro seleccionado"}</b>.</p>}
        <p>Esta acción no se puede deshacer y no queda registrada en el historial.</p>
        <div className="modal-actions"><Button type="button" variant="outline" onClick={() => setPendingAuditDelete(null)}>Cancelar</Button><Button type="submit"><Trash2 />{pendingAuditDelete === "all" ? "Borrar todo" : "Eliminar"}</Button></div>
      </form></section></div>; })() : null}
    <input ref={importInput} type="file" accept="application/json,.json" hidden aria-label="Archivo de respaldo" onChange={event => { const file = event.target.files?.[0]; event.target.value = ""; void onImportFile(file); }} />
    {importError ? <div className="modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setImportError(""); }}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="import-error-title">
      <div className="modal-head"><div><small>Importar datos</small><h2 id="import-error-title">Archivo no válido</h2></div><Button variant="ghost" size="icon" aria-label="Cerrar" onClick={() => setImportError("")}><X /></Button></div>
      <form onSubmit={event => { event.preventDefault(); setImportError(""); }}><p><AlertTriangle style={{display:"inline",width:14,height:14}} /> {importError}</p>
      <p>Usa un archivo generado con “Exportar datos”.</p>
      <div className="modal-actions"><Button type="submit">Entendido</Button></div></form>
    </section></div> : null}
    {pendingImport ? <div className="modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setPendingImport(null); }}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="import-title">
      <div className="modal-head"><div><small>Importar datos</small><h2 id="import-title">{pendingImport.confirmReplace ? "¿Reemplazar todo?" : "Ya tienes datos cargados"}</h2></div><Button variant="ghost" size="icon" aria-label="Cerrar" onClick={() => setPendingImport(null)}><X /></Button></div>
      <form onSubmit={event => event.preventDefault()}>{pendingImport.confirmReplace ? <>
        <p><AlertTriangle style={{display:"inline",width:14,height:14}} /> Se borrarán <b>todos</b> los datos actuales ({countOf({ ...data, authorizations: data.authorizations ?? [] })}) y la configuración, y se reemplazarán por los del archivo.</p>
        <p>Esta acción no se puede deshacer. Exporta un respaldo antes si lo necesitas.</p>
        <div className="modal-actions"><Button type="button" variant="outline" onClick={() => setPendingImport(null)}>Cancelar</Button><Button type="button" onClick={() => applyImport(pendingImport.payload, "replace", pendingImport.name)}>Sí, reemplazar todo</Button></div>
      </> : <>
        <p>El archivo <b>{pendingImport.name}</b> contiene {countOf(pendingImport.payload.data)}.</p>
        <p><b>Combinar</b> agrega solo los registros nuevos. <b>Reemplazar todo</b> borra los datos actuales y restaura también la configuración.</p>
        <div className="modal-actions"><Button type="button" variant="outline" onClick={() => setPendingImport(null)}>Cancelar</Button><Button type="button" variant="outline" onClick={() => setPendingImport({ ...pendingImport, confirmReplace: true })}>Reemplazar todo</Button><Button type="button" onClick={() => applyImport(pendingImport.payload, "merge", pendingImport.name)}>Combinar</Button></div>
      </>}</form>
    </section></div> : null}
    {pendingReset ? <div className="modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setPendingReset(false); }}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="reset-title">
      <div className="modal-head"><div><small>Configuración</small><h2 id="reset-title">Restablecer configuración</h2></div><Button variant="ghost" size="icon" aria-label="Cerrar" onClick={() => setPendingReset(false)}><X /></Button></div>
      <form onSubmit={event => { event.preventDefault(); applyResetSettings(); }}>
        <p><AlertTriangle style={{display:"inline",width:14,height:14}} /> Se borrará la configuración ingresada (consultora, perfil y notificaciones) y todo volverá a los valores predeterminados.</p>
        <p>Los datos cargados (proyectos, hallazgos, autorizaciones, clientes y plantillas) <b>no se borran</b>. Esta acción quedará registrada en el registro de auditoría.</p>
        <div className="modal-actions"><Button type="button" variant="outline" onClick={() => setPendingReset(false)}>Cancelar</Button><Button type="submit"><RotateCcw />Restablecer</Button></div>
      </form></section></div> : null}
    {pendingDelete ? <div className="modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setPendingDelete(null); }}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="delete-title">
      <div className="modal-head"><div><small>{pendingDelete.group}</small><h2 id="delete-title">{pendingDelete.heading}</h2></div><Button variant="ghost" size="icon" aria-label="Cerrar" onClick={() => setPendingDelete(null)}><X /></Button></div>
      <form onSubmit={event => { event.preventDefault(); pendingDelete.run(); setPendingDelete(null); }}>
        <p><AlertTriangle style={{display:"inline",width:14,height:14}} /> {pendingDelete.description}</p>
        <p>Esta acción no se puede deshacer.</p>
        <div className="modal-actions"><Button type="button" variant="outline" onClick={() => setPendingDelete(null)}>Cancelar</Button><Button type="submit"><Trash2 />{pendingDelete.confirmLabel}</Button></div>
      </form></section></div> : null}
    {notice ? <div className="toast"><Check />{notice}</div> : null}
  </div>;
}

function initials(value: string) {
  return value.trim().split(/\s+/).slice(0, 2).map(part => part[0]?.toUpperCase() ?? "").join("") || "—";
}

declare global {
  interface Window {
    desktopBridge?: { quit: () => void };
  }
}

// "Salir" only makes sense in the installed desktop app; browsers block closing tabs.
const isDesktopApp = typeof navigator !== "undefined" && /Electron/i.test(navigator.userAgent);

function Dashboard({ data, counts, go, create, exportData, importData }: { data: DataState; counts: number[]; go: (v: View) => void; create: () => void; exportData: () => void; importData: () => void }) {
  const date = new Intl.DateTimeFormat("es-AR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date());
  const metrics = [["Proyectos activos",counts[0],FolderOpen],["Hallazgos abiertos",counts[1],Bug],["Críticos",counts[2],AlertTriangle],["Informes por entregar",counts[3],FileText]] as const;
  return <><Header title="Panel" sub={date.charAt(0).toUpperCase()+date.slice(1)}><Button variant="outline" onClick={importData}><Download />Importar datos</Button><Button variant="outline" onClick={exportData}><Upload />Exportar datos</Button></Header>
    <div className="metric-grid">{metrics.map(([label,value,Icon]) => <div className="metric" key={label}><span><Icon />{label}</span><strong>{value}</strong></div>)}</div>
    <Section title="Proyectos en curso" action={data.projects.length ? <button className="text-link" onClick={() => go("proyectos")}>Ver todos</button> : null}>{data.projects.length ? <div className="data-table dashboard-table"><div className="table-head"><span>Proyecto</span><span>Tipo</span><span>Estado</span><span>Cliente</span><span /></div>{data.projects.slice(0,5).map(project => <button className="table-row" key={project.id} onClick={() => go("proyectos")}><span><b>{project.name}</b><small>{project.start} — {project.end}</small></span><span>{project.type}</span><Status tone="info">{project.status}</Status><span>{project.client}</span><span>→</span></button>)}</div> : <EmptyState icon={FolderOpen} title="Todavía no hay proyectos" text="Crea el primero o importa un archivo con tus datos." action={<Button onClick={create}><Plus />Crear proyecto</Button>} />}</Section>
  </>;
}

function Projects({ projects, create, onEdit, onStatus, onDelete }: { projects: Project[]; create: () => void; onEdit: (project: Project) => void; onStatus: (id: string, status: string) => void; onDelete: (id: string) => void }) {
  const [query,setQuery] = useState("");
  const rows = projects.filter(project => `${project.name} ${project.client}`.toLowerCase().includes(query.toLowerCase()));
  return <><Header title="Proyectos" sub={`${projects.length} proyectos`}><label className="search"><Search /><input aria-label="Buscar proyecto o cliente" placeholder="Buscar proyecto o cliente" value={query} onChange={e=>setQuery(e.target.value)}/></label><Button onClick={create}><Plus />Nuevo proyecto</Button></Header><Section>{projects.length ? <><div className="data-table projects-table"><div className="table-head"><span>Proyecto</span><span>Estado</span><span>Fechas</span><span>Cliente</span><span>Tipo</span><span /></div>{rows.map(project => <div className="table-row" key={project.id}><span><b>{project.name}</b><small>{project.client}</small></span><span className={cn("status", "status-select-wrap", `status-${PROJECT_STATUS_TONES[project.status] ?? "neutral"}`)}><select className="status-select" aria-label={`Estado de ${project.name}`} value={project.status} onChange={e => onStatus(project.id, e.target.value)}>{PROJECT_STATUSES.includes(project.status) ? null : <option value={project.status}>{project.status}</option>}{PROJECT_STATUSES.map(option => <option key={option} value={option}>{option}</option>)}</select></span><span>{project.start} — {project.end}</span><span>{project.client}</span><span>{project.type}</span><span className="row-actions"><button className="icon-danger icon-edit" aria-label={`Editar ${project.name}`} title="Editar proyecto" onClick={() => onEdit(project)}><Pencil /></button><button className="icon-danger" aria-label={`Eliminar ${project.name}`} title="Eliminar proyecto" onClick={() => onDelete(project.id)}><Trash2 /></button></span></div>)}</div><div className="table-foot"><span>Mostrando {rows.length} de {projects.length}</span></div></> : <EmptyState icon={FolderOpen} title="Sin proyectos cargados" text="Registra un proyecto real para comenzar a trabajar." action={<Button onClick={create}><Plus />Nuevo proyecto</Button>} />}</Section></>;
}

function Findings({ findings, create, onEdit, onDelete }: { findings: Finding[]; create: () => void; onEdit: (finding: Finding) => void; onDelete: (id: string) => void }) {
  const [query,setQuery] = useState(""); const [selected,setSelected] = useState<string | null>(null);
  const visible = findings.filter(f => f.title.toLowerCase().includes(query.toLowerCase()));
  const current = findings.find(f => f.id === selected);
  return <><Header title="Hallazgos" sub={`${findings.length} hallazgos registrados`}><Button onClick={create}><Plus />Nuevo hallazgo</Button></Header>{findings.length ? <div className="findings-grid"><Section><div className="finding-tools"><label className="search wide"><Search/><input aria-label="Buscar hallazgos" placeholder="Buscar hallazgos" value={query} onChange={e=>setQuery(e.target.value)}/></label></div><div className="finding-list">{visible.map((finding,index)=><button key={finding.id} className={selected===finding.id?"active":""} onClick={()=>setSelected(finding.id)}><span>{String(index+1).padStart(2,"0")}</span><div><b>{finding.title}</b><small>{finding.project || "Sin proyecto"}</small></div><span className={cn("severity",sevClass[finding.severity])}>{finding.severity}</span></button>)}</div></Section><Section>{current ? <div className="detail-body"><div className="detail-head"><span>{current.status}</span><h2>{current.title}</h2><span style={{display:"flex",gap:6,marginLeft:"auto"}}><Button variant="outline" size="sm" onClick={() => onEdit(current)}><Pencil />Editar</Button><button className="icon-danger" aria-label={`Eliminar ${current.title}`} title="Eliminar hallazgo" onClick={() => onDelete(current.id)}><Trash2 /></button></span></div><div className="detail-fields"><label>Severidad<span>{current.severity}</span></label><label>Proyecto<span>{current.project || "Sin asignar"}</span></label></div><div><div className="field-title">Descripción</div><div className="text-box">{current.description || "Sin descripción"}</div></div></div> : <EmptyState icon={Bug} title="Selecciona un hallazgo" text="El detalle se mostrará aquí." />}</Section></div> : <Section><EmptyState icon={Bug} title="Sin hallazgos registrados" text="Carga únicamente hallazgos confirmados de tus pruebas." action={<Button onClick={create}><Plus />Nuevo hallazgo</Button>} /></Section>}</>;
}

function Library({ templates, create, onDelete }: { templates: Template[]; create: () => void; onDelete: (id: string) => void }) {
  const [viewing, setViewing] = useState<Template | null>(null);
  const del = (t: Template) => { onDelete(t.id); setViewing(null); };
  return <><Header title="Biblioteca de hallazgos" sub={`${templates.length} plantillas`}><Button onClick={create}><Plus />Nueva plantilla</Button></Header><Section>{templates.length ? <div className="data-table library-table"><div className="table-head"><span>Plantilla</span><span>CWE</span><span>Tipo</span><span>Severidad</span><span /></div>{templates.map(template=><div className="table-row" key={template.id}><b>{template.title}</b><span>{template.cwe || "—"}</span><span>{template.category}</span><em className={cn("severity",sevClass[template.severity])}>{template.severity}</em><span style={{display:"flex",gap:4}}><Button variant="ghost" size="sm" onClick={()=>setViewing(template)}>Ver</Button><button className="icon-danger" aria-label={`Eliminar ${template.title}`} title="Eliminar plantilla" onClick={()=>del(template)}><Trash2 /></button></span></div>)}</div> : <EmptyState icon={BookOpen} title="Biblioteca vacía" text="Agrega tus propias plantillas verificadas." action={<Button onClick={create}><Plus />Nueva plantilla</Button>} />}</Section>
  {viewing && <div className="modal-backdrop" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) setViewing(null); }}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="tpl-title"><div className="modal-head"><div><small>Plantilla</small><h2 id="tpl-title">{viewing.title}</h2></div><Button variant="ghost" size="icon" aria-label="Cerrar" onClick={()=>setViewing(null)}><X/></Button></div><div className="data-table"><div className="table-row"><span>CWE</span><b>{viewing.cwe || "—"}</b></div><div className="table-row"><span>Tipo</span><b>{viewing.category}</b></div><div className="table-row"><span>Severidad</span><em className={cn("severity",sevClass[viewing.severity])}>{viewing.severity}</em></div></div><div className="modal-actions"><Button variant="outline" onClick={()=>del(viewing)}><Trash2/>Eliminar</Button><Button onClick={()=>setViewing(null)}>Cerrar</Button></div></section></div>}</>;
}

type ReportFormat = "latex" | "pdf" | "docx" | "html" | "json";
const inProject = (f: Finding, p: Project) => f.projectId ? f.projectId === p.id : (f.project ?? "").trim().toLowerCase() === p.name.trim().toLowerCase();
const SEV_ORDER = ["Crítico", "Alto", "Medio", "Bajo", "Sin clasificar"];
// Normaliza variantes (p. ej. "Crítica", "alta") para que ningún hallazgo quede fuera del informe.
const sevOf = (f: { severity: string }) => { const v = (f.severity ?? "").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); if (v.startsWith("crit")) return "Crítico"; if (v.startsWith("alt")) return "Alto"; if (v.startsWith("med")) return "Medio"; if (v.startsWith("baj")) return "Bajo"; return "Sin clasificar"; };

const LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 44 44"><rect width="44" height="44" rx="10" fill="#141414"/><path d="M22 9 35 33H9Z" fill="none" stroke="#ED7D27" stroke-width="3" stroke-linejoin="round"/><circle cx="22" cy="9" r="3.4" fill="#ED7D27"/></svg>`;

function buildReportHtml(project: Project, list: Finding[], settings: SettingsState) {
  const esc = (s: string) => (s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));
  const counts = SEV_ORDER.map(s => [s, list.filter(f => sevOf(f) === s).length] as const).filter(([, n]) => n);
  const date = new Date().toLocaleDateString("es-AR");
  const org = settings.organization || BRAND.name;
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Informe — ${esc(project.name)}</title><style>body{font-family:Georgia,serif;max-width:760px;margin:40px auto;color:#141414;line-height:1.5}h1{font-size:24px;border-bottom:3px solid #D9641E;padding-bottom:8px}h2{font-size:17px;margin-top:28px;color:#41423A}h3{font-size:15px;margin:18px 0 4px}table{border-collapse:collapse;width:100%}td,th{border:1px solid #ccc;padding:6px 8px;text-align:left;font-size:13px}th{background:#ECE2D2}.f{border-left:3px solid #D9641E;padding-left:12px;margin-bottom:16px}pre{white-space:pre-wrap;font-family:inherit}.report-head{display:flex;align-items:center;gap:14px;margin-bottom:6px}.report-head .brand-name{font-size:20px;font-weight:bold;letter-spacing:.5px}.report-head .brand-sub{font-size:12px;color:#757575}.id-table td{border:none;padding:3px 10px 3px 0;font-size:13px}.id-table td:first-child{color:#757575;white-space:nowrap}.foot{margin-top:36px;border-top:1px solid #ccc;padding-top:8px;font-size:11px;color:#757575}</style></head><body>
<div class="report-head">${/^data:image\/(png|jpeg);base64,/.test(settings.latexLogo) ? `<img src="${settings.latexLogo}" alt="" style="width:44px;height:44px;object-fit:contain">` : LOGO_SVG}<div><div class="brand-name">${esc(org)}</div><div class="brand-sub">Informe de prueba de penetración${settings.userName ? ` · Emitido por ${esc(settings.userName)}${settings.role ? ` (${esc(settings.role)})` : ""}` : ""}${settings.email ? ` · ${esc(settings.email)}` : ""}</div></div></div>
<h1>Informe de prueba de penetración</h1>
<h2>Identificación del proyecto</h2>
<table class="id-table"><tr><td>Proyecto</td><td><b>${esc(project.name)}</b></td></tr><tr><td>ID de proyecto</td><td>${esc(project.id)}</td></tr><tr><td>Cliente</td><td>${esc(project.client)}</td></tr><tr><td>Tipo de evaluación</td><td>${esc(project.type)}</td></tr><tr><td>Estado</td><td>${esc(project.status)}</td></tr><tr><td>Período de ejecución</td><td>${esc(project.start)} — ${esc(project.end)}</td></tr><tr><td>Fecha de emisión</td><td>${date}</td></tr></table>
<h2>Resumen ejecutivo</h2><p>Se identificaron ${list.length} hallazgos durante la evaluación.</p>
<table><tr><th>Severidad</th><th>Cantidad</th></tr>${counts.map(([s, n]) => `<tr><td>${esc(s)}</td><td>${n}</td></tr>`).join("")}</table>
<h2>Detalle de hallazgos</h2>${list.map((f, i) => `<div class="f"><h3>${i + 1}. ${esc(f.title)}</h3><p><b>Severidad:</b> ${esc(f.severity)} · <b>Estado:</b> ${esc(f.status)}</p><pre>${esc(f.description || "Sin descripción")}</pre></div>`).join("")}
<div class="foot">${esc(org)} · Informe generado con ${BRAND.name} · ${date} · Documento confidencial</div>
</body></html>`;
}

function buildReportLatex(project: Project, list: Finding[], settings: SettingsState) {
  const t = (s: string) => (s ?? "").replace(/[\\{}&%$#_^~]/g, c => ({ "\\": "\\textbackslash{}", "{": "\\{", "}": "\\}", "&": "\\&", "%": "\\%", "$": "\\$", "#": "\\#", "_": "\\_", "^": "\\textasciicircum{}", "~": "\\textasciitilde{}" }[c]!));
  const multi = (s: string) => t(s).split(/\n{2,}/).map(p => p.replace(/\n/g, "\\\\\n")).join("\n\n");
  const counts = SEV_ORDER.map(s => [s, list.filter(f => sevOf(f) === s).length] as const).filter(([, n]) => n);
  const date = new Date().toLocaleDateString("es-AR");
  const org = t(settings.organization || BRAND.name);
  const issuer = settings.userName ? `Emitido por ${t(settings.userName)}${settings.role ? ` (${t(settings.role)})` : ""}${settings.email ? ` \\textperiodcentered{} ${t(settings.email)}` : ""}` : "";
  const color = (value: string, fallback: string) => /^#[0-9a-f]{6}$/i.test(value) ? value.slice(1).toUpperCase() : fallback;
  const primary = color(settings.latexPrimaryColor, "D9641E");
  const text = color(settings.latexTextColor, "141414");
  const secondary = color(settings.latexSecondaryColor, "757575");
  const contacts = [settings.teamPhone, settings.teamWebsite, settings.teamAddress].filter(Boolean).map(t);
  const findingsBySeverity = SEV_ORDER
    .map(severity => ({ severity, findings: list.filter(f => sevOf(f) === severity) }))
    .filter(group => group.findings.length > 0);
  const logoMatch = settings.latexLogo.match(/^data:image\/(png|jpeg);base64,([A-Za-z0-9+/=]+)$/);
  const logoExtension = logoMatch?.[1] === "jpeg" ? "jpg" : "png";
  const embeddedLogo = logoMatch ? `\\directlua{
local b="${logoMatch[2]}"
local a="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"
local d=b:gsub("[^"..a.."=]",""):gsub(".",function(x) if x=="=" then return "" end local r="" local f=a:find(x,1,true)-1 for i=6,1,-1 do r=r..(math.fmod(f,2^i)-math.fmod(f,2^(i-1))>0 and "1" or "0") end return r end):gsub("[01][01][01][01][01][01][01][01]",function(x) local c=0 for i=1,8 do c=c+(x:sub(i,i)=="1" and 2^(8-i) or 0) end return string.char(c) end)
local f=assert(io.open("team-logo.${logoExtension}","wb")) f:write(d) f:close()
}
` : "";
  const logo = logoMatch
    ? `\\includegraphics[width=1.1cm,height=1.1cm,keepaspectratio]{team-logo.${logoExtension}}`
    : `\\begin{tikzpicture}[baseline=-4pt]
  \\fill[vdark] (0,0) rectangle (1.1,1.1);
  \\draw[vorange,line width=1.4pt,line join=round] (0.55,0.88) -- (0.88,0.25) -- (0.22,0.25) -- cycle;
  \\fill[vorange] (0.55,0.88) circle (0.08);
\\end{tikzpicture}`;
  return `\\documentclass[11pt,a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
\\usepackage[spanish]{babel}
\\usepackage[margin=2.5cm]{geometry}
\\usepackage{xcolor,booktabs,tikz,fancyhdr,titlesec,graphicx,tabularx,array,needspace,hyperref}
\\definecolor{vorange}{HTML}{${primary}}
\\definecolor{vdark}{HTML}{${text}}
\\definecolor{vgray}{HTML}{${secondary}}
\\hypersetup{colorlinks=true,linkcolor=vdark,urlcolor=vorange,pdfauthor={${org}},pdftitle={Informe de prueba de penetración — ${t(project.name)}}}
\\setcounter{tocdepth}{2}
\\setlength{\\parindent}{0pt}
\\setlength{\\parskip}{0.55em}
\\renewcommand{\\arraystretch}{1.25}
\\titleformat{\\section}{\\Large\\bfseries\\color{vdark}}{\\thesection}{0.65em}{}[\\color{vorange}\\titlerule]
\\titleformat{\\subsection}{\\large\\bfseries\\color{vdark}}{\\thesubsection}{0.65em}{}
\\titlespacing*{\\section}{0pt}{2.2em}{1em}
\\titlespacing*{\\subsection}{0pt}{1.5em}{0.5em}
\\pagestyle{fancy}\\fancyhf{}
\\lhead{\\footnotesize\\color{vgray} ${t(project.name)}}
\\rhead{\\footnotesize\\color{vgray} Informe de prueba de penetración}
\\lfoot{\\footnotesize\\color{vgray} ${org} \\textperiodcentered{} Documento confidencial}
\\rfoot{\\footnotesize\\color{vgray} Página \\thepage}
\\renewcommand{\\headrulewidth}{0.4pt}
\\renewcommand{\\headrule}{\\hbox to\\headwidth{\\color{vorange}\\leaders\\hrule height \\headrulewidth\\hfill}}

\\newcommand{\\metarow}[2]{\\textcolor{vgray}{#1} & #2 \\\\[0.35em]}
\\newcommand{\\findingmeta}[2]{\\textcolor{vgray}{\\textbf{#1}} & #2 \\\\}

${embeddedLogo}\\begin{document}

% Portada
\\thispagestyle{empty}
\\noindent${logo}\\hspace{0.4cm}%
\\begin{minipage}[c]{0.78\\textwidth}
{\\Large\\bfseries ${org}}\\\\[0.2em]
{\\small\\color{vgray}${contacts.length ? contacts.join(" \\textperiodcentered{} ") : "Gestión e informes de pentest"}}
\\end{minipage}

\\vfill
{\\color{vorange}\\rule{\\textwidth}{2pt}}\\par
\\vspace{0.8cm}
{\\Huge\\bfseries Informe de prueba de penetración}\\par
\\vspace{0.35cm}
{\\LARGE\\color{vgray}${t(project.name)}}\\par
\\vspace{1.2cm}
\\begin{tabularx}{\\textwidth}{@{}>{\\raggedright\\arraybackslash}p{4cm}X@{}}
\\metarow{Cliente}{\\textbf{${t(project.client)}}}
\\metarow{Tipo de evaluación}{${t(project.type)}}
\\metarow{Período}{${t(project.start)} --- ${t(project.end)}}
\\metarow{Fecha de emisión}{${date}}
${issuer ? `\\metarow{Responsable}{${issuer.replace(/^Emitido por /, "")}}` : ""}
\\end{tabularx}
\\vfill
{\\small\\bfseries\\color{vorange} DOCUMENTO CONFIDENCIAL}\\par
{\\footnotesize\\color{vgray}ID del proyecto: ${t(project.id)}}
\\clearpage

% Índice
\\thispagestyle{plain}
\\tableofcontents
\\clearpage

\\section{Resumen ejecutivo}
Durante la evaluación se identificaron \\textbf{${list.length} hallazgos}. La siguiente tabla presenta su distribución por severidad para facilitar la priorización.

\\begin{center}
\\begin{tabular}{@{}lr@{}}
\\toprule
\\textbf{Severidad} & \\textbf{Cantidad} \\\\
\\midrule
${counts.length ? counts.map(([s, n]) => `${t(s)} & ${n} \\\\`).join("\n") : `Sin hallazgos & 0 \\\\`}
\\bottomrule
\\end{tabular}
\\end{center}

\\section{Identificación del proyecto}
\\begin{tabularx}{\\textwidth}{@{}>{\\raggedright\\arraybackslash}p{4.2cm}X@{}}
\\metarow{Proyecto}{\\textbf{${t(project.name)}}}
\\metarow{ID de proyecto}{\\texttt{${t(project.id)}}}
\\metarow{Cliente}{${t(project.client)}}
\\metarow{Tipo de evaluación}{${t(project.type)}}
\\metarow{Estado}{${t(project.status)}}
\\metarow{Período de ejecución}{${t(project.start)} --- ${t(project.end)}}
\\metarow{Fecha de emisión}{${date}}
\\end{tabularx}

\\section{Detalle de hallazgos}
${findingsBySeverity.length ? findingsBySeverity.map(group => `\\subsection{Severidad ${t(group.severity)}}
${group.findings.map((f, i) => `\\Needspace{8\\baselineskip}
\\subsubsection*{${i + 1}. ${t(f.title)}}
\\addcontentsline{toc}{subsubsection}{${t(f.title)}}
{\\color{vorange}\\rule{\\textwidth}{0.8pt}}
\\begin{tabularx}{\\textwidth}{@{}p{2.6cm}X@{}}
\\findingmeta{Severidad}{${t(f.severity)}}
\\findingmeta{Estado}{${t(f.status)}}
\\end{tabularx}

\\textbf{Descripción}\\par
${multi(f.description || "Sin descripción")}

\\vspace{1em}
`).join("\n")}`).join("\n") : "No se registraron hallazgos para este proyecto."}

\\vfill
{\\footnotesize\\color{vgray}Informe generado con ${BRAND.name}${contacts.length ? ` \\textperiodcentered{} ${contacts.join(" \\textperiodcentered{} ")}` : ""}.}

\\end{document}
`;
}

function generateReport(project: Project, findings: Finding[], format: ReportFormat, settings: SettingsState) {
  const list = findings.filter(f => inProject(f, project))
    .sort((a, b) => SEV_ORDER.indexOf(sevOf(a)) - SEV_ORDER.indexOf(sevOf(b)));
  const html = buildReportHtml(project, list, settings);
  const base = `Informe-${project.name.replace(/[^\w\-]+/g, "_")}`;
  const download = (content: string, type: string, ext: string) => {
    const url = URL.createObjectURL(new Blob([content], { type }));
    const a = document.createElement("a"); a.href = url; a.download = `${base}.${ext}`; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  if (format === "latex") download(buildReportLatex(project, list, settings), "application/x-tex", "tex");
  else if (format === "pdf") {
    printHtml(html);
  } else if (format === "docx") download("\ufeff" + html, "application/msword", "doc");
  else if (format === "html") download(html, "text/html", "html");
  else download(JSON.stringify({ project, findings: list, generatedAt: new Date().toISOString() }, null, 2), "application/json", "json");
}

function buildLatexPreviewHtml(project: Project, list: Finding[], settings: SettingsState) {
  const esc = (s: string) => (s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));
  const hex = (v: string, f: string) => /^#[0-9a-f]{6}$/i.test(v) ? v : f;
  const p = hex(settings.latexPrimaryColor, "#D9641E"), tx = hex(settings.latexTextColor, "#141414"), sc = hex(settings.latexSecondaryColor, "#757575");
  const org = esc(settings.organization || BRAND.name);
  const date = new Date().toLocaleDateString("es-AR");
  const contacts = [settings.teamPhone, settings.teamWebsite, settings.teamAddress].filter(Boolean).map(esc).join(" · ");
  const counts = SEV_ORDER.map(s => [s, list.filter(f => sevOf(f) === s).length] as const).filter(([, n]) => n);
  const findingsBySeverity = SEV_ORDER.map(severity => ({ severity, findings: list.filter(f => sevOf(f) === severity) })).filter(group => group.findings.length);
  const logo = /^data:image\/(png|jpeg);base64,/.test(settings.latexLogo)
    ? `<img src="${settings.latexLogo}" alt="" style="width:42px;height:42px;object-fit:contain">`
    : `<svg width="42" height="42" viewBox="0 0 44 44"><rect width="44" height="44" fill="${tx}"/><path d="M22 9 35 33H9Z" fill="none" stroke="${p}" stroke-width="3" stroke-linejoin="round"/><circle cx="22" cy="9" r="3.4" fill="${p}"/></svg>`;
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><style>body{margin:0;background:#8a8a8a;padding:24px;font-family:"Latin Modern Roman","Computer Modern",Georgia,serif}.page{background:#fff;color:${tx};max-width:640px;margin:0 auto 20px;padding:48px 56px;box-shadow:0 4px 20px rgba(0,0,0,.3);min-height:800px;box-sizing:border-box;display:flex;flex-direction:column}.cover{min-height:800px}.brand{display:flex;gap:12px;align-items:center}.brand b{font-size:18px}.brand small{display:block;color:${sc};font-size:11px}.cover-title{margin:auto 0}.cover-title h1{font-size:30px;line-height:1.15;margin:12px 0 6px}.project-name{font-size:19px;color:${sc}}.rule{height:2px;background:${p}}.conf{margin-top:auto;color:${p};font-size:11px;font-weight:bold}.hd{display:flex;justify-content:space-between;font-size:10px;color:${sc};border-bottom:.6px solid ${p};padding-bottom:4px;margin-bottom:24px}h1{font-size:22px;margin:0 0 12px}h2{font-size:16px;margin:22px 0 8px;border-bottom:1.5px solid ${p};padding-bottom:4px}h3{font-size:14px;margin:18px 0 6px}h4{font-size:13px;margin:14px 0 3px}table{border-collapse:collapse;font-size:12px;width:100%}td,th{padding:4px 14px 4px 0;text-align:left}th{border-bottom:1px solid ${tx}}.k{color:${sc};width:34%}.toc{font-size:12px;line-height:2}.toc span{float:right}.finding{border-top:1px solid ${p};margin-top:8px;padding-top:4px}.meta{display:flex;gap:20px;font-size:11px}.meta b{color:${sc}}p,pre{font-size:12px;white-space:pre-wrap;font-family:inherit;margin:5px 0;line-height:1.45}.ft{margin-top:auto;padding-top:28px;font-size:10px;color:${sc};text-align:center;border-top:.6px solid ${p}}</style></head><body>
<div class="page cover"><div class="brand">${logo}<div><b>${org}</b><small>${contacts || "Gestión e informes de pentest"}</small></div></div><div class="cover-title"><div class="rule"></div><h1>Informe de prueba de penetración</h1><div class="project-name">${esc(project.name)}</div><table style="margin-top:28px"><tr><td class="k">Cliente</td><td><b>${esc(project.client)}</b></td></tr><tr><td class="k">Tipo de evaluación</td><td>${esc(project.type)}</td></tr><tr><td class="k">Período</td><td>${esc(project.start)} — ${esc(project.end)}</td></tr><tr><td class="k">Fecha de emisión</td><td>${date}</td></tr></table></div><div class="conf">DOCUMENTO CONFIDENCIAL</div></div>
<div class="page"><div class="hd"><span>${org}</span><span>${esc(project.name)}</span></div><h1>Índice</h1><div class="toc">1. Resumen ejecutivo <span>3</span><br>2. Identificación del proyecto <span>3</span><br>3. Detalle de hallazgos <span>4</span></div><div class="ft">${org} · Documento confidencial</div></div>
<div class="page"><div class="hd"><span>${esc(project.name)}</span><span>Informe de prueba de penetración</span></div><h2>1. Resumen ejecutivo</h2><p>Durante la evaluación se identificaron <b>${list.length} hallazgos</b>. La siguiente tabla presenta su distribución por severidad.</p><table><tr><th>Severidad</th><th>Cantidad</th></tr>${counts.length ? counts.map(([s, n]) => `<tr><td>${s}</td><td>${n}</td></tr>`).join("") : "<tr><td>Sin hallazgos</td><td>0</td></tr>"}</table>
<h2>2. Identificación del proyecto</h2><table><tr><td class="k">Proyecto</td><td><b>${esc(project.name)}</b></td></tr><tr><td class="k">ID de proyecto</td><td>${esc(project.id)}</td></tr><tr><td class="k">Cliente</td><td>${esc(project.client)}</td></tr><tr><td class="k">Tipo</td><td>${esc(project.type)}</td></tr><tr><td class="k">Estado</td><td>${esc(project.status)}</td></tr><tr><td class="k">Período</td><td>${esc(project.start)} — ${esc(project.end)}</td></tr><tr><td class="k">Emisión</td><td>${date}</td></tr></table>
<h2>3. Detalle de hallazgos</h2>${findingsBySeverity.length ? findingsBySeverity.map(group => `<h3>3.${SEV_ORDER.indexOf(group.severity) + 1}. Severidad ${esc(group.severity)}</h3>${group.findings.map((f, i) => `<div class="finding"><h4>${i + 1}. ${esc(f.title)}</h4><div class="meta"><span><b>Severidad:</b> ${esc(f.severity)}</span><span><b>Estado:</b> ${esc(f.status)}</span></div><p><b>Descripción</b></p><pre>${esc(f.description || "Sin descripción")}</pre></div>`).join("")}`).join("") : "<p>No se registraron hallazgos para este proyecto.</p>"}<div class="ft">${org}${contacts ? ` · ${contacts}` : ""} · Documento confidencial</div></div>
</body></html>`;
}

function Reports({ projects, findings, settings }: { projects: Project[]; findings: Finding[]; settings: SettingsState }) {
  const [formats, setFormats] = useState<Record<string, ReportFormat>>({});
  const [preview, setPreview] = useState<Project | null>(null);
  const previewList = preview ? findings.filter(f => inProject(f, preview)) : [];
  return <><Header title="Informes" sub="Genera informes a partir de datos cargados" />{(() => { const loose = findings.filter(f => !projects.some(p => inProject(f, p))).length; return loose ? <Section><p className="form-error">{loose === 1 ? "Hay 1 hallazgo sin proyecto asignado" : `Hay ${loose} hallazgos sin proyecto asignado`}: no aparece en ningún informe. Editalo en Hallazgos y elegí su proyecto.</p></Section> : null; })()}{projects.length ? <Section title="Proyectos disponibles"><div className="simple-records">{projects.map(project => { const total=findings.filter(f=>inProject(f, project)).length; const fmt = formats[project.id] ?? "latex"; return <div key={project.id}><span><b>{project.name}</b><small>{project.client}</small></span><span>{total} hallazgos</span><span style={{display:"flex",gap:8,alignItems:"center"}}><select aria-label="Formato del informe" className="report-format" value={fmt} onChange={e => setFormats({ ...formats, [project.id]: e.target.value as ReportFormat })}><option value="latex">LaTeX</option><option value="pdf">PDF</option><option value="docx">Word</option><option value="html">HTML</option><option value="json">JSON</option></select>{fmt === "latex" ? <Button size="sm" variant="outline" disabled={!total} onClick={() => setPreview(project)}><Eye/>Vista previa</Button> : null}<Button size="sm" disabled={!total} onClick={() => generateReport(project, findings, fmt, settings)}><FileText/>Generar</Button></span></div>;})}</div></Section> : <Section><EmptyState icon={FileText} title="No hay informes para generar" text="Primero carga un proyecto y sus hallazgos reales." /></Section>}
  {preview ? <div className="modal-backdrop" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) setPreview(null); }}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="latex-preview-title" style={{ width: "min(860px, 96vw)", maxWidth: "none" }}>
    <div className="modal-head"><div><small>Vista previa LaTeX</small><h2 id="latex-preview-title">{preview.name}</h2></div><Button variant="ghost" size="icon" aria-label="Cerrar" onClick={() => setPreview(null)}><X/></Button></div>
    <iframe title="Vista previa del informe LaTeX" srcDoc={buildLatexPreviewHtml(preview, previewList, settings)} style={{ width: "100%", height: "65vh", border: 0, display: "block" }} />
    <p className="field-help">Aproximación visual del documento compilado. Logotipo, colores y contacto se toman de Configuración → Plantilla LaTeX.</p>
    <div className="modal-actions"><Button variant="outline" onClick={() => setPreview(null)}>Cerrar</Button><Button onClick={() => { generateReport(preview, findings, "latex", settings); setPreview(null); }}><FileText/>Exportar .tex</Button></div>
  </section></div> : null}</>;
}

function Clients({ clients, create, onDelete }: { clients: Client[]; create: () => void; onDelete: (id: string) => void }) {
  const del = (client: Client) => onDelete(client.id);
  return <><Header title="Clientes" sub={`${clients.length} clientes registrados`}><Button onClick={create}><Plus />Nuevo cliente</Button></Header><Section>{clients.length ? <div className="simple-records">{clients.map(client=><div key={client.id}><span className="record-avatar">{client.name.slice(0,2).toUpperCase()}</span><span><b>{client.name}</b><small>{client.industry || "Sin industria"}</small></span><span><b>{client.contact || "Sin contacto"}</b><small>{client.email || "Sin correo"}</small></span><span><button className="icon-danger" aria-label={`Eliminar ${client.name}`} title="Eliminar cliente" onClick={() => del(client)}><Trash2 /></button></span></div>)}</div> : <EmptyState icon={Building2} title="Sin clientes cargados" text="Registra clientes reales para vincularlos con sus proyectos." action={<Button onClick={create}><Plus />Nuevo cliente</Button>} />}</Section></>;
}

function SettingsPage({ settings, onSave, exportData, importData, audit, onDeleteAudit, onClearAudit, onResetSettings }: { settings: SettingsState; onSave: (settings: SettingsState) => void; exportData: () => void; importData: () => void; audit: AuditEntry[]; onDeleteAudit: (id: string) => void; onClearAudit: () => void; onResetSettings: () => void }) {
  const [draft, setDraft] = useState(settings);
  const logoRef = useRef<HTMLInputElement>(null);
  useEffect(() => setDraft(settings), [settings]);
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); onSave(draft); };
  const set = <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => setDraft(current => ({ ...current, [key]: value }));
  const loadLogo = (file?: File) => {
    if (!file) return;
    if (!/^image\/(png|jpeg)$/.test(file.type) || file.size > 1024 * 1024) { window.alert("Usa una imagen PNG o JPG de hasta 1 MB."); return; }
    const reader = new FileReader();
    reader.onload = () => { if (typeof reader.result === "string") set("latexLogo", reader.result); };
    reader.readAsDataURL(file);
  };
  return <><Header title="Configuración" sub="Administra los datos y preferencias de tu espacio de trabajo"><Button type="button" variant="outline" onClick={importData}><Download />Importar datos</Button><Button type="button" variant="outline" onClick={exportData}><Upload />Exportar datos</Button></Header>
    <form className="settings-layout" onSubmit={submit}>
      <div className="stack">
        <Section title="Consultora" className="settings-section"><Field label="Nombre de la consultora" name="organization" value={draft.organization} required onChange={value => set("organization", value)} /><p className="field-help">Este nombre se muestra en la navegación y en los informes.</p></Section>
        <Section title="Perfil" className="settings-section"><div className="form-grid"><Field label="Nombre completo" name="userName" value={draft.userName} required onChange={value => set("userName", value)} /><Field label="Correo electrónico" name="email" type="email" value={draft.email} required onChange={value => set("email", value)} /><SelectField label="Rol" name="role" options={["Responsable","Pentester","Revisor"]} value={draft.role} onChange={value => set("role", value)} /><SelectField label="Zona horaria" name="timezone" options={["America/Argentina/Buenos_Aires","America/Bogota","America/Santiago","America/Mexico_City","Europe/Madrid"]} value={draft.timezone} onChange={value => set("timezone", value)} /></div></Section>
        <Section title="Plantilla LaTeX" className="settings-section">
          <div className="latex-logo-row"><div className="latex-logo-preview">{draft.latexLogo ? <img src={draft.latexLogo} alt="Logotipo del equipo" /> : <span className="brand-mark" />}</div><div><b>Logotipo del equipo</b><small>PNG o JPG, hasta 1 MB. Se incluirá dentro del archivo .tex.</small><div className="latex-logo-actions"><input ref={logoRef} hidden type="file" accept="image/png,image/jpeg" onChange={event => { loadLogo(event.target.files?.[0]); event.target.value = ""; }} /><Button type="button" variant="outline" size="sm" onClick={() => logoRef.current?.click()}><Upload />{draft.latexLogo ? "Cambiar" : "Cargar"}</Button>{draft.latexLogo ? <Button type="button" variant="ghost" size="sm" onClick={() => set("latexLogo", "")}><Trash2 />Quitar</Button> : null}</div></div></div>
          <div className="latex-color-grid"><ColorField label="Color principal" value={draft.latexPrimaryColor} onChange={value => set("latexPrimaryColor", value)} /><ColorField label="Color de texto" value={draft.latexTextColor} onChange={value => set("latexTextColor", value)} /><ColorField label="Color secundario" value={draft.latexSecondaryColor} onChange={value => set("latexSecondaryColor", value)} /></div>
          <div className="form-grid latex-contact-grid"><Field label="Teléfono del equipo" name="teamPhone" type="tel" value={draft.teamPhone} onChange={value => set("teamPhone", value)} /><Field label="Sitio web" name="teamWebsite" type="url" placeholder="https://" value={draft.teamWebsite} onChange={value => set("teamWebsite", value)} /><Field label="Dirección" name="teamAddress" value={draft.teamAddress} onChange={value => set("teamAddress", value)} /></div>
          <p className="field-help">Los campos vacíos no aparecerán en el informe. Con un logotipo personalizado, compila el archivo con LuaLaTeX.</p>
        </Section>
      </div>
      <div className="stack">
        <Section title="Notificaciones" className="settings-section"><div className="setting-row"><span><b>Alertas por correo</b><small>Recibe avisos sobre autorizaciones y hallazgos.</small></span><label className="switch"><input type="checkbox" checked={draft.emailAlerts} onChange={event => set("emailAlerts", event.target.checked)} /><i /></label></div><div className="setting-row"><span><b>Informes listos</b><small>Recibe un aviso cuando un informe esté disponible.</small></span><label className="switch"><input type="checkbox" checked={draft.reportAlerts} onChange={event => set("reportAlerts", event.target.checked)} /><i /></label></div></Section>
        <div className="settings-actions">
          <Button type="submit" size="lg"><Check />Guardar configuración</Button>
          <Button type="button" variant="outline" onClick={onResetSettings}><RotateCcw />Restablecer configuración</Button>
        </div>
      </div>
    </form>
    <Section title="Registro de auditoría" className="settings-section" action={audit.length ? <Button type="button" variant="outline" size="sm" onClick={onClearAudit}><Trash2 />Borrar todo</Button> : undefined}>{audit.length ? <div className="data-table audit-table"><div className="table-head"><span>Fecha y hora</span><span>Usuario</span><span>Acción</span><span>Detalle</span><span /></div>{audit.map(e => <div className="table-row" key={e.id}><span>{new Date(e.at).toLocaleString("es-AR")}</span><span>{e.user}</span><Status tone={e.action === "Eliminación" ? "warning" : "info"}>{e.action}</Status><span>{e.detail}</span><span><button className="icon-danger" aria-label="Eliminar registro" title="Eliminar registro" onClick={() => onDeleteAudit(e.id)}><Trash2 /></button></span></div>)}</div> : <EmptyState icon={FileText} title="Sin acciones registradas" text="Aquí se registrarán las exportaciones y eliminaciones." />}</Section>
    <Section title="Acerca de" className="settings-section"><div className="setting-row"><span><b>{BRAND.name} {BRAND.version}</b><small>{BRAND.tagline} · Licencia {BRAND.license}</small></span></div><p className="field-help">Este programa es software libre: puedes redistribuirlo y modificarlo según los términos de la licencia GNU AGPL v3. Se distribuye sin ninguna garantía.</p><p className="field-help">Código fuente: <a href={BRAND.repository} target="_blank" rel="noreferrer">{BRAND.repository}</a></p><p className="field-help">Tus datos se guardan únicamente en este equipo. Esta aplicación no se conecta a internet ni envía información a terceros.</p></Section>
  </>;
}

function CreateDialog({ kind, projects, templates = [], editing, onClose, onSave }: { kind: Exclude<CreateKind,null>; projects: Project[]; templates?: Template[]; editing?: Finding | Project; onClose: () => void; onSave: (kind: Exclude<CreateKind,null>, item: Project | Finding | Client | Template) => void }) {
  const editingFinding = kind === "finding" ? editing as Finding | undefined : undefined;
  const editingProject = kind === "project" ? editing as Project | undefined : undefined;
  const labels = { project: editingProject ? "Editar proyecto" : "Nuevo proyecto", finding: editingFinding ? "Editar hallazgo" : "Nuevo hallazgo", client: "Nuevo cliente", template: "Nueva plantilla" };
  const [tplId, setTplId] = useState(""); const [fTitle, setFTitle] = useState(editingFinding?.title ?? ""); const [fSev, setFSev] = useState(editingFinding?.severity ?? "Crítico"); const [fDesc, setFDesc] = useState(editingFinding?.description ?? "");
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); const form = new FormData(event.currentTarget); const id = editing?.id ?? crypto.randomUUID();
    if (kind === "project") onSave(kind,{id,name:String(form.get("name")),client:String(form.get("client")),type:String(form.get("type")),status:String(form.get("status")),start:String(form.get("start")),end:String(form.get("end"))});
    if (kind === "finding") onSave(kind,{id,title:String(form.get("title")),severity:String(form.get("severity")),status:String(form.get("status")),projectId:String(form.get("projectId")) || undefined,project:projects.find(p=>p.id===form.get("projectId"))?.name ?? "",description:String(form.get("description"))});
    if (kind === "client") onSave(kind,{id,name:String(form.get("name")),industry:String(form.get("industry")),contact:String(form.get("contact")),email:String(form.get("email"))});
    if (kind === "template") onSave(kind,{id,title:String(form.get("title")),cwe:String(form.get("cwe")),category:String(form.get("category")),severity:String(form.get("severity"))});
  };
  return <div className="modal-backdrop" role="presentation" onMouseDown={event => { if(event.target===event.currentTarget) onClose(); }}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="dialog-title"><div className="modal-head"><div><small>Carga de datos</small><h2 id="dialog-title">{labels[kind]}</h2></div><Button variant="ghost" size="icon" aria-label="Cerrar" onClick={onClose}><X/></Button></div><form onSubmit={submit}>
    {kind === "project" && <><Field label="Nombre del proyecto" name="name" required defaultValue={editingProject?.name}/><Field label="Cliente" name="client" required defaultValue={editingProject?.client}/><div className="form-grid"><SelectField label="Tipo" name="type" options={["Aplicación web","API","App móvil","Red interna","Red externa","Nube"]} defaultValue={editingProject?.type}/><SelectField label="Estado" name="status" options={PROJECT_STATUSES} defaultValue={editingProject?.status}/><Field label="Fecha de inicio" name="start" type="date" required defaultValue={editingProject?.start}/><Field label="Fecha de fin" name="end" type="date" required defaultValue={editingProject?.end}/></div></>}
    {kind === "finding" && <>{!editingFinding && templates.length > 0 && <label className="form-field">Partir de una plantilla<select value={tplId} onChange={e => { const t = templates.find(x => x.id === e.target.value); setTplId(e.target.value); if (t) { setFTitle(t.title); setFSev(t.severity); setFDesc([t.cwe && `CWE: ${t.cwe}`, `Tipo: ${t.category}`].filter(Boolean).join("\n")); } }}><option value="">Sin plantilla</option>{templates.map(t=><option key={t.id} value={t.id}>{t.title}{t.cwe ? ` (${t.cwe})` : ""}</option>)}</select></label>}<Field label="Título" name="title" required value={fTitle} onChange={setFTitle}/><div className="form-grid"><SelectField label="Severidad" name="severity" options={["Crítico","Alto","Medio","Bajo"]} value={fSev} onChange={setFSev}/><SelectField label="Estado" name="status" options={["Borrador","En revisión","Revisado","Cerrado"]} defaultValue={editingFinding?.status}/></div><label className="form-field">Proyecto<select name="projectId" defaultValue={editingFinding?.projectId ?? ""}><option value="">Sin asignar</option>{projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label><label className="form-field">Descripción<textarea name="description" rows={4} value={fDesc} onChange={e => setFDesc(e.target.value)}/></label></>}
    {kind === "client" && <><Field label="Nombre o razón social" name="name" required/><Field label="Industria" name="industry"/><Field label="Contacto principal" name="contact"/><Field label="Correo" name="email" type="email"/></>}
    {kind === "template" && <><Field label="Nombre de la plantilla" name="title" required/><div className="form-grid"><Field label="CWE" name="cwe" placeholder="CWE-000"/><SelectField label="Tipo" name="category" options={["Web","API","Red","Móvil","Nube"]}/><SelectField label="Severidad" name="severity" options={["Crítico","Alto","Medio","Bajo"]}/></div></>}
    <div className="modal-actions"><Button type="button" variant="outline" onClick={onClose}>Cancelar</Button><Button type="submit">Guardar datos</Button></div>
  </form></section></div>;
}
function Field({label,name,type="text",required,placeholder,value,onChange,defaultValue}:{label:string;name:string;type?:string;required?:boolean;placeholder?:string;value?:string;onChange?:(value:string)=>void;defaultValue?:string}) { return <label className="form-field">{label}<input name={name} type={type} required={required} placeholder={placeholder} value={value} defaultValue={value === undefined ? defaultValue : undefined} onChange={onChange ? event => onChange(event.target.value) : undefined}/></label>; }
function SelectField({label,name,options,empty,value,onChange,defaultValue}:{label:string;name:string;options:string[];empty?:string;value?:string;onChange?:(value:string)=>void;defaultValue?:string | undefined}) { return <label className="form-field">{label}<select name={name} value={value} defaultValue={value === undefined ? defaultValue : undefined} onChange={onChange ? event => onChange(event.target.value) : undefined}>{empty ? <option value="">{empty}</option> : null}{options.map(option=><option key={option}>{option}</option>)}</select></label>; }
function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className="form-field color-field">{label}<span><input type="color" value={value} onChange={event => onChange(event.target.value.toUpperCase())} /><input aria-label={`${label} hexadecimal`} value={value} maxLength={7} pattern="#[0-9A-Fa-f]{6}" onChange={event => onChange(event.target.value)} /></span></label>; }
