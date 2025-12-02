"""Tests para el sistema de auditoría"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session


def test_listar_auditoria_admin(client: TestClient, auth_headers_admin: dict):
    """Admin puede listar registros de auditoría"""
    response = client.get("/api/v1/auditoria/", headers=auth_headers_admin)
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_listar_auditoria_auditor(client: TestClient, auth_headers_auditor: dict):
    """Auditor puede listar registros de auditoría"""
    response = client.get("/api/v1/auditoria/", headers=auth_headers_auditor)
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_listar_auditoria_analista_denegado(client: TestClient, auth_headers_analista: dict):
    """Analista NO puede listar registros de auditoría"""
    response = client.get("/api/v1/auditoria/", headers=auth_headers_analista)
    assert response.status_code == 403
    assert "permiso" in response.json()["detail"].lower()


def test_login_crea_registro_auditoria(client: TestClient, admin_user, db: Session):
    """Login exitoso crea un registro de auditoría"""
    from app.models.auditoria import RegistroAuditoria
    
    # Contar registros antes
    count_before = db.query(RegistroAuditoria).count()
    
    # Hacer login
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "admin_test", "password": "admin123"}
    )
    assert response.status_code == 200
    
    # Verificar que se creó un registro
    count_after = db.query(RegistroAuditoria).count()
    assert count_after == count_before + 1
    
    # Verificar contenido del registro
    ultimo_registro = db.query(RegistroAuditoria).order_by(
        RegistroAuditoria.fecha_hora.desc()
    ).first()
    assert ultimo_registro.accion == "LOGIN_EXITOSO"
    assert ultimo_registro.entidad == "Usuario"
    assert ultimo_registro.usuario_id == admin_user.id


def test_filtrar_auditoria_por_accion(client: TestClient, auth_headers_admin: dict, admin_user, db: Session):
    """Filtrar registros por tipo de acción"""
    from app.services.auditoria import AuditoriaService
    
    # Crear algunos registros de prueba
    AuditoriaService.registrar(
        db=db,
        usuario=admin_user,
        accion="TEST_ACTION",
        entidad="TestEntity",
        descripcion="Acción de prueba"
    )
    
    # Buscar por acción específica
    response = client.get(
        "/api/v1/auditoria/?accion=TEST_ACTION",
        headers=auth_headers_admin
    )
    assert response.status_code == 200
    registros = response.json()
    assert len(registros) >= 1
    assert all(r["accion"] == "TEST_ACTION" for r in registros)


def test_filtrar_auditoria_por_usuario(client: TestClient, auth_headers_admin: dict, admin_user):
    """Filtrar registros por usuario"""
    response = client.get(
        f"/api/v1/auditoria/?usuario_id={admin_user.id}",
        headers=auth_headers_admin
    )
    assert response.status_code == 200
    registros = response.json()
    # Todos los registros deben ser del usuario especificado
    assert all(r["usuario_id"] == admin_user.id for r in registros)


def test_obtener_registro_especifico(client: TestClient, auth_headers_admin: dict, admin_user, db: Session):
    """Obtener un registro de auditoría específico"""
    from app.services.auditoria import AuditoriaService
    
    # Crear un registro
    registro = AuditoriaService.registrar(
        db=db,
        usuario=admin_user,
        accion="TEST_GET",
        entidad="TestEntity",
        descripcion="Registro de prueba para GET"
    )
    
    # Obtener el registro
    response = client.get(
        f"/api/v1/auditoria/{registro.id}",
        headers=auth_headers_admin
    )
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == registro.id
    assert data["accion"] == "TEST_GET"
    assert data["descripcion"] == "Registro de prueba para GET"


def test_paginacion_auditoria(client: TestClient, auth_headers_admin: dict):
    """Verificar paginación de registros"""
    # Obtener primeros 5 registros
    response = client.get(
        "/api/v1/auditoria/?skip=0&limit=5",
        headers=auth_headers_admin
    )
    assert response.status_code == 200
    registros = response.json()
    assert len(registros) <= 5


def test_sin_autenticacion_no_puede_acceder_auditoria(client: TestClient):
    """Sin autenticación no se puede acceder a auditoría"""
    response = client.get("/api/v1/auditoria/")
    # Puede devolver 401 (sin token) o 403 (sin permisos)
    assert response.status_code in [401, 403]
