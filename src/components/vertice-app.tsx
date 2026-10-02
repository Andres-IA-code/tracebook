import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import {
  AlertTriangle, BookOpen, Bug, Building2, Check, ChevronDown, FileText, FolderOpen,
  LayoutDashboard, LogOut, Menu, Plus, Search, Settings, ShieldCheck, Trash2, Upload, Download, X,
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
type SettingsState = { organization: string; userName: string; email: string; role: string; timezone: string; emailAlerts: boolean; reportAlerts: boolean };
type CreateKind = "project" | "finding" | "client" | "template" | null;

const EMPTY_DATA: DataState = { projects: [], findings: [], clients: [], templates: [], authorizations: [] };
const STORAGE_KEY = "vertice-workspace-data";
const SETTINGS_KEY = "vertice-settings";
const DEFAULT_SETTINGS: SettingsState = { organization: "", userName: "", email: "", role: "Responsable", timezone: "America/Argentina/Buenos_Aires", emailAlerts: true, reportAlerts: true };

type AuditEntry = { id: string; at: string; user: string; action: "Importación" | "Exportación" | "Eliminación"; detail: string };
const AUDIT_KEY = "vertice-audit";
type Backup = { data: DataState; settings?: Partial<SettingsState> | undefined };
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
function mergeById<T extends { id: string }>(a: T[], b: T[]) { const ids = new Set(a.map(x => x.id)); return [...a, ...b.filter(x => !ids.has(x.id))]; }
function exportBackup(data: DataState, settings: SettingsState) {
  const content = JSON.stringify({ ...data, settings, exportedAt: new Date().toISOString(), app: "Vértice" }, null, 2);
  const url = URL.createObjectURL(new Blob([content], { type: "application/json" }));
  const a = document.createElement("a"); a.href = url; a.download = `vertice-respaldo-${new Date().toISOString().slice(0, 10)}.json`; a.click();
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

export function VerticeApp() {
  const [view, setView] = useState<View>("panel");
  const [mobileNav, setMobileNav] = useState(false);
  const [notice, setNotice] = useState("");
  const [data, setData] = useState<DataState>(EMPTY_DATA);
  const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS);
  const [createKind, setCreateKind] = useState<CreateKind>(null);
  const importRef = useRef<HTMLInputElement>(null);
  const [pendingImport, setPendingImport] = useState<Backup | null>(null);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  useEffect(() => { try { const a = JSON.parse(window.localStorage.getItem(AUDIT_KEY) ?? "[]"); if (Array.isArray(a)) setAudit(a); } catch { /* ignore */ } }, []);
  const log = (action: AuditEntry["action"], detail: string) => setAudit(current => {
    const next = [{ id: crypto.randomUUID(), at: new Date().toISOString(), user: settings.userName || "Usuario sin nombre", action, detail }, ...current].slice(0, 500);
    window.localStorage.setItem(AUDIT_KEY, JSON.stringify(next)); return next;
  });
  const doExport = () => { exportBackup(data, settings); log("Exportación", `Respaldo completo: ${data.projects.length} proyectos, ${data.findings.length} hallazgos, ${(data.authorizations ?? []).length} autorizaciones`); };

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
  const confirm = (message: string) => { setNotice(message); window.setTimeout(() => setNotice(""), 2600); };
  const go = (next: View) => { setView(next); setMobileNav(false); };
  const addItem = (kind: Exclude<CreateKind, null>, item: Project | Finding | Client | Template) => {
    const key = kind === "project" ? "projects" : kind === "finding" ? "findings" : kind === "client" ? "clients" : "templates";
    updateData({ ...data, [key]: [...data[key], item] });
    setCreateKind(null);
    confirm("Datos guardados correctamente");
  };
  const importData = async (file?: File) => {
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text()) as Partial<DataState> & { settings?: Partial<SettingsState> };
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error();
      const backup: Backup = { data: normalizeData(parsed), settings: parsed.settings && typeof parsed.settings === "object" ? parsed.settings : undefined };
      const hasData = Object.values(data).some(list => list.length > 0);
      if (hasData) setPendingImport(backup); else applyImport(backup, "replace");
    } catch { confirm("El archivo no tiene un formato válido"); }
    if (importRef.current) importRef.current.value = "";
  };
  const applyImport = (backup: Backup, mode: "merge" | "replace") => {
    if (mode === "replace") {
      updateData(backup.data);
      if (backup.settings) { const s = { ...DEFAULT_SETTINGS, ...backup.settings }; setSettings(s); window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); }
    } else {
      updateData(normalizeData({ projects: mergeById(data.projects, backup.data.projects), findings: mergeById(data.findings, backup.data.findings), clients: mergeById(data.clients, backup.data.clients), templates: mergeById(data.templates, backup.data.templates), authorizations: mergeById(data.authorizations ?? [], backup.data.authorizations) }));
    }
    const b = backup.data;
    log("Importación", `${mode === "replace" ? "Reemplazar todo" : "Combinar"}: ${b.projects.length} proyectos, ${b.findings.length} hallazgos, ${b.clients.length} clientes, ${b.templates.length} plantillas, ${b.authorizations.length} autorizaciones`);
    setPendingImport(null); confirm("Datos importados correctamente");
  };
  const deleteProject = (id: string) => {
    const p = data.projects.find(x => x.id === id); if (!p) return;
    const nf = data.findings.filter(f => f.projectId === id).length;
    const na = (data.authorizations ?? []).filter(a => a.projectId === id).length;
    if (!window.confirm(`¿Eliminar el proyecto "${p.name}"? También se eliminarán ${nf} hallazgo(s) y ${na} autorización(es) vinculados. Esta acción no se puede deshacer.`)) return;
    updateData({ ...data, projects: data.projects.filter(x => x.id !== id), findings: data.findings.filter(f => f.projectId !== id), authorizations: (data.authorizations ?? []).filter(a => a.projectId !== id) });
    log("Eliminación", `Proyecto "${p.name}" con ${nf} hallazgo(s) y ${na} autorización(es)`);
    confirm("Proyecto eliminado");
  };
  const activeProjects = data.projects.filter(project => project.status !== "Entregado").length;
  const openFindings = data.findings.filter(finding => finding.status !== "Cerrado").length;
  const critical = data.findings.filter(finding => finding.severity === "Crítico" && finding.status !== "Cerrado").length;
  const pendingReports = data.projects.filter(project => project.status === "En revisión").length;
  return <div className="app-shell">
    <aside className={cn("sidebar", mobileNav && "sidebar-open")}>
      <div className="brand"><span className="brand-mark" />Vértice<Button variant="ghost" size="icon" className="close-nav" aria-label="Cerrar menú" onClick={() => setMobileNav(false)}><X /></Button></div>
      <button className="org-switcher" onClick={() => go("configuracion")}><span className="org-avatar">{initials(settings.organization || "Vértice")}</span><span><b>{settings.organization || "Mi consultora"}</b><small>Espacio de trabajo</small></span><ChevronDown /></button>
      <nav aria-label="Navegación principal">{navItems.map(([key,label,Icon]) => <button key={key} className={cn("nav-item", view === key && "active")} onClick={() => go(key)}><Icon /><span>{label}</span></button>)}</nav>
      <div className="sidebar-foot"><button className={cn("nav-item", view === "configuracion" && "active")} onClick={() => go("configuracion")}><Settings /><span>Configuración</span></button>{isDesktopApp ? <button className="nav-item nav-exit" onClick={() => window.verticeDesktop?.quit()}><LogOut /><span>Salir</span></button> : null}<div className="profile"><span>{initials(settings.userName || "Usuario")}</span><div><b>{settings.userName || "Usuario"}</b><small>{settings.role}</small></div></div></div>
    </aside>
    {mobileNav ? <button className="nav-scrim" aria-label="Cerrar menú" onClick={() => setMobileNav(false)} /> : null}
    <div className="workspace"><div className="mobile-bar"><Button variant="ghost" size="icon" aria-label="Abrir menú" onClick={() => setMobileNav(true)}><Menu /></Button><div className="brand"><span className="brand-mark" />Vértice</div></div>
      <main className="page">
        {view === "panel" && <Dashboard data={data} counts={[activeProjects,openFindings,critical,pendingReports]} go={go} create={() => setCreateKind("project")} importRef={importRef} importData={importData} exportData={doExport} />}
        {view === "proyectos" && <Projects projects={data.projects} create={() => setCreateKind("project")} onDelete={deleteProject} />}
        {view === "autorizaciones" && <Authorizations items={data.authorizations ?? []} projects={data.projects} onChange={authorizations => { (data.authorizations ?? []).filter(a => !authorizations.some(x => x.id === a.id)).forEach(a => log("Eliminación", `Autorización de "${a.projectName}" (${a.client})`)); updateData({ ...data, authorizations }); }} goProjects={() => go("proyectos")} notify={confirm} />}
        {view === "hallazgos" && <Findings findings={data.findings} create={() => setCreateKind("finding")} />}
        {view === "biblioteca" && <Library templates={data.templates} create={() => setCreateKind("template")} onDelete={id => { const t = data.templates.find(x => x.id === id); updateData({ ...data, templates: data.templates.filter(x => x.id !== id) }); if (t) log("Eliminación", `Plantilla "${t.title}"`); confirm("Plantilla eliminada"); }} />}
        {view === "informes" && <Reports projects={data.projects} findings={data.findings} settings={settings} />}
        {view === "clientes" && <Clients clients={data.clients} create={() => setCreateKind("client")} />}
        {view === "configuracion" && <SettingsPage settings={settings} onSave={updateSettings} exportData={doExport} audit={audit} />}
      </main>
    </div>
    {createKind ? <CreateDialog kind={createKind} projects={data.projects} templates={data.templates} onClose={() => setCreateKind(null)} onSave={addItem} /> : null}
    {pendingImport ? <div className="modal-backdrop" role="presentation"><section className="modal" role="dialog" aria-modal="true" aria-labelledby="import-title">
      <div className="modal-head"><div><small>Importar datos</small><h2 id="import-title">Ya tenés datos cargados</h2></div><Button variant="ghost" size="icon" aria-label="Cerrar" onClick={() => setPendingImport(null)}><X /></Button></div>
      <form onSubmit={e => e.preventDefault()}>
        <p>El archivo contiene {pendingImport.data.projects.length} proyectos, {pendingImport.data.findings.length} hallazgos, {pendingImport.data.clients.length} clientes, {pendingImport.data.templates.length} plantillas y {pendingImport.data.authorizations.length} autorizaciones. ¿Cómo querés importarlo?</p>
        <p><b>Combinar:</b> añade los registros nuevos y no duplica los que tienen el mismo identificador.</p>
        <p><b>Reemplazar todo:</b> <AlertTriangle style={{display:"inline",width:14,height:14}} /> se perderán todos los datos actuales{pendingImport.settings ? " y se restaurará la configuración del respaldo" : ""}.</p>
        <div className="modal-actions"><Button type="button" variant="outline" onClick={() => setPendingImport(null)}>Cancelar</Button><Button type="button" variant="outline" onClick={() => { if (window.confirm("Se perderán todos los datos actuales. ¿Continuar?")) applyImport(pendingImport, "replace"); }}>Reemplazar todo</Button><Button type="button" onClick={() => applyImport(pendingImport, "merge")}>Combinar</Button></div>
      </form></section></div> : null}
    {notice ? <div className="toast"><Check />{notice}</div> : null}
  </div>;
}

function initials(value: string) {
  return value.trim().split(/\s+/).slice(0, 2).map(part => part[0]?.toUpperCase() ?? "").join("") || "—";
}

declare global {
  interface Window {
    verticeDesktop?: { quit: () => void };
  }
}

// "Salir" only makes sense in the installed desktop app; browsers block closing tabs.
const isDesktopApp = typeof navigator !== "undefined" && /Electron/i.test(navigator.userAgent);

function Dashboard({ data, counts, go, create, importRef, importData, exportData }: { data: DataState; counts: number[]; go: (v: View) => void; create: () => void; importRef: React.RefObject<HTMLInputElement | null>; importData: (file?: File) => void; exportData: () => void }) {
  const date = new Intl.DateTimeFormat("es-AR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date());
  const metrics = [["Proyectos activos",counts[0],FolderOpen],["Hallazgos abiertos",counts[1],Bug],["Críticos",counts[2],AlertTriangle],["Informes por entregar",counts[3],FileText]] as const;
  return <><Header title="Panel de control" sub={date.charAt(0).toUpperCase()+date.slice(1)}><input ref={importRef} hidden type="file" accept="application/json,.json" onChange={event => importData(event.target.files?.[0])}/><Button variant="outline" onClick={() => importRef.current?.click()}><Download />Importar datos</Button><Button variant="outline" onClick={exportData}><Upload />Exportar datos</Button></Header>
    <div className="metric-grid">{metrics.map(([label,value,Icon]) => <div className="metric" key={label}><span><Icon />{label}</span><strong>{value}</strong></div>)}</div>
    <Section title="Proyectos en curso" action={data.projects.length ? <button className="text-link" onClick={() => go("proyectos")}>Ver todos</button> : null}>{data.projects.length ? <div className="data-table dashboard-table"><div className="table-head"><span>Proyecto</span><span>Tipo</span><span>Estado</span><span>Cliente</span><span /></div>{data.projects.slice(0,5).map(project => <button className="table-row" key={project.id} onClick={() => go("proyectos")}><span><b>{project.name}</b><small>{project.start} — {project.end}</small></span><span>{project.type}</span><Status tone="info">{project.status}</Status><span>{project.client}</span><span>→</span></button>)}</div> : <EmptyState icon={FolderOpen} title="Todavía no hay proyectos" text="Crea el primero o importa un archivo con tus datos." action={<Button onClick={create}><Plus />Crear proyecto</Button>} />}</Section>
  </>;
}

function Projects({ projects, create, onDelete }: { projects: Project[]; create: () => void; onDelete: (id: string) => void }) {
  const [query,setQuery] = useState("");
  const rows = projects.filter(project => `${project.name} ${project.client}`.toLowerCase().includes(query.toLowerCase()));
  return <><Header title="Proyectos" sub={`${projects.length} proyectos`}><label className="search"><Search /><input aria-label="Buscar proyecto o cliente" placeholder="Buscar proyecto o cliente" value={query} onChange={e=>setQuery(e.target.value)}/></label><Button onClick={create}><Plus />Nuevo proyecto</Button></Header><Section>{projects.length ? <><div className="data-table projects-table"><div className="table-head"><span>Proyecto</span><span>Estado</span><span>Fechas</span><span>Cliente</span><span>Tipo</span><span /></div>{rows.map(project => <div className="table-row" key={project.id}><span><b>{project.name}</b><small>{project.client}</small></span><Status tone="info">{project.status}</Status><span>{project.start} — {project.end}</span><span>{project.client}</span><span>{project.type}</span><span><button className="icon-danger" aria-label={`Eliminar ${project.name}`} title="Eliminar proyecto" onClick={() => onDelete(project.id)}><Trash2 /></button></span></div>)}</div><div className="table-foot"><span>Mostrando {rows.length} de {projects.length}</span></div></> : <EmptyState icon={FolderOpen} title="Sin proyectos cargados" text="Registra un proyecto real para comenzar a trabajar." action={<Button onClick={create}><Plus />Nuevo proyecto</Button>} />}</Section></>;
}

function Findings({ findings, create }: { findings: Finding[]; create: () => void }) {
  const [query,setQuery] = useState(""); const [selected,setSelected] = useState<string | null>(null);
  const visible = findings.filter(f => f.title.toLowerCase().includes(query.toLowerCase()));
  const current = findings.find(f => f.id === selected);
  return <><Header title="Hallazgos" sub={`${findings.length} hallazgos registrados`}><Button onClick={create}><Plus />Nuevo hallazgo</Button></Header>{findings.length ? <div className="findings-grid"><Section><div className="finding-tools"><label className="search wide"><Search/><input aria-label="Buscar hallazgos" placeholder="Buscar hallazgos" value={query} onChange={e=>setQuery(e.target.value)}/></label></div><div className="finding-list">{visible.map((finding,index)=><button key={finding.id} className={selected===finding.id?"active":""} onClick={()=>setSelected(finding.id)}><span>{String(index+1).padStart(2,"0")}</span><div><b>{finding.title}</b><small>{finding.project || "Sin proyecto"}</small></div><span className={cn("severity",sevClass[finding.severity])}>{finding.severity}</span></button>)}</div></Section><Section>{current ? <div className="detail-body"><div className="detail-head"><span>{current.status}</span><h2>{current.title}</h2></div><div className="detail-fields"><label>Severidad<span>{current.severity}</span></label><label>Proyecto<span>{current.project || "Sin asignar"}</span></label></div><div><div className="field-title">Descripción</div><div className="text-box">{current.description || "Sin descripción"}</div></div></div> : <EmptyState icon={Bug} title="Selecciona un hallazgo" text="El detalle se mostrará aquí." />}</Section></div> : <Section><EmptyState icon={Bug} title="Sin hallazgos registrados" text="Carga únicamente hallazgos confirmados de tus pruebas." action={<Button onClick={create}><Plus />Nuevo hallazgo</Button>} /></Section>}</>;
}

function Library({ templates, create, onDelete }: { templates: Template[]; create: () => void; onDelete: (id: string) => void }) {
  const [viewing, setViewing] = useState<Template | null>(null);
  const del = (t: Template) => { if (window.confirm(`¿Eliminar la plantilla "${t.title}"? Esta acción no se puede deshacer.`)) { onDelete(t.id); setViewing(null); } };
  return <><Header title="Biblioteca de hallazgos" sub={`${templates.length} plantillas`}><Button onClick={create}><Plus />Nueva plantilla</Button></Header><Section>{templates.length ? <div className="data-table library-table"><div className="table-head"><span>Plantilla</span><span>CWE</span><span>Tipo</span><span>Severidad</span><span /></div>{templates.map(template=><div className="table-row" key={template.id}><b>{template.title}</b><span>{template.cwe || "—"}</span><span>{template.category}</span><em className={cn("severity",sevClass[template.severity])}>{template.severity}</em><span style={{display:"flex",gap:4}}><Button variant="ghost" size="sm" onClick={()=>setViewing(template)}>Ver</Button><button className="icon-danger" aria-label={`Eliminar ${template.title}`} title="Eliminar plantilla" onClick={()=>del(template)}><Trash2 /></button></span></div>)}</div> : <EmptyState icon={BookOpen} title="Biblioteca vacía" text="Agrega tus propias plantillas verificadas." action={<Button onClick={create}><Plus />Nueva plantilla</Button>} />}</Section>
  {viewing && <div className="modal-backdrop" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) setViewing(null); }}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="tpl-title"><div className="modal-head"><div><small>Plantilla</small><h2 id="tpl-title">{viewing.title}</h2></div><Button variant="ghost" size="icon" aria-label="Cerrar" onClick={()=>setViewing(null)}><X/></Button></div><div className="data-table"><div className="table-row"><span>CWE</span><b>{viewing.cwe || "—"}</b></div><div className="table-row"><span>Tipo</span><b>{viewing.category}</b></div><div className="table-row"><span>Severidad</span><em className={cn("severity",sevClass[viewing.severity])}>{viewing.severity}</em></div></div><div className="modal-actions"><Button variant="outline" onClick={()=>del(viewing)}><Trash2/>Eliminar</Button><Button onClick={()=>setViewing(null)}>Cerrar</Button></div></section></div>}</>;
}

type ReportFormat = "pdf" | "docx" | "html" | "json";
const SEV_ORDER = ["Crítico", "Alto", "Medio", "Bajo"];

const LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 44 44"><rect width="44" height="44" rx="10" fill="#141414"/><path d="M22 9 35 33H9Z" fill="none" stroke="#ED7D27" stroke-width="3" stroke-linejoin="round"/><circle cx="22" cy="9" r="3.4" fill="#ED7D27"/></svg>`;

function buildReportHtml(project: Project, list: Finding[], settings: SettingsState) {
  const esc = (s: string) => (s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));
  const counts = SEV_ORDER.map(s => [s, list.filter(f => f.severity === s).length] as const).filter(([, n]) => n);
  const date = new Date().toLocaleDateString("es-AR");
  const org = settings.organization || "Vértice";
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Informe — ${esc(project.name)}</title><style>body{font-family:Georgia,serif;max-width:760px;margin:40px auto;color:#141414;line-height:1.5}h1{font-size:24px;border-bottom:3px solid #D9641E;padding-bottom:8px}h2{font-size:17px;margin-top:28px;color:#41423A}h3{font-size:15px;margin:18px 0 4px}table{border-collapse:collapse;width:100%}td,th{border:1px solid #ccc;padding:6px 8px;text-align:left;font-size:13px}th{background:#ECE2D2}.f{border-left:3px solid #D9641E;padding-left:12px;margin-bottom:16px}pre{white-space:pre-wrap;font-family:inherit}.report-head{display:flex;align-items:center;gap:14px;margin-bottom:6px}.report-head .brand-name{font-size:20px;font-weight:bold;letter-spacing:.5px}.report-head .brand-sub{font-size:12px;color:#757575}.id-table td{border:none;padding:3px 10px 3px 0;font-size:13px}.id-table td:first-child{color:#757575;white-space:nowrap}.foot{margin-top:36px;border-top:1px solid #ccc;padding-top:8px;font-size:11px;color:#757575}</style></head><body>
<div class="report-head">${LOGO_SVG}<div><div class="brand-name">${esc(org)}</div><div class="brand-sub">Informe de prueba de penetración${settings.userName ? ` · Emitido por ${esc(settings.userName)}${settings.role ? ` (${esc(settings.role)})` : ""}` : ""}${settings.email ? ` · ${esc(settings.email)}` : ""}</div></div></div>
<h1>Informe de prueba de penetración</h1>
<h2>Identificación del proyecto</h2>
<table class="id-table"><tr><td>Proyecto</td><td><b>${esc(project.name)}</b></td></tr><tr><td>ID de proyecto</td><td>${esc(project.id)}</td></tr><tr><td>Cliente</td><td>${esc(project.client)}</td></tr><tr><td>Tipo de evaluación</td><td>${esc(project.type)}</td></tr><tr><td>Estado</td><td>${esc(project.status)}</td></tr><tr><td>Período de ejecución</td><td>${esc(project.start)} — ${esc(project.end)}</td></tr><tr><td>Fecha de emisión</td><td>${date}</td></tr></table>
<h2>Resumen ejecutivo</h2><p>Se identificaron ${list.length} hallazgos durante la evaluación.</p>
<table><tr><th>Severidad</th><th>Cantidad</th></tr>${counts.map(([s, n]) => `<tr><td>${esc(s)}</td><td>${n}</td></tr>`).join("")}</table>
<h2>Detalle de hallazgos</h2>${list.map((f, i) => `<div class="f"><h3>${i + 1}. ${esc(f.title)}</h3><p><b>Severidad:</b> ${esc(f.severity)} · <b>Estado:</b> ${esc(f.status)}</p><pre>${esc(f.description || "Sin descripción")}</pre></div>`).join("")}
<div class="foot">${esc(org)} · Informe generado con Vértice · ${date} · Documento confidencial</div>
</body></html>`;
}

function generateReport(project: Project, findings: Finding[], format: ReportFormat, settings: SettingsState) {
  const list = findings.filter(f => f.projectId === project.id)
    .sort((a, b) => SEV_ORDER.indexOf(a.severity) - SEV_ORDER.indexOf(b.severity));
  const html = buildReportHtml(project, list, settings);
  const base = `Informe-${project.name.replace(/[^\w\-]+/g, "_")}`;
  const download = (content: string, type: string, ext: string) => {
    const url = URL.createObjectURL(new Blob([content], { type }));
    const a = document.createElement("a"); a.href = url; a.download = `${base}.${ext}`; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  if (format === "pdf") {
    printHtml(html);
  } else if (format === "docx") download("\ufeff" + html, "application/msword", "doc");
  else if (format === "html") download(html, "text/html", "html");
  else download(JSON.stringify({ project, findings: list, generatedAt: new Date().toISOString() }, null, 2), "application/json", "json");
}

function Reports({ projects, findings, settings }: { projects: Project[]; findings: Finding[]; settings: SettingsState }) {
  const [formats, setFormats] = useState<Record<string, ReportFormat>>({});
  return <><Header title="Informes" sub="Genera informes a partir de datos cargados" />{projects.length ? <Section title="Proyectos disponibles"><div className="simple-records">{projects.map(project => { const total=findings.filter(f=>f.projectId===project.id).length; const fmt = formats[project.id] ?? "pdf"; return <div key={project.id}><span><b>{project.name}</b><small>{project.client}</small></span><span>{total} hallazgos</span><span style={{display:"flex",gap:8,alignItems:"center"}}><select aria-label="Formato del informe" className="report-format" value={fmt} onChange={e => setFormats({ ...formats, [project.id]: e.target.value as ReportFormat })}><option value="pdf">PDF</option><option value="docx">Word</option><option value="html">HTML</option><option value="json">JSON</option></select><Button size="sm" disabled={!total} onClick={() => generateReport(project, findings, fmt, settings)}><FileText/>Generar</Button></span></div>;})}</div></Section> : <Section><EmptyState icon={FileText} title="No hay informes para generar" text="Primero carga un proyecto y sus hallazgos reales." /></Section>}</>;
}

function Clients({ clients, create }: { clients: Client[]; create: () => void }) {
  return <><Header title="Clientes" sub={`${clients.length} clientes registrados`}><Button onClick={create}><Plus />Nuevo cliente</Button></Header><Section>{clients.length ? <div className="simple-records">{clients.map(client=><div key={client.id}><span className="record-avatar">{client.name.slice(0,2).toUpperCase()}</span><span><b>{client.name}</b><small>{client.industry || "Sin industria"}</small></span><span><b>{client.contact || "Sin contacto"}</b><small>{client.email || "Sin correo"}</small></span></div>)}</div> : <EmptyState icon={Building2} title="Sin clientes cargados" text="Registra clientes reales para vincularlos con sus proyectos." action={<Button onClick={create}><Plus />Nuevo cliente</Button>} />}</Section></>;
}

function SettingsPage({ settings, onSave, exportData, audit }: { settings: SettingsState; onSave: (settings: SettingsState) => void; exportData: () => void; audit: AuditEntry[] }) {
  const [draft, setDraft] = useState(settings);
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); onSave(draft); };
  const set = <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => setDraft(current => ({ ...current, [key]: value }));
  return <><Header title="Configuración" sub="Administra los datos y preferencias de tu espacio de trabajo"><Button type="button" variant="outline" onClick={exportData}><Upload />Exportar datos</Button></Header>
    <form className="settings-layout" onSubmit={submit}>
      <div className="stack">
        <Section title="Consultora" className="settings-section"><Field label="Nombre de la consultora" name="organization" value={draft.organization} required onChange={value => set("organization", value)} /><p className="field-help">Este nombre se muestra en la navegación y en los informes.</p></Section>
        <Section title="Perfil" className="settings-section"><div className="form-grid"><Field label="Nombre completo" name="userName" value={draft.userName} required onChange={value => set("userName", value)} /><Field label="Correo electrónico" name="email" type="email" value={draft.email} required onChange={value => set("email", value)} /><SelectField label="Rol" name="role" options={["Responsable","Pentester","Revisor"]} value={draft.role} onChange={value => set("role", value)} /><SelectField label="Zona horaria" name="timezone" options={["America/Argentina/Buenos_Aires","America/Bogota","America/Santiago","America/Mexico_City","Europe/Madrid"]} value={draft.timezone} onChange={value => set("timezone", value)} /></div></Section>
      </div>
      <div className="stack">
        <Section title="Notificaciones" className="settings-section"><div className="setting-row"><span><b>Alertas por correo</b><small>Recibe avisos sobre autorizaciones y hallazgos.</small></span><label className="switch"><input type="checkbox" checked={draft.emailAlerts} onChange={event => set("emailAlerts", event.target.checked)} /><i /></label></div><div className="setting-row"><span><b>Informes listos</b><small>Recibe un aviso cuando un informe esté disponible.</small></span><label className="switch"><input type="checkbox" checked={draft.reportAlerts} onChange={event => set("reportAlerts", event.target.checked)} /><i /></label></div></Section>
        <Button type="submit" size="lg"><Check />Guardar configuración</Button>
      </div>
    </form>
    <Section title="Registro de auditoría" className="settings-section">{audit.length ? <div className="data-table audit-table"><div className="table-head"><span>Fecha y hora</span><span>Usuario</span><span>Acción</span><span>Detalle</span></div>{audit.map(e => <div className="table-row" key={e.id}><span>{new Date(e.at).toLocaleString("es-AR")}</span><span>{e.user}</span><Status tone={e.action === "Eliminación" ? "warning" : "info"}>{e.action}</Status><span>{e.detail}</span></div>)}</div> : <EmptyState icon={FileText} title="Sin acciones registradas" text="Aquí se registrarán las importaciones, exportaciones y eliminaciones." />}</Section>
  </>;
}

function CreateDialog({ kind, projects, templates = [], onClose, onSave }: { kind: Exclude<CreateKind,null>; projects: Project[]; templates?: Template[]; onClose: () => void; onSave: (kind: Exclude<CreateKind,null>, item: Project | Finding | Client | Template) => void }) {
  const labels = { project: "Nuevo proyecto", finding: "Nuevo hallazgo", client: "Nuevo cliente", template: "Nueva plantilla" };
  const [tplId, setTplId] = useState(""); const [fTitle, setFTitle] = useState(""); const [fSev, setFSev] = useState("Crítico"); const [fDesc, setFDesc] = useState("");
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); const form = new FormData(event.currentTarget); const id = crypto.randomUUID();
    if (kind === "project") onSave(kind,{id,name:String(form.get("name")),client:String(form.get("client")),type:String(form.get("type")),status:String(form.get("status")),start:String(form.get("start")),end:String(form.get("end"))});
    if (kind === "finding") onSave(kind,{id,title:String(form.get("title")),severity:String(form.get("severity")),status:String(form.get("status")),projectId:String(form.get("projectId")) || undefined,project:projects.find(p=>p.id===form.get("projectId"))?.name ?? "",description:String(form.get("description"))});
    if (kind === "client") onSave(kind,{id,name:String(form.get("name")),industry:String(form.get("industry")),contact:String(form.get("contact")),email:String(form.get("email"))});
    if (kind === "template") onSave(kind,{id,title:String(form.get("title")),cwe:String(form.get("cwe")),category:String(form.get("category")),severity:String(form.get("severity"))});
  };
  return <div className="modal-backdrop" role="presentation" onMouseDown={event => { if(event.target===event.currentTarget) onClose(); }}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="dialog-title"><div className="modal-head"><div><small>Carga de datos</small><h2 id="dialog-title">{labels[kind]}</h2></div><Button variant="ghost" size="icon" aria-label="Cerrar" onClick={onClose}><X/></Button></div><form onSubmit={submit}>
    {kind === "project" && <><Field label="Nombre del proyecto" name="name" required/><Field label="Cliente" name="client" required/><div className="form-grid"><SelectField label="Tipo" name="type" options={["Aplicación web","API","App móvil","Red interna","Red externa","Nube"]}/><SelectField label="Estado" name="status" options={["Preparación","En prueba","En revisión","Entregado"]}/><Field label="Fecha de inicio" name="start" type="date" required/><Field label="Fecha de fin" name="end" type="date" required/></div></>}
    {kind === "finding" && <>{templates.length > 0 && <label className="form-field">Partir de una plantilla<select value={tplId} onChange={e => { const t = templates.find(x => x.id === e.target.value); setTplId(e.target.value); if (t) { setFTitle(t.title); setFSev(t.severity); setFDesc([t.cwe && `CWE: ${t.cwe}`, `Tipo: ${t.category}`].filter(Boolean).join("\n")); } }}><option value="">Sin plantilla</option>{templates.map(t=><option key={t.id} value={t.id}>{t.title}{t.cwe ? ` (${t.cwe})` : ""}</option>)}</select></label>}<Field label="Título" name="title" required value={fTitle} onChange={setFTitle}/><div className="form-grid"><SelectField label="Severidad" name="severity" options={["Crítico","Alto","Medio","Bajo"]} value={fSev} onChange={setFSev}/><SelectField label="Estado" name="status" options={["Borrador","En revisión","Revisado","Cerrado"]}/></div><label className="form-field">Proyecto<select name="projectId"><option value="">Sin asignar</option>{projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label><label className="form-field">Descripción<textarea name="description" rows={4} value={fDesc} onChange={e => setFDesc(e.target.value)}/></label></>}
    {kind === "client" && <><Field label="Nombre o razón social" name="name" required/><Field label="Industria" name="industry"/><Field label="Contacto principal" name="contact"/><Field label="Correo" name="email" type="email"/></>}
    {kind === "template" && <><Field label="Nombre de la plantilla" name="title" required/><div className="form-grid"><Field label="CWE" name="cwe" placeholder="CWE-000"/><SelectField label="Tipo" name="category" options={["Web","API","Red","Móvil","Nube"]}/><SelectField label="Severidad" name="severity" options={["Crítico","Alto","Medio","Bajo"]}/></div></>}
    <div className="modal-actions"><Button type="button" variant="outline" onClick={onClose}>Cancelar</Button><Button type="submit">Guardar datos</Button></div>
  </form></section></div>;
}
function Field({label,name,type="text",required,placeholder,value,onChange}:{label:string;name:string;type?:string;required?:boolean;placeholder?:string;value?:string;onChange?:(value:string)=>void}) { return <label className="form-field">{label}<input name={name} type={type} required={required} placeholder={placeholder} value={value} onChange={onChange ? event => onChange(event.target.value) : undefined}/></label>; }
function SelectField({label,name,options,empty,value,onChange}:{label:string;name:string;options:string[];empty?:string;value?:string;onChange?:(value:string)=>void}) { return <label className="form-field">{label}<select name={name} value={value} onChange={onChange ? event => onChange(event.target.value) : undefined}>{empty ? <option value="">{empty}</option> : null}{options.map(option=><option key={option}>{option}</option>)}</select></label>; }
