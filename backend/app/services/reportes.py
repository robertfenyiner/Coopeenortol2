"""
Servicio para generación de reportes financieros.
"""
from datetime import date, datetime, timedelta
from decimal import Decimal
from typing import Optional, List
from io import BytesIO
from sqlalchemy.orm import Session
from sqlalchemy import func, and_

from app.models.asociado import Asociado
from app.models.contabilidad import CuentaContable, MovimientoContable, Aporte
from app.models.credito import Credito
from app.models.ahorro import CuentaAhorro, MovimientoAhorro
from app.schemas.reportes import (
    BalanceGeneralResponse,
    GrupoBalance,
    CuentaBalance,
    EstadoResultadosResponse,
    CuentaResultados,
    ReporteCarteraResponse,
    CreditoCartera,
    EstadisticasCartera,
    ReporteMoraResponse,
    CreditoMora,
    EstadoCuentaAsociadoResponse,
    AportesAsociado,
    CreditoAsociado,
    CuentaAhorroAsociado,
    EstadisticasGeneralesResponse,
    EstadisticasAsociados,
    EstadisticasCarteraGeneral,
    EstadisticasAhorros
)


def generar_balance_general(db: Session, fecha_corte: date) -> BalanceGeneralResponse:
    """
    Generar Balance General a una fecha específica.
    """
    # Obtener todas las cuentas con movimientos hasta la fecha de corte
    cuentas = db.query(CuentaContable).filter(
        CuentaContable.activa == True
    ).all()
    
    activos = []
    pasivos = []
    patrimonio = []
    
    total_activos = Decimal("0.00")
    total_pasivos = Decimal("0.00")
    total_patrimonio = Decimal("0.00")
    
    for cuenta in cuentas:
        # Calcular saldo de la cuenta hasta la fecha de corte
        movimientos = db.query(MovimientoContable).join(
            MovimientoContable.asiento
        ).filter(
            MovimientoContable.cuenta_id == cuenta.id,
            MovimientoContable.asiento.has(fecha__lte=fecha_corte)
        ).all()
        
        total_debito = sum(m.debito for m in movimientos)
        total_credito = sum(m.credito for m in movimientos)
        
        if cuenta.naturaleza == "debito":
            saldo = total_debito - total_credito
        else:
            saldo = total_credito - total_debito
        
        if saldo == 0:
            continue
        
        cuenta_balance = CuentaBalance(
            codigo=cuenta.codigo,
            nombre=cuenta.nombre,
            saldo=saldo
        )
        
        # Clasificar por tipo
        if cuenta.tipo == "activo":
            activos.append(cuenta_balance)
            total_activos += saldo
        elif cuenta.tipo == "pasivo":
            pasivos.append(cuenta_balance)
            total_pasivos += saldo
        elif cuenta.tipo == "patrimonio":
            patrimonio.append(cuenta_balance)
            total_patrimonio += saldo
    
    # Agrupar cuentas
    grupo_activos = [GrupoBalance(
        nombre="Activos",
        total=total_activos,
        cuentas=activos
    )]
    
    grupo_pasivos = [GrupoBalance(
        nombre="Pasivos",
        total=total_pasivos,
        cuentas=pasivos
    )]
    
    grupo_patrimonio = [GrupoBalance(
        nombre="Patrimonio",
        total=total_patrimonio,
        cuentas=patrimonio
    )]
    
    cuadrado = abs(total_activos - (total_pasivos + total_patrimonio)) < Decimal("0.01")
    
    return BalanceGeneralResponse(
        fecha_corte=fecha_corte,
        activos=grupo_activos,
        pasivos=grupo_pasivos,
        patrimonio=grupo_patrimonio,
        total_activos=total_activos,
        total_pasivos=total_pasivos,
        total_patrimonio=total_patrimonio,
        cuadrado=cuadrado
    )


def generar_estado_resultados(
    db: Session,
    fecha_inicio: date,
    fecha_fin: date
) -> EstadoResultadosResponse:
    """
    Generar Estado de Resultados para un período.
    """
    # Obtener cuentas de ingresos y gastos
    cuentas_ingresos = db.query(CuentaContable).filter(
        CuentaContable.tipo == "ingreso",
        CuentaContable.activa == True
    ).all()
    
    cuentas_gastos = db.query(CuentaContable).filter(
        CuentaContable.tipo == "gasto",
        CuentaContable.activa == True
    ).all()
    
    ingresos = []
    gastos = []
    total_ingresos = Decimal("0.00")
    total_gastos = Decimal("0.00")
    
    # Calcular ingresos
    for cuenta in cuentas_ingresos:
        movimientos = db.query(MovimientoContable).join(
            MovimientoContable.asiento
        ).filter(
            MovimientoContable.cuenta_id == cuenta.id,
            MovimientoContable.asiento.has(
                and_(
                    MovimientoContable.asiento.has(fecha__gte=fecha_inicio),
                    MovimientoContable.asiento.has(fecha__lte=fecha_fin)
                )
            )
        ).all()
        
        total_credito = sum(m.credito for m in movimientos)
        total_debito = sum(m.debito for m in movimientos)
        valor = total_credito - total_debito
        
        if valor > 0:
            ingresos.append(CuentaResultados(
                codigo=cuenta.codigo,
                nombre=cuenta.nombre,
                valor=valor
            ))
            total_ingresos += valor
    
    # Calcular gastos
    for cuenta in cuentas_gastos:
        movimientos = db.query(MovimientoContable).join(
            MovimientoContable.asiento
        ).filter(
            MovimientoContable.cuenta_id == cuenta.id,
            MovimientoContable.asiento.has(
                and_(
                    MovimientoContable.asiento.has(fecha__gte=fecha_inicio),
                    MovimientoContable.asiento.has(fecha__lte=fecha_fin)
                )
            )
        ).all()
        
        total_debito = sum(m.debito for m in movimientos)
        total_credito = sum(m.credito for m in movimientos)
        valor = total_debito - total_credito
        
        if valor > 0:
            gastos.append(CuentaResultados(
                codigo=cuenta.codigo,
                nombre=cuenta.nombre,
                valor=valor
            ))
            total_gastos += valor
    
    utilidad_neta = total_ingresos - total_gastos
    margen_utilidad = (utilidad_neta / total_ingresos * 100) if total_ingresos > 0 else Decimal("0.00")
    
    return EstadoResultadosResponse(
        fecha_inicio=fecha_inicio,
        fecha_fin=fecha_fin,
        ingresos=ingresos,
        gastos=gastos,
        total_ingresos=total_ingresos,
        total_gastos=total_gastos,
        utilidad_neta=utilidad_neta,
        margen_utilidad=margen_utilidad
    )


def generar_reporte_cartera(
    db: Session,
    fecha_corte: date,
    tipo_credito: Optional[str] = None,
    estado: Optional[str] = None
) -> ReporteCarteraResponse:
    """
    Generar reporte de cartera de créditos.
    """
    query = db.query(Credito).join(Asociado).filter(
        Credito.estado.in_(["desembolsado", "al_dia", "mora", "castigado"])
    )
    
    if tipo_credito:
        query = query.filter(Credito.tipo_credito == tipo_credito)
    
    if estado:
        query = query.filter(Credito.estado == estado)
    
    creditos_db = query.all()
    
    # Estadísticas
    total_creditos = len(creditos_db)
    cartera_total = sum(c.saldo_capital or Decimal("0.00") for c in creditos_db)
    cartera_al_dia = sum(
        c.saldo_capital or Decimal("0.00")
        for c in creditos_db
        if c.estado == "al_dia"
    )
    cartera_mora = sum(
        c.saldo_capital or Decimal("0.00")
        for c in creditos_db
        if c.estado == "mora"
    )
    cartera_castigada = sum(
        c.saldo_capital or Decimal("0.00")
        for c in creditos_db
        if c.estado == "castigado"
    )
    creditos_mora = len([c for c in creditos_db if c.estado == "mora"])
    tasa_mora = (cartera_mora / cartera_total * 100) if cartera_total > 0 else Decimal("0.00")
    monto_provision = cartera_mora * Decimal("0.05")  # 5% de provisión
    
    estadisticas = EstadisticasCartera(
        total_creditos=total_creditos,
        cartera_total=cartera_total,
        cartera_al_dia=cartera_al_dia,
        cartera_mora=cartera_mora,
        cartera_castigada=cartera_castigada,
        tasa_mora=tasa_mora,
        creditos_mora=creditos_mora,
        monto_provision=monto_provision
    )
    
    # Detalle de créditos
    creditos = []
    for c in creditos_db:
        creditos.append(CreditoCartera(
            numero_credito=c.numero_credito,
            asociado_nombre=f"{c.asociado.nombres} {c.asociado.apellidos}",
            asociado_documento=c.asociado.numero_documento,
            tipo_credito=c.tipo_credito,
            monto_desembolsado=c.monto_desembolsado or Decimal("0.00"),
            saldo_capital=c.saldo_capital or Decimal("0.00"),
            saldo_interes=c.saldo_interes or Decimal("0.00"),
            saldo_mora=c.saldo_mora or Decimal("0.00"),
            dias_mora=c.dias_mora or 0,
            estado=c.estado,
            fecha_desembolso=c.fecha_desembolso,
            fecha_ultimo_pago=c.fecha_ultimo_pago
        ))
    
    # Agrupar por tipo
    por_tipo = {}
    for c in creditos_db:
        if c.tipo_credito not in por_tipo:
            por_tipo[c.tipo_credito] = {
                "total": Decimal("0.00"),
                "creditos": 0
            }
        por_tipo[c.tipo_credito]["total"] += c.saldo_capital or Decimal("0.00")
        por_tipo[c.tipo_credito]["creditos"] += 1
    
    return ReporteCarteraResponse(
        fecha_corte=fecha_corte,
        estadisticas=estadisticas,
        creditos=creditos,
        por_tipo=por_tipo
    )


def generar_reporte_mora(db: Session, dias_mora_minimo: int) -> ReporteMoraResponse:
    """
    Generar reporte de créditos en mora.
    """
    creditos_db = db.query(Credito).join(Asociado).filter(
        Credito.estado == "mora",
        Credito.dias_mora >= dias_mora_minimo
    ).all()
    
    creditos = []
    monto_total_mora = Decimal("0.00")
    por_rango = {
        "1-30": {"creditos": 0, "monto": Decimal("0.00")},
        "31-60": {"creditos": 0, "monto": Decimal("0.00")},
        "61-90": {"creditos": 0, "monto": Decimal("0.00")},
        "90+": {"creditos": 0, "monto": Decimal("0.00")}
    }
    
    for c in creditos_db:
        dias = c.dias_mora or 0
        
        # Determinar rango
        if dias <= 30:
            rango = "1-30"
        elif dias <= 60:
            rango = "31-60"
        elif dias <= 90:
            rango = "61-90"
        else:
            rango = "90+"
        
        saldo_mora = c.saldo_mora or Decimal("0.00")
        monto_total_mora += saldo_mora
        por_rango[rango]["creditos"] += 1
        por_rango[rango]["monto"] += saldo_mora
        
        creditos.append(CreditoMora(
            numero_credito=c.numero_credito,
            asociado_id=c.asociado_id,
            asociado_nombre=f"{c.asociado.nombres} {c.asociado.apellidos}",
            asociado_documento=c.asociado.numero_documento,
            asociado_telefono=c.asociado.datos_personales.get("telefono"),
            tipo_credito=c.tipo_credito,
            saldo_capital=c.saldo_capital or Decimal("0.00"),
            saldo_mora=saldo_mora,
            dias_mora=dias,
            rango_mora=rango,
            fecha_ultimo_pago=c.fecha_ultimo_pago
        ))
    
    return ReporteMoraResponse(
        fecha_generacion=date.today(),
        dias_mora_minimo=dias_mora_minimo,
        total_creditos_mora=len(creditos),
        monto_total_mora=monto_total_mora,
        creditos=creditos,
        por_rango=por_rango
    )


def generar_estado_cuenta(
    db: Session,
    asociado_id: int,
    fecha_inicio: Optional[date],
    fecha_fin: date
) -> EstadoCuentaAsociadoResponse:
    """
    Generar estado de cuenta de un asociado.
    """
    if fecha_inicio is None:
        fecha_inicio = fecha_fin - timedelta(days=180)  # 6 meses atrás
    
    asociado = db.query(Asociado).filter(Asociado.id == asociado_id).first()
    if not asociado:
        raise ValueError("Asociado no encontrado")
    
    # Aportes
    aportes_db = db.query(Aporte).filter(
        Aporte.asociado_id == asociado_id,
        Aporte.fecha.between(fecha_inicio, fecha_fin)
    ).all()
    
    total_aportes = sum(a.valor for a in aportes_db)
    ultimo_aporte = max(aportes_db, key=lambda x: x.fecha) if aportes_db else None
    
    aportes = AportesAsociado(
        total_aportes=total_aportes,
        numero_aportes=len(aportes_db),
        ultimo_aporte_fecha=ultimo_aporte.fecha if ultimo_aporte else None,
        ultimo_aporte_valor=ultimo_aporte.valor if ultimo_aporte else None
    )
    
    # Créditos
    creditos_db = db.query(Credito).filter(
        Credito.asociado_id == asociado_id,
        Credito.estado.in_(["desembolsado", "al_dia", "mora"])
    ).all()
    
    creditos = []
    total_deuda = Decimal("0.00")
    for c in creditos_db:
        creditos.append(CreditoAsociado(
            numero_credito=c.numero_credito,
            tipo_credito=c.tipo_credito,
            monto_desembolsado=c.monto_desembolsado or Decimal("0.00"),
            saldo_capital=c.saldo_capital or Decimal("0.00"),
            valor_cuota=c.valor_cuota or Decimal("0.00"),
            estado=c.estado,
            dias_mora=c.dias_mora or 0
        ))
        total_deuda += c.saldo_capital or Decimal("0.00")
    
    # Cuentas de ahorro
    cuentas_db = db.query(CuentaAhorro).filter(
        CuentaAhorro.asociado_id == asociado_id,
        CuentaAhorro.estado == "activa"
    ).all()
    
    cuentas_ahorro = []
    total_ahorros = Decimal("0.00")
    for cuenta in cuentas_db:
        cuentas_ahorro.append(CuentaAhorroAsociado(
            numero_cuenta=cuenta.numero_cuenta,
            tipo_ahorro=cuenta.tipo_ahorro,
            saldo_actual=cuenta.saldo_actual,
            estado=cuenta.estado
        ))
        total_ahorros += cuenta.saldo_actual
    
    patrimonio_neto = total_aportes + total_ahorros - total_deuda
    
    return EstadoCuentaAsociadoResponse(
        asociado_id=asociado.id,
        nombres=asociado.nombres,
        apellidos=asociado.apellidos,
        numero_documento=asociado.numero_documento,
        fecha_generacion=date.today(),
        fecha_inicio=fecha_inicio,
        fecha_fin=fecha_fin,
        aportes=aportes,
        creditos=creditos,
        cuentas_ahorro=cuentas_ahorro,
        total_aportes=total_aportes,
        total_deuda=total_deuda,
        total_ahorros=total_ahorros,
        patrimonio_neto=patrimonio_neto
    )


def obtener_estadisticas_generales(db: Session) -> EstadisticasGeneralesResponse:
    """
    Obtener estadísticas generales del sistema.
    """
    # Asociados
    total_asociados = db.query(Asociado).count()
    asociados_activos = db.query(Asociado).filter(Asociado.estado == "activo").count()
    asociados_inactivos = total_asociados - asociados_activos
    
    # Nuevos asociados este mes
    primer_dia_mes = date.today().replace(day=1)
    nuevos_mes = db.query(Asociado).filter(
        Asociado.created_at >= primer_dia_mes
    ).count()
    
    estadisticas_asociados = EstadisticasAsociados(
        total=total_asociados,
        activos=asociados_activos,
        inactivos=asociados_inactivos,
        nuevos_mes=nuevos_mes
    )
    
    # Cartera
    creditos_activos = db.query(Credito).filter(
        Credito.estado.in_(["desembolsado", "al_dia", "mora"])
    ).all()
    
    total_cartera = sum(c.saldo_capital or Decimal("0.00") for c in creditos_activos)
    cartera_al_dia = sum(
        c.saldo_capital or Decimal("0.00")
        for c in creditos_activos
        if c.estado in ["desembolsado", "al_dia"]
    )
    cartera_mora = sum(
        c.saldo_capital or Decimal("0.00")
        for c in creditos_activos
        if c.estado == "mora"
    )
    tasa_mora = (cartera_mora / total_cartera * 100) if total_cartera > 0 else Decimal("0.00")
    
    estadisticas_cartera = EstadisticasCarteraGeneral(
        total_cartera=total_cartera,
        cartera_al_dia=cartera_al_dia,
        cartera_mora=cartera_mora,
        tasa_mora=tasa_mora,
        creditos_activos=len(creditos_activos)
    )
    
    # Ahorros
    cuentas_activas = db.query(CuentaAhorro).filter(
        CuentaAhorro.estado == "activa"
    ).all()
    
    total_ahorros = sum(c.saldo_actual for c in cuentas_activas)
    ahorro_promedio = total_ahorros / len(cuentas_activas) if cuentas_activas else Decimal("0.00")
    
    estadisticas_ahorros = EstadisticasAhorros(
        total_ahorros=total_ahorros,
        cuentas_activas=len(cuentas_activas),
        ahorro_promedio=ahorro_promedio
    )
    
    # Aportes totales
    aportes_totales = db.query(func.sum(Aporte.valor)).scalar() or Decimal("0.00")
    
    # Operaciones del mes (simplificado)
    operaciones_mes = (
        db.query(Aporte).filter(Aporte.fecha >= primer_dia_mes).count() +
        db.query(Credito).filter(Credito.fecha_desembolso >= primer_dia_mes).count()
    )
    
    return EstadisticasGeneralesResponse(
        fecha_generacion=date.today(),
        asociados=estadisticas_asociados,
        cartera=estadisticas_cartera,
        ahorros=estadisticas_ahorros,
        aportes_totales=aportes_totales,
        operaciones_mes=operaciones_mes
    )


def exportar_balance_pdf(db: Session, fecha_corte: date) -> BytesIO:
    """
    Exportar balance general a PDF.
    TODO: Implementar generación de PDF
    """
    # Aquí iría la lógica de generación de PDF
    # Por ahora retornamos un placeholder
    buffer = BytesIO()
    buffer.write(b"Balance General PDF - TODO: Implementar con reportlab")
    buffer.seek(0)
    return buffer


def exportar_cartera_excel(db: Session, fecha_corte: date) -> BytesIO:
    """
    Exportar reporte de cartera a Excel.
    TODO: Implementar generación de Excel
    """
    # Aquí iría la lógica de generación de Excel
    # Por ahora retornamos un placeholder
    buffer = BytesIO()
    buffer.write(b"Cartera Excel - TODO: Implementar con openpyxl")
    buffer.seek(0)
    return buffer
