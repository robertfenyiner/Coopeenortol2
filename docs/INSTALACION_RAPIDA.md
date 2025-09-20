# Instalación Coopeenortol - VPS Ubuntu 22.04

## 🚀 Instalación Completa en 3 Comandos

```bash
# 1. Configurar entorno (Docker, dependencias, repositorio)
curl -fsSL https://raw.githubusercontent.com/robertfenyiner/Coopeenortol2/main/infra/scripts/setup-vps.sh | bash

# 2. Desplegar aplicación
cd /opt/coopeenortol
./infra/scripts/deploy.sh

# 3. Crear usuario administrador
docker compose exec backend python create_admin_simple.py
```

## ✅ Resultado Final

Tu aplicación estará disponible en:
- **Frontend**: http://tu-ip:3000
- **API Backend**: http://tu-ip:8000  
- **Documentación**: http://tu-ip:8000/docs
- **Usuario admin**: admin / admin123

## 📋 Requisitos del VPS

- **Sistema**: Ubuntu 22.04 LTS
- **RAM**: Mínimo 2GB
- **Almacenamiento**: Mínimo 20GB
- **Acceso**: root o sudo

## 🔧 ¿Qué hace cada comando?

### Comando 1: `setup-vps.sh`
- ✅ Actualiza el sistema Ubuntu
- ✅ Instala Docker y Docker Compose
- ✅ Configura firewall (puertos 80, 443, 3000, 8000)
- ✅ Resuelve conflictos de puertos automáticamente
- ✅ Clona repositorio en `/opt/coopeenortol`
- ✅ Configura backups automáticos
- ✅ Instala herramientas adicionales

### Comando 2: `deploy.sh`
- ✅ Verifica y libera puertos ocupados
- ✅ Construye imágenes Docker optimizadas
- ✅ Despliega PostgreSQL con persistencia
- ✅ Inicia backend FastAPI con autenticación JWT
- ✅ Despliega frontend React con Tailwind CSS
- ✅ Configura proxy nginx reverso

### Comando 3: `create_admin_simple.py`
- ✅ Crea usuario administrador inicial
- ✅ Configura acceso completo a la plataforma
- ✅ Habilita gestión de asociados

## 🛠️ Troubleshooting

### Si hay problemas con puertos:
```bash
cd /opt/coopeenortol
./infra/scripts/check-ports.sh
```

### Si necesitas reiniciar servicios:
```bash
cd /opt/coopeenortol
docker compose down
docker compose up -d
```

### Ver logs de la aplicación:
```bash
cd /opt/coopeenortol
docker compose logs -f backend
docker compose logs -f frontend
```

## 🔒 Configuración de Seguridad

El script configura automáticamente:
- Firewall UFW con puertos específicos
- Usuarios Docker sin privilegios root
- Configuración SSL lista para Certbot
- Backups automáticos diarios

## 📚 Documentación Adicional

- [Arquitectura del Sistema](./arquitectura_completa.md)
- [Guía de Desarrollo](./plan_desarrollo_detallado.md)
- [API Documentation](http://tu-ip:8000/docs)

---

**¡Coopeenortol listo en menos de 10 minutos!** 🎉