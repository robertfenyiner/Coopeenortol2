"""
Servicio para el Dashboard con KPIs y estadísticas generales.
"""
from datetime import datetime, timedelta
from decimal import Decimal
from typing import Dict, List

from sqlalchemy import func, and_, extract
from sqlalchemy.orm import Session

from app.models.ahorro import CuentaAhorro, MovimientoAhorro, EstadoCuentaAhorro, TipoMovimientoAhorro
from app.models.asociado import Asociado
from app.models.credito import Credito, EstadoCredito, Cuota, EstadoCuota


class DashboardService:
    """Servicio para obtener KPIs y estadísticas del dashboard."""

    @staticmethod
    def obtener_kpis(db: Session) -> Dict:
        """Obtener KPIs principales del sistema."""
        hoy = datetime.now()
        primer_dia_mes = hoy.replace(day=1)
        primer_dia_mes_anterior = (primer_dia_mes - timedelta(days=1)).replace(day=1)
        
        # Total asociados activos
        total_asociados = db.query(func.count(Asociado.id)).filter(
            Asociado.estado == "activo"
        ).scalar() or 0
        
        # Total asociados mes anterior
        total_asociados_mes_anterior = db.query(func.count(Asociado.id)).filter(
            and_(
                Asociado.estado == "activo",
                Asociado.fecha_ingreso < primer_dia_mes
            )
        ).scalar() or 0
        
        # Nuevos asociados este mes
        nuevos_asociados_mes = db.query(func.count(Asociado.id)).filter(
            and_(
                Asociado.fecha_ingreso >= primer_dia_mes,
                Asociado.fecha_ingreso < hoy
            )
        ).scalar() or 0
        
        # Total ahorros (suma de saldos disponibles)
        total_ahorros = db.query(func.sum(CuentaAhorro.saldo_disponible)).filter(
            CuentaAhorro.estado == EstadoCuentaAhorro.ACTIVA.value
        ).scalar() or Decimal("0")
        
        # Total ahorros mes anterior
        total_ahorros_mes_anterior = db.query(func.sum(CuentaAhorro.saldo_disponible)).filter(
            and_(
                CuentaAhorro.estado == EstadoCuentaAhorro.ACTIVA.value,
                CuentaAhorro.fecha_apertura < primer_dia_mes
            )
        ).scalar() or Decimal("0")
        
        # Total cartera de créditos (suma de saldos)
        total_cartera = db.query(
            func.sum(Credito.saldo_capital + Credito.saldo_interes + Credito.saldo_mora)
        ).filter(
            Credito.estado.in_([EstadoCredito.AL_DIA.value, EstadoCredito.EN_MORA.value])
        ).scalar() or Decimal("0")
        
        # Total cartera mes anterior
        total_cartera_mes_anterior = db.query(
            func.sum(Credito.saldo_capital + Credito.saldo_interes + Credito.saldo_mora)
        ).filter(
            and_(
                Credito.estado.in_([EstadoCredito.AL_DIA.value, EstadoCredito.EN_MORA.value]),
                Credito.fecha_desembolso < primer_dia_mes
            )
        ).scalar() or Decimal("0")
        
        # Créditos en mora
        total_creditos_mora = db.query(func.count(Credito.id)).filter(
            Credito.estado == EstadoCredito.EN_MORA.value
        ).scalar() or 0
        
        total_creditos_vigentes = db.query(func.count(Credito.id)).filter(
            Credito.estado.in_([EstadoCredito.AL_DIA.value, EstadoCredito.EN_MORA.value])
        ).scalar() or 0
        
        # Índice de morosidad (porcentaje de créditos en mora)
        indice_mora = (total_creditos_mora / total_creditos_vigentes * 100) if total_creditos_vigentes > 0 else 0
        
        # Calcular crecimientos
        crecimiento_asociados = 0
        if total_asociados_mes_anterior > 0:
            crecimiento_asociados = ((total_asociados - total_asociados_mes_anterior) / total_asociados_mes_anterior) * 100
        
        crecimiento_ahorros = 0
        if total_ahorros_mes_anterior > 0:
            crecimiento_ahorros = ((total_ahorros - total_ahorros_mes_anterior) / total_ahorros_mes_anterior) * 100
        
        crecimiento_cartera = 0
        if total_cartera_mes_anterior > 0:
            crecimiento_cartera = ((total_cartera - total_cartera_mes_anterior) / total_cartera_mes_anterior) * 100
        
        return {
            "asociados": {
                "total": total_asociados,
                "nuevos_mes": nuevos_asociados_mes,
                "crecimiento_porcentaje": round(float(crecimiento_asociados), 2)
            },
            "ahorros": {
                "total": float(total_ahorros),
                "crecimiento_porcentaje": round(float(crecimiento_ahorros), 2)
            },
            "cartera": {
                "total": float(total_cartera),
                "creditos_vigentes": total_creditos_vigentes,
                "creditos_mora": total_creditos_mora,
                "crecimiento_porcentaje": round(float(crecimiento_cartera), 2)
            },
            "mora": {
                "indice_porcentaje": round(float(indice_mora), 2),
                "total_creditos_mora": total_creditos_mora
            }
        }

    @staticmethod
    def obtener_actividad_reciente(db: Session) -> Dict:
        """Obtener actividad reciente del sistema."""
        # Últimos 10 créditos aprobados
        creditos_recientes = db.query(Credito).filter(
            Credito.estado != EstadoCredito.SOLICITADO.value
        ).order_by(Credito.fecha_desembolso.desc()).limit(10).all()
        
        # Últimas 10 consignaciones
        consignaciones_recientes = db.query(MovimientoAhorro).filter(
            MovimientoAhorro.tipo_movimiento == TipoMovimientoAhorro.CONSIGNACION.value
        ).order_by(MovimientoAhorro.fecha_movimiento.desc()).limit(10).all()
        
        # Últimos 10 retiros
        retiros_recientes = db.query(MovimientoAhorro).filter(
            MovimientoAhorro.tipo_movimiento == TipoMovimientoAhorro.RETIRO.value
        ).order_by(MovimientoAhorro.fecha_movimiento.desc()).limit(10).all()
        
        # Últimos 10 asociados ingresados
        asociados_recientes = db.query(Asociado).order_by(
            Asociado.fecha_ingreso.desc()
        ).limit(10).all()
        
        return {
            "creditos_recientes": [
                {
                    "id": c.id,
                    "numero_credito": c.numero_credito,
                    "asociado_nombre": f"{c.asociado.nombres} {c.asociado.apellidos}",
                    "monto": float(c.monto_aprobado),
                    "estado": c.estado,
                    "fecha": c.fecha_desembolso.isoformat() if c.fecha_desembolso else None
                }
                for c in creditos_recientes
            ],
            "consignaciones_recientes": [
                {
                    "id": m.id,
                    "numero_movimiento": m.numero_movimiento,
                    "cuenta_numero": m.cuenta.numero_cuenta,
                    "asociado_nombre": f"{m.cuenta.asociado.nombres} {m.cuenta.asociado.apellidos}",
                    "valor": float(m.valor),
                    "fecha": m.fecha_movimiento.isoformat()
                }
                for m in consignaciones_recientes
            ],
            "retiros_recientes": [
                {
                    "id": m.id,
                    "numero_movimiento": m.numero_movimiento,
                    "cuenta_numero": m.cuenta.numero_cuenta,
                    "asociado_nombre": f"{m.cuenta.asociado.nombres} {m.cuenta.asociado.apellidos}",
                    "valor": float(m.valor),
                    "fecha": m.fecha_movimiento.isoformat()
                }
                for m in retiros_recientes
            ],
            "asociados_recientes": [
                {
                    "id": a.id,
                    "numero_documento": a.numero_documento,
                    "nombre_completo": f"{a.nombres} {a.apellidos}",
                    "estado": a.estado,
                    "fecha_ingreso": a.fecha_ingreso.isoformat()
                }
                for a in asociados_recientes
            ]
        }

    @staticmethod
    def obtener_estadisticas_mensuales(db: Session) -> Dict:
        """Obtener estadísticas de los últimos 12 meses para gráficos."""
        hoy = datetime.now()
        hace_12_meses = hoy - timedelta(days=365)
        
        # Ahorros mensuales (suma de consignaciones por mes)
        ahorros_mensuales = db.query(
            extract('year', MovimientoAhorro.fecha_movimiento).label('anio'),
            extract('month', MovimientoAhorro.fecha_movimiento).label('mes'),
            func.sum(MovimientoAhorro.valor).label('total')
        ).filter(
            and_(
                MovimientoAhorro.tipo_movimiento == TipoMovimientoAhorro.CONSIGNACION.value,
                MovimientoAhorro.fecha_movimiento >= hace_12_meses
            )
        ).group_by('anio', 'mes').order_by('anio', 'mes').all()
        
        # Créditos desembolsados por mes
        creditos_mensuales = db.query(
            extract('year', Credito.fecha_desembolso).label('anio'),
            extract('month', Credito.fecha_desembolso).label('mes'),
            func.count(Credito.id).label('cantidad'),
            func.sum(Credito.monto_aprobado).label('total')
        ).filter(
            and_(
                Credito.fecha_desembolso.isnot(None),
                Credito.fecha_desembolso >= hace_12_meses
            )
        ).group_by('anio', 'mes').order_by('anio', 'mes').all()
        
        # Nuevos asociados por mes
        asociados_mensuales = db.query(
            extract('year', Asociado.fecha_ingreso).label('anio'),
            extract('month', Asociado.fecha_ingreso).label('mes'),
            func.count(Asociado.id).label('cantidad')
        ).filter(
            Asociado.fecha_ingreso >= hace_12_meses
        ).group_by('anio', 'mes').order_by('anio', 'mes').all()
        
        # Formatear datos para el frontend
        meses = []
        for i in range(12):
            fecha = hoy - timedelta(days=30 * (11 - i))
            meses.append({
                "mes": fecha.strftime("%B"),
                "anio": fecha.year,
                "mes_num": fecha.month
            })
        
        return {
            "ahorros_mensuales": [
                {
                    "anio": int(row.anio),
                    "mes": int(row.mes),
                    "total": float(row.total)
                }
                for row in ahorros_mensuales
            ],
            "creditos_mensuales": [
                {
                    "anio": int(row.anio),
                    "mes": int(row.mes),
                    "cantidad": row.cantidad,
                    "total": float(row.total)
                }
                for row in creditos_mensuales
            ],
            "asociados_mensuales": [
                {
                    "anio": int(row.anio),
                    "mes": int(row.mes),
                    "cantidad": row.cantidad
                }
                for row in asociados_mensuales
            ],
            "meses": meses
        }
