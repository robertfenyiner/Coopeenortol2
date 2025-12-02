"""
Sistema de permisos y decoradores para control de acceso.
"""
from functools import wraps
from typing import List, Callable

from fastapi import HTTPException, status

from app.models.usuario import Usuario


class PermissionDenied(HTTPException):
    """Excepción personalizada para permisos denegados."""
    
    def __init__(self, detail: str = "No tienes permisos para realizar esta acción"):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=detail
        )


def require_permissions(*required_permissions: str):
    """
    Decorador para verificar que el usuario tenga los permisos requeridos.
    
    Uso:
        @require_permissions("asociados:crear", "asociados:actualizar")
        def mi_endpoint(current_user: Usuario = Depends(get_current_user)):
            ...
    
    Args:
        *required_permissions: Lista de permisos requeridos (OR lógico)
    """
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Buscar el current_user en los kwargs
            current_user = kwargs.get('current_user')
            
            if not current_user:
                # Intentar encontrarlo en args (depende del orden de parámetros)
                for arg in args:
                    if isinstance(arg, Usuario):
                        current_user = arg
                        break
            
            if not current_user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="No autenticado"
                )
            
            # Los superusuarios tienen todos los permisos
            if current_user.is_superuser:
                return await func(*args, **kwargs)
            
            # Verificar si el usuario tiene al menos uno de los permisos requeridos
            user_permissions = set(current_user.permisos)
            required = set(required_permissions)
            
            if not user_permissions.intersection(required):
                raise PermissionDenied(
                    f"Se requiere uno de estos permisos: {', '.join(required_permissions)}"
                )
            
            return await func(*args, **kwargs)
        
        return wrapper
    return decorator


def require_all_permissions(*required_permissions: str):
    """
    Decorador para verificar que el usuario tenga TODOS los permisos requeridos.
    
    Uso:
        @require_all_permissions("usuarios:crear", "usuarios:actualizar")
        def mi_endpoint(current_user: Usuario = Depends(get_current_user)):
            ...
    
    Args:
        *required_permissions: Lista de permisos requeridos (AND lógico)
    """
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            current_user = kwargs.get('current_user')
            
            if not current_user:
                for arg in args:
                    if isinstance(arg, Usuario):
                        current_user = arg
                        break
            
            if not current_user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="No autenticado"
                )
            
            # Los superusuarios tienen todos los permisos
            if current_user.is_superuser:
                return await func(*args, **kwargs)
            
            # Verificar si el usuario tiene todos los permisos requeridos
            user_permissions = set(current_user.permisos)
            required = set(required_permissions)
            
            if not required.issubset(user_permissions):
                missing = required - user_permissions
                raise PermissionDenied(
                    f"Permisos faltantes: {', '.join(missing)}"
                )
            
            return await func(*args, **kwargs)
        
        return wrapper
    return decorator


def require_role(*allowed_roles: str):
    """
    Decorador para verificar que el usuario tenga uno de los roles permitidos.
    
    Uso:
        @require_role("admin", "analista")
        def mi_endpoint(current_user: Usuario = Depends(get_current_user)):
            ...
    
    Args:
        *allowed_roles: Lista de roles permitidos
    """
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            current_user = kwargs.get('current_user')
            
            if not current_user:
                for arg in args:
                    if isinstance(arg, Usuario):
                        current_user = arg
                        break
            
            if not current_user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="No autenticado"
                )
            
            # Los superusuarios siempre tienen acceso
            if current_user.is_superuser:
                return await func(*args, **kwargs)
            
            if current_user.rol not in allowed_roles:
                raise PermissionDenied(
                    f"Se requiere uno de estos roles: {', '.join(allowed_roles)}"
                )
            
            return await func(*args, **kwargs)
        
        return wrapper
    return decorator


def can_modify_user(current_user: Usuario, target_user: Usuario) -> bool:
    """
    Verifica si el usuario actual puede modificar al usuario objetivo.
    
    Reglas:
    - Los superusuarios pueden modificar a cualquiera
    - Los admins pueden modificar a analistas y auditores, pero no a otros admins
    - Un usuario puede modificarse a sí mismo (datos básicos)
    
    Args:
        current_user: Usuario que intenta hacer la modificación
        target_user: Usuario que será modificado
        
    Returns:
        bool: True si puede modificar, False en caso contrario
    """
    # Superusuarios pueden todo
    if current_user.is_superuser:
        return True
    
    # Un usuario puede modificarse a sí mismo
    if current_user.id == target_user.id:
        return True
    
    # Admins pueden modificar a roles inferiores
    if current_user.rol == "admin" and target_user.rol in ["analista", "auditor"]:
        return True
    
    return False
