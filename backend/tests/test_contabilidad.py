"""
Tests para el módulo de contabilidad.
"""
from datetime import date, datetime
from decimal import Decimal

import pytest
from fastapi import status
from sqlalchemy.orm import Session

from app.models.contabilidad import (
    CuentaContable,
    AsientoContable,
    MovimientoContable,
    Aporte
)
from app.services.contabilidad import ContabilidadService


# ============================================================================
# TESTS DE CUENTAS CONTABLES
# ============================================================================

def test_crear_cuenta_contable(client, db: Session, auth_headers_admin, init_cuentas_contables):
    """Test crear cuenta contable."""
    data = {
        "codigo": "9999",
        "nombre": "Cuenta de Prueba",
        "tipo": "activo",
        "naturaleza": "debito",
        "nivel": 1,
        "es_auxiliar": True,
        "activa": True,
        "descripcion": "Cuenta para testing"
    }
    
    response = client.post("/api/v1/contabilidad/cuentas", json=data, headers=auth_headers_admin)
    
    assert response.status_code == status.HTTP_201_CREATED
    cuenta = response.json()
    assert cuenta["codigo"] == "9999"
    assert cuenta["nombre"] == "Cuenta de Prueba"
    assert cuenta["tipo"] == "activo"


def test_crear_cuenta_codigo_duplicado(client, db: Session, auth_headers_admin, init_cuentas_contables):
    """Test crear cuenta con código duplicado debe fallar."""
    data = {
        "codigo": "1110",  # Bancos - ya existe del init
        "nombre": "Otra Cuenta",
        "tipo": "activo",
        "naturaleza": "debito",
        "nivel": 3,
        "es_auxiliar": True
    }
    
    response = client.post("/api/v1/contabilidad/cuentas", json=data, headers=auth_headers_admin)
    
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "Ya existe" in response.json()["detail"]


def test_listar_cuentas(client, db: Session, auth_headers_admin, init_cuentas_contables):
    """Test listar cuentas contables."""
    response = client.get("/api/v1/contabilidad/cuentas", headers=auth_headers_admin)
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "cuentas" in data
    assert "total" in data
    assert data["total"] > 0  # Debe haber cuentas del init


def test_listar_cuentas_filtro_tipo(client, db: Session, auth_headers_admin, init_cuentas_contables):
    """Test listar cuentas filtradas por tipo."""
    response = client.get(
        "/api/v1/contabilidad/cuentas?tipo=activo",
        headers=auth_headers_admin
    )
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    
    # Todas las cuentas deben ser de tipo activo
    for cuenta in data["cuentas"]:
        assert cuenta["tipo"] == "activo"


def test_listar_cuentas_solo_auxiliares(client, db: Session, auth_headers_admin, init_cuentas_contables):
    """Test listar solo cuentas auxiliares."""
    response = client.get(
        "/api/v1/contabilidad/cuentas?solo_auxiliares=true",
        headers=auth_headers_admin
    )
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    
    # Todas deben ser auxiliares
    for cuenta in data["cuentas"]:
        assert cuenta["es_auxiliar"] is True


def test_obtener_cuenta_por_id(client, db: Session, auth_headers_admin, init_cuentas_contables):
    """Test obtener cuenta por ID."""
    # Obtener cuenta Bancos
    cuenta_bancos = db.query(CuentaContable).filter(
        CuentaContable.codigo == "1110"
    ).first()
    
    response = client.get(
        f"/api/v1/contabilidad/cuentas/{cuenta_bancos.id}",
        headers=auth_headers_admin
    )
    
    assert response.status_code == status.HTTP_200_OK
    cuenta = response.json()
    assert cuenta["codigo"] == "1110"
    assert cuenta["nombre"] == "Bancos"


def test_obtener_cuenta_por_codigo(client, db: Session, auth_headers_admin, init_cuentas_contables):
    """Test obtener cuenta por código."""
    response = client.get(
        "/api/v1/contabilidad/cuentas/codigo/1110",
        headers=auth_headers_admin
    )
    
    assert response.status_code == status.HTTP_200_OK
    cuenta = response.json()
    assert cuenta["codigo"] == "1110"
    assert cuenta["nombre"] == "Bancos"


def test_obtener_saldo_cuenta(client, db: Session, auth_headers_admin, init_cuentas_contables, asociado_test):
    """Test obtener saldo de cuenta."""
    # Crear un asiento para tener movimientos
    cuenta_bancos = db.query(CuentaContable).filter(
        CuentaContable.codigo == "1110"
    ).first()
    cuenta_aportes = db.query(CuentaContable).filter(
        CuentaContable.codigo == "3105"
    ).first()
    
    # Crear asiento de aporte
    asiento_data = {
        "fecha": str(date.today()),
        "tipo_movimiento": "aporte",
        "concepto": "Aporte inicial",
        "movimientos": [
            {
                "cuenta_id": cuenta_bancos.id,
                "debito": "1000000.00",
                "credito": "0.00",
                "detalle": "Ingreso banco",
                "tercero_tipo": "asociado",
                "tercero_id": asociado_test.id
            },
            {
                "cuenta_id": cuenta_aportes.id,
                "debito": "0.00",
                "credito": "1000000.00",
                "detalle": "Aporte social",
                "tercero_tipo": "asociado",
                "tercero_id": asociado_test.id
            }
        ]
    }
    
    client.post(
        "/api/v1/contabilidad/asientos",
        json=asiento_data,
        headers=auth_headers_admin
    )
    
    # Obtener saldo
    response = client.get(
        f"/api/v1/contabilidad/cuentas/{cuenta_bancos.id}/saldo",
        headers=auth_headers_admin
    )
    
    assert response.status_code == status.HTTP_200_OK
    cuenta = response.json()
    assert Decimal(cuenta["total_debito"]) == Decimal("1000000.00")
    assert Decimal(cuenta["saldo"]) == Decimal("1000000.00")


def test_actualizar_cuenta(client, db: Session, auth_headers_admin, init_cuentas_contables):
    """Test actualizar cuenta contable."""
    cuenta_bancos = db.query(CuentaContable).filter(
        CuentaContable.codigo == "1110"
    ).first()
    
    data = {
        "nombre": "Bancos Principales",
        "descripcion": "Cuentas bancarias principales"
    }
    
    response = client.put(
        f"/api/v1/contabilidad/cuentas/{cuenta_bancos.id}",
        json=data,
        headers=auth_headers_admin
    )
    
    assert response.status_code == status.HTTP_200_OK
    cuenta = response.json()
    assert cuenta["nombre"] == "Bancos Principales"
    assert cuenta["descripcion"] == "Cuentas bancarias principales"


# ============================================================================
# TESTS DE ASIENTOS CONTABLES
# ============================================================================

def test_crear_asiento_contable(client, db: Session, auth_headers_admin, init_cuentas_contables, asociado_test):
    """Test crear asiento contable válido."""
    cuenta_bancos = db.query(CuentaContable).filter(
        CuentaContable.codigo == "1110"
    ).first()
    cuenta_aportes = db.query(CuentaContable).filter(
        CuentaContable.codigo == "3105"
    ).first()
    
    data = {
        "fecha": str(date.today()),
        "tipo_movimiento": "aporte",
        "concepto": "Aporte ordinario - Test",
        "movimientos": [
            {
                "cuenta_id": cuenta_bancos.id,
                "debito": "500000.00",
                "credito": "0.00",
                "detalle": "Ingreso banco por aporte",
                "tercero_tipo": "asociado",
                "tercero_id": asociado_test.id
            },
            {
                "cuenta_id": cuenta_aportes.id,
                "debito": "0.00",
                "credito": "500000.00",
                "detalle": "Aporte social",
                "tercero_tipo": "asociado",
                "tercero_id": asociado_test.id
            }
        ]
    }
    
    response = client.post(
        "/api/v1/contabilidad/asientos",
        json=data,
        headers=auth_headers_admin
    )
    
    assert response.status_code == status.HTTP_201_CREATED
    asiento = response.json()
    assert "AS-" in asiento["numero"]
    assert asiento["cuadrado"] is True
    assert Decimal(asiento["total_debito"]) == Decimal("500000.00")
    assert Decimal(asiento["total_credito"]) == Decimal("500000.00")


def test_crear_asiento_descuadrado(client, db: Session, auth_headers_admin, init_cuentas_contables, asociado_test):
    """Test crear asiento descuadrado debe fallar."""
    cuenta_bancos = db.query(CuentaContable).filter(
        CuentaContable.codigo == "1110"
    ).first()
    cuenta_aportes = db.query(CuentaContable).filter(
        CuentaContable.codigo == "3105"
    ).first()
    
    data = {
        "fecha": str(date.today()),
        "tipo_movimiento": "aporte",
        "concepto": "Asiento descuadrado",
        "movimientos": [
            {
                "cuenta_id": cuenta_bancos.id,
                "debito": "500000.00",
                "credito": "0.00",
                "detalle": "Débito"
            },
            {
                "cuenta_id": cuenta_aportes.id,
                "debito": "0.00",
                "credito": "300000.00",  # No cuadra
                "detalle": "Crédito"
            }
        ]
    }
    
    response = client.post(
        "/api/v1/contabilidad/asientos",
        json=data,
        headers=auth_headers_admin
    )
    
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "no cuadra" in response.json()["detail"]


def test_listar_asientos(client, db: Session, auth_headers_admin, init_cuentas_contables, asociado_test):
    """Test listar asientos contables."""
    # Crear un asiento primero
    cuenta_bancos = db.query(CuentaContable).filter(
        CuentaContable.codigo == "1110"
    ).first()
    cuenta_aportes = db.query(CuentaContable).filter(
        CuentaContable.codigo == "3105"
    ).first()
    
    data = {
        "fecha": str(date.today()),
        "tipo_movimiento": "aporte",
        "concepto": "Aporte para listar",
        "movimientos": [
            {"cuenta_id": cuenta_bancos.id, "debito": "100000.00", "credito": "0.00", "detalle": "Test"},
            {"cuenta_id": cuenta_aportes.id, "debito": "0.00", "credito": "100000.00", "detalle": "Test"}
        ]
    }
    
    client.post("/api/v1/contabilidad/asientos", json=data, headers=auth_headers_admin)
    
    # Listar
    response = client.get("/api/v1/contabilidad/asientos", headers=auth_headers_admin)
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "asientos" in data
    assert "total" in data
    assert data["total"] > 0


def test_obtener_asiento_completo(client, db: Session, auth_headers_admin, init_cuentas_contables, asociado_test):
    """Test obtener asiento con sus movimientos."""
    # Crear asiento
    cuenta_bancos = db.query(CuentaContable).filter(
        CuentaContable.codigo == "1110"
    ).first()
    cuenta_aportes = db.query(CuentaContable).filter(
        CuentaContable.codigo == "3105"
    ).first()
    
    data = {
        "fecha": str(date.today()),
        "tipo_movimiento": "aporte",
        "concepto": "Aporte completo",
        "movimientos": [
            {"cuenta_id": cuenta_bancos.id, "debito": "200000.00", "credito": "0.00", "detalle": "Débito"},
            {"cuenta_id": cuenta_aportes.id, "debito": "0.00", "credito": "200000.00", "detalle": "Crédito"}
        ]
    }
    
    resp_create = client.post(
        "/api/v1/contabilidad/asientos",
        json=data,
        headers=auth_headers_admin
    )
    asiento_id = resp_create.json()["id"]
    
    # Obtener con movimientos
    response = client.get(
        f"/api/v1/contabilidad/asientos/{asiento_id}",
        headers=auth_headers_admin
    )
    
    assert response.status_code == status.HTTP_200_OK
    asiento = response.json()
    assert "movimientos" in asiento
    assert len(asiento["movimientos"]) == 2


def test_anular_asiento(client, db: Session, auth_headers_admin, init_cuentas_contables, asociado_test):
    """Test anular asiento contable."""
    # Crear asiento
    cuenta_bancos = db.query(CuentaContable).filter(
        CuentaContable.codigo == "1110"
    ).first()
    cuenta_aportes = db.query(CuentaContable).filter(
        CuentaContable.codigo == "3105"
    ).first()
    
    data = {
        "fecha": str(date.today()),
        "tipo_movimiento": "aporte",
        "concepto": "Asiento a anular",
        "movimientos": [
            {"cuenta_id": cuenta_bancos.id, "debito": "50000.00", "credito": "0.00", "detalle": "Test"},
            {"cuenta_id": cuenta_aportes.id, "debito": "0.00", "credito": "50000.00", "detalle": "Test"}
        ]
    }
    
    resp_create = client.post(
        "/api/v1/contabilidad/asientos",
        json=data,
        headers=auth_headers_admin
    )
    asiento_id = resp_create.json()["id"]
    
    # Anular
    data_anular = {"motivo": "Error en registro"}
    response = client.post(
        f"/api/v1/contabilidad/asientos/{asiento_id}/anular",
        json=data_anular,
        headers=auth_headers_admin
    )
    
    assert response.status_code == status.HTTP_200_OK
    asiento = response.json()
    assert asiento["anulado"] is True
    assert asiento["motivo_anulacion"] == "Error en registro"


# ============================================================================
# TESTS DE APORTES
# ============================================================================

def test_crear_aporte_sin_asiento(client, db: Session, auth_headers_admin, init_cuentas_contables, asociado_test):
    """Test crear aporte sin generar asiento."""
    data = {
        "asociado_id": asociado_test.id,
        "fecha": str(date.today()),
        "valor": "250000.00",
        "tipo_aporte": "ordinario",
        "numero_recibo": "REC-001",
        "generar_asiento": False
    }
    
    response = client.post(
        "/api/v1/contabilidad/aportes",
        json=data,
        headers=auth_headers_admin
    )
    
    assert response.status_code == status.HTTP_201_CREATED
    aporte = response.json()
    assert Decimal(aporte["valor"]) == Decimal("250000.00")
    assert aporte["tipo_aporte"] == "ordinario"
    assert aporte["estado"] == "pagado"
    assert aporte["asiento_id"] is None


def test_crear_aporte_con_asiento(client, db: Session, auth_headers_admin, init_cuentas_contables, asociado_test):
    """Test crear aporte generando asiento automático."""
    data = {
        "asociado_id": asociado_test.id,
        "fecha": str(date.today()),
        "valor": "300000.00",
        "tipo_aporte": "ordinario",
        "numero_recibo": "REC-002",
        "generar_asiento": True
    }
    
    response = client.post(
        "/api/v1/contabilidad/aportes",
        json=data,
        headers=auth_headers_admin
    )
    
    assert response.status_code == status.HTTP_201_CREATED
    aporte = response.json()
    assert Decimal(aporte["valor"]) == Decimal("300000.00")
    assert aporte["asiento_id"] is not None  # Debe tener asiento generado


def test_listar_aportes(client, db: Session, auth_headers_admin, init_cuentas_contables, asociado_test):
    """Test listar aportes."""
    # Crear un aporte
    data = {
        "asociado_id": asociado_test.id,
        "fecha": str(date.today()),
        "valor": "100000.00",
        "tipo_aporte": "ordinario",
        "numero_recibo": "REC-003",
        "generar_asiento": False
    }
    
    client.post("/api/v1/contabilidad/aportes", json=data, headers=auth_headers_admin)
    
    # Listar
    response = client.get("/api/v1/contabilidad/aportes", headers=auth_headers_admin)
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "aportes" in data
    assert data["total"] > 0


def test_listar_aportes_por_asociado(client, db: Session, auth_headers_admin, init_cuentas_contables, asociado_test):
    """Test listar aportes filtrados por asociado."""
    # Crear aporte
    data = {
        "asociado_id": asociado_test.id,
        "fecha": str(date.today()),
        "valor": "150000.00",
        "tipo_aporte": "ordinario",
        "numero_recibo": "REC-004",
        "generar_asiento": False
    }
    
    client.post("/api/v1/contabilidad/aportes", json=data, headers=auth_headers_admin)
    
    # Listar por asociado
    response = client.get(
        f"/api/v1/contabilidad/aportes?asociado_id={asociado_test.id}",
        headers=auth_headers_admin
    )
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    
    # Todos deben ser del asociado
    for aporte in data["aportes"]:
        assert aporte["asociado_id"] == asociado_test.id


def test_obtener_aporte(client, db: Session, auth_headers_admin, init_cuentas_contables, asociado_test):
    """Test obtener aporte por ID."""
    # Crear aporte
    data = {
        "asociado_id": asociado_test.id,
        "fecha": str(date.today()),
        "valor": "175000.00",
        "tipo_aporte": "extraordinario",
        "numero_recibo": "REC-005",
        "generar_asiento": False
    }
    
    resp_create = client.post(
        "/api/v1/contabilidad/aportes",
        json=data,
        headers=auth_headers_admin
    )
    aporte_id = resp_create.json()["id"]
    
    # Obtener
    response = client.get(
        f"/api/v1/contabilidad/aportes/{aporte_id}",
        headers=auth_headers_admin
    )
    
    assert response.status_code == status.HTTP_200_OK
    aporte = response.json()
    assert aporte["tipo_aporte"] == "extraordinario"


def test_total_aportes_asociado(client, db: Session, auth_headers_admin, init_cuentas_contables, asociado_test):
    """Test calcular total de aportes de un asociado."""
    # Crear varios aportes
    for i in range(3):
        data = {
            "asociado_id": asociado_test.id,
            "fecha": str(date.today()),
            "valor": "100000.00",
            "tipo_aporte": "ordinario",
            "numero_recibo": f"REC-00{i+10}",
            "generar_asiento": False
        }
        client.post("/api/v1/contabilidad/aportes", json=data, headers=auth_headers_admin)
    
    # Obtener total
    response = client.get(
        f"/api/v1/contabilidad/aportes/asociado/{asociado_test.id}/total",
        headers=auth_headers_admin
    )
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert Decimal(data["total_aportes"]) >= Decimal("300000.00")


# ============================================================================
# TESTS DE ESTADÍSTICAS
# ============================================================================

def test_obtener_estadisticas(client, db: Session, auth_headers_admin, init_cuentas_contables):
    """Test obtener estadísticas de contabilidad."""
    response = client.get("/api/v1/contabilidad/estadisticas", headers=auth_headers_admin)
    
    assert response.status_code == status.HTTP_200_OK
    stats = response.json()
    
    assert "total_cuentas" in stats
    assert "total_asientos" in stats
    assert "total_movimientos" in stats
    assert "total_aportes" in stats
    assert "suma_aportes" in stats
    
    # Debe haber cuentas del init
    assert stats["total_cuentas"] > 0


# ============================================================================
# TESTS SIN AUTENTICACIÓN
# ============================================================================

def test_crear_cuenta_sin_auth(client):
    """Test crear cuenta sin autenticación debe fallar."""
    data = {
        "codigo": "9998",
        "nombre": "Test",
        "tipo": "activo",
        "naturaleza": "debito",
        "nivel": 1,
        "es_auxiliar": True
    }
    
    response = client.post("/api/v1/contabilidad/cuentas", json=data)
    
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
