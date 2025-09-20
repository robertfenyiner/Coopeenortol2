#!/bin/bash

# Script de backup para Coopeenortol
# Ejecuta backup de la base de datos y archivos importantes

set -e

BACKUP_DIR="/opt/coopeenortol/backups"
DATE=$(date +%Y%m%d_%H%M%S)

echo "🔄 Iniciando backup - $DATE"

# Crear directorio de backup si no existe
mkdir -p "$BACKUP_DIR"

# Backup de base de datos PostgreSQL
echo "📦 Backup de base de datos..."
docker compose exec -T db pg_dump -U coopeenortol coopeenortol_db > "$BACKUP_DIR/db_backup_$DATE.sql"

# Backup de archivos de configuración
echo "📁 Backup de archivos de configuración..."
cp /opt/coopeenortol/.env "$BACKUP_DIR/env_backup_$DATE"

# Comprimir logs antiguos
echo "🗜️  Comprimiendo logs..."
find /opt/coopeenortol/logs -name "*.log" -mtime +7 -exec gzip {} \;

# Limpiar backups antiguos (mantener solo últimos 30 días)
echo "🧹 Limpiando backups antiguos..."
find "$BACKUP_DIR" -name "*.sql" -mtime +30 -delete
find "$BACKUP_DIR" -name "env_backup_*" -mtime +30 -delete

echo "✅ Backup completado - $DATE"