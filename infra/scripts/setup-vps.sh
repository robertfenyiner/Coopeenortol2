#!/bin/bash

# Script de deployment para VPS Ubuntu 22.04
# Robert debe ejecutar este script en la VPS para configurar el entorno

set -e

echo "🚀 Iniciando configuración de VPS para Coopeenortol..."

# Actualizar sistema
echo "📦 Actualizando sistema..."
sudo apt update && sudo apt upgrade -y

# Instalar Docker y Docker Compose
echo "🐳 Instalando Docker..."
sudo apt install -y apt-transport-https ca-certificates curl gnupg lsb-release
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Añadir usuario al grupo docker
sudo usermod -aG docker $USER

# Instalar herramientas adicionales
echo "🛠️  Instalando herramientas adicionales..."
sudo apt install -y git curl wget unzip htop nginx certbot python3-certbot-nginx

# Resolver conflictos de puertos comunes
echo "🔧 Resolviendo conflictos de puertos..."
echo "   • Detectando servicios en puertos 80 y 443..."

# Detener y deshabilitar nginx del sistema para evitar conflictos con Docker
if systemctl is-active --quiet nginx; then
    echo "   • Deteniendo nginx del sistema..."
    sudo systemctl stop nginx
    sudo systemctl disable nginx
    echo "   • Nginx del sistema deshabilitado (se usará nginx en Docker)"
fi

# Detener Apache2 si está corriendo
if systemctl is-active --quiet apache2; then
    echo "   • Deteniendo Apache2..."
    sudo systemctl stop apache2
    sudo systemctl disable apache2
    echo "   • Apache2 deshabilitado"
fi

# Verificar que los puertos estén libres
PORTS_IN_USE=$(sudo lsof -i :80 -i :443 -t 2>/dev/null || true)
if [ ! -z "$PORTS_IN_USE" ]; then
    echo "   • Liberando puertos 80 y 443..."
    sudo fuser -k 80/tcp 443/tcp 2>/dev/null || true
    sleep 2
fi

echo "   ✅ Puertos 80 y 443 libres para Docker"

# Configurar firewall
echo "� Configurando firewall..."
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 3000
sudo ufw allow 8000
sudo ufw --force enable

# Clonar el repositorio del proyecto
echo "� Clonando repositorio Coopeenortol..."
cd /opt
git clone https://github.com/robertfenyiner/Coopeenortol2.git coopeenortol
sudo chown -R $USER:$USER /opt/coopeenortol

# Crear estructura de directorios adicionales dentro del proyecto
echo "📁 Creando directorios adicionales..."
cd /opt/coopeenortol
mkdir -p {data,logs,backups,ssl}

# Configurar logrotate para logs de la aplicación
sudo tee /etc/logrotate.d/coopeenortol > /dev/null <<EOF
/opt/coopeenortol/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    copytruncate
}
EOF

# Configurar cron para backups automáticos
echo "💾 Configurando backups automáticos..."
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/coopeenortol/infra/scripts/backup.sh") | crontab -

echo "✅ Configuración base completada!"
echo "📋 Próximos pasos para Robert:"
echo "   1. Ir al directorio del proyecto: cd /opt/coopeenortol"
echo "   2. Ejecutar el script de deployment: ./infra/scripts/deploy.sh"
echo "   3. Crear usuario administrador: docker compose exec backend python create_admin_simple.py"
echo "   4. Configurar SSL con certbot (opcional)"

echo "🔄 Reinicia la sesión para que los cambios de Docker tomen efecto"