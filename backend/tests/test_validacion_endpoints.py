"""
Tests para validar que los endpoints aplican las validaciones correctamente.
"""
from datetime import date
import pytest
from fastapi.testclient import TestClient


def test_crear_asociado_documento_invalido(client: TestClient, auth_headers_admin: dict):
    """Test que rechaza documento inválido al crear asociado."""
    data = {
        "tipo_documento": "CC",
        "numero_documento": "123",  # Muy corto, inválido
        "nombres": "Juan",
        "apellidos": "Pérez",
        "correo_electronico": "juan@test.com",
        "telefono_principal": "3101234567",
        "fecha_ingreso": "2024-01-01",
        "datos_personales": {
            "fecha_nacimiento": "1990-01-01",
            "direccion": "Calle 1",
            "ciudad": "Honda",
            "departamento": "Tolima",
            "pais": "Colombia"
        },
        "datos_laborales": {
            "institucion_educativa": "IE Test",
            "cargo": "Docente",
            "tipo_contrato": "Indefinido",
            "fecha_vinculacion": "2020-01-01",
            "salario_basico": 3000000
        },
        "informacion_familiar": {},
        "informacion_financiera": {
            "ingresos_mensuales": 3000000,
            "egresos_mensuales": 1500000
        },
        "informacion_academica": {
            "nivel_educativo": "Licenciatura"
        },
        "informacion_vivienda": {
            "tipo_vivienda": "casa",
            "tenencia": "propia"
        }
    }
    
    response = client.post("/api/v1/asociados/", headers=auth_headers_admin, json=data)
    assert response.status_code == 422
    assert "errors" in response.json()["detail"]
    assert any("documento" in error.lower() or "cc" in error.lower() for error in response.json()["detail"]["errors"])


def test_crear_asociado_telefono_invalido(client: TestClient, auth_headers_admin: dict):
    """Test que rechaza teléfono inválido."""
    data = {
        "tipo_documento": "CC",
        "numero_documento": "12345678",
        "nombres": "María",
        "apellidos": "García",
        "correo_electronico": "maria@test.com",
        "telefono_principal": "123",  # Teléfono inválido
        "fecha_ingreso": "2024-01-01",
        "datos_personales": {
            "fecha_nacimiento": "1990-01-01",
            "direccion": "Calle 1",
            "ciudad": "Honda",
            "departamento": "Tolima",
            "pais": "Colombia"
        },
        "datos_laborales": {
            "institucion_educativa": "IE Test",
            "cargo": "Docente",
            "tipo_contrato": "Indefinido",
            "fecha_vinculacion": "2020-01-01",
            "salario_basico": 3000000
        },
        "informacion_familiar": {},
        "informacion_financiera": {
            "ingresos_mensuales": 3000000,
            "egresos_mensuales": 1500000
        },
        "informacion_academica": {
            "nivel_educativo": "Licenciatura"
        },
        "informacion_vivienda": {
            "tipo_vivienda": "casa",
            "tenencia": "propia"
        }
    }
    
    response = client.post("/api/v1/asociados/", headers=auth_headers_admin, json=data)
    assert response.status_code == 422
    assert "errors" in response.json()["detail"]
    assert any("teléfono" in error.lower() for error in response.json()["detail"]["errors"])


def test_crear_asociado_nombre_invalido(client: TestClient, auth_headers_admin: dict):
    """Test que rechaza nombre con números."""
    data = {
        "tipo_documento": "CC",
        "numero_documento": "87654321",
        "nombres": "Juan123",  # Nombre inválido con números
        "apellidos": "López",
        "correo_electronico": "juan.lopez@test.com",
        "telefono_principal": "3201234567",
        "fecha_ingreso": "2024-01-01",
        "datos_personales": {
            "fecha_nacimiento": "1990-01-01",
            "direccion": "Calle 1",
            "ciudad": "Honda",
            "departamento": "Tolima",
            "pais": "Colombia"
        },
        "datos_laborales": {
            "institucion_educativa": "IE Test",
            "cargo": "Docente",
            "tipo_contrato": "Indefinido",
            "fecha_vinculacion": "2020-01-01",
            "salario_basico": 3000000
        },
        "informacion_familiar": {},
        "informacion_financiera": {
            "ingresos_mensuales": 3000000,
            "egresos_mensuales": 1500000
        },
        "informacion_academica": {
            "nivel_educativo": "Licenciatura"
        },
        "informacion_vivienda": {
            "tipo_vivienda": "casa",
            "tenencia": "propia"
        }
    }
    
    response = client.post("/api/v1/asociados/", headers=auth_headers_admin, json=data)
    assert response.status_code == 422
    assert "errors" in response.json()["detail"]
    assert any("nombre" in error.lower() or "caract" in error.lower() for error in response.json()["detail"]["errors"])


def test_crear_asociado_salario_invalido(client: TestClient, auth_headers_admin: dict):
    """Test que rechaza salario por debajo del mínimo."""
    data = {
        "tipo_documento": "CC",
        "numero_documento": "11223344",
        "nombres": "Pedro",
        "apellidos": "Martínez",
        "correo_electronico": "pedro@test.com",
        "telefono_principal": "3151234567",
        "fecha_ingreso": "2024-01-01",
        "datos_personales": {
            "fecha_nacimiento": "1990-01-01",
            "direccion": "Calle 1",
            "ciudad": "Honda",
            "departamento": "Tolima",
            "pais": "Colombia"
        },
        "datos_laborales": {
            "institucion_educativa": "IE Test",
            "cargo": "Docente",
            "tipo_contrato": "Indefinido",
            "fecha_vinculacion": "2020-01-01",
            "salario_basico": 500000  # Por debajo del mínimo
        },
        "informacion_familiar": {},
        "informacion_financiera": {
            "ingresos_mensuales": 3000000,
            "egresos_mensuales": 1500000
        },
        "informacion_academica": {
            "nivel_educativo": "Licenciatura"
        },
        "informacion_vivienda": {
            "tipo_vivienda": "casa",
            "tenencia": "propia"
        }
    }
    
    response = client.post("/api/v1/asociados/", headers=auth_headers_admin, json=data)
    assert response.status_code == 422
    assert "errors" in response.json()["detail"]
    assert any("salario" in error.lower() or "mínimo" in error.lower() for error in response.json()["detail"]["errors"])


def test_crear_asociado_datos_validos(client: TestClient, auth_headers_admin: dict):
    """Test que acepta datos completamente válidos."""
    data = {
        "tipo_documento": "CC",
        "numero_documento": "99887766",
        "nombres": "Ana María",
        "apellidos": "Rodríguez Gómez",
        "correo_electronico": "ana.rodriguez@test.com",
        "telefono_principal": "3181234567",
        "fecha_ingreso": "2024-01-01",
        "datos_personales": {
            "fecha_nacimiento": "1985-05-15",
            "direccion": "Carrera 10 #5-23",
            "ciudad": "Honda",
            "departamento": "Tolima",
            "pais": "Colombia"
        },
        "datos_laborales": {
            "institucion_educativa": "IE Honda",
            "cargo": "Docente de Matemáticas",
            "tipo_contrato": "Indefinido",
            "fecha_vinculacion": "2015-02-01",
            "salario_basico": 4500000
        },
        "informacion_familiar": {},
        "informacion_financiera": {
            "ingresos_mensuales": 4500000,
            "egresos_mensuales": 2000000
        },
        "informacion_academica": {
            "nivel_educativo": "Maestría"
        },
        "informacion_vivienda": {
            "tipo_vivienda": "casa",
            "tenencia": "propia"
        }
    }
    
    response = client.post("/api/v1/asociados/", headers=auth_headers_admin, json=data)
    assert response.status_code == 201
    assert response.json()["numero_documento"] == "99887766"
