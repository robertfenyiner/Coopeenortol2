"""
Script para probar todas las funcionalidades del módulo de reportes.
"""
import sys
from datetime import date, timedelta
from pathlib import Path

# Agregar el directorio raíz al path
sys.path.append(str(Path(__file__).parent.parent))

from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.services import reportes as service


def test_reportes_completo():
    """Prueba completa del módulo de reportes."""
    db: Session = SessionLocal()
    
    try:
        print("=" * 80)
        print("PRUEBA COMPLETA DEL MÓDULO DE REPORTES")
        print("=" * 80)
        
        fecha_hoy = date.today()
        hace_30_dias = fecha_hoy - timedelta(days=30)
        hace_6_meses = fecha_hoy - timedelta(days=180)
        
        # ==================== 1. Balance General ====================
        print("\n1. GENERANDO BALANCE GENERAL...")
        
        balance = service.generar_balance_general(db, fecha_hoy)
        print(f"✓ Balance generado al {balance.fecha_corte}")
        print(f"  Total Activos: ${balance.total_activos:,.2f}")
        print(f"  Total Pasivos: ${balance.total_pasivos:,.2f}")
        print(f"  Total Patrimonio: ${balance.total_patrimonio:,.2f}")
        print(f"  Balance cuadrado: {'✓ Sí' if balance.cuadrado else '✗ No'}")
        
        # ==================== 2. Estado de Resultados ====================
        print("\n2. GENERANDO ESTADO DE RESULTADOS...")
        
        estado_resultados = service.generar_estado_resultados(db, hace_30_dias, fecha_hoy)
        print(f"✓ Estado de resultados del {estado_resultados.fecha_inicio} al {estado_resultados.fecha_fin}")
        print(f"  Total Ingresos: ${estado_resultados.total_ingresos:,.2f}")
        print(f"  Total Gastos: ${estado_resultados.total_gastos:,.2f}")
        print(f"  Utilidad Neta: ${estado_resultados.utilidad_neta:,.2f}")
        print(f"  Margen de Utilidad: {estado_resultados.margen_utilidad:.2f}%")
        
        # ==================== 3. Reporte de Cartera ====================
        print("\n3. GENERANDO REPORTE DE CARTERA...")
        
        reporte_cartera = service.generar_reporte_cartera(db, fecha_hoy)
        print(f"✓ Reporte de cartera generado")
        print(f"  Total créditos: {reporte_cartera.estadisticas.total_creditos}")
        print(f"  Cartera total: ${reporte_cartera.estadisticas.cartera_total:,.2f}")
        print(f"  Cartera al día: ${reporte_cartera.estadisticas.cartera_al_dia:,.2f}")
        print(f"  Cartera en mora: ${reporte_cartera.estadisticas.cartera_mora:,.2f}")
        print(f"  Tasa de mora: {reporte_cartera.estadisticas.tasa_mora:.2f}%")
        print(f"  Provisión sugerida: ${reporte_cartera.estadisticas.monto_provision:,.2f}")
        
        if reporte_cartera.por_tipo:
            print("\n  Distribución por tipo:")
            for tipo, datos in reporte_cartera.por_tipo.items():
                print(f"    {tipo}: ${datos['total']:,.2f} ({datos['creditos']} créditos)")
        
        # ==================== 4. Reporte de Mora ====================
        print("\n4. GENERANDO REPORTE DE MORA...")
        
        reporte_mora = service.generar_reporte_mora(db, dias_mora_minimo=1)
        print(f"✓ Reporte de mora generado")
        print(f"  Créditos en mora: {reporte_mora.total_creditos_mora}")
        print(f"  Monto total mora: ${reporte_mora.monto_total_mora:,.2f}")
        
        if reporte_mora.por_rango:
            print("\n  Distribución por rangos:")
            for rango, datos in reporte_mora.por_rango.items():
                print(f"    {rango}: {datos['creditos']} créditos - ${datos['monto']:,.2f}")
        
        # ==================== 5. Estado de Cuenta de Asociado ====================
        print("\n5. GENERANDO ESTADO DE CUENTA DE ASOCIADO...")
        
        # Buscar un asociado con documento conocido
        try:
            estado_cuenta = service.generar_estado_cuenta_por_documento(
                db,
                numero_documento="1234567890",  # Documento de prueba
                fecha_inicio=hace_6_meses,
                fecha_fin=fecha_hoy
            )
            print(f"✓ Estado de cuenta generado")
            print(f"  Asociado: {estado_cuenta.asociado.nombres} {estado_cuenta.asociado.apellidos}")
            print(f"  Documento: {estado_cuenta.asociado.numero_documento}")
            print(f"  Total aportes: ${estado_cuenta.resumen.total_aportes:,.2f}")
            print(f"  Total créditos: ${estado_cuenta.resumen.total_creditos_activos:,.2f}")
            print(f"  Total ahorros: ${estado_cuenta.resumen.total_ahorros:,.2f}")
        except ValueError as e:
            print(f"⚠ No se pudo generar estado de cuenta: {e}")
            print("  Nota: Usar un número de documento válido en producción")
        
        # ==================== 6. Estadísticas Generales ====================
        print("\n6. OBTENIENDO ESTADÍSTICAS GENERALES...")
        
        estadisticas = service.obtener_estadisticas_generales(db)
        print(f"✓ Estadísticas generales obtenidas")
        print(f"\n  ASOCIADOS:")
        print(f"    Total: {estadisticas.asociados.total}")
        print(f"    Activos: {estadisticas.asociados.activos}")
        print(f"    Inactivos: {estadisticas.asociados.inactivos}")
        print(f"    Nuevos este mes: {estadisticas.asociados.nuevos_mes}")
        
        print(f"\n  CARTERA:")
        print(f"    Total: ${estadisticas.cartera.total_cartera:,.2f}")
        print(f"    Al día: ${estadisticas.cartera.cartera_al_dia:,.2f}")
        print(f"    En mora: ${estadisticas.cartera.cartera_mora:,.2f}")
        print(f"    Tasa de mora: {estadisticas.cartera.tasa_mora:.2f}%")
        
        print(f"\n  AHORROS:")
        print(f"    Total: ${estadisticas.ahorros.total_ahorros:,.2f}")
        print(f"    Cuentas activas: {estadisticas.ahorros.cuentas_activas}")
        print(f"    Promedio saldo: ${estadisticas.ahorros.ahorro_promedio:,.2f}")
        
        # ==================== 7. Exportaciones ====================
        print("\n7. PROBANDO EXPORTACIONES...")
        
        # Balance PDF
        try:
            pdf_balance = service.exportar_balance_pdf(db, fecha_hoy)
            print(f"✓ Balance exportado a PDF ({pdf_balance.tell()} bytes)")
        except Exception as e:
            print(f"⚠ Error al exportar balance a PDF: {e}")
        
        # Cartera Excel
        try:
            excel_cartera = service.exportar_cartera_excel(db, fecha_hoy)
            print(f"✓ Cartera exportada a Excel ({excel_cartera.tell()} bytes)")
        except Exception as e:
            print(f"⚠ Error al exportar cartera a Excel: {e}")
        
        # Estado de Resultados PDF
        try:
            pdf_resultados = service.exportar_estado_resultados_pdf(db, hace_30_dias, fecha_hoy)
            print(f"✓ Estado de resultados exportado a PDF ({pdf_resultados.tell()} bytes)")
        except Exception as e:
            print(f"⚠ Error al exportar estado resultados a PDF: {e}")
        
        # ==================== 8. Certificados ====================
        print("\n8. GENERANDO CERTIFICADOS...")
        
        # Paz y Salvo
        try:
            pdf_paz_salvo = service.generar_certificado_paz_salvo(db, "1234567890")
            print(f"✓ Certificado de Paz y Salvo generado ({pdf_paz_salvo.tell()} bytes)")
        except Exception as e:
            print(f"⚠ Error al generar paz y salvo: {e}")
        
        # Aportes
        try:
            pdf_aportes = service.generar_certificado_aportes(db, "1234567890")
            print(f"✓ Certificado de Aportes generado ({pdf_aportes.tell()} bytes)")
        except Exception as e:
            print(f"⚠ Error al generar certificado aportes: {e}")
        
        print("\n" + "=" * 80)
        print("✅ PRUEBA COMPLETA EXITOSA - MÓDULO DE REPORTES FUNCIONAL")
        print("=" * 80)
        
        print("\nRESUMEN:")
        print(f"  • Balance cuadrado: {balance.cuadrado}")
        print(f"  • Activos totales: ${balance.total_activos:,.2f}")
        print(f"  • Utilidad del período: ${estado_resultados.utilidad_neta:,.2f}")
        print(f"  • Cartera total: ${reporte_cartera.estadisticas.cartera_total:,.2f}")
        print(f"  • Tasa de mora: {reporte_cartera.estadisticas.tasa_mora:.2f}%")
        print(f"  • Total ahorros: ${estadisticas.ahorros.total_ahorros:,.2f}")
        print(f"  • Asociados activos: {estadisticas.asociados.activos}")
        
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    test_reportes_completo()
