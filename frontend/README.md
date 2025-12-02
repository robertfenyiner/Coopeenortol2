# 🎨 Frontend Coopeenortol - Sistema de Gestión Cooperativa

## 📋 Descripción

Frontend profesional desarrollado con React + TypeScript + Vite para el sistema de gestión de la Cooperativa Coopeenortol. Interfaz moderna, responsiva y optimizada para la gestión completa de asociados, créditos, ahorros y contabilidad.

## 🚀 Tecnologías Utilizadas

- **React 18.3** - Biblioteca UI
- **TypeScript 5.2** - Tipado estático
- **Vite 5.0** - Build tool y dev server
- **React Router DOM 6.21** - Enrutamiento
- **Tailwind CSS 3.4** - Estilos utility-first
- **Axios** - Cliente HTTP
- **Lucide React** - Iconos
- **React Hook Form** - Manejo de formularios
- **Zod** - Validación de esquemas
- **Zustand** - Gestión de estado (opcional)

## 📁 Estructura del Proyecto

```
frontend/
├── src/
│   ├── components/          # Componentes reutilizables
│   │   ├── ui/             # Componentes UI base
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Table.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Select.tsx
│   │   │   └── ToastContainer.tsx
│   │   └── layout/         # Componentes de layout
│   │       └── MainLayout.tsx
│   ├── pages/              # Páginas de la aplicación
│   │   ├── LoginPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── AsociadosPage.tsx
│   │   ├── CreditosPage.tsx
│   │   └── AhorrosPage.tsx
│   ├── contexts/           # Contextos de React
│   │   ├── AuthContext.tsx
│   │   └── ToastContext.tsx
│   ├── hooks/              # Custom hooks
│   ├── services/           # Servicios API
│   │   ├── asociadoService.ts
│   │   └── userService.ts
│   ├── types/              # Definiciones TypeScript
│   │   └── index.ts
│   ├── lib/                # Utilidades y configuración
│   │   ├── axios.ts
│   │   └── utils.ts
│   ├── utils/              # Funciones auxiliares
│   ├── App.tsx             # Componente principal
│   ├── main.tsx            # Entry point
│   └── index.css           # Estilos globales
├── public/                 # Assets estáticos
├── .env                    # Variables de entorno
├── .env.example            # Ejemplo de variables
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

## 🎯 Características Implementadas

### ✅ Sistema de Autenticación
- Login con JWT tokens
- Persistencia de sesión en localStorage
- Rutas protegidas con guards
- Auto-redirect si no está autenticado
- Logout con limpieza de sesión

### ✅ Layout Profesional
- Sidebar responsivo con navegación
- Header móvil con menú hamburguesa
- Diseño adaptativo (mobile-first)
- Logo y branding de Coopeenortol
- Información de usuario logueado

### ✅ Componentes UI Reutilizables
- **Button**: Múltiples variantes (primary, secondary, danger, ghost, outline)
- **Input**: Con labels, errores y helper text
- **Card**: Contenedor flexible con título y acciones
- **Table**: Tabla genérica con renderizado personalizado
- **Modal**: Sistema de modales centrados
- **Select**: Dropdown personalizado
- **ToastContainer**: Notificaciones tipo toast

### ✅ Sistema de Notificaciones
- Toast notifications (success, error, info, warning)
- Auto-dismiss después de 5 segundos
- Animaciones suaves
- Apilamiento de múltiples toasts

### ✅ Páginas Implementadas

#### 1. Login
- Formulario de autenticación
- Validación de campos
- Manejo de errores
- Diseño atractivo con gradientes

#### 2. Dashboard
- KPIs principales (asociados, créditos, ahorros)
- Tarjetas estadísticas con iconos
- Accesos rápidos a módulos
- Gráficos de resumen (preparado para integración)

#### 3. Módulo de Asociados
- Listado con tabla paginada
- Búsqueda por nombre/documento
- Estados visuales (activo, inactivo, etc.)
- Navegación a detalle y edición
- Botón "Nuevo Asociado"

#### 4. Módulo de Créditos
- Listado completo de créditos
- Estadísticas: cartera total, créditos activos, en estudio
- Filtros y búsqueda
- Estados visuales con badges
- Navegación a detalle
- Botón "Nueva Solicitud"

#### 5. Módulo de Ahorros
- Listado de cuentas de ahorro
- Total ahorrado y cuentas activas
- Tipos de cuenta diferenciados
- Estados visuales
- Navegación a detalle
- Botón "Nueva Cuenta"

## 🛠️ Instalación y Configuración

### Prerrequisitos
- Node.js 18+ y npm/yarn
- Backend corriendo en http://localhost:8000

### Pasos

1. **Instalar dependencias**
```bash
cd frontend
npm install
```

2. **Configurar variables de entorno**
```bash
cp .env.example .env
# Editar .env con la URL del backend
```

3. **Iniciar servidor de desarrollo**
```bash
npm run dev
```

4. **Compilar para producción**
```bash
npm run build
```

5. **Preview de producción**
```bash
npm run preview
```

## 🔌 Conexión con el Backend

El frontend se conecta al backend a través de Axios configurado en `src/lib/axios.ts`:

- **Base URL**: http://localhost:8000 (configurable en .env)
- **Auth**: JWT Bearer token automático en headers
- **Interceptors**: Manejo automático de errores 401

### Endpoints Utilizados

```typescript
// Autenticación
POST /auth/login              // Login
GET  /auth/me                 // Usuario actual

// Asociados
GET  /asociados               // Listar
GET  /asociados/estadisticas  // Estadísticas

// Créditos
GET  /creditos                // Listar
GET  /creditos/estadisticas   // Estadísticas

// Ahorros
GET  /ahorros/cuentas         // Listar cuentas
GET  /ahorros/estadisticas    // Estadísticas
```

## 🎨 Sistema de Diseño

### Paleta de Colores
- **Primario**: Azul (#2563eb)
- **Secundario**: Gris
- **Success**: Verde
- **Danger**: Rojo
- **Warning**: Amarillo
- **Info**: Azul claro

### Tipografía
- Font System: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto

### Componentes
Todos los componentes UI siguen principios de diseño consistentes:
- Padding y margin uniformes
- Border radius consistente
- Transiciones suaves
- Estados hover/focus/disabled
- Accesibilidad (aria-labels cuando necesario)

## 📱 Responsividad

El frontend es completamente responsivo:
- **Mobile**: < 768px - Menú hamburguesa, layout apilado
- **Tablet**: 768px - 1024px - Sidebar colapsable
- **Desktop**: > 1024px - Sidebar fijo, layout completo

## 🔐 Seguridad

- Tokens JWT en localStorage
- Rutas protegidas con guards
- Auto-logout en token expirado (401)
- Validación de formularios client-side
- Sanitización de inputs

## 🚧 Próximas Implementaciones

### Corto Plazo
1. **Formularios de creación/edición**
   - Asociados (con validaciones colombianas)
   - Créditos (con simulador)
   - Cuentas de ahorro

2. **Páginas de detalle**
   - Detalle de asociado con tabs
   - Detalle de crédito con tabla de amortización
   - Detalle de cuenta con movimientos

3. **Módulo de Documentos**
   - Upload de archivos
   - Visualización de documentos
   - Descarga y eliminación

### Mediano Plazo
4. **Módulo de Contabilidad**
   - Plan de cuentas
   - Asientos contables
   - Reportes y balances

5. **Reportes y Gráficos**
   - Integración con Recharts
   - Gráficos de cartera
   - Evolución de ahorros
   - Reportes exportables (PDF/Excel)

6. **Mejoras UX**
   - Breadcrumbs
   - Tooltips informativos
   - Skeleton loaders
   - Empty states mejorados
   - Confirmación de acciones destructivas

### Largo Plazo
7. **Funcionalidades Avanzadas**
   - Dashboard personalizable
   - Notificaciones en tiempo real
   - Chat interno
   - Calendario de eventos
   - Gestión de usuarios y permisos

## 🧪 Testing (Pendiente)

```bash
# Ejecutar tests
npm run test

# Tests con UI
npm run test:ui

# Coverage
npm run test:coverage
```

## 📦 Build y Despliegue

### Build de Producción
```bash
npm run build
# Output: dist/
```

### Docker
```dockerfile
# Ya existe Dockerfile en el proyecto
docker build -t coopeenortol-frontend .
docker run -p 80:80 coopeenortol-frontend
```

### Variables de Entorno
```env
VITE_API_URL=https://api.coopeenortol.com
VITE_APP_NAME=Coopeenortol
VITE_APP_VERSION=1.0.0
```

## 🤝 Contribución

El código sigue las mejores prácticas de React y TypeScript:
- Componentes funcionales con hooks
- TypeScript estricto
- Organización por features
- Nombres descriptivos
- Comentarios cuando necesario

## 📄 Licencia

© 2024 Cooperativa Coopeenortol. Todos los derechos reservados.

## 📞 Soporte

Para dudas o problemas con el frontend, contactar al equipo de desarrollo.

---

**Estado**: ✅ Base completa - Lista para desarrollo de features
**Última actualización**: 2024-12-02
**Versión**: 1.0.0
