# Backend Coopeenortol

API desarrollada con FastAPI para soportar la plataforma administrativa de Coopeenortol. En esta fase inicial se publica el módulo de gestión de personal con capacidad CRUD sobre los asociados.

## Requisitos

- Python 3.11 o 3.12
- Entorno virtual recomendado (`python -m venv venv`)

## Instalación

```bash
pip install -r requirements.txt
```

Crear un archivo `.env` en la carpeta `backend/` tomando como referencia `.env.example`.

> Nota: se incluye `sitecustomize.py` en la raíz del repositorio para garantizar compatibilidad de Pydantic con Python 3.12. No eliminarlo, ya que forma parte del arranque del proyecto.

## Ejecución

```bash
uvicorn app.main:app --reload
```

La API quedará disponible en `http://localhost:8000`. La documentación interactiva se encuentra en `http://localhost:8000/docs`.

## Estructura

- `app/main.py`: punto de entrada de la aplicación FastAPI.
- `app/api/v1/`: rutas del API versionado.
- `app/services/`: lógica de negocio y acceso a datos.
- `app/models/`: modelos SQLAlchemy para la base de datos.
- `app/schemas/`: esquemas Pydantic para validaciones y respuestas.
- `tests/`: pruebas automatizadas con Pytest.

## Comandos útiles

- Ejecutar pruebas: `pytest`
- Formatear código (pendiente de definir herramienta).

## Próximos pasos

- Incorporar autenticación y autorización basada en roles.
- Añadir gestión documental (integración con almacenamiento externo).
- Documentar scripts de migración y carga de datos.
