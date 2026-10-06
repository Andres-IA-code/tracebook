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

- La Papa is a desktop-only, offline Electron app; `/` renders WorkspaceApp directly so the Lovable preview matches the desktop build. No backend, accounts, env vars or network requests.
- Read the visible product name/version only from `src/brand.ts` (plus productName in electron-builder.yml) so renaming touches one place; keep appId/userData `pentest-reports-desktop` fixed so renames never lose data; keep the local storage keys (`vertice-workspace-data`, `vertice-settings`, `vertice-audit`) unchanged, because renaming them would silently wipe data people already saved.
- Package with electron-builder (`electron-builder.yml`, output `release/`); desktop build is a static Vite entry in `desktop/` with a strict CSP and no external origins.
- Bundle fonts locally via @fontsource imports at the top of `src/styles.css` because the app must never contact external servers.
- Keep desktop startup local-only and package its application files into ASAR to minimize startup filesystem work.
- Keep the app permanently dark-themed across web and desktop; do not expose a light-mode switch.
- Link findings to projects by `projectId` (legacy name links are upgraded on load/import); project deletion cascades to linked findings and authorizations, so records never orphan.
- Print reports/authorizations through a hidden in-page iframe (`src/lib/print-html.ts`), because Electron blocks new blank windows.
- Keep LaTeX report branding in the persisted workspace settings and embed custom logos into the generated source so exports remain portable.
- Keep every package URL in `bun.lock` on the public registry https://registry.npmjs.org/ (fix with `node scripts/fix-lockfile.mjs`), so anyone can clone and run `bun install`.
- Never rename the localStorage keys `vertice-workspace-data`, `vertice-settings`, `vertice-audit`; they are kept on purpose for compatibility with data already saved.
