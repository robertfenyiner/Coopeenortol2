from typing import Generator, Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.core.security import SecurityManager
from app.database import get_db
from app.models.usuario import Usuario
from app.schemas.usuario import TokenData

# Configurar esquema de seguridad Bearer
security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> Usuario:
    """
    Obtener el usuario actual desde el token JWT.
    
    Args:
        credentials: Credenciales Bearer del header Authorization
        db: Sesión de base de datos
        
    Returns:
        Usuario autenticado
        
    Raises:
        HTTPException: Si el token es inválido o el usuario no existe
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudieron validar las credenciales",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # Verificar token
        token = credentials.credentials
        payload = SecurityManager.verify_token(token)
        if payload is None:
            raise credentials_exception
            
        # Extraer datos del token
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
            
        token_data = TokenData(username=username)
    except Exception:
        raise credentials_exception
    
    # Buscar usuario en base de datos
    user = db.query(Usuario).filter(Usuario.username == token_data.username).first()
    if user is None:
        raise credentials_exception
        
    # Verificar que el usuario esté activo
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario inactivo"
        )
    
    return user


def get_current_active_user(
    current_user: Usuario = Depends(get_current_user),
) -> Usuario:
    """
    Obtener usuario actual activo.
    
    Args:
        current_user: Usuario actual desde get_current_user
        
    Returns:
        Usuario activo
        
    Raises:
        HTTPException: Si el usuario está inactivo
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Usuario inactivo"
        )
    return current_user


def get_current_superuser(
    current_user: Usuario = Depends(get_current_user),
) -> Usuario:
    """
    Obtener usuario superadministrador actual.
    
    Args:
        current_user: Usuario actual desde get_current_user
        
    Returns:
        Usuario superadministrador
        
    Raises:
        HTTPException: Si el usuario no es superadministrador
    """
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tiene permisos suficientes"
        )
    return current_user


def require_permission(permission: str):
    """
    Decorador para requerir un permiso específico.
    
    Args:
        permission: Permiso requerido (ej: "asociados:crear")
        
    Returns:
        Función de dependencia que valida el permiso
    """
    def permission_checker(current_user: Usuario = Depends(get_current_active_user)) -> Usuario:
        if not current_user.tiene_permiso(permission):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"No tiene el permiso requerido: {permission}"
            )
        return current_user
    
    return permission_checker


def require_role(role: str):
    """
    Decorador para requerir un rol específico.
    
    Args:
        role: Rol requerido (admin, analista, auditor)
        
    Returns:
        Función de dependencia que valida el rol
    """
    def role_checker(current_user: Usuario = Depends(get_current_active_user)) -> Usuario:
        if current_user.rol != role and not current_user.is_superuser:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Se requiere rol: {role}"
            )
        return current_user
    
    return role_checker


# Dependencias comunes pre-configuradas
RequireAdmin = Depends(require_role("admin"))
RequireAnalista = Depends(require_role("analista"))
RequireAuditor = Depends(require_role("auditor"))

# Permisos específicos para asociados
RequireAsociadosCrear = Depends(require_permission("asociados:crear"))
RequireAsociadosLeer = Depends(require_permission("asociados:leer"))
RequireAsociadosActualizar = Depends(require_permission("asociados:actualizar"))
RequireAsociadosEliminar = Depends(require_permission("asociados:eliminar"))