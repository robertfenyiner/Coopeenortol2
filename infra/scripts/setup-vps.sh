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

# Crear directorio para la aplicación
echo "📁 Creando directorios..."
sudo mkdir -p /opt/coopeenortol
sudo chown $USER:$USER /opt/coopeenortol

# Configurar firewall
echo "🔥 Configurando firewall..."
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw --force enable

# Crear estructura de directorios
mkdir -p /opt/coopeenortol/{data,logs,backups,ssl}

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
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/coopeenortol/scripts/backup.sh") | crontab -

echo "✅ Configuración base completada!"
echo "📋 Próximos pasos para Robert:"
echo "   1. Clonar el repositorio en /opt/coopeenortol/"
echo "   2. Configurar variables de entorno en .env"
echo "   3. Ejecutar el script de deployment específico"
echo "   4. Configurar SSL con certbot"

echo "🔄 Reinicia la sesión para que los cambios de Docker tomen efecto"