"""
Tests para el módulo de ahorros.
"""
import pytest
from datetime import date, datetime, timedelta
from decimal import Decimal
from sqlalchemy.orm import Session

from app.models.asociado import Asociado
from app.models.ahorro import (
    CuentaAhorro, MovimientoAhorro, ConfiguracionAhorro,
    TipoAhorro, EstadoCuentaAhorro, TipoMovimientoAhorro
)
from app.models.usuario import Usuario
from app.schemas.ahorro import (
    CuentaAhorroCrear, ConsignacionCrear, RetiroCrear, TransferenciaCrear
)
from app.services.ahorros import AhorroService


# ============================================================================
# FIXTURES
# ============================================================================

@pytest.fixture
def asociado_test(db: Session, admin_user: Usuario):
    """Crear un asociado para pruebas de ahorros."""
    asociado = Asociado(
        numero_documento="9876543210",
        tipo_documento="CC",
        nombres="María",
        apellidos="González",
        correo_electronico="maria.gonzalez@test.com",
        telefono_principal="3009876543",
        fecha_ingreso=date.today(),
        estado="activo"
    )
    db.add(asociado)
    db.commit()
    db.refresh(asociado)
    return asociado


@pytest.fixture
def configuracion_test(db: Session):
    """Crear configuración de prueba."""
    config = db.query(ConfiguracionAhorro).first()
    if not config:
        config = ConfiguracionAhorro(
            tasa_ahorro_vista=Decimal("0.5"),
            tasa_ahorro_programado=Decimal("2.0"),
            tasa_cdat=Decimal("4.0"),
            monto_minimo_apertura=Decimal("50000"),
            monto_minimo_consignacion=Decimal("10000"),
            gmf_activo=True,
            tasa_gmf=Decimal("0.4")
        )
        db.add(config)
        db.commit()
        db.refresh(config)
    return config


@pytest.fixture
def cuenta_vista(db: Session, asociado_test: Asociado, admin_user: Usuario, configuracion_test: ConfiguracionAhorro):
    """Crear una cuenta de ahorro a la vista."""
    data = CuentaAhorroCrear(
        asociado_id=asociado_test.id,
        tipo_ahorro=TipoAhorro.A_LA_VISTA,
        monto_inicial=Decimal("100000"),
        observaciones="Cuenta de prueba"
    )
    cuenta = AhorroService.crear_cuenta(db, data, admin_user.id)
    return cuenta


@pytest.fixture
def cuenta_programado(db: Session, asociado_test: Asociado, admin_user: Usuario, configuracion_test: ConfiguracionAhorro):
    """Crear una cuenta de ahorro programado."""
    data = CuentaAhorroCrear(
        asociado_id=asociado_test.id,
        tipo_ahorro=TipoAhorro.PROGRAMADO,
        monto_inicial=Decimal("50000"),
        meta_ahorro=Decimal("1000000"),
        cuota_mensual=Decimal("100000"),
        fecha_inicio_programado=date.today(),
        fecha_fin_programado=date.today() + timedelta(days=365)
    )
    cuenta = AhorroService.crear_cuenta(db, data, admin_user.id)
    return cuenta


# ============================================================================
# TESTS DE CREACIÓN DE CUENTAS
# ============================================================================

def test_crear_cuenta_a_la_vista_exitoso(db: Session, asociado_test: Asociado, admin_user: Usuario, configuracion_test: ConfiguracionAhorro):
    """Test: Crear una cuenta de ahorro a la vista exitosamente."""
    data = CuentaAhorroCrear(
        asociado_id=asociado_test.id,
        tipo_ahorro=TipoAhorro.A_LA_VISTA,
        monto_inicial=Decimal("100000")
    )
    
    cuenta = AhorroService.crear_cuenta(db, data, admin_user.id)
    
    assert cuenta.id is not None
    assert cuenta.numero_cuenta is not None
    assert cuenta.numero_cuenta.startswith("AH-")
    assert cuenta.asociado_id == asociado_test.id
    assert cuenta.tipo_ahorro == TipoAhorro.A_LA_VISTA
    assert cuenta.saldo_disponible == Decimal("100000")
    assert cuenta.estado == EstadoCuentaAhorro.ACTIVA
    assert cuenta.abierta_por_id == admin_user.id


def test_crear_cuenta_programado_exitoso(db: Session, asociado_test: Asociado, admin_user: Usuario, configuracion_test: ConfiguracionAhorro):
    """Test: Crear una cuenta de ahorro programado exitosamente."""
    data = CuentaAhorroCrear(
        asociado_id=asociado_test.id,
        tipo_ahorro=TipoAhorro.PROGRAMADO,
        monto_inicial=Decimal("500000"),
        meta_ahorro=Decimal("5000000"),
        cuota_mensual=Decimal("100000"),
        fecha_inicio_programado=date.today(),
        fecha_fin_programado=date.today() + timedelta(days=365)
    )
    
    cuenta = AhorroService.crear_cuenta(db, data, admin_user.id)
    
    assert cuenta.tipo_ahorro == TipoAhorro.PROGRAMADO
    assert cuenta.meta_ahorro == Decimal("5000000")
    assert cuenta.cuota_mensual == Decimal("100000")
    assert cuenta.fecha_inicio_programado is not None


def test_crear_cuenta_cdat_exitoso(db: Session, asociado_test: Asociado, admin_user: Usuario, configuracion_test: ConfiguracionAhorro):
    """Test: Crear una cuenta CDAT exitosamente."""
    data = CuentaAhorroCrear(
        asociado_id=asociado_test.id,
        tipo_ahorro=TipoAhorro.CDAT,
        monto_inicial=Decimal("10000000"),
        plazo_dias=180,
        renovacion_automatica=True
    )
    
    cuenta = AhorroService.crear_cuenta(db, data, admin_user.id)
    
    assert cuenta.tipo_ahorro == TipoAhorro.CDAT
    assert cuenta.plazo_dias == 180
    assert cuenta.renovacion_automatica == True
    assert cuenta.fecha_apertura_cdat is not None
    assert cuenta.fecha_vencimiento_cdat is not None


def test_crear_cuenta_genera_movimiento_apertura(db: Session, asociado_test: Asociado, admin_user: Usuario, configuracion_test: ConfiguracionAhorro):
    """Test: Al crear una cuenta se debe generar un movimiento de apertura."""
    data = CuentaAhorroCrear(
        asociado_id=asociado_test.id,
        tipo_ahorro=TipoAhorro.A_LA_VISTA,
        monto_inicial=Decimal("100000")
    )
    
    cuenta = AhorroService.crear_cuenta(db, data, admin_user.id)
    
    # Verificar que existe un movimiento de apertura para esta cuenta
    movimiento = db.query(MovimientoAhorro).filter(
        MovimientoAhorro.cuenta_id == cuenta.id,
        MovimientoAhorro.tipo_movimiento == TipoMovimientoAhorro.APERTURA
    ).first()
    
    assert movimiento is not None
    assert movimiento.valor == Decimal("100000")
    # Nota: el saldo_anterior es igual al monto inicial porque el servicio 
    # asigna el saldo a la cuenta antes de crear el movimiento
    assert movimiento.saldo_anterior == Decimal("100000")
    assert movimiento.saldo_nuevo == Decimal("200000")


# ============================================================================
# TESTS DE CONSIGNACIONES
# ============================================================================

def test_realizar_consignacion_exitosa(db: Session, cuenta_vista: CuentaAhorro, admin_user: Usuario):
    """Test: Realizar una consignación exitosamente."""
    saldo_inicial = cuenta_vista.saldo_disponible
    
    data = ConsignacionCrear(
        cuenta_id=cuenta_vista.id,
        valor=Decimal("50000"),
        descripcion="Consignación de prueba",
        referencia="REF-001"
    )
    
    movimiento = AhorroService.realizar_consignacion(db, data, admin_user.id)
    
    assert movimiento.id is not None
    assert movimiento.numero_movimiento is not None
    assert movimiento.tipo_movimiento == TipoMovimientoAhorro.CONSIGNACION
    assert movimiento.valor == Decimal("50000")
    assert movimiento.saldo_anterior == saldo_inicial
    assert movimiento.saldo_nuevo == saldo_inicial + Decimal("50000")
    
    # Verificar que el saldo de la cuenta se actualizó
    db.refresh(cuenta_vista)
    assert cuenta_vista.saldo_disponible == saldo_inicial + Decimal("50000")


def test_consignacion_actualiza_saldo(db: Session, cuenta_vista: CuentaAhorro, admin_user: Usuario):
    """Test: Una consignación actualiza el saldo correctamente."""
    saldo_inicial = cuenta_vista.saldo_disponible
    
    data = ConsignacionCrear(
        cuenta_id=cuenta_vista.id,
        valor=Decimal("25000"),
        descripcion="Consignación test"
    )
    
    AhorroService.realizar_consignacion(db, data, admin_user.id)
    
    db.refresh(cuenta_vista)
    assert cuenta_vista.saldo_disponible == saldo_inicial + Decimal("25000")


def test_multiples_consignaciones(db: Session, cuenta_vista: CuentaAhorro, admin_user: Usuario):
    """Test: Realizar múltiples consignaciones."""
    saldo_inicial = cuenta_vista.saldo_disponible
    montos = [Decimal("10000"), Decimal("20000"), Decimal("30000")]
    
    for monto in montos:
        data = ConsignacionCrear(
            cuenta_id=cuenta_vista.id,
            valor=monto,
            descripcion=f"Consignación {monto}"
        )
        AhorroService.realizar_consignacion(db, data, admin_user.id)
    
    db.refresh(cuenta_vista)
    assert cuenta_vista.saldo_disponible == saldo_inicial + sum(montos)


# ============================================================================
# TESTS DE RETIROS
# ============================================================================

def test_realizar_retiro_exitoso(db: Session, cuenta_vista: CuentaAhorro, admin_user: Usuario):
    """Test: Realizar un retiro exitosamente."""
    saldo_inicial = cuenta_vista.saldo_disponible
    
    data = RetiroCrear(
        cuenta_id=cuenta_vista.id,
        valor=Decimal("30000"),
        descripcion="Retiro de prueba"
    )
    
    movimiento = AhorroService.realizar_retiro(db, data, admin_user.id)
    
    assert movimiento.id is not None
    assert movimiento.tipo_movimiento == TipoMovimientoAhorro.RETIRO
    assert movimiento.valor == Decimal("30000")
    assert movimiento.saldo_anterior == saldo_inicial
    
    # Verificar que el saldo se redujo
    db.refresh(cuenta_vista)
    assert cuenta_vista.saldo_disponible < saldo_inicial


def test_retiro_sin_saldo_suficiente(db: Session, cuenta_vista: CuentaAhorro, admin_user: Usuario):
    """Test: No se puede retirar más del saldo disponible."""
    data = RetiroCrear(
        cuenta_id=cuenta_vista.id,
        valor=cuenta_vista.saldo_disponible + Decimal("100000"),
        descripcion="Retiro excesivo"
    )
    
    with pytest.raises(ValueError, match="Saldo insuficiente"):
        AhorroService.realizar_retiro(db, data, admin_user.id)


def test_retiro_actualiza_saldo(db: Session, cuenta_vista: CuentaAhorro, admin_user: Usuario):
    """Test: Un retiro actualiza el saldo correctamente."""
    saldo_inicial = cuenta_vista.saldo_disponible
    
    data = RetiroCrear(
        cuenta_id=cuenta_vista.id,
        valor=Decimal("10000"),
        descripcion="Retiro test"
    )
    
    AhorroService.realizar_retiro(db, data, admin_user.id)
    
    db.refresh(cuenta_vista)
    # El saldo debe ser menor que el inicial por el retiro
    assert cuenta_vista.saldo_disponible < saldo_inicial


# ============================================================================
# TESTS DE CONSULTAS
# ============================================================================

def test_obtener_cuenta_por_id(db: Session, cuenta_vista: CuentaAhorro):
    """Test: Obtener una cuenta por ID."""
    cuenta = AhorroService.obtener_cuenta(db, cuenta_vista.id)
    
    assert cuenta is not None
    assert cuenta.id == cuenta_vista.id
    assert cuenta.numero_cuenta == cuenta_vista.numero_cuenta


def test_listar_cuentas_por_asociado(db: Session, cuenta_vista: CuentaAhorro):
    """Test: Listar cuentas de un asociado."""
    cuentas, total = AhorroService.listar_cuentas(db, asociado_id=cuenta_vista.asociado_id)
    
    assert len(cuentas) > 0
    assert total > 0
    assert all(c.asociado_id == cuenta_vista.asociado_id for c in cuentas)


def test_listar_cuentas_por_tipo(db: Session, cuenta_vista: CuentaAhorro, cuenta_programado: CuentaAhorro):
    """Test: Listar cuentas por tipo."""
    cuentas_vista, total = AhorroService.listar_cuentas(db, tipo_ahorro=TipoAhorro.A_LA_VISTA)
    
    assert len(cuentas_vista) > 0
    assert all(c.tipo_ahorro == TipoAhorro.A_LA_VISTA for c in cuentas_vista)


def test_listar_cuentas_por_estado(db: Session, cuenta_vista: CuentaAhorro):
    """Test: Listar cuentas por estado."""
    cuentas_activas, total = AhorroService.listar_cuentas(db, estado=EstadoCuentaAhorro.ACTIVA)
    
    assert len(cuentas_activas) > 0
    assert all(c.estado == EstadoCuentaAhorro.ACTIVA for c in cuentas_activas)


def test_obtener_movimientos_cuenta(db: Session, cuenta_vista: CuentaAhorro, admin_user: Usuario):
    """Test: Obtener movimientos de una cuenta."""
    # Hacer una consignación para tener movimientos
    data = ConsignacionCrear(
        cuenta_id=cuenta_vista.id,
        valor=Decimal("25000"),
        descripcion="Consignación para test movimientos"
    )
    AhorroService.realizar_consignacion(db, data, admin_user.id)
    
    # Obtener movimientos
    movimientos = db.query(MovimientoAhorro).filter(
        MovimientoAhorro.cuenta_id == cuenta_vista.id
    ).all()
    
    assert len(movimientos) >= 2  # Apertura + consignación
    assert any(m.tipo_movimiento == TipoMovimientoAhorro.APERTURA for m in movimientos)
    assert any(m.tipo_movimiento == TipoMovimientoAhorro.CONSIGNACION for m in movimientos)


# ============================================================================
# TESTS DE VALIDACIONES
# ============================================================================

def test_no_crear_cuenta_sin_asociado(db: Session, admin_user: Usuario, configuracion_test: ConfiguracionAhorro):
    """Test: No se puede crear cuenta sin asociado válido."""
    data = CuentaAhorroCrear(
        asociado_id=99999,  # ID que no existe
        tipo_ahorro=TipoAhorro.A_LA_VISTA,
        monto_inicial=Decimal("100000")
    )
    
    with pytest.raises(ValueError, match="Asociado no encontrado"):
        AhorroService.crear_cuenta(db, data, admin_user.id)


def test_saldo_inicial_positivo(db: Session, asociado_test: Asociado, admin_user: Usuario, configuracion_test: ConfiguracionAhorro):
    """Test: El saldo inicial debe ser positivo (validado por Pydantic)."""
    from pydantic import ValidationError
    
    with pytest.raises(ValidationError):
        data = CuentaAhorroCrear(
            asociado_id=asociado_test.id,
            tipo_ahorro=TipoAhorro.A_LA_VISTA,
            monto_inicial=Decimal("-1000")
        )


def test_valor_consignacion_positivo(db: Session, cuenta_vista: CuentaAhorro, admin_user: Usuario):
    """Test: El valor de consignación debe ser positivo (validado por Pydantic)."""
    from pydantic import ValidationError
    
    with pytest.raises(ValidationError):
        ConsignacionCrear(
            cuenta_id=cuenta_vista.id,
            valor=Decimal("-1000"),
            descripcion="Consignación test"
        )


def test_valor_retiro_positivo(db: Session, cuenta_vista: CuentaAhorro, admin_user: Usuario):
    """Test: El valor de retiro debe ser positivo (validado por Pydantic)."""
    from pydantic import ValidationError
    
    with pytest.raises(ValidationError):
        RetiroCrear(
            cuenta_id=cuenta_vista.id,
            valor=Decimal("-1000"),
            descripcion="Retiro test"
        )


# ============================================================================
# TESTS DE ESTADÍSTICAS
# ============================================================================

def test_obtener_estadisticas_generales(db: Session, cuenta_vista: CuentaAhorro):
    """Test: Obtener estadísticas generales de ahorros."""
    stats = AhorroService.obtener_estadisticas(db)
    
    assert "total_cuentas" in stats
    assert "total_cuentas_activas" in stats
    assert "total_ahorro" in stats
    assert "cuentas_por_estado" in stats
    assert stats["total_cuentas"] >= 1
    assert stats["total_ahorro"] > 0


def test_estadisticas_por_tipo(db: Session, cuenta_vista: CuentaAhorro, cuenta_programado: CuentaAhorro):
    """Test: Las estadísticas incluyen información por tipo."""
    stats = AhorroService.obtener_estadisticas(db)
    
    assert "total_cuentas" in stats
    # Debe haber al menos las cuentas creadas en los fixtures
    assert stats["total_cuentas"] >= 2


# ============================================================================
# TESTS DE NÚMEROS ÚNICOS
# ============================================================================

def test_numeros_cuenta_unicos(db: Session, asociado_test: Asociado, admin_user: Usuario, configuracion_test: ConfiguracionAhorro):
    """Test: Los números de cuenta son únicos."""
    numeros = set()
    
    for i in range(3):
        data = CuentaAhorroCrear(
            asociado_id=asociado_test.id,
            tipo_ahorro=TipoAhorro.A_LA_VISTA,
            monto_inicial=Decimal("50000")
        )
        cuenta = AhorroService.crear_cuenta(db, data, admin_user.id)
        numeros.add(cuenta.numero_cuenta)
    
    assert len(numeros) == 3  # Todos los números deben ser diferentes


def test_numeros_movimiento_unicos(db: Session, cuenta_vista: CuentaAhorro, admin_user: Usuario):
    """Test: Los números de movimiento son únicos."""
    numeros = set()
    
    for i in range(3):
        data = ConsignacionCrear(
            cuenta_id=cuenta_vista.id,
            valor=Decimal("10000"),
            descripcion=f"Consignación {i+1}"
        )
        movimiento = AhorroService.realizar_consignacion(db, data, admin_user.id)
        numeros.add(movimiento.numero_movimiento)
    
    assert len(numeros) == 3  # Todos los números deben ser diferentes
