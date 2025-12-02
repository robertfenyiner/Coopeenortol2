"""
Endpoints para el sistema de ahorros.
"""
from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_active_user
from app.database import get_db
from app.models.usuario import Usuario
from app.schemas.ahorro import (
    ConfiguracionAhorroActualizar,
    ConfiguracionAhorroResponse,
    ConsignacionCrear,
    CuentaAhorroActualizar,
    CuentaAhorroConMovimientos,
    CuentaAhorroCrear,
    CuentaAhorroResponse,
    EstadisticasAhorroResponse,
    MovimientoAhorroResponse,
    RetiroCrear,
    TransferenciaCrear,
)
from app.services.ahorros import AhorroService

router = APIRouter()


# ==================== ENDPOINTS DE CUENTAS DE AHORRO ====================

@router.post("/", response_model=CuentaAhorroResponse, status_code=status.HTTP_201_CREATED)
def crear_cuenta_ahorro(
    datos: CuentaAhorroCrear,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """
    Crear una nueva cuenta de ahorro.
    
    - **asociado_id**: ID del asociado titular
    - **tipo_ahorro**: Tipo de cuenta (a_la_vista, programado, cdat, etc.)
    - **monto_inicial**: Monto inicial de apertura
    """
    try:
        cuenta = AhorroService.crear_cuenta(db, datos, current_user.id)
        return cuenta
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/", response_model=dict)
def listar_cuentas_ahorro(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    asociado_id: Optional[int] = None,
    tipo_ahorro: Optional[str] = None,
    estado: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """
    Listar cuentas de ahorro con filtros opcionales.
    
    - **asociado_id**: Filtrar por asociado
    - **tipo_ahorro**: Filtrar por tipo de ahorro
    - **estado**: Filtrar por estado
    """
    cuentas, total = AhorroService.listar_cuentas(
        db, skip, limit, asociado_id, tipo_ahorro, estado
    )
    
    return {
        "cuentas": [CuentaAhorroResponse.from_orm(c) for c in cuentas],
        "total": total,
        "skip": skip,
        "limit": limit
    }


@router.get("/{cuenta_id}", response_model=CuentaAhorroConMovimientos)
def obtener_cuenta_ahorro(
    cuenta_id: int,
    incluir_movimientos: bool = Query(True),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """
    Obtener detalles de una cuenta de ahorro específica.
    """
    cuenta = AhorroService.obtener_cuenta(db, cuenta_id)
    if not cuenta:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cuenta no encontrada"
        )
    
    if incluir_movimientos:
        movimientos = AhorroService.obtener_movimientos(db, cuenta_id, limit=50)
        return CuentaAhorroConMovimientos(
            **cuenta.__dict__,
            movimientos=[MovimientoAhorroResponse.from_orm(m) for m in movimientos]
        )
    
    return CuentaAhorroConMovimientos(**cuenta.__dict__, movimientos=[])


@router.put("/{cuenta_id}", response_model=CuentaAhorroResponse)
def actualizar_cuenta_ahorro(
    cuenta_id: int,
    datos: CuentaAhorroActualizar,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """
    Actualizar información de una cuenta de ahorro.
    """
    cuenta = AhorroService.obtener_cuenta(db, cuenta_id)
    if not cuenta:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cuenta no encontrada"
        )
    
    cuenta_actualizada = AhorroService.actualizar_cuenta(db, cuenta, datos)
    return cuenta_actualizada


@router.post("/{cuenta_id}/cancelar", response_model=CuentaAhorroResponse)
def cancelar_cuenta_ahorro(
    cuenta_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """
    Cancelar una cuenta de ahorro.
    
    La cuenta debe tener saldo cero para poder cancelarse.
    """
    cuenta = AhorroService.obtener_cuenta(db, cuenta_id)
    if not cuenta:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cuenta no encontrada"
        )
    
    try:
        cuenta_cancelada = AhorroService.cancelar_cuenta(db, cuenta, current_user.id)
        return cuenta_cancelada
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


# ==================== ENDPOINTS DE MOVIMIENTOS ====================

@router.post("/movimientos/consignacion", response_model=MovimientoAhorroResponse, status_code=status.HTTP_201_CREATED)
def realizar_consignacion(
    datos: ConsignacionCrear,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """
    Realizar una consignación en una cuenta de ahorro.
    """
    try:
        movimiento = AhorroService.realizar_consignacion(db, datos, current_user.id)
        return movimiento
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/movimientos/retiro", response_model=MovimientoAhorroResponse, status_code=status.HTTP_201_CREATED)
def realizar_retiro(
    datos: RetiroCrear,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """
    Realizar un retiro de una cuenta de ahorro.
    
    Se aplicará GMF (4x1000) si está configurado.
    """
    try:
        movimiento = AhorroService.realizar_retiro(db, datos, current_user.id)
        return movimiento
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/movimientos/transferencia", response_model=dict, status_code=status.HTTP_201_CREATED)
def realizar_transferencia(
    datos: TransferenciaCrear,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """
    Realizar una transferencia entre cuentas de ahorro.
    """
    try:
        mov_salida, mov_entrada = AhorroService.realizar_transferencia(db, datos, current_user.id)
        return {
            "movimiento_salida": MovimientoAhorroResponse.from_orm(mov_salida),
            "movimiento_entrada": MovimientoAhorroResponse.from_orm(mov_entrada),
            "mensaje": "Transferencia realizada exitosamente"
        }
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/{cuenta_id}/movimientos", response_model=list[MovimientoAhorroResponse])
def listar_movimientos_cuenta(
    cuenta_id: int,
    fecha_inicio: Optional[date] = None,
    fecha_fin: Optional[date] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """
    Listar movimientos de una cuenta de ahorro.
    
    - **fecha_inicio**: Filtrar desde esta fecha
    - **fecha_fin**: Filtrar hasta esta fecha
    """
    cuenta = AhorroService.obtener_cuenta(db, cuenta_id)
    if not cuenta:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cuenta no encontrada"
        )
    
    movimientos = AhorroService.obtener_movimientos(
        db, cuenta_id, fecha_inicio, fecha_fin, skip, limit
    )
    
    return [MovimientoAhorroResponse.from_orm(m) for m in movimientos]


# ==================== ENDPOINTS DE ESTADÍSTICAS ====================

@router.get("/estadisticas/general", response_model=EstadisticasAhorroResponse)
def obtener_estadisticas_ahorros(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """
    Obtener estadísticas generales del sistema de ahorros.
    
    Incluye totales, promedios y distribución por tipo y estado.
    """
    estadisticas = AhorroService.obtener_estadisticas(db)
    return EstadisticasAhorroResponse(**estadisticas)


# ==================== ENDPOINTS DE CONFIGURACIÓN ====================

@router.get("/config/actual", response_model=ConfiguracionAhorroResponse)
def obtener_configuracion_ahorros(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """
    Obtener la configuración actual del sistema de ahorros.
    """
    config = AhorroService.obtener_configuracion(db)
    return ConfiguracionAhorroResponse.from_orm(config)


@router.put("/config/actualizar", response_model=ConfiguracionAhorroResponse)
def actualizar_configuracion_ahorros(
    datos: ConfiguracionAhorroActualizar,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """
    Actualizar la configuración del sistema de ahorros.
    
    Solo usuarios con permisos de administrador.
    """
    # Validar que sea admin
    if current_user.rol not in ["ADMIN", "SUPERUSUARIO"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tiene permisos para modificar la configuración"
        )
    
    config = AhorroService.actualizar_configuracion(db, datos)
    return ConfiguracionAhorroResponse.from_orm(config)
