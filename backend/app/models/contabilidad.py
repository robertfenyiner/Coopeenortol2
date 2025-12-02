"""
Modelos de base de datos para el módulo de contabilidad.
"""
from datetime import datetime
from decimal import Decimal
from enum import Enum as PyEnum

from sqlalchemy import (
    Column,
    Integer,
    String,
    Numeric,
    DateTime,
    ForeignKey,
    Boolean,
    Date,
    Enum,
    Text
)
from sqlalchemy.orm import relationship

from app.database import Base


class TipoCuenta(str, PyEnum):
    """Tipos de cuentas contables según el plan de cuentas."""
    ACTIVO = "activo"
    PASIVO = "pasivo"
    PATRIMONIO = "patrimonio"
    INGRESO = "ingreso"
    GASTO = "gasto"


class NaturalezaCuenta(str, PyEnum):
    """Naturaleza de la cuenta (débito o crédito)."""
    DEBITO = "debito"
    CREDITO = "credito"


class TipoMovimiento(str, PyEnum):
    """Tipos de movimientos contables."""
    APORTE = "aporte"
    RETIRO = "retiro"
    PRESTAMO = "prestamo"
    PAGO_PRESTAMO = "pago_prestamo"
    INTERES = "interes"
    AJUSTE = "ajuste"
    CIERRE = "cierre"
    APERTURA = "apertura"
    OTRO = "otro"


class CuentaContable(Base):
    """
    Modelo para el plan de cuentas contables.
    
    Estructura jerárquica de cuentas siguiendo el PUC colombiano simplificado.
    """
    __tablename__ = "cuentas_contables"

    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String(20), unique=True, nullable=False, index=True)
    nombre = Column(String(200), nullable=False)
    tipo = Column(Enum(TipoCuenta), nullable=False, index=True)
    naturaleza = Column(Enum(NaturalezaCuenta), nullable=False)
    
    # Jerarquía de cuentas
    cuenta_padre_id = Column(Integer, ForeignKey("cuentas_contables.id"), nullable=True)
    nivel = Column(Integer, nullable=False)  # 1: Clase, 2: Grupo, 3: Cuenta, 4: Subcuenta
    
    # Estado
    es_auxiliar = Column(Boolean, default=False, nullable=False)  # Si acepta movimientos
    activa = Column(Boolean, default=True, nullable=False)
    
    # Metadata
    descripcion = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relaciones
    cuenta_padre = relationship("CuentaContable", remote_side=[id], backref="subcuentas")
    movimientos = relationship("MovimientoContable", back_populates="cuenta")

    def __repr__(self):
        return f"<CuentaContable {self.codigo} - {self.nombre}>"


class AsientoContable(Base):
    """
    Modelo para asientos contables (conjunto de movimientos que deben cuadrar).
    
    Cada asiento contable agrupa varios movimientos (débitos y créditos)
    que deben sumar cero (partida doble).
    """
    __tablename__ = "asientos_contables"

    id = Column(Integer, primary_key=True, index=True)
    numero = Column(String(50), unique=True, nullable=False, index=True)
    fecha = Column(Date, nullable=False, index=True)
    tipo_movimiento = Column(Enum(TipoMovimiento), nullable=False, index=True)
    
    # Descripción
    concepto = Column(String(500), nullable=False)
    observaciones = Column(Text, nullable=True)
    
    # Referencia
    documento_referencia = Column(String(100), nullable=True)  # Ej: Recibo #123
    
    # Control
    total_debito = Column(Numeric(15, 2), nullable=False, default=0)
    total_credito = Column(Numeric(15, 2), nullable=False, default=0)
    cuadrado = Column(Boolean, default=False, nullable=False)  # Si débitos = créditos
    
    # Auditoría
    registrado_por_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    fecha_registro = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Estado
    anulado = Column(Boolean, default=False, nullable=False)
    fecha_anulacion = Column(DateTime, nullable=True)
    anulado_por_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    motivo_anulacion = Column(Text, nullable=True)
    
    # Relaciones
    registrado_por = relationship("Usuario", foreign_keys=[registrado_por_id])
    anulado_por = relationship("Usuario", foreign_keys=[anulado_por_id])
    movimientos = relationship("MovimientoContable", back_populates="asiento", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<AsientoContable {self.numero} - {self.fecha}>"


class MovimientoContable(Base):
    """
    Modelo para movimientos contables individuales (débitos y créditos).
    
    Cada movimiento pertenece a un asiento contable y afecta una cuenta específica.
    """
    __tablename__ = "movimientos_contables"

    id = Column(Integer, primary_key=True, index=True)
    asiento_id = Column(Integer, ForeignKey("asientos_contables.id"), nullable=False, index=True)
    cuenta_id = Column(Integer, ForeignKey("cuentas_contables.id"), nullable=False, index=True)
    
    # Montos
    debito = Column(Numeric(15, 2), nullable=False, default=0)
    credito = Column(Numeric(15, 2), nullable=False, default=0)
    
    # Descripción
    detalle = Column(String(500), nullable=True)
    
    # Tercero (opcional - para cuentas de terceros)
    tercero_tipo = Column(String(50), nullable=True)  # 'asociado', 'proveedor', etc.
    tercero_id = Column(Integer, nullable=True)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relaciones
    asiento = relationship("AsientoContable", back_populates="movimientos")
    cuenta = relationship("CuentaContable", back_populates="movimientos")

    def __repr__(self):
        return f"<MovimientoContable Asiento:{self.asiento_id} Cuenta:{self.cuenta_id}>"


class Aporte(Base):
    """
    Modelo para aportes de asociados a la cooperativa.
    
    Registra los aportes que hacen los asociados como capital de la cooperativa.
    """
    __tablename__ = "aportes"

    id = Column(Integer, primary_key=True, index=True)
    asociado_id = Column(Integer, ForeignKey("asociados.id"), nullable=False, index=True)
    asiento_id = Column(Integer, ForeignKey("asientos_contables.id"), nullable=True)
    
    # Datos del aporte
    fecha = Column(Date, nullable=False, index=True)
    valor = Column(Numeric(15, 2), nullable=False)
    numero_recibo = Column(String(50), nullable=True)
    
    # Tipo de aporte
    tipo_aporte = Column(String(50), nullable=False, default="ordinario")  # ordinario, extraordinario
    
    # Descripción
    concepto = Column(String(500), nullable=True)
    observaciones = Column(Text, nullable=True)
    
    # Estado
    estado = Column(String(30), nullable=False, default="pagado")  # pagado, pendiente, anulado
    
    # Auditoría
    registrado_por_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    fecha_registro = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relaciones
    asociado = relationship("Asociado", backref="aportes")
    asiento = relationship("AsientoContable")
    registrado_por = relationship("Usuario")

    def __repr__(self):
        return f"<Aporte {self.id} - Asociado:{self.asociado_id} - ${self.valor}>"
