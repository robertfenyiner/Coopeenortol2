# 🚀 Guía de Acceso y Próximos Pasos

## 📍 Acceso a la Aplicación

### URLs de Acceso
- **Frontend:** http://158.220.100.148:3000
- **Backend API:** http://158.220.100.148:8000
- **Documentación API:** http://158.220.100.148:8000/docs

### Credenciales de Prueba
Para acceder al sistema, usa las credenciales del usuario administrador que ya tienes configurado.

---

## 🎯 Módulo de Reportes - ¿Cómo Acceder?

### 1. Login
1. Ve a http://158.220.100.148:3000
2. Inicia sesión con tus credenciales de administrador

### 2. Acceder al Módulo de Reportes
En el menú lateral, busca la opción **"Reportes"** (debería estar visible para administradores)

### 3. Explorar los 6 Tipos de Reportes

#### a) Balance General
- **Ruta:** `/reportes/balance-general`
- **Qué hace:** Muestra el balance financiero con Activos, Pasivos y Patrimonio
- **Cómo usar:**
  1. Selecciona una fecha de corte
  2. Haz clic en "Generar"
  3. Revisa que cuadre: Activos = Pasivos + Patrimonio
  4. Exporta a PDF si lo necesitas

#### b) Estado de Resultados
- **Ruta:** `/reportes/estado-resultados`
- **Qué hace:** Análisis de ingresos, gastos y utilidad (P&L)
- **Cómo usar:**
  1. Selecciona fecha inicio y fin
  2. Haz clic en "Generar"
  3. Revisa ingresos, gastos y márgenes
  4. Exporta a PDF si lo necesitas

#### c) Reporte de Cartera
- **Ruta:** `/reportes/cartera`
- **Qué hace:** Análisis completo de créditos activos
- **Cómo usar:**
  1. Opcionalmente selecciona una fecha
  2. Haz clic en "Generar"
  3. Revisa estadísticas y distribución por tipo
  4. Exporta a Excel si lo necesitas

#### d) Reporte de Mora
- **Ruta:** `/reportes/mora`
- **Qué hace:** Análisis de créditos vencidos por rangos
- **Cómo usar:**
  1. Haz clic en "Generar Reporte"
  2. Revisa créditos en mora por rango (1-30, 31-60, 61-90, 91+ días)
  3. Filtra por rango si quieres ver solo uno
  4. Revisa datos de contacto de asociados
  5. Exporta a Excel si lo necesitas

#### e) Estado de Cuenta
- **Ruta:** `/reportes/estado-cuenta`
- **Qué hace:** Resumen financiero individual del asociado
- **Cómo usar:**
  1. Ingresa el ID de un asociado
  2. Haz clic en "Generar Estado de Cuenta"
  3. Revisa aportes, créditos, ahorros y patrimonio
  4. Exporta a PDF si lo necesitas

#### f) Estadísticas Generales
- **Ruta:** `/reportes/estadisticas`
- **Qué hace:** Dashboard con KPIs generales de la cooperativa
- **Cómo usar:**
  1. Se carga automáticamente al abrir
  2. Revisa estadísticas de asociados, créditos, ahorros
  3. Revisa resumen financiero y ejecutivo

---

## ⚠️ Importante - Exportaciones

### Estado Actual
Las funciones de exportación a **PDF y Excel** están implementadas en el frontend, PERO el backend actualmente retorna archivos placeholder (vacíos).

### ¿Qué significa esto?
- ✅ Los botones de exportación funcionan
- ✅ Se descargará un archivo PDF o Excel
- ⚠️ El archivo estará vacío o tendrá contenido genérico
- ⚠️ No contendrá los datos reales del reporte

### ¿Qué se necesita?
Para que las exportaciones funcionen completamente, se debe:

1. **Para PDFs:**
   ```bash
   pip install reportlab
   ```
   Luego implementar la generación de PDF en:
   - `backend/app/services/reportes.py`
   - Funciones: `exportar_balance_pdf()`, `exportar_estado_resultados_pdf()`, etc.

2. **Para Excel:**
   ```bash
   pip install openpyxl
   ```
   Luego implementar la generación de Excel en:
   - `backend/app/services/reportes.py`
   - Funciones: `exportar_cartera_excel()`, `exportar_mora_excel()`

---

## 🧪 Testing Recomendado

### Paso 1: Verificar que el sitio carga
```bash
curl http://158.220.100.148:3000
```
Debe retornar HTML

### Paso 2: Verificar que el backend responde
```bash
curl http://158.220.100.148:8000/health
```
Debe retornar: `{"status":"healthy"}`

### Paso 3: Probar cada reporte
- [ ] Accede a /reportes
- [ ] Haz clic en cada card
- [ ] Genera cada tipo de reporte
- [ ] Verifica que los datos se muestren correctamente

### Paso 4: Probar filtros
- [ ] Cambia fechas en Balance General
- [ ] Cambia rango en Estado de Resultados
- [ ] Filtra por rango en Reporte de Mora

### Paso 5: Probar exportaciones (aunque sean placeholder)
- [ ] Exporta Balance General a PDF
- [ ] Exporta Estado de Resultados a PDF
- [ ] Exporta Cartera a Excel
- [ ] Exporta Mora a Excel
- [ ] Exporta Estado de Cuenta a PDF

---

## 🛠️ Comandos Útiles

### Ver estado de servicios
```bash
sudo systemctl status coopeenortol-backend.service
sudo systemctl status coopeenortol-frontend.service
```

### Reiniciar servicios
```bash
sudo systemctl restart coopeenortol-backend.service
sudo systemctl restart coopeenortol-frontend.service
```

### Ver logs en tiempo real
```bash
# Backend
journalctl -u coopeenortol-backend.service -f

# Frontend
journalctl -u coopeenortol-frontend.service -f
```

### Ver logs recientes
```bash
# Backend
journalctl -u coopeenortol-backend.service -n 50

# Frontend
journalctl -u coopeenortol-frontend.service -n 50
```

---

## 📋 Checklist de Próximos Pasos

### Prioridad Alta 🔴

- [ ] **Implementar generación real de PDFs**
  - Instalar reportlab: `pip install reportlab`
  - Implementar en `backend/app/services/reportes.py`
  - Crear templates profesionales
  - Probar cada exportación

- [ ] **Implementar generación real de Excel**
  - Instalar openpyxl: `pip install openpyxl`
  - Implementar en `backend/app/services/reportes.py`
  - Agregar formatos y estilos
  - Probar cada exportación

- [ ] **Tests del módulo Reportes**
  - Crear `backend/tests/test_reportes.py`
  - Tests unitarios de servicios
  - Tests de integración de endpoints
  - Target: 80%+ coverage

### Prioridad Media 🟡

- [ ] **Mejorar coverage de otros módulos**
  - Créditos: De 17% a 80%+
  - Ahorros: De 17% a 80%+

- [ ] **Dashboard mejorado**
  - Integrar datos de EstadisticasGeneralesPage
  - Agregar gráficas visuales
  - Refresh automático de KPIs

- [ ] **Gráficas y visualizaciones**
  - Instalar Chart.js o Recharts
  - Agregar gráficas de pastel
  - Agregar gráficas de línea para tendencias

### Prioridad Baja 🟢

- [ ] **Mejoras de UX**
  - Loading skeletons en vez de spinners
  - Animaciones de transición
  - Tooltips informativos

- [ ] **Filtros avanzados**
  - Date picker visual
  - Multi-select para tipos
  - Autocomplete en búsquedas

- [ ] **Performance**
  - Implementar React Query para caché
  - Paginación en tablas grandes
  - Virtual scrolling

---

## 📚 Documentación Adicional

### Archivos Importantes
- `SESION_03_DIC_2024.md` - Resumen de esta sesión
- `docs/MODULO_REPORTES_FRONTEND.md` - Documentación técnica del módulo
- `backend/app/api/v1/endpoints/reportes.py` - Endpoints backend
- `frontend/src/pages/` - Páginas del frontend

### Arquitectura
```
Frontend (React + TypeScript)
    ↓ HTTP Requests (Axios)
Backend (FastAPI)
    ↓ ORM (SQLAlchemy)
Database (SQLite)
```

---

## 🆘 Solución de Problemas

### El frontend no carga
```bash
sudo systemctl restart coopeenortol-frontend.service
journalctl -u coopeenortol-frontend.service -n 50
```

### El backend no responde
```bash
sudo systemctl restart coopeenortol-backend.service
journalctl -u coopeenortol-backend.service -n 50
```

### Error al generar reporte
1. Verifica que estés autenticado
2. Revisa los logs del backend
3. Verifica que los datos existan en la BD

### Error al exportar
Esto es esperado si no has implementado reportlab/openpyxl.
Los botones funcionan pero retornan archivos placeholder.

---

## 💡 Consejos

1. **Antes de probar en producción:** Haz pruebas con datos de prueba
2. **Backups:** Haz backup de la BD antes de cambios importantes
3. **Git:** Haz commits frecuentes con mensajes descriptivos
4. **Logs:** Revisa los logs regularmente para detectar problemas
5. **Tests:** Ejecuta tests antes de hacer deploy

---

## 📞 Información de Contacto del Servidor

- **IP:** 158.220.100.148
- **OS:** Ubuntu
- **Servicios:** Backend (8000), Frontend (3000)
- **Monitoreo:** Cron job cada 5 minutos
- **Estado:** ✅ Operacional

---

## 🎉 ¡Listo para Usar!

El módulo de Reportes está completamente funcional y listo para usar. Solo faltan las implementaciones de generación real de PDFs y Excel, pero todos los reportes se pueden visualizar perfectamente en pantalla.

**¡Disfruta explorando los reportes!** 📊

---

**Última actualización:** 03 Diciembre 2024  
**Versión:** 1.0  
**Estado:** Producción Ready (sin exportaciones reales)
