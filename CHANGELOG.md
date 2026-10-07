# Changelog

## 0.2.0 — 2026-10-07
- Gestión ampliada: edición y eliminación de hallazgos (con auditoría), edición del estado de proyectos desde Editar proyecto e Informes, y vista de detalles de clientes con edición de industria, contacto y correo.
- Contadores clickeables por estado en el panel (En preparación, En prueba, En revisión, Informes entregados) con navegación a Proyectos.
- Informes: selector «En preparación / Entregado» sincronizado con el panel y registrado en auditoría.
- LaTeX más ordenado: portada, índice, resumen ejecutivo, datos del proyecto, hallazgos agrupados por severidad (incluye «Sin clasificar»), tablas, encabezados y pies.
- Vinculación de hallazgos por `projectId` (los vínculos antiguos por nombre se actualizan al cargar o importar) y aviso sobre hallazgos sin proyecto.
- Autorizaciones firmadas: se quitó «Revocar» (se conserva el historial) y la eliminación exige marcar una casilla de confirmación.
- Importación de respaldos con opciones Combinar / Reemplazar / Cancelar.
- Nueva identidad visual: nombre Tracebook y nuevo logo con fondo transparente; publicaciones de GitHub con nombre y hashes SHA-256 documentados.

## 0.1.0 — 2026-10-05
- Primera versión de escritorio de código abierto, publicada bajo la licencia GNU AGPL v3 (AGPL-3.0-or-later).
- Proyectos, autorizaciones, hallazgos, biblioteca, informes (LaTeX, PDF, Word, HTML, JSON), clientes, configuración y auditoría.
- Datos 100 % locales, sin cuentas ni conexiones de red; tipografías empaquetadas.
- Instaladores con electron-builder: Windows (NSIS y portable), macOS (dmg x64/arm64), Linux (AppImage y deb).
