from pathlib import Path
import sys

ROOT_DIR = Path(__file__).resolve().parents[2]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

import sitecustomize  # noqa: F401
from copy import deepcopy
from datetime import date

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app

SQLALCHEMY_DATABASE_URL = "sqlite://"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


def cargar_tablas():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)


@pytest.fixture(autouse=True)
def preparar_bd():
    cargar_tablas()
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client():
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as cliente:
        yield cliente
    app.dependency_overrides.clear()


@pytest.fixture
def payload_base():
    return {
        "tipo_documento": "CC",
        "numero_documento": "123456789",
        "nombres": "Ana María",
        "apellidos": "Pérez Gómez",
        "correo_electronico": "ana.perez@example.com",
        "telefono_principal": "3100000000",
        "estado": "activo",
        "fecha_ingreso": date(2020, 1, 15).isoformat(),
        "hoja_vida_url": "https://example.com/hv/ana-perez.pdf",
        "observaciones": "Docente de matemáticas con especialización en pedagogía.",
        "datos_personales": {
            "fecha_nacimiento": date(1985, 5, 14).isoformat(),
            "direccion": "Calle 10 #4-55",
            "ciudad": "Honda",
            "departamento": "Tolima",
            "pais": "Colombia",
            "estado_civil": "Casada",
            "genero": "Femenino",
            "nivel_academico": "Maestría",
            "profesion": "Licenciada en Matemáticas",
            "tipo_vivienda": "Propia",
            "telefono_alternativo": "3200000000",
        },
        "datos_laborales": {
            "institucion_educativa": "Institución Educativa Honda",
            "cargo": "Docente de matemáticas",
            "tipo_contrato": "Indefinido",
            "fecha_vinculacion": date(2010, 2, 1).isoformat(),
            "salario_basico": 4500000,
            "horario": "Diurno",
            "dependencia": "Departamento de Ciencias",
        },
        "informacion_familiar": {
            "estado_civil": "Casada",
            "numero_hijos": 2,
            "personas_a_cargo": 3,
            "familiares": [
                {
                    "nombre": "Carlos Rodríguez",
                    "parentesco": "Cónyuge",
                    "fecha_nacimiento": date(1984, 8, 20).isoformat(),
                    "ocupacion": "Ingeniero Industrial",
                    "convive": True,
                }
            ],
            "contactos_emergencia": [
                {
                    "nombre": "María Gómez",
                    "parentesco": "Madre",
                    "telefono": "3111111111",
                }
            ],
        },
        "informacion_financiera": {
            "ingresos_mensuales": 4500000,
            "egresos_mensuales": 2200000,
            "endeudamiento": 0.35,
            "obligaciones": [
                {
                    "entidad": "Banco Cooperativo",
                    "tipo": "Crédito hipotecario",
                    "saldo": 55000000,
                    "cuota_mensual": 820000,
                }
            ],
            "calificacion_riesgo": "Media",
            "observaciones": "Historial crediticio favorable.",
        },
    }


def crear_asociado(client: TestClient, payload: dict) -> dict:
    respuesta = client.post("/api/v1/asociados/", json=payload)
    assert respuesta.status_code == 201, respuesta.text
    return respuesta.json()


def test_crear_asociado(client: TestClient, payload_base: dict):
    respuesta = client.post("/api/v1/asociados/", json=payload_base)
    assert respuesta.status_code == 201
    datos = respuesta.json()
    assert datos["numero_documento"] == payload_base["numero_documento"]
    assert datos["datos_personales"]["ciudad"] == "Honda"


def test_evitar_documento_duplicado(client: TestClient, payload_base: dict):
    crear_asociado(client, payload_base)
    respuesta = client.post("/api/v1/asociados/", json=payload_base)
    assert respuesta.status_code == 400
    assert "documento" in respuesta.json()["detail"].lower()


def test_listar_asociados(client: TestClient, payload_base: dict):
    crear_asociado(client, payload_base)
    respuesta = client.get("/api/v1/asociados/")
    assert respuesta.status_code == 200
    datos = respuesta.json()
    assert len(datos) == 1
    assert datos[0]["nombres"] == payload_base["nombres"]


def test_actualizar_asociado(client: TestClient, payload_base: dict):
    creado = crear_asociado(client, payload_base)
    actualizado = deepcopy(payload_base)
    actualizado["estado"] = "inactivo"
    actualizado["informacion_financiera"] = deepcopy(payload_base["informacion_financiera"])
    actualizado["informacion_financiera"]["egresos_mensuales"] = 2500000

    respuesta = client.put(f"/api/v1/asociados/{creado['id']}", json=actualizado)
    assert respuesta.status_code == 200
    datos = respuesta.json()
    assert datos["estado"] == "inactivo"
    assert datos["informacion_financiera"]["egresos_mensuales"] == 2500000


def test_eliminar_asociado(client: TestClient, payload_base: dict):
    creado = crear_asociado(client, payload_base)
    respuesta = client.delete(f"/api/v1/asociados/{creado['id']}")
    assert respuesta.status_code == 204
    consulta = client.get(f"/api/v1/asociados/{creado['id']}")
    assert consulta.status_code == 404
