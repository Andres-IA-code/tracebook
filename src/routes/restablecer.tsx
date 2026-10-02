import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";

import { AuthShell } from "@/components/public-site";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { authErrorMessage } from "@/hooks/use-auth";

export const Route = createFileRoute("/restablecer")({
  head: () => ({
    meta: [
      { title: "Nueva contraseña — Vértice" },
      { name: "description", content: "Crea una nueva contraseña para tu cuenta de Vértice." },
      { property: "og:title", content: "Nueva contraseña — Vértice" },
      { property: "og:description", content: "Crea una nueva contraseña para tu cuenta." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPage,
});

function ResetPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true); setError("");
    const { error: err } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (err) setError(authErrorMessage(err.message)); else navigate({ to: "/app", replace: true });
  }

  return (
    <AuthShell code="Acceso · 04" title="Nueva contraseña" intro="Escribe tu nueva contraseña.">
      <form className="pub-form" onSubmit={submit}>
        <label>Nueva contraseña<Input type="password" autoComplete="new-password" minLength={6} required value={password} onChange={e => setPassword(e.target.value)} /></label>
        {error ? <p className="pub-error" role="alert">{error}</p> : null}
        <Button type="submit" size="lg" disabled={busy}>{busy ? "Guardando…" : "Guardar contraseña"}</Button>
      </form>
    </AuthShell>
  );
}
