# 🤝 Guía de Contribución - Coopeenortol

## 📋 Tabla de Contenidos
- [Configuración Inicial](#configuración-inicial)
- [Flujo de Trabajo](#flujo-de-trabajo)
- [Estándares de Código](#estándares-de-código)
- [Testing](#testing)
- [Commits y Pull Requests](#commits-y-pull-requests)

## 🚀 Configuración Inicial

### Prerrequisitos
```bash
Python 3.10+
Node.js 18+
Git
```

### Setup Rápido
```bash
# Clonar repositorio
git clone https://github.com/robertfenyiner/Coopeenortol.git
cd Coopeenortol

# Ejecutar script de inicio
./dev-start.sh
```

## 🔄 Flujo de Trabajo

### 1. Crear Nueva Funcionalidad

```bash
# Crear branch desde main
git checkout main
git pull origin main
git checkout -b feature/nombre-funcionalidad

# Trabajar en tu feature
# ...

# Ejecutar tests
cd backend
source venv/bin/activate
pytest

# Commit y push
git add .
git commit -m "✨ Descripción del feature"
git push origin feature/nombre-funcionalidad
```

### 2. Tipos de Branches

- `feature/` - Nuevas funcionalidades
- `fix/` - Correcciones de bugs
- `hotfix/` - Fixes urgentes para producción
- `refactor/` - Mejoras de código sin cambios funcionales
- `docs/` - Cambios solo en documentación

## 📝 Estándares de Código

### Python (Backend)

#### Formato de Código
```python
# Usar type hints siempre que sea posible
def crear_asociado(db: Session, datos: AsociadoCrear) -> Asociado:
    """
    Crear un nuevo asociado.
    
    Args:
        db: Sesión de base de datos
        datos: Datos del asociado a crear
        
    Returns:
        Asociado creado
        
    Raises:
        DocumentoDuplicadoError: Si el documento ya existe
    """
    # Implementación
    pass

# Naming conventions
class MiClase:  # PascalCase para clases
    pass

def mi_funcion():  # snake_case para funciones
    pass

MI_CONSTANTE = "valor"  # UPPER_CASE para constantes
```

#### Docstrings
```python
def funcion_compleja(param1: str, param2: int) -> dict:
    """
    Descripción breve de la función.
    
    Descripción más detallada si es necesaria.
    Explica el propósito y comportamiento.
    
    Args:
        param1: Descripción del parámetro 1
        param2: Descripción del parámetro 2
        
    Returns:
        Diccionario con resultados
        
    Raises:
        ValueError: Si param2 es negativo
        
    Examples:
        >>> funcion_compleja("test", 5)
        {'resultado': 'test5'}
    """
    pass
```

### TypeScript (Frontend)

```typescript
// Usar interfaces para tipos
interface Asociado {
    id: number;
    nombres: string;
    apellidos: string;
}

// Funciones con tipos explícitos
const obtenerAsociado = async (id: number): Promise<Asociado> => {
    // Implementación
};

// Componentes React
const MiComponente: React.FC<Props> = ({ prop1, prop2 }) => {
    return <div>...</div>;
};
```

## 🧪 Testing

### Ejecutar Tests

```bash
# Todos los tests
pytest

# Tests específicos
pytest tests/test_auth.py

# Con cobertura
pytest --cov=app --cov-report=html

# Tests en modo verbose
pytest -v
```

### Escribir Tests

```python
def test_nombre_descriptivo(client, auth_headers_admin):
    """Test que describe lo que verifica."""
    # Arrange (preparar)
    data = {"campo": "valor"}
    
    # Act (ejecutar)
    response = client.post("/api/v1/endpoint", json=data, headers=auth_headers_admin)
    
    # Assert (verificar)
    assert response.status_code == 201
    assert response.json()["campo"] == "valor"
```

### Cobertura Mínima
- Nuevas funcionalidades: 80% de cobertura mínima
- Tests de integración para todos los endpoints nuevos
- Tests unitarios para lógica de negocio compleja

## 📊 Migraciones de Base de Datos

### Crear Nueva Migración

```bash
cd backend
source venv/bin/activate

# Crear migración automática
alembic revision --autogenerate -m "Agregar campo email a usuarios"

# Revisar migración generada en alembic/versions/

# Aplicar migración
alembic upgrade head

# Revertir si es necesario
alembic downgrade -1
```

### Buenas Prácticas

- ✅ Siempre revisar las migraciones autogeneradas
- ✅ Incluir tanto `upgrade()` como `downgrade()`
- ✅ Probar migraciones en ambiente de desarrollo primero
- ✅ Nunca editar migraciones ya aplicadas en producción

## 💬 Commits y Pull Requests

### Formato de Commits

Usar [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Formato
tipo(ámbito): descripción breve

Descripción detallada si es necesaria

# Ejemplos
feat(asociados): agregar filtro por estado
fix(auth): corregir validación de token expirado
docs(readme): actualizar guía de instalación
test(auth): agregar tests para cambio de contraseña
refactor(services): simplificar lógica de creación de asociados
```

### Tipos de Commits

- `feat`: Nueva funcionalidad
- `fix`: Corrección de bug
- `docs`: Cambios en documentación
- `style`: Cambios de formato (no afectan funcionalidad)
- `refactor`: Refactorización de código
- `test`: Agregar o modificar tests
- `chore`: Tareas de mantenimiento
- `perf`: Mejoras de rendimiento

### Pull Requests

#### Título
```
feat: Implementar módulo de créditos
```

#### Descripción Template
```markdown
## 📝 Descripción
Breve descripción de los cambios

## 🎯 Objetivo
¿Qué problema resuelve?

## ✅ Checklist
- [ ] Tests agregados/actualizados
- [ ] Documentación actualizada
- [ ] Migraciones creadas (si aplica)
- [ ] Tests pasando localmente
- [ ] Sin warnings de linter

## 🧪 Pruebas
Cómo probar los cambios

## 📸 Screenshots (si aplica)
```

## 🔍 Code Review

### Como Revisor
- ✅ Verificar que los tests pasen
- ✅ Revisar lógica de negocio
- ✅ Verificar manejo de errores
- ✅ Sugerir mejoras constructivamente
- ✅ Aprobar solo si todo está correcto

### Como Autor
- ✅ Responder a todos los comentarios
- ✅ Hacer cambios solicitados
- ✅ Agregar tests si se solicitan
- ✅ Mantener commits limpios

## 🐛 Reportar Bugs

### Template de Issue

```markdown
**Descripción del Bug**
Descripción clara del problema

**Pasos para Reproducir**
1. Ir a '...'
2. Click en '...'
3. Ver error

**Comportamiento Esperado**
Qué debería pasar

**Comportamiento Actual**
Qué está pasando

**Entorno**
- OS: [e.g. Ubuntu 22.04]
- Python: [e.g. 3.10.12]
- Branch: [e.g. main]

**Logs/Screenshots**
Si aplica
```

## 📚 Recursos Adicionales

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://react.dev/)
- [SQLAlchemy Documentation](https://docs.sqlalchemy.org/)
- [Pytest Documentation](https://docs.pytest.org/)

## ❓ Preguntas

Para preguntas o dudas:
1. Revisar la documentación en `/docs`
2. Buscar en issues cerrados
3. Crear un nuevo issue con la etiqueta `question`

---

**¡Gracias por contribuir a Coopeenortol!** 🎉
