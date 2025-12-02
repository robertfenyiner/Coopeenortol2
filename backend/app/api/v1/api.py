from fastapi import APIRouter

from .endpoints import asociados, auth, auditoria, documentos

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["Autenticación"])
api_router.include_router(asociados.router, prefix="/asociados", tags=["Asociados"])
api_router.include_router(auditoria.router, prefix="/auditoria", tags=["Auditoría"])
api_router.include_router(documentos.router, prefix="/documentos", tags=["Documentos"])
