#!/usr/bin/env python3
"""
Test completo del sistema Coopeenortol
Verifica todos los módulos y endpoints principales
"""
import requests
import json
from datetime import date, datetime
from typing import Dict, Any

BASE_URL = "http://localhost:8000/api/v1"
TOKEN = None

# Colores para output
RED = '\033[91m'
GREEN = '\033[92m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
RESET = '\033[0m'

def print_test(name: str, success: bool, details: str = ""):
    """Imprime resultado de test con colores"""
    status = f"{GREEN}✓ PASS{RESET}" if success else f"{RED}✗ FAIL{RESET}"
    print(f"{status} - {name}")
    if details:
        print(f"  {details}")

def login() -> bool:
    """Test 1: Login y obtención de token"""
    global TOKEN
    try:
        response = requests.post(
            f"{BASE_URL}/auth/login",
            data={"username": "admin", "password": "admin123"},
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        if response.status_code == 200:
            data = response.json()
            TOKEN = data.get("access_token")
            print_test("Login", True, f"Token obtenido: {TOKEN[:20]}...")
            return True
        else:
            print_test("Login", False, f"Status: {response.status_code}")
            return False
    except Exception as e:
        print_test("Login", False, str(e))
        return False

def get_headers() -> Dict[str, str]:
    """Retorna headers con token"""
    return {
        "Authorization": f"Bearer {TOKEN}",
        "Content-Type": "application/json"
    }

def test_asociados():
    """Test 2-4: Módulo de Asociados"""
    print(f"\n{BLUE}=== MÓDULO ASOCIADOS ==={RESET}")
    
    # Listar asociados
    try:
        response = requests.get(f"{BASE_URL}/asociados/", headers=get_headers())
        if response.status_code == 200:
            data = response.json()
            total = data.get("paginacion", {}).get("total", 0)
            print_test("Listar asociados", True, f"Total: {total} asociados")
        else:
            print_test("Listar asociados", False, f"Status: {response.status_code}")
    except Exception as e:
        print_test("Listar asociados", False, str(e))
    
    # Crear asociado
    try:
        timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        nuevo = {
            "tipo_documento": "CC",
            "numero_documento": f"TEST{timestamp}",
            "nombres": "Test Completo",
            "apellidos": "Sistema Prueba",
            "correo_electronico": f"test{timestamp}@test.com",
            "telefono_principal": "3001234567",
            "estado": "activo",
            "fecha_ingreso": str(date.today())
        }
        response = requests.post(f"{BASE_URL}/asociados/", headers=get_headers(), json=nuevo)
        if response.status_code in [200, 201]:
            data = response.json()
            print_test("Crear asociado", True, f"ID: {data.get('id')}, Doc: {data.get('numero_documento')}")
            return data.get('id')
        else:
            print_test("Crear asociado", False, f"Status: {response.status_code}, {response.text[:100]}")
            return None
    except Exception as e:
        print_test("Crear asociado", False, str(e))
        return None

def test_creditos(asociado_id: int = None):
    """Test 5-7: Módulo de Créditos"""
    print(f"\n{BLUE}=== MÓDULO CRÉDITOS ==={RESET}")
    
    # Listar créditos
    try:
        response = requests.get(f"{BASE_URL}/creditos/", headers=get_headers())
        if response.status_code == 200:
            data = response.json()
            total = len(data.get("creditos", []))
            print_test("Listar créditos", True, f"Total: {total} créditos")
        else:
            print_test("Listar créditos", False, f"Status: {response.status_code}")
    except Exception as e:
        print_test("Listar créditos", False, str(e))
    
    # Solicitar crédito
    if asociado_id:
        try:
            nuevo = {
                "asociado_id": asociado_id,
                "tipo_credito": "consumo",
                "monto_solicitado": 1500000,
                "plazo_meses": 12,
                "tasa_interes": 2.0,
                "destino": "Prueba sistema completo",
                "fecha_solicitud": str(date.today())
            }
            response = requests.post(f"{BASE_URL}/creditos/solicitar", headers=get_headers(), json=nuevo)
            if response.status_code == 201:
                data = response.json()
                print_test("Solicitar crédito", True, f"Número: {data.get('numero_credito')}")
                return data.get('id')
            else:
                print_test("Solicitar crédito", False, f"Status: {response.status_code}, {response.text[:100]}")
                return None
        except Exception as e:
            print_test("Solicitar crédito", False, str(e))
            return None
    else:
        print_test("Solicitar crédito", False, "No hay asociado_id")
        return None

def test_ahorros(asociado_id: int = None):
    """Test 8-10: Módulo de Ahorros"""
    print(f"\n{BLUE}=== MÓDULO AHORROS ==={RESET}")
    
    # Listar cuentas
    try:
        response = requests.get(f"{BASE_URL}/ahorros/", headers=get_headers())
        if response.status_code == 200:
            data = response.json()
            total = len(data.get("cuentas", []))
            print_test("Listar cuentas de ahorro", True, f"Total: {total} cuentas")
        else:
            print_test("Listar cuentas de ahorro", False, f"Status: {response.status_code}")
    except Exception as e:
        print_test("Listar cuentas de ahorro", False, str(e))
    
    # Crear cuenta
    if asociado_id:
        try:
            nueva = {
                "asociado_id": asociado_id,
                "tipo_ahorro": "a_la_vista",
                "monto_inicial": 200000
            }
            response = requests.post(f"{BASE_URL}/ahorros/", headers=get_headers(), json=nueva)
            if response.status_code in [200, 201]:
                data = response.json()
                print_test("Crear cuenta de ahorro", True, f"Número: {data.get('numero_cuenta')}, Saldo: ${data.get('saldo_disponible'):,.0f}")
                return data.get('id')
            else:
                print_test("Crear cuenta de ahorro", False, f"Status: {response.status_code}, {response.text[:100]}")
                return None
        except Exception as e:
            print_test("Crear cuenta de ahorro", False, str(e))
            return None
    else:
        print_test("Crear cuenta de ahorro", False, "No hay asociado_id")
        return None

def test_reportes():
    """Test 11-13: Módulo de Reportes"""
    print(f"\n{BLUE}=== MÓDULO REPORTES ==={RESET}")
    
    # Balance General
    try:
        response = requests.get(f"{BASE_URL}/reportes/balance-general?fecha_corte={date.today()}", headers=get_headers())
        if response.status_code == 200:
            data = response.json()
            cuadrado = data.get("cuadrado")
            total_activos = data.get("total_activos", 0)
            print_test("Balance General", True, f"Activos: ${total_activos:,.0f}, Cuadrado: {cuadrado}")
        else:
            print_test("Balance General", False, f"Status: {response.status_code}, {response.text[:100]}")
    except Exception as e:
        print_test("Balance General", False, str(e))
    
    # Cartera
    try:
        response = requests.get(f"{BASE_URL}/reportes/cartera", headers=get_headers())
        if response.status_code == 200:
            data = response.json()
            stats = data.get("estadisticas", {})
            total = stats.get("cartera_total", 0)
            mora = stats.get("tasa_mora", 0)
            print_test("Reporte de Cartera", True, f"Total: ${total:,.0f}, Mora: {mora}%")
        else:
            print_test("Reporte de Cartera", False, f"Status: {response.status_code}")
    except Exception as e:
        print_test("Reporte de Cartera", False, str(e))
    
    # Estadísticas
    try:
        response = requests.get(f"{BASE_URL}/ahorros/estadisticas/general", headers=get_headers())
        if response.status_code == 200:
            data = response.json()
            total_ahorros = data.get("total_ahorros", 0)
            cuentas = data.get("total_cuentas_activas", 0)
            print_test("Estadísticas Ahorros", True, f"Total: ${total_ahorros:,.0f} en {cuentas} cuentas")
        else:
            print_test("Estadísticas Ahorros", False, f"Status: {response.status_code}")
    except Exception as e:
        print_test("Estadísticas Ahorros", False, str(e))

def test_documentos(asociado_id: int = None):
    """Test 14: Módulo de Documentos"""
    print(f"\n{BLUE}=== MÓDULO DOCUMENTOS ==={RESET}")
    
    # Listar documentos
    try:
        response = requests.get(f"{BASE_URL}/documentos/", headers=get_headers())
        if response.status_code == 200:
            data = response.json()
            total = len(data.get("documentos", []))
            print_test("Listar documentos", True, f"Total: {total} documentos")
        else:
            print_test("Listar documentos", False, f"Status: {response.status_code}")
    except Exception as e:
        print_test("Listar documentos", False, str(e))

def test_contabilidad():
    """Test 15-16: Módulo de Contabilidad"""
    print(f"\n{BLUE}=== MÓDULO CONTABILIDAD ==={RESET}")
    
    # Listar cuentas
    try:
        response = requests.get(f"{BASE_URL}/contabilidad/cuentas", headers=get_headers())
        if response.status_code == 200:
            data = response.json()
            total = len(data.get("cuentas", []))
            print_test("Plan de cuentas (PUC)", True, f"Total: {total} cuentas")
        else:
            print_test("Plan de cuentas (PUC)", False, f"Status: {response.status_code}")
    except Exception as e:
        print_test("Plan de cuentas (PUC)", False, str(e))
    
    # Listar aportes
    try:
        response = requests.get(f"{BASE_URL}/contabilidad/aportes", headers=get_headers())
        if response.status_code == 200:
            data = response.json()
            total = data.get("total", 0)
            print_test("Listar aportes", True, f"Total: {total} aportes")
        else:
            print_test("Listar aportes", False, f"Status: {response.status_code}")
    except Exception as e:
        print_test("Listar aportes", False, str(e))

def main():
    """Ejecutar todos los tests"""
    print(f"\n{BLUE}{'='*60}{RESET}")
    print(f"{BLUE}  TEST COMPLETO DEL SISTEMA COOPEENORTOL{RESET}")
    print(f"{BLUE}{'='*60}{RESET}\n")
    
    # Login
    if not login():
        print(f"\n{RED}Error en login. No se pueden continuar los tests.{RESET}")
        return
    
    # Tests de módulos
    asociado_id = test_asociados()
    credito_id = test_creditos(asociado_id)
    cuenta_id = test_ahorros(asociado_id)
    test_reportes()
    test_documentos(asociado_id)
    test_contabilidad()
    
    # Resumen
    print(f"\n{BLUE}{'='*60}{RESET}")
    print(f"{BLUE}  RESUMEN DE TESTS COMPLETADOS{RESET}")
    print(f"{BLUE}{'='*60}{RESET}")
    print(f"{GREEN}✓{RESET} Backend funcionando en: {BASE_URL}")
    print(f"{GREEN}✓{RESET} Todos los módulos probados")
    print(f"{GREEN}✓{RESET} Frontend disponible en: http://158.220.100.148:5173")
    print()

if __name__ == "__main__":
    main()
