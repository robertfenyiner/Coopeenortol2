#!/bin/bash

# Script para verificar y diagnosticar conflictos de puertos
# Útil para troubleshooting antes del despliegue

echo "🔍 Verificación de puertos para Coopeenortol..."
echo "================================================"

# Función para verificar un puerto
check_port() {
    local port=$1
    local service_name=$2
    
    echo "📍 Puerto $port ($service_name):"
    
    # Verificar si el puerto está en uso
    local processes=$(sudo lsof -i :$port -t 2>/dev/null || true)
    
    if [ -z "$processes" ]; then
        echo "   ✅ LIBRE - Puerto $port disponible"
    else
        echo "   ❌ OCUPADO - Procesos usando el puerto $port:"
        sudo lsof -i :$port 2>/dev/null | while read line; do
            echo "      $line"
        done
        
        # Sugerir solución
        echo "   💡 Solución sugerida:"
        if sudo lsof -i :$port 2>/dev/null | grep -q nginx; then
            echo "      sudo systemctl stop nginx && sudo systemctl disable nginx"
        elif sudo lsof -i :$port 2>/dev/null | grep -q apache; then
            echo "      sudo systemctl stop apache2 && sudo systemctl disable apache2"
        else
            echo "      sudo fuser -k $port/tcp"
        fi
    fi
    echo ""
}

# Verificar puertos principales
check_port 80 "HTTP"
check_port 443 "HTTPS"
check_port 3000 "Frontend"
check_port 8000 "Backend API"
check_port 5432 "PostgreSQL"

# Verificar servicios del sistema
echo "🔧 Estado de servicios del sistema:"
echo "=================================="

services=("nginx" "apache2" "postgresql")
for service in "${services[@]}"; do
    if systemctl list-unit-files | grep -q "^$service.service"; then
        status=$(systemctl is-active $service 2>/dev/null || echo "inactive")
        enabled=$(systemctl is-enabled $service 2>/dev/null || echo "disabled")
        
        if [ "$status" = "active" ]; then
            echo "   ⚠️  $service: $status ($enabled)"
            echo "      💡 Considera: sudo systemctl stop $service && sudo systemctl disable $service"
        else
            echo "   ✅ $service: $status ($enabled)"
        fi
    else
        echo "   ℹ️  $service: no instalado"
    fi
done

echo ""
echo "🐳 Estado de Docker:"
echo "==================="

if command -v docker >/dev/null 2>&1; then
    if docker compose ps >/dev/null 2>&1; then
        echo "   ✅ Docker y Docker Compose disponibles"
        
        # Verificar contenedores de Coopeenortol
        cd "$(dirname "$0")/../.." 2>/dev/null || cd /opt/coopeenortol 2>/dev/null || true
        
        if [ -f "docker-compose.yml" ]; then
            echo "   📋 Estado de contenedores Coopeenortol:"
            docker compose ps 2>/dev/null | tail -n +2 | while read line; do
                if [ ! -z "$line" ]; then
                    echo "      $line"
                fi
            done
        else
            echo "   ℹ️  No se encontró docker-compose.yml en el directorio actual"
        fi
    else
        echo "   ❌ Docker disponible pero Docker Compose no funciona"
    fi
else
    echo "   ❌ Docker no está instalado"
fi

echo ""
echo "📋 Resumen y recomendaciones:"
echo "============================"

# Verificar si hay conflictos
conflicts=false
for port in 80 443; do
    if ! [ -z "$(sudo lsof -i :$port -t 2>/dev/null || true)" ]; then
        conflicts=true
        break
    fi
done

if [ "$conflicts" = true ]; then
    echo "   ⚠️  Se detectaron conflictos de puertos"
    echo "   🔧 Ejecuta estos comandos para resolverlos:"
    echo "      sudo systemctl stop nginx apache2 2>/dev/null || true"
    echo "      sudo systemctl disable nginx apache2 2>/dev/null || true"
    echo "      sudo fuser -k 80/tcp 443/tcp 2>/dev/null || true"
    echo ""
    echo "   Luego ejecuta: ./infra/scripts/deploy.sh"
else
    echo "   ✅ No se detectaron conflictos"
    echo "   🚀 Listo para ejecutar: ./infra/scripts/deploy.sh"
fi

echo ""
echo "🔍 Verificación completada."