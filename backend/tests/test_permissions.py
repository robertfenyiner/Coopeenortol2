"""
Pruebas para el sistema de permisos.
"""
import pytest
from fastapi import status


def test_admin_puede_listar_asociados(client, auth_headers_admin, admin_user):
    """Test que admin puede listar asociados."""
    response = client.get(
        "/api/v1/asociados/",
        headers=auth_headers_admin
    )
    assert response.status_code == status.HTTP_200_OK


def test_analista_puede_listar_asociados(client, auth_headers_analista, analista_user):
    """Test que analista puede listar asociados."""
    response = client.get(
        "/api/v1/asociados/",
        headers=auth_headers_analista
    )
    assert response.status_code == status.HTTP_200_OK


def test_auditor_puede_listar_asociados(client, auth_headers_auditor, auditor_user):
    """Test que auditor puede listar asociados."""
    response = client.get(
        "/api/v1/asociados/",
        headers=auth_headers_auditor
    )
    assert response.status_code == status.HTTP_200_OK


def test_sin_autenticacion_no_puede_listar(client):
    """Test que sin autenticación no se puede listar asociados."""
    response = client.get("/api/v1/asociados/")
    assert response.status_code == status.HTTP_403_FORBIDDEN


def test_analista_puede_crear_asociado(client, auth_headers_analista, analista_user):
    """Test que analista puede crear asociados."""
    asociado_data = {
        "tipo_documento": "CC",
        "numero_documento": "1234567890",
        "nombres": "Juan",
        "apellidos": "Pérez",
        "correo_electronico": "juan.perez@test.com",
        "telefono_principal": "3001234567",
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
    
    response = client.post(
        "/api/v1/asociados/",
        headers=auth_headers_analista,
        json=asociado_data
    )
    assert response.status_code == status.HTTP_201_CREATED


def test_auditor_no_puede_crear_asociado(client, auth_headers_auditor, auditor_user):
    """Test que auditor NO puede crear asociados."""
    asociado_data = {
        "tipo_documento": "CC",
        "numero_documento": "9876543210",
        "nombres": "María",
        "apellidos": "González",
        "correo_electronico": "maria.gonzalez@test.com",
        "fecha_ingreso": "2024-01-01"
    }
    
    response = client.post(
        "/api/v1/asociados/",
        headers=auth_headers_auditor,
        json=asociado_data
    )
    assert response.status_code == status.HTTP_403_FORBIDDEN


def test_permisos_usuario_admin(admin_user):
    """Test que el admin tiene los permisos correctos."""
    permisos = admin_user.permisos
    
    assert "asociados:crear" in permisos
    assert "asociados:leer" in permisos
    assert "asociados:actualizar" in permisos
    assert "asociados:eliminar" in permisos
    assert "usuarios:crear" in permisos


def test_permisos_usuario_analista(analista_user):
    """Test que el analista tiene los permisos correctos."""
    permisos = analista_user.permisos
    
    assert "asociados:crear" in permisos
    assert "asociados:leer" in permisos
    assert "asociados:actualizar" in permisos
    assert "asociados:eliminar" not in permisos
    assert "usuarios:crear" not in permisos


def test_permisos_usuario_auditor(auditor_user):
    """Test que el auditor tiene los permisos correctos."""
    permisos = auditor_user.permisos
    
    assert "asociados:crear" not in permisos
    assert "asociados:leer" in permisos
    assert "asociados:actualizar" not in permisos
    assert "asociados:eliminar" not in permisos
