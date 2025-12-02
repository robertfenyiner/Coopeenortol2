from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from pydantic import ValidationError
import logging

from app.api.v1.api import api_router
from app.core.config import settings
from app.database import Base, engine

logger = logging.getLogger(__name__)


def create_app() -> FastAPI:
    app = FastAPI(title=settings.app_name, version=settings.app_version)

    # Configurar CORS para permitir acceso desde cualquier origen
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # Permite todos los orígenes
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        logger.error(f"Error de validación en {request.method} {request.url.path}")
        logger.error(f"Errores: {exc.errors()}")
        logger.error(f"Body recibido: {await request.body()}")
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "detail": exc.errors(),
                "body": exc.body
            }
        )

    @app.on_event("startup")
    def startup() -> None:
        Base.metadata.create_all(bind=engine)

    app.include_router(api_router, prefix="/api/v1")
    
    # Servir archivos estáticos (fotos de asociados)
    app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

    @app.get("/salud", tags=["Sistema"])
    def healthcheck() -> dict[str, str]:
        return {"estado": "ok", "aplicacion": settings.app_name, "version": settings.app_version}

    return app


app = create_app()
