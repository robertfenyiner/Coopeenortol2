"""
Tests para el módulo de gestión de documentos.
"""
import io
import pytest
from fastapi import UploadFile
from fastapi.testclient import TestClient

from app.core.file_storage import FileStorageManager
from app.models.asociado import Asociado
from app.models.documento import Documento
from app.models.usuario import Usuario, RolUsuario
from app.core.security import SecurityManager


def crear_archivo_test(nombre: str, contenido: bytes, content_type: str) -> UploadFile:
    """Helper para crear un archivo de prueba."""
    return UploadFile(
        filename=nombre,
        file=io.BytesIO(contenido),
        content_type=content_type
    )


@pytest.fixture
def usuario_admin(db):
    """Crear usuario administrador para tests."""
    usuario = Usuario(
        username="admin_docs",
        email="admin_docs@test.com",
        nombre_completo="Administrador Documentos",
        hashed_password=SecurityManager.hash_password("password123"),
        rol=RolUsuario.ADMIN,
        is_active=True,
        is_superuser=True
    )
    db.add(usuario)
    db.commit()
    db.refresh(usuario)
    return usuario


@pytest.fixture
def asociado_test(db):
    """Crear asociado para tests."""
    from datetime import date
    
    asociado = Asociado(
        tipo_documento="CC",
        numero_documento="1234567890",
        nombres="Juan",
        apellidos="Pérez",
        correo_electronico="juan.perez@test.com",
        telefono_principal="3001234567",
        estado="activo",
        fecha_ingreso=date.today()
    )
    db.add(asociado)
    db.commit()
    db.refresh(asociado)
    return asociado


@pytest.fixture
def auth_headers(usuario_admin):
    """Obtener headers de autenticación."""
    from datetime import timedelta
    access_token = SecurityManager.create_access_token(
        subject=usuario_admin.username,
        expires_delta=timedelta(minutes=30),
        scopes=usuario_admin.permisos
    )
    return {"Authorization": f"Bearer {access_token}"}


def test_subir_documento_pdf(client: TestClient, db, asociado_test, auth_headers):
    """Test subir documento PDF válido."""
    # Inicializar almacenamiento
    FileStorageManager.initialize_storage()
    
    # Crear archivo PDF ficticio
    pdf_content = b"%PDF-1.4\n%Fake PDF content for testing\n%%EOF"
    
    response = client.post(
        "/api/v1/documentos/subir",
        headers=auth_headers,
        data={
            "asociado_id": asociado_test.id,
            "tipo_documento": "cedula_ciudadania",
            "descripcion": "Cédula de ciudadanía escaneada"
        },
        files={
            "file": ("cedula.pdf", pdf_content, "application/pdf")
        }
    )
    
    assert response.status_code == 201
    data = response.json()
    assert data["mensaje"] == "Documento subido exitosamente"
    assert data["documento"]["tipo_documento"] == "cedula_ciudadania"
    assert data["documento"]["nombre_archivo"] == "cedula.pdf"
    assert data["documento"]["mime_type"] == "application/pdf"
    assert data["documento"]["es_valido"] == False


def test_subir_documento_imagen(client: TestClient, db, asociado_test, auth_headers):
    """Test subir documento como imagen JPG."""
    FileStorageManager.initialize_storage()
    
    # Crear imagen JPG ficticia (header básico)
    jpg_content = b"\xff\xd8\xff\xe0\x00\x10JFIF" + b"\x00" * 100
    
    response = client.post(
        "/api/v1/documentos/subir",
        headers=auth_headers,
        data={
            "asociado_id": asociado_test.id,
            "tipo_documento": "comprobante_ingresos",
            "descripcion": "Desprendible de nómina"
        },
        files={
            "file": ("nomina.jpg", jpg_content, "image/jpeg")
        }
    )
    
    assert response.status_code == 201
    data = response.json()
    assert data["documento"]["mime_type"] == "image/jpeg"


def test_subir_documento_sin_autenticacion(client: TestClient, asociado_test):
    """Test que se requiere autenticación para subir documentos."""
    pdf_content = b"%PDF-1.4\nTest\n%%EOF"
    
    response = client.post(
        "/api/v1/documentos/subir",
        data={
            "asociado_id": asociado_test.id,
            "tipo_documento": "cedula_ciudadania"
        },
        files={
            "file": ("test.pdf", pdf_content, "application/pdf")
        }
    )
    
    assert response.status_code in [401, 403]


def test_subir_documento_tipo_invalido(client: TestClient, asociado_test, auth_headers):
    """Test que rechaza tipos de documento inválidos."""
    pdf_content = b"%PDF-1.4\nTest\n%%EOF"
    
    response = client.post(
        "/api/v1/documentos/subir",
        headers=auth_headers,
        data={
            "asociado_id": asociado_test.id,
            "tipo_documento": "tipo_invalido",
            "descripcion": "Test"
        },
        files={
            "file": ("test.pdf", pdf_content, "application/pdf")
        }
    )
    
    assert response.status_code == 400
    assert "Tipo de documento inválido" in response.json()["detail"]


def test_subir_documento_asociado_inexistente(client: TestClient, auth_headers):
    """Test que rechaza documentos para asociados que no existen."""
    pdf_content = b"%PDF-1.4\nTest\n%%EOF"
    
    response = client.post(
        "/api/v1/documentos/subir",
        headers=auth_headers,
        data={
            "asociado_id": 99999,
            "tipo_documento": "cedula_ciudadania"
        },
        files={
            "file": ("test.pdf", pdf_content, "application/pdf")
        }
    )
    
    assert response.status_code == 404
    assert "no encontrado" in response.json()["detail"]


def test_listar_documentos(client: TestClient, db, asociado_test, usuario_admin, auth_headers):
    """Test listar documentos."""
    FileStorageManager.initialize_storage()
    
    # Crear algunos documentos de prueba
    from app.models.documento import Documento
    
    doc1 = Documento(
        asociado_id=asociado_test.id,
        nombre_archivo="doc1.pdf",
        nombre_almacenado="uuid1.pdf",
        tipo_documento="cedula_ciudadania",
        mime_type="application/pdf",
        tamano_bytes=1024,
        ruta_almacenamiento="cedulas/uuid1.pdf",
        subido_por_id=usuario_admin.id,
        es_valido=True,
        activo=True
    )
    
    doc2 = Documento(
        asociado_id=asociado_test.id,
        nombre_archivo="doc2.pdf",
        nombre_almacenado="uuid2.pdf",
        tipo_documento="comprobante_ingresos",
        mime_type="application/pdf",
        tamano_bytes=2048,
        ruta_almacenamiento="comprobantes/uuid2.pdf",
        subido_por_id=usuario_admin.id,
        es_valido=False,
        activo=True
    )
    
    db.add(doc1)
    db.add(doc2)
    db.commit()
    
    # Listar todos los documentos
    response = client.get("/api/v1/documentos/", headers=auth_headers)
    
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 2
    assert len(data["documentos"]) >= 2


def test_listar_documentos_filtro_asociado(client: TestClient, db, asociado_test, usuario_admin, auth_headers):
    """Test filtrar documentos por asociado."""
    FileStorageManager.initialize_storage()
    
    from app.models.documento import Documento
    
    doc = Documento(
        asociado_id=asociado_test.id,
        nombre_archivo="test.pdf",
        nombre_almacenado="uuid.pdf",
        tipo_documento="cedula_ciudadania",
        mime_type="application/pdf",
        tamano_bytes=1024,
        ruta_almacenamiento="cedulas/uuid.pdf",
        subido_por_id=usuario_admin.id,
        es_valido=True,
        activo=True
    )
    db.add(doc)
    db.commit()
    
    # Filtrar por asociado
    response = client.get(
        f"/api/v1/documentos/?asociado_id={asociado_test.id}",
        headers=auth_headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 1
    assert all(d["asociado_id"] == asociado_test.id for d in data["documentos"])


def test_obtener_documento_especifico(client: TestClient, db, asociado_test, usuario_admin, auth_headers):
    """Test obtener un documento específico."""
    from app.models.documento import Documento
    
    doc = Documento(
        asociado_id=asociado_test.id,
        nombre_archivo="test.pdf",
        nombre_almacenado="uuid.pdf",
        tipo_documento="cedula_ciudadania",
        mime_type="application/pdf",
        tamano_bytes=1024,
        ruta_almacenamiento="cedulas/uuid.pdf",
        subido_por_id=usuario_admin.id,
        es_valido=False,
        activo=True
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    
    response = client.get(f"/api/v1/documentos/{doc.id}", headers=auth_headers)
    
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == doc.id
    assert data["nombre_archivo"] == "test.pdf"
    assert data["tipo_documento"] == "cedula_ciudadania"


def test_validar_documento(client: TestClient, db, asociado_test, usuario_admin, auth_headers):
    """Test validar un documento."""
    from app.models.documento import Documento
    
    # Guardar IDs antes de que los objetos se detachen
    usuario_id = usuario_admin.id
    
    doc = Documento(
        asociado_id=asociado_test.id,
        nombre_archivo="test.pdf",
        nombre_almacenado="uuid.pdf",
        tipo_documento="cedula_ciudadania",
        mime_type="application/pdf",
        tamano_bytes=1024,
        ruta_almacenamiento="cedulas/uuid.pdf",
        subido_por_id=usuario_id,
        es_valido=False,
        activo=True
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    
    # Validar documento
    response = client.post(
        f"/api/v1/documentos/{doc.id}/validar",
        headers=auth_headers,
        json={
            "es_valido": True,
            "notas_validacion": "Documento correcto y legible"
        }
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["es_valido"] == True
    assert data["notas_validacion"] == "Documento correcto y legible"
    assert data["validado_por_id"] == usuario_id
    assert data["fecha_validacion"] is not None


def test_actualizar_documento(client: TestClient, db, asociado_test, usuario_admin, auth_headers):
    """Test actualizar información de un documento."""
    from app.models.documento import Documento
    
    doc = Documento(
        asociado_id=asociado_test.id,
        nombre_archivo="test.pdf",
        nombre_almacenado="uuid.pdf",
        tipo_documento="cedula_ciudadania",
        mime_type="application/pdf",
        tamano_bytes=1024,
        ruta_almacenamiento="cedulas/uuid.pdf",
        descripcion="Descripción original",
        subido_por_id=usuario_admin.id,
        es_valido=False,
        activo=True
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    
    # Actualizar
    response = client.put(
        f"/api/v1/documentos/{doc.id}",
        headers=auth_headers,
        json={
            "descripcion": "Descripción actualizada",
            "tipo_documento": "pasaporte"
        }
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["descripcion"] == "Descripción actualizada"
    assert data["tipo_documento"] == "pasaporte"


def test_eliminar_documento(client: TestClient, db, asociado_test, usuario_admin, auth_headers):
    """Test eliminar documento (soft delete)."""
    from app.models.documento import Documento
    
    doc = Documento(
        asociado_id=asociado_test.id,
        nombre_archivo="test.pdf",
        nombre_almacenado="uuid.pdf",
        tipo_documento="cedula_ciudadania",
        mime_type="application/pdf",
        tamano_bytes=1024,
        ruta_almacenamiento="cedulas/uuid.pdf",
        subido_por_id=usuario_admin.id,
        es_valido=False,
        activo=True
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    
    doc_id = doc.id
    
    # Eliminar
    response = client.delete(f"/api/v1/documentos/{doc_id}", headers=auth_headers)
    
    assert response.status_code == 204
    
    # Verificar que no aparece en listados
    response = client.get("/api/v1/documentos/", headers=auth_headers)
    documentos = response.json()["documentos"]
    assert not any(d["id"] == doc_id for d in documentos)


def test_estadisticas_documentos_asociado(client: TestClient, db, asociado_test, usuario_admin, auth_headers):
    """Test obtener estadísticas de documentos de un asociado."""
    from app.models.documento import Documento
    
    # Crear documentos con diferentes estados
    doc1 = Documento(
        asociado_id=asociado_test.id,
        nombre_archivo="doc1.pdf",
        nombre_almacenado="uuid1.pdf",
        tipo_documento="cedula_ciudadania",
        mime_type="application/pdf",
        tamano_bytes=1024,
        ruta_almacenamiento="cedulas/uuid1.pdf",
        subido_por_id=usuario_admin.id,
        es_valido=True,
        activo=True
    )
    
    doc2 = Documento(
        asociado_id=asociado_test.id,
        nombre_archivo="doc2.pdf",
        nombre_almacenado="uuid2.pdf",
        tipo_documento="comprobante_ingresos",
        mime_type="application/pdf",
        tamano_bytes=2048,
        ruta_almacenamiento="comprobantes/uuid2.pdf",
        subido_por_id=usuario_admin.id,
        es_valido=False,
        activo=True
    )
    
    db.add_all([doc1, doc2])
    db.commit()
    
    # Obtener estadísticas
    response = client.get(
        f"/api/v1/documentos/asociado/{asociado_test.id}/estadisticas",
        headers=auth_headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 2
    assert data["validados"] >= 1
    assert data["pendientes"] >= 1
    assert "por_tipo" in data
