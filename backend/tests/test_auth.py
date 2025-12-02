"""
Pruebas para el sistema de autenticación.
"""
import pytest
from fastapi import status


def test_login_exitoso(client, admin_user):
    """Test de login con credenciales correctas."""
    response = client.post(
        "/api/v1/auth/login",
        data={
            "username": "admin_test",
            "password": "admin123"
        }
    )
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert "user" in data


def test_login_credenciales_invalidas(client, admin_user):
    """Test de login con contraseña incorrecta."""
    response = client.post(
        "/api/v1/auth/login",
        data={
            "username": "admin_test",
            "password": "wrong_password"
        }
    )
    
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_login_usuario_inexistente(client):
    """Test de login con usuario que no existe."""
    response = client.post(
        "/api/v1/auth/login",
        data={
            "username": "noexiste",
            "password": "cualquiera"
        }
    )
    
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_obtener_usuario_actual(client, auth_headers_admin, admin_user):
    """Test de obtener información del usuario autenticado."""
    response = client.get(
        "/api/v1/auth/me",
        headers=auth_headers_admin
    )
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["username"] == "admin_test"
    assert data["email"] == "admin@test.com"
    assert data["rol"] == "admin"


def test_obtener_usuario_sin_token(client):
    """Test de obtener usuario sin estar autenticado."""
    response = client.get("/api/v1/auth/me")
    
    assert response.status_code == status.HTTP_403_FORBIDDEN


def test_cambiar_password(client, auth_headers_admin, admin_user, db):
    """Test de cambio de contraseña."""
    response = client.post(
        "/api/v1/auth/cambiar-password",
        headers=auth_headers_admin,
        json={
            "password_actual": "admin123",
            "password_nueva": "newpassword123",
            "confirmar_password": "newpassword123"
        }
    )
    
    assert response.status_code == status.HTTP_200_OK
    
    # Verificar que se puede hacer login con la nueva contraseña
    login_response = client.post(
        "/api/v1/auth/login",
        data={
            "username": "admin_test",
            "password": "newpassword123"
        }
    )
    assert login_response.status_code == status.HTTP_200_OK


def test_cambiar_password_incorrecto(client, auth_headers_admin):
    """Test de cambio de contraseña con password actual incorrecto."""
    response = client.post(
        "/api/v1/auth/cambiar-password",
        headers=auth_headers_admin,
        json={
            "password_actual": "wrong_password",
            "password_nueva": "newpassword123",
            "confirmar_password": "newpassword123"
        }
    )
    
    assert response.status_code == status.HTTP_400_BAD_REQUEST
