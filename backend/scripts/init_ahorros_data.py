"""
Script para inicializar datos de prueba del módulo de ahorros.
"""
import sys
from pathlib import Path

# Agregar el directorio backend al path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from decimal import Decimal
from datetime import datetime, date, timedelta

from app.database import SessionLocal
from app.models.ahorro import CuentaAhorro, MovimientoAhorro, ConfiguracionAhorro, TipoAhorro, TipoMovimientoAhorro, EstadoCuentaAhorro
from app.models.asociado import Asociado
from app.models.usuario import Usuario


def init_configuracion(db):
    """Inicializar configuración del módulo de ahorros."""
    config = db.query(ConfiguracionAhorro).first()
    if not config:
        config = ConfiguracionAhorro(
            tasa_ahorro_vista=Decimal("0.5"),
            tasa_ahorro_programado=Decimal("2.0"),
            tasa_cdat=Decimal("4.0"),
            tasa_aportes=Decimal("1.0"),
            monto_minimo_apertura=Decimal("50000"),
            monto_minimo_consignacion=Decimal("10000"),
            monto_minimo_cdat=Decimal("1000000"),
            gmf_activo=True,
            tasa_gmf=Decimal("0.0004"),  # 4x1000
            cuota_manejo_mensual=Decimal("0")
        )
        db.add(config)
        db.commit()
        print("✅ Configuración de ahorros creada")
    else:
        print("ℹ️  Configuración ya existe")
    
    return config


def crear_cuentas_prueba(db):
    """Crear cuentas de ahorro de prueba."""
    
    # Obtener asociados existentes
    asociados = db.query(Asociado).filter(Asociado.estado == "activo").limit(5).all()
    if not asociados:
        print("❌ No hay asociados activos para crear cuentas")
        return
    
    # Obtener usuario admin
    admin = db.query(Usuario).filter(Usuario.username == "admin").first()
    if not admin:
        print("❌ Usuario admin no encontrado")
        return
    
    # Verificar si ya existen cuentas
    cuentas_existentes = db.query(CuentaAhorro).count()
    if cuentas_existentes > 0:
        print(f"ℹ️  Ya existen {cuentas_existentes} cuentas de ahorro")
        return
    
    cuentas_creadas = 0
    
    # Crear diferentes tipos de cuentas
    tipos_cuentas = [
        {
            "tipo": TipoAhorro.A_LA_VISTA,
            "saldo": Decimal("500000"),
            "tasa": Decimal("0.5")
        },
        {
            "tipo": TipoAhorro.PROGRAMADO,
            "saldo": Decimal("100000"),
            "tasa": Decimal("2.0"),
            "meta": Decimal("5000000"),
            "cuota": Decimal("200000"),
            "plazo_meses": 24
        },
        {
            "tipo": TipoAhorro.CDAT,
            "saldo": Decimal("2000000"),
            "tasa": Decimal("4.0"),
            "plazo_dias": 180
        },
        {
            "tipo": TipoAhorro.A_LA_VISTA,
            "saldo": Decimal("1500000"),
            "tasa": Decimal("0.5")
        },
        {
            "tipo": TipoAhorro.CONTRACTUAL,
            "saldo": Decimal("300000"),
            "tasa": Decimal("1.5")
        }
    ]
    
    for i, asociado in enumerate(asociados[:len(tipos_cuentas)]):
        config_cuenta = tipos_cuentas[i]
        
        # Generar número de cuenta único
        numero_cuenta = f"AH{datetime.now().year}{str(asociado.id).zfill(6)}{str(i+1)}"
        
        # Crear cuenta
        cuenta = CuentaAhorro(
            numero_cuenta=numero_cuenta,
            asociado_id=asociado.id,
            tipo_ahorro=config_cuenta["tipo"].value,
            estado=EstadoCuentaAhorro.ACTIVA.value,
            saldo_disponible=config_cuenta["saldo"],
            saldo_bloqueado=Decimal("0"),
            tasa_interes_anual=config_cuenta["tasa"],
            cuota_manejo=Decimal("0"),
            abierta_por_id=admin.id,
            fecha_apertura=datetime.now()
        )
        
        # Configuraciones específicas por tipo
        if config_cuenta["tipo"] == TipoAhorro.PROGRAMADO:
            cuenta.meta_ahorro = config_cuenta.get("meta")
            cuenta.cuota_mensual = config_cuenta.get("cuota")
            cuenta.fecha_inicio_programado = date.today()
            cuenta.fecha_fin_programado = date.today() + timedelta(days=config_cuenta.get("plazo_meses", 12) * 30)
        
        elif config_cuenta["tipo"] == TipoAhorro.CDAT:
            cuenta.plazo_dias = config_cuenta.get("plazo_dias")
            cuenta.fecha_apertura_cdat = date.today()
            cuenta.fecha_vencimiento_cdat = date.today() + timedelta(days=config_cuenta.get("plazo_dias", 180))
            cuenta.renovacion_automatica = False
        
        db.add(cuenta)
        db.flush()
        
        # Crear movimiento de apertura
        movimiento = MovimientoAhorro(
            numero_movimiento=f"MOV{datetime.now().year}{str(cuenta.id).zfill(8)}01",
            cuenta_id=cuenta.id,
            tipo_movimiento=TipoMovimientoAhorro.APERTURA.value,
            valor=config_cuenta["saldo"],
            saldo_anterior=Decimal("0"),
            saldo_nuevo=config_cuenta["saldo"],
            descripcion=f"Apertura de cuenta {config_cuenta['tipo'].value}",
            realizado_por_id=admin.id,
            fecha_movimiento=datetime.now()
        )
        db.add(movimiento)
        
        cuentas_creadas += 1
        print(f"✅ Cuenta {numero_cuenta} creada para {asociado.nombres} {asociado.apellidos} - Tipo: {config_cuenta['tipo'].value}")
    
    db.commit()
    print(f"\n✅ Total: {cuentas_creadas} cuentas de ahorro creadas con sus movimientos de apertura")


def main():
    """Función principal."""
    print("=" * 60)
    print("Inicializando datos de prueba - Módulo de Ahorros")
    print("=" * 60)
    
    db = SessionLocal()
    try:
        # 1. Configuración
        init_configuracion(db)
        
        # 2. Cuentas de prueba
        print("\n📝 Creando cuentas de ahorro de prueba...")
        crear_cuentas_prueba(db)
        
        # Resumen
        print("\n" + "=" * 60)
        print("RESUMEN:")
        from sqlalchemy import func
        
        total_cuentas = db.query(CuentaAhorro).count()
        total_movimientos = db.query(MovimientoAhorro).count()
        total_saldo = db.query(func.sum(CuentaAhorro.saldo_disponible)).scalar() or Decimal("0")
        
        print(f"Total cuentas de ahorro: {total_cuentas}")
        print(f"Total movimientos: {total_movimientos}")
        print(f"Saldo total: ${total_saldo:,.2f}")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
