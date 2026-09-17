# Control del Personal · STANDECOR

Para actualizar la aplicación solo hay que sustituir **index.html**. El diseño, la gestión de usuarios y la conexión a Firebase están integrados en ese archivo. Requiere Internet para cargar el SDK de Firebase y sincronizar datos.

Los datos están en el proyecto Firebase `control-del-personal-dcc90`, base `(default)`, documento `personal/shared`: `workers` contiene trabajadores; `records`, incidencias y fines de semana; `meta/state`, la revisión de sincronización. Los perfiles de acceso están en `appUsers`; las contraseñas se gestionan en Firebase Authentication.

Los cambios se reciben automáticamente mientras hay conexión. Se conservan los borradores; durante la edición de una ficha se aplaza la actualización hasta cerrarla. Las transacciones impiden sobrescribir silenciosamente cambios de otro dispositivo. Límite actual: 450 documentos modificados por operación.

La copia `firestore.rules` documenta las reglas publicadas en Firebase. No es un archivo que cargue la página y no hay que subirlo para modificar el diseño. Nunca añadir contraseñas, claves de servicio ni copias de datos personales al repositorio.

Todos los derechos a IsraelM.
