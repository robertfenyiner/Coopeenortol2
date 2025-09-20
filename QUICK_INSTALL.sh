#!/bin/bash

# INSTALACIÓN RÁPIDA COOPEENORTOL
# Ejecutar en VPS Ubuntu 22.04

echo "🚀 Instalación Coopeenortol - 3 comandos"
echo "========================================"
echo ""
echo "Ejecuta estos comandos en tu VPS:"
echo ""
echo "# 1. Configurar entorno"
echo "curl -fsSL https://raw.githubusercontent.com/robertfenyiner/Coopeenortol2/main/infra/scripts/setup-vps.sh | bash"
echo ""
echo "# 2. Desplegar aplicación"
echo "cd /opt/coopeenortol"
echo "./infra/scripts/deploy.sh"
echo ""
echo "# 3. Crear admin"
echo "docker compose exec backend python create_admin_simple.py"
echo ""
echo "✅ Resultado: Aplicación lista en http://tu-ip:3000"
echo "📚 Documentación: docs/INSTALACION_RAPIDA.md"