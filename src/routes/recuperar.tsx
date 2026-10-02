import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";

import { AuthShell } from "@/components/public-site";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { authErrorMessage } from "@/hooks/use-auth";

export const Route = createFileRoute("/recuperar")({
  head: () => ({
    meta: [
      { title: "Recuperar contraseña — Vértice" },
      { name: "description", content: "Recibe un enlace por correo para restablecer tu contraseña de Vértice." },
      { property: "og:title", content: "Recuperar contraseña — Vértice" },
      { property: "og:description", content: "Restablece el acceso a tu cuenta de Vértice." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RecoverPage,
});

function RecoverPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true); setError("");
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/restablecer` });
    setBusy(false);
    if (err) setError(authErrorMessage(err.message)); else setSent(true);
  }

  return (
    <AuthShell code="Acceso · 03" title="Recuperar contraseña" intro={sent ? `Si existe una cuenta para ${email}, recibirás un enlace para crear una nueva contraseña.` : "Te enviaremos un enlace para crear una nueva contraseña."} foot={<Link to="/login">Volver a iniciar sesión</Link>}>
      {sent ? null : (
        <form className="pub-form" onSubmit={submit}>
          <label>Correo<Input type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} /></label>
          {error ? <p className="pub-error" role="alert">{error}</p> : null}
          <Button type="submit" size="lg" disabled={busy}>{busy ? "Enviando…" : "Enviar enlace"}</Button>
        </form>
      )}
    </AuthShell>
  );
}
