import { createFileRoute, Link } from "@tanstack/react-router";
import type { CSSProperties } from "react";
import { ClipboardCheck, FileText, FolderKanban, KeyRound, Library, ShieldCheck, HardDrive, Lock } from "lucide-react";

import { PublicFooter, PublicHeader } from "@/components/public-site";
import { CubeScrollScene } from "@/components/cube-scroll-scene";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import { Button } from "@/components/ui/button";
import cubeImage from "@/assets/vertice-cube-static.jpg.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Vértice — Gestión de pentest de principio a fin" },
      { name: "description", content: "Autorización firmada, hallazgos organizados e informe listo para entregar. Todo en un solo lugar." },
      { property: "og:title", content: "Vértice — Gestión de pentest de principio a fin" },
      { property: "og:description", content: "Autorización firmada, hallazgos organizados e informe listo para entregar." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "preload", as: "image", href: cubeImage.url, fetchpriority: "high" },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  { icon: FolderKanban, code: "01", title: "Proyectos", text: "Cada encargo con su cliente, alcance, fechas y estado en una sola ficha." },
  { icon: ClipboardCheck, code: "02", title: "Autorizaciones", text: "Alcance, exclusiones y ventana de pruebas listos para firmar y enviar al cliente." },
  { icon: KeyRound, code: "03", title: "Hallazgos", text: "Severidad, CWE, evidencias y remediación ordenados por proyecto." },
  { icon: Library, code: "04", title: "Biblioteca", text: "Plantillas reutilizables para registrar hallazgos frecuentes en segundos." },
  { icon: FileText, code: "05", title: "Informes", text: "Exporta a LaTeX, PDF, Word o HTML con tu logotipo y colores." },
  { icon: ShieldCheck, code: "06", title: "Auditoría", text: "Registro de quién exportó o eliminó datos y cuándo ocurrió." },
];

const STEPS = [
  { n: "01", title: "Autoriza", text: "Define el alcance y obtén la firma del cliente antes de empezar." },
  { n: "02", title: "Registra", text: "Documenta cada hallazgo con su severidad y evidencia mientras pruebas." },
  { n: "03", title: "Entrega", text: "Genera el informe final con la identidad de tu equipo y envíalo." },
];

function Landing() {
  useScrollReveal();
  return (
    <div className="pub-page pub-landing">
      <CubeScrollScene />
      <PublicHeader />
      <main>
        <section className="pub-wrap pub-hero">
          <div data-reveal>
            <small className="pub-code">Ref. VRT-001 · Plataforma de pentesting</small>
            <h1>Gestión de pentest de principio a fin</h1>
            <p>Autorización firmada, hallazgos organizados e informe listo para entregar. Todo en un solo lugar.</p>
            <div className="pub-cta">
              <Button asChild size="lg"><Link to="/registro">Empezar ahora</Link></Button>
              <Button asChild size="lg" variant="outline"><Link to="/login">Iniciar sesión</Link></Button>
            </div>
          </div>
          <aside className="pub-spec" data-reveal style={{ "--reveal-delay": "120ms" } as CSSProperties}>
            <div className="pub-spec-dark"><small>Flujo completo</small><strong>3 pasos</strong><span>De la firma al informe</span></div>
            <dl>
              <div><dt>Formatos</dt><dd>LaTeX · PDF · Word · HTML</dd></div>
              <div><dt>Severidades</dt><dd>Crítica · Alta · Media · Baja</dd></div>
              <div><dt>Datos</dt><dd>Guardados en tu equipo</dd></div>
              <div><dt>Idioma</dt><dd>Español</dd></div>
            </dl>
          </aside>
        </section>

        <section id="funciones" className="pub-wrap pub-section">
          <h2 data-reveal>Funciones</h2>
          <div className="pub-grid">
            {FEATURES.map(({ icon: Icon, code, title, text }, i) => (
              <article key={code} className="pub-card" data-reveal style={{ "--reveal-delay": `${i * 70}ms` } as CSSProperties}><small className="pub-code">{code}</small><Icon /><h3>{title}</h3><p>{text}</p></article>
            ))}
          </div>
        </section>

        <section id="como-funciona" className="pub-wrap pub-section">
          <h2 data-reveal>Cómo funciona</h2>
          <ol className="pub-steps">
            {STEPS.map((s, i) => <li key={s.n} data-reveal style={{ "--reveal-delay": `${i * 100}ms` } as CSSProperties}><strong>{s.n}</strong><h3>{s.title}</h3><p>{s.text}</p></li>)}
          </ol>
        </section>

        <section id="seguridad" className="pub-wrap pub-section">
          <h2 data-reveal>Seguridad</h2>
          <div className="pub-grid pub-grid-3">
            <article className="pub-card" data-reveal><Lock /><h3>Acceso con cuenta</h3><p>Solo entras al espacio de trabajo con tu correo y contraseña.</p></article>
            <article className="pub-card" data-reveal style={{ "--reveal-delay": "70ms" } as CSSProperties}><HardDrive /><h3>Datos locales</h3><p>Proyectos y hallazgos se guardan en tu navegador; exporta copias cuando quieras.</p></article>
            <article className="pub-card" data-reveal style={{ "--reveal-delay": "140ms" } as CSSProperties}><ShieldCheck /><h3>Trazabilidad</h3><p>Cada exportación y eliminación queda en el registro de auditoría.</p></article>
          </div>
        </section>

        <section className="pub-wrap pub-section">
          <div className="pub-banner" data-reveal><div><small>Empieza hoy</small><strong>Tu próximo informe, listo</strong></div><Button asChild size="lg"><Link to="/registro">Crear cuenta</Link></Button></div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
