# Personalizar la plantilla LaTeX de informes

## Objetivo
Permitir que cada informe LaTeX use la identidad del equipo configurada por el usuario, manteniendo intactos los demás formatos y funciones.

## Cambios
- Añadir en Configuración una sección “Plantilla LaTeX” para:
  - cargar o quitar un logotipo;
  - elegir color principal, color de texto y color secundario;
  - definir teléfono, sitio web y dirección del equipo.
- Guardar esta personalización junto con la configuración local existente e incluirla en los respaldos.
- Insertar el logotipo dentro del archivo `.tex` sin archivos externos, para que el informe siga siendo autocontenido.
- Aplicar los colores configurados a títulos, líneas, encabezado y pie del documento.
- Mostrar los datos de contacto en el encabezado y pie del informe LaTeX, omitiendo automáticamente los campos vacíos.
- Mantener valores predeterminados compatibles con la plantilla actual y con configuraciones antiguas.

## Validación
- Comprobar guardado y persistencia de logotipo, colores y contacto.
- Generar un `.tex` y verificar que contiene la identidad configurada y compila con paquetes LaTeX habituales.
- Revisar la pantalla de Configuración en escritorio y móvil, sin modificar la estética general.

## Detalles técnicos
- El logotipo se almacenará como imagen PNG/JPEG en formato de datos local, con límite de tamaño para no degradar el almacenamiento.
- La plantilla usará `graphicx` y `\includegraphics` con una imagen embebida mediante `filecontents*`; si no hay logotipo, conservará la marca geométrica actual.
- Los colores se normalizarán a valores hexadecimales válidos antes de escribirlos en LaTeX.
