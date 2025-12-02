from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from datetime import datetime

from app.database import get_db
from app.models.usuario import Usuario
from app.models.auditoria import RegistroAuditoria
from app.schemas.auditoria import RegistroAuditoriaResponse, RegistroAuditoriaFilter
from app.core.deps import get_current_user

router = APIRouter()


@router.get("/", response_model=List[RegistroAuditoriaResponse])
def listar_registros(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    usuario_id: Optional[int] = None,
    accion: Optional[str] = None,
    entidad: Optional[str] = None,
    entidad_id: Optional[int] = None,
    fecha_desde: Optional[datetime] = None,
    fecha_hasta: Optional[datetime] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Listar registros de auditoría con filtros opcionales.
    Solo accesible para Admins y Auditores.
    """
    # Verificar permisos
    if current_user.rol not in ["Admin", "Auditor"]:
        raise HTTPException(status_code=403, detail="No tienes permiso para acceder a los registros de auditoría")
    
    query = db.query(RegistroAuditoria)
    
    # Aplicar filtros
    filtros = []
    if usuario_id:
        filtros.append(RegistroAuditoria.usuario_id == usuario_id)
    if accion:
        filtros.append(RegistroAuditoria.accion == accion)
    if entidad:
        filtros.append(RegistroAuditoria.entidad == entidad)
    if entidad_id:
        filtros.append(RegistroAuditoria.entidad_id == entidad_id)
    if fecha_desde:
        filtros.append(RegistroAuditoria.fecha_hora >= fecha_desde)
    if fecha_hasta:
        filtros.append(RegistroAuditoria.fecha_hora <= fecha_hasta)
    
    if filtros:
        query = query.filter(and_(*filtros))
    
    # Ordenar por fecha más reciente primero
    query = query.order_by(RegistroAuditoria.fecha_hora.desc())
    
    # Paginación
    registros = query.offset(skip).limit(limit).all()
    
    return registros


@router.get("/{registro_id}", response_model=RegistroAuditoriaResponse)
def obtener_registro(
    registro_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Obtener un registro de auditoría específico por ID.
    Solo accesible para Admins y Auditores.
    """
    if current_user.rol not in ["Admin", "Auditor"]:
        raise HTTPException(status_code=403, detail="No tienes permiso para acceder a los registros de auditoría")
        
    registro = db.query(RegistroAuditoria).filter(RegistroAuditoria.id == registro_id).first()
    
    if not registro:
        raise HTTPException(status_code=404, detail="Registro de auditoría no encontrado")
    
    return registro
