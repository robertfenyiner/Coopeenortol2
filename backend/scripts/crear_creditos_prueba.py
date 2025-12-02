"""
Script para crear créditos de prueba para los asociados existentes.
"""
import random
from datetime import date, timedelta
from decimal import Decimal

from app.models.contabilidad import AsientoContable  # noqa: F401
from app.database import SessionLocal
from app.models.credito import Credito, EstadoCredito, TipoCredito
from app.models.asociado import Asociado
from app.models.usuario import Usuario


def crear_creditos_prueba(db, cantidad=3):
    """Crear créditos de prueba."""
    
    # Obtener asociados activos
    asociados = db.query(Asociado).filter(Asociado.estado == "activo").all()
    
    if not asociados:
        print("❌ No hay asociados activos. Crea asociados primero.")
        return []
    
    # Obtener un usuario admin
    admin = db.query(Usuario).filter(Usuario.rol == "admin").first()
    if not admin:
        print("❌ No hay usuarios admin. Crea un admin primero.")
        return []
    
    tipos_credito = [
        ("consumo", "Compra de electrodomésticos"),
        ("vehiculo", "Compra de motocicleta"),
        ("educacion", "Matrícula universitaria"),
        ("vivienda", "Mejoras en vivienda"),
        ("libre_inversion", "Inversión personal"),
        ("microempresa", "Capital de trabajo negocio familiar")
    ]
    
    montos_base = [1000000, 1500000, 2000000, 3000000, 4000000, 5000000]
    plazos = [6, 12, 18, 24, 36, 48]
    tasas = [Decimal("1.2"), Decimal("1.5"), Decimal("1.8"), Decimal("2.0"), Decimal("2.2")]
    
    creditos_creados = []
    
    print(f"\n{'='*60}")
    print(f"Creando {cantidad} créditos de prueba...")
    print(f"{'='*60}\n")
    
    for i in range(min(cantidad, len(asociados))):
        asociado = random.choice(asociados)
        tipo, destino = random.choice(tipos_credito)
        monto = Decimal(str(random.choice(montos_base)))
        plazo = random.choice(plazos)
        tasa = random.choice(tasas)
        
        # Generar número de crédito
        prefijo = f"CR-{date.today().year}{date.today().month:02d}-"
        ultimo = db.query(Credito).filter(
            Credito.numero_credito.like(f"{prefijo}%")
        ).order_by(Credito.numero_credito.desc()).first()
        
        if ultimo:
            numero = int(ultimo.numero_credito.split("-")[-1]) + 1
        else:
            numero = 1
        
        numero_credito = f"{prefijo}{numero:06d}"
        
        # Calcular cuota
        tasa_mensual = float(tasa) / 100
        if tasa_mensual > 0:
            factor = (1 + tasa_mensual) ** plazo
            cuota = float(monto) * (tasa_mensual * factor) / (factor - 1)
        else:
            cuota = float(monto) / plazo
        
        valor_cuota = Decimal(round(cuota, 2))
        total_a_pagar = valor_cuota * plazo
        total_intereses = total_a_pagar - monto
        
        # Decidir estado aleatorio
        estados_posibles = [
            (EstadoCredito.SOLICITADO, None, None),
            (EstadoCredito.APROBADO, monto, None),
            (EstadoCredito.AL_DIA, monto, monto),
        ]
        
        estado, monto_aprobado, monto_desembolsado = random.choice(estados_posibles)
        
        # Fechas
        fecha_solicitud = date.today() - timedelta(days=random.randint(1, 90))
        fecha_aprobacion = None
        fecha_desembolso = None
        
        if estado in [EstadoCredito.APROBADO, EstadoCredito.AL_DIA]:
            fecha_aprobacion = fecha_solicitud + timedelta(days=random.randint(1, 7))
        
        if estado == EstadoCredito.AL_DIA:
            fecha_desembolso = fecha_aprobacion + timedelta(days=random.randint(1, 5))
        
        credito = Credito(
            numero_credito=numero_credito,
            asociado_id=asociado.id,
            tipo_credito=tipo,
            monto_solicitado=monto,
            monto_aprobado=monto_aprobado,
            monto_desembolsado=monto_desembolsado,
            tasa_interes=tasa,
            plazo_meses=plazo,
            destino=destino,
            garantia=random.choice([None, "Aval solidario", "Pagaré"]),
            fecha_solicitud=fecha_solicitud,
            fecha_aprobacion=fecha_aprobacion,
            fecha_desembolso=fecha_desembolso,
            estado=estado,
            valor_cuota=valor_cuota if monto_aprobado else None,
            total_intereses=total_intereses if monto_aprobado else None,
            total_a_pagar=total_a_pagar if monto_aprobado else None,
            saldo_capital=monto_desembolsado if monto_desembolsado else Decimal("0"),
            saldo_interes=Decimal("0"),
            saldo_mora=Decimal("0"),
            dias_mora=0,
            solicitado_por_id=admin.id,
            aprobado_por_id=admin.id if fecha_aprobacion else None,
            desembolsado_por_id=admin.id if fecha_desembolso else None,
            observaciones=f"Crédito de prueba creado automáticamente - {date.today()}"
        )
        
        db.add(credito)
        db.flush()
        
        creditos_creados.append(credito)
        
        # Mostrar información
        print(f"✓ Crédito {i+1}/{cantidad} - {credito.numero_credito}")
        print(f"  Asociado: {asociado.nombres} {asociado.apellidos}")
        print(f"  Tipo: {tipo}")
        print(f"  Monto: ${monto:,}")
        print(f"  Plazo: {plazo} meses")
        print(f"  Tasa: {tasa}% mensual")
        if valor_cuota:
            print(f"  Cuota: ${valor_cuota:,}")
        print(f"  Estado: {estado}")
        print()
    
    db.commit()
    
    print(f"{'='*60}")
    print(f"✓ {len(creditos_creados)} créditos creados exitosamente")
    print(f"{'='*60}\n")
    
    return creditos_creados


def main():
    """Ejecutar creación de créditos de prueba."""
    db = SessionLocal()
    try:
        # Crear 5 créditos de prueba
        creditos = crear_creditos_prueba(db, cantidad=5)
        
        if creditos:
            print("\n📊 RESUMEN DE CRÉDITOS CREADOS:")
            print(f"{'─'*60}")
            for idx, credito in enumerate(creditos, 1):
                asociado = credito.asociado
                print(f"{idx}. {credito.numero_credito} - {asociado.nombres} {asociado.apellidos}")
                print(f"   Tipo: {credito.tipo_credito} | Monto: ${credito.monto_solicitado:,}")
                print(f"   Estado: {credito.estado} | Plazo: {credito.plazo_meses} meses")
                if credito.valor_cuota:
                    print(f"   Cuota: ${credito.valor_cuota:,}")
                print()
            
            # Estadísticas
            total_cartera = sum(c.saldo_capital for c in creditos)
            print(f"\n💰 ESTADÍSTICAS:")
            print(f"   Total créditos: {len(creditos)}")
            print(f"   Cartera total: ${total_cartera:,}")
            print(f"   Solicitados: {sum(1 for c in creditos if c.estado == EstadoCredito.SOLICITADO)}")
            print(f"   Aprobados: {sum(1 for c in creditos if c.estado == EstadoCredito.APROBADO)}")
            print(f"   Activos: {sum(1 for c in creditos if c.estado == EstadoCredito.AL_DIA)}")
        
        print("\n¡Proceso completado exitosamente!")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
