from fastapi import APIRouter

from .endpoints import asociados, auth, archivos

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["Autenticación"])
api_router.include_router(asociados.router, prefix="/asociados", tags=["Asociados"])
api_router.include_router(archivos.router, prefix="/archivos", tags=["Archivos"])
