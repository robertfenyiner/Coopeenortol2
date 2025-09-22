#!/bin/bash
# Script para actualizar completamente el VPS y arreglar los problemas

echo "🚀 Iniciando actualización completa del VPS..."

# 1. Ir al directorio del proyecto
cd /opt/coopeenortol

# 2. Hacer pull de los últimos cambios
echo "📥 Descargando últimos cambios..."
git pull origin main

# 3. Parar todos los contenedores
echo "⏹️ Parando contenedores..."
docker compose down

# 4. Reconstruir todo desde cero (sin cache)
echo "🔨 Reconstruyendo frontend sin cache..."
docker compose build frontend --no-cache

echo "🔨 Reconstruyendo backend sin cache..."
docker compose build backend --no-cache

# 5. Limpiar volúmenes y imágenes dangling
echo "🧹 Limpiando Docker..."
docker system prune -f
docker volume prune -f

# 6. Levantar los servicios
echo "🚀 Levantando servicios..."
docker compose up -d

# 7. Esperar un poco para que se inicien
echo "⏳ Esperando que se inicien los servicios..."
sleep 10

# 8. Verificar que estén corriendo
echo "✅ Verificando servicios..."
docker compose ps

# 9. Verificar logs del backend
echo "📋 Logs del backend:"
docker compose logs backend --tail 20

# 10. Probar el API
echo "🧪 Probando API..."
curl -s http://localhost:8000/api/v1/asociados/ | head -100

echo "✅ ¡Actualización completada!"
echo "🌐 Frontend disponible en: http://5.189.146.163:80"
echo "🔧 Backend disponible en: http://5.189.146.163:8000"
echo "📚 Documentación API en: http://5.189.146.163:8000/docs"