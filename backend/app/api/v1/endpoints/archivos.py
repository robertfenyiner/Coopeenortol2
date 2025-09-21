import os
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Asociado
from app.services import asociados as service

router = APIRouter()

# Configuración de archivos
UPLOAD_DIRECTORY = "uploads"
ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "gif", "webp"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB

# Crear directorio si no existe
os.makedirs(UPLOAD_DIRECTORY, exist_ok=True)
os.makedirs(f"{UPLOAD_DIRECTORY}/fotos", exist_ok=True)


def validar_archivo_imagen(file: UploadFile) -> None:
    """Validar que el archivo sea una imagen válida."""
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nombre de archivo requerido"
        )
    
    # Verificar extensión
    extension = file.filename.split(".")[-1].lower()
    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Tipo de archivo no permitido. Extensiones permitidas: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    # Verificar tipo MIME
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El archivo debe ser una imagen"
        )


@router.post("/asociados/{asociado_id}/foto")
async def subir_foto_asociado(
    asociado_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """
    Subir foto de perfil para un asociado.
    
    Acepta imágenes en formato JPG, PNG, GIF, WEBP con tamaño máximo de 5MB.
    """
    # Verificar que el asociado existe
    asociado = service.obtener_asociado(db, asociado_id)
    if not asociado:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Asociado no encontrado"
        )
    
    # Validar archivo
    validar_archivo_imagen(file)
    
    # Leer contenido del archivo y verificar tamaño
    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"El archivo es demasiado grande. Tamaño máximo: {MAX_FILE_SIZE // (1024*1024)}MB"
        )
    
    # Generar nombre único para el archivo
    extension = file.filename.split(".")[-1].lower()
    filename = f"asociado_{asociado_id}_{uuid.uuid4().hex}.{extension}"
    file_path = f"{UPLOAD_DIRECTORY}/fotos/{filename}"
    
    try:
        # Eliminar foto anterior si existe
        if asociado.foto_url:
            old_filename = asociado.foto_url.split("/")[-1]
            old_file_path = f"{UPLOAD_DIRECTORY}/fotos/{old_filename}"
            if os.path.exists(old_file_path):
                os.remove(old_file_path)
        
        # Guardar nuevo archivo
        with open(file_path, "wb") as f:
            f.write(contents)
        
        # Actualizar URL en la base de datos
        foto_url = f"/api/v1/archivos/fotos/{filename}"
        asociado.foto_url = foto_url
        db.commit()
        db.refresh(asociado)
        
        return {
            "mensaje": "Foto subida exitosamente",
            "foto_url": foto_url,
            "filename": filename
        }
        
    except Exception as e:
        # Limpiar archivo si hay error
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al guardar archivo: {str(e)}"
        )


@router.delete("/asociados/{asociado_id}/foto")
def eliminar_foto_asociado(
    asociado_id: int,
    db: Session = Depends(get_db),
):
    """Eliminar la foto de perfil de un asociado."""
    # Verificar que el asociado existe
    asociado = service.obtener_asociado(db, asociado_id)
    if not asociado:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Asociado no encontrado"
        )
    
    if not asociado.foto_url:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El asociado no tiene foto"
        )
    
    # Eliminar archivo físico
    filename = asociado.foto_url.split("/")[-1]
    file_path = f"{UPLOAD_DIRECTORY}/fotos/{filename}"
    if os.path.exists(file_path):
        os.remove(file_path)
    
    # Actualizar base de datos
    asociado.foto_url = None
    db.commit()
    
    return {"mensaje": "Foto eliminada exitosamente"}


@router.get("/fotos/{filename}")
async def obtener_foto(filename: str):
    """Servir archivos de fotos estáticas."""
    from fastapi.responses import FileResponse
    
    file_path = f"{UPLOAD_DIRECTORY}/fotos/{filename}"
    if not os.path.exists(file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Archivo no encontrado"
        )
    
    return FileResponse(file_path)