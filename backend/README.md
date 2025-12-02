# Sistema Coopeenortol - Backend

Sistema de gestión para cooperativa Coopeenortol desarrollado con FastAPI, SQLAlchemy y PostgreSQL/SQLite.

## 📊 Estado del Proyecto

**Última actualización:** 2 de diciembre, 2025

### Tests y Cobertura
- **Tests totales:** 53/53 (100% ✅)
- **Cobertura de código:** 73%
- **Commits sincronizados:** 8

### Módulos Implementados

#### ✅ Autenticación y Autorización
- Login con JWT tokens
- Roles: Admin, Auditor, Analista
- Control de permisos por endpoint
- Cambio de contraseña
- Tests: 7/7 passing

#### ✅ Gestión de Asociados
- CRUD completo de asociados
- Información personal, laboral, académica, financiera
- Paginación y filtros
- Soft delete (estado inactivo)
- Validación de campos
- Tests: 5/5 passing

#### ✅ Sistema de Auditoría
- Registro automático de todas las operaciones
- Tracking de login, CRUD de usuarios
- Filtros por usuario, acción, fecha
- Solo accesible para Admin y Auditor
- Tests: 9/9 passing

#### ✅ Validadores Personalizados
- Documentos (CC, NIT, CE)
- Teléfonos (celular y fijo colombianos)
- Emails con validación extendida
- Nombres y direcciones
- Valores numéricos y salarios
- Tests: 22/22 passing

## 🚀 Inicio Rápido

### Instalación

\`\`\`bash
# Activar entorno virtual
source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt

# Aplicar migraciones
alembic upgrade head

# Crear usuario admin
python create_admin_simple.py

# Iniciar servidor
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
\`\`\`

## 📚 API Endpoints

### Autenticación
- POST /api/v1/auth/login
- GET /api/v1/auth/me
- POST /api/v1/auth/cambiar-password

### Asociados
- POST /api/v1/asociados/
- GET /api/v1/asociados/
- GET /api/v1/asociados/{id}
- PUT /api/v1/asociados/{id}
- DELETE /api/v1/asociados/{id}

### Auditoría
- GET /api/v1/auditoria/
- GET /api/v1/auditoria/{id}

## 🧪 Tests

\`\`\`bash
pytest -v              # Todos los tests
pytest --cov=app       # Con cobertura
\`\`\`

**Desarrollado con ❤️ para Coopeenortol**
