from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class RegistroAuditoriaBase(BaseModel):
    accion: str
    entidad: str
    entidad_id: Optional[int] = None
    descripcion: str
    datos_anteriores: Optional[str] = None
    datos_nuevos: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None


class RegistroAuditoriaCreate(RegistroAuditoriaBase):
    usuario_id: int


class RegistroAuditoriaResponse(RegistroAuditoriaBase):
    id: int
    usuario_id: int
    fecha_hora: datetime

    class Config:
        from_attributes = True


class RegistroAuditoriaFilter(BaseModel):
    """Filtros para consultar registros de auditoría"""
    usuario_id: Optional[int] = None
    accion: Optional[str] = None
    entidad: Optional[str] = None
    entidad_id: Optional[int] = None
    fecha_desde: Optional[datetime] = None
    fecha_hasta: Optional[datetime] = None
