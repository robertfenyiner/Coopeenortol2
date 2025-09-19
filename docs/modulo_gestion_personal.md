# Módulo de gestión de personal

## Alcance

El módulo inicial permitirá que el equipo administrativo gestione la información integral de cada asociado. Robert estableció como prioridades:

- Registrar datos personales, laborales, familiares y financieros.
- Consultar hojas de vida y soportes asociados (gestión de metadatos, integración futura con un gestor documental).
- Llevar historial de actualizaciones y cambios relevantes.
- Emitir reportes de asociados activos, novedades y retiros.

## Modelo de datos

| Entidad | Descripción | Campos clave |
| --- | --- | --- |
| `asociados` | Datos maestros del asociado | tipo_documento, numero_documento, nombres, apellidos, estado |
| `expediente` | Información agrupada en secciones (personal, laboral, familiar, financiera) | asociado_id, sección, contenido JSON |
| `historial_cambios` (futuro) | Bitácora de modificaciones | asociado_id, usuario, cambio, fecha |
| `documentos` (futuro) | Referencias a archivos externos | asociado_id, tipo_documento, url, fecha_carga |

## Flujo de procesos

1. Ingreso del asociado: captura de datos básicos y asignación de estado inicial.
2. Completar expediente con secciones personal, laboral, familiar y financiera.
3. Adjuntar hoja de vida y soportes (en esta fase solo se registrará el enlace o referencia).
4. Validar información por parte del equipo de gestión humana.
5. Actualizar datos cuando ocurran novedades (cambios contractuales, familiares o financieros).

## Historias de usuario iniciales

1. **Crear asociado**: como analista de talento humano deseo crear un expediente digital para un asociado con todos sus datos personales y laborales.
2. **Consultar asociado**: como analista deseo buscar un asociado por documento y visualizar su información consolidada.
3. **Actualizar asociado**: como analista deseo modificar los datos de un asociado cuando reciba nueva información.
4. **Listar asociados**: como analista deseo listar los asociados activos filtrando por estado o dependencia.
5. **Eliminar asociado**: como analista deseo inactivar o eliminar registros en caso de retiro o corrección.

## Reglas y validaciones

- Número de documento único por asociado.
- Correo electrónico válido y teléfonos de contacto principales obligatorios.
- Salario y cifras financieras deben registrarse en pesos colombianos (COP).
- Las fechas deben respetar el formato ISO `YYYY-MM-DD`.
- Solo usuarios autenticados podrán acceder al módulo (seguridad a implementar en una iteración próxima).

## Integraciones futuras

- Sincronización con nómina para actualización de datos contractuales.
- Integración con un gestor documental para almacenar archivos en la nube.
- Registro de cambios con auditoría detallada.

## Entregables de la fase

- API funcional con pruebas automáticas del módulo de asociados.
- Documentación técnica y manual operativo para el equipo administrativo.
- Plan de migración de datos desde fuentes actuales (hojas de cálculo, formularios físicos).
