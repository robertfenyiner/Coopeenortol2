import os
import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, File, HTTPException, Query, Response, UploadFile, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_active_user, require_permission
from app.core.validators import validar_asociado_completo
from app.database import get_db
from app.models.usuario import Usuario
from app.schemas import AsociadoActualizar, AsociadoCrear, AsociadoEnDB, AsociadoDetalle, AsociadosListResponse
from app.services import asociados as service

router = APIRouter()


@router.get("/", response_model=AsociadosListResponse)
def listar_asociados(
    skip: int = Query(default=0, ge=0, description="Número de registros a saltar"),
    limit: int = Query(default=50, ge=1, le=100, description="Límite de registros por página"),
    estado: Optional[str] = Query(default=None, description="Filtrar por estado (activo, inactivo, retirado)"),
    numero_documento: Optional[str] = Query(default=None, description="Buscar por número de documento"),
    nombre: Optional[str] = Query(default=None, description="Buscar por nombre o apellidos"),
    correo: Optional[str] = Query(default=None, description="Buscar por correo electrónico"),
    ordenar_por: Optional[str] = Query(default="fecha_ingreso", description="Campo por el cual ordenar"),
    orden: Optional[str] = Query(default="desc", pattern="^(asc|desc)$", description="Orden ascendente o descendente"),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_permission("asociados:leer")),
) -> AsociadosListResponse:
    """
    Listar asociados con paginación y filtros avanzados.
    
    Permite filtrar por múltiples criterios y ordenar los resultados.
    Retorna información de paginación junto con los datos.
    """
    return service.listar_asociados(
        db, 
        skip=skip, 
        limit=limit, 
        estado=estado, 
        numero_documento=numero_documento,
        nombre=nombre,
        correo=correo,
        ordenar_por=ordenar_por,
        orden=orden
    )


@router.post("/", response_model=AsociadoDetalle, status_code=status.HTTP_201_CREATED)
def crear_asociado(
    asociado_in: AsociadoCrear,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_permission("asociados:crear")),
) -> AsociadoEnDB:
    """
    Crear un nuevo asociado en el sistema.
    
    Valida que el número de documento sea único y que todos los campos
    requeridos estén presentes. Aplica validaciones personalizadas para
    documentos, teléfonos y otros campos críticos.
    """
    # Validar campos críticos
    es_valido, errores = validar_asociado_completo(asociado_in.dict())
    if not es_valido:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "message": "Errores de validación en los datos del asociado",
                "errors": errores
            }
        )
    
    try:
        return service.crear_asociado(db, asociado_in)
    except service.DocumentoDuplicadoError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error)) from error
    except service.EmailDuplicadoError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error)) from error


@router.get("/estadisticas", response_model=dict)
def obtener_estadisticas(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_permission("asociados:leer")),
) -> dict:
    """
    Obtener estadísticas generales de asociados.
    
    Retorna contadores por estado, distribución por año de ingreso,
    y otros indicadores útiles para el dashboard.
    """
    return service.obtener_estadisticas(db)


@router.get("/buscar", response_model=List[AsociadoEnDB])
def buscar_asociados(
    q: str = Query(..., min_length=2, description="Término de búsqueda (mínimo 2 caracteres)"),
    limite: int = Query(default=20, ge=1, le=50, description="Límite de resultados"),
    db: Session = Depends(get_db),
) -> List[AsociadoEnDB]:
    """
    Búsqueda de texto libre en asociados.
    
    Busca en nombres, apellidos, número de documento y correo electrónico.
    Útil para autocompletado y búsqueda rápida.
    """
    return service.buscar_asociados(db, termino=q, limite=limite)


@router.get("/{asociado_id}", response_model=AsociadoDetalle)
def obtener_asociado(asociado_id: int, db: Session = Depends(get_db)) -> AsociadoDetalle:
    """
    Obtener un asociado específico por su ID.
    
    Retorna toda la información del asociado incluyendo datos personales,
    laborales, familiares y financieros.
    """
    asociado = service.obtener_asociado(db, asociado_id)
    if not asociado:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asociado no encontrado")
    return asociado


@router.put("/{asociado_id}", response_model=AsociadoDetalle)
def actualizar_asociado(
    asociado_id: int,
    asociado_in: AsociadoActualizar,
    db: Session = Depends(get_db),
) -> AsociadoDetalle:
    """
    Actualizar información de un asociado existente.
    
    Permite actualización parcial de campos. Los campos no enviados
    mantendrán su valor actual. Aplica validaciones solo a los campos
    que se están actualizando.
    """
    import logging
    logger = logging.getLogger(__name__)
    logger.info(f"Recibiendo actualización para asociado {asociado_id}")
    logger.info(f"Datos recibidos: {asociado_in.dict(exclude_unset=True)}")
    
    asociado = service.obtener_asociado(db, asociado_id)
    if not asociado:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asociado no encontrado")
    
    try:
        return service.actualizar_asociado(db, asociado, asociado_in)
    except service.EmailDuplicadoError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error)) from error
    except Exception as e:
        # Log the error for debugging
        print(f"Error updating asociado: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error al actualizar asociado: {str(e)}") from e


@router.delete("/{asociado_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_asociado(asociado_id: int, db: Session = Depends(get_db)) -> Response:
    """
    Eliminar (inactivar) un asociado del sistema.
    
    En lugar de eliminar físicamente, cambia el estado a 'inactivo'
    para mantener trazabilidad histórica.
    """
    asociado = service.obtener_asociado(db, asociado_id)
    if not asociado:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asociado no encontrado")
    service.eliminar_asociado(db, asociado)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/{asociado_id}/foto", response_model=dict)
async def subir_foto_asociado(
    asociado_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
) -> dict:
    """
    Subir foto de perfil para un asociado.
    
    Acepta archivos de imagen en formatos JPG, PNG, JPEG.
    Máximo 5MB de tamaño.
    """
    # Verificar que el asociado existe
    asociado = service.obtener_asociado(db, asociado_id)
    if not asociado:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asociado no encontrado")
    
    # Validar tipo de archivo
    if not file.content_type or not file.content_type.startswith('image/'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Solo se permiten archivos de imagen (JPG, PNG, JPEG)"
        )
    
    # Validar tamaño (5MB máximo)
    if file.size and file.size > 5 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El archivo no puede ser mayor a 5MB"
        )
    
    # Crear directorio de fotos si no existe
    upload_dir = "uploads/fotos"
    os.makedirs(upload_dir, exist_ok=True)
    
    # Generar nombre único para el archivo
    file_extension = os.path.splitext(file.filename)[1] if file.filename else '.jpg'
    unique_filename = f"asociado_{asociado_id}_{uuid.uuid4().hex}{file_extension}"
    file_path = os.path.join(upload_dir, unique_filename)
    
    try:
        # Guardar archivo
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        # Actualizar URL de foto en la base de datos
        foto_url = f"/uploads/fotos/{unique_filename}"
        asociado.foto_url = foto_url
        db.commit()
        db.refresh(asociado)
        
        return {
            "message": "Foto subida exitosamente",
            "foto_url": foto_url,
            "filename": unique_filename
        }
        
    except Exception as e:
        # Si hay error, eliminar archivo si se creó
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al subir la foto: {str(e)}"
        )
