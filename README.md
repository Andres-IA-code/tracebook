# La Papa — Gestión e informes de pentest

En el Río de la Plata, *la papa* es lo esencial, la posta: lo que realmente tenés que saber. Eso es lo que entrega un buen informe de pentest.

Aplicación de escritorio de código abierto para documentar pentest autorizados: proyectos, autorizaciones firmadas, hallazgos, biblioteca de plantillas, informes y auditoría.



## Funciones
- Proyectos y clientes con borrado en cascada.
- Autorizaciones con alcance, exclusiones, ventana de pruebas, envío al cliente y PDF.
- Hallazgos por severidad y biblioteca de plantillas reutilizables.
- Informes en LaTeX (personalizable con logotipo, colores y contacto), PDF, Word, HTML y JSON.
- Registro de auditoría de importaciones, exportaciones y borrados.

## Privacidad
- Datos 100 % locales en tu equipo.
- Sin telemetría, sin cuentas, sin conexiones a internet (CSP `connect-src 'none'`).

## Instalación
Descarga el instalador desde *Releases*.

- **Windows**: `LaPapa-x.y.z-win-x64-setup.exe` (instalador) o `LaPapa-x.y.z-win-x64-portable.exe` (versión portable). Al no estar firmado, SmartScreen mostrará "Windows protegió su PC": pulsa **Más información → Ejecutar de todas formas**.
- **macOS**: `.dmg` para Intel (x64) o Apple Silicon (arm64). Gatekeeper lo bloqueará la primera vez: clic derecho sobre la app → **Abrir → Abrir**, o `xattr -dr com.apple.quarantine "/Applications/La Papa.app"`.
- **Linux**: `.AppImage` (`chmod +x LaPapa-*.AppImage && ./LaPapa-*.AppImage`) o `.deb` (`sudo apt install ./LaPapa-*.deb`).

### Verificar la huella SHA-256
Las huellas oficiales de cada archivo se publican en el archivo `SHA256SUMS.txt` de cada *Release*: descargalo de la misma página que el instalador y compara su contenido con el resultado del comando:
- Windows: `Get-FileHash .\LaPapa-*.exe -Algorithm SHA256`
- macOS: `shasum -a 256 LaPapa-*.dmg`
- Linux: `sha256sum LaPapa-*.AppImage`

## Compilar desde el código fuente
Requiere Bun (o Node 20+).

Si bun install falla con un error 403, ejecuta primero: `node scripts/fix-lockfile.mjs`
```bash
bun install
bun run dist:linux   # AppImage + deb
bun run dist:win     # NSIS + portable
bun run dist:mac     # dmg x64 + arm64 (en macOS)
bun run dist         # todas las plataformas posibles
```
Los instaladores quedan en `release/`. Para cambiar el nombre visible edita `src/brand.ts` y `productName` en `electron-builder.yml`.

## Publicar una versión
Para mantenedores:

1. Actualiza la versión en `package.json` y en `src/brand.ts`.
2. En GitHub, ve a **Actions → "Publicar versión" → Run workflow** y ejecútalo.
3. Cuando termine, revisa el borrador en **Releases** y publícalo.

## Copias de seguridad
En **Configuración → Exportar datos** se genera un archivo JSON con todo tu espacio de trabajo. Guárdalo en un lugar seguro; puedes restaurarlo con la opción de importación (combinar o reemplazar).

## Aviso legal
Esta herramienta sirve para documentar pruebas de seguridad **autorizadas** por escrito. Su uso contra sistemas sin permiso es responsabilidad exclusiva del usuario.

## Contribuir
Consulta [CONTRIBUTING.md](CONTRIBUTING.md).

## Licencia
AGPL-3.0 — puedes usar, estudiar, modificar y redistribuir el código, siempre que las versiones modificadas que distribuyas o pongas a disposición de otros se publiquen bajo la misma licencia. Ver [LICENSE](LICENSE).

¿Necesitas usarlo bajo otros términos (por ejemplo, integrarlo en un producto cerrado)? Contacta al autor para una licencia comercial.

---

## English summary
La Papa is an open-source, fully offline desktop app (Electron) to manage authorized penetration tests: projects, signed authorizations, findings, template library, reports (LaTeX/PDF/Word/HTML/JSON) and an audit log. No accounts, no telemetry, no network access — data stays on your machine. Installers are unsigned: on Windows use *More info → Run anyway*; on macOS right-click → *Open*. Build with `bun install && bun run dist:<win|mac|linux>`. Licensed under the GNU AGPL v3 (AGPL-3.0-or-later); commercial licenses available from the author. Use only for authorized testing.
