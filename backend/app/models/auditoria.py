from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class RegistroAuditoria(Base):
    """Modelo para almacenar registros de auditoría de todas las operaciones"""
    __tablename__ = "registros_auditoria"

    id = Column(Integer, primary_key=True, index=True)
    
    # Información del usuario que realizó la acción
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    usuario = relationship("Usuario")
    
    # Tipo de acción realizada
    accion = Column(String(50), nullable=False, index=True)  # CREATE, UPDATE, DELETE, LOGIN, etc.
    
    # Entidad afectada
    entidad = Column(String(100), nullable=False, index=True)  # Usuario, Asociado, Cuenta, etc.
    entidad_id = Column(Integer, nullable=True)  # ID del registro afectado
    
    # Detalles de la operación
    descripcion = Column(Text, nullable=False)
    datos_anteriores = Column(Text, nullable=True)  # JSON con datos antes del cambio
    datos_nuevos = Column(Text, nullable=True)  # JSON con datos después del cambio
    
    # Información adicional
    ip_address = Column(String(45), nullable=True)  # IPv4 o IPv6
    user_agent = Column(String(500), nullable=True)
    
    # Timestamp
    fecha_hora = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    
    def __repr__(self):
        return f"<RegistroAuditoria(id={self.id}, usuario_id={self.usuario_id}, accion={self.accion}, entidad={self.entidad})>"
