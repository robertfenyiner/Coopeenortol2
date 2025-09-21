# Módulo de Asociados Mejorado - Cooperativa de Ahorro y Crédito

## Resumen de Mejoras Implementadas

Se ha expandido significativamente el módulo de asociados para incluir toda la información necesaria para una cooperativa de ahorro y crédito, incluyendo funcionalidad de subida de fotos.

## Nuevas Funcionalidades

### 1. Información Personal Detallada
- **Datos básicos**: Tipo y número de documento, nombres, apellidos, correo, teléfono
- **Información personal**: Fecha y lugar de nacimiento, dirección completa, barrio, ciudad, departamento
- **Datos médicos**: Grupo sanguíneo, EPS, ARL
- **Estado civil y género**: Información demográfica completa
- **Personas a cargo**: Número de hijos y personas dependientes

### 2. Información Académica
- **Nivel educativo**: Desde primaria hasta doctorado
- **Institución y título**: Información de graduación
- **Estudios actuales**: Programa en curso, institución, semestre
- **Certificaciones**: Lista de certificaciones profesionales

### 3. Información Laboral Expandida
- **Datos básicos**: Institución educativa, cargo, área de trabajo
- **Contrato**: Tipo de contrato, fecha de vinculación
- **Remuneración**: Salario básico y bonificaciones
- **Supervisión**: Jefe inmediato, contacto y email
- **Ubicación**: Sede de trabajo, horario laboral
- **Experiencia**: Historial laboral detallado

### 4. Información Familiar
- **Familiares**: Lista de familiares con parentesco, ocupación, dependencia económica
- **Contactos de emergencia**: Nombres, teléfonos, direcciones
- **Personas autorizadas**: Para recogida de hijos y otras autorizaciones

### 5. Información Financiera Completa
- **Ingresos**: Mensuales, adicionales, familiares
- **Egresos**: Gastos personales y familiares
- **Obligaciones**: Lista de deudas con entidades, cuotas, saldos
- **Referencias comerciales**: Historial crediticio
- **Activos**: Inmuebles, vehículos, inversiones

### 6. Información de Vivienda
- **Tipo de vivienda**: Casa, apartamento, finca, otro
- **Tenencia**: Propia, arrendada, familiar
- **Valor del arriendo**: Si aplica
- **Tiempo de residencia**: Estabilidad residencial
- **Servicios públicos**: Lista de servicios disponibles
- **Estrato socioeconómico**: Clasificación por estrato

### 7. Funcionalidad de Fotos
- **Subida de fotos**: Soporte para archivos JPG, PNG, JPEG
- **Validación**: Máximo 5MB por archivo
- **Almacenamiento**: Directorio `backend/uploads/fotos/`
- **URLs**: Acceso directo a las fotos via endpoint `/uploads/fotos/`
- **Preview**: Vista previa de la foto en el formulario

## Estructura del Backend

### Modelo de Base de Datos
```python
class Asociado(Base):
    # Campos existentes...
    foto_url = Column(String(500), nullable=True)
    informacion_academica = Column(MutableDict.as_mutable(JSONEncodedDict), default=dict)
    informacion_vivienda = Column(MutableDict.as_mutable(JSONEncodedDict), default=dict)
```

### Esquemas Pydantic
- **DatosPersonales**: Expandido con información médica y demográfica
- **InformacionAcademica**: Nueva clase para datos educativos
- **InformacionVivienda**: Nueva clase para datos de vivienda
- **InformacionFinanciera**: Expandido con activos y referencias
- **InformacionFamiliar**: Reorganizado para mejor estructura

### Endpoints API
- **POST `/asociados/{id}/foto`**: Subir foto del asociado
- **Servicio de archivos estáticos**: `/uploads/` para servir fotos

## Estructura del Frontend

### Componentes
- **AsociadoFormExpanded**: Formulario multi-paso con 8 secciones
- **AsociadosModuleEnhanced**: Módulo principal con gestión completa
- **AsociadoService**: Servicio para comunicación con API

### Formulario Multi-paso
1. **Datos Básicos**: Información de identificación
2. **Información Personal**: Datos personales y de contacto
3. **Información Académica**: Educación y certificaciones
4. **Información Laboral**: Experiencia y datos laborales
5. **Información Familiar**: Familiares y contactos de emergencia
6. **Información Financiera**: Ingresos, egresos y patrimonio
7. **Información de Vivienda**: Datos de la vivienda
8. **Foto y Revisión**: Subida de foto y resumen final

## Validaciones Implementadas

### Backend
- **Documento único**: Validación de número de documento
- **Email único**: Validación de correo electrónico
- **Tipos de archivo**: Solo imágenes (JPG, PNG, JPEG)
- **Tamaño de archivo**: Máximo 5MB
- **Campos requeridos**: Validación de campos obligatorios

### Frontend
- **Validación por pasos**: Cada paso valida campos requeridos
- **Preview de imagen**: Validación visual antes de subir
- **Formularios dinámicos**: Agregar/eliminar elementos en listas
- **Navegación inteligente**: Solo permite avanzar si el paso es válido

## Configuración Necesaria

### Backend
1. **Directorio de fotos**: `backend/uploads/fotos/` debe existir
2. **Servidor de archivos**: Configurado en `main.py` para servir `/uploads/`
3. **Migración de BD**: Ejecutar para agregar nuevos campos

### Frontend
1. **Servicio configurado**: `asociadoService.ts` con endpoints correctos
2. **Componentes importados**: Usar `AsociadosModuleEnhanced` en la aplicación
3. **Estilos**: Tailwind CSS para diseño responsivo

## Uso del Sistema

### Crear Nuevo Asociado
1. Hacer clic en "Nuevo Asociado"
2. Completar formulario paso a paso
3. Subir foto en el paso final
4. Revisar información y guardar

### Editar Asociado Existente
1. Hacer clic en "Editar" en la tabla
2. Modificar información en los pasos correspondientes
3. Cambiar foto si es necesario
4. Guardar cambios

### Gestión de Fotos
- **Subir**: Seleccionar archivo de imagen
- **Preview**: Ver imagen antes de guardar
- **Cambiar**: Reemplazar foto existente
- **Eliminar**: Quitar foto del asociado

## Beneficios para la Cooperativa

1. **Información completa**: Todos los datos necesarios para evaluación crediticia
2. **Identificación visual**: Fotos para mejor identificación
3. **Trazabilidad**: Historial completo de cada asociado
4. **Evaluación de riesgo**: Información financiera detallada
5. **Gestión familiar**: Contactos de emergencia y familiares
6. **Estabilidad**: Información de vivienda y trabajo
7. **Experiencia**: Historial académico y laboral

## Próximos Pasos Recomendados

1. **Módulo de créditos**: Integrar con evaluación crediticia
2. **Reportes**: Generar informes de asociados
3. **Búsqueda avanzada**: Filtros por múltiples criterios
4. **Exportación**: Exportar datos a Excel/PDF
5. **Notificaciones**: Alertas por vencimientos
6. **Dashboard**: Estadísticas y métricas
7. **Auditoría**: Log de cambios en información
