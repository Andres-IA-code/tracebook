import { createFileRoute } from "@tanstack/react-router";

// Páginas públicas que queremos que los buscadores descubran.
// /app queda fuera porque exige sesión.
const PAGES: Array<{ path: string; priority: string; changefreq: "weekly" | "monthly" }> = [
  { path: "/", priority: "1.0", changefreq: "weekly" },
  { path: "/registro", priority: "0.8", changefreq: "monthly" },
  { path: "/login", priority: "0.6", changefreq: "monthly" },
  { path: "/recuperar", priority: "0.3", changefreq: "monthly" },
  { path: "/restablecer", priority: "0.3", changefreq: "monthly" },
];

function buildSitemap(origin: string): string {
  const urls = PAGES.map(
    (page) =>
      `  <url>\n    <loc>${origin}${page.path === "/" ? "/" : page.path}</loc>\n    <changefreq>${page.changefreq}</changefreq>\n    <priority>${page.priority}</priority>\n  </url>`,
  ).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const origin = new URL(request.url).origin;
        return new Response(buildSitemap(origin), {
          headers: {
            "content-type": "application/xml; charset=utf-8",
            "cache-control": "public, max-age=3600",
            "x-robots-tag": "noindex",
          },
        });
      },
    },
  },
});
