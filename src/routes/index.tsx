import { createFileRoute } from "@tanstack/react-router";

import { WorkspaceApp } from "@/components/workspace-app";
import { BRAND } from "@/brand";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: `${BRAND.name} — ${BRAND.tagline}` },
      { name: "description", content: "Proyectos, autorizaciones, hallazgos e informes de pentest, guardados solo en tu equipo." },
      { property: "og:title", content: `${BRAND.name} — ${BRAND.tagline}` },
      { property: "og:description", content: "Gestión local de pentest: autorizaciones, hallazgos e informes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <WorkspaceApp />,
});
