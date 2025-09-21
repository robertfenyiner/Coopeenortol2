#!/usr/bin/env python3
"""Script para crear usuario admin remotamente."""

import requests
import json

# URL del backend
BASE_URL = "http://5.189.146.163:8000"

def crear_admin():
    """Crear usuario admin."""
    
    # Datos del admin
    admin_data = {
        "nombres": "Admin",
        "apellidos": "Sistema",
        "correo_electronico": "admin@coopeenortol.com",
        "username": "admin",
        "password": "robert0217",
        "es_activo": True,
        "es_admin": True
    }
    
    try:
        # Intentar crear el usuario
        response = requests.post(
            f"{BASE_URL}/api/v1/auth/usuarios/",
            json=admin_data,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            print("✅ Usuario admin creado exitosamente")
            print(f"Respuesta: {response.json()}")
        elif response.status_code == 400:
            error_data = response.json()
            if "ya existe" in str(error_data).lower():
                print("⚠️ Usuario admin ya existe")
            else:
                print(f"❌ Error 400: {error_data}")
        else:
            print(f"❌ Error {response.status_code}: {response.text}")
            
    except Exception as e:
        print(f"❌ Error de conexión: {e}")

def probar_login():
    """Probar login con admin."""
    
    login_data = {
        "username": "admin",
        "password": "robert0217"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/v1/auth/login",
            data=login_data,  # Form data
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        
        if response.status_code == 200:
            token_data = response.json()
            print("✅ Login exitoso")
            print(f"Token: {token_data.get('access_token', 'No token')}")
            return token_data.get("access_token")
        else:
            print(f"❌ Error login {response.status_code}: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Error de conexión en login: {e}")
        return None

if __name__ == "__main__":
    print("🔨 Creando usuario admin...")
    crear_admin()
    
    print("\n🔐 Probando login...")
    token = probar_login()
    
    if token:
        print(f"\n✅ Todo funcionando. Token: {token[:50]}...")
    else:
        print("\n❌ Problema con el login")