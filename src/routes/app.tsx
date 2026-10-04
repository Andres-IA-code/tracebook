import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { VectorApp } from "@/components/vector-app";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/app")({
  head: () => ({
    meta: [
      { title: "Espacio de trabajo — Vector" },
      { name: "description", content: "Proyectos, hallazgos, autorizaciones e informes de pentesting." },
      { property: "og:title", content: "Espacio de trabajo — Vector" },
      { property: "og:description", content: "Tu espacio de trabajo de pentesting en Vector." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AppPage,
});

function AppPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login", replace: true });
  }, [loading, user, navigate]);

  if (loading || !user) return <div className="pub-loading"><span className="pub-mark" />Cargando…</div>;

  return (
    <VectorApp
      userEmail={user.email ?? undefined}
      onSignOut={async () => { await supabase.auth.signOut(); navigate({ to: "/login", replace: true }); }}
    />
  );
}
