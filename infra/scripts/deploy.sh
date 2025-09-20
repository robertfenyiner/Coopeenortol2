#!/bin/bash

# Script de deployment para producción
# Ejecutar desde el directorio raíz del proyecto

set -e

DOMAIN=${1:-"coopeenortol.com"}
ENV=${2:-"production"}

echo "🚀 Desplegando Coopeenortol en producción..."
echo "🌐 Dominio: $DOMAIN"
echo "🏷️  Entorno: $ENV"

# Verificar que estamos en el directorio correcto
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Error: Ejecutar desde el directorio raíz del proyecto"
    exit 1
fi

# Verificar y resolver conflictos de puertos antes del despliegue
echo "🔍 Verificando puertos..."
PORTS_IN_USE=$(sudo lsof -i :80 -i :443 -t 2>/dev/null | grep -v docker || true)
if [ ! -z "$PORTS_IN_USE" ]; then
    echo "⚠️  Detectados servicios usando puertos 80/443. Resolviendo..."
    
    # Detener nginx del sistema si está corriendo
    if systemctl is-active --quiet nginx 2>/dev/null; then
        echo "   • Deteniendo nginx del sistema..."
        sudo systemctl stop nginx 2>/dev/null || true
    fi
    
    # Detener Apache2 si está corriendo
    if systemctl is-active --quiet apache2 2>/dev/null; then
        echo "   • Deteniendo Apache2..."
        sudo systemctl stop apache2 2>/dev/null || true
    fi
    
    # Liberar puertos si es necesario
    sudo fuser -k 80/tcp 443/tcp 2>/dev/null || true
    sleep 2
    echo "   ✅ Puertos liberados"
else
    echo "   ✅ Puertos 80 y 443 disponibles"
fi

# Crear archivo .env si no existe
if [ ! -f ".env" ]; then
    echo "📝 Creando archivo .env..."
    cat > .env << EOF
# Configuración de producción para Coopeenortol
APP_NAME=Coopeenortol API
APP_VERSION=1.0.0
DATABASE_URL=postgresql://coopeenortol:$(openssl rand -base64 32)@db:5432/coopeenortol_db
BACKEND_CORS_ORIGINS=https://$DOMAIN,https://www.$DOMAIN

# Base de datos
POSTGRES_DB=coopeenortol_db
POSTGRES_USER=coopeenortol
POSTGRES_PASSWORD=$(openssl rand -base64 32)

# Configuración de aplicación
SECRET_KEY=$(openssl rand -base64 64)
ACCESS_TOKEN_EXPIRE_MINUTES=30
ALGORITHM=HS256

# Email (configurar con proveedor real)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=notificaciones@coopeenortol.com
SMTP_PASSWORD=your_email_password

# Dominio
DOMAIN=$DOMAIN
EOF
    echo "✅ Archivo .env creado. Robert debe revisar y ajustar las configuraciones."
fi

# Detener servicios anteriores si existen
echo "🛑 Deteniendo servicios anteriores..."
docker compose down 2>/dev/null || true

# Construir imágenes
echo "🔨 Construyendo imágenes Docker..."
docker compose build --no-cache

# Ejecutar migraciones de base de datos
echo "💾 Ejecutando migraciones..."
docker compose run --rm backend python -m alembic upgrade head || echo "⚠️  Migraciones pendientes - verificar manualmente"

# Iniciar servicios
echo "🚀 Iniciando servicios..."
docker compose up -d

# Verificar que los servicios estén funcionando
echo "🔍 Verificando servicios..."
sleep 10

if curl -f http://localhost:8000/salud >/dev/null 2>&1; then
    echo "✅ Backend funcionando correctamente"
else
    echo "❌ Error: Backend no responde"
    exit 1
fi

# Configurar SSL con certbot
echo "🔒 Configurando SSL..."
if [ "$ENV" = "production" ] && [ -n "$DOMAIN" ]; then
    sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN || echo "⚠️  Configurar SSL manualmente"
fi

# Mostrar estado de los contenedores
echo "📊 Estado de los servicios:"
docker compose ps

echo ""
echo "✅ ¡Deployment completado!"
echo "🌐 Aplicación disponible en: https://$DOMAIN"
echo "📊 Monitoreo: docker compose logs -f"
echo "🔧 Para detener: docker compose down"

# Configurar monitoreo básico
echo "📈 Configurando monitoreo básico..."
cat > /opt/coopeenortol/monitor.sh << 'EOF'
#!/bin/bash
# Script de monitoreo básico para Coopeenortol

LOG_FILE="/opt/coopeenortol/logs/monitor.log"
DATE=$(date '+%Y-%m-%d %H:%M:%S')

# Verificar servicios
if ! curl -f http://localhost:8000/salud >/dev/null 2>&1; then
    echo "[$DATE] ERROR: Backend no responde" >> $LOG_FILE
    # Aquí se puede añadir notificación por email
fi

# Verificar espacio en disco
DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
    echo "[$DATE] WARNING: Uso de disco alto: $DISK_USAGE%" >> $LOG_FILE
fi

# Verificar memoria
MEM_USAGE=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
if [ $MEM_USAGE -gt 90 ]; then
    echo "[$DATE] WARNING: Uso de memoria alto: $MEM_USAGE%" >> $LOG_FILE
fi
EOF

chmod +x /opt/coopeenortol/monitor.sh

# Configurar cron para monitoreo cada 5 minutos
(crontab -l 2>/dev/null; echo "*/5 * * * * /opt/coopeenortol/monitor.sh") | crontab -

echo "📋 Configuración de monitoreo añadida al cron"