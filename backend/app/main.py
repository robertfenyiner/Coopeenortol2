from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.v1.api import api_router
from app.core.config import settings
from app.database import Base, engine


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
