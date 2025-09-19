from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.deps import get_current_active_user, get_current_superuser
from app.core.security import SecurityManager
from app.database import get_db
from app.schemas.usuario import (
    CambiarPassword,
    PermisoResponse,
    Token,
    UsuarioCrear,
    UsuarioEnDB,
    UsuarioLogin,
)
from app.services import usuarios as service

router = APIRouter()


@router.post("/login", response_model=Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
) -> Token:
    """
    Autenticar usuario y generar token de acceso.
    
    Acepta username/email y contraseña, retorna JWT token.
    """
    user = service.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario inactivo"
        )
    
    # Generar token
    access_token_expires = timedelta(minutes=SecurityManager.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = SecurityManager.create_access_token(
        subject=user.username,
        expires_delta=access_token_expires,
        scopes=user.permisos
    )
    
    # Actualizar último login
    service.update_last_login(db, user)
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        expires_in=SecurityManager.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UsuarioEnDB.from_orm(user)
    )


@router.post("/login-simple", response_model=Token)
def login_simple(
    credentials: UsuarioLogin,
    db: Session = Depends(get_db)
) -> Token:
    """
    Login alternativo con JSON en lugar de form data.
    """
    user = service.authenticate_user(db, credentials.username, credentials.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas"
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario inactivo"
        )
    
    access_token_expires = timedelta(minutes=SecurityManager.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = SecurityManager.create_access_token(
        subject=user.username,
        expires_delta=access_token_expires,
        scopes=user.permisos
    )
    
    service.update_last_login(db, user)
    
    return Token(
        access_token=access_token,
        token_type="bearer", 
        expires_in=SecurityManager.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UsuarioEnDB.from_orm(user)
    )


@router.get("/me", response_model=UsuarioEnDB)
def get_current_user_info(
    current_user = Depends(get_current_active_user)
) -> UsuarioEnDB:
    """
    Obtener información del usuario actual autenticado.
    """
    return UsuarioEnDB.from_orm(current_user)


@router.get("/me/permisos", response_model=PermisoResponse)
def get_current_user_permissions(
    current_user = Depends(get_current_active_user)
) -> PermisoResponse:
    """
    Obtener permisos del usuario actual.
    """
    return PermisoResponse(
        permisos=current_user.permisos,
        es_admin=current_user.rol == "admin",
        es_superuser=current_user.is_superuser
    )


@router.post("/cambiar-password")
def cambiar_password(
    passwords: CambiarPassword,
    current_user = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> dict:
    """
    Cambiar contraseña del usuario actual.
    """
    # Validar contraseña actual
    if not SecurityManager.verify_password(passwords.password_actual, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Contraseña actual incorrecta"
        )
    
    # Validar confirmación
    if passwords.password_nueva != passwords.confirmar_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Las contraseñas no coinciden"
        )
    
    # Actualizar contraseña
    service.update_password(db, current_user, passwords.password_nueva)
    
    return {"message": "Contraseña actualizada exitosamente"}


@router.post("/crear-usuario", response_model=UsuarioEnDB)
def crear_usuario(
    usuario_data: UsuarioCrear,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_superuser)
) -> UsuarioEnDB:
    """
    Crear un nuevo usuario (solo superadministradores).
    """
    try:
        nuevo_usuario = service.create_user(db, usuario_data)
        return UsuarioEnDB.from_orm(nuevo_usuario)
    except service.UserAlreadyExistsError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/logout")
def logout(current_user = Depends(get_current_active_user)) -> dict:
    """
    Cerrar sesión (invalidar token del lado cliente).
    
    Nota: Con JWT stateless, el logout se maneja principalmente del lado cliente
    eliminando el token. En futuras versiones se puede implementar blacklist.
    """
    return {"message": "Sesión cerrada exitosamente"}


@router.get("/test-auth")
def test_auth(current_user = Depends(get_current_active_user)) -> dict:
    """
    Endpoint de prueba para verificar autenticación.
    """
    return {
        "message": "Autenticación exitosa",
        "user": current_user.username,
        "rol": current_user.rol,
        "permisos": current_user.permisos
    }