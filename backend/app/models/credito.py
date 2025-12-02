"""
Modelos para el módulo de créditos.
"""
from datetime import date, datetime
from decimal import Decimal
from enum import Enum

from sqlalchemy import (
    Boolean, Column, Date, DateTime, Enum as SQLEnum,
    ForeignKey, Integer, Numeric, String, Text
)
from sqlalchemy.orm import relationship

from app.database import Base


class EstadoCredito(str, Enum):
    """Estados posibles de un crédito."""
    SOLICITADO = "solicitado"
    EN_ESTUDIO = "en_estudio"
    APROBADO = "aprobado"
    RECHAZADO = "rechazado"
    DESEMBOLSADO = "desembolsado"
    AL_DIA = "al_dia"
    MORA = "mora"
    CANCELADO = "cancelado"
    CASTIGADO = "castigado"


class TipoCredito(str, Enum):
    """Tipos de crédito disponibles."""
    CONSUMO = "consumo"
    VIVIENDA = "vivienda"
    VEHICULO = "vehiculo"
    EDUCACION = "educacion"
    MICROEMPRESA = "microempresa"
    CALAMIDAD = "calamidad"
    LIBRE_INVERSION = "libre_inversion"


class ModalidadPago(str, Enum):
    """Modalidades de pago de cuotas."""
    MENSUAL = "mensual"
    QUINCENAL = "quincenal"
    SEMANAL = "semanal"


class TipoCuota(str, Enum):
    """Tipo de amortización."""
    FIJA = "fija"  # Cuota fija (amortización francesa)
    VARIABLE = "variable"  # Cuota variable (amortización alemana)


class EstadoCuota(str, Enum):
    """Estado de una cuota."""
    PENDIENTE = "pendiente"
    PAGADA = "pagada"
    MORA = "mora"
    REFINANCIADA = "refinanciada"


class Credito(Base):
    """Modelo para créditos otorgados a asociados."""
    __tablename__ = "creditos"

    id = Column(Integer, primary_key=True, index=True)
    numero_credito = Column(String(50), unique=True, nullable=False, index=True)
    
    # Asociado
    asociado_id = Column(Integer, ForeignKey("asociados.id"), nullable=False, index=True)
    
    # Información del crédito
    tipo_credito = Column(SQLEnum(TipoCredito), nullable=False)
    monto_solicitado = Column(Numeric(15, 2), nullable=False)
    monto_aprobado = Column(Numeric(15, 2), nullable=True)
    monto_desembolsado = Column(Numeric(15, 2), nullable=True)
    tasa_interes = Column(Numeric(5, 2), nullable=False)  # Porcentaje anual
    plazo_meses = Column(Integer, nullable=False)
    modalidad_pago = Column(SQLEnum(ModalidadPago), default=ModalidadPago.MENSUAL)
    tipo_cuota = Column(SQLEnum(TipoCuota), default=TipoCuota.FIJA)
    
    # Destino del crédito
    destino = Column(String(500), nullable=False)
    garantia = Column(Text, nullable=True)
    
    # Fechas
    fecha_solicitud = Column(Date, nullable=False, default=date.today)
    fecha_aprobacion = Column(Date, nullable=True)
    fecha_desembolso = Column(Date, nullable=True)
    fecha_primer_pago = Column(Date, nullable=True)
    fecha_ultimo_pago = Column(Date, nullable=True)
    
    # Estado
    estado = Column(SQLEnum(EstadoCredito), default=EstadoCredito.SOLICITADO, nullable=False)
    motivo_rechazo = Column(Text, nullable=True)
    
    # Cálculos
    valor_cuota = Column(Numeric(15, 2), nullable=True)
    total_intereses = Column(Numeric(15, 2), nullable=True)
    total_a_pagar = Column(Numeric(15, 2), nullable=True)
    
    # Saldos actuales
    saldo_capital = Column(Numeric(15, 2), default=0)
    saldo_interes = Column(Numeric(15, 2), default=0)
    saldo_mora = Column(Numeric(15, 2), default=0)
    dias_mora = Column(Integer, default=0)
    
    # Usuarios responsables
    solicitado_por_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    aprobado_por_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    desembolsado_por_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    
    # Observaciones
    observaciones = Column(Text, nullable=True)
    
    # Asiento contable
    asiento_desembolso_id = Column(Integer, ForeignKey("asientos_contables.id"), nullable=True)
    
    # Auditoría
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relaciones
    asociado = relationship("Asociado", back_populates="creditos")
    cuotas = relationship("Cuota", back_populates="credito", cascade="all, delete-orphan")
    pagos = relationship("Pago", back_populates="credito", cascade="all, delete-orphan")
    solicitado_por = relationship("Usuario", foreign_keys=[solicitado_por_id])
    aprobado_por = relationship("Usuario", foreign_keys=[aprobado_por_id])
    desembolsado_por = relationship("Usuario", foreign_keys=[desembolsado_por_id])


class Cuota(Base):
    """Modelo para las cuotas de un crédito."""
    __tablename__ = "cuotas"

    id = Column(Integer, primary_key=True, index=True)
    credito_id = Column(Integer, ForeignKey("creditos.id"), nullable=False, index=True)
    
    numero_cuota = Column(Integer, nullable=False)
    fecha_vencimiento = Column(Date, nullable=False, index=True)
    
    # Montos
    valor_cuota = Column(Numeric(15, 2), nullable=False)
    capital = Column(Numeric(15, 2), nullable=False)
    interes = Column(Numeric(15, 2), nullable=False)
    saldo_pendiente = Column(Numeric(15, 2), nullable=False)  # Saldo de capital después de pagar
    
    # Pagos
    valor_pagado = Column(Numeric(15, 2), default=0)
    fecha_pago = Column(Date, nullable=True)
    dias_mora = Column(Integer, default=0)
    valor_mora = Column(Numeric(15, 2), default=0)
    
    # Estado
    estado = Column(SQLEnum(EstadoCuota), default=EstadoCuota.PENDIENTE, nullable=False)
    
    # Auditoría
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relaciones
    credito = relationship("Credito", back_populates="cuotas")
    abonos = relationship("AbonoCuota", back_populates="cuota", cascade="all, delete-orphan")


class Pago(Base):
    """Modelo para registrar pagos realizados a créditos."""
    __tablename__ = "pagos"

    id = Column(Integer, primary_key=True, index=True)
    credito_id = Column(Integer, ForeignKey("creditos.id"), nullable=False, index=True)
    
    numero_recibo = Column(String(50), unique=True, nullable=False)
    fecha_pago = Column(Date, nullable=False, default=date.today, index=True)
    
    # Montos
    valor_total = Column(Numeric(15, 2), nullable=False)
    valor_capital = Column(Numeric(15, 2), default=0)
    valor_interes = Column(Numeric(15, 2), default=0)
    valor_mora = Column(Numeric(15, 2), default=0)
    valor_otros = Column(Numeric(15, 2), default=0)
    
    # Método de pago
    metodo_pago = Column(String(50), nullable=False)  # efectivo, transferencia, cheque, etc.
    referencia = Column(String(100), nullable=True)  # Número de transferencia, cheque, etc.
    
    # Usuario que registra
    registrado_por_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    
    # Asiento contable
    asiento_id = Column(Integer, ForeignKey("asientos_contables.id"), nullable=True)
    
    # Observaciones
    observaciones = Column(Text, nullable=True)
    
    # Auditoría
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    
    # Relaciones
    credito = relationship("Credito", back_populates="pagos")
    registrado_por = relationship("Usuario")
    abonos = relationship("AbonoCuota", back_populates="pago", cascade="all, delete-orphan")


class AbonoCuota(Base):
    """Relación entre pagos y cuotas (un pago puede abonar a varias cuotas)."""
    __tablename__ = "abonos_cuotas"

    id = Column(Integer, primary_key=True, index=True)
    pago_id = Column(Integer, ForeignKey("pagos.id"), nullable=False)
    cuota_id = Column(Integer, ForeignKey("cuotas.id"), nullable=False)
    
    valor_abonado = Column(Numeric(15, 2), nullable=False)
    
    # Relaciones
    pago = relationship("Pago", back_populates="abonos")
    cuota = relationship("Cuota", back_populates="abonos")

