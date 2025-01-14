# CineMax: Sistema de Gestión y Reservas de Cine

## Descripción

CineMax es un sistema integral de gestión y reservas para cines, desarrollado con PHP, JavaScript, HTML5 y CSS3. Este sistema ofrece una experiencia fluida para reservar asientos para películas, gestionar películas, horarios y validar tickets.

## Características Principales

- Reserva interactiva de asientos con interfaz visual intuitiva
- Gestión dinámica de películas (añadir, eliminar, actualizar)
- Historial detallado de reservas
- Sistema de validación de tickets mediante ID
- Diseño responsivo para dispositivos móviles y de escritorio
- Generación automática de tickets con códigos QR
- Panel de control administrativo centralizado

## Tecnologías Utilizadas

- Frontend: HTML5, CSS3, JavaScript (ES6+)
- Backend: PHP 7.4+
- Base de Datos: MySQL 5.7+
- Servidor Web: Apache (recomendado)
- QRCode.js para códigos QR

## Requisitos del Sistema

- PHP 7.4 o superior
- MySQL 5.7 o superior
- Servidor web Apache (u otro compatible con PHP)
- Navegador web moderno con JavaScript habilitado

## Instalación y Configuración

1. Clonar el repositorio: git clone https://github.com/Greiddy/cinemax-proyecto-universidad.git

2. Configurar la base de datos:

- Crear una nueva base de datos MySQL llamada cinema_db
- Importa el archivo SQL llamado `database.sql`

3. Configurar la conexión a la base de datos:

- Editar `src/db_connect.php`:
  ```php
  $host = 'localhost';
  $db   = 'tu_base_de_datos';
  $user = 'tu_usuario';
  $pass = 'tu_contraseña';
  ```

4. Configurar el servidor web:
- Asegurar permisos de lectura/escritura en los directorios del proyecto
- Configurar el documento raíz al directorio `public/`

## Uso del Sistema

1. Reservar Asientos:
- Seleccionar película en la página principal
- Elegir asientos en el mapa interactivo
- Confirmar reserva y obtener ticket con código QR

2. Consultar Historial:
- Acceder a "Historial de Reservas" para ver reservas anteriores

3. Gestionar Películas:
- Usar "Añadir/Eliminar Película" para actualizar el catálogo
- Completar formulario para nuevas películas
- Usar botón "Eliminar" para remover películas existentes

4. Administrar Horarios:
- En "Horarios", visualizar y editar funciones
- Clic en celdas para modificar fechas u horas

5. Validar Tickets:
- En "Validar Ticket", ingresar ID 
- Verificar información y estado del ticket

## Seguridad

- Uso de consultas preparadas para interacciones con la base de datos
- Manejo seguro de errores
- HTTPS para todas las comunicaciones (requiere configuración del servidor)

## Manejo de Errores

- Captura y registro de errores de base de datos y sistema
- Mensajes de error amigables para el usuario
- Sistema de notificación para errores críticos

## Desarrollo Futuro

- Sistema de autenticación de usuarios
- Integración con pasarelas de pago
- Sistema de reseñas y calificaciones de películas
- Recomendaciones personalizadas basadas en historial
- Aplicación móvil nativa
