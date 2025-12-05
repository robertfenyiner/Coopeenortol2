"""
Script para probar todas las funcionalidades del módulo de ahorros.
"""
import sys
from datetime import date, timedelta
from decimal import Decimal
from pathlib import Path

# Agregar el directorio raíz al path
sys.path.append(str(Path(__file__).parent.parent))

from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.ahorro import EstadoCuentaAhorro, TipoAhorro
from app.schemas.ahorro import (
    ConsignacionCrear,
    CuentaAhorroCrear,
    RetiroCrear,
    TransferenciaCrear,
)
from app.services.ahorros import AhorroService


def test_ahorros_completo():
    """Prueba completa del módulo de ahorros."""
    db: Session = SessionLocal()
    
    try:
        print("=" * 80)
        print("PRUEBA COMPLETA DEL MÓDULO DE AHORROS")
        print("=" * 80)
        
        # ID de usuario admin (asumiendo que existe)
        usuario_id = 1
        asociado_id = 2  # Usar un asociado activo existente
        
        # ==================== 1. Crear cuentas de diferentes tipos ====================
        print("\n1. CREANDO CUENTAS DE AHORRO...")
        
        # Cuenta a la vista
        cuenta_vista = AhorroService.crear_cuenta(
            db,
            CuentaAhorroCrear(
                asociado_id=asociado_id,
                tipo_ahorro=TipoAhorro.A_LA_VISTA,
                monto_inicial=Decimal("100000"),
                observaciones="Cuenta de ahorro a la vista para pruebas"
            ),
            usuario_id
        )
        print(f"✓ Cuenta a la vista creada: {cuenta_vista.numero_cuenta} - Saldo: ${cuenta_vista.saldo_disponible:,.2f}")
        
        # Cuenta programada
        cuenta_programada = AhorroService.crear_cuenta(
            db,
            CuentaAhorroCrear(
                asociado_id=asociado_id,
                tipo_ahorro=TipoAhorro.PROGRAMADO,
                monto_inicial=Decimal("50000"),
                meta_ahorro=Decimal("5000000"),
                cuota_mensual=Decimal("200000"),
                fecha_inicio_programado=date.today(),
                fecha_fin_programado=date.today() + timedelta(days=365),
                observaciones="Ahorro programado para vivienda"
            ),
            usuario_id
        )
        print(f"✓ Cuenta programada creada: {cuenta_programada.numero_cuenta} - Meta: ${cuenta_programada.meta_ahorro:,.2f}")
        
        # CDAT
        cuenta_cdat = AhorroService.crear_cuenta(
            db,
            CuentaAhorroCrear(
                asociado_id=asociado_id,
                tipo_ahorro=TipoAhorro.CDAT,
                monto_inicial=Decimal("2000000"),
                plazo_dias=180,
                renovacion_automatica=True,
                observaciones="CDAT a 6 meses"
            ),
            usuario_id
        )
        print(f"✓ CDAT creado: {cuenta_cdat.numero_cuenta} - Vence: {cuenta_cdat.fecha_vencimiento_cdat}")
        
        # ==================== 2. Realizar consignaciones ====================
        print("\n2. REALIZANDO CONSIGNACIONES...")
        
        consig1 = AhorroService.realizar_consignacion(
            db,
            ConsignacionCrear(
                cuenta_id=cuenta_vista.id,
                valor=Decimal("250000"),
                referencia="CONS-001",
                descripcion="Consignación por nómina"
            ),
            usuario_id
        )
        print(f"✓ Consignación 1: ${consig1.valor:,.2f} - Nuevo saldo: ${consig1.saldo_nuevo:,.2f}")
        
        consig2 = AhorroService.realizar_consignacion(
            db,
            ConsignacionCrear(
                cuenta_id=cuenta_programada.id,
                valor=Decimal("200000"),
                descripcion="Cuota mensual ahorro programado"
            ),
            usuario_id
        )
        print(f"✓ Consignación 2: ${consig2.valor:,.2f} - Nuevo saldo: ${consig2.saldo_nuevo:,.2f}")
        
        # ==================== 3. Realizar retiros ====================
        print("\n3. REALIZANDO RETIROS...")
        
        retiro1 = AhorroService.realizar_retiro(
            db,
            RetiroCrear(
                cuenta_id=cuenta_vista.id,
                valor=Decimal("50000"),
                referencia="RET-001",
                descripcion="Retiro en efectivo"
            ),
            usuario_id
        )
        print(f"✓ Retiro: ${retiro1.valor:,.2f} - Nuevo saldo: ${retiro1.saldo_nuevo:,.2f}")
        
        # ==================== 4. Realizar transferencia ====================
        print("\n4. REALIZANDO TRANSFERENCIA...")
        
        mov_salida, mov_entrada = AhorroService.realizar_transferencia(
            db,
            TransferenciaCrear(
                cuenta_origen_id=cuenta_vista.id,
                cuenta_destino_id=cuenta_programada.id,
                valor=Decimal("100000"),
                descripcion="Transferencia a ahorro programado"
            ),
            usuario_id
        )
        print(f"✓ Transferencia realizada: ${mov_salida.valor:,.2f}")
        print(f"  - Cuenta origen saldo: ${mov_salida.saldo_nuevo:,.2f}")
        print(f"  - Cuenta destino saldo: ${mov_entrada.saldo_nuevo:,.2f}")
        
        # ==================== 5. Calcular intereses ====================
        print("\n5. CALCULANDO INTERESES...")
        
        # Simular que ha pasado un mes (30 días)
        fecha_calculo = date.today() + timedelta(days=30)
        
        for cuenta in [cuenta_vista, cuenta_programada, cuenta_cdat]:
            movimiento_interes = AhorroService.calcular_intereses_cuenta(
                db, cuenta.id, fecha_calculo, usuario_id
            )
            if movimiento_interes:
                print(f"✓ Intereses calculados para {cuenta.numero_cuenta}: ${movimiento_interes.valor:,.2f}")
            else:
                print(f"⚠ No se calcularon intereses para {cuenta.numero_cuenta}")
        
        # ==================== 6. Estadísticas ====================
        print("\n6. ESTADÍSTICAS DEL SISTEMA...")
        
        estadisticas = AhorroService.obtener_estadisticas(db)
        print(f"✓ Total cuentas: {estadisticas['total_cuentas']}")
        print(f"✓ Cuentas activas: {estadisticas['total_cuentas_activas']}")
        print(f"✓ Total ahorro: ${estadisticas['total_ahorro']:,.2f}")
        print(f"✓ Promedio saldo: ${estadisticas['promedio_saldo']:,.2f}")
        print("\nDistribución por tipo:")
        for tipo, total in estadisticas['total_por_tipo'].items():
            print(f"  - {tipo}: ${total:,.2f}")
        
        # ==================== 7. Listar movimientos ====================
        print("\n7. MOVIMIENTOS DE LA CUENTA A LA VISTA...")
        
        movimientos = AhorroService.obtener_movimientos(db, cuenta_vista.id, skip=0, limit=10)
        for mov in movimientos:
            signo = "+" if mov.saldo_nuevo > mov.saldo_anterior else "-"
            print(f"  {mov.fecha_movimiento.strftime('%Y-%m-%d %H:%M')} | {mov.tipo_movimiento:25} | {signo}${mov.valor:>12,.2f} | Saldo: ${mov.saldo_nuevo:>12,.2f}")
        
        # ==================== 8. Obtener configuración ====================
        print("\n8. CONFIGURACIÓN DEL SISTEMA...")
        
        config = AhorroService.obtener_configuracion(db)
        print(f"✓ Tasa ahorro vista: {config.tasa_ahorro_vista}% E.A.")
        print(f"✓ Tasa ahorro programado: {config.tasa_ahorro_programado}% E.A.")
        print(f"✓ Tasa CDAT: {config.tasa_cdat}% E.A.")
        print(f"✓ Monto mínimo apertura: ${config.monto_minimo_apertura:,.2f}")
        print(f"✓ Monto mínimo CDAT: ${config.monto_minimo_cdat:,.2f}")
        print(f"✓ GMF activo: {'Sí' if config.gmf_activo else 'No'} ({config.tasa_gmf}x1000)")
        
        print("\n" + "=" * 80)
        print("✅ PRUEBA COMPLETA EXITOSA - MÓDULO DE AHORROS FUNCIONAL")
        print("=" * 80)
        
        # Resumen final
        print("\nRESUMEN DE CUENTAS CREADAS:")
        for cuenta in [cuenta_vista, cuenta_programada, cuenta_cdat]:
            db.refresh(cuenta)
            print(f"  {cuenta.numero_cuenta} ({cuenta.tipo_ahorro}): ${cuenta.saldo_disponible:,.2f}")
        
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    test_ahorros_completo()
