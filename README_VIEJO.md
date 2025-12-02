# 🏢 Coopeenortol - Sistema de Gestión Cooperativa

Sistema integral para la **Cooperativa de Empleados del Norte del Tolima (Coopeenortol)**, diseñado para gestionar más de 1,000 asociados del sector educativo.

## 📋 Características Principales

- ✅ **Gestión de Asociados**: Control completo de información personal, laboral, familiar y financiera
- ✅ **Módulo Contable**: Gestión de aportes, estados de cuenta y reportes financieros (en desarrollo)
- ✅ **Módulo de Créditos**: Sistema de solicitudes, evaluación y amortización (en desarrollo)
- ✅ **Autenticación y Permisos**: Sistema robusto basado en roles (Admin, Analista, Auditor)
- ✅ **API REST**: Backend con FastAPI y documentación automática
- ✅ **Frontend Moderno**: Aplicación web con React + TypeScript + Tailwind CSS
- ✅ **Migraciones de BD**: Gestión de esquema con Alembic
- ✅ **Pruebas Automatizadas**: Suite de tests con pytest

## 🚀 Inicio Rápido

### Prerrequisitos

- Python 3.10+
- Node.js 18+
- Git

### Instalación Local

#### 1. Clonar y configurar backend

```bash
git clone https://github.com/robertfenyiner/Coopeenortol.git
cd Coopeenortol/backend

# Crear entorno virtual
python3 -m venv venv
source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt

# Configurar .env
cp .env.example .env

# Ejecutar migraciones
alembic upgrade head

# Crear usuario admin
python create_admin_simple.py

# Iniciar servidor
uvicorn app.main:app --reload
```

**Backend:** `http://localhost:8000`  
**Docs:** `http://localhost:8000/docs`

#### 2. Configurar frontend

```bash
cd frontend
npm install
npm run dev
```

**Frontend:** `http://localhost:3000`

## 🔐 Usuario por Defecto

- **Usuario:** `admin`
- **Contraseña:** `admin123`

## 📚 Documentación API

Ver documentación interactiva en `/docs` cuando el servidor esté corriendo.

### Roles y Permisos

| Rol | Permisos |
|-----|----------|
| **Admin** | CRUD completo en todos los módulos |
| **Analista** | Crear, leer y actualizar asociados |
| **Auditor** | Solo lectura y reportes |

## 🧪 Pruebas

```bash
cd backend
pytest
pytest --cov=app
```

## 🗄️ Migraciones

```bash
# Crear migración
alembic revision --autogenerate -m "Descripción"

# Aplicar migraciones
alembic upgrade head
```

## 📦 Estructura

```
Coopeenortol/
├── backend/          # FastAPI + SQLAlchemy
│   ├── alembic/      # Migraciones
│   ├── app/          # Código fuente
│   └── tests/        # Pruebas
├── frontend/         # React + TypeScript
│   └── src/          # Componentes
└── docs/             # Documentación
```

## 📈 Roadmap

- [x] Fase 1: Gestión de Personal (90%)
- [ ] Fase 2: Módulo Contable (0%)
- [ ] Fase 3: Módulo de Créditos (0%)
- [ ] Fase 4: Portal del Asociado (0%)

## 📄 Licencia

Uso interno Coopeenortol. Todos los derechos reservados.

**Versión**: 0.2.0 | **Última actualización**: Diciembre 2025
