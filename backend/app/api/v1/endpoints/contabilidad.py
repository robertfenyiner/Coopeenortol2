"""
Endpoints de contabilidad.
"""
from datetime import date
from typing import List, Optional
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core import deps
from app.database import get_db
from app.models.usuario import Usuario
from app.models.contabilidad import CuentaContable, AsientoContable, Aporte
from app.schemas.contabilidad import (
    CuentaContableCrear,
    CuentaContableActualizar,
    CuentaContableEnDB,
    CuentaContableConSaldo,
    AsientoContableCrear,
    AsientoContableEnDB,
    AsientoContableCompleto,
    AsientoAnular,
    AporteCrear,
    AporteEnDB,
    EstadisticasContables
)
from app.services.contabilidad import ContabilidadService


router = APIRouter()


# ============================================================================
# CUENTAS CONTABLES
# ============================================================================

@router.post("/cuentas", response_model=CuentaContableEnDB, status_code=status.HTTP_201_CREATED)
def crear_cuenta(
    *,
    db: Session = Depends(get_db),
    data: CuentaContableCrear,
    usuario_actual: Usuario = Depends(deps.get_current_active_user)
):
    """Crear nueva cuenta contable."""
    cuenta = ContabilidadService.crear_cuenta(db, data)
    return cuenta


@router.get("/cuentas", response_model=dict)
def listar_cuentas(
    db: Session = Depends(get_db),
    tipo: Optional[str] = Query(None, description="Filtrar por tipo de cuenta"),
    nivel: Optional[int] = Query(None, ge=1, le=4, description="Filtrar por nivel"),
    solo_auxiliares: bool = Query(False, description="Solo cuentas auxiliares"),
    solo_activas: bool = Query(True, description="Solo cuentas activas"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    usuario_actual: Usuario = Depends(deps.get_current_active_user)
):
    """Listar cuentas contables con filtros."""
    cuentas, total = ContabilidadService.listar_cuentas(
        db=db,
        tipo=tipo,
        nivel=nivel,
        solo_auxiliares=solo_auxiliares,
        solo_activas=solo_activas,
        skip=skip,
        limit=limit
    )
    
    return {
        "cuentas": cuentas,
        "total": total,
        "skip": skip,
        "limit": limit
    }


@router.get("/cuentas/{cuenta_id}", response_model=CuentaContableEnDB)
def obtener_cuenta(
    cuenta_id: int,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(deps.get_current_active_user)
):
    """Obtener cuenta contable por ID."""
    cuenta = ContabilidadService.obtener_cuenta(db, cuenta_id)
    
    if not cuenta:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cuenta no encontrada"
        )
    
    return cuenta


@router.get("/cuentas/codigo/{codigo}", response_model=CuentaContableEnDB)
def obtener_cuenta_por_codigo(
    codigo: str,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(deps.get_current_active_user)
):
    """Obtener cuenta contable por código."""
    cuenta = ContabilidadService.obtener_cuenta_por_codigo(db, codigo)
    
    if not cuenta:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cuenta con código {codigo} no encontrada"
        )
    
    return cuenta


@router.get("/cuentas/{cuenta_id}/saldo", response_model=CuentaContableConSaldo)
def obtener_saldo_cuenta(
    cuenta_id: int,
    fecha_inicio: Optional[date] = Query(None),
    fecha_fin: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(deps.get_current_active_user)
):
    """Obtener cuenta con su saldo calculado."""
    cuenta = ContabilidadService.obtener_cuenta(db, cuenta_id)
    
    if not cuenta:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cuenta no encontrada"
        )
    
    # Calcular saldo
    total_debito, total_credito, saldo = ContabilidadService.calcular_saldo_cuenta(
        db=db,
        cuenta_id=cuenta_id,
        fecha_inicio=fecha_inicio,
        fecha_fin=fecha_fin
    )
    
    # Crear respuesta con saldo
    cuenta_dict = {
        **cuenta.__dict__,
        "total_debito": total_debito,
        "total_credito": total_credito,
        "saldo": saldo
    }
    
    return cuenta_dict


@router.put("/cuentas/{cuenta_id}", response_model=CuentaContableEnDB)
def actualizar_cuenta(
    cuenta_id: int,
    data: CuentaContableActualizar,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(deps.get_current_active_user)
):
    """Actualizar cuenta contable."""
    cuenta = ContabilidadService.obtener_cuenta(db, cuenta_id)
    
    if not cuenta:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cuenta no encontrada"
        )
    
    cuenta_actualizada = ContabilidadService.actualizar_cuenta(db, cuenta, data)
    return cuenta_actualizada


# ============================================================================
# ASIENTOS CONTABLES
# ============================================================================

@router.post("/asientos", response_model=AsientoContableEnDB, status_code=status.HTTP_201_CREATED)
def crear_asiento(
    *,
    db: Session = Depends(get_db),
    data: AsientoContableCrear,
    usuario_actual: Usuario = Depends(deps.get_current_active_user)
):
    """Crear asiento contable con movimientos. Valida partida doble."""
    asiento = ContabilidadService.crear_asiento(
        db=db,
        data=data,
        usuario_id=usuario_actual.id
    )
    return asiento


@router.get("/asientos", response_model=dict)
def listar_asientos(
    db: Session = Depends(get_db),
    fecha_inicio: Optional[date] = Query(None),
    fecha_fin: Optional[date] = Query(None),
    tipo_movimiento: Optional[str] = Query(None),
    solo_activos: bool = Query(True, description="Excluir asientos anulados"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    usuario_actual: Usuario = Depends(deps.get_current_active_user)
):
    """Listar asientos contables con filtros."""
    asientos, total = ContabilidadService.listar_asientos(
        db=db,
        fecha_inicio=fecha_inicio,
        fecha_fin=fecha_fin,
        tipo_movimiento=tipo_movimiento,
        solo_activos=solo_activos,
        skip=skip,
        limit=limit
    )
    
    return {
        "asientos": asientos,
        "total": total,
        "skip": skip,
        "limit": limit
    }


@router.get("/asientos/{asiento_id}", response_model=AsientoContableCompleto)
def obtener_asiento(
    asiento_id: int,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(deps.get_current_active_user)
):
    """Obtener asiento contable con sus movimientos."""
    asiento = ContabilidadService.obtener_asiento(db, asiento_id)
    
    if not asiento:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Asiento no encontrado"
        )
    
    return asiento


@router.post("/asientos/{asiento_id}/anular", response_model=AsientoContableEnDB)
def anular_asiento(
    asiento_id: int,
    data: AsientoAnular,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(deps.get_current_active_user)
):
    """Anular asiento contable. No elimina, solo marca como anulado."""
    asiento = ContabilidadService.obtener_asiento(db, asiento_id)
    
    if not asiento:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Asiento no encontrado"
        )
    
    asiento_anulado = ContabilidadService.anular_asiento(
        db=db,
        asiento=asiento,
        motivo=data.motivo,
        usuario_id=usuario_actual.id
    )
    return asiento_anulado


# ============================================================================
# APORTES
# ============================================================================

@router.post("/aportes", response_model=AporteEnDB, status_code=status.HTTP_201_CREATED)
def crear_aporte(
    *,
    db: Session = Depends(get_db),
    data: AporteCrear,
    usuario_actual: Usuario = Depends(deps.get_current_active_user)
):
    """Registrar aporte de asociado. Si generar_asiento=True, crea asiento automático."""
    aporte = ContabilidadService.crear_aporte(
        db=db,
        data=data,
        usuario_id=usuario_actual.id
    )
    return aporte


@router.get("/aportes", response_model=dict)
def listar_aportes(
    db: Session = Depends(get_db),
    asociado_id: Optional[int] = Query(None),
    fecha_inicio: Optional[date] = Query(None),
    fecha_fin: Optional[date] = Query(None),
    estado: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    usuario_actual: Usuario = Depends(deps.get_current_active_user)
):
    """Listar aportes con filtros."""
    aportes, total = ContabilidadService.listar_aportes(
        db=db,
        asociado_id=asociado_id,
        fecha_inicio=fecha_inicio,
        fecha_fin=fecha_fin,
        estado=estado,
        skip=skip,
        limit=limit
    )
    
    return {
        "aportes": aportes,
        "total": total,
        "skip": skip,
        "limit": limit
    }


@router.get("/aportes/{aporte_id}", response_model=AporteEnDB)
def obtener_aporte(
    aporte_id: int,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(deps.get_current_active_user)
):
    """Obtener aporte por ID."""
    aporte = ContabilidadService.obtener_aporte(db, aporte_id)
    
    if not aporte:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Aporte no encontrado"
        )
    
    return aporte


@router.get("/aportes/asociado/{asociado_id}/total")
def obtener_total_aportes_asociado(
    asociado_id: int,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(deps.get_current_active_user)
):
    """Obtener total de aportes de un asociado."""
    total = ContabilidadService.calcular_total_aportes_asociado(db, asociado_id)
    
    return {
        "asociado_id": asociado_id,
        "total_aportes": total
    }


# ============================================================================
# ESTADÍSTICAS
# ============================================================================

@router.get("/estadisticas", response_model=EstadisticasContables)
def obtener_estadisticas(
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(deps.get_current_active_user)
):
    """Obtener estadísticas generales de contabilidad."""
    return ContabilidadService.obtener_estadisticas(db)
