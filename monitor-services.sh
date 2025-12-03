#!/bin/bash
# Script de monitoreo de servicios Coopeenortol
# Verifica el estado y reinicia si es necesario

LOG_FILE="/var/log/coopeenortol-monitor.log"
BACKEND_URL="http://localhost:8000/api/v1/"
FRONTEND_URL="http://localhost:3000"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

check_service() {
    SERVICE=$1
    if ! systemctl is-active --quiet "$SERVICE"; then
        log "⚠️  $SERVICE no está activo. Reiniciando..."
        systemctl restart "$SERVICE"
        sleep 5
        if systemctl is-active --quiet "$SERVICE"; then
            log "✅ $SERVICE reiniciado exitosamente"
        else
            log "❌ $SERVICE falló al reiniciar"
        fi
    fi
}

check_url() {
    URL=$1
    NAME=$2
    if ! curl -s --max-time 5 "$URL" > /dev/null 2>&1; then
        log "⚠️  $NAME no responde en $URL"
        return 1
    fi
    return 0
}

log "🔍 Verificando servicios..."

# Verificar backend
check_service "coopeenortol-backend"
if check_url "$BACKEND_URL" "Backend"; then
    log "✅ Backend respondiendo correctamente"
else
    log "⚠️  Backend no responde, reiniciando..."
    systemctl restart coopeenortol-backend
fi

# Verificar frontend
check_service "coopeenortol-frontend"
if check_url "$FRONTEND_URL" "Frontend"; then
    log "✅ Frontend respondiendo correctamente"
else
    log "⚠️  Frontend no responde, reiniciando..."
    systemctl restart coopeenortol-frontend
fi

log "✨ Verificación completada"
