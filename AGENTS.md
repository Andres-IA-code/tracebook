<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Project architecture

- Keep Vértice as a client-side root-route workspace with no fabricated records; user-entered operational data persists locally in the browser so the workspace remains functional without backend setup.
- Keep the desktop build as a separate static Vite entry consumed by Electron, so the web SSR build and installed app share the same workspace component without changing deployment behavior.
- Keep desktop startup local-only and package its application files into ASAR to minimize startup filesystem work.
- Keep Vértice permanently dark-themed across web and desktop; do not expose a light-mode switch.
- Link findings to projects by `projectId` (legacy name links are upgraded on load/import); project deletion cascades to linked findings and authorizations, so records never orphan.
- Print reports/authorizations through a hidden in-page iframe (`src/lib/print-html.ts`), because Electron blocks new blank windows.
- Keep LaTeX report branding in the persisted workspace settings and embed custom logos into the generated source so exports remain portable.
- Web routes: `/` public landing, `/login` `/registro` `/recuperar` `/restablecer` auth via Lovable Cloud, `/app` renders VerticeApp behind a client-side session guard; desktop entry still mounts VerticeApp directly without auth — workspace data stays local, auth only gates web access.
