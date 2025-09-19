from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import AsociadoActualizar, AsociadoCrear, AsociadoEnDB, AsociadosListResponse
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
    orden: Optional[str] = Query(default="desc", regex="^(asc|desc)$", description="Orden ascendente o descendente"),
    db: Session = Depends(get_db),
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


@router.post("/", response_model=AsociadoEnDB, status_code=status.HTTP_201_CREATED)
def crear_asociado(asociado_in: AsociadoCrear, db: Session = Depends(get_db)) -> AsociadoEnDB:
    """
    Crear un nuevo asociado en el sistema.
    
    Valida que el número de documento sea único y que todos los campos
    requeridos estén presentes.
    """
    try:
        return service.crear_asociado(db, asociado_in)
    except service.DocumentoDuplicadoError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error)) from error
    except service.EmailDuplicadoError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error)) from error


@router.get("/estadisticas", response_model=dict)
def obtener_estadisticas(db: Session = Depends(get_db)) -> dict:
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


@router.get("/{asociado_id}", response_model=AsociadoEnDB)
def obtener_asociado(asociado_id: int, db: Session = Depends(get_db)) -> AsociadoEnDB:
    """
    Obtener un asociado específico por su ID.
    
    Retorna toda la información del asociado incluyendo datos personales,
    laborales, familiares y financieros.
    """
    asociado = service.obtener_asociado(db, asociado_id)
    if not asociado:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asociado no encontrado")
    return asociado


@router.put("/{asociado_id}", response_model=AsociadoEnDB)
def actualizar_asociado(
    asociado_id: int,
    asociado_in: AsociadoActualizar,
    db: Session = Depends(get_db),
) -> AsociadoEnDB:
    """
    Actualizar información de un asociado existente.
    
    Permite actualización parcial de campos. Los campos no enviados
    mantendrán su valor actual.
    """
    asociado = service.obtener_asociado(db, asociado_id)
    if not asociado:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asociado no encontrado")
    
    try:
        return service.actualizar_asociado(db, asociado, asociado_in)
    except service.EmailDuplicadoError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error)) from error


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
