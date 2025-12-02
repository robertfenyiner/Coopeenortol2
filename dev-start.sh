#!/bin/bash

# Script de inicio rápido para desarrollo local
# Ejecutar: ./dev-start.sh

set -e  # Salir si hay error

echo "🚀 Iniciando entorno de desarrollo Coopeenortol..."
echo ""

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar que estamos en el directorio correcto
if [ ! -f "README.md" ]; then
    echo "❌ Error: Ejecuta este script desde el directorio raíz del proyecto"
    exit 1
fi

# Backend
echo -e "${BLUE}📦 Configurando Backend...${NC}"
cd backend

# Verificar si existe el venv
if [ ! -d "venv" ]; then
    echo -e "${YELLOW}⚙️  Creando entorno virtual...${NC}"
    python3 -m venv venv
fi

# Activar venv
source venv/bin/activate

# Instalar/actualizar dependencias
echo -e "${YELLOW}📥 Instalando dependencias...${NC}"
pip install -q --upgrade pip
pip install -q -r requirements.txt

# Verificar .env
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚙️  Creando archivo .env...${NC}"
    cp .env.example .env
    echo -e "${GREEN}✓${NC} Archivo .env creado. Revisa la configuración si es necesario."
fi

# Verificar base de datos
if [ ! -f "data/coopeenortol.db" ]; then
    echo -e "${YELLOW}🗄️  Creando base de datos...${NC}"
    mkdir -p data
    alembic upgrade head
    
    # Crear usuario admin
    echo -e "${YELLOW}👤 Creando usuario administrador...${NC}"
    python create_admin_simple.py
fi

# Ejecutar pruebas
echo -e "${BLUE}🧪 Ejecutando pruebas...${NC}"
pytest tests/test_auth.py tests/test_permissions.py -q

echo ""
echo -e "${GREEN}✅ Backend configurado correctamente!${NC}"
echo ""
echo -e "${BLUE}📖 Comandos disponibles:${NC}"
echo -e "  ${YELLOW}Iniciar servidor:${NC}      uvicorn app.main:app --reload"
echo -e "  ${YELLOW}Ver documentación:${NC}     http://localhost:8000/docs"
echo -e "  ${YELLOW}Ejecutar tests:${NC}        pytest"
echo -e "  ${YELLOW}Ver cobertura:${NC}         pytest --cov=app --cov-report=html"
echo -e "  ${YELLOW}Nueva migración:${NC}       alembic revision --autogenerate -m 'descripción'"
echo -e "  ${YELLOW}Aplicar migraciones:${NC}   alembic upgrade head"
echo ""
echo -e "${BLUE}👤 Usuario por defecto:${NC}"
echo -e "  Usuario:    admin"
echo -e "  Contraseña: admin123"
echo ""
echo -e "${GREEN}🎉 ¡Listo para desarrollar!${NC}"
echo ""
echo -e "Inicia el servidor con:"
echo -e "${YELLOW}uvicorn app.main:app --reload${NC}"
