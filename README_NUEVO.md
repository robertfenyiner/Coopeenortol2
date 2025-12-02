# 🏢 Coopeenortol - Sistema de Gestión Cooperativa

Sistema integral para la **Cooperativa de Empleados del Norte del Tolima (Coopeenortol)**, diseñado para gestionar más de 1,000 asociados del sector educativo.

[![Tests](https://img.shields.io/badge/tests-70%2F70_passing-success)](backend/tests/)
[![Coverage](https://img.shields.io/badge/coverage-77%25-brightgreen)](backend/htmlcov/)
[![Python](https://img.shields.io/badge/python-3.10+-blue)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110.0-009688)](https://fastapi.tiangolo.com/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

---

## 📋 Módulos Implementados

### ✅ **Módulos Completados (100%)**

| Módulo | Estado | Tests | Coverage | Descripción |
|--------|--------|-------|----------|-------------|
| 🔐 **Autenticación** | ✅ Completo | 7/7 | 74% | JWT, roles (Admin/Analista/Auditor), permisos granulares |
| 👥 **Asociados** | ✅ Completo | 41/41 | 73% | CRUD completo, datos personales/laborales/familiares/financieros |
| 📊 **Auditoría** | ✅ Completo | 9/9 | 95% | Registro de todas las operaciones (login, CRUD, accesos) |
| ✓ **Validadores** | ✅ Completo | 18/18 | 90% | Validación colombiana (CC, NIT, teléfonos, emails, salarios) |
| 📄 **Documentos** | ✅ Completo | 12/12 | 97% | Gestión de archivos (subida, validación, descarga, aprobación) |

### 🚧 **En Desarrollo**

| Módulo | Prioridad | Estado |
|--------|-----------|--------|
| 💰 **Contabilidad** | Alta | Pendiente |
| 💳 **Créditos** | Alta | Pendiente |
| 📈 **Reportes** | Media | Pendiente |
| 🔔 **Notificaciones** | Media | Pendiente |

---

## 🎯 Características Destacadas

### **Gestión de Asociados**
- ✅ CRUD completo con validaciones colombianas
- ✅ Información estructurada: personal, laboral, familiar, financiera, académica, vivienda
- ✅ Búsqueda y filtrado avanzado
- ✅ Estadísticas en tiempo real
- ✅ Soft delete con historial completo

### **Sistema de Documentos**
- ✅ Subida de archivos (PDF, JPG, PNG, DOC, DOCX) hasta 10 MB
- ✅ 10 tipos de documentos: cédula, comprobantes, certificados, etc.
- ✅ Sistema de validación/aprobación por usuarios autorizados
- ✅ Descarga segura con registro de accesos
- ✅ Estadísticas por asociado
- ✅ Almacenamiento organizado por categorías

### **Autenticación y Seguridad**
- ✅ JWT con expiración configurable
- ✅ 3 roles predefinidos con permisos granulares
- ✅ Middleware de autenticación en todos los endpoints
- ✅ Registro de login exitosos y fallidos
- ✅ Cambio de contraseña con validación

### **Sistema de Auditoría**
- ✅ Registro automático de todas las operaciones
- ✅ 7 tipos de acciones: LOGIN, CREAR, ACTUALIZAR, ELIMINAR, ACCESO, CAMBIO_PASSWORD, ERROR
- ✅ Almacena: usuario, fecha/hora, IP, acción, entidad, datos anteriores/nuevos
- ✅ Filtrado por usuario, acción, entidad, fechas
- ✅ Endpoints protegidos por permisos

### **Validaciones Colombianas**
- ✅ Cédula de Ciudadanía (6-10 dígitos)
- ✅ NIT (9-10 dígitos con DV)
- ✅ Teléfonos móviles (10 dígitos, inicia con 3)
- ✅ Teléfonos fijos (7-10 dígitos)
- ✅ Emails con validación extendida
- ✅ Salarios (>= $1,300,000 COP salario mínimo 2024)
- ✅ Nombres y direcciones (sin caracteres especiales)

---

## 🚀 Inicio Rápido

### **Prerrequisitos**
- Python 3.10+
- Git
- (Opcional) Node.js 18+ para frontend

### **Instalación Backend**

```bash
# 1. Clonar repositorio
git clone https://github.com/robertfenyiner/Coopeenortol2.git
cd Coopeenortol2/backend

# 2. Crear entorno virtual
python3 -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate

# 3. Instalar dependencias
pip install -r requirements.txt

# 4. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus configuraciones

# 5. Ejecutar migraciones
alembic upgrade head

# 6. Crear usuario administrador
python create_admin_simple.py

# 7. Iniciar servidor
uvicorn app.main:app --reload
```

**🌐 URLs:**
- Backend API: http://localhost:8000
- Documentación interactiva: http://localhost:8000/docs
- Redoc: http://localhost:8000/redoc

### **Script de Inicio Rápido**

```bash
# Usar el script automatizado
./dev-start.sh
```

---

## 🧪 Tests

```bash
# Ejecutar todos los tests
pytest

# Con coverage
pytest --cov=app --cov-report=html

# Tests específicos
pytest tests/test_documentos.py -v

# Solo tests rápidos
pytest -m "not slow"
```

**Resultados Actuales:**
- ✅ **70/70 tests pasando**
- ✅ **77% coverage general**
- ✅ **0 tests fallidos**

---

## 📡 API Endpoints

### **Autenticación** (`/api/v1/auth/`)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/login` | Login con OAuth2 |
| POST | `/login-simple` | Login con JSON |
| GET | `/me` | Información del usuario actual |
| GET | `/me/permisos` | Permisos del usuario actual |
| POST | `/cambiar-password` | Cambiar contraseña |
| POST | `/crear-usuario` | Crear usuario (admin) |
| GET | `/usuarios` | Listar usuarios (admin) |

### **Asociados** (`/api/v1/asociados/`)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/` | Listar con filtros y paginación |
| POST | `/` | Crear nuevo asociado |
| GET | `/{id}` | Obtener por ID |
| PUT | `/{id}` | Actualizar |
| DELETE | `/{id}` | Eliminar (soft) |
| GET | `/estadisticas` | Estadísticas generales |
| GET | `/buscar` | Búsqueda avanzada |

### **Documentos** (`/api/v1/documentos/`)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/subir` | Subir documento |
| GET | `/` | Listar con filtros |
| GET | `/{id}` | Obtener metadatos |
| GET | `/{id}/descargar` | Descargar archivo |
| PUT | `/{id}` | Actualizar metadatos |
| POST | `/{id}/validar` | Validar/aprobar |
| DELETE | `/{id}` | Eliminar (soft) |
| GET | `/asociado/{id}/estadisticas` | Estadísticas |

### **Auditoría** (`/api/v1/auditoria/`)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/` | Listar registros (filtrable) |
| GET | `/{id}` | Obtener registro específico |

---

## 🔐 Roles y Permisos

| Permiso | Admin | Analista | Auditor |
|---------|-------|----------|---------|
| **Asociados:** |
| - crear | ✅ | ✅ | ❌ |
| - leer | ✅ | ✅ | ✅ |
| - actualizar | ✅ | ✅ | ❌ |
| - eliminar | ✅ | ❌ | ❌ |
| **Documentos:** |
| - crear | ✅ | ✅ | ❌ |
| - leer | ✅ | ✅ | ✅ |
| - actualizar | ✅ | ✅ | ❌ |
| - eliminar | ✅ | ❌ | ❌ |
| - validar | ✅ | ❌ | ❌ |
| **Usuarios:** |
| - gestionar | ✅ | ❌ | ❌ |
| **Reportes:** |
| - generar | ✅ | ✅ | ✅ |
| **Auditoría:** |
| - leer | ✅ | ❌ | ✅ |

---

## 📁 Estructura del Proyecto

```
Coopeenortol/
├── backend/
│   ├── alembic/              # Migraciones de BD
│   │   └── versions/         # Archivos de migración
│   ├── app/
│   │   ├── api/
│   │   │   └── v1/
│   │   │       ├── endpoints/    # Endpoints REST
│   │   │       │   ├── auth.py
│   │   │       │   ├── asociados.py
│   │   │       │   ├── documentos.py
│   │   │       │   └── auditoria.py
│   │   │       └── api.py        # Router principal
│   │   ├── core/
│   │   │   ├── config.py         # Configuración
│   │   │   ├── security.py       # JWT y hashing
│   │   │   ├── deps.py           # Dependencias
│   │   │   ├── validators.py     # Validaciones colombianas
│   │   │   └── file_storage.py   # Gestión de archivos
│   │   ├── models/               # Modelos SQLAlchemy
│   │   │   ├── asociado.py
│   │   │   ├── usuario.py
│   │   │   ├── documento.py
│   │   │   └── auditoria.py
│   │   ├── schemas/              # Schemas Pydantic
│   │   │   ├── asociado.py
│   │   │   ├── usuario.py
│   │   │   └── documento.py
│   │   ├── services/             # Lógica de negocio
│   │   │   ├── asociados.py
│   │   │   ├── usuarios.py
│   │   │   ├── documentos.py
│   │   │   └── auditoria.py
│   │   ├── database.py           # Conexión BD
│   │   └── main.py               # App FastAPI
│   ├── tests/                    # Suite de tests
│   │   ├── conftest.py
│   │   ├── test_auth.py
│   │   ├── test_asociados.py
│   │   ├── test_documentos.py
│   │   ├── test_auditoria.py
│   │   ├── test_validators.py
│   │   └── test_permissions.py
│   ├── uploads/                  # Archivos subidos
│   │   └── documentos/
│   │       ├── cedulas/
│   │       ├── comprobantes/
│   │       ├── certificados/
│   │       └── otros/
│   ├── requirements.txt          # Dependencias Python
│   ├── alembic.ini              # Config Alembic
│   └── .env                     # Variables de entorno
├── frontend/                     # (Opcional) React app
├── docs/                         # Documentación
│   └── MODULO_DOCUMENTOS.md     # Doc módulo documentos
├── README.md                     # Este archivo
└── dev-start.sh                 # Script de inicio
```

---

## 🗄️ Base de Datos

### **Modelos Principales**

```sql
-- Usuarios
CREATE TABLE usuarios (
    id INTEGER PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    nombre_completo VARCHAR(150) NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    rol VARCHAR(20) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    is_superuser BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    last_login TIMESTAMP
);

-- Asociados
CREATE TABLE asociados (
    id INTEGER PRIMARY KEY,
    tipo_documento VARCHAR(10) NOT NULL,
    numero_documento VARCHAR(30) UNIQUE NOT NULL,
    nombres VARCHAR(150) NOT NULL,
    apellidos VARCHAR(150) NOT NULL,
    correo_electronico VARCHAR(200) NOT NULL,
    telefono_principal VARCHAR(50),
    estado VARCHAR(30) DEFAULT 'activo',
    fecha_ingreso DATE NOT NULL,
    datos_personales JSON,
    datos_laborales JSON,
    informacion_familiar JSON,
    informacion_financiera JSON,
    informacion_academica JSON,
    informacion_vivienda JSON,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Documentos
CREATE TABLE documentos (
    id INTEGER PRIMARY KEY,
    asociado_id INTEGER REFERENCES asociados(id),
    nombre_archivo VARCHAR(255) NOT NULL,
    nombre_almacenado VARCHAR(255) UNIQUE NOT NULL,
    tipo_documento VARCHAR(50) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    tamano_bytes INTEGER NOT NULL,
    ruta_almacenamiento VARCHAR(500) NOT NULL,
    descripcion VARCHAR(500),
    es_valido BOOLEAN DEFAULT FALSE,
    fecha_subida TIMESTAMP NOT NULL,
    subido_por_id INTEGER REFERENCES usuarios(id),
    fecha_validacion TIMESTAMP,
    validado_por_id INTEGER REFERENCES usuarios(id),
    notas_validacion VARCHAR(500),
    activo BOOLEAN DEFAULT TRUE
);

-- Auditoría
CREATE TABLE registros_auditoria (
    id INTEGER PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id),
    accion VARCHAR(50) NOT NULL,
    entidad VARCHAR(100),
    entidad_id INTEGER,
    datos JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    timestamp TIMESTAMP NOT NULL
);
```

---

## 🔧 Configuración

### **Variables de Entorno** (.env)

```bash
# Base de datos
DATABASE_URL=sqlite:///./coopeenortol.db

# Seguridad
SECRET_KEY=tu-clave-secreta-muy-segura-aqui
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS
CORS_ORIGINS=["http://localhost:3000","http://localhost:8000"]

# Uploads
MAX_FILE_SIZE_MB=10
UPLOAD_DIR=uploads/documentos
```

---

## 📖 Uso del API

### **Ejemplo 1: Login**
```bash
curl -X POST "http://localhost:8000/api/v1/auth/login-simple" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

### **Ejemplo 2: Crear Asociado**
```bash
curl -X POST "http://localhost:8000/api/v1/asociados/" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "tipo_documento": "CC",
    "numero_documento": "1234567890",
    "nombres": "Juan",
    "apellidos": "Pérez",
    "correo_electronico": "juan.perez@email.com",
    "telefono_principal": "3001234567",
    "fecha_ingreso": "2024-01-15",
    "datos_personales": {
      "fecha_nacimiento": "1990-05-20",
      "genero": "M",
      "estado_civil": "Casado"
    },
    "datos_laborales": {
      "cargo": "Docente",
      "institucion": "Colegio XYZ",
      "salario": 3500000
    }
  }'
```

### **Ejemplo 3: Subir Documento**
```bash
curl -X POST "http://localhost:8000/api/v1/documentos/subir" \
  -H "Authorization: Bearer {token}" \
  -F "file=@cedula.pdf" \
  -F "asociado_id=1" \
  -F "tipo_documento=cedula_ciudadania" \
  -F "descripcion=Cédula de ciudadanía frente y reverso"
```

### **Ejemplo 4: Consultar Auditoría**
```bash
curl -X GET "http://localhost:8000/api/v1/auditoria/?accion=CREAR&limit=10" \
  -H "Authorization: Bearer {token}"
```

---

## 🚀 Despliegue

### **Despliegue en VPS (Producción)**

El proyecto está desplegado en: `http://158.220.100.148:8000`

```bash
# Conectar al servidor
ssh root@158.220.100.148

# Navegar al proyecto
cd /root/projects/Coopeenortol

# Actualizar código
git pull origin main

# Activar entorno virtual
source backend/venv/bin/activate

# Aplicar migraciones
cd backend
alembic upgrade head

# Reiniciar servicio
sudo systemctl restart coopeenortol
```

### **Configuración con systemd**

```bash
# Crear archivo de servicio
sudo nano /etc/systemd/system/coopeenortol.service

# Contenido:
[Unit]
Description=Coopeenortol FastAPI Application
After=network.target

[Service]
User=root
WorkingDirectory=/root/projects/Coopeenortol/backend
Environment="PATH=/root/projects/Coopeenortol/backend/venv/bin"
ExecStart=/root/projects/Coopeenortol/backend/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target

# Habilitar y iniciar
sudo systemctl enable coopeenortol
sudo systemctl start coopeenortol
sudo systemctl status coopeenortol
```

---

## 📚 Documentación Adicional

- [Módulo de Documentos](docs/MODULO_DOCUMENTOS.md) - Documentación detallada del sistema de gestión de documentos
- [API Docs](http://localhost:8000/docs) - Documentación interactiva Swagger
- [ReDoc](http://localhost:8000/redoc) - Documentación alternativa

---

## 🤝 Contribuir

1. Fork el proyecto
2. Crear rama feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add: AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

### **Estándares de Código**
- ✅ Tests para nuevas funcionalidades
- ✅ Coverage mínimo 70%
- ✅ Docstrings en español
- ✅ Type hints en funciones
- ✅ Commits descriptivos

---

## 📝 TODO

- [ ] Módulo de Contabilidad (cuentas, movimientos, balances)
- [ ] Módulo de Créditos (solicitudes, aprobación, amortización)
- [ ] Módulo de Reportes (PDF, Excel, gráficos)
- [ ] Sistema de Notificaciones (email, SMS)
- [ ] Migrar a PostgreSQL
- [ ] Implementar CI/CD con GitHub Actions
- [ ] Dockerizar aplicación
- [ ] Frontend con React
- [ ] App móvil

---

## 👥 Equipo

**Desarrollador Principal:** GitHub Copilot  
**Cliente:** Coopeenortol - Cooperativa del Norte del Tolima  
**Contacto:** info@coopeenortol.com

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver archivo `LICENSE` para más detalles.

---

## 📈 Estadísticas del Proyecto

- **Líneas de código:** ~5,000+
- **Tests:** 70
- **Coverage:** 77%
- **Endpoints:** 30+
- **Modelos:** 4
- **Commits:** 15+
- **Tiempo desarrollo:** 2 sesiones

---

## 🎓 Stack Tecnológico

### **Backend**
- FastAPI 0.110.0
- SQLAlchemy 2.0.29
- Alembic 1.13.1
- Pydantic 1.10.15
- Python-Jose (JWT)
- Passlib (Bcrypt)
- Pytest 8.1.1

### **Base de Datos**
- SQLite (desarrollo)
- PostgreSQL (producción - próximamente)

### **Frontend** (opcional)
- React 18
- TypeScript
- Tailwind CSS
- Vite

### **Infraestructura**
- Ubuntu 22.04 LTS
- systemd
- Git/GitHub

---

**⭐ Si te gusta este proyecto, dale una estrella en GitHub!**

**🐛 ¿Encontraste un bug?** [Reportar issue](https://github.com/robertfenyiner/Coopeenortol2/issues)

**💡 ¿Tienes una idea?** [Sugerir feature](https://github.com/robertfenyiner/Coopeenortol2/issues/new)
