from fastapi import APIRouter

from .endpoints import asociados

api_router = APIRouter()
api_router.include_router(asociados.router, prefix="/asociados", tags=["Asociados"])
