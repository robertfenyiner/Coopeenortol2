import json
from typing import Optional, Any
from datetime import datetime
from fastapi import Request
from sqlalchemy.orm import Session
from app.models.auditoria import RegistroAuditoria
from app.models.usuario import Usuario


class AuditoriaService:
    """Servicio para registrar operaciones de auditoría"""
    
    @staticmethod
    def registrar(
        db: Session,
        usuario: Usuario,
        accion: str,
        entidad: str,
        descripcion: str,
        entidad_id: Optional[int] = None,
        datos_anteriores: Optional[dict] = None,
        datos_nuevos: Optional[dict] = None,
        request: Optional[Request] = None
    ) -> RegistroAuditoria:
        """
        Registra una operación en el log de auditoría
        
        Args:
            db: Sesión de base de datos
            usuario: Usuario que realiza la acción
            accion: Tipo de acción (CREATE, UPDATE, DELETE, LOGIN, etc.)
            entidad: Tipo de entidad afectada (Usuario, Asociado, etc.)
            descripcion: Descripción de la operación
            entidad_id: ID del registro afectado
            datos_anteriores: Datos antes del cambio (serializados a JSON)
            datos_nuevos: Datos después del cambio (serializados a JSON)
            request: Request de FastAPI para obtener IP y User-Agent
        
        Returns:
            RegistroAuditoria creado
        """
        ip_address = None
        user_agent = None
        
        if request:
            ip_address = request.client.host if request.client else None
            user_agent = request.headers.get("user-agent")
        
        registro = RegistroAuditoria(
            usuario_id=usuario.id,
            accion=accion,
            entidad=entidad,
            entidad_id=entidad_id,
            descripcion=descripcion,
            datos_anteriores=json.dumps(datos_anteriores, ensure_ascii=False) if datos_anteriores else None,
            datos_nuevos=json.dumps(datos_nuevos, ensure_ascii=False) if datos_nuevos else None,
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        db.add(registro)
        db.commit()
        db.refresh(registro)
        
        return registro
    
    @staticmethod
    def registrar_login(
        db: Session,
        usuario: Usuario,
        exitoso: bool,
        request: Optional[Request] = None
    ) -> RegistroAuditoria:
        """Registra un intento de login"""
        accion = "LOGIN_EXITOSO" if exitoso else "LOGIN_FALLIDO"
        descripcion = f"Login {'exitoso' if exitoso else 'fallido'} de usuario {usuario.username}"
        
        return AuditoriaService.registrar(
            db=db,
            usuario=usuario,
            accion=accion,
            entidad="Usuario",
            entidad_id=usuario.id,
            descripcion=descripcion,
            request=request
        )
    
    @staticmethod
    def registrar_cambio_password(
        db: Session,
        usuario: Usuario,
        request: Optional[Request] = None
    ) -> RegistroAuditoria:
        """Registra un cambio de contraseña"""
        return AuditoriaService.registrar(
            db=db,
            usuario=usuario,
            accion="CAMBIO_PASSWORD",
            entidad="Usuario",
            entidad_id=usuario.id,
            descripcion=f"Cambio de contraseña para usuario {usuario.username}",
            request=request
        )
    
    @staticmethod
    def registrar_creacion(
        db: Session,
        usuario: Usuario,
        entidad: str,
        entidad_id: int,
        datos: dict,
        request: Optional[Request] = None
    ) -> RegistroAuditoria:
        """Registra la creación de una entidad"""
        return AuditoriaService.registrar(
            db=db,
            usuario=usuario,
            accion="CREATE",
            entidad=entidad,
            entidad_id=entidad_id,
            descripcion=f"Creación de {entidad} con ID {entidad_id}",
            datos_nuevos=datos,
            request=request
        )
    
    @staticmethod
    def registrar_actualizacion(
        db: Session,
        usuario: Usuario,
        entidad: str,
        entidad_id: int,
        datos_anteriores: dict,
        datos_nuevos: dict,
        request: Optional[Request] = None
    ) -> RegistroAuditoria:
        """Registra la actualización de una entidad"""
        # Detectar qué campos cambiaron
        campos_modificados = []
        for key in datos_nuevos:
            if key in datos_anteriores and datos_anteriores[key] != datos_nuevos[key]:
                campos_modificados.append(key)
        
        descripcion = f"Actualización de {entidad} ID {entidad_id}. Campos modificados: {', '.join(campos_modificados)}"
        
        return AuditoriaService.registrar(
            db=db,
            usuario=usuario,
            accion="UPDATE",
            entidad=entidad,
            entidad_id=entidad_id,
            descripcion=descripcion,
            datos_anteriores=datos_anteriores,
            datos_nuevos=datos_nuevos,
            request=request
        )
    
    @staticmethod
    def registrar_eliminacion(
        db: Session,
        usuario: Usuario,
        entidad: str,
        entidad_id: int,
        datos: dict,
        request: Optional[Request] = None
    ) -> RegistroAuditoria:
        """Registra la eliminación de una entidad"""
        return AuditoriaService.registrar(
            db=db,
            usuario=usuario,
            accion="DELETE",
            entidad=entidad,
            entidad_id=entidad_id,
            descripcion=f"Eliminación de {entidad} con ID {entidad_id}",
            datos_anteriores=datos,
            request=request
        )
