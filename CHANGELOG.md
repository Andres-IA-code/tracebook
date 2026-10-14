# Changelog

## 0.3.1 — 2026-10-14
- Configuración → Acerca de: se quitó la línea que mostraba el enlace al repositorio de código fuente.
- Panel: las tarjetas «En prueba», «En revisión» y «Entregado» muestran la cantidad de proyectos en cada estado y abren Proyectos al hacer clic; «Informes entregados» cuenta los proyectos entregados. (Estos ajustes venían de la 0.2.0 y no estaban anotados en el registro de versiones.)
- Publicación: los borradores de Release ya no se marcan como «última versión», así no reemplazan a la versión estable publicada.

## 0.3.0 — 2026-10-07
- Autorizaciones: se quitó el botón «Enviar al cliente» y el registro «Enviada al cliente» del historial; sigue disponible «Marcar como enviada».
- Informes: se eliminó el logo antiguo que aparecía cuando no se cargó un logo personalizado; ahora solo se muestra el nombre de la organización.
- Íconos: el favicon y los íconos de la aplicación (acceso directo de escritorio, Android e instalador) usan el logo actual de Tracebook.
- Mantenimiento: el bloqueo de dependencias usa el registro público de npm y se actualizó la configuración de desarrollo.

## 0.2.0 — 2026-10-07
- La aplicación cambia de nombre de La Papa a Tracebook. Los datos guardados se conservan.

## 0.1.0 — 2026-10-05
- Primera versión de escritorio de código abierto, publicada bajo la licencia GNU AGPL v3 (AGPL-3.0-or-later).
- Proyectos, autorizaciones, hallazgos, biblioteca, informes (LaTeX, PDF, Word, HTML, JSON), clientes, configuración y auditoría.
- Datos 100 % locales, sin cuentas ni conexiones de red; tipografías empaquetadas.
- Instaladores con electron-builder: Windows (NSIS y portable), macOS (dmg x64/arm64), Linux (AppImage y deb).
