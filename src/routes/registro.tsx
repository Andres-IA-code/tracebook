import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";

import { AuthShell } from "@/components/public-site";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { authErrorMessage, useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/registro")({
  head: () => ({
    meta: [
      { title: "Crear cuenta — Brecha" },
      { name: "description", content: "Crea tu cuenta de Brecha y gestiona tus pentest de principio a fin." },
      { property: "og:title", content: "Crear cuenta — Brecha" },
      { property: "og:description", content: "Crea tu cuenta y empieza a gestionar pentest." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (!loading && user) navigate({ to: "/app", replace: true }); }, [loading, user, navigate]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (password !== confirm) { setError("Las contraseñas no coinciden."); return; }
    setBusy(true); setError("");
    const { data, error: err } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/app` } });
    setBusy(false);
    if (err) setError(authErrorMessage(err.message));
    else if (data.session) navigate({ to: "/app", replace: true });
    else setSent(true);
  }

  if (sent) return (
    <AuthShell code="Registro · 02" title="Revisa tu correo" intro={`Enviamos un enlace de confirmación a ${email}. Ábrelo para activar tu cuenta.`} foot={<Link to="/login">Volver a iniciar sesión</Link>}>{null}</AuthShell>
  );

  return (
    <AuthShell code="Registro · 02" title="Crear cuenta" intro="Empieza a gestionar tus pentest." foot={<>¿Ya tienes cuenta? <Link to="/login">Iniciar sesión</Link></>}>
      <form className="pub-form" onSubmit={submit}>
        <label>Correo<Input type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} /></label>
        <label>Contraseña<Input type="password" autoComplete="new-password" minLength={6} required value={password} onChange={e => setPassword(e.target.value)} /></label>
        <label>Repetir contraseña<Input type="password" autoComplete="new-password" minLength={6} required value={confirm} onChange={e => setConfirm(e.target.value)} /></label>
        {error ? <p className="pub-error" role="alert">{error}</p> : null}
        <Button type="submit" size="lg" disabled={busy}>{busy ? "Creando…" : "Crear cuenta"}</Button>
      </form>
    </AuthShell>
  );
}
