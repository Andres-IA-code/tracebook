import { useMemo, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  BarChart3,
  BookOpen,
  Bug,
  Building2,
  Check,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  Download,
  FileText,
  FolderOpen,
  Globe2,
  LayoutDashboard,
  LockKeyhole,
  Menu,
  MoreHorizontal,
  Network,
  Plus,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Upload,
  UserPlus,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type View =
  | "panel"
  | "proyectos"
  | "autorizaciones"
  | "hallazgos"
  | "biblioteca"
  | "informes"
  | "clientes"
  | "firma"
  | "portal";

const navItems = [
  ["panel", "Panel", LayoutDashboard],
  ["proyectos", "Proyectos", FolderOpen],
  ["autorizaciones", "Autorizaciones", ShieldCheck],
  ["hallazgos", "Hallazgos", Bug],
  ["biblioteca", "Biblioteca", BookOpen],
  ["informes", "Informes", FileText],
  ["clientes", "Clientes", Building2],
] as const;

const projects = [
  ["Banco Andino", "API", "Preparación", "5 – 16 oct 2026", "—", "Pendiente"],
  ["Seguros Cóndor", "App móvil", "Preparación", "19 – 30 oct 2026", "—", "Firmada"],
  ["Fintech Pago Ya", "App web", "En prueba", "21 sep – 9 oct 2026", "12", "Firmada"],
  ["Clínica San Rafael", "Red interna", "En prueba", "28 sep – 16 oct 2026", "9", "Firmada"],
  ["Retail Austral", "Nube · AWS", "En prueba", "22 sep – 6 oct 2026", "15", "Firmada"],
  ["Universidad del Pacífico", "App web", "En prueba", "29 sep – 10 oct 2026", "6", "Firmada"],
  ["Energía Volcán", "Red externa", "En revisión", "1 – 12 sep 2026", "22", "Firmada"],
  ["Cooperativa Sur", "App web", "Entregado", "4 – 15 ago 2026", "18", "Archivada"],
  ["Logística Andes", "API", "Entregado", "7 – 18 jul 2026", "11", "Archivada"],
  ["Telecom Altiplano", "Red interna", "Entregado", "9 – 27 jun 2026", "27", "Archivada"],
] as const;

const findings = [
  ["Inyección SQL en login", "Crítico", "Borrador"],
  ["IDOR en /api/facturas", "Alto", "En revisión"],
  ["Sesión sin expiración", "Alto", "Revisado"],
  ["Carga de archivos sin validar", "Alto", "Revisado"],
  ["XSS almacenado en comentarios", "Medio", "Revisado"],
  ["Enumeración de usuarios", "Medio", "Revisado"],
  ["CORS permisivo", "Medio", "En revisión"],
  ["Política de contraseñas débil", "Medio", "Revisado"],
  ["Sin límite de intentos de acceso", "Medio", "Revisado"],
  ["Cabeceras de seguridad", "Bajo", "Revisado"],
  ["Versión del servidor expuesta", "Bajo", "Borrador"],
  ["Cookies sin atributo SameSite", "Bajo", "Revisado"],
] as const;

const templates = [
  ["Inyección SQL", "CWE-89", "Web", "Crítico", 34],
  ["XSS reflejado", "CWE-79", "Web", "Medio", 51],
  ["IDOR", "CWE-639", "API", "Alto", 28],
  ["Cabeceras de seguridad ausentes", "CWE-693", "Web", "Bajo", 62],
  ["Política de contraseñas débil", "CWE-521", "Web", "Medio", 19],
  ["Bucket de almacenamiento público", "CWE-732", "Nube", "Alto", 12],
  ["Firma SMB deshabilitada", "CWE-311", "Red", "Medio", 9],
] as const;

const sevClass: Record<string, string> = {
  Crítico: "bg-critical text-critical-foreground",
  Alto: "bg-critical-soft text-critical-strong",
  Medio: "bg-warning-soft text-warning-strong",
  Bajo: "bg-info-soft text-primary",
};

function Status({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "success" | "warning" | "info" }) {
  return <span className={cn("status", `status-${tone}`)}>{children}</span>;
}

function Section({ title, action, children, className }: { title?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("surface", className)}>
      {title ? <div className="section-head"><h2>{title}</h2>{action}</div> : null}
      {children}
    </section>
  );
}

function Header({ title, sub, children }: { title: string; sub?: string; children?: ReactNode }) {
  return <header className="page-head"><div><h1>{title}</h1>{sub ? <p>{sub}</p> : null}</div><div className="head-actions">{children}</div></header>;
}

export function VerticeApp() {
  const [view, setView] = useState<View>("panel");
  const [mobileNav, setMobileNav] = useState(false);
  const [notice, setNotice] = useState("");

  const go = (next: View) => { setView(next); setMobileNav(false); setNotice(""); };
  const confirm = (message: string) => { setNotice(message); window.setTimeout(() => setNotice(""), 2600); };

  if (view === "firma") return <SignatureView onBack={() => go("autorizaciones")} confirm={confirm} notice={notice} />;
  if (view === "portal") return <PortalView onBack={() => go("clientes")} confirm={confirm} notice={notice} />;

  return (
    <div className="app-shell">
      <aside className={cn("sidebar", mobileNav && "sidebar-open")}>
        <div className="brand"><span className="brand-mark" />Vértice<Button variant="ghost" size="icon" className="close-nav" aria-label="Cerrar menú" onClick={() => setMobileNav(false)}><X /></Button></div>
        <button className="org-switcher"><span className="org-avatar">TC</span><span><b>Tu consultora</b><small>Plan Equipo · 6 personas</small></span><ChevronDown /></button>
        <nav aria-label="Navegación principal">
          {navItems.map(([key, label, Icon]) => (
            <button key={key} className={cn("nav-item", view === key && "active")} onClick={() => go(key)}>
              <Icon /> <span>{label}</span>{key === "autorizaciones" ? <em>1</em> : null}
            </button>
          ))}
        </nav>
        <div className="sidebar-foot"><button className="nav-item"><Settings /><span>Configuración</span></button><div className="profile"><span>AR</span><div><b>Andrea Ríos</b><small>Responsable</small></div></div></div>
      </aside>
      {mobileNav ? <button className="nav-scrim" aria-label="Cerrar menú" onClick={() => setMobileNav(false)} /> : null}
      <div className="workspace">
        <div className="mobile-bar"><Button variant="ghost" size="icon" aria-label="Abrir menú" onClick={() => setMobileNav(true)}><Menu /></Button><div className="brand"><span className="brand-mark" />Vértice</div><span className="profile-dot">AR</span></div>
        <main className="page">
          {view === "panel" && <Dashboard go={go} confirm={confirm} />}
          {view === "proyectos" && <Projects go={go} confirm={confirm} />}
          {view === "autorizaciones" && <Authorizations go={go} confirm={confirm} />}
          {view === "hallazgos" && <Findings confirm={confirm} />}
          {view === "biblioteca" && <Library confirm={confirm} />}
          {view === "informes" && <Reports confirm={confirm} />}
          {view === "clientes" && <Clients go={go} confirm={confirm} />}
        </main>
      </div>
      {notice ? <div className="toast"><Check />{notice}</div> : null}
    </div>
  );
}

function Dashboard({ go, confirm }: { go: (v: View) => void; confirm: (s: string) => void }) {
  return <>
    <Header title="Buenos días, Andrea" sub="Jueves, 1 de octubre de 2026"><Button onClick={() => confirm("Nuevo proyecto preparado")}><Plus />Nuevo proyecto</Button></Header>
    <div className="warning-banner"><AlertTriangle /><p><b>Banco Andino: falta la firma de autorización.</b> El proyecto no puede iniciar el lunes.</p><Button variant="outline" size="sm" onClick={() => go("autorizaciones")}>Ver autorización</Button></div>
    <div className="metric-grid">{[["Proyectos activos","7",FolderOpen,""],["Hallazgos abiertos","64",Bug,""],["Críticos","5",AlertTriangle,"critical-text"],["Informes por entregar","3",FileText,""]].map(([label,value,Icon,tone]) => <div className="metric" key={String(label)}><span><Icon />{label as string}</span><strong className={String(tone)}>{value as string}</strong></div>)}</div>
    <Section title="Proyectos en curso" action={<button className="text-link" onClick={() => go("proyectos")}>Ver todos los proyectos</button>}>
      <div className="data-table dashboard-table"><div className="table-head"><span>Proyecto</span><span>Tipo</span><span>Avance</span><span>Autorización</span><span /></div>
        {[["Fintech Pago Ya","21 sep – 9 oct","App web",75,"Firmada"],["Clínica San Rafael","28 sep – 16 oct","Red interna",40,"Firmada"],["Banco Andino","Inicio previsto 5 oct","API",0,"Pendiente"]].map(r => <button className="table-row" key={String(r[0])} onClick={() => go(r[4] === "Pendiente" ? "autorizaciones" : "hallazgos")}><span><b>{r[0]}</b><small>{r[1]}</small></span><span>{r[2]}</span><span className="progress-cell"><i><i style={{ width: `${r[3]}%` }} /></i><small>{r[3] ? `${r[3]} %` : "Sin iniciar"}</small></span><Status tone={r[4] === "Firmada" ? "success" : "warning"}>{r[4]}</Status><ChevronRight /></button>)}</div>
    </Section>
  </>;
}

function Projects({ go, confirm }: { go: (v: View) => void; confirm: (s: string) => void }) {
  const [tab, setTab] = useState("Todos"); const [query, setQuery] = useState("");
  const rows = projects.filter(p => (tab === "Todos" || p[2] === tab || (tab === "Entregados" && p[2] === "Entregado")) && `${p[0]} ${p[1]}`.toLowerCase().includes(query.toLowerCase()));
  return <><Header title="Proyectos" sub="18 proyectos · 7 activos"><label className="search"><Search /><input aria-label="Buscar proyecto o cliente" placeholder="Buscar proyecto o cliente" value={query} onChange={e => setQuery(e.target.value)} /></label><Button onClick={() => confirm("Nuevo proyecto preparado")}><Plus />Nuevo proyecto</Button></Header>
    <div className="tabs">{[["Todos",18],["Preparación",2],["En prueba",4],["En revisión",1],["Entregados",11]].map(([t,n]) => <button className={tab === t ? "active" : ""} key={t} onClick={() => setTab(String(t))}>{t}<span>{n}</span></button>)}</div>
    <Section><div className="data-table projects-table"><div className="table-head"><span>Proyecto</span><span>Estado</span><span>Fechas</span><span>Hallazgos</span><span>Autorización</span><span /></div>{rows.map(r => <button className="table-row" key={r[0]} onClick={() => go(r[0] === "Banco Andino" ? "autorizaciones" : "hallazgos")}><span><b>{r[0]}</b><small>{r[1]}</small></span><Status tone={r[2] === "En prueba" ? "info" : r[2] === "Entregado" ? "success" : "neutral"}>{r[2]}</Status><span>{r[3]}</span><span>{r[4]}</span><Status tone={r[5] === "Firmada" ? "success" : r[5] === "Pendiente" ? "warning" : "neutral"}>{r[5]}</Status><MoreHorizontal /></button>)}</div><div className="table-foot"><span>Mostrando {rows.length} de {tab === "Todos" ? 18 : rows.length}</span><div><Button variant="outline" size="sm" disabled>Anterior</Button><Button variant="outline" size="sm">Siguiente</Button></div></div></Section>
  </>;
}

function Authorizations({ go, confirm }: { go: (v: View) => void; confirm: (s: string) => void }) {
  const assets = [["api.bancoandino.com","API REST · producción",Globe2,"Verificado por DNS","success"],["app.bancoandino.com","Aplicación web · producción",Globe2,"Verificado por DNS","success"],["190.24.18.0/28","Rango de red · 16 direcciones",Network,"Esperando registro","warning"]] as const;
  return <><div className="breadcrumb">Proyectos <span>/</span> Banco Andino</div><Header title="Banco Andino · Pentest de API" sub="Inicio previsto el lunes 5 de octubre. Las pruebas se habilitan al recibir la firma."><Status tone="warning"><LockKeyhole />Proyecto bloqueado</Status><Button variant="outline" onClick={() => confirm("Alcance abierto para edición")}>Editar alcance</Button></Header>
    <div className="stepper">{[["Alcance","Completado",true],["Reglas","Completado",true],["Verificación","2 de 3 activos",false],["Firma","Pendiente",false]].map((s,i)=><div key={s[0]}><span className={cn("step-num", i < 2 && "done", i === 2 && "current")}>{i < 2 ? <Check /> : i+1}</span><b>{s[0]}</b><small>{s[1]}</small></div>)}</div>
    <div className="auth-grid"><div className="stack"><Section title="Activos en alcance" action={<span className="subtle">2 de 3 verificados</span>}><div className="list">{assets.map(([host,type,Icon,status,tone])=><div className="list-row" key={host}><Icon /><span><b className="mono">{host}</b><small>{type}</small>{tone === "warning" ? <code>TXT _vertice.bancoandino.com “vt-7f3a91c2”</code> : null}</span><Status tone={tone}>{status}</Status></div>)}</div></Section><div className="two-col"><Section title="Exclusiones"><div className="simple-list">{["Sistemas de pagos en producción","Ingeniería social","Denegación de servicio"].map(x=><span key={x}><X />{x}</span>)}</div></Section><Section title="Reglas de enfrentamiento"><dl><dt>Fechas</dt><dd>5 al 16 de octubre de 2026<small>10 días hábiles</small></dd><dt>Horario</dt><dd>20:00 a 06:00<small>Hora local del cliente</small></dd><dt>Contacto</dt><dd>Luis Mora, CISO<small>+57 601 742 3810</small></dd></dl></Section></div></div>
      <aside className="stack"><Section title="Firma de autorización" action={<Status tone="warning">Pendiente</Status>} className="padded"><div className="person"><span>LM</span><div><b>Luis Mora</b><small>Representante legal</small></div></div><div className="inline-note"><Clock3 />Enviado hace 2 días. <b>Sin abrir</b></div><div className="button-row"><Button onClick={() => confirm("Solicitud reenviada a Luis Mora")}><Send />Reenviar solicitud</Button><Button variant="outline" onClick={() => go("firma")}>Ver documento</Button></div></Section><Section title="Registro de auditoría" className="padded"><div className="timeline">{["Recordatorio automático enviado a Luis Mora","Solicitud de firma enviada por Andrea Ríos","Reglas de enfrentamiento aprobadas","app.bancoandino.com verificado por DNS","Alcance definido por Andrea Ríos"].map((x,i)=><div key={x}><i /><span>{x}<small>{i < 2 ? "1 oct 2026 · 09:00" : "29 sep 2026 · 10:38"}</small></span></div>)}</div></Section></aside></div>
  </>;
}

function Findings({ confirm }: { confirm: (s: string) => void }) {
  const [selected,setSelected]=useState(0); const [filter,setFilter]=useState("Todos"); const [query,setQuery]=useState("");
  const visible=findings.map((f,i)=>({f,i})).filter(({f})=>(filter==="Todos"||f[1]===filter)&&f[0].toLowerCase().includes(query.toLowerCase())); const current=findings[selected];
  return <><div className="breadcrumb">Proyectos <span>/</span> Fintech Pago Ya</div><Header title="Hallazgos" sub="Fintech Pago Ya · App web · En prueba hasta el 9 de octubre" />
    <div className="findings-grid"><Section><div className="finding-tools"><div className="button-row"><Button variant="outline" onClick={()=>confirm("Nuevo hallazgo creado")}><Plus />Nuevo hallazgo</Button><Button variant="outline" onClick={()=>confirm("Importador listo")}><Upload />Importar</Button></div><label className="search wide"><Search /><input aria-label="Buscar hallazgos" placeholder="Buscar en 12 hallazgos" value={query} onChange={e=>setQuery(e.target.value)} /></label><div className="chips">{["Todos","Crítico","Alto","Medio","Bajo"].map(x=><button className={filter===x?"active":""} onClick={()=>setFilter(x)} key={x}>{x}</button>)}</div></div><div className="finding-list">{visible.map(({f,i})=><button key={f[0]} className={selected===i?"active":""} onClick={()=>setSelected(i)}><span>{String(i+1).padStart(2,"0")}</span><div><b>{f[0]}</b><small>{f[2]}</small></div><span className={cn("severity",sevClass[f[1]])}>{f[1]}</span></button>)}</div></Section>
      <Section><div className="detail-head"><span>PY-{String(selected+1).padStart(2,"0")}</span><small><BookOpen />Creado desde la biblioteca</small><h2>{current[0]}</h2></div><div className="detail-body"><div className="detail-fields"><label>Severidad<span><em className={cn("severity",sevClass[current[1]])}>{current[1]}</em><ChevronDown /></span></label><label>Puntuación CVSS 3.1<span><b className="critical-text">9.8</b><small>AV:N/AC:L/PR:N/UI:N</small></span></label><label>Estado<span>{current[2]}<ChevronDown /></span></label><label>Activo afectado<span className="mono">app.pagoya.com/login</span></label></div><TextBlock title="Descripción">El parámetro <code>usuario</code> del formulario de inicio de sesión se concatena directamente en la consulta SQL. Un atacante sin autenticación puede omitir el control de acceso y extraer información sensible.</TextBlock><div><div className="field-title">Evidencias <span>3 archivos</span></div><div className="evidence">{["burp-request-01.png","sqlmap-dump.png","payload.txt"].map((x,i)=><div key={x}><span>{i===2?"registro":"captura"}</span><small>{x}</small></div>)}<button onClick={()=>confirm("Selector de evidencias abierto")}><Plus />Añadir evidencia</button></div></div><TextBlock title="Recomendación">Usar consultas parametrizadas, validar las entradas en el servidor y limitar los privilegios de la cuenta de base de datos.</TextBlock></div><div className="detail-foot"><span>Guardado hace 1 min</span><div><Button variant="outline" onClick={()=>confirm("Hallazgo guardado")}>Guardar</Button><Button onClick={()=>confirm("Hallazgo enviado a revisión")}>Enviar a revisión</Button></div></div></Section></div>
  </>;
}

function TextBlock({title,children}:{title:string;children:ReactNode}){return <div><div className="field-title">{title}</div><div className="text-box">{children}</div></div>}

function Library({ confirm }: { confirm: (s: string) => void }) {
  const [cat,setCat]=useState("Todas"); const [selected,setSelected]=useState(0); const [query,setQuery]=useState("");
  const visible=templates.map((t,i)=>({t,i})).filter(({t})=>(cat==="Todas"||t[2]===cat)&&`${t[0]} ${t[1]}`.toLowerCase().includes(query.toLowerCase())); const cur=templates[selected];
  return <><Header title="Biblioteca de hallazgos" sub="86 plantillas compartidas con todo el equipo"><Button variant="outline" onClick={()=>confirm("Nueva plantilla preparada")}><Plus />Nueva plantilla</Button></Header><div className="library-grid"><Section><div className="library-tools"><label className="search wide"><Search/><input aria-label="Buscar plantillas" placeholder="Buscar por nombre o CWE" value={query} onChange={e=>setQuery(e.target.value)}/></label><div className="chips">{["Todas","Web","API","Red","Móvil","Nube"].map(x=><button className={cat===x?"active":""} onClick={()=>setCat(x)} key={x}>{x}</button>)}</div></div><div className="data-table library-table"><div className="table-head"><span>Plantilla</span><span>CWE</span><span>Tipo</span><span>Severidad</span><span>Usos</span></div>{visible.map(({t,i})=><button className={cn("table-row",selected===i&&"selected")} onClick={()=>setSelected(i)} key={t[0]}><b>{t[0]}</b><span>{t[1]}</span><span>{t[2]}</span><em className={cn("severity",sevClass[t[3]])}>{t[3]}</em><span>{t[4]} usos</span></button>)}</div></Section><Section><div className="detail-head"><span>Vista previa · {cur[4]} usos</span><div className="segmented"><button className="active">Español</button><button>Inglés</button></div><h2>{cur[0]}</h2><div><em className={cn("severity",sevClass[cur[3]])}>{cur[3]}</em> <Status>{cur[1]}</Status> <Status>OWASP A03:2021</Status></div></div><div className="preview-copy"><TextBlock title="Descripción base">La aplicación procesa datos proporcionados por el usuario sin los controles de seguridad necesarios, lo que permite alterar el comportamiento esperado.</TextBlock><TextBlock title="Impacto">Acceso o modificación no autorizada de información, omisión de controles y posible exposición de datos sensibles.</TextBlock><dl><dt>Idiomas</dt><dd>Español, inglés</dd><dt>Última edición</dt><dd>Martín Salas · 12 sep 2026</dd></dl></div><div className="detail-foot right"><Button variant="outline" onClick={()=>confirm("Plantilla abierta para edición")}>Editar</Button><Button onClick={()=>confirm("Plantilla añadida al proyecto")}>Usar en proyecto</Button></div></Section></div></>;
}

function Reports({ confirm }: { confirm: (s: string) => void }) {
  const labels=["Resumen ejecutivo","Alcance y metodología","Hallazgos técnicos","Plan de remediación","Anexo de autorización firmada"]; const [enabled,setEnabled]=useState(labels); const [format,setFormat]=useState("PDF");
  return <><div className="breadcrumb">Informes <span>/</span> Fintech Pago Ya</div><Header title="Generar informe" sub="Fintech Pago Ya · App web · 12 hallazgos"/><div className="report-grid"><Section className="report-controls"><label className="control-label">Plantilla<span>Informe técnico estándar · v3<ChevronDown/></span></label><div><div className="field-title">Secciones</div>{labels.map(x=><label className="check-row" key={x}><input type="checkbox" checked={enabled.includes(x)} onChange={()=>setEnabled(e=>e.includes(x)?e.filter(i=>i!==x):[...e,x])}/><span><Check/></span>{x}</label>)}</div><div className="success-banner"><ClipboardCheck/>12 de 12 hallazgos revisados</div><div><div className="field-title">Formato</div><div className="segmented full">{["PDF","Word"].map(x=><button className={format===x?"active":""} onClick={()=>setFormat(x)} key={x}>{x}</button>)}</div></div><Button size="lg" onClick={()=>confirm(`Informe ${format} generado`)}><FileText/>Generar informe</Button></Section><section className="document-stage"><div className="document"><div className="doc-brand"><span/><b>Tu consultora</b><em>CONFIDENCIAL</em></div><div className="doc-title"><small>INFORME DE PRUEBA DE PENETRACIÓN</small><h2>Fintech Pago Ya</h2><p>Aplicación web · <code>app.pagoya.com</code></p><span>Octubre de 2026 · Versión 1.0</span></div><div className="doc-bottom"><div><span>Nivel de riesgo general</span><b>Alto</b></div><i><i/><i/><i/><i/></i><div className="doc-metrics">{[[1,"Crítico"],[3,"Altos"],[5,"Medios"],[3,"Bajos"]].map(x=><span key={x[1]}><b>{x[0]}</b><small>{x[1]}</small></span>)}</div><footer>Preparado por Tu consultora para Fintech Pago Ya <span>1</span></footer></div></div><p>Portada · página 1 de 38</p></section></div></>;
}

function Clients({ go, confirm }: { go:(v:View)=>void; confirm:(s:string)=>void }) {
  return <><div className="breadcrumb">Clientes <span>/</span> Fintech Pago Ya</div><Header title="Fintech Pago Ya" sub="Servicios financieros · Bogotá, Colombia · Cliente desde marzo de 2024"><Button variant="outline" onClick={()=>confirm("Cliente abierto para edición")}>Editar</Button><Button onClick={()=>confirm("Invitación al portal preparada")}><UserPlus/>Invitar al portal</Button></Header><div className="client-grid"><div className="stack"><Section title="Contactos"><div className="contacts">{[["CV","Carolina Vega","Representante legal","carolina.vega@pagoya.com",true],["DP","Diego Paredes","CISO","diego.paredes@pagoya.com",true],["SL","Sofía Lara","Líder de desarrollo","sofia.lara@pagoya.com",false],["JO","Javier Ortiz","Analista de seguridad","javier.ortiz@pagoya.com",false]].map(c=><div key={String(c[0])}><span>{c[0]}</span><div><b>{c[1]}</b><small>{c[2]}</small></div><em>{c[3]}</em><Status tone={c[4]?"success":"neutral"}>{c[4]?"Puede firmar":"Acceso al portal"}</Status></div>)}</div></Section><Section title="Historial de pentests" action={<span className="subtle">3 pentests</span>}><div className="history">{[["2026","App web","12","En prueba"],["2025","App web y API","17","Entregado"],["2024","App web","24","Entregado"]].map(h=><button key={h[0]} onClick={()=>h[0]==="2026"?go("portal"):confirm("Informe listo para descargar")}><b>{h[0]}</b><span>{h[1]}<small>{h[0]==="2026"?"21 sep – 9 oct":"4 – 22 ago"}</small></span><span>{h[2]} hallazgos</span><Status tone={h[3]==="Entregado"?"success":"info"}>{h[3]}</Status><em>{h[0]==="2026"?"En preparación":"Ver informe →"}</em></button>)}</div></Section></div><div className="stack"><Section title="Evolución de hallazgos" className="padded"><Status tone="success">50 % menos hallazgos desde 2024</Status><div className="bars">{[[24,100],[17,70],[12,50]].map(([n,h],i)=><div key={n}><b>{n}</b><i style={{height:`${h}%`}}/><span>{2024+i}</span></div>)}</div></Section><Section title="Activos verificados" action={<span className="subtle">4 activos</span>}><div className="assets">{["app.pagoya.com","api.pagoya.com","admin.pagoya.com","181.49.12.0/29"].map(x=><div key={x}><ShieldCheck/><code>{x}</code><small>DNS · 14 sep 2026</small></div>)}</div></Section></div></div></>;
}

function SignatureView({onBack,confirm,notice}:{onBack:()=>void;confirm:(s:string)=>void;notice:string}){
  const [checks,setChecks]=useState([true,false]);
  return <div className="public-view"><PublicHeader right={<><LockKeyhole/>Conexión segura · Gestionado con Vértice</>}/><main><Button variant="ghost" onClick={onBack}>← Volver a Vértice</Button><section className="signature-card"><div className="signature-head"><span>Solicitud de Tu consultora para Luis Mora</span><h1>Autorización de prueba de seguridad</h1><p><b>Banco Andino</b><i/>5 al 16 de octubre de 2026</p></div><div className="scope-summary"><dl><dt>Activos</dt><dd><code>api.bancoandino.com</code><code>app.bancoandino.com</code><code>190.24.18.0/28</code></dd><dt>Horario</dt><dd>De 20:00 a 06:00, hora local</dd><dt>Exclusiones</dt><dd>Sistemas de pagos, ingeniería social y denegación de servicio</dd><dt>Equipo</dt><dd>Andrea Ríos, Martín Salas, Camila Duarte</dd></dl><button className="text-link"><FileText/>Leer el documento completo (PDF, 8 páginas)</button></div><div className="signature-form">{["Soy representante legal de Banco Andino y tengo autoridad para autorizar esta prueba.","Acepto el alcance, el horario y las reglas de enfrentamiento descritas en el documento."].map((x,i)=><label className="check-row" key={x}><input type="checkbox" checked={checks[i]} onChange={()=>setChecks(c=>c.map((v,j)=>j===i?!v:v))}/><span><Check/></span>{x}</label>)}<div><div className="field-title">Firma <button>Borrar</button></div><div className="sign-pad">Dibuja tu firma aquí<i/><small>Luis Mora · Representante legal</small></div></div><Button size="lg" disabled={!checks.every(Boolean)} onClick={()=>confirm("Autorización firmada correctamente")}>Firmar autorización</Button><p className="security-note"><ShieldCheck/>Al firmar se registrarán la fecha, la hora y tu dirección IP como respaldo legal.</p></div></section></main>{notice?<div className="toast"><Check/>{notice}</div>:null}</div>
}

function PublicHeader({right}:{right:ReactNode}){return <header className="public-header"><div className="brand"><span className="brand-mark dark"/>Tu consultora</div><span>{right}</span></header>}

function PortalView({onBack,confirm,notice}:{onBack:()=>void;confirm:(s:string)=>void;notice:string}){
  const columns=[{title:"Pendiente",tone:"neutral",cards:[["Crítico","Inyección SQL en login","PAGO-412","Sofía Lara","Vence en 3 días"],["Alto","Carga de archivos sin validar","PAGO-415","Sofía Lara","Vence 15 oct"],["Medio","CORS permisivo","PAGO-418","Javier Ortiz","Vence 30 oct"],["Bajo","Versión del servidor expuesta","PAGO-421","Diego Paredes","Vence 15 nov"]]},{title:"En corrección",tone:"info",cards:[["Alto","IDOR en /api/facturas","PAGO-413","Sofía Lara","Vence 8 oct"],["Alto","Sesión sin expiración","PAGO-414","Javier Ortiz","Vence 10 oct"],["Medio","Enumeración de usuarios","PAGO-417","Javier Ortiz","Vence 20 oct"]]},{title:"Verificado",tone:"success",cards:[["Medio","XSS almacenado en comentarios","PAGO-416","Sofía Lara","Verificado 24 sep"],["Medio","Política de contraseñas débil","PAGO-419","Diego Paredes","Verificado 22 sep"],["Bajo","Cabeceras de seguridad","PAGO-422","Diego Paredes","Verificado 19 sep"]]}];
  return <div className="portal-view"><PublicHeader right={<>Carolina Vega <span className="profile-dot">CV</span></>}/><main><Button variant="ghost" onClick={onBack}>← Volver a Vértice</Button><Header title="Remediación · pentest 2026" sub="Aplicación web · 12 hallazgos publicados por Tu consultora"><Status tone="success">Jira sincronizado · hace 5 min</Status><Button onClick={()=>confirm("Informe descargado")}><Download/>Descargar informe</Button></Header><section className="remediation-progress"><b>5 de 12 <span>hallazgos cerrados</span></b><i><i/></i><span>Verificado 5 · En corrección 3 · Pendiente 4</span></section><div className="kanban">{columns.map(col=><section key={col.title}><h2><i className={`dot-${col.tone}`}/>{col.title}<span>{col.cards.length}</span></h2>{col.cards.map(c=><article key={c[1]}><div><em className={cn("severity",sevClass[c[0]])}>{c[0]}</em><small>◆ {c[2]}</small></div><h3>{c[1]}</h3><footer><span className="profile-dot">{c[3].split(" ").map(x=>x[0]).join("")}</span>{c[3]}<time>{c[4]}</time></footer>{col.title==="En corrección"?<Button variant="outline" size="sm" onClick={()=>confirm("Retest solicitado")}>Solicitar retest</Button>:null}</article>)}</section>)}</div></main>{notice?<div className="toast"><Check/>{notice}</div>:null}</div>
}