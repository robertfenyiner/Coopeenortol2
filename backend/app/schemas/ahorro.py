"""
Schemas para el sistema de ahorros.
"""
from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, Field, validator

from app.models.ahorro import EstadoCuentaAhorro, TipoAhorro, TipoMovimientoAhorro


# ==================== SCHEMAS DE CUENTA DE AHORRO ====================

class CuentaAhorroBase(BaseModel):
    """Base para cuentas de ahorro."""
    tipo_ahorro: TipoAhorro
    tasa_interes_anual: Optional[Decimal] = Field(None, ge=0, le=100)
    observaciones: Optional[str] = None


class CuentaAhorroCrear(CuentaAhorroBase):
    """Crear una cuenta de ahorro."""
    asociado_id: int
    monto_inicial: Decimal = Field(..., gt=0, description="Monto inicial de apertura")
    
    # Para ahorro programado
    meta_ahorro: Optional[Decimal] = Field(None, gt=0)
    cuota_mensual: Optional[Decimal] = Field(None, gt=0)
    fecha_inicio_programado: Optional[date] = None
    fecha_fin_programado: Optional[date] = None
    
    # Para CDAT
    plazo_dias: Optional[int] = Field(None, gt=0, le=1825)  # Máximo 5 años
    renovacion_automatica: Optional[bool] = False
    
    @validator('tipo_ahorro')
    def validar_tipo_ahorro(cls, v):
        tipos_validos = ['a_la_vista', 'programado', 'cdat', 'contractual', 'aportes']
        if v not in tipos_validos:
            raise ValueError(f'Tipo de ahorro debe ser uno de: {", ".join(tipos_validos)}')
        return v


class CuentaAhorroActualizar(BaseModel):
    """Actualizar información de cuenta de ahorro."""
    estado: Optional[EstadoCuentaAhorro] = None
    tasa_interes_anual: Optional[Decimal] = Field(None, ge=0, le=100)
    meta_ahorro: Optional[Decimal] = Field(None, gt=0)
    cuota_mensual: Optional[Decimal] = Field(None, gt=0)
    observaciones: Optional[str] = None


class CuentaAhorroResponse(CuentaAhorroBase):
    """Respuesta con información de cuenta de ahorro."""
    id: int
    numero_cuenta: str
    asociado_id: int
    estado: EstadoCuentaAhorro
    saldo_disponible: Decimal
    saldo_bloqueado: Decimal
    cuota_manejo: Decimal
    
    # Programado
    meta_ahorro: Optional[Decimal] = None
    cuota_mensual: Optional[Decimal] = None
    fecha_inicio_programado: Optional[date] = None
    fecha_fin_programado: Optional[date] = None
    
    # CDAT
    plazo_dias: Optional[int] = None
    fecha_apertura_cdat: Optional[date] = None
    fecha_vencimiento_cdat: Optional[date] = None
    renovacion_automatica: Optional[bool] = None
    
    # Auditoría
    fecha_apertura: datetime
    fecha_cancelacion: Optional[datetime] = None
    abierta_por_id: int
    
    class Config:
        orm_mode = True
        from_attributes = True


class CuentaAhorroConMovimientos(CuentaAhorroResponse):
    """Cuenta de ahorro con sus movimientos."""
    movimientos: list["MovimientoAhorroResponse"] = []


# ==================== SCHEMAS DE MOVIMIENTO ====================

class MovimientoAhorroCrear(BaseModel):
    """Crear un movimiento de ahorro."""
    cuenta_id: int
    tipo_movimiento: TipoMovimientoAhorro
    valor: Decimal = Field(..., gt=0)
    descripcion: str = Field(..., min_length=3, max_length=500)
    referencia: Optional[str] = Field(None, max_length=100)
    
    @validator('tipo_movimiento')
    def validar_tipo_movimiento(cls, v):
        tipos_validos = [
            'apertura', 'consignacion', 'retiro', 'interes',
            'gmf', 'cuota_manejo', 'transferencia_entrada',
            'transferencia_salida', 'cancelacion'
        ]
        if v not in tipos_validos:
            raise ValueError(f'Tipo de movimiento debe ser uno de: {", ".join(tipos_validos)}')
        return v


class ConsignacionCrear(BaseModel):
    """Crear una consignación."""
    cuenta_id: int
    valor: Decimal = Field(..., gt=0)
    referencia: Optional[str] = None
    descripcion: Optional[str] = "Consignación"


class RetiroCrear(BaseModel):
    """Crear un retiro."""
    cuenta_id: int
    valor: Decimal = Field(..., gt=0)
    referencia: Optional[str] = None
    descripcion: Optional[str] = "Retiro"


class TransferenciaCrear(BaseModel):
    """Crear una transferencia entre cuentas."""
    cuenta_origen_id: int
    cuenta_destino_id: int
    valor: Decimal = Field(..., gt=0)
    descripcion: Optional[str] = "Transferencia"


class MovimientoAhorroResponse(BaseModel):
    """Respuesta con información de movimiento."""
    id: int
    numero_movimiento: str
    cuenta_id: int
    tipo_movimiento: TipoMovimientoAhorro
    valor: Decimal
    saldo_anterior: Decimal
    saldo_nuevo: Decimal
    descripcion: str
    referencia: Optional[str] = None
    realizado_por_id: int
    fecha_movimiento: datetime
    
    class Config:
        orm_mode = True
        from_attributes = True


# ==================== SCHEMAS DE CONFIGURACIÓN ====================

class ConfiguracionAhorroResponse(BaseModel):
    """Respuesta con configuración de ahorros."""
    id: int
    tasa_ahorro_vista: Decimal
    tasa_ahorro_programado: Decimal
    tasa_cdat: Decimal
    tasa_aportes: Decimal
    monto_minimo_apertura: Decimal
    monto_minimo_consignacion: Decimal
    monto_minimo_cdat: Decimal
    gmf_activo: bool
    tasa_gmf: Decimal
    cuota_manejo_mensual: Decimal
    updated_at: datetime
    
    class Config:
        orm_mode = True
        from_attributes = True


class ConfiguracionAhorroActualizar(BaseModel):
    """Actualizar configuración de ahorros."""
    tasa_ahorro_vista: Optional[Decimal] = Field(None, ge=0, le=100)
    tasa_ahorro_programado: Optional[Decimal] = Field(None, ge=0, le=100)
    tasa_cdat: Optional[Decimal] = Field(None, ge=0, le=100)
    tasa_aportes: Optional[Decimal] = Field(None, ge=0, le=100)
    monto_minimo_apertura: Optional[Decimal] = Field(None, ge=0)
    monto_minimo_consignacion: Optional[Decimal] = Field(None, ge=0)
    monto_minimo_cdat: Optional[Decimal] = Field(None, ge=0)
    gmf_activo: Optional[bool] = None
    tasa_gmf: Optional[Decimal] = Field(None, ge=0, le=10)
    cuota_manejo_mensual: Optional[Decimal] = Field(None, ge=0)


# ==================== SCHEMAS DE REPORTES ====================

class EstadisticasAhorroResponse(BaseModel):
    """Estadísticas generales de ahorros."""
    total_cuentas: int
    total_cuentas_activas: int
    total_ahorro: Decimal
    total_por_tipo: dict[str, Decimal]
    cuentas_por_estado: dict[str, int]
    promedio_saldo: Decimal


class ExtractoAhorroResponse(BaseModel):
    """Extracto de cuenta de ahorro."""
    cuenta: CuentaAhorroResponse
    movimientos: list[MovimientoAhorroResponse]
    periodo_inicio: date
    periodo_fin: date
    saldo_inicial: Decimal
    saldo_final: Decimal
    total_consignaciones: Decimal
    total_retiros: Decimal
