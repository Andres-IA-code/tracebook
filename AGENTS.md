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

- Tracebook is a desktop-only, offline Electron app; `/` renders WorkspaceApp directly so the Lovable preview matches the desktop build. No backend, accounts, env vars or network requests.
- Read the visible product name/version only from `src/brand.ts` (plus productName in electron-builder.yml) so renaming touches one place; keep appId/userData `pentest-reports-desktop` fixed so renames never lose data; keep the local storage keys (`vertice-workspace-data`, `vertice-settings`, `vertice-audit`) unchanged, because renaming them would silently wipe data people already saved.
- Package with electron-builder (`electron-builder.yml`, output `release/`); desktop build is a static Vite entry in `desktop/` with a strict CSP and no external origins.
- Bundle fonts locally via @fontsource imports at the top of `src/styles.css` because the app must never contact external servers.
- Keep desktop startup local-only and package its application files into ASAR to minimize startup filesystem work.
- Apply the local appearance preference through the shared theme module and semantic CSS tokens in both preview and desktop; persist it independently from workspace settings so changing appearance never overwrites unsaved form edits.
- Link findings to projects by `projectId` (legacy name links are upgraded on load/import); project deletion cascades to linked findings and authorizations, so records never orphan.
- Print reports/authorizations through a hidden in-page iframe (`src/lib/print-html.ts`), because Electron blocks new blank windows.
- Give exported HTML and print iframe documents their own light color scheme and paper/ink tokens, so app appearance never changes document rendering; LaTeX uses its independent report branding.
- Keep LaTeX report branding in the persisted workspace settings and embed custom logos into the generated source so exports remain portable.
- Keep every package URL in `bun.lock` on the public registry https://registry.npmjs.org/ (fix with `node scripts/fix-lockfile.mjs`), so anyone can clone and run `bun install`.
- Never rename the localStorage keys `vertice-workspace-data`, `vertice-settings`, `vertice-audit`; they are kept on purpose for compatibility with data already saved.
- Encrypted backups use only Web Crypto (src/lib/backup-crypto.ts, versioned file format); never log or persist passwords, so backups stay safe and offline.
- Finding technical fields are optional and normalized on load/import; evidence images are validated PNG/JPEG data URLs stored inside the existing workspace and backups, so legacy records remain compatible and attachments stay offline and portable.
- CVSS base metrics use the bundled js-cvss 3.1 impact/exploitability engine with FIRST Appendix A rounding in a shared browser-safe module; CWE, score, and vector remain separate optional fields, and manual severity overrides persist without being recalculated on load.
- Final reports are immutable local workspace snapshots (including findings, evidence, signed authorization and branding); only delivery status changes, so later edits never alter issued documents. Backups include reports, and the delivered-report metric counts report records, independently of project status.
- Generate final report preview, PDF and true OOXML Word from shared document blocks in browser-safe modules; bundle export libraries locally and never contact external services.
- Gate the entire workspace behind a master-password vault; store a single authenticated AES-256-GCM envelope at the legacy data key, including settings and audit. Derive non-extractable memory-only keys via PBKDF2-SHA-256 with at least 600,000 iterations; verify migration before removing legacy plaintext settings/audit.
- Serialize vault writes and flush before locking; never silently discard failed encrypted saves. Unmount the workspace and release keys/plaintext on lock. All data backups are encrypted with the unlocked vault key and include audit; theme alone is non-confidential and remains independent.
