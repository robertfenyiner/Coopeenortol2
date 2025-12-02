"""
Servicio de gestión de documentos.
"""
from typing import Optional, List
from datetime import datetime

from fastapi import UploadFile, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func

from app.models.documento import Documento
from app.models.asociado import Asociado
from app.models.usuario import Usuario
from app.schemas.documento import DocumentoSubir, DocumentoActualizar, DocumentoValidar
from app.core.file_storage import FileStorageManager


class DocumentoService:
    """Servicio para operaciones con documentos."""
    
    @staticmethod
    async def crear_documento(
        db: Session,
        file: UploadFile,
        data: DocumentoSubir,
        usuario_id: int
    ) -> Documento:
        """
        Crear y almacenar un nuevo documento.
        
        Args:
            db: Sesión de base de datos
            file: Archivo subido
            data: Datos del documento
            usuario_id: ID del usuario que sube el documento
            
        Returns:
            Documento creado
            
        Raises:
            HTTPException: Si el asociado no existe o hay error al guardar
        """
        # Verificar que el asociado existe
        asociado = db.query(Asociado).filter(Asociado.id == data.asociado_id).first()
        if not asociado:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Asociado con ID {data.asociado_id} no encontrado"
            )
        
        # Validar archivo
        mime_type, file_size = await FileStorageManager.validate_file(file)
        
        # Guardar archivo
        nombre_almacenado, ruta_relativa, _ = await FileStorageManager.save_file(
            file=file,
            tipo_documento=data.tipo_documento,
            asociado_id=data.asociado_id
        )
        
        # Crear registro en base de datos
        documento = Documento(
            asociado_id=data.asociado_id,
            nombre_archivo=file.filename,
            nombre_almacenado=nombre_almacenado,
            tipo_documento=data.tipo_documento,
            mime_type=mime_type,
            tamano_bytes=file_size,
            ruta_almacenamiento=ruta_relativa,
            descripcion=data.descripcion,
            subido_por_id=usuario_id,
            es_valido=False,
            activo=True
        )
        
        db.add(documento)
        db.commit()
        db.refresh(documento)
        
        return documento
    
    @staticmethod
    def obtener_documento(db: Session, documento_id: int) -> Optional[Documento]:
        """
        Obtener un documento por ID.
        
        Args:
            db: Sesión de base de datos
            documento_id: ID del documento
            
        Returns:
            Documento si existe, None si no
        """
        return db.query(Documento).filter(
            Documento.id == documento_id,
            Documento.activo == True
        ).first()
    
    @staticmethod
    def listar_documentos(
        db: Session,
        asociado_id: Optional[int] = None,
        tipo_documento: Optional[str] = None,
        es_valido: Optional[bool] = None,
        skip: int = 0,
        limit: int = 100
    ) -> tuple[List[Documento], int]:
        """
        Listar documentos con filtros opcionales.
        
        Args:
            db: Sesión de base de datos
            asociado_id: Filtrar por asociado
            tipo_documento: Filtrar por tipo de documento
            es_valido: Filtrar por estado de validación
            skip: Cantidad de registros a saltar
            limit: Cantidad máxima de registros
            
        Returns:
            Tupla con (lista de documentos, total de registros)
        """
        query = db.query(Documento).filter(Documento.activo == True)
        
        # Aplicar filtros
        if asociado_id is not None:
            query = query.filter(Documento.asociado_id == asociado_id)
        
        if tipo_documento is not None:
            query = query.filter(Documento.tipo_documento == tipo_documento)
        
        if es_valido is not None:
            query = query.filter(Documento.es_valido == es_valido)
        
        # Contar total
        total = query.count()
        
        # Obtener documentos con paginación
        documentos = query.order_by(Documento.fecha_subida.desc()).offset(skip).limit(limit).all()
        
        return documentos, total
    
    @staticmethod
    def actualizar_documento(
        db: Session,
        documento: Documento,
        data: DocumentoActualizar
    ) -> Documento:
        """
        Actualizar información de un documento.
        
        Args:
            db: Sesión de base de datos
            documento: Documento a actualizar
            data: Nuevos datos
            
        Returns:
            Documento actualizado
        """
        update_data = data.dict(exclude_unset=True)
        
        for field, value in update_data.items():
            setattr(documento, field, value)
        
        db.commit()
        db.refresh(documento)
        
        return documento
    
    @staticmethod
    def validar_documento(
        db: Session,
        documento: Documento,
        data: DocumentoValidar,
        validador_id: int
    ) -> Documento:
        """
        Validar/aprobar un documento.
        
        Args:
            db: Sesión de base de datos
            documento: Documento a validar
            data: Datos de validación
            validador_id: ID del usuario que valida
            
        Returns:
            Documento validado
        """
        documento.es_valido = data.es_valido
        documento.notas_validacion = data.notas_validacion
        documento.fecha_validacion = datetime.utcnow()
        documento.validado_por_id = validador_id
        
        db.commit()
        db.refresh(documento)
        
        return documento
    
    @staticmethod
    def eliminar_documento(db: Session, documento: Documento) -> bool:
        """
        Eliminar documento (soft delete).
        
        Args:
            db: Sesión de base de datos
            documento: Documento a eliminar
            
        Returns:
            True si se eliminó exitosamente
        """
        # Soft delete
        documento.activo = False
        db.commit()
        
        # Intentar eliminar archivo físico
        FileStorageManager.delete_file(documento.ruta_almacenamiento)
        
        return True
    
    @staticmethod
    def obtener_estadisticas_documentos(db: Session, asociado_id: int) -> dict:
        """
        Obtener estadísticas de documentos de un asociado.
        
        Args:
            db: Sesión de base de datos
            asociado_id: ID del asociado
            
        Returns:
            Diccionario con estadísticas
        """
        total = db.query(Documento).filter(
            Documento.asociado_id == asociado_id,
            Documento.activo == True
        ).count()
        
        validados = db.query(Documento).filter(
            Documento.asociado_id == asociado_id,
            Documento.activo == True,
            Documento.es_valido == True
        ).count()
        
        pendientes = total - validados
        
        por_tipo = db.query(
            Documento.tipo_documento,
            func.count(Documento.id)
        ).filter(
            Documento.asociado_id == asociado_id,
            Documento.activo == True
        ).group_by(Documento.tipo_documento).all()
        
        return {
            "total": total,
            "validados": validados,
            "pendientes": pendientes,
            "por_tipo": {tipo: count for tipo, count in por_tipo}
        }
