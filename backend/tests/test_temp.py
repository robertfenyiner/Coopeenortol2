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

def test_crear_asociado(client: TestClient, payload_base: dict, auth_headers_admin: dict):
    respuesta = client.post("/api/v1/asociados/", json=payload_base, headers=auth_headers_admin)
    print(f"\n\nStatus: {respuesta.status_code}")
    print(f"Response: {respuesta.json()}\n\n")
    assert respuesta.status_code == 201
