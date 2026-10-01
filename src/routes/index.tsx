import { createFileRoute } from "@tanstack/react-router";

import { VerticeApp } from "@/components/vertice-app";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Vértice — Gestión de Pentests" },
      { name: "description", content: "Gestión integral de proyectos de pentesting, hallazgos, autorizaciones e informes." },
      { property: "og:title", content: "Vértice — Gestión de Pentests" },
      { property: "og:description", content: "Gestiona proyectos de seguridad, hallazgos y remediación en un solo lugar." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return <VerticeApp />;
}
