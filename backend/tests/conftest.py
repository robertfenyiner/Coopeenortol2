"""
Fixtures compartidos para las pruebas.
"""
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

from app.main import app
from app.database import Base, get_db
from app.core.security import SecurityManager
from app.models.usuario import Usuario, RolUsuario

# Base de datos de prueba en memoria
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db():
    """
    Crea una base de datos de prueba y la limpia después de cada test.
    """
    Base.metadata.create_all(bind=engine)
    db_session = TestingSessionLocal()
    try:
        yield db_session
    finally:
        db_session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db):
    """
    Cliente de pruebas de FastAPI con base de datos de prueba.
    """
    def override_get_db():
        try:
            yield db
        finally:
            db.close()
    
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def admin_user(db):
    """
    Crea un usuario administrador de prueba.
    """
    user = Usuario(
        username="admin_test",
        email="admin@test.com",
        nombre_completo="Admin Test",
        hashed_password=SecurityManager.hash_password("admin123"),
        rol=RolUsuario.ADMIN.value,
        is_active=True,
        is_superuser=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def analista_user(db):
    """
    Crea un usuario analista de prueba.
    """
    user = Usuario(
        username="analista_test",
        email="analista@test.com",
        nombre_completo="Analista Test",
        hashed_password=SecurityManager.hash_password("analista123"),
        rol=RolUsuario.ANALISTA.value,
        is_active=True,
        is_superuser=False
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def auditor_user(db):
    """
    Crea un usuario auditor de prueba.
    """
    user = Usuario(
        username="auditor_test",
        email="auditor@test.com",
        nombre_completo="Auditor Test",
        hashed_password=SecurityManager.hash_password("auditor123"),
        rol=RolUsuario.AUDITOR.value,
        is_active=True,
        is_superuser=False
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def admin_token(admin_user):
    """
    Genera un token JWT para el usuario admin.
    """
    return SecurityManager.create_access_token(subject=admin_user.username)


@pytest.fixture
def analista_token(analista_user):
    """
    Genera un token JWT para el usuario analista.
    """
    return SecurityManager.create_access_token(subject=analista_user.username)


@pytest.fixture
def auditor_token(auditor_user):
    """
    Genera un token JWT para el usuario auditor.
    """
    return SecurityManager.create_access_token(subject=auditor_user.username)


@pytest.fixture
def auth_headers_admin(admin_token):
    """
    Headers de autenticación para admin.
    """
    return {"Authorization": f"Bearer {admin_token}"}


@pytest.fixture
def auth_headers_analista(analista_token):
    """
    Headers de autenticación para analista.
    """
    return {"Authorization": f"Bearer {analista_token}"}


@pytest.fixture
def auth_headers_auditor(auditor_token):
    """
    Headers de autenticación para auditor.
    """
    return {"Authorization": f"Bearer {auditor_token}"}
