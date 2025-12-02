import json
from datetime import date, datetime
from typing import Any

from sqlalchemy import Column, Date, DateTime, Integer, String, Text
from sqlalchemy.ext.mutable import MutableDict
from sqlalchemy.orm import relationship
from sqlalchemy.types import TEXT, TypeDecorator

from app.database import Base


def _json_serializer(value: Any) -> Any:
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    return value


class JSONEncodedDict(TypeDecorator):
    impl = TEXT
    cache_ok = True

    def process_bind_param(self, value, dialect):  # type: ignore[override]
        if value is None:
            return None
        return json.dumps(value, default=_json_serializer)

    def process_result_value(self, value, dialect):  # type: ignore[override]
        if value is None:
            return None
        return json.loads(value)


class Asociado(Base):
    __tablename__ = "asociados"

    id = Column(Integer, primary_key=True, index=True)
    tipo_documento = Column(String(10), nullable=False)
    numero_documento = Column(String(30), nullable=False, unique=True, index=True)
    nombres = Column(String(150), nullable=False)
    apellidos = Column(String(150), nullable=False)
    correo_electronico = Column(String(200), nullable=False)
    telefono_principal = Column(String(50), nullable=True)
    estado = Column(String(30), nullable=False, default="activo")
    fecha_ingreso = Column(Date, nullable=False)
    hoja_vida_url = Column(String(500), nullable=True)
    foto_url = Column(String(500), nullable=True)
    observaciones = Column(Text, nullable=True)
    datos_personales = Column(MutableDict.as_mutable(JSONEncodedDict), default=dict)
    datos_laborales = Column(MutableDict.as_mutable(JSONEncodedDict), default=dict)
    informacion_familiar = Column(MutableDict.as_mutable(JSONEncodedDict), default=dict)
    informacion_financiera = Column(MutableDict.as_mutable(JSONEncodedDict), default=dict)
    informacion_academica = Column(MutableDict.as_mutable(JSONEncodedDict), default=dict)
    informacion_vivienda = Column(MutableDict.as_mutable(JSONEncodedDict), default=dict)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )
    
    # Relaciones
    documentos = relationship("Documento", back_populates="asociado")
    creditos = relationship("Credito", back_populates="asociado")
