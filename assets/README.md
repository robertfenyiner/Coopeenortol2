# Assets de Coopeenortol

Esta carpeta contiene todos los recursos gráficos y multimedia del proyecto.

## Estructura de carpetas

```
assets/
├── logos/              # Logos oficiales de Coopeenortol
│   ├── logo-principal.png    # Logo con texto "HONDA" 
│   └── logo-completo.png     # Logo circular con eslogan completo
├── icons/              # Iconos para la aplicación
├── images/             # Imágenes generales
└── documents/          # Plantillas de documentos
```

## Logos disponibles

### Logo Principal
- **Archivo**: `logo-principal.png`
- **Descripción**: Logo con las letras estilizadas y "HONDA" en la base
- **Uso**: Encabezados, firmas, documentos oficiales
- **Colores**: Verde y rojo corporativo

### Logo Completo
- **Archivo**: `logo-completo.png` 
- **Descripción**: Logo circular con eslogan "COMPROMISO DE TODOS PARA BIENESTAR DE TODOS"
- **Uso**: Sellos, certificados, documentos formales
- **Colores**: Verde, rojo y blanco

## Especificaciones técnicas

### Colores corporativos
- **Verde principal**: #228B22 (Forest Green)
- **Rojo principal**: #DC143C (Crimson)
- **Blanco**: #FFFFFF

### Formatos recomendados
- **Web**: PNG con fondo transparente
- **Impresión**: SVG vectorial (cuando esté disponible)
- **Favicon**: ICO 32x32, 16x16

## Uso en la aplicación

### Frontend React
```javascript
// Importar logos en componentes
import LogoPrincipal from '/assets/logos/logo-principal.png';
import LogoCompleto from '/assets/logos/logo-completo.png';
```

### Backend (para documentos PDF)
```python
# Ruta para usar en generación de PDFs
LOGO_PATH = "assets/logos/logo-completo.png"
```

## Lineamientos de marca

1. **Respeto por la proporción**: Mantener siempre las proporciones originales
2. **Espacio libre**: Dejar al menos 1x la altura del logo como espacio libre alrededor
3. **Tamaño mínimo**: No reducir a menos de 32px de altura para legibilidad
4. **Fondo**: Usar sobre fondos que contrasten adecuadamente
5. **Modificaciones**: No alterar colores, tipografía o elementos del logo

## Responsable

Robert es responsable de mantener y aprobar cualquier cambio en los assets corporativos.