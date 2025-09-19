from datetime import datetime, timedelta
from typing import Any, Optional, Union

import bcrypt
import jwt
from jwt import PyJWTError

from app.core.config import settings


class SecurityManager:
    """Manejador de seguridad para autenticación y autorización."""
    
    ALGORITHM = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES = 30
    
    @staticmethod
    def create_access_token(
        subject: Union[str, Any], 
        expires_delta: Optional[timedelta] = None,
        scopes: Optional[list] = None
    ) -> str:
        """
        Crear un token JWT de acceso.
        
        Args:
            subject: El sujeto del token (generalmente user_id o username)
            expires_delta: Tiempo de expiración personalizado
            scopes: Lista de permisos/scopes del usuario
            
        Returns:
            Token JWT codificado
        """
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(
                minutes=SecurityManager.ACCESS_TOKEN_EXPIRE_MINUTES
            )
        
        to_encode = {
            "exp": expire,
            "sub": str(subject),
            "iat": datetime.utcnow(),
            "scopes": scopes or []
        }
        
        encoded_jwt = jwt.encode(
            to_encode, 
            settings.secret_key, 
            algorithm=SecurityManager.ALGORITHM
        )
        return encoded_jwt

    @staticmethod
    def verify_token(token: str) -> Optional[dict]:
        """
        Verificar y decodificar un token JWT.
        
        Args:
            token: Token JWT a verificar
            
        Returns:
            Payload del token si es válido, None si no es válido
        """
        try:
            payload = jwt.decode(
                token, 
                settings.secret_key, 
                algorithms=[SecurityManager.ALGORITHM]
            )
            return payload
        except PyJWTError:
            return None

    @staticmethod
    def hash_password(password: str) -> str:
        """
        Generar hash de contraseña usando bcrypt.
        
        Args:
            password: Contraseña en texto plano
            
        Returns:
            Hash de la contraseña
        """
        password_bytes = password.encode('utf-8')
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password_bytes, salt)
        return hashed.decode('utf-8')

    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """
        Verificar una contraseña contra su hash.
        
        Args:
            plain_password: Contraseña en texto plano
            hashed_password: Hash almacenado de la contraseña
            
        Returns:
            True si la contraseña es correcta, False si no
        """
        password_bytes = plain_password.encode('utf-8')
        hashed_bytes = hashed_password.encode('utf-8')
        return bcrypt.checkpw(password_bytes, hashed_bytes)

    @staticmethod
    def generate_password_reset_token(email: str) -> str:
        """
        Generar token para reset de contraseña.
        
        Args:
            email: Email del usuario
            
        Returns:
            Token para reset de contraseña
        """
        delta = timedelta(hours=settings.email_reset_token_expire_hours)
        now = datetime.utcnow()
        expires = now + delta
        exp = expires.timestamp()
        encoded_jwt = jwt.encode(
            {"exp": exp, "nbf": now, "sub": email},
            settings.secret_key,
            algorithm=SecurityManager.ALGORITHM,
        )
        return encoded_jwt

    @staticmethod
    def verify_password_reset_token(token: str) -> Optional[str]:
        """
        Verificar token de reset de contraseña.
        
        Args:
            token: Token de reset
            
        Returns:
            Email del usuario si el token es válido, None si no
        """
        try:
            decoded_token = jwt.decode(
                token, 
                settings.secret_key, 
                algorithms=[SecurityManager.ALGORITHM]
            )
            return decoded_token["sub"]
        except PyJWTError:
            return None