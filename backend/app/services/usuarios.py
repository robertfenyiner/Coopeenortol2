from datetime import datetime
from typing import Optional

from sqlalchemy.orm import Session

from app.core.security import SecurityManager
from app.models.usuario import Usuario
from app.schemas.usuario import UsuarioCrear


class UserAlreadyExistsError(Exception):
    """Se lanza cuando el usuario ya existe."""


def authenticate_user(db: Session, username: str, password: str) -> Optional[Usuario]:
    """
    Autenticar usuario por username/email y contraseña.
    
    Args:
        db: Sesión de base de datos
        username: Username o email del usuario
        password: Contraseña en texto plano
        
    Returns:
        Usuario autenticado o None si las credenciales son incorrectas
    """
    # Buscar por username o email
    user = db.query(Usuario).filter(
        (Usuario.username == username) | (Usuario.email == username)
    ).first()
    
    if not user:
        return None
        
    if not SecurityManager.verify_password(password, user.hashed_password):
        return None
        
    return user


def get_user_by_username(db: Session, username: str) -> Optional[Usuario]:
    """Obtener usuario por username."""
    return db.query(Usuario).filter(Usuario.username == username).first()


def get_user_by_email(db: Session, email: str) -> Optional[Usuario]:
    """Obtener usuario por email."""
    return db.query(Usuario).filter(Usuario.email == email).first()


def get_user_by_id(db: Session, user_id: int) -> Optional[Usuario]:
    """Obtener usuario por ID."""
    return db.query(Usuario).filter(Usuario.id == user_id).first()


def create_user(db: Session, user_data: UsuarioCrear) -> Usuario:
    """
    Crear un nuevo usuario.
    
    Args:
        db: Sesión de base de datos
        user_data: Datos del usuario a crear
        
    Returns:
        Usuario creado
        
    Raises:
        UserAlreadyExistsError: Si el username o email ya existen
    """
    # Verificar que username no exista
    if get_user_by_username(db, user_data.username):
        raise UserAlreadyExistsError("El nombre de usuario ya existe")
        
    # Verificar que email no exista
    if get_user_by_email(db, user_data.email):
        raise UserAlreadyExistsError("El email ya está registrado")
    
    # Crear usuario
    hashed_password = SecurityManager.hash_password(user_data.password)
    
    db_user = Usuario(
        username=user_data.username,
        email=user_data.email,
        nombre_completo=user_data.nombre_completo,
        hashed_password=hashed_password,
        rol=user_data.rol,
        telefono=user_data.telefono,
        descripcion=user_data.descripcion,
        is_active=True,
        is_superuser=False
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return db_user


def update_last_login(db: Session, user: Usuario) -> None:
    """
    Actualizar timestamp del último login.
    
    Args:
        db: Sesión de base de datos
        user: Usuario a actualizar
    """
    user.last_login = datetime.utcnow()
    db.add(user)
    db.commit()


def update_password(db: Session, user: Usuario, new_password: str) -> None:
    """
    Actualizar contraseña de usuario.
    
    Args:
        db: Sesión de base de datos
        user: Usuario a actualizar
        new_password: Nueva contraseña en texto plano
    """
    hashed_password = SecurityManager.hash_password(new_password)
    user.hashed_password = hashed_password
    db.add(user)
    db.commit()


def create_superuser(db: Session, username: str, email: str, password: str, nombre_completo: str) -> Usuario:
    """
    Crear usuario superadministrador.
    
    Args:
        db: Sesión de base de datos
        username: Nombre de usuario
        email: Email del usuario
        password: Contraseña
        nombre_completo: Nombre completo
        
    Returns:
        Usuario superadministrador creado
    """
    hashed_password = SecurityManager.hash_password(password)
    
    db_user = Usuario(
        username=username,
        email=email,
        nombre_completo=nombre_completo,
        hashed_password=hashed_password,
        rol="admin",
        is_active=True,
        is_superuser=True,
        descripcion="Usuario superadministrador del sistema"
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return db_user


def deactivate_user(db: Session, user: Usuario) -> Usuario:
    """
    Desactivar usuario.
    
    Args:
        db: Sesión de base de datos
        user: Usuario a desactivar
        
    Returns:
        Usuario desactivado
    """
    user.is_active = False
    db.add(user)
    db.commit()
    db.refresh(user)
    
    return user


def activate_user(db: Session, user: Usuario) -> Usuario:
    """
    Activar usuario.
    
    Args:
        db: Sesión de base de datos
        user: Usuario a activar
        
    Returns:
        Usuario activado
    """
    user.is_active = True
    db.add(user)
    db.commit()
    db.refresh(user)
    
    return user