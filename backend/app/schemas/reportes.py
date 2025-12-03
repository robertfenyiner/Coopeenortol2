"""
Schemas para reportes financieros.
"""
from datetime import date
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, Field


# ============================================================================
# BALANCE GENERAL
# ============================================================================

class CuentaBalance(BaseModel):
    """Cuenta en el balance."""
    codigo: str
    nombre: str
    saldo: Decimal
    
    class Config:
        from_attributes = True


class GrupoBalance(BaseModel):
    """Grupo de cuentas en el balance."""
    nombre: str
    total: Decimal
    cuentas: List[CuentaBalance]


class BalanceGeneralResponse(BaseModel):
    """Response del Balance General."""
    fecha_corte: date
    activos: List[GrupoBalance]
    pasivos: List[GrupoBalance]
    patrimonio: List[GrupoBalance]
    total_activos: Decimal
    total_pasivos: Decimal
    total_patrimonio: Decimal
    cuadrado: bool  # Activos = Pasivos + Patrimonio


# ============================================================================
# ESTADO DE RESULTADOS
# ============================================================================

class CuentaResultados(BaseModel):
    """Cuenta en el estado de resultados."""
    codigo: str
    nombre: str
    valor: Decimal
    
    class Config:
        from_attributes = True


class EstadoResultadosResponse(BaseModel):
    """Response del Estado de Resultados."""
    fecha_inicio: date
    fecha_fin: date
    ingresos: List[CuentaResultados]
    gastos: List[CuentaResultados]
    total_ingresos: Decimal
    total_gastos: Decimal
    utilidad_neta: Decimal  # Ingresos - Gastos
    margen_utilidad: Decimal  # (Utilidad / Ingresos) * 100


# ============================================================================
# REPORTE DE CARTERA
# ============================================================================

class CreditoCartera(BaseModel):
    """Crédito en el reporte de cartera."""
    numero_credito: str
    asociado_nombre: str
    asociado_documento: str
    tipo_credito: str
    monto_desembolsado: Decimal
    saldo_capital: Decimal
    saldo_interes: Decimal
    saldo_mora: Decimal
    dias_mora: int
    estado: str
    fecha_desembolso: Optional[date]
    fecha_ultimo_pago: Optional[date]


class EstadisticasCartera(BaseModel):
    """Estadísticas de la cartera."""
    total_creditos: int
    cartera_total: Decimal
    cartera_al_dia: Decimal
    cartera_mora: Decimal
    cartera_castigada: Decimal
    tasa_mora: Decimal  # (Cartera mora / Cartera total) * 100
    creditos_mora: int
    monto_provision: Decimal


class ReporteCarteraResponse(BaseModel):
    """Response del reporte de cartera."""
    fecha_corte: date
    estadisticas: EstadisticasCartera
    creditos: List[CreditoCartera]
    por_tipo: dict  # {tipo_credito: {total: Decimal, creditos: int}}


# ============================================================================
# REPORTE DE MORA
# ============================================================================

class CreditoMora(BaseModel):
    """Crédito en mora."""
    numero_credito: str
    asociado_id: int
    asociado_nombre: str
    asociado_documento: str
    asociado_telefono: Optional[str]
    tipo_credito: str
    saldo_capital: Decimal
    saldo_mora: Decimal
    dias_mora: int
    rango_mora: str  # "1-30", "31-60", "61-90", "90+"
    fecha_ultimo_pago: Optional[date]


class ReporteMoraResponse(BaseModel):
    """Response del reporte de mora."""
    fecha_generacion: date
    dias_mora_minimo: int
    total_creditos_mora: int
    monto_total_mora: Decimal
    creditos: List[CreditoMora]
    por_rango: dict  # {rango: {creditos: int, monto: Decimal}}


# ============================================================================
# ESTADO DE CUENTA DEL ASOCIADO
# ============================================================================

class AportesAsociado(BaseModel):
    """Resumen de aportes del asociado."""
    total_aportes: Decimal
    numero_aportes: int
    ultimo_aporte_fecha: Optional[date]
    ultimo_aporte_valor: Optional[Decimal]


class CreditoAsociado(BaseModel):
    """Crédito del asociado."""
    numero_credito: str
    tipo_credito: str
    monto_desembolsado: Decimal
    saldo_capital: Decimal
    valor_cuota: Decimal
    estado: str
    dias_mora: int


class CuentaAhorroAsociado(BaseModel):
    """Cuenta de ahorro del asociado."""
    numero_cuenta: str
    tipo_ahorro: str
    saldo_actual: Decimal
    estado: str


class EstadoCuentaAsociadoResponse(BaseModel):
    """Response del estado de cuenta."""
    asociado_id: int
    nombres: str
    apellidos: str
    numero_documento: str
    fecha_generacion: date
    fecha_inicio: Optional[date]
    fecha_fin: date
    
    # Resúmenes
    aportes: AportesAsociado
    creditos: List[CreditoAsociado]
    cuentas_ahorro: List[CuentaAhorroAsociado]
    
    # Totales
    total_aportes: Decimal
    total_deuda: Decimal
    total_ahorros: Decimal
    patrimonio_neto: Decimal  # Aportes + Ahorros - Deuda


# ============================================================================
# ESTADÍSTICAS GENERALES
# ============================================================================

class EstadisticasAsociados(BaseModel):
    """Estadísticas de asociados."""
    total: int
    activos: int
    inactivos: int
    nuevos_mes: int


class EstadisticasCarteraGeneral(BaseModel):
    """Estadísticas generales de cartera."""
    total_cartera: Decimal
    cartera_al_dia: Decimal
    cartera_mora: Decimal
    tasa_mora: Decimal
    creditos_activos: int


class EstadisticasAhorros(BaseModel):
    """Estadísticas de ahorros."""
    total_ahorros: Decimal
    cuentas_activas: int
    ahorro_promedio: Decimal


class EstadisticasGeneralesResponse(BaseModel):
    """Response de estadísticas generales."""
    fecha_generacion: date
    asociados: EstadisticasAsociados
    cartera: EstadisticasCarteraGeneral
    ahorros: EstadisticasAhorros
    aportes_totales: Decimal
    operaciones_mes: int
