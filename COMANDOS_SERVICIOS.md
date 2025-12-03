# Comandos de Gestión de Servicios Coopeenortol

## Estado de los servicios

```bash
# Ver estado de ambos servicios
systemctl status coopeenortol-backend coopeenortol-frontend

# Ver solo si están activos
systemctl is-active coopeenortol-backend coopeenortol-frontend
```

## Iniciar/Detener/Reiniciar

```bash
# Iniciar servicios
systemctl start coopeenortol-backend
systemctl start coopeenortol-frontend

# Detener servicios
systemctl stop coopeenortol-backend
systemctl stop coopeenortol-frontend

# Reiniciar servicios
systemctl restart coopeenortol-backend
systemctl restart coopeenortol-frontend

# Reiniciar ambos
systemctl restart coopeenortol-backend coopeenortol-frontend
```

## Ver logs

```bash
# Logs del backend
tail -f /var/log/coopeenortol-backend.log
tail -f /var/log/coopeenortol-backend-error.log

# Logs del frontend
tail -f /var/log/coopeenortol-frontend.log
tail -f /var/log/coopeenortol-frontend-error.log

# Logs del monitor
tail -f /var/log/coopeenortol-monitor.log

# Ver logs con journalctl (últimas 50 líneas)
journalctl -u coopeenortol-backend -n 50 --no-pager
journalctl -u coopeenortol-frontend -n 50 --no-pager

# Seguir logs en tiempo real
journalctl -u coopeenortol-backend -f
journalctl -u coopeenortol-frontend -f
```

## Verificación manual

```bash
# Ejecutar script de monitoreo manualmente
/root/projects/Coopeenortol/monitor-services.sh

# Verificar URLs
curl http://localhost:8000/api/v1/
curl http://localhost:3000
curl http://158.220.100.148:8000/api/v1/
curl http://158.220.100.148:3000
```

## Habilitar/Deshabilitar inicio automático

```bash
# Ya están habilitados, pero por si acaso:
systemctl enable coopeenortol-backend
systemctl enable coopeenortol-frontend

# Para deshabilitar (no recomendado)
systemctl disable coopeenortol-backend
systemctl disable coopeenortol-frontend
```

## Actualizar código

```bash
# Actualizar backend
cd /root/projects/Coopeenortol/backend
git pull
systemctl restart coopeenortol-backend

# Actualizar frontend
cd /root/projects/Coopeenortol/frontend
git pull
npm install  # solo si hay cambios en package.json
systemctl restart coopeenortol-frontend
```

## Verificar cron

```bash
# Ver tareas programadas
crontab -l

# Editar tareas programadas
crontab -e
```

## Archivos importantes

- **Servicios systemd:**
  - `/etc/systemd/system/coopeenortol-backend.service`
  - `/etc/systemd/system/coopeenortol-frontend.service`

- **Logs:**
  - `/var/log/coopeenortol-backend.log`
  - `/var/log/coopeenortol-backend-error.log`
  - `/var/log/coopeenortol-frontend.log`
  - `/var/log/coopeenortol-frontend-error.log`
  - `/var/log/coopeenortol-monitor.log`

- **Script de monitoreo:**
  - `/root/projects/Coopeenortol/monitor-services.sh`

## Solución de problemas

### Si el backend no inicia:

```bash
# Ver errores detallados
journalctl -u coopeenortol-backend -n 100 --no-pager
tail -50 /var/log/coopeenortol-backend-error.log

# Verificar que el entorno virtual existe
ls -la /root/projects/Coopeenortol/backend/venv/bin/

# Probar manualmente
cd /root/projects/Coopeenortol/backend
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Si el frontend no inicia:

```bash
# Ver errores detallados
journalctl -u coopeenortol-frontend -n 100 --no-pager
tail -50 /var/log/coopeenortol-frontend-error.log

# Verificar Node.js
/root/.nvm/versions/node/v18.20.8/bin/node --version

# Probar manualmente
cd /root/projects/Coopeenortol/frontend
npm run dev -- --host 0.0.0.0 --port 3000
```

### Si los puertos están ocupados:

```bash
# Ver qué está usando el puerto 8000
lsof -i :8000
# o
netstat -tulpn | grep 8000

# Matar proceso en puerto 8000
fuser -k 8000/tcp

# Lo mismo para puerto 3000
lsof -i :3000
fuser -k 3000/tcp
```
