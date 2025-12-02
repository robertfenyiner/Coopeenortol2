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
    UsuarioActualizar,
    UsuarioCrear,
    UsuarioEnDB,
    UsuarioLogin,
)
from app.services import usuarios as service
from app.services.auditoria import AuditoriaService

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
    
    # Registrar login exitoso en auditoría
    AuditoriaService.registrar_login(db=db, usuario=user, exitoso=True, request=None)
    
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
    
    # Registrar login exitoso en auditoría
    AuditoriaService.registrar_login(db=db, usuario=user, exitoso=True, request=None)
    
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
    
    # Registrar cambio de contraseña en auditoría
    AuditoriaService.registrar_cambio_password(db=db, usuario=current_user, request=None)
    
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
        
        # Registrar creación en auditoría
        AuditoriaService.registrar_creacion(
            db=db,
            usuario=current_user,
            entidad="Usuario",
            entidad_id=nuevo_usuario.id,
            datos={"username": nuevo_usuario.username, "email": nuevo_usuario.email, "rol": nuevo_usuario.rol},
            request=None
        )
        
        return UsuarioEnDB.from_orm(nuevo_usuario)
    except service.UserAlreadyExistsError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/usuarios", response_model=list[UsuarioEnDB])
def listar_usuarios(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_superuser)
) -> list[UsuarioEnDB]:
    """
    Listar todos los usuarios (solo superadministradores).
    """
    usuarios = service.get_all_users(db, skip=skip, limit=limit)
    return [UsuarioEnDB.from_orm(usuario) for usuario in usuarios]


@router.get("/usuarios/{user_id}", response_model=UsuarioEnDB)
def obtener_usuario(
    user_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_superuser)
) -> UsuarioEnDB:
    """
    Obtener información de un usuario específico (solo superadministradores).
    """
    usuario = service.get_user_by_id(db, user_id)
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    return UsuarioEnDB.from_orm(usuario)


@router.put("/usuarios/{user_id}", response_model=UsuarioEnDB)
def actualizar_usuario(
    user_id: int,
    usuario_data: UsuarioActualizar,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_superuser)
) -> UsuarioEnDB:
    """
    Actualizar información de un usuario existente (solo superadministradores).
    """
    usuario = service.get_user_by_id(db, user_id)
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    
    # Guardar datos anteriores para auditoría
    datos_anteriores = {
        "username": usuario.username,
        "email": usuario.email,
        "rol": usuario.rol,
        "is_active": usuario.is_active
    }
    
    try:
        usuario_actualizado = service.update_user(db, usuario, usuario_data)
        
        # Registrar actualización en auditoría
        datos_nuevos = {
            "username": usuario_actualizado.username,
            "email": usuario_actualizado.email,
            "rol": usuario_actualizado.rol,
            "is_active": usuario_actualizado.is_active
        }
        
        AuditoriaService.registrar_actualizacion(
            db=db,
            usuario=current_user,
            entidad="Usuario",
            entidad_id=usuario_actualizado.id,
            datos_anteriores=datos_anteriores,
            datos_nuevos=datos_nuevos,
            request=None
        )
        
        return UsuarioEnDB.from_orm(usuario_actualizado)
    except service.UserAlreadyExistsError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.delete("/usuarios/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_usuario(
    user_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_superuser)
):
    """
    Desactivar un usuario (solo superadministradores).
    """
    usuario = service.get_user_by_id(db, user_id)
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    
    # No permitir eliminar el propio usuario
    if usuario.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No puedes desactivar tu propio usuario"
        )
    
    # Guardar datos antes de desactivar
    datos_usuario = {
        "username": usuario.username,
        "email": usuario.email,
        "rol": usuario.rol
    }
    
    service.deactivate_user(db, usuario)
    
    # Registrar eliminación en auditoría
    AuditoriaService.registrar_eliminacion(
        db=db,
        usuario=current_user,
        entidad="Usuario",
        entidad_id=usuario.id,
        datos=datos_usuario,
        request=None
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
