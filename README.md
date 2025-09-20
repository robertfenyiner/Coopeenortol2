# Plataforma Coopeenortol

Solución integral para la Cooperativa de Empleados del Norte del Tolima (Coopeenortol), orientada a la gestión de asociados del sector educativo. Este repositorio consolida el desarrollo de una plataforma web modular para administrar procesos de talento humano, portafolio de servicios financieros, cultura y recreación.

## Propósito

- Digitalizar los procesos de atención y acompañamiento a más de 1000 asociados.
- Facilitar la gestión de créditos, ahorros, certificados y documentos institucionales.
- Consolidar información confiable para la toma de decisiones estratégicas.
- Fortalecer las iniciativas culturales y de bienestar social promovidas por la cooperativa.

Robert lidera la dirección general del proyecto y coordina los entregables por etapas.

## Arquitectura propuesta

La plataforma seguirá una arquitectura modular conformada por:

- **Backend**: API desarrollada con FastAPI, conectada a una base de datos relacional. Gestiona la lógica de negocio y expone servicios REST.
- **Frontend**: Aplicación web SPA (en construcción) que consumirá los servicios del backend.
- **Base de datos**: PostgreSQL en producción, con SQLite para entornos locales de desarrollo y pruebas.
- **Automatización**: Pruebas automatizadas, tareas de despliegue continuo y herramientas de control de calidad.

## Estructura del repositorio

```
├── backend/           # Código fuente del API y pruebas automatizadas
├── frontend/          # Aplicación web React con TypeScript
├── infra/             # Scripts de infraestructura y despliegue
│   ├── scripts/       # Scripts automatizados (setup-vps.sh, deploy.sh, check-ports.sh)
│   ├── docker/        # Configuraciones Docker adicionales
│   └── nginx/         # Configuraciones de proxy reverso
├── docs/              # Documentación funcional y técnica
├── backend/data/      # Archivos de datos locales (excluye bases reales)
└── README.md          # Resumen general del proyecto
```

## 🚀 Instalación Rápida en VPS

Para desplegar en un VPS Ubuntu 22.04:

```bash
# Instalación automatizada en una línea
curl -fsSL https://raw.githubusercontent.com/robertfenyiner/Coopeenortol2/main/infra/scripts/setup-vps.sh | bash

# Después del reinicio de sesión
cd /opt/coopeenortol
./infra/scripts/deploy.sh
docker compose exec backend python create_admin_simple.py
```

**Características del despliegue:**
- ✅ Resolución automática de conflictos de puertos
- ✅ Configuración completa de Docker y dependencias
- ✅ Scripts de verificación y diagnóstico
- ✅ Backups automáticos configurados
- ✅ Logs rotativos y monitoreo básico

Ver [documentación completa de instalación](docs/instalacion_vps.md) para más detalles.

## Primeros pasos

1. Crear un entorno virtual de Python 3.11.
2. Instalar dependencias ejecutando `pip install -r backend/requirements.txt`.
3. Configurar variables en `backend/.env` (puede basarse en `backend/.env.example`).
4. Ejecutar la API con `uvicorn app.main:app --reload` desde la carpeta `backend`.

El archivo [docs/roadmap.md](docs/roadmap.md) describe el plan de trabajo por fases, mientras que [docs/modulo_gestion_personal.md](docs/modulo_gestion_personal.md) profundiza en el módulo inicial de talento humano.

## Próximos hitos

- Completar la fase 1 con el módulo de gestión de personal y la captura integral de información del asociado.
- Definir el diseño del frontend y la experiencia de usuario.
- Preparar infraestructura y scripts de despliegue para la VPS Ubuntu 22.04.

## Licencia

Uso interno para Coopeenortol. Todos los derechos reservados.
