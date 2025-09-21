"""
Configuración para manejo de archivos subidos
"""
import os
from pathlib import Path

# Configuración de directorios
BASE_DIR = Path(__file__).parent.parent
UPLOAD_DIR = BASE_DIR / "uploads"
FOTOS_DIR = UPLOAD_DIR / "fotos"
DOCUMENTOS_DIR = UPLOAD_DIR / "documentos"

# Crear directorios si no existen
UPLOAD_DIR.mkdir(exist_ok=True)
FOTOS_DIR.mkdir(exist_ok=True)
DOCUMENTOS_DIR.mkdir(exist_ok=True)

# Configuración de archivos permitidos
ALLOWED_IMAGE_EXTENSIONS = {"jpg", "jpeg", "png", "gif", "webp"}
ALLOWED_DOCUMENT_EXTENSIONS = {"pdf", "doc", "docx", "txt"}

# Tamaños máximos
MAX_IMAGE_SIZE = 5 * 1024 * 1024  # 5MB
MAX_DOCUMENT_SIZE = 10 * 1024 * 1024  # 10MB

# MIME types permitidos
ALLOWED_IMAGE_MIMES = {
    "image/jpeg",
    "image/png", 
    "image/gif",
    "image/webp"
}

ALLOWED_DOCUMENT_MIMES = {
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain"
}

def get_upload_path(file_type: str, filename: str) -> Path:
    """Obtener la ruta completa para un archivo subido"""
    if file_type == "foto":
        return FOTOS_DIR / filename
    elif file_type == "documento":
        return DOCUMENTOS_DIR / filename
    else:
        raise ValueError(f"Tipo de archivo no soportado: {file_type}")

def get_url_path(file_type: str, filename: str) -> str:
    """Obtener la URL para acceder a un archivo"""
    return f"/api/v1/archivos/{file_type}s/{filename}"