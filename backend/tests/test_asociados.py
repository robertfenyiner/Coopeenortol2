from copy import deepcopy
from datetime import date
import pytest
from fastapi.testclient import TestClient


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
        "informacion_academica": {
            "nivel_educativo": "Maestría",
            "titulo_obtenido": "Magíster en Educación Matemática",
            "institucion": "Universidad Pedagógica Nacional",
            "ano_graduacion": 2015,
            "en_estudio": False,
        },
        "informacion_vivienda": {
            "tipo_vivienda": "casa",
            "tenencia": "propia",
            "estrato": 3,
            "tiempo_residencia": 60,
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


def crear_asociado(client: TestClient, payload: dict, headers: dict) -> dict:
    respuesta = client.post("/api/v1/asociados/", json=payload, headers=headers)
    assert respuesta.status_code == 201, respuesta.text
    return respuesta.json()


def test_crear_asociado(client: TestClient, payload_base: dict, auth_headers_admin: dict):
    respuesta = client.post("/api/v1/asociados/", json=payload_base, headers=auth_headers_admin)
    assert respuesta.status_code == 201
    datos = respuesta.json()
    assert datos["numero_documento"] == payload_base["numero_documento"]
    assert datos["datos_personales"]["ciudad"] == "Honda"


def test_evitar_documento_duplicado(client: TestClient, payload_base: dict, auth_headers_admin: dict):
    crear_asociado(client, payload_base, auth_headers_admin)
    respuesta = client.post("/api/v1/asociados/", json=payload_base, headers=auth_headers_admin)
    assert respuesta.status_code == 400
    assert "documento" in respuesta.json()["detail"].lower()


def test_listar_asociados(client: TestClient, payload_base: dict, auth_headers_admin: dict):
    crear_asociado(client, payload_base, auth_headers_admin)
    respuesta = client.get("/api/v1/asociados/", headers=auth_headers_admin)
    assert respuesta.status_code == 200
    datos = respuesta.json()
    assert "datos" in datos
    assert "paginacion" in datos
    assert len(datos["datos"]) >= 1
    assert datos["datos"][0]["nombres"] == payload_base["nombres"]


def test_actualizar_asociado(client: TestClient, payload_base: dict, auth_headers_admin: dict):
    creado = crear_asociado(client, payload_base, auth_headers_admin)
    actualizado = deepcopy(payload_base)
    actualizado["estado"] = "inactivo"
    actualizado["informacion_financiera"] = deepcopy(payload_base["informacion_financiera"])
    actualizado["informacion_financiera"]["egresos_mensuales"] = 2500000

    respuesta = client.put(f"/api/v1/asociados/{creado['id']}", json=actualizado, headers=auth_headers_admin)
    assert respuesta.status_code == 200
    datos = respuesta.json()
    assert datos["estado"] == "inactivo"
    assert datos["informacion_financiera"]["egresos_mensuales"] == 2500000


def test_eliminar_asociado(client: TestClient, payload_base: dict, auth_headers_admin: dict):
    creado = crear_asociado(client, payload_base, auth_headers_admin)
    respuesta = client.delete(f"/api/v1/asociados/{creado['id']}", headers=auth_headers_admin)
    assert respuesta.status_code == 204
    consulta = client.get(f"/api/v1/asociados/{creado['id']}", headers=auth_headers_admin)
    # El asociado aún existe pero con estado 'inactivo' (soft delete)
    assert consulta.status_code == 200
    asociado = consulta.json()
    assert asociado["estado"] == "inactivo"
