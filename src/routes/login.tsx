import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";

import { AuthShell } from "@/components/public-site";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { authErrorMessage, useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Iniciar sesión — Vector" },
      { name: "description", content: "Accede a tu espacio de trabajo de pentesting en Vector." },
      { property: "og:title", content: "Iniciar sesión — Vector" },
      { property: "og:description", content: "Accede a tu espacio de trabajo de pentesting." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (!loading && user) navigate({ to: "/app", replace: true }); }, [loading, user, navigate]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true); setError("");
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (err) setError(authErrorMessage(err.message));
    else navigate({ to: "/app", replace: true });
  }

  return (
    <AuthShell code="Acceso · 01" title="Iniciar sesión" intro="Entra a tu espacio de trabajo." foot={<>¿No tienes cuenta? <Link to="/registro">Crear cuenta</Link></>}>
      <form className="pub-form" onSubmit={submit}>
        <label>Correo<Input type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} /></label>
        <label>Contraseña<Input type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} /></label>
        <Link to="/recuperar" className="pub-link">¿Olvidaste tu contraseña?</Link>
        {error ? <p className="pub-error" role="alert">{error}</p> : null}
        <Button type="submit" size="lg" disabled={busy}>{busy ? "Entrando…" : "Iniciar sesión"}</Button>
      </form>
    </AuthShell>
  );
}
