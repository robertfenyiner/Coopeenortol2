# Guía Completa de Instalación en VPS Ubuntu 22.04

## 📋 Información del Servidor

- **IP del VPS**: 5.189.146.163
- **Sistema Operativo**: Ubuntu 22.04.5 LTS
- **Proveedor**: Contabo
- **Usuario**: root

## � Instalación Automatizada (Recomendado)

### Opción 1: Script Completo de Instalación

```bash
# 1. Conectar al servidor
ssh root@5.189.146.163

# 2. Descargar y ejecutar script de instalación
curl -fsSL https://raw.githubusercontent.com/robertfenyiner/Coopeenortol2/main/infra/scripts/setup-vps.sh | bash

# 3. Reiniciar sesión para aplicar cambios de Docker
exit
ssh root@5.189.146.163

# 4. Ir al directorio del proyecto y desplegar
cd /opt/coopeenortol
./infra/scripts/deploy.sh

# 5. Crear usuario administrador
docker compose exec backend python create_admin_simple.py
```

### Opción 2: Verificación de Puertos y Troubleshooting

Si experimentas problemas con puertos ocupados:

```bash
# Verificar estado de puertos
cd /opt/coopeenortol
./infra/scripts/check-ports.sh

# Resolver conflictos automáticamente
sudo systemctl stop nginx apache2 2>/dev/null || true
sudo systemctl disable nginx apache2 2>/dev/null || true
sudo fuser -k 80/tcp 443/tcp 2>/dev/null || true

# Reintentar despliegue
./infra/scripts/deploy.sh
```

## 🔧 Instalación Manual (Paso a Paso)

### 1. Conexión al Servidor

```bash
ssh root@5.189.146.163
```

### 2. Actualización del Sistema

```bash
# Actualizar lista de paquetes
apt update

# Actualizar el sistema
apt upgrade -y
```

### 3. Instalación de Docker

```bash
# Instalar dependencias
apt install -y ca-certificates curl gnupg lsb-release

# Agregar clave GPG de Docker
mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Agregar repositorio de Docker
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Actualizar e instalar Docker
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Verificar instalación
docker --version
docker compose version
```

### 4. Instalación de Node.js (para construcción del frontend)

```bash
# Instalar Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
apt install -y nodejs

# Verificar instalación
node --version
npm --version
```

### 5. Clonación del Proyecto

```bash
# Crear directorio del proyecto
mkdir -p /opt
cd /opt

# Clonar repositorio
git clone https://github.com/robertfenyiner/Coopeenortol2.git coopeenortol
cd coopeenortol
```

### 6. Configuración de Variables de Entorno

```bash
# Crear archivo .env para producción
cat > .env << 'EOF'
# Configuración de Base de Datos
DATABASE_URL=postgresql://coopeenortol_user:secure_password_123@db:5432/coopeenortol_db
POSTGRES_USER=coopeenortol_user
POSTGRES_PASSWORD=secure_password_123
POSTGRES_DB=coopeenortol_db

# Configuración de Seguridad
SECRET_KEY=super_secret_key_for_production_change_this_in_real_deployment_123456789
EMAIL_RESET_TOKEN_EXPIRE_HOURS=24

# Configuración del Entorno
ENVIRONMENT=production
DEBUG=false
EOF
```

### 7. Creación de Archivos Faltantes del Frontend

#### 7.1 Archivo index.html principal
```bash
cat > frontend/index.html << 'EOF'
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <link rel="icon" type="image/svg+xml" href="/vite.svg" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Coopeenortol - Sistema de Gestión</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>
EOF
```

#### 7.2 Estructura del directorio src
```bash
mkdir -p frontend/src

# Archivo main.tsx
cat > frontend/src/main.tsx << 'EOF'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
EOF

# Archivo App.tsx
cat > frontend/src/App.tsx << 'EOF'
function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-600 text-white">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold">Coopeenortol</h1>
          <p className="text-blue-100">Sistema de Gestión de Asociados</p>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-semibold mb-4">¡Bienvenido!</h2>
          <p className="text-gray-600 mb-6">
            Sistema de gestión para la Cooperativa de Profesionales de la Educación del Norte de Tolima.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-2">Gestión de Asociados</h3>
              <p className="text-gray-600">Administra la información de los asociados de la cooperativa.</p>
            </div>
            
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-2">Reportes</h3>
              <p className="text-gray-600">Genera reportes estadísticos y de gestión.</p>
            </div>
            
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-2">Configuración</h3>
              <p className="text-gray-600">Configura los parámetros del sistema.</p>
            </div>
          </div>
        </div>
      </main>
      
      <footer className="bg-gray-800 text-white mt-12">
        <div className="container mx-auto px-4 py-6 text-center">
          <p>&copy; 2024 Coopeenortol. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  )
}

export default App
EOF

# Archivo index.css
cat > frontend/src/index.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

code {
  font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
    monospace;
}
EOF
```

### 8. Configuración de Nginx

#### 8.1 Creación de archivos de configuración
```bash
# Crear directorios necesarios
mkdir -p infra/nginx/sites-available
mkdir -p data/ssl

# Configuración principal de nginx
cat > infra/nginx/nginx.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    sendfile        on;
    keepalive_timeout  65;

    # Configuración del servidor
    server {
        listen 80;
        server_name localhost;

        # Proxy para el API backend
        location /api/ {
            proxy_pass http://backend:8000;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        }

        # Servir el frontend directamente desde el contenedor frontend
        location / {
            proxy_pass http://frontend:80;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        }
    }
}
EOF

# Configuración específica para el frontend
cat > frontend/nginx.conf << 'EOF'
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires "0";
    }

    location /static/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF
```

### 9. Resolución de Problemas del Backend

#### 9.1 Corrección del import problemático
```bash
# Comentar el import de sitecustomize que causaba conflictos
sed -i 's/import sitecustomize/#import sitecustomize/' backend/app/__init__.py
```

#### 9.2 Corrección del Dockerfile del frontend
```bash
# Modificar para usar npm install en lugar de npm ci
sed -i 's/npm ci --only=production/npm install/' frontend/Dockerfile
```

### 10. Construcción y Despliegue

#### 10.1 Detener nginx del sistema (si está activo)
```bash
systemctl stop nginx
systemctl disable nginx
```

#### 10.2 Construcción de imágenes Docker
```bash
# Construir todas las imágenes
docker compose build --no-cache
```

#### 10.3 Inicio de servicios
```bash
# Iniciar todos los servicios
docker compose up -d
```

### 11. Creación del Usuario Administrador

```bash
# Crear script simplificado para crear admin
cat > create_admin_simple.py << 'EOF'
#!/usr/bin/env python3
"""Script simplificado para crear admin."""

import sys
import os
sys.path.insert(0, '/app')

from app.database import Base, engine, SessionLocal
from app.models import Usuario
from app.core.security import SecurityManager

# Crear las tablas si no existen
Base.metadata.create_all(bind=engine)

# Crear sesión
db = SessionLocal()

try:
    # Verificar si ya existe un admin
    existing_admin = db.query(Usuario).filter(Usuario.username == "admin").first()
    if existing_admin:
        print("✅ Usuario admin ya existe")
    else:
        # Crear usuario admin
        admin_user = Usuario(
            username="admin",
            email="admin@coopeenortol.com",
            nombre_completo="Administrador Sistema",
            hashed_password=SecurityManager.hash_password("admin123"),
            rol="admin",
            is_active=True
        )
        db.add(admin_user)
        db.commit()
        print("✅ Usuario admin creado exitosamente")
        print("   Usuario: admin")
        print("   Contraseña: admin123")
        print("   Email: admin@coopeenortol.com")
        
except Exception as e:
    print(f"❌ Error: {e}")
    db.rollback()
finally:
    db.close()
EOF

# Copiar al contenedor y ejecutar
docker cp create_admin_simple.py coopeenortol-backend-1:/app/
docker compose exec backend python create_admin_simple.py
```

### 12. Verificación del Sistema

#### 12.1 Verificar estado de contenedores
```bash
docker compose ps
```

#### 12.2 Probar endpoints
```bash
# Probar frontend
curl -X GET http://localhost

# Probar backend
curl -X GET http://localhost/api/docs

# Probar autenticación
curl -X POST http://localhost/api/v1/auth/login-simple \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'
```

## 📋 Problemas Encontrados y Soluciones

### Problema 1: Sitecustomize causando conflictos
**Solución**: Comentar el import en `backend/app/__init__.py`

### Problema 2: Package-lock.json faltante en frontend
**Solución**: Cambiar de `npm ci` a `npm install` en Dockerfile

### Problema 3: Archivos fuente del frontend faltantes
**Solución**: Crear manualmente index.html, main.tsx, App.tsx, index.css

### Problema 4: Configuración incorrecta de nginx proxy
**Solución**: Corregir proxy_pass para backend (quitar barra final)

### Problema 5: Puerto 80 ocupado por nginx del sistema
**Solución**: Detener y deshabilitar nginx del sistema

## 🎯 Estado Final

✅ **Todos los servicios funcionando**:
- PostgreSQL (puerto 5432)
- Backend FastAPI (puerto 8000) 
- Frontend React (puerto 3000)
- Nginx proxy (puerto 80)

✅ **URLs accesibles**:
- Aplicación: http://5.189.146.163
- API: http://5.189.146.163/api/docs
- Backend directo: http://5.189.146.163:8000

✅ **Usuario administrador creado**:
- Usuario: admin
- Contraseña: admin123
- Email: admin@coopeenortol.com

## 📊 Comandos Útiles para Monitoreo

```bash
# Ver logs de todos los servicios
docker compose logs

# Ver logs específicos
docker compose logs backend
docker compose logs frontend
docker compose logs nginx

# Reiniciar servicios
docker compose restart [servicio]

# Ver estado
docker compose ps

# Acceder a contenedor
docker compose exec backend bash
docker compose exec frontend sh
```

## 🔄 Backup y Mantenimiento

```bash
# Backup de base de datos
docker compose exec db pg_dump -U coopeenortol_user coopeenortol_db > backup_$(date +%Y%m%d).sql

# Detener servicios
docker compose down

# Iniciar servicios
docker compose up -d

# Actualizar desde repositorio
git pull origin main
docker compose build --no-cache
docker compose up -d
```

---

**Fecha de instalación**: 19 de septiembre de 2025  
**Tiempo total de instalación**: ~2 horas  
**Estado**: ✅ COMPLETADO Y FUNCIONAL