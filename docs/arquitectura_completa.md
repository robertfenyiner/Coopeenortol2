# Arquitectura completa del proyecto Coopeenortol

## Visión técnica general

Robert lidera el desarrollo de una plataforma web integral para Coopeenortol que constará de los siguientes componentes principales:

### Tecnologías seleccionadas

- **Backend**: FastAPI + Python 3.11
- **Base de datos**: PostgreSQL (producción) / SQLite (desarrollo)
- **Frontend**: React + TypeScript + Vite
- **Servidor web**: Nginx
- **Contenedores**: Docker + Docker Compose
- **VPS**: Ubuntu 22.04 con 100GB expandible

### Estructura de módulos del sistema

```
Coopeenortol2/
├── backend/                    # API y lógica de negocio
│   ├── app/
│   │   ├── api/v1/endpoints/  # Endpoints por módulo
│   │   │   ├── asociados.py
│   │   │   ├── creditos.py
│   │   │   ├── ahorros.py
│   │   │   ├── certificados.py
│   │   │   ├── cultura.py
│   │   │   └── auth.py
│   │   ├── core/              # Configuración y utilidades
│   │   ├── models/            # Modelos de base de datos
│   │   │   ├── asociado.py
│   │   │   ├── credito.py
│   │   │   ├── ahorro.py
│   │   │   ├── movimiento.py
│   │   │   ├── actividad.py
│   │   │   └── usuario.py
│   │   ├── schemas/           # Schemas de Pydantic
│   │   ├── services/          # Lógica de negocio
│   │   └── utils/             # Utilidades (PDF, email, etc)
│   ├── tests/                 # Pruebas automatizadas
│   └── migrations/            # Migraciones de BD
├── frontend/                   # Aplicación web cliente
│   ├── src/
│   │   ├── components/        # Componentes reutilizables
│   │   ├── pages/             # Páginas principales
│   │   │   ├── admin/         # Panel administrativo
│   │   │   ├── asociado/      # Portal del asociado
│   │   │   └── auth/          # Autenticación
│   │   ├── services/          # Servicios de API
│   │   ├── hooks/             # Custom hooks
│   │   └── utils/             # Utilidades del frontend
│   ├── public/
│   └── dist/
├── infra/                      # Configuración de infraestructura
│   ├── docker/
│   ├── nginx/
│   ├── scripts/
│   └── ansible/               # Automatización del deployment
├── docs/                       # Documentación técnica
└── data/                       # Datos de desarrollo y backups
```

## Módulos funcionales

### 1. Gestión de Personal (Fase 1) ✅ En desarrollo
- Registro completo de asociados
- Expediente digital con secciones
- Gestión de documentos y hojas de vida
- Reportes administrativos

### 2. Sistema Financiero (Fase 2)
- **Créditos**: Múltiples líneas de crédito con tasas diferenciadas
- **Ahorros**: Obligatorios y voluntarios
- **Estados de cuenta**: Generación automática
- **Certificados**: Paz y salvo, extractos, certificaciones

### 3. Portal del Asociado (Fase 3)
- Autenticación segura
- Consulta de estados de cuenta
- Solicitud de créditos online
- Descarga de certificados
- Agenda de actividades

### 4. Cultura y Recreación (Fase 4)
- Gestión de eventos y actividades
- Inscripciones online
- Convenios y alianzas
- Seguimiento de participación

### 5. Analytics y Automatización (Fase 5)
- Dashboards ejecutivos
- Indicadores de cartera
- Automatización de procesos
- Integraciones externas

## Consideraciones de seguridad

- Autenticación JWT para usuarios
- Cifrado de datos sensibles
- Auditoría de cambios
- Copias de seguridad automáticas
- Cumplimiento de Ley 1581 (protección de datos Colombia)

## Plan de deployment

1. **Desarrollo**: Local con Docker Compose
2. **Testing**: Staging en VPS con base de datos de prueba
3. **Producción**: VPS Ubuntu 22.04 con PostgreSQL y Nginx

## Próximos pasos inmediatos

1. Completar el módulo de asociados (Fase 1)
2. Crear estructura del frontend
3. Configurar Docker y scripts de deployment
4. Implementar sistema de autenticación
5. Preparar migraciones de datos existentes