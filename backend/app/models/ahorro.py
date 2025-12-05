"""
Modelos para el sistema de ahorros.
"""
from datetime import datetime
from decimal import Decimal
from enum import Enum

from sqlalchemy import (
    Boolean,
    Column,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from app.database import Base


class TipoAhorro(str, Enum):
    """Tipos de cuentas de ahorro."""
    A_LA_VISTA = "a_la_vista"
    PROGRAMADO = "programado"
    CDAT = "cdat"
    CONTRACTUAL = "contractual"
    APORTES = "aportes"


class EstadoCuentaAhorro(str, Enum):
    """Estados de una cuenta de ahorro."""
    ACTIVA = "activa"
    INACTIVA = "inactiva"
    BLOQUEADA = "bloqueada"
    CANCELADA = "cancelada"


class TipoMovimientoAhorro(str, Enum):
    """Tipos de movimientos de ahorro."""
    APERTURA = "apertura"
    CONSIGNACION = "consignacion"
    RETIRO = "retiro"
    INTERES = "interes"
    GMF = "gmf"  # Gravamen Movimientos Financieros
    CUOTA_MANEJO = "cuota_manejo"
    TRANSFERENCIA_ENTRADA = "transferencia_entrada"
    TRANSFERENCIA_SALIDA = "transferencia_salida"
    CANCELACION = "cancelacion"


class CuentaAhorro(Base):
    """Modelo para cuentas de ahorro."""
    __tablename__ = "cuentas_ahorro"

    id = Column(Integer, primary_key=True, index=True)
    numero_cuenta = Column(String(20), unique=True, nullable=False, index=True)
    
    # Relaciones
    asociado_id = Column(Integer, ForeignKey("asociados.id"), nullable=False)
    
    # Información de la cuenta
    tipo_ahorro = Column(String(50), nullable=False)  # TipoAhorro
    estado = Column(String(20), nullable=False, default=EstadoCuentaAhorro.ACTIVA.value)
    
    # Montos
    saldo_disponible = Column(Numeric(15, 2), nullable=False, default=Decimal("0"))
    saldo_bloqueado = Column(Numeric(15, 2), nullable=False, default=Decimal("0"))
    
    # Configuración
    tasa_interes_anual = Column(Numeric(5, 2), nullable=False, default=Decimal("0"))
    cuota_manejo = Column(Numeric(10, 2), nullable=False, default=Decimal("0"))
    
    # Para ahorro programado
    meta_ahorro = Column(Numeric(15, 2), nullable=True)
    cuota_mensual = Column(Numeric(15, 2), nullable=True)
    fecha_inicio_programado = Column(Date, nullable=True)
    fecha_fin_programado = Column(Date, nullable=True)
    
    # Para CDAT
    plazo_dias = Column(Integer, nullable=True)
    fecha_apertura_cdat = Column(Date, nullable=True)
    fecha_vencimiento_cdat = Column(Date, nullable=True)
    renovacion_automatica = Column(Boolean, default=False)
    
    # Relación con asiento contable de apertura
    asiento_apertura_id = Column(Integer, ForeignKey("asientos_contables.id"), nullable=True)
    
    # Usuarios
    abierta_por_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    
    # Observaciones
    observaciones = Column(Text, nullable=True)
    
    # Auditoría
    fecha_apertura = Column(DateTime, nullable=False, default=datetime.utcnow)
    fecha_cancelacion = Column(DateTime, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )
    
    # Relaciones
    asociado = relationship("Asociado", back_populates="cuentas_ahorro")
    movimientos = relationship("MovimientoAhorro", back_populates="cuenta", cascade="all, delete-orphan")
    abierta_por = relationship("Usuario", foreign_keys=[abierta_por_id])


class MovimientoAhorro(Base):
    """Modelo para movimientos de cuentas de ahorro."""
    __tablename__ = "movimientos_ahorro"

    id = Column(Integer, primary_key=True, index=True)
    numero_movimiento = Column(String(30), unique=True, nullable=False, index=True)
    
    # Relaciones
    cuenta_id = Column(Integer, ForeignKey("cuentas_ahorro.id"), nullable=False)
    
    # Información del movimiento
    tipo_movimiento = Column(String(50), nullable=False)  # TipoMovimientoAhorro
    valor = Column(Numeric(15, 2), nullable=False)
    
    # Saldos después del movimiento
    saldo_anterior = Column(Numeric(15, 2), nullable=False)
    saldo_nuevo = Column(Numeric(15, 2), nullable=False)
    
    # Detalles
    descripcion = Column(Text, nullable=False)
    referencia = Column(String(100), nullable=True)  # Número de comprobante, etc.
    
    # Relación con asiento contable
    asiento_id = Column(Integer, ForeignKey("asientos_contables.id"), nullable=True)
    
    # Usuario que realiza el movimiento
    realizado_por_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    
    # Auditoría
    fecha_movimiento = Column(DateTime, nullable=False, default=datetime.utcnow)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    
    # Relaciones
    cuenta = relationship("CuentaAhorro", back_populates="movimientos")
    realizado_por = relationship("Usuario")


class ConfiguracionAhorro(Base):
    """Configuración general del sistema de ahorros."""
    __tablename__ = "configuracion_ahorro"

    id = Column(Integer, primary_key=True, index=True)
    
    # Tasas de interés por defecto
    tasa_ahorro_vista = Column(Numeric(5, 2), nullable=False, default=Decimal("0.5"))
    tasa_ahorro_programado = Column(Numeric(5, 2), nullable=False, default=Decimal("2.0"))
    tasa_cdat = Column(Numeric(5, 2), nullable=False, default=Decimal("4.0"))
    tasa_aportes = Column(Numeric(5, 2), nullable=False, default=Decimal("1.0"))
    
    # Montos mínimos
    monto_minimo_apertura = Column(Numeric(15, 2), nullable=False, default=Decimal("50000"))
    monto_minimo_consignacion = Column(Numeric(15, 2), nullable=False, default=Decimal("10000"))
    monto_minimo_cdat = Column(Numeric(15, 2), nullable=False, default=Decimal("1000000"))
    
    # GMF
    gmf_activo = Column(Boolean, default=True)
    tasa_gmf = Column(Numeric(5, 4), nullable=False, default=Decimal("0.4"))  # 4x1000
    
    # Cuotas de manejo
    cuota_manejo_mensual = Column(Numeric(10, 2), nullable=False, default=Decimal("0"))
    
    # Auditoría
    updated_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )
