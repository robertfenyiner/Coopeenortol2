"""
Utilidades para almacenamiento y gestión de archivos.
"""
import os
import uuid
from pathlib import Path
from typing import Optional, Tuple

from fastapi import UploadFile, HTTPException, status


class FileStorageManager:
    """
    Gestor de almacenamiento de archivos.
    
    Maneja la subida, almacenamiento y recuperación de archivos
    en el sistema de archivos local.
    """
    
    # Directorio base para almacenar documentos
    BASE_UPLOAD_DIR = Path("uploads/documentos")
    
    # Extensiones permitidas
    ALLOWED_EXTENSIONS = {
        "application/pdf": ".pdf",
        "image/jpeg": ".jpg",
        "image/jpg": ".jpg",
        "image/png": ".png",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
        "application/msword": ".doc",
    }
    
    # Tamaño máximo: 10 MB
    MAX_FILE_SIZE = 10 * 1024 * 1024
    
    @classmethod
    def initialize_storage(cls):
        """Crear directorio de almacenamiento si no existe."""
        cls.BASE_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
        
        # Crear subdirectorios por tipo de documento
        subdirs = [
            "cedulas",
            "comprobantes",
            "certificados",
            "otros"
        ]
        for subdir in subdirs:
            (cls.BASE_UPLOAD_DIR / subdir).mkdir(exist_ok=True)
    
    @classmethod
    def get_subdirectory(cls, tipo_documento: str) -> str:
        """
        Determinar subdirectorio según tipo de documento.
        
        Args:
            tipo_documento: Tipo de documento
            
        Returns:
            Nombre del subdirectorio
        """
        if tipo_documento in ["cedula_ciudadania", "cedula_extranjeria", "pasaporte"]:
            return "cedulas"
        elif tipo_documento in ["comprobante_ingresos", "extracto_bancario", "declaracion_renta"]:
            return "comprobantes"
        elif tipo_documento in ["certificado_laboral", "rut"]:
            return "certificados"
        else:
            return "otros"
    
    @classmethod
    async def validate_file(cls, file: UploadFile) -> Tuple[str, int]:
        """
        Validar archivo subido.
        
        Args:
            file: Archivo a validar
            
        Returns:
            Tupla con (mime_type, tamaño en bytes)
            
        Raises:
            HTTPException: Si el archivo no es válido
        """
        # Validar que se proporcionó un archivo
        if not file:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No se proporcionó ningún archivo"
            )
        
        # Validar content type
        content_type = file.content_type
        if content_type not in cls.ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Tipo de archivo no permitido. Tipos permitidos: PDF, JPG, PNG, DOC, DOCX"
            )
        
        # Leer contenido para validar tamaño
        contents = await file.read()
        file_size = len(contents)
        
        # Validar tamaño
        if file_size > cls.MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"Archivo demasiado grande. Tamaño máximo: {cls.MAX_FILE_SIZE / (1024*1024):.1f} MB"
            )
        
        if file_size == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El archivo está vacío"
            )
        
        # Regresar el puntero al inicio para poder leer de nuevo
        await file.seek(0)
        
        return content_type, file_size
    
    @classmethod
    async def save_file(
        cls,
        file: UploadFile,
        tipo_documento: str,
        asociado_id: int
    ) -> Tuple[str, str, str]:
        """
        Guardar archivo en el sistema de archivos.
        
        Args:
            file: Archivo a guardar
            tipo_documento: Tipo de documento
            asociado_id: ID del asociado
            
        Returns:
            Tupla con (nombre_almacenado, ruta_relativa, ruta_absoluta)
        """
        # Obtener extensión
        extension = cls.ALLOWED_EXTENSIONS.get(file.content_type, ".bin")
        
        # Generar nombre único
        unique_name = f"{uuid.uuid4()}{extension}"
        
        # Determinar subdirectorio
        subdir = cls.get_subdirectory(tipo_documento)
        
        # Ruta relativa (para guardar en DB)
        relative_path = f"{subdir}/{unique_name}"
        
        # Ruta absoluta
        full_path = cls.BASE_UPLOAD_DIR / subdir / unique_name
        
        # Guardar archivo
        contents = await file.read()
        with open(full_path, "wb") as f:
            f.write(contents)
        
        return unique_name, relative_path, str(full_path)
    
    @classmethod
    def delete_file(cls, ruta_almacenamiento: str) -> bool:
        """
        Eliminar archivo del sistema de archivos.
        
        Args:
            ruta_almacenamiento: Ruta relativa del archivo
            
        Returns:
            True si se eliminó exitosamente
        """
        try:
            full_path = cls.BASE_UPLOAD_DIR / ruta_almacenamiento
            if full_path.exists():
                full_path.unlink()
                return True
        except Exception:
            pass
        return False
    
    @classmethod
    def get_file_path(cls, ruta_almacenamiento: str) -> Optional[Path]:
        """
        Obtener ruta absoluta de un archivo.
        
        Args:
            ruta_almacenamiento: Ruta relativa del archivo
            
        Returns:
            Path absoluto si existe, None si no
        """
        full_path = cls.BASE_UPLOAD_DIR / ruta_almacenamiento
        return full_path if full_path.exists() else None
