# Ordenar la estructura del informe LaTeX

## Objetivo
Hacer que el informe exportado sea más claro, profesional y fácil de recorrer, sin cambiar los datos ni el estilo de la aplicación.

## Cambios
- Crear una portada separada con logotipo, título, proyecto, cliente, fecha y confidencialidad.
- Añadir un índice automático con numeración coherente de secciones.
- Ordenar el contenido en: resumen ejecutivo, identificación del proyecto, distribución de severidades y detalle de hallazgos.
- Agrupar los hallazgos por severidad y mostrar cada uno en un bloque consistente con número, severidad, estado y descripción.
- Mejorar saltos de página, espacios, encabezado, pie y tablas para evitar contenido apretado o cortado.
- Actualizar la vista previa para que refleje la nueva jerarquía del archivo `.tex`.

## Validación
- Generar un informe con varios hallazgos y comprobar el orden, la agrupación y los saltos de página.
- Verificar que siguen funcionando el logotipo, colores y datos de contacto personalizados.
- Confirmar que la vista previa abre correctamente y que la aplicación compila sin errores.

## Detalles técnicos
- Mantener el archivo `.tex` autocontenido y compatible con LuaLaTeX cuando exista un logotipo embebido.
- Usar paquetes LaTeX habituales para índice, tablas, encabezados y control de saltos, sin incorporar servicios externos.
