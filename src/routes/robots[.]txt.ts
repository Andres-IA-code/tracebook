import { createFileRoute } from "@tanstack/react-router";

// Se sirve dinámicamente para que la línea Sitemap use siempre el dominio real
// del sitio (todavía no está publicado, así que no conviene fijar una URL).
function buildRobots(origin: string): string {
  return `User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

User-agent: Twitterbot
Allow: /

User-agent: facebookexternalhit
Allow: /

User-agent: *
Allow: /

Sitemap: ${origin}/sitemap.xml
`;
}

export const Route = createFileRoute("/robots.txt")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const origin = new URL(request.url).origin;
        return new Response(buildRobots(origin), {
          headers: {
            "content-type": "text/plain; charset=utf-8",
            "cache-control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
