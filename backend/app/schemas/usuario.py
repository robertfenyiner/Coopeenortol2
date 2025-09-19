from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, EmailStr, Field


class UsuarioBase(BaseModel):
    """Schema base para Usuario."""
    username: str = Field(..., min_length=3, max_length=50, description="Nombre de usuario único")
    email: EmailStr = Field(..., description="Correo electrónico único")
    nombre_completo: str = Field(..., min_length=2, max_length=200, description="Nombre completo del usuario")
    rol: str = Field(default="analista", description="Rol del usuario (admin, analista, auditor)")
    telefono: Optional[str] = Field(None, max_length=20, description="Número de teléfono")
    descripcion: Optional[str] = Field(None, description="Descripción o cargo del usuario")


class UsuarioCrear(UsuarioBase):
    """Schema para crear un nuevo usuario."""
    password: str = Field(..., min_length=8, description="Contraseña (mínimo 8 caracteres)")


class UsuarioActualizar(BaseModel):
    """Schema para actualizar un usuario existente."""
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    email: Optional[EmailStr] = None
    nombre_completo: Optional[str] = Field(None, min_length=2, max_length=200)
    rol: Optional[str] = None
    telefono: Optional[str] = Field(None, max_length=20)
    descripcion: Optional[str] = None
    is_active: Optional[bool] = None
    password: Optional[str] = Field(None, min_length=8, description="Nueva contraseña (opcional)")


class UsuarioEnDB(UsuarioBase):
    """Schema para usuario retornado desde la base de datos."""
    id: int
    is_active: bool
    is_superuser: bool
    created_at: datetime
    updated_at: datetime
    last_login: Optional[datetime] = None
    permisos: List[str] = Field(description="Lista de permisos del usuario")

    class Config:
        orm_mode = True


class UsuarioLogin(BaseModel):
    """Schema para login de usuario."""
    username: str = Field(..., description="Nombre de usuario o email")
    password: str = Field(..., description="Contraseña")


class Token(BaseModel):
    """Schema para token de autenticación."""
    access_token: str = Field(..., description="Token de acceso JWT")
    token_type: str = Field(default="bearer", description="Tipo de token")
    expires_in: int = Field(..., description="Tiempo de expiración en segundos")
    user: UsuarioEnDB = Field(..., description="Información del usuario autenticado")


class TokenData(BaseModel):
    """Schema para datos dentro del token JWT."""
    username: Optional[str] = None
    user_id: Optional[int] = None
    scopes: List[str] = []


class CambiarPassword(BaseModel):
    """Schema para cambio de contraseña."""
    password_actual: str = Field(..., description="Contraseña actual")
    password_nueva: str = Field(..., min_length=8, description="Nueva contraseña")
    confirmar_password: str = Field(..., description="Confirmación de nueva contraseña")


class PermisoResponse(BaseModel):
    """Schema para respuesta de permisos de usuario."""
    permisos: List[str] = Field(description="Lista de permisos del usuario")
    es_admin: bool = Field(description="Indica si el usuario es administrador")
    es_superuser: bool = Field(description="Indica si el usuario es superusuario")