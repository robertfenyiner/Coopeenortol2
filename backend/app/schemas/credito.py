"""
Schemas para el módulo de créditos.
"""
from datetime import date
from decimal import Decimal
from typing import List, Optional

from pydantic import BaseModel, Field, validator


# ============================================================================
# CRÉDITOS
# ============================================================================

class CreditoBase(BaseModel):
    """Base para crédito."""
    asociado_id: int
    tipo_credito: str
    monto_solicitado: Decimal = Field(..., gt=0, description="Monto solicitado")
    tasa_interes: Decimal = Field(..., gt=0, le=100, description="Tasa de interés anual (%)")
    plazo_meses: int = Field(..., gt=0, le=360, description="Plazo en meses")
    destino: str = Field(..., min_length=10, description="Destino del crédito")
    garantia: Optional[str] = None
    modalidad_pago: str = "mensual"
    tipo_cuota: str = "fija"
    observaciones: Optional[str] = None

    @validator('tipo_credito')
    def validar_tipo_credito(cls, v):
        tipos_validos = ['consumo', 'vivienda', 'vehiculo', 'educacion', 'microempresa', 'calamidad', 'libre_inversion']
        if v not in tipos_validos:
            raise ValueError(f'Tipo de crédito debe ser uno de: {", ".join(tipos_validos)}')
        return v

    @validator('modalidad_pago')
    def validar_modalidad(cls, v):
        modalidades = ['mensual', 'quincenal', 'semanal']
        if v not in modalidades:
            raise ValueError(f'Modalidad debe ser una de: {", ".join(modalidades)}')
        return v

    @validator('tipo_cuota')
    def validar_tipo_cuota(cls, v):
        tipos = ['fija', 'variable']
        if v not in tipos:
            raise ValueError(f'Tipo de cuota debe ser: {", ".join(tipos)}')
        return v


class CreditoSolicitar(CreditoBase):
    """Schema para solicitar un crédito."""
    pass


class CreditoAprobar(BaseModel):
    """Schema para aprobar un crédito."""
    monto_aprobado: Decimal = Field(..., gt=0)
    tasa_interes: Optional[Decimal] = Field(None, gt=0, le=100)
    plazo_meses: Optional[int] = Field(None, gt=0, le=360)
    observaciones: Optional[str] = None


class CreditoRechazar(BaseModel):
    """Schema para rechazar un crédito."""
    motivo_rechazo: str = Field(..., min_length=10)


class CreditoDesembolsar(BaseModel):
    """Schema para desembolsar un crédito."""
    fecha_desembolso: date
    fecha_primer_pago: date
    generar_asiento: bool = True
    observaciones: Optional[str] = None


class CreditoActualizar(BaseModel):
    """Schema para actualizar un crédito."""
    destino: Optional[str] = None
    garantia: Optional[str] = None
    observaciones: Optional[str] = None

    class Config:
        orm_mode = True


class CreditoEnDB(CreditoBase):
    """Schema para crédito en base de datos."""
    id: int
    numero_credito: str
    estado: str
    monto_aprobado: Optional[Decimal] = None
    monto_desembolsado: Optional[Decimal] = None
    valor_cuota: Optional[Decimal] = None
    total_intereses: Optional[Decimal] = None
    total_a_pagar: Optional[Decimal] = None
    saldo_capital: Decimal
    saldo_interes: Decimal
    saldo_mora: Decimal
    dias_mora: int
    fecha_solicitud: date
    fecha_aprobacion: Optional[date] = None
    fecha_desembolso: Optional[date] = None
    fecha_primer_pago: Optional[date] = None

    class Config:
        orm_mode = True


class CreditoCompleto(CreditoEnDB):
    """Schema completo de crédito con cuotas."""
    cuotas: List['CuotaEnDB'] = []

    class Config:
        orm_mode = True


# ============================================================================
# CUOTAS
# ============================================================================

class CuotaBase(BaseModel):
    """Base para cuota."""
    numero_cuota: int
    fecha_vencimiento: date
    valor_cuota: Decimal
    capital: Decimal
    interes: Decimal
    saldo_pendiente: Decimal


class CuotaEnDB(CuotaBase):
    """Schema para cuota en base de datos."""
    id: int
    credito_id: int
    valor_pagado: Decimal
    fecha_pago: Optional[date] = None
    dias_mora: int
    valor_mora: Decimal
    estado: str

    class Config:
        orm_mode = True


# ============================================================================
# PAGOS
# ============================================================================

class PagoBase(BaseModel):
    """Base para pago."""
    credito_id: int
    valor_total: Decimal = Field(..., gt=0)
    metodo_pago: str
    referencia: Optional[str] = None
    observaciones: Optional[str] = None

    @validator('metodo_pago')
    def validar_metodo_pago(cls, v):
        metodos = ['efectivo', 'transferencia', 'cheque', 'tarjeta', 'nequi', 'daviplata']
        if v not in metodos:
            raise ValueError(f'Método de pago debe ser uno de: {", ".join(metodos)}')
        return v


class PagoCrear(PagoBase):
    """Schema para crear un pago."""
    fecha_pago: Optional[date] = None
    generar_asiento: bool = True


class PagoEnDB(PagoBase):
    """Schema para pago en base de datos."""
    id: int
    numero_recibo: str
    fecha_pago: date
    valor_capital: Decimal
    valor_interes: Decimal
    valor_mora: Decimal
    valor_otros: Decimal
    registrado_por_id: int

    class Config:
        orm_mode = True


class PagoCompleto(PagoEnDB):
    """Schema completo de pago con abonos."""
    abonos: List['AbonoEnDB'] = []

    class Config:
        orm_mode = True


# ============================================================================
# ABONOS
# ============================================================================

class AbonoEnDB(BaseModel):
    """Schema para abono a cuota."""
    id: int
    pago_id: int
    cuota_id: int
    valor_abonado: Decimal

    class Config:
        orm_mode = True


# ============================================================================
# REPORTES Y CONSULTAS
# ============================================================================

class EstadisticasCredito(BaseModel):
    """Estadísticas generales de créditos."""
    total_creditos: int
    creditos_activos: int
    creditos_al_dia: int
    creditos_en_mora: int
    total_cartera: Decimal
    total_mora: Decimal
    promedio_dias_mora: float
    tasa_morosidad: float


class ResumenCartera(BaseModel):
    """Resumen de cartera por asociado."""
    asociado_id: int
    asociado_nombre: str
    creditos_activos: int
    saldo_total: Decimal
    saldo_mora: Decimal
    dias_mora: int


class SimulacionCredito(BaseModel):
    """Simulación de crédito."""
    monto: Decimal
    tasa_interes: Decimal
    plazo_meses: int
    valor_cuota: Decimal
    total_intereses: Decimal
    total_a_pagar: Decimal
    cuotas: List[dict]


# Actualizar referencias forward
CreditoCompleto.update_forward_refs()
PagoCompleto.update_forward_refs()
