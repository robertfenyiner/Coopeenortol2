"""
Schemas Pydantic para el módulo de contabilidad.
"""
from datetime import date, datetime
from decimal import Decimal
from typing import Optional, List

from pydantic import BaseModel, Field, validator


# ============================================================================
# CUENTAS CONTABLES
# ============================================================================

class CuentaContableBase(BaseModel):
    """Base para cuenta contable."""
    codigo: str = Field(..., max_length=20, description="Código de la cuenta")
    nombre: str = Field(..., max_length=200, description="Nombre de la cuenta")
    tipo: str = Field(..., description="Tipo de cuenta: activo, pasivo, patrimonio, ingreso, gasto")
    naturaleza: str = Field(..., description="Naturaleza: debito o credito")
    nivel: int = Field(..., ge=1, le=4, description="Nivel jerárquico (1-4)")
    es_auxiliar: bool = Field(default=False, description="Si acepta movimientos directos")
    descripcion: Optional[str] = Field(None, max_length=1000)

    @validator("tipo")
    def validar_tipo(cls, v):
        tipos_validos = ["activo", "pasivo", "patrimonio", "ingreso", "gasto"]
        if v not in tipos_validos:
            raise ValueError(f"Tipo debe ser uno de: {', '.join(tipos_validos)}")
        return v

    @validator("naturaleza")
    def validar_naturaleza(cls, v):
        if v not in ["debito", "credito"]:
            raise ValueError("Naturaleza debe ser 'debito' o 'credito'")
        return v


class CuentaContableCrear(CuentaContableBase):
    """Schema para crear cuenta contable."""
    cuenta_padre_id: Optional[int] = Field(None, description="ID de la cuenta padre")


class CuentaContableActualizar(BaseModel):
    """Schema para actualizar cuenta contable."""
    nombre: Optional[str] = Field(None, max_length=200)
    descripcion: Optional[str] = Field(None, max_length=1000)
    activa: Optional[bool] = None
    es_auxiliar: Optional[bool] = None


class CuentaContableEnDB(CuentaContableBase):
    """Schema para cuenta contable en BD."""
    id: int
    cuenta_padre_id: Optional[int] = None
    activa: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True


class CuentaContableConSaldo(CuentaContableEnDB):
    """Schema con saldo calculado."""
    saldo_debito: Decimal = Field(default=Decimal("0.00"))
    saldo_credito: Decimal = Field(default=Decimal("0.00"))
    saldo_neto: Decimal = Field(default=Decimal("0.00"))


# ============================================================================
# MOVIMIENTOS CONTABLES
# ============================================================================

class MovimientoContableBase(BaseModel):
    """Base para movimiento contable."""
    cuenta_id: int = Field(..., description="ID de la cuenta contable")
    debito: Decimal = Field(default=Decimal("0.00"), ge=0, description="Valor débito")
    credito: Decimal = Field(default=Decimal("0.00"), ge=0, description="Valor crédito")
    detalle: Optional[str] = Field(None, max_length=500)
    tercero_tipo: Optional[str] = Field(None, max_length=50)
    tercero_id: Optional[int] = None

    @validator("debito", "credito")
    def validar_dos_decimales(cls, v):
        """Asegurar máximo 2 decimales."""
        if v is not None:
            return round(v, 2)
        return v

    @validator("credito")
    def validar_debito_o_credito(cls, v, values):
        """Validar que solo haya débito o crédito, no ambos."""
        debito = values.get("debito", Decimal("0"))
        if debito > 0 and v > 0:
            raise ValueError("Un movimiento no puede tener débito y crédito simultáneamente")
        if debito == 0 and v == 0:
            raise ValueError("Un movimiento debe tener débito o crédito")
        return v


class MovimientoContableCrear(MovimientoContableBase):
    """Schema para crear movimiento."""
    pass


class MovimientoContableEnDB(MovimientoContableBase):
    """Schema para movimiento en BD."""
    id: int
    asiento_id: int
    created_at: datetime

    class Config:
        orm_mode = True


class MovimientoContableConCuenta(MovimientoContableEnDB):
    """Movimiento con información de la cuenta."""
    cuenta_codigo: Optional[str] = None
    cuenta_nombre: Optional[str] = None


# ============================================================================
# ASIENTOS CONTABLES
# ============================================================================

class AsientoContableBase(BaseModel):
    """Base para asiento contable."""
    fecha: date = Field(..., description="Fecha del asiento")
    tipo_movimiento: str = Field(..., description="Tipo de movimiento")
    concepto: str = Field(..., max_length=500, description="Concepto del asiento")
    observaciones: Optional[str] = Field(None, max_length=2000)
    documento_referencia: Optional[str] = Field(None, max_length=100)

    @validator("tipo_movimiento")
    def validar_tipo_movimiento(cls, v):
        tipos_validos = [
            "aporte", "retiro", "prestamo", "pago_prestamo",
            "interes", "ajuste", "cierre", "apertura", "otro"
        ]
        if v not in tipos_validos:
            raise ValueError(f"Tipo debe ser uno de: {', '.join(tipos_validos)}")
        return v


class AsientoContableCrear(AsientoContableBase):
    """Schema para crear asiento contable con sus movimientos."""
    movimientos: List[MovimientoContableCrear] = Field(
        ..., min_items=2, description="Lista de movimientos (mínimo 2)"
    )

    @validator("movimientos")
    def validar_partida_doble(cls, v):
        """Validar que débitos = créditos (partida doble)."""
        total_debito = sum(m.debito for m in v)
        total_credito = sum(m.credito for m in v)
        
        if abs(total_debito - total_credito) > Decimal("0.01"):
            raise ValueError(
                f"El asiento no cuadra. Débitos: {total_debito}, Créditos: {total_credito}"
            )
        
        return v


class AsientoContableEnDB(AsientoContableBase):
    """Schema para asiento en BD."""
    id: int
    numero: str
    total_debito: Decimal
    total_credito: Decimal
    cuadrado: bool
    registrado_por_id: int
    fecha_registro: datetime
    anulado: bool
    fecha_anulacion: Optional[datetime] = None
    anulado_por_id: Optional[int] = None
    motivo_anulacion: Optional[str] = None

    class Config:
        orm_mode = True


class AsientoContableCompleto(AsientoContableEnDB):
    """Asiento con sus movimientos."""
    movimientos: List[MovimientoContableConCuenta] = []


class AsientoAnular(BaseModel):
    """Schema para anular un asiento."""
    motivo: str = Field(..., min_length=10, max_length=500, description="Motivo de anulación")


# ============================================================================
# APORTES
# ============================================================================

class AporteBase(BaseModel):
    """Base para aporte."""
    asociado_id: int = Field(..., description="ID del asociado")
    fecha: date = Field(..., description="Fecha del aporte")
    valor: Decimal = Field(..., gt=0, description="Valor del aporte")
    tipo_aporte: str = Field(default="ordinario", description="Tipo: ordinario, extraordinario")
    numero_recibo: Optional[str] = Field(None, max_length=50)
    concepto: Optional[str] = Field(None, max_length=500)
    observaciones: Optional[str] = Field(None, max_length=2000)

    @validator("tipo_aporte")
    def validar_tipo_aporte(cls, v):
        if v not in ["ordinario", "extraordinario"]:
            raise ValueError("Tipo debe ser 'ordinario' o 'extraordinario'")
        return v

    @validator("valor")
    def validar_dos_decimales(cls, v):
        return round(v, 2)


class AporteCrear(AporteBase):
    """Schema para crear aporte."""
    generar_asiento: bool = Field(
        default=True,
        description="Si debe generar asiento contable automáticamente"
    )


class AporteActualizar(BaseModel):
    """Schema para actualizar aporte."""
    tipo_aporte: Optional[str] = None
    concepto: Optional[str] = None
    observaciones: Optional[str] = None
    estado: Optional[str] = None

    @validator("estado")
    def validar_estado(cls, v):
        if v is not None and v not in ["pagado", "pendiente", "anulado"]:
            raise ValueError("Estado debe ser: pagado, pendiente o anulado")
        return v


class AporteEnDB(AporteBase):
    """Schema para aporte en BD."""
    id: int
    asiento_id: Optional[int] = None
    estado: str
    registrado_por_id: int
    fecha_registro: datetime

    class Config:
        orm_mode = True


# ============================================================================
# REPORTES Y CONSULTAS
# ============================================================================

class BalanceGeneralRequest(BaseModel):
    """Request para balance general."""
    fecha_corte: date = Field(..., description="Fecha de corte del balance")
    incluir_nivel: int = Field(default=3, ge=1, le=4, description="Nivel de detalle (1-4)")


class BalanceGeneralResponse(BaseModel):
    """Response de balance general."""
    fecha_corte: date
    activos: List[CuentaContableConSaldo]
    pasivos: List[CuentaContableConSaldo]
    patrimonio: List[CuentaContableConSaldo]
    total_activos: Decimal
    total_pasivos: Decimal
    total_patrimonio: Decimal
    cuadrado: bool


class EstadoResultadosRequest(BaseModel):
    """Request para estado de resultados."""
    fecha_inicio: date = Field(..., description="Fecha inicial del periodo")
    fecha_fin: date = Field(..., description="Fecha final del periodo")
    incluir_nivel: int = Field(default=3, ge=1, le=4)


class EstadoResultadosResponse(BaseModel):
    """Response de estado de resultados."""
    fecha_inicio: date
    fecha_fin: date
    ingresos: List[CuentaContableConSaldo]
    gastos: List[CuentaContableConSaldo]
    total_ingresos: Decimal
    total_gastos: Decimal
    utilidad_neta: Decimal


class LibroMayorRequest(BaseModel):
    """Request para libro mayor."""
    cuenta_id: int = Field(..., description="ID de la cuenta")
    fecha_inicio: date = Field(..., description="Fecha inicial")
    fecha_fin: date = Field(..., description="Fecha final")


class MovimientoLibroMayor(BaseModel):
    """Movimiento en libro mayor."""
    fecha: date
    asiento_numero: str
    concepto: str
    debito: Decimal
    credito: Decimal
    saldo: Decimal


class LibroMayorResponse(BaseModel):
    """Response de libro mayor."""
    cuenta: CuentaContableEnDB
    fecha_inicio: date
    fecha_fin: date
    saldo_inicial: Decimal
    movimientos: List[MovimientoLibroMayor]
    saldo_final: Decimal
    total_debitos: Decimal
    total_creditos: Decimal


class EstadisticasContables(BaseModel):
    """Estadísticas generales de contabilidad."""
    total_cuentas: int
    total_asientos: int
    total_movimientos: int
    total_aportes: int
    suma_aportes: Decimal
    ultimo_asiento: Optional[str] = None
    ultimo_asiento_fecha: Optional[date] = None
