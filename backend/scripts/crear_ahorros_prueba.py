"""
Script para crear datos de prueba del módulo de ahorros.
"""
import sys
from pathlib import Path

# Agregar el directorio raíz al path
sys.path.insert(0, str(Path(__file__).parent.parent))

from decimal import Decimal
from datetime import date

from app.database import SessionLocal
from app.models.asociado import Asociado
from app.models.usuario import Usuario
from app.models.ahorro import TipoAhorro
from app.models.credito import Credito  # noqa: F401 - Import needed for relationships
from app.models.contabilidad import AsientoContable  # noqa: F401 - Import needed for relationships
from app.schemas.ahorro import CuentaAhorroCrear, ConsignacionCrear, RetiroCrear
from app.services.ahorros import AhorroService


def crear_cuentas_ahorro_prueba(db, cantidad=5):
    """Crear cuentas de ahorro de prueba."""
    
    # Obtener asociados activos
    asociados = db.query(Asociado).filter(Asociado.estado == "activo").limit(cantidad).all()
    
    if not asociados:
        print("❌ No hay asociados activos. Crea asociados primero.")
        return []
    
    # Obtener un usuario admin
    admin = db.query(Usuario).filter(Usuario.rol.in_(["ADMIN", "SUPERUSUARIO", "admin"])).first()
    if not admin:
        print("❌ No hay usuarios admin. Crea un admin primero.")
        return []
    
    tipos_ahorro = [
        TipoAhorro.A_LA_VISTA,
        TipoAhorro.PROGRAMADO,
        TipoAhorro.CDAT,
        TipoAhorro.A_LA_VISTA,
        TipoAhorro.PROGRAMADO,
    ]
    
    montos_iniciales = [
        Decimal("500000"),
        Decimal("200000"),
        Decimal("2000000"),
        Decimal("1000000"),
        Decimal("300000"),
    ]
    
    cuentas_creadas = []
    
    for i, asociado in enumerate(asociados):
        tipo = tipos_ahorro[i % len(tipos_ahorro)]
        monto = montos_iniciales[i % len(montos_iniciales)]
        
        try:
            datos = CuentaAhorroCrear(
                asociado_id=asociado.id,
                tipo_ahorro=tipo,
                monto_inicial=monto,
                observaciones=f"Cuenta de prueba {i+1}"
            )
            
            # Para ahorro programado, agregar meta y cuota
            if tipo == TipoAhorro.PROGRAMADO:
                datos.meta_ahorro = Decimal("5000000")
                datos.cuota_mensual = Decimal("200000")
                datos.fecha_inicio_programado = date.today()
            
            # Para CDAT, agregar plazo
            if tipo == TipoAhorro.CDAT:
                datos.plazo_dias = 180  # 6 meses
                datos.renovacion_automatica = True
            
            cuenta = AhorroService.crear_cuenta(db, datos, admin.id)
            cuentas_creadas.append(cuenta)
            
            print(f"✓ Cuenta {i+1}/{cantidad} - {cuenta.numero_cuenta}")
            print(f"  Asociado: {asociado.nombres} {asociado.apellidos}")
            print(f"  Tipo: {cuenta.tipo_ahorro}")
            print(f"  Saldo inicial: ${cuenta.saldo_disponible:,.2f}")
            print(f"  Tasa: {cuenta.tasa_interes_anual}% anual")
            print()
            
        except Exception as e:
            print(f"❌ Error creando cuenta para {asociado.nombres}: {str(e)}")
            continue
    
    return cuentas_creadas


def crear_movimientos_prueba(db, cuentas):
    """Crear movimientos de prueba en las cuentas."""
    
    # Obtener un usuario admin
    admin = db.query(Usuario).filter(Usuario.rol.in_(["ADMIN", "SUPERUSUARIO", "admin"])).first()
    if not admin:
        return
    
    print("\n" + "="*60)
    print("Creando movimientos de prueba...")
    print("="*60 + "\n")
    
    for i, cuenta in enumerate(cuentas[:3]):  # Solo las primeras 3 cuentas
        try:
            # Consignación
            consignacion = ConsignacionCrear(
                cuenta_id=cuenta.id,
                valor=Decimal("100000"),
                descripcion=f"Consignación de prueba {i+1}"
            )
            mov_cons = AhorroService.realizar_consignacion(db, consignacion, admin.id)
            print(f"✓ Consignación en {cuenta.numero_cuenta}: ${mov_cons.valor:,.2f}")
            
            # Retiro (solo si hay saldo suficiente)
            if cuenta.saldo_disponible > Decimal("50000"):
                retiro = RetiroCrear(
                    cuenta_id=cuenta.id,
                    valor=Decimal("50000"),
                    descripcion=f"Retiro de prueba {i+1}"
                )
                mov_ret = AhorroService.realizar_retiro(db, retiro, admin.id)
                print(f"✓ Retiro en {cuenta.numero_cuenta}: ${mov_ret.valor:,.2f}")
            
        except Exception as e:
            print(f"❌ Error creando movimientos: {str(e)}")
            continue


def main():
    print("\n" + "="*60)
    print("Creando datos de prueba para el módulo de Ahorros")
    print("="*60 + "\n")
    
    db = SessionLocal()
    
    try:
        # Crear cuentas
        cuentas = crear_cuentas_ahorro_prueba(db, cantidad=5)
        
        if cuentas:
            # Crear movimientos
            crear_movimientos_prueba(db, cuentas)
            
            # Mostrar estadísticas
            print("\n" + "="*60)
            print("✓ Datos de prueba creados exitosamente")
            print("="*60 + "\n")
            
            stats = AhorroService.obtener_estadisticas(db)
            
            print("📊 ESTADÍSTICAS DEL SISTEMA DE AHORROS:")
            print("-"*60)
            print(f"Total de cuentas: {stats['total_cuentas']}")
            print(f"Cuentas activas: {stats['total_cuentas_activas']}")
            print(f"Total ahorrado: ${stats['total_ahorro']:,.2f}")
            print(f"Promedio por cuenta: ${stats['promedio_saldo']:,.2f}")
            print("\nPor tipo de ahorro:")
            for tipo, total in stats['total_por_tipo'].items():
                print(f"  - {tipo}: ${total:,.2f}")
            print("\n" + "="*60)
            
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    main()
