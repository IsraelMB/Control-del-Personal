# Control del Personal · STANDECOR

Aplicación web para registrar incidencias de personal, fines de semana y festivos. Datos compartidos en el proyecto Firebase independiente `control-del-personal-dcc90`.

## Acceso

Usuario y contraseña con Firebase Authentication. No necesita una cuenta de Google. IsraelM es el administrador principal; las cuentas autorizadas están en `appUsers`.

- Administrador: registros y gestión de usuarios.
- Registro: consultar y modificar registros y trabajadores.
- Solo consulta: consultar y exportar, sin modificar datos.

La desactivación se comprueba en las reglas de Firestore. El administrador principal no puede desactivarse desde el panel. Cada usuario puede cambiar su propia contraseña; no se muestran contraseñas en el panel. La recuperación de contraseñas olvidadas requiere intervención del propietario del proyecto Firebase.

## Publicación

Los cinco archivos de `public` se publican juntos en la raíz de GitHub Pages: `index.html`, `cloud.js`, `accounts-ui.js`, `accounts.css` y `firebase-config.json`. El archivo de configuración contiene identificadores públicos del SDK; nunca añadir claves de servicio, credenciales de CLI, enlaces de recuperación o copias del historial al repositorio.

Las reglas en `firestore.rules` se publican por separado en Firebase. Todos los usuarios autorizados comparten `personal/shared`. El guardado usa transacciones con revisión y rechaza sobrescrituras desde una pantalla desactualizada; pulsar Actualizar antes de reintentar. Requiere conexión. Una operación admite hasta 450 documentos modificados; importar o borrar conjuntos mayores requiere una migración por lotes.

## Verificación

Pruebas locales de guardado, recuperación de borradores y cierre de sesión. Pruebas contra Firebase real de acceso con contraseña, lectura compartida, bloqueo de escrituras de consulta, bloqueo de usuarios sin perfil, protección del administrador principal y desactivación de acceso. Los datos sintéticos de prueba se eliminaron al terminar.

Todos los derechos a IsraelM.
