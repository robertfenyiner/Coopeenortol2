"""
Tests para el módulo de créditos.
"""
import pytest
from datetime import date, timedelta
from decimal import Decimal
from sqlalchemy.orm import Session

from app.models.asociado import Asociado
from app.models.credito import (
    Credito, Cuota, Pago, AbonoCuota,
    EstadoCredito, TipoCredito, ModalidadPago, TipoCuota, EstadoCuota
)
from app.models.usuario import Usuario
from app.schemas.credito import (
    CreditoSolicitar, CreditoAprobar, CreditoRechazar,
    CreditoDesembolsar, PagoCrear
)
from app.services.creditos import CreditoService


# ============================================================================
# FIXTURES
# ============================================================================

@pytest.fixture
def asociado_test(db: Session, admin_user: Usuario):
    """Crear un asociado para pruebas de créditos."""
    asociado = Asociado(
        numero_documento="1234567890",
        tipo_documento="CC",
        nombres="Juan",
        apellidos="Pérez",
        correo_electronico="juan.perez@test.com",
        telefono_principal="3001234567",
        fecha_ingreso=date.today(),
        estado="activo"
    )
    db.add(asociado)
    db.commit()
    db.refresh(asociado)
    return asociado


@pytest.fixture
def credito_solicitado(db: Session, asociado_test: Asociado, admin_user: Usuario):
    """Crear un crédito en estado solicitado."""
    data = CreditoSolicitar(
        asociado_id=asociado_test.id,
        tipo_credito=TipoCredito.CONSUMO,
        monto_solicitado=Decimal("5000000"),
        tasa_interes=Decimal("1.5"),
        plazo_meses=12,
        destino="Compra de electrodomésticos",
        garantia="Carta laboral"
    )
    credito = CreditoService.solicitar_credito(db, data, admin_user.id)
    return credito


@pytest.fixture
def credito_aprobado(db: Session, credito_solicitado: Credito, admin_user: Usuario):
    """Crear un crédito aprobado."""
    data = CreditoAprobar(
        monto_aprobado=Decimal("4500000"),
        tasa_interes=Decimal("1.5"),
        plazo_meses=12
    )
    credito = CreditoService.aprobar_credito(db, credito_solicitado, data, admin_user.id)
    return credito


@pytest.fixture
def credito_desembolsado(db: Session, credito_aprobado: Credito, admin_user: Usuario):
    """Crear un crédito desembolsado."""
    data = CreditoDesembolsar(
        fecha_desembolso=date.today(),
        fecha_primer_pago=date.today() + timedelta(days=30),
        observaciones="Desembolso por transferencia"
    )
    credito = CreditoService.desembolsar_credito(db, credito_aprobado, data, admin_user.id)
    return credito


# ============================================================================
# TESTS DE SOLICITUD DE CRÉDITO
# ============================================================================

def test_solicitar_credito_exitoso(db: Session, asociado_test: Asociado, admin_user: Usuario):
    """Test: Solicitar un crédito exitosamente."""
    data = CreditoSolicitar(
        asociado_id=asociado_test.id,
        tipo_credito=TipoCredito.CONSUMO,
        monto_solicitado=Decimal("5000000"),
        tasa_interes=Decimal("1.5"),
        plazo_meses=12,
        destino="Compra de electrodomésticos"
    )
    
    credito = CreditoService.solicitar_credito(db, data, admin_user.id)
    
    assert credito.id is not None
    assert credito.numero_credito is not None
    assert credito.numero_credito.startswith("CR-")  # Formato: CR-YYYYMM-NNNNNN
    assert credito.asociado_id == asociado_test.id
    assert credito.tipo_credito == TipoCredito.CONSUMO
    assert credito.monto_solicitado == Decimal("5000000")
    assert credito.estado == EstadoCredito.SOLICITADO
    assert credito.fecha_solicitud == date.today()
    assert credito.solicitado_por_id == admin_user.id


def test_solicitar_credito_con_garantia(db: Session, asociado_test: Asociado, admin_user: Usuario):
    """Test: Solicitar un crédito con garantía."""
    data = CreditoSolicitar(
        asociado_id=asociado_test.id,
        tipo_credito=TipoCredito.VIVIENDA,
        monto_solicitado=Decimal("50000000"),
        tasa_interes=Decimal("0.8"),
        plazo_meses=120,
        destino="Compra de vivienda",
        garantia="Hipoteca sobre inmueble ubicado en..."
    )
    
    credito = CreditoService.solicitar_credito(db, data, admin_user.id)
    
    assert credito.garantia is not None
    assert "Hipoteca" in credito.garantia


def test_solicitar_credito_diferentes_tipos(db: Session, asociado_test: Asociado, admin_user: Usuario):
    """Test: Solicitar créditos de diferentes tipos."""
    tipos = [
        TipoCredito.CONSUMO,
        TipoCredito.VIVIENDA,
        TipoCredito.VEHICULO,
        TipoCredito.EDUCACION,
        TipoCredito.MICROEMPRESA
    ]
    
    for tipo in tipos:
        data = CreditoSolicitar(
            asociado_id=asociado_test.id,
            tipo_credito=tipo,
            monto_solicitado=Decimal("1000000"),
            tasa_interes=Decimal("1.5"),
            plazo_meses=12,
            destino=f"Crédito de {tipo.value}"
        )
        
        credito = CreditoService.solicitar_credito(db, data, admin_user.id)
        assert credito.tipo_credito == tipo


# ============================================================================
# TESTS DE APROBACIÓN DE CRÉDITO
# ============================================================================

def test_aprobar_credito_exitoso(db: Session, credito_solicitado: Credito, admin_user: Usuario):
    """Test: Aprobar un crédito solicitado exitosamente."""
    data = CreditoAprobar(
        monto_aprobado=Decimal("4500000"),
        tasa_interes=Decimal("1.5"),
        plazo_meses=12
    )
    
    credito = CreditoService.aprobar_credito(db, credito_solicitado, data, admin_user.id)
    
    assert credito.estado == EstadoCredito.APROBADO
    assert credito.monto_aprobado == Decimal("4500000")
    assert credito.fecha_aprobacion == date.today()
    assert credito.aprobado_por_id == admin_user.id


def test_aprobar_credito_con_monto_diferente(db: Session, credito_solicitado: Credito, admin_user: Usuario):
    """Test: Aprobar un crédito con monto diferente al solicitado."""
    monto_solicitado = credito_solicitado.monto_solicitado
    monto_aprobado = monto_solicitado * Decimal("0.8")  # 80% del solicitado
    
    data = CreditoAprobar(
        monto_aprobado=monto_aprobado,
        tasa_interes=Decimal("1.5"),
        plazo_meses=12
    )
    
    credito = CreditoService.aprobar_credito(db, credito_solicitado, data, admin_user.id)
    
    assert credito.monto_aprobado == monto_aprobado
    assert credito.monto_aprobado < monto_solicitado


def test_aprobar_credito_calculos_correctos(db: Session, credito_solicitado: Credito, admin_user: Usuario):
    """Test: Verificar que los cálculos sean correctos al aprobar."""
    data = CreditoAprobar(
        monto_aprobado=Decimal("5000000"),
        tasa_interes=Decimal("1.5"),  # 1.5% mensual
        plazo_meses=12
    )
    
    credito = CreditoService.aprobar_credito(db, credito_solicitado, data, admin_user.id)
    
    assert credito.valor_cuota is not None
    assert credito.valor_cuota > 0
    assert credito.total_intereses is not None
    assert credito.total_a_pagar is not None
    assert credito.total_a_pagar == credito.monto_aprobado + credito.total_intereses


# ============================================================================
# TESTS DE RECHAZO DE CRÉDITO
# ============================================================================

def test_rechazar_credito_exitoso(db: Session, credito_solicitado: Credito, admin_user: Usuario):
    """Test: Rechazar un crédito solicitado."""
    motivo = "No cumple con la capacidad de pago requerida"
    
    credito = CreditoService.rechazar_credito(db, credito_solicitado, motivo, admin_user.id)
    
    assert credito.estado == EstadoCredito.RECHAZADO
    assert credito.motivo_rechazo == motivo
    assert credito.aprobado_por_id == admin_user.id  # Quien rechaza queda registrado


def test_rechazar_credito_con_motivo_vacio(db: Session, credito_solicitado: Credito, admin_user: Usuario):
    """Test: Rechazar crédito acepta motivo vacío (sin validación en servicio)."""
    # El servicio no valida motivo vacío, se acepta cualquier string
    credito = CreditoService.rechazar_credito(db, credito_solicitado, "", admin_user.id)
    assert credito.estado == EstadoCredito.RECHAZADO
    assert credito.motivo_rechazo == ""


# ============================================================================
# TESTS DE DESEMBOLSO DE CRÉDITO
# ============================================================================

def test_desembolsar_credito_exitoso(db: Session, credito_aprobado: Credito, admin_user: Usuario):
    """Test: Desembolsar un crédito aprobado exitosamente."""
    data = CreditoDesembolsar(
        fecha_desembolso=date.today(),
        fecha_primer_pago=date.today() + timedelta(days=30),
        observaciones="Desembolso realizado"
    )
    
    credito = CreditoService.desembolsar_credito(db, credito_aprobado, data, admin_user.id)
    
    assert credito.estado == EstadoCredito.AL_DIA  # El estado cambia a AL_DIA después del desembolso
    assert credito.monto_desembolsado == credito.monto_aprobado
    assert credito.fecha_desembolso == data.fecha_desembolso
    assert credito.fecha_primer_pago == data.fecha_primer_pago
    assert credito.desembolsado_por_id == admin_user.id
    assert credito.saldo_capital == credito.monto_desembolsado


def test_desembolsar_genera_cuotas(db: Session, credito_aprobado: Credito, admin_user: Usuario):
    """Test: Al desembolsar se generan las cuotas automáticamente."""
    data = CreditoDesembolsar(
        fecha_desembolso=date.today(),
        fecha_primer_pago=date.today() + timedelta(days=30)
    )
    
    credito = CreditoService.desembolsar_credito(db, credito_aprobado, data, admin_user.id)
    
    # Verificar que se crearon las cuotas
    cuotas = db.query(Cuota).filter(Cuota.credito_id == credito.id).all()
    
    assert len(cuotas) == credito.plazo_meses
    assert cuotas[0].numero_cuota == 1
    assert cuotas[-1].numero_cuota == credito.plazo_meses
    assert cuotas[0].estado == EstadoCuota.PENDIENTE


def test_desembolsar_credito_no_aprobado(db: Session, credito_solicitado: Credito, admin_user: Usuario):
    """Test: No se puede desembolsar un crédito que no está aprobado."""
    from fastapi import HTTPException
    data = CreditoDesembolsar(
        fecha_desembolso=date.today(),
        fecha_primer_pago=date.today() + timedelta(days=30)
    )
    
    with pytest.raises(HTTPException) as exc_info:
        CreditoService.desembolsar_credito(db, credito_solicitado, data, admin_user.id)
    
    assert exc_info.value.status_code == 400
    assert "aprobados" in str(exc_info.value.detail).lower()


# ============================================================================
# TESTS DE GENERACIÓN DE CUOTAS
# ============================================================================

def test_cuotas_tienen_valores_correctos(db: Session, credito_desembolsado: Credito):
    """Test: Las cuotas generadas tienen valores correctos."""
    cuotas = db.query(Cuota).filter(Cuota.credito_id == credito_desembolsado.id).order_by(Cuota.numero_cuota).all()
    
    # Verificar primera cuota
    primera_cuota = cuotas[0]
    assert primera_cuota.valor_cuota == credito_desembolsado.valor_cuota
    assert primera_cuota.capital > 0
    assert primera_cuota.interes > 0
    assert primera_cuota.valor_cuota == primera_cuota.capital + primera_cuota.interes
    
    # Verificar última cuota
    ultima_cuota = cuotas[-1]
    assert ultima_cuota.saldo_pendiente == 0  # Después de pagar la última cuota, saldo es 0


def test_cuotas_saldo_pendiente_decrece(db: Session, credito_desembolsado: Credito):
    """Test: El saldo pendiente decrece con cada cuota."""
    cuotas = db.query(Cuota).filter(Cuota.credito_id == credito_desembolsado.id).order_by(Cuota.numero_cuota).all()
    
    for i in range(len(cuotas) - 1):
        assert cuotas[i].saldo_pendiente > cuotas[i + 1].saldo_pendiente


def test_suma_capital_cuotas_igual_monto_desembolsado(db: Session, credito_desembolsado: Credito):
    """Test: La suma del capital de todas las cuotas debe ser igual al monto desembolsado."""
    cuotas = db.query(Cuota).filter(Cuota.credito_id == credito_desembolsado.id).all()
    
    total_capital = sum(cuota.capital for cuota in cuotas)
    
    # Permitir diferencia por redondeos (mayor tolerancia)
    assert abs(total_capital - credito_desembolsado.monto_desembolsado) < Decimal("10")


# ============================================================================
# TESTS DE PAGOS
# ============================================================================

def test_registrar_pago_cuota_completa(db: Session, credito_desembolsado: Credito, admin_user: Usuario):
    """Test: Registrar un pago de cuota completa."""
    primera_cuota = db.query(Cuota).filter(
        Cuota.credito_id == credito_desembolsado.id
    ).order_by(Cuota.numero_cuota).first()
    
    data = PagoCrear(
        credito_id=credito_desembolsado.id,
        valor_total=primera_cuota.valor_cuota,
        fecha_pago=date.today(),
        metodo_pago="efectivo"
    )
    
    pago = CreditoService.registrar_pago(db, data, admin_user.id)
    
    assert pago.id is not None
    assert pago.numero_recibo is not None
    assert pago.valor_total == primera_cuota.valor_cuota
    assert pago.registrado_por_id == admin_user.id
    
    # Verificar que la cuota se marcó como pagada
    db.refresh(primera_cuota)
    assert primera_cuota.estado == EstadoCuota.PAGADA
    assert primera_cuota.valor_pagado == primera_cuota.valor_cuota


def test_registrar_pago_parcial(db: Session, credito_desembolsado: Credito, admin_user: Usuario):
    """Test: Registrar un pago parcial de cuota."""
    primera_cuota = db.query(Cuota).filter(
        Cuota.credito_id == credito_desembolsado.id
    ).order_by(Cuota.numero_cuota).first()
    
    valor_parcial = primera_cuota.valor_cuota / 2
    
    data = PagoCrear(
        credito_id=credito_desembolsado.id,
        valor_total=valor_parcial,
        fecha_pago=date.today(),
        metodo_pago="efectivo"
    )
    
    pago = CreditoService.registrar_pago(db, data, admin_user.id)
    
    # Permitir pequeñas diferencias por redondeo
    assert abs(pago.valor_total - valor_parcial) < Decimal("0.01")
    
    # Verificar que la cuota sigue pendiente
    db.refresh(primera_cuota)
    assert primera_cuota.estado == EstadoCuota.PENDIENTE
    assert primera_cuota.valor_pagado > 0  # Debe tener algún pago registrado


def test_pago_actualiza_saldo_credito(db: Session, credito_desembolsado: Credito, admin_user: Usuario):
    """Test: Un pago actualiza el saldo del crédito."""
    saldo_inicial = credito_desembolsado.saldo_capital
    
    primera_cuota = db.query(Cuota).filter(
        Cuota.credito_id == credito_desembolsado.id
    ).order_by(Cuota.numero_cuota).first()
    
    data = PagoCrear(
        credito_id=credito_desembolsado.id,
        valor_total=primera_cuota.valor_cuota,
        fecha_pago=date.today(),
        metodo_pago="efectivo"
    )
    
    CreditoService.registrar_pago(db, data, admin_user.id)
    
    db.refresh(credito_desembolsado)
    assert credito_desembolsado.saldo_capital < saldo_inicial


def test_pago_con_metodos_diferentes(db: Session, credito_desembolsado: Credito, admin_user: Usuario):
    """Test: Registrar pagos con diferentes métodos de pago."""
    metodos = ["efectivo", "transferencia", "cheque", "tarjeta"]
    
    cuotas = db.query(Cuota).filter(
        Cuota.credito_id == credito_desembolsado.id
    ).order_by(Cuota.numero_cuota).limit(4).all()
    
    for i, metodo in enumerate(metodos):
        data = PagoCrear(
            credito_id=credito_desembolsado.id,
            valor_total=cuotas[i].valor_cuota,
            fecha_pago=date.today(),
            metodo_pago=metodo,
            referencia=f"REF-{i+1}" if metodo != "efectivo" else None
        )
        
        pago = CreditoService.registrar_pago(db, data, admin_user.id)
        assert pago.metodo_pago == metodo


# ============================================================================
# TESTS DE CONSULTAS
# ============================================================================

def test_listar_creditos_por_asociado(db: Session, credito_desembolsado: Credito):
    """Test: Listar créditos de un asociado."""
    creditos, total = CreditoService.listar_creditos(db, asociado_id=credito_desembolsado.asociado_id)
    
    assert len(creditos) > 0
    assert total > 0
    assert all(c.asociado_id == credito_desembolsado.asociado_id for c in creditos)


def test_listar_creditos_por_estado(db: Session, credito_desembolsado: Credito):
    """Test: Listar créditos por estado."""
    creditos_al_dia, total = CreditoService.listar_creditos(db, estado=EstadoCredito.AL_DIA)
    
    assert len(creditos_al_dia) > 0
    assert total > 0
    assert all(c.estado == EstadoCredito.AL_DIA for c in creditos_al_dia)


def test_obtener_credito_por_numero(db: Session, credito_desembolsado: Credito):
    """Test: Obtener crédito por ID."""
    credito = CreditoService.obtener_credito(db, credito_desembolsado.id)
    
    assert credito is not None
    assert credito.id == credito_desembolsado.id
    assert credito.numero_credito == credito_desembolsado.numero_credito


def test_obtener_cuotas_pendientes(db: Session, credito_desembolsado: Credito):
    """Test: Obtener cuotas pendientes de un crédito."""
    # Obtener cuotas directamente de la BD
    cuotas_pendientes = db.query(Cuota).filter(
        Cuota.credito_id == credito_desembolsado.id,
        Cuota.estado == EstadoCuota.PENDIENTE
    ).all()
    
    assert len(cuotas_pendientes) == credito_desembolsado.plazo_meses
    assert all(c.estado == EstadoCuota.PENDIENTE for c in cuotas_pendientes)


# ============================================================================
# TESTS DE MORA
# ============================================================================

def test_calcular_mora_cuotas_vencidas(db: Session, credito_desembolsado: Credito):
    """Test: Calcular mora para cuotas vencidas."""
    # Hacer que una cuota esté vencida (modificar fecha de vencimiento al pasado)
    primera_cuota = db.query(Cuota).filter(
        Cuota.credito_id == credito_desembolsado.id
    ).order_by(Cuota.numero_cuota).first()
    
    primera_cuota.fecha_vencimiento = date.today() - timedelta(days=15)
    db.commit()
    
    # Calcular mora
    CreditoService.calcular_mora(db)
    
    db.refresh(primera_cuota)
    db.refresh(credito_desembolsado)
    
    assert primera_cuota.dias_mora > 0
    assert primera_cuota.estado == EstadoCuota.MORA
    assert primera_cuota.valor_mora > 0
    assert credito_desembolsado.estado == EstadoCredito.MORA


def test_credito_sin_cuotas_vencidas_sin_mora(db: Session, credito_desembolsado: Credito):
    """Test: Un crédito sin cuotas vencidas no tiene mora."""
    CreditoService.calcular_mora(db)
    
    db.refresh(credito_desembolsado)
    
    assert credito_desembolsado.dias_mora == 0
    assert credito_desembolsado.saldo_mora == 0
    assert credito_desembolsado.estado == EstadoCredito.AL_DIA


# ============================================================================
# TESTS DE ESTADÍSTICAS
# ============================================================================

def test_obtener_estadisticas_credito(db: Session, credito_desembolsado: Credito):
    """Test: Obtener estadísticas de cuotas de un crédito."""
    # Obtener estadísticas manualmente
    total_cuotas = db.query(Cuota).filter(Cuota.credito_id == credito_desembolsado.id).count()
    cuotas_pagadas = db.query(Cuota).filter(
        Cuota.credito_id == credito_desembolsado.id,
        Cuota.estado == EstadoCuota.PAGADA
    ).count()
    
    assert total_cuotas == credito_desembolsado.plazo_meses
    assert cuotas_pagadas == 0
    assert total_cuotas - cuotas_pagadas == credito_desembolsado.plazo_meses


def test_estadisticas_generales_creditos(db: Session, credito_desembolsado: Credito):
    """Test: Obtener estadísticas generales de créditos."""
    stats = CreditoService.obtener_estadisticas(db)
    
    assert stats["total_creditos"] >= 1
    assert stats["total_cartera"] > 0
    assert stats["creditos_activos"] >= 1


# ============================================================================
# TESTS DE VALIDACIONES
# ============================================================================

def test_no_solicitar_credito_sin_asociado(db: Session, admin_user: Usuario):
    """Test: No se puede solicitar crédito sin asociado válido."""
    from fastapi import HTTPException
    
    # Crear el esquema con un asociado inexistente
    data = CreditoSolicitar(
        asociado_id=99999,  # ID que no existe
        tipo_credito=TipoCredito.CONSUMO,
        monto_solicitado=Decimal("5000000"),
        tasa_interes=Decimal("1.5"),
        plazo_meses=12,
        destino="Test crédito sin asociado"  # Mínimo 10 caracteres
    )
    
    # Debe lanzar HTTPException 404
    with pytest.raises(HTTPException) as exc_info:
        CreditoService.solicitar_credito(db, data, admin_user.id)
    
    assert exc_info.value.status_code == 404


def test_monto_solicitado_positivo(db: Session, asociado_test: Asociado, admin_user: Usuario):
    """Test: El monto solicitado debe ser positivo (validado por Pydantic)."""
    from pydantic import ValidationError
    
    with pytest.raises(ValidationError):
        data = CreditoSolicitar(
            asociado_id=asociado_test.id,
            tipo_credito=TipoCredito.CONSUMO,
            monto_solicitado=Decimal("-1000"),
            tasa_interes=Decimal("1.5"),
            plazo_meses=12,
            destino="Test"
        )


def test_plazo_meses_positivo(db: Session, asociado_test: Asociado, admin_user: Usuario):
    """Test: El plazo en meses debe ser positivo (validado por Pydantic)."""
    from pydantic import ValidationError
    
    with pytest.raises(ValidationError):
        data = CreditoSolicitar(
            asociado_id=asociado_test.id,
            tipo_credito=TipoCredito.CONSUMO,
            monto_solicitado=Decimal("5000000"),
            tasa_interes=Decimal("1.5"),
            plazo_meses=0,
            destino="Test"
        )


def test_tasa_interes_positiva(db: Session, asociado_test: Asociado, admin_user: Usuario):
    """Test: La tasa de interés debe ser positiva (validado por Pydantic)."""
    from pydantic import ValidationError
    
    with pytest.raises(ValidationError):
        data = CreditoSolicitar(
            asociado_id=asociado_test.id,
            tipo_credito=TipoCredito.CONSUMO,
            monto_solicitado=Decimal("5000000"),
            tasa_interes=Decimal("-1"),
            plazo_meses=12,
            destino="Test"
        )
