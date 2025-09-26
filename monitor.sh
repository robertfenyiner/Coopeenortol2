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
