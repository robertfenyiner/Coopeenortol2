from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import AsociadoActualizar, AsociadoCrear, AsociadoEnDB
from app.services import asociados as service

router = APIRouter()


@router.get("/", response_model=List[AsociadoEnDB])
def listar_asociados(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=100),
    estado: Optional[str] = Query(default=None),
    numero_documento: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
) -> List[AsociadoEnDB]:
    return service.listar_asociados(db, skip=skip, limit=limit, estado=estado, numero_documento=numero_documento)


@router.post("/", response_model=AsociadoEnDB, status_code=status.HTTP_201_CREATED)
def crear_asociado(asociado_in: AsociadoCrear, db: Session = Depends(get_db)) -> AsociadoEnDB:
    try:
        return service.crear_asociado(db, asociado_in)
    except service.DocumentoDuplicadoError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error)) from error


@router.get("/{asociado_id}", response_model=AsociadoEnDB)
def obtener_asociado(asociado_id: int, db: Session = Depends(get_db)) -> AsociadoEnDB:
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
    asociado = service.obtener_asociado(db, asociado_id)
    if not asociado:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asociado no encontrado")
    return service.actualizar_asociado(db, asociado, asociado_in)


@router.delete("/{asociado_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_asociado(asociado_id: int, db: Session = Depends(get_db)) -> Response:
    asociado = service.obtener_asociado(db, asociado_id)
    if not asociado:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asociado no encontrado")
    service.eliminar_asociado(db, asociado)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
