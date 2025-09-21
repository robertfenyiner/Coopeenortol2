#!/usr/bin/env python3
"""Script para probar crear asociado con autenticación."""

import requests

# URL del backend
BASE_URL = "http://5.189.146.163:8000"

def obtener_token():
    """Obtener token de acceso."""
    login_data = {
        "username": "admin",
        "password": "robert0217"
    }
    
    response = requests.post(
        f"{BASE_URL}/api/v1/auth/login",
        data=login_data,
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    
    if response.status_code == 200:
        return response.json().get("access_token")
    else:
        print(f"❌ Error login: {response.text}")
        return None

def crear_asociado_con_token(token):
    """Crear asociado con token de autorización."""
    
    asociado_data = {
        "tipo_documento": "CC",
        "numero_documento": "11111111",
        "nombres": "Ana",
        "apellidos": "López",
        "correo_electronico": "ana@test.com",
        "telefono_principal": "3009876543",
        "estado": "activo",
        "fecha_ingreso": "2025-01-01",
        "observaciones": "",
        "datos_personales": {
            "fecha_nacimiento": "1985-05-15",
            "lugar_nacimiento": "",
            "direccion": "Carrera 456",
            "barrio": "",
            "ciudad": "Medellín",
            "departamento": "Antioquia",
            "pais": "Colombia",
            "codigo_postal": "",
            "estado_civil": "",
            "genero": "",
            "grupo_sanguineo": "",
            "eps": "",
            "arl": "",
            "telefono_alternativo": "",
            "numero_hijos": 0,
            "personas_a_cargo": 0
        },
        "datos_laborales": {
            "institucion_educativa": "Coopeenortol",
            "cargo": "Docente",
            "tipo_contrato": "Indefinido",
            "fecha_vinculacion": "2025-01-01",
            "salario_basico": 2500000,
            "horario": "Diurno",
            "dependencia": "Primaria"
        },
        "informacion_familiar": {
            "familiares": [],
            "contactos_emergencia": [],
            "personas_autorizadas": []
        },
        "informacion_financiera": {
            "ingresos_mensuales": 2500000,
            "ingresos_adicionales": 0,
            "egresos_mensuales": 1500000,
            "ingresos_familiares": 0,
            "gastos_familiares": 0,
            "obligaciones": [],
            "referencias_comerciales": [],
            "activos": []
        },
        "informacion_academica": {
            "nivel_educativo": "Universitario",
            "institucion": "Universidad Nacional",
            "titulo_obtenido": "Licenciatura en Educación",
            "ano_graduacion": 2010,
            "en_estudio": False,
            "programa_actual": "",
            "institucion_actual": "",
            "semestre_actual": 1,
            "certificaciones": []
        },
        "informacion_vivienda": {
            "tipo_vivienda": "Casa",
            "tenencia": "Propia",
            "valor_arriendo": 0,
            "tiempo_residencia": 60,
            "servicios_publicos": ["agua", "luz", "gas"],
            "estrato": 3
        }
    }
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token}"
    }
    
    response = requests.post(
        f"{BASE_URL}/api/v1/asociados/",
        json=asociado_data,
        headers=headers
    )
    
    if response.status_code == 200 or response.status_code == 201:
        print("✅ Asociado creado exitosamente!")
        print(f"ID: {response.json().get('id')}")
        print(f"Nombre: {response.json().get('nombres')} {response.json().get('apellidos')}")
        return True
    else:
        print(f"❌ Error crear asociado {response.status_code}: {response.text}")
        return False

if __name__ == "__main__":
    print("🔐 Obteniendo token...")
    token = obtener_token()
    
    if token:
        print("✅ Token obtenido exitosamente")
        print(f"Token: {token[:50]}...")
        
        print("\n👤 Creando asociado con autenticación...")
        exito = crear_asociado_con_token(token)
        
        if exito:
            print("\n✅ ¡Todo funcionando perfectamente!")
        else:
            print("\n❌ Hubo un problema al crear el asociado")
    else:
        print("❌ No se pudo obtener el token")