# Vértice: Gestión de Pentests

## Objetivo
Convertir el diseño adjunto en una aplicación Lovable navegable, conservando su estructura visual, textos en español, estilo de producto B2B y estados de demostración.

## Pantallas
- Panel principal con métricas, alerta de autorización y proyectos activos.
- Proyectos con búsqueda, filtros por estado y tabla adaptable.
- Autorizaciones con alcance, activos, reglas, firma pendiente y auditoría.
- Hallazgos con listado seleccionable, filtros, detalle y evidencias.
- Biblioteca con categorías, plantillas seleccionables y vista previa.
- Informes con secciones configurables, selector de formato y portada.
- Clientes con contactos, historial, evolución y activos verificados.
- Vista de firma del cliente y portal de remediación como modos accesibles desde la interfaz.

## Interacciones
- Navegación lateral entre todas las secciones.
- Búsquedas y filtros funcionales en proyectos, hallazgos y biblioteca.
- Selección de hallazgos y plantillas con contenido actualizado.
- Controles de informe, formato y confirmaciones de firma interactivos.
- Botones principales con confirmación visual local, sin persistencia ni servicios externos.
- Menú lateral adaptable para pantallas pequeñas.

## Diseño
- Mantener IBM Plex Sans/Mono, fondo gris claro, superficies blancas, azul de acción y estados semánticos rojo/ámbar/verde.
- Reproducir la densidad, jerarquía, bordes finos, tablas y tarjetas compactas del archivo.
- Adaptar los diseños fijos de escritorio a móvil sin perder contenido ni provocar solapamientos.

## Detalles técnicos
- Implementar la experiencia en React y TanStack Router dentro de la página principal.
- Crear componentes reutilizables para navegación, etiquetas de estado, tablas y controles.
- Definir colores, tipografía, sombras y tamaños mediante tokens semánticos globales.
- Añadir metadatos propios de Vértice y verificar visualmente en escritorio y móvil.

## Supuesto
Los datos son demostrativos y se conservarán en memoria; no se añadirá autenticación, base de datos ni integraciones reales.
