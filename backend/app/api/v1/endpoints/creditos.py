"""
Endpoints de créditos.
"""
from datetime import date
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core import deps
from app.database import get_db
from app.models.usuario import Usuario
from app.models.credito import Credito, Pago
from app.schemas.credito import (
    CreditoSolicitar,
    CreditoAprobar,
    CreditoRechazar,
    CreditoDesembolsar,
    CreditoEnDB,
    CreditoCompleto,
    CreditoConAsociado,
    PagoCrear,
    PagoEnDB,
    EstadisticasCredito,
    SimulacionCredito
)
from app.services.creditos import CreditoService


router = APIRouter()


# ============================================================================
# CRÉDITOS
# ============================================================================

@router.post("/solicitar", response_model=CreditoEnDB, status_code=status.HTTP_201_CREATED)
def solicitar_credito(
    *,
    db: Session = Depends(get_db),
    data: CreditoSolicitar,
    usuario_actual: Usuario = Depends(deps.get_current_active_user)
):
    """Solicitar un nuevo crédito."""
    credito = CreditoService.solicitar_credito(db, data, usuario_actual.id)
    return credito


@router.post("/{credito_id}/aprobar", response_model=CreditoEnDB)
def aprobar_credito(
    credito_id: int,
    data: CreditoAprobar,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(deps.get_current_active_user)
):
    """Aprobar un crédito solicitado."""
    credito = CreditoService.obtener_credito(db, credito_id)
    
    if not credito:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Crédito no encontrado"
        )
    
    credito_aprobado = CreditoService.aprobar_credito(db, credito, data, usuario_actual.id)
    return credito_aprobado


@router.post("/{credito_id}/rechazar", response_model=CreditoEnDB)
def rechazar_credito(
    credito_id: int,
    data: CreditoRechazar,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(deps.get_current_active_user)
):
    """Rechazar un crédito solicitado."""
    credito = CreditoService.obtener_credito(db, credito_id)
    
    if not credito:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Crédito no encontrado"
        )
    
    credito_rechazado = CreditoService.rechazar_credito(db, credito, data.motivo_rechazo, usuario_actual.id)
    return credito_rechazado


@router.post("/{credito_id}/desembolsar", response_model=CreditoEnDB)
def desembolsar_credito(
    credito_id: int,
    data: CreditoDesembolsar,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(deps.get_current_active_user)
):
    """Desembolsar un crédito aprobado."""
    credito = CreditoService.obtener_credito(db, credito_id)
    
    if not credito:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Crédito no encontrado"
        )
    
    credito_desembolsado = CreditoService.desembolsar_credito(db, credito, data, usuario_actual.id)
    return credito_desembolsado


@router.get("/", response_model=dict)
def listar_creditos(
    db: Session = Depends(get_db),
    asociado_id: Optional[int] = Query(None),
    estado: Optional[str] = Query(None),
    tipo_credito: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    usuario_actual: Usuario = Depends(deps.get_current_active_user)
):
    """Listar créditos con filtros."""
    creditos, total = CreditoService.listar_creditos(
        db=db,
        asociado_id=asociado_id,
        estado=estado,
        tipo_credito=tipo_credito,
        skip=skip,
        limit=limit
    )
    
    # Convertir a schema con asociado
    creditos_con_asociado = [CreditoConAsociado.from_orm(c) for c in creditos]
    
    return {
        "creditos": creditos_con_asociado,
        "total": total,
        "skip": skip,
        "limit": limit
    }


@router.get("/{credito_id}", response_model=CreditoCompleto)
def obtener_credito(
    credito_id: int,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(deps.get_current_active_user)
):
    """Obtener crédito con sus cuotas."""
    credito = CreditoService.obtener_credito(db, credito_id)
    
    if not credito:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Crédito no encontrado"
        )
    
    return credito


# ============================================================================
# PAGOS
# ============================================================================

@router.post("/pagos", response_model=PagoEnDB, status_code=status.HTTP_201_CREATED)
def registrar_pago(
    *,
    db: Session = Depends(get_db),
    data: PagoCrear,
    usuario_actual: Usuario = Depends(deps.get_current_active_user)
):
    """Registrar un pago a un crédito."""
    pago = CreditoService.registrar_pago(db, data, usuario_actual.id)
    return pago


@router.get("/pagos/{pago_id}", response_model=PagoEnDB)
def obtener_pago(
    pago_id: int,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(deps.get_current_active_user)
):
    """Obtener información de un pago."""
    pago = db.query(Pago).filter(Pago.id == pago_id).first()
    
    if not pago:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pago no encontrado"
        )
    
    return pago


@router.get("/{credito_id}/pagos", response_model=List[PagoEnDB])
def listar_pagos_credito(
    credito_id: int,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(deps.get_current_active_user)
):
    """Listar todos los pagos de un crédito."""
    pagos = db.query(Pago).filter(
        Pago.credito_id == credito_id
    ).order_by(Pago.fecha_pago.desc()).all()
    
    return pagos


# ============================================================================
# SIMULACIÓN Y REPORTES
# ============================================================================

@router.post("/simular", response_model=SimulacionCredito)
def simular_credito(
    monto: float = Query(..., gt=0),
    tasa_interes: float = Query(..., gt=0, le=100),
    plazo_meses: int = Query(..., gt=0, le=360),
    fecha_inicio: Optional[date] = Query(None),
    modalidad: str = Query("mensual"),
    tipo_cuota: str = Query("fija"),
    usuario_actual: Usuario = Depends(deps.get_current_active_user)
):
    """Simular un crédito con diferentes parámetros."""
    from decimal import Decimal
    
    monto_decimal = Decimal(str(monto))
    tasa_decimal = Decimal(str(tasa_interes))
    fecha = fecha_inicio or date.today()
    
    # Generar tabla de amortización
    cuotas = CreditoService.generar_tabla_amortizacion(
        monto_decimal,
        tasa_decimal,
        plazo_meses,
        fecha,
        modalidad,
        tipo_cuota
    )
    
    # Calcular totales
    valor_cuota = cuotas[0]["valor_cuota"] if cuotas else Decimal("0")
    total_a_pagar = sum(c["valor_cuota"] for c in cuotas)
    total_intereses = total_a_pagar - monto_decimal
    
    return SimulacionCredito(
        monto=monto_decimal,
        tasa_interes=tasa_decimal,
        plazo_meses=plazo_meses,
        valor_cuota=valor_cuota,
        total_intereses=total_intereses,
        total_a_pagar=total_a_pagar,
        cuotas=cuotas
    )


@router.post("/calcular-mora", status_code=status.HTTP_200_OK)
def calcular_mora(
    fecha_corte: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(deps.get_current_active_user)
):
    """Calcular mora de todos los créditos activos."""
    CreditoService.calcular_mora(db, fecha_corte)
    
    return {
        "message": "Mora calculada exitosamente",
        "fecha_corte": fecha_corte or date.today()
    }


@router.get("/estadisticas/general", response_model=EstadisticasCredito)
def obtener_estadisticas(
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(deps.get_current_active_user)
):
    """Obtener estadísticas generales de créditos."""
    return CreditoService.obtener_estadisticas(db)


@router.get("/{credito_id}/tabla-amortizacion")
def obtener_tabla_amortizacion(
    credito_id: int,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(deps.get_current_active_user)
):
    """Obtener tabla de amortización de un crédito."""
    credito = CreditoService.obtener_credito(db, credito_id)
    
    if not credito:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Crédito no encontrado"
        )
    
    return {
        "credito_id": credito.id,
        "numero_credito": credito.numero_credito,
        "monto": credito.monto_desembolsado or credito.monto_aprobado or credito.monto_solicitado,
        "cuotas": [
            {
                "numero": cuota.numero_cuota,
                "fecha_vencimiento": cuota.fecha_vencimiento,
                "valor_cuota": cuota.valor_cuota,
                "capital": cuota.capital,
                "interes": cuota.interes,
                "saldo_pendiente": cuota.saldo_pendiente,
                "valor_pagado": cuota.valor_pagado,
                "estado": cuota.estado,
                "dias_mora": cuota.dias_mora,
                "valor_mora": cuota.valor_mora
            }
            for cuota in sorted(credito.cuotas, key=lambda c: c.numero_cuota)
        ]
    }
