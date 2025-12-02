from datetime import datetime
from enum import Enum
from typing import List

from sqlalchemy import Boolean, Column, DateTime, Integer, String, Text
from sqlalchemy.orm import relationship

from app.database import Base


class RolUsuario(str, Enum):
    """Roles disponibles en el sistema."""
    ADMIN = "admin"
    ANALISTA = "analista"
    AUDITOR = "auditor"


class Usuario(Base):
    """Modelo para usuarios del sistema administrativo."""
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(200), unique=True, nullable=False, index=True)
    nombre_completo = Column(String(200), nullable=False)
    hashed_password = Column(Text, nullable=False)
    rol = Column(String(20), nullable=False, default=RolUsuario.ANALISTA.value)
    
    # Estados
    is_active = Column(Boolean, default=True, nullable=False)
    is_superuser = Column(Boolean, default=False, nullable=False)
    
    # Auditoría
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )
    last_login = Column(DateTime, nullable=True)
    
    # Información adicional
    descripcion = Column(Text, nullable=True)
    telefono = Column(String(20), nullable=True)
    
    def __repr__(self) -> str:
        return f"<Usuario(username='{self.username}', rol='{self.rol}')>"
    
    @property
    def permisos(self) -> List[str]:
        """Retorna lista de permisos según el rol."""
        if self.rol == RolUsuario.ADMIN or self.is_superuser:
            return [
                "asociados:crear",
                "asociados:leer", 
                "asociados:actualizar",
                "asociados:eliminar",
                "documentos:crear",
                "documentos:leer",
                "documentos:actualizar",
                "documentos:eliminar",
                "documentos:validar",
                "usuarios:crear",
                "usuarios:leer",
                "usuarios:actualizar", 
                "usuarios:eliminar",
                "reportes:generar",
                "configuracion:leer",
                "configuracion:actualizar"
            ]
        elif self.rol == RolUsuario.ANALISTA:
            return [
                "asociados:crear",
                "asociados:leer",
                "asociados:actualizar",
                "documentos:crear",
                "documentos:leer",
                "documentos:actualizar",
                "reportes:generar"
            ]
        elif self.rol == RolUsuario.AUDITOR:
            return [
                "asociados:leer",
                "documentos:leer",
                "reportes:generar"
            ]
        return []
    
    def tiene_permiso(self, permiso: str) -> bool:
        """Verifica si el usuario tiene un permiso específico."""
        return permiso in self.permisos or self.is_superuser