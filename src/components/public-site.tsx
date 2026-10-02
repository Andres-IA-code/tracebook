import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";

export function Logo() {
  return (
    <Link to="/" className="pub-logo" aria-label="Vértice, inicio">
      <span className="pub-mark" />VÉRTICE
    </Link>
  );
}

function scrollToSection(e: React.MouseEvent<HTMLAnchorElement>, id: string) {
  if (window.location.pathname !== "/") return; // desde otra página, navegación normal
  e.preventDefault();
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  history.replaceState(null, "", `/#${id}`);
}

export function PublicHeader() {
  return (
    <header className="pub-header">
      <div className="pub-wrap pub-header-inner">
        <Logo />
        <nav className="pub-nav">
          <a href="/#funciones" onClick={(e) => scrollToSection(e, "funciones")}>Funciones</a>
          <a href="/#como-funciona" onClick={(e) => scrollToSection(e, "como-funciona")}>Cómo funciona</a>
          <a href="/#seguridad" onClick={(e) => scrollToSection(e, "seguridad")}>Seguridad</a>
        </nav>
        <div className="pub-actions">
          <Button asChild variant="outline"><Link to="/login">Iniciar sesión</Link></Button>
          <Button asChild><Link to="/registro">Crear cuenta</Link></Button>
        </div>
      </div>
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="pub-footer">
      <div className="pub-wrap pub-footer-inner">
        <Logo />
        <small>Gestión de pentest · Autorización, hallazgos e informes</small>
        <small>© {new Date().getFullYear()} Vértice</small>
      </div>
    </footer>
  );
}

export function AuthShell({ code, title, intro, children, foot }: { code: string; title: string; intro: string; children: ReactNode; foot?: ReactNode }) {
  return (
    <div className="pub-auth">
      <div className="pub-auth-top"><Logo /><Link to="/" className="pub-back">← Volver al inicio</Link></div>
      <main className="pub-auth-card">
        <small className="pub-code">{code}</small>
        <h1>{title}</h1>
        <p>{intro}</p>
        {children}
        {foot ? <div className="pub-auth-foot">{foot}</div> : null}
      </main>
    </div>
  );
}
