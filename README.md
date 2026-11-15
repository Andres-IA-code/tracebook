# Tracebook — Gestión e informes de pentest


Aplicación de escritorio de código abierto para documentar pentest autorizados: proyectos, autorizaciones firmadas, hallazgos, biblioteca de plantillas, informes y auditoría.



## Funciones
- Proyectos y clientes con borrado en cascada.
- Autorizaciones con alcance, exclusiones, ventana de pruebas, envío al cliente y PDF.
- Hallazgos por severidad y biblioteca de plantillas reutilizables.
- Informes en LaTeX (personalizable con logotipo, colores y contacto), PDF, Word, HTML y JSON.
- Registro de auditoría de importaciones, exportaciones y borrados.
- Respaldos cifrados con contraseña (AES-256-GCM), con generador de frases seguras e indicador de fortaleza.

## Privacidad
- Datos 100 % locales en tu equipo.
- Sin telemetría, sin cuentas, sin conexiones a internet (CSP `connect-src 'none'`).

## Instalación
Descarga el instalador desde *Releases*.

- **Windows**: `Tracebook-x.y.z-win-x64-setup.exe` (instalador) o `Tracebook-x.y.z-win-x64-portable.exe` (versión portable). Al no estar firmado, SmartScreen mostrará "Windows protegió su PC": pulsa **Más información → Ejecutar de todas formas**.
- **macOS**: `.dmg` para Intel (x64) o Apple Silicon (arm64). Gatekeeper lo bloqueará la primera vez: clic derecho sobre la app → **Abrir → Abrir**, o `xattr -dr com.apple.quarantine "/Applications/Tracebook.app"`.
- **Linux**: `.AppImage` (`chmod +x Tracebook-*.AppImage && ./Tracebook-*.AppImage`) o `.deb` (`sudo apt install ./Tracebook-*.deb`).

### Verificar la huella SHA-256
Las huellas oficiales de cada archivo se publican en el archivo `SHA256SUMS.txt` de cada *Release*: descargalo de la misma página que el instalador y compara su contenido con el resultado del comando:
- Windows: `Get-FileHash .\Tracebook-*.exe -Algorithm SHA256`
- macOS: `shasum -a 256 Tracebook-*.dmg`
- Linux: `sha256sum Tracebook-*.AppImage`

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

## Seguridad de los datos

- Los datos se guardan solo en esta computadora, cifrados con AES-256-GCM. Proyectos, autorizaciones, hallazgos, evidencias, informes, clientes, plantillas, configuración y auditoría se protegen con una contraseña maestra de al menos 12 caracteres. La primera apertura migra los datos anteriores después de verificar el cifrado.
- La clave se deriva con PBKDF2-SHA-256 (600.000 iteraciones y salt aleatorio de 16 bytes), no es exportable y solo permanece en memoria durante la sesión. Cada guardado usa un IV aleatorio de 12 bytes. No se guarda la contraseña ni la clave. Si se pierde la contraseña maestra, no hay forma de recuperar los datos o las copias.
- La app se bloquea después de 15 minutos de inactividad; el tiempo se configura entre 1 y 1440 minutos en Configuración. También se puede bloquear manualmente. Guardá los formularios antes de alejarte: las ediciones no guardadas se descartan al bloquear.
- El cifrado protege los datos en reposo, no frente a malware o acceso a la sesión desbloqueada. Recomendamos además cifrado de disco (BitLocker, FileVault o LUKS). La migración elimina las entradas anteriores, pero no garantiza borrar sus restos históricos del disco ni copias antiguas sin cifrar.
- Los informes exportados no se cifran.
- La app no se conecta a internet.

Formato del respaldo cifrado
El respaldo cifrado es un JSON con los parámetros en claro (`kdf`: PBKDF2-SHA256, iteraciones y salt de 16 bytes; `cipher`: AES-GCM con IV de 12 bytes) y el contenido cifrado en `data` (base64, con la etiqueta GCM de 16 bytes al final). Los datos adicionales autenticados (AAD) son `tracebook-encrypted-backup:v1` y la contraseña se normaliza en Unicode NFC.

Para descifrarlo sin la app (requiere `pip install cryptography`):

```python
import base64, getpass, hashlib, json, sys, unicodedata
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

f = json.load(open(sys.argv[1], encoding="utf-8"))
pw = unicodedata.normalize("NFC", getpass.getpass("Contraseña: ")).encode()
key = hashlib.pbkdf2_hmac("sha256", pw, base64.b64decode(f["kdf"]["salt"]), f["kdf"]["iterations"], 32)
data = AESGCM(key).decrypt(base64.b64decode(f["cipher"]["iv"]), base64.b64decode(f["data"]), b"tracebook-encrypted-backup:v1")
sys.stdout.write(data.decode("utf-8"))
```
Uso: `python descifrar.py tracebook-respaldo-cifrado-AAAA-MM-DD.json > respaldo.json`

## Copias de seguridad
En Configuración → Crear copia de seguridad (o Exportar datos desde el Panel) se genera `tracebook-respaldo-cifrado-AAAA-MM-DD.json`, siempre cifrado con la contraseña maestra, incluyendo configuración y auditoría. No existe exportación de datos sin cifrar; los informes PDF/Word siguen siendo documentos legibles para entregar.

Para restaurarlo usá Restaurar copia de seguridad en Configuración (o Importar datos en el Panel): la app pide la contraseña del archivo. Luego elegís combinar o reemplazar; los datos restaurados se guardan cifrados con la contraseña maestra de la sesión actual. Los respaldos sin cifrar de versiones anteriores se siguen importando por compatibilidad, pero nunca se vuelven a guardar en texto plano.

## Aviso legal
Esta herramienta sirve para documentar pruebas de seguridad **autorizadas** por escrito. Su uso contra sistemas sin permiso es responsabilidad exclusiva del usuario.

## Contribuir
Consulta [CONTRIBUTING.md](CONTRIBUTING.md).

## Licencia
AGPL-3.0 — puedes usar, estudiar, modificar y redistribuir el código, siempre que las versiones modificadas que distribuyas o pongas a disposición de otros se publiquen bajo la misma licencia. Ver [LICENSE](LICENSE).

¿Necesitas usarlo bajo otros términos (por ejemplo, integrarlo en un producto cerrado)? Contacta al autor para una licencia comercial.

---

## English summary
Tracebook is an open-source, fully offline desktop app (Electron) to manage authorized penetration tests: projects, signed authorizations, findings, template library, reports (LaTeX/PDF/Word/HTML/JSON) and an audit log. No accounts, no telemetry, no network access — data stays on your machine. Installers are unsigned: on Windows use *More info → Run anyway*; on macOS right-click → *Open*. Build with `bun install && bun run dist:<win|mac|linux>`. Licensed under the GNU AGPL v3 (AGPL-3.0-or-later); commercial licenses available from the author. Use only for authorized testing.
