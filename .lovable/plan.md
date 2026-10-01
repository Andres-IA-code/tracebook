# Optimizar el inicio de Vértice Desktop

## Objetivo
Reducir el tiempo percibido y real de apertura de la aplicación descargable, sin cambiar sus funciones ni los datos guardados.

## Cambios
- Simplificar el arranque de la versión de escritorio y evitar trabajo duplicado durante la primera carga.
- Ajustar Electron para omitir servicios de Chromium que no necesita una aplicación local.
- Mostrar la ventana de forma controlada cuando la interfaz esté lista, manteniendo el color de fondo de Vértice para evitar una pantalla blanca.
- Regenerar los paquetes de Windows, macOS y Linux como versiones nuevas, conservando los anteriores.

## Validación
- Medir el tiempo desde el inicio del proceso hasta que la ventana queda lista.
- Comprobar que la aplicación abre, carga el espacio de trabajo local y no presenta errores.
- Verificar la integridad de los tres archivos comprimidos antes de entregarlos.

## Nota
El primer inicio en Windows puede seguir tardando algo más por el análisis de seguridad de una aplicación sin firma digital; la optimización reducirá el trabajo propio de Vértice, pero no puede omitir ese control del sistema.
