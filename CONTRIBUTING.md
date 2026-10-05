# Contribuir a Vector

## Reportar errores y proponer mejoras
- **Errores**: abre un *issue* describiendo qué hiciste, qué esperabas y qué ocurrió, junto con tu sistema operativo y la versión de Vector. No incluyas datos reales de clientes.
- **Mejoras**: abre un *issue* explicando la propuesta antes de empezar cambios grandes.
- **Pull requests**: crea una rama desde `main`, mantén los cambios acotados, describe qué resuelven y enlaza el *issue* correspondiente.
- Las vulnerabilidades de seguridad se informan según [SECURITY.md](SECURITY.md).

## Compilar el proyecto
Requiere Bun (o Node 20+).
```bash
bun install
bun run dist:linux   # AppImage + deb
bun run dist:win     # NSIS + portable
bun run dist:mac     # dmg x64 + arm64 (en macOS)
bun run dist         # todas las plataformas posibles
```
Los instaladores quedan en `release/`.

## Acuerdo de contribución
Al enviar un aporte (código, documentación u otro material) mediante un pull request o cualquier otro medio, confirmas que:
1. Eres el autor del aporte o tienes derecho a enviarlo.
2. Lo aportas bajo la licencia del proyecto, GNU AGPL v3 (AGPL-3.0-or-later).
3. Concedes al autor del proyecto (La Papa) el derecho permanente, mundial y no exclusivo de distribuir tu aporte también bajo otras licencias, incluidas licencias comerciales.
