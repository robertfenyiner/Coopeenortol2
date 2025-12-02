"""
Endpoints para gestión de documentos.
"""
from typing import Optional

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    UploadFile,
    status,
    Query
)
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.deps import get_current_active_user, require_permission
from app.core.file_storage import FileStorageManager
from app.database import get_db
from app.models.usuario import Usuario
from app.schemas.documento import (
    DocumentoEnDB,
    DocumentoListaResponse,
    DocumentoSubir,
    DocumentoActualizar,
    DocumentoValidar,
    DocumentoUploadResponse,
    TIPOS_DOCUMENTO_PERMITIDOS
)
from app.services.documentos import DocumentoService
from app.services.auditoria import AuditoriaService

router = APIRouter()

# Inicializar sistema de almacenamiento
FileStorageManager.initialize_storage()


@router.post("/subir", response_model=DocumentoUploadResponse, status_code=status.HTTP_201_CREATED)
async def subir_documento(
    file: UploadFile = File(..., description="Archivo a subir"),
    asociado_id: int = Form(..., description="ID del asociado"),
    tipo_documento: str = Form(..., description="Tipo de documento"),
    descripcion: Optional[str] = Form(None, description="Descripción del documento"),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_permission("documentos:crear"))
):
    """
    Subir un nuevo documento para un asociado.
    
    Requiere permiso: documentos:crear
    
    Tipos de documento permitidos:
    - cedula_ciudadania
    - cedula_extranjeria
    - pasaporte
    - rut
    - comprobante_ingresos
    - certificado_laboral
    - extracto_bancario
    - declaracion_renta
    - carta_autorizacion
    - otro
    
    Formatos permitidos: PDF, JPG, PNG, DOC, DOCX
    Tamaño máximo: 10 MB
    """
    # Validar tipo de documento
    if tipo_documento not in TIPOS_DOCUMENTO_PERMITIDOS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Tipo de documento inválido. Tipos permitidos: {', '.join(TIPOS_DOCUMENTO_PERMITIDOS)}"
        )
    
    # Crear objeto de datos
    data = DocumentoSubir(
        asociado_id=asociado_id,
        tipo_documento=tipo_documento,
        descripcion=descripcion
    )
    
    # Crear documento
    documento = await DocumentoService.crear_documento(
        db=db,
        file=file,
        data=data,
        usuario_id=current_user.id
    )
    
    # Registrar en auditoría
    AuditoriaService.registrar_creacion(
        db=db,
        usuario=current_user,
        entidad="Documento",
        entidad_id=documento.id,
        datos={
            "nombre_archivo": documento.nombre_archivo,
            "tipo_documento": documento.tipo_documento,
            "asociado_id": documento.asociado_id
        },
        request=None
    )
    
    return DocumentoUploadResponse(
        mensaje="Documento subido exitosamente",
        documento=DocumentoEnDB.from_orm(documento)
    )


@router.get("/", response_model=DocumentoListaResponse)
def listar_documentos(
    asociado_id: Optional[int] = Query(None, description="Filtrar por asociado"),
    tipo_documento: Optional[str] = Query(None, description="Filtrar por tipo de documento"),
    es_valido: Optional[bool] = Query(None, description="Filtrar por estado de validación"),
    skip: int = Query(default=0, ge=0, description="Registros a saltar"),
    limit: int = Query(default=100, ge=1, le=1000, description="Máximo de registros"),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_permission("documentos:leer"))
):
    """
    Listar documentos con filtros opcionales.
    
    Requiere permiso: documentos:leer
    """
    documentos, total = DocumentoService.listar_documentos(
        db=db,
        asociado_id=asociado_id,
        tipo_documento=tipo_documento,
        es_valido=es_valido,
        skip=skip,
        limit=limit
    )
    
    return DocumentoListaResponse(
        total=total,
        documentos=[DocumentoEnDB.from_orm(doc) for doc in documentos]
    )


@router.get("/{documento_id}", response_model=DocumentoEnDB)
def obtener_documento(
    documento_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_permission("documentos:leer"))
):
    """
    Obtener información de un documento específico.
    
    Requiere permiso: documentos:leer
    """
    documento = DocumentoService.obtener_documento(db, documento_id)
    if not documento:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Documento no encontrado"
        )
    
    return DocumentoEnDB.from_orm(documento)


@router.get("/{documento_id}/descargar")
async def descargar_documento(
    documento_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_permission("documentos:leer"))
):
    """
    Descargar un documento.
    
    Requiere permiso: documentos:leer
    """
    documento = DocumentoService.obtener_documento(db, documento_id)
    if not documento:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Documento no encontrado"
        )
    
    # Obtener ruta del archivo
    file_path = FileStorageManager.get_file_path(documento.ruta_almacenamiento)
    if not file_path:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Archivo no encontrado en el sistema"
        )
    
    # Registrar descarga en auditoría
    AuditoriaService.registrar_acceso(
        db=db,
        usuario=current_user,
        entidad="Documento",
        entidad_id=documento.id,
        detalles=f"Descarga de {documento.nombre_archivo}",
        request=None
    )
    
    return FileResponse(
        path=file_path,
        filename=documento.nombre_archivo,
        media_type=documento.mime_type
    )


@router.put("/{documento_id}", response_model=DocumentoEnDB)
def actualizar_documento(
    documento_id: int,
    data: DocumentoActualizar,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_permission("documentos:actualizar"))
):
    """
    Actualizar información de un documento.
    
    Requiere permiso: documentos:actualizar
    """
    documento = DocumentoService.obtener_documento(db, documento_id)
    if not documento:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Documento no encontrado"
        )
    
    # Guardar datos anteriores
    datos_anteriores = {
        "tipo_documento": documento.tipo_documento,
        "descripcion": documento.descripcion
    }
    
    # Actualizar
    documento_actualizado = DocumentoService.actualizar_documento(db, documento, data)
    
    # Registrar en auditoría
    datos_nuevos = {
        "tipo_documento": documento_actualizado.tipo_documento,
        "descripcion": documento_actualizado.descripcion
    }
    
    AuditoriaService.registrar_actualizacion(
        db=db,
        usuario=current_user,
        entidad="Documento",
        entidad_id=documento_actualizado.id,
        datos_anteriores=datos_anteriores,
        datos_nuevos=datos_nuevos,
        request=None
    )
    
    return DocumentoEnDB.from_orm(documento_actualizado)


@router.post("/{documento_id}/validar", response_model=DocumentoEnDB)
def validar_documento(
    documento_id: int,
    data: DocumentoValidar,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_permission("documentos:validar"))
):
    """
    Validar/aprobar un documento.
    
    Requiere permiso: documentos:validar
    """
    documento = DocumentoService.obtener_documento(db, documento_id)
    if not documento:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Documento no encontrado"
        )
    
    # Validar documento
    documento_validado = DocumentoService.validar_documento(
        db=db,
        documento=documento,
        data=data,
        validador_id=current_user.id
    )
    
    # Registrar en auditoría
    AuditoriaService.registrar_actualizacion(
        db=db,
        usuario=current_user,
        entidad="Documento",
        entidad_id=documento_validado.id,
        datos_anteriores={"es_valido": not data.es_valido},
        datos_nuevos={
            "es_valido": data.es_valido,
            "notas_validacion": data.notas_validacion
        },
        request=None
    )
    
    return DocumentoEnDB.from_orm(documento_validado)


@router.delete("/{documento_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_documento(
    documento_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_permission("documentos:eliminar"))
):
    """
    Eliminar un documento (soft delete).
    
    Requiere permiso: documentos:eliminar
    """
    documento = DocumentoService.obtener_documento(db, documento_id)
    if not documento:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Documento no encontrado"
        )
    
    # Guardar datos para auditoría
    datos_documento = {
        "nombre_archivo": documento.nombre_archivo,
        "tipo_documento": documento.tipo_documento,
        "asociado_id": documento.asociado_id
    }
    
    # Eliminar
    DocumentoService.eliminar_documento(db, documento)
    
    # Registrar en auditoría
    AuditoriaService.registrar_eliminacion(
        db=db,
        usuario=current_user,
        entidad="Documento",
        entidad_id=documento.id,
        datos=datos_documento,
        request=None
    )


@router.get("/asociado/{asociado_id}/estadisticas")
def obtener_estadisticas_asociado(
    asociado_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_permission("documentos:leer"))
):
    """
    Obtener estadísticas de documentos de un asociado.
    
    Requiere permiso: documentos:leer
    """
    estadisticas = DocumentoService.obtener_estadisticas_documentos(db, asociado_id)
    return estadisticas
