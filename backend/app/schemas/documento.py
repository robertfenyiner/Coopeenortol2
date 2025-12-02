"""
Schemas Pydantic para gestión de documentos.
"""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, validator


# Tipos de documentos permitidos
TIPOS_DOCUMENTO_PERMITIDOS = [
    "cedula_ciudadania",
    "cedula_extranjeria",
    "pasaporte",
    "rut",
    "comprobante_ingresos",
    "certificado_laboral",
    "extracto_bancario",
    "declaracion_renta",
    "carta_autorizacion",
    "otro"
]

# MIME types permitidos
MIME_TYPES_PERMITIDOS = [
    "application/pdf",
    "image/jpeg",
    "image/jpg",
    "image/png",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",  # .docx
    "application/msword",  # .doc
]

# Tamaño máximo: 10 MB
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024


class DocumentoBase(BaseModel):
    """Base para documento con campos comunes."""
    tipo_documento: str = Field(..., description="Tipo de documento")
    descripcion: Optional[str] = Field(None, max_length=500, description="Descripción del documento")

    @validator("tipo_documento")
    def validar_tipo_documento(cls, v):
        if v not in TIPOS_DOCUMENTO_PERMITIDOS:
            raise ValueError(f"Tipo de documento debe ser uno de: {', '.join(TIPOS_DOCUMENTO_PERMITIDOS)}")
        return v


class DocumentoSubir(DocumentoBase):
    """Schema para subir un nuevo documento."""
    asociado_id: int = Field(..., description="ID del asociado")


class DocumentoActualizar(BaseModel):
    """Schema para actualizar información de un documento."""
    tipo_documento: Optional[str] = None
    descripcion: Optional[str] = Field(None, max_length=500)
    
    @validator("tipo_documento")
    def validar_tipo_documento(cls, v):
        if v is not None and v not in TIPOS_DOCUMENTO_PERMITIDOS:
            raise ValueError(f"Tipo de documento debe ser uno de: {', '.join(TIPOS_DOCUMENTO_PERMITIDOS)}")
        return v


class DocumentoValidar(BaseModel):
    """Schema para validar/aprobar un documento."""
    es_valido: bool = Field(..., description="Si el documento es válido")
    notas_validacion: Optional[str] = Field(None, max_length=500, description="Notas sobre la validación")


class DocumentoEnDB(DocumentoBase):
    """Schema para documento en base de datos."""
    id: int
    asociado_id: int
    nombre_archivo: str
    nombre_almacenado: str
    mime_type: str
    tamano_bytes: int
    ruta_almacenamiento: str
    es_valido: bool
    fecha_subida: datetime
    subido_por_id: int
    fecha_validacion: Optional[datetime] = None
    validado_por_id: Optional[int] = None
    notas_validacion: Optional[str] = None
    activo: bool

    class Config:
        orm_mode = True


class DocumentoConNombres(DocumentoEnDB):
    """Schema extendido con nombres de usuarios."""
    subido_por_username: Optional[str] = None
    validado_por_username: Optional[str] = None


class DocumentoListaResponse(BaseModel):
    """Response para lista de documentos."""
    total: int
    documentos: list[DocumentoEnDB]


class DocumentoUploadResponse(BaseModel):
    """Response exitoso al subir documento."""
    mensaje: str
    documento: DocumentoEnDB
