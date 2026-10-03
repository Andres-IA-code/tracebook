# Scrollytelling del cubo en la portada

## Objetivo
Convertir los archivos aportados en una escena visual fija de la portada: el cubo aparece a la derecha, quieto y al 30% de opacidad al cargar; al desplazarse, el video avanza o retrocede siguiendo el scroll para mostrar el giro y acercamiento.

## Implementación
- Subir la imagen y el video al almacenamiento de recursos del proyecto, sin mantener archivos pesados en el código.
- Crear una capa visual fija y no interactiva, limitada a la portada pública, detrás del contenido.
- Mostrar primero la imagen estática y cambiar al video cuando esté listo, manteniendo el fotograma inicial sin reproducción automática.
- Sincronizar el tiempo del video con el progreso de desplazamiento de la portada, en ambos sentidos y sin controles visibles.
- Aplicar 30% de opacidad al cubo y ubicarlo a la derecha sin tapar textos ni botones.
- En pantallas pequeñas o con movimiento reducido, conservar la imagen estática para evitar una experiencia incómoda o pesada.
- Comprobar carga, desplazamiento, legibilidad y comportamiento en escritorio y móvil.

## Alcance
Solo cambia la portada pública. No modifica el espacio de trabajo, los datos, la autenticación ni los instaladores de escritorio.
