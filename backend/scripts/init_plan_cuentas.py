"""
Script para inicializar el plan de cuentas básico (PUC simplificado).
"""
from decimal import Decimal
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.contabilidad import CuentaContable


def init_plan_cuentas(db: Session):
    """Inicializar plan de cuentas básico."""
    
    # Verificar si ya existen cuentas
    existe = db.query(CuentaContable).first()
    if existe:
        print("El plan de cuentas ya está inicializado.")
        return
    
    print("Inicializando plan de cuentas...")
    
    # NIVEL 1: CLASES
    cuentas = [
        # ACTIVOS
        CuentaContable(
            codigo="1",
            nombre="ACTIVO",
            tipo="activo",
            naturaleza="debito",
            nivel=1,
            es_auxiliar=False,
            activa=True,
            descripcion="Total de activos"
        ),
        # PASIVOS
        CuentaContable(
            codigo="2",
            nombre="PASIVO",
            tipo="pasivo",
            naturaleza="credito",
            nivel=1,
            es_auxiliar=False,
            activa=True,
            descripcion="Total de pasivos"
        ),
        # PATRIMONIO
        CuentaContable(
            codigo="3",
            nombre="PATRIMONIO",
            tipo="patrimonio",
            naturaleza="credito",
            nivel=1,
            es_auxiliar=False,
            activa=True,
            descripcion="Total de patrimonio"
        ),
        # INGRESOS
        CuentaContable(
            codigo="4",
            nombre="INGRESOS",
            tipo="ingreso",
            naturaleza="credito",
            nivel=1,
            es_auxiliar=False,
            activa=True,
            descripcion="Total de ingresos"
        ),
        # GASTOS
        CuentaContable(
            codigo="5",
            nombre="GASTOS",
            tipo="gasto",
            naturaleza="debito",
            nivel=1,
            es_auxiliar=False,
            activa=True,
            descripcion="Total de gastos"
        ),
    ]
    
    for cuenta in cuentas:
        db.add(cuenta)
    
    db.flush()
    
    # NIVEL 2: GRUPOS (principales)
    # Obtener IDs de clases
    activo = db.query(CuentaContable).filter(CuentaContable.codigo == "1").first()
    pasivo = db.query(CuentaContable).filter(CuentaContable.codigo == "2").first()
    patrimonio = db.query(CuentaContable).filter(CuentaContable.codigo == "3").first()
    ingreso = db.query(CuentaContable).filter(CuentaContable.codigo == "4").first()
    gasto = db.query(CuentaContable).filter(CuentaContable.codigo == "5").first()
    
    grupos = [
        # ACTIVO
        CuentaContable(codigo="11", nombre="DISPONIBLE", tipo="activo", naturaleza="debito", cuenta_padre_id=activo.id, nivel=2, es_auxiliar=False),
        CuentaContable(codigo="13", nombre="DEUDORES", tipo="activo", naturaleza="debito", cuenta_padre_id=activo.id, nivel=2, es_auxiliar=False),
        CuentaContable(codigo="15", nombre="PROPIEDADES Y EQUIPO", tipo="activo", naturaleza="debito", cuenta_padre_id=activo.id, nivel=2, es_auxiliar=False),
        
        # PASIVO
        CuentaContable(codigo="21", nombre="OBLIGACIONES FINANCIERAS", tipo="pasivo", naturaleza="credito", cuenta_padre_id=pasivo.id, nivel=2, es_auxiliar=False),
        CuentaContable(codigo="23", nombre="CUENTAS POR PAGAR", tipo="pasivo", naturaleza="credito", cuenta_padre_id=pasivo.id, nivel=2, es_auxiliar=False),
        CuentaContable(codigo="25", nombre="OBLIGACIONES LABORALES", tipo="pasivo", naturaleza="credito", cuenta_padre_id=pasivo.id, nivel=2, es_auxiliar=False),
        
        # PATRIMONIO
        CuentaContable(codigo="31", nombre="APORTES SOCIALES", tipo="patrimonio", naturaleza="credito", cuenta_padre_id=patrimonio.id, nivel=2, es_auxiliar=False),
        CuentaContable(codigo="32", nombre="RESERVAS", tipo="patrimonio", naturaleza="credito", cuenta_padre_id=patrimonio.id, nivel=2, es_auxiliar=False),
        CuentaContable(codigo="36", nombre="RESULTADOS DEL EJERCICIO", tipo="patrimonio", naturaleza="credito", cuenta_padre_id=patrimonio.id, nivel=2, es_auxiliar=False),
        
        # INGRESOS
        CuentaContable(codigo="41", nombre="OPERACIONALES", tipo="ingreso", naturaleza="credito", cuenta_padre_id=ingreso.id, nivel=2, es_auxiliar=False),
        CuentaContable(codigo="42", nombre="NO OPERACIONALES", tipo="ingreso", naturaleza="credito", cuenta_padre_id=ingreso.id, nivel=2, es_auxiliar=False),
        
        # GASTOS
        CuentaContable(codigo="51", nombre="OPERACIONALES DE ADMINISTRACION", tipo="gasto", naturaleza="debito", cuenta_padre_id=gasto.id, nivel=2, es_auxiliar=False),
        CuentaContable(codigo="53", nombre="NO OPERACIONALES", tipo="gasto", naturaleza="debito", cuenta_padre_id=gasto.id, nivel=2, es_auxiliar=False),
    ]
    
    for grupo in grupos:
        db.add(grupo)
    
    db.flush()
    
    # NIVEL 3: CUENTAS (específicas más usadas)
    disponible = db.query(CuentaContable).filter(CuentaContable.codigo == "11").first()
    deudores = db.query(CuentaContable).filter(CuentaContable.codigo == "13").first()
    aportes = db.query(CuentaContable).filter(CuentaContable.codigo == "31").first()
    ingresos_op = db.query(CuentaContable).filter(CuentaContable.codigo == "41").first()
    gastos_op = db.query(CuentaContable).filter(CuentaContable.codigo == "51").first()
    
    cuentas_nivel3 = [
        # DISPONIBLE
        CuentaContable(codigo="1110", nombre="Bancos", tipo="activo", naturaleza="debito", cuenta_padre_id=disponible.id, nivel=3, es_auxiliar=True, descripcion="Cuenta bancaria principal"),
        CuentaContable(codigo="1105", nombre="Caja", tipo="activo", naturaleza="debito", cuenta_padre_id=disponible.id, nivel=3, es_auxiliar=True, descripcion="Efectivo en caja"),
        
        # DEUDORES
        CuentaContable(codigo="1305", nombre="Clientes", tipo="activo", naturaleza="debito", cuenta_padre_id=deudores.id, nivel=3, es_auxiliar=True, descripcion="Cartera de créditos"),
        CuentaContable(codigo="1355", nombre="Anticipo de Impuestos", tipo="activo", naturaleza="debito", cuenta_padre_id=deudores.id, nivel=3, es_auxiliar=True),
        
        # APORTES SOCIALES
        CuentaContable(codigo="3105", nombre="Aportes Sociales", tipo="patrimonio", naturaleza="credito", cuenta_padre_id=aportes.id, nivel=3, es_auxiliar=True, descripcion="Aportes de los asociados"),
        
        # INGRESOS OPERACIONALES
        CuentaContable(codigo="4135", nombre="Ingresos por Intereses", tipo="ingreso", naturaleza="credito", cuenta_padre_id=ingresos_op.id, nivel=3, es_auxiliar=True, descripcion="Intereses de créditos"),
        CuentaContable(codigo="4175", nombre="Otros Ingresos Operacionales", tipo="ingreso", naturaleza="credito", cuenta_padre_id=ingresos_op.id, nivel=3, es_auxiliar=True),
        
        # GASTOS OPERACIONALES
        CuentaContable(codigo="5105", nombre="Gastos de Personal", tipo="gasto", naturaleza="debito", cuenta_padre_id=gastos_op.id, nivel=3, es_auxiliar=True),
        CuentaContable(codigo="5110", nombre="Honorarios", tipo="gasto", naturaleza="debito", cuenta_padre_id=gastos_op.id, nivel=3, es_auxiliar=True),
        CuentaContable(codigo="5115", nombre="Arrendamientos", tipo="gasto", naturaleza="debito", cuenta_padre_id=gastos_op.id, nivel=3, es_auxiliar=True),
        CuentaContable(codigo="5120", nombre="Servicios", tipo="gasto", naturaleza="debito", cuenta_padre_id=gastos_op.id, nivel=3, es_auxiliar=True),
    ]
    
    for cuenta in cuentas_nivel3:
        db.add(cuenta)
    
    db.commit()
    
    total = db.query(CuentaContable).count()
    print(f"✓ Plan de cuentas inicializado. Total de cuentas: {total}")


def main():
    """Ejecutar inicialización."""
    db = SessionLocal()
    try:
        init_plan_cuentas(db)
        print("¡Proceso completado!")
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    main()
