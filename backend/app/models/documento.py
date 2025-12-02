"""
Modelo de base de datos para gestión de documentos.
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship

from app.database import Base


class Documento(Base):
    """
    Modelo para almacenar documentos asociados a miembros.
    
    Atributos:
        id: Identificador único del documento
        asociado_id: ID del asociado al que pertenece el documento
        nombre_archivo: Nombre original del archivo
        nombre_almacenado: Nombre con el que se almacena (UUID + extensión)
        tipo_documento: Tipo de documento (cédula, comprobante_ingresos, etc.)
        mime_type: Tipo MIME del archivo
        tamano_bytes: Tamaño del archivo en bytes
        ruta_almacenamiento: Ruta relativa donde se almacena el archivo
        descripcion: Descripción opcional del documento
        es_valido: Si el documento ha sido validado/aprobado
        fecha_subida: Timestamp de cuándo se subió el documento
        subido_por_id: ID del usuario que subió el documento
        fecha_validacion: Timestamp de cuándo se validó el documento
        validado_por_id: ID del usuario que validó el documento
        notas_validacion: Notas sobre la validación del documento
        activo: Si el documento está activo (soft delete)
    """
    __tablename__ = "documentos"

    id = Column(Integer, primary_key=True, index=True)
    asociado_id = Column(Integer, ForeignKey("asociados.id"), nullable=False, index=True)
    
    # Información del archivo
    nombre_archivo = Column(String(255), nullable=False)
    nombre_almacenado = Column(String(255), nullable=False, unique=True)
    tipo_documento = Column(String(50), nullable=False, index=True)
    mime_type = Column(String(100), nullable=False)
    tamano_bytes = Column(Integer, nullable=False)
    ruta_almacenamiento = Column(String(500), nullable=False)
    descripcion = Column(String(500))
    
    # Control de validación
    es_valido = Column(Boolean, default=False, nullable=False)
    fecha_subida = Column(DateTime, default=datetime.utcnow, nullable=False)
    subido_por_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    fecha_validacion = Column(DateTime)
    validado_por_id = Column(Integer, ForeignKey("usuarios.id"))
    notas_validacion = Column(String(500))
    
    # Soft delete
    activo = Column(Boolean, default=True, nullable=False)
    
    # Relaciones
    asociado = relationship("Asociado", back_populates="documentos")
    subido_por = relationship("Usuario", foreign_keys=[subido_por_id])
    validado_por = relationship("Usuario", foreign_keys=[validado_por_id])

    def __repr__(self):
        return f"<Documento {self.id}: {self.tipo_documento} - {self.nombre_archivo}>"
