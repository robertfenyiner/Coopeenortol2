"""
Servicio para generación de reportes financieros.
"""
from datetime import date, datetime, timedelta
from decimal import Decimal
from typing import Optional, List
from io import BytesIO
from sqlalchemy.orm import Session
from sqlalchemy import func, and_

from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT

from openpyxl import Workbook
from openpyxl.styles import Font, Alignment, PatternFill, Border, Side
from openpyxl.utils import get_column_letter

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
    """
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=0.5*inch, bottomMargin=0.5*inch)
    elements = []
    styles = getSampleStyleSheet()
    
    # Generar datos del balance
    balance = generar_balance_general(db, fecha_corte)
    
    # Estilos personalizados
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=18,
        textColor=colors.HexColor('#1e40af'),
        spaceAfter=6,
        alignment=TA_CENTER
    )
    
    subtitle_style = ParagraphStyle(
        'CustomSubtitle',
        parent=styles['Normal'],
        fontSize=10,
        textColor=colors.grey,
        spaceAfter=20,
        alignment=TA_CENTER
    )
    
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=colors.HexColor('#1e40af'),
        spaceAfter=12,
        spaceBefore=12
    )
    
    # Título
    elements.append(Paragraph("BALANCE GENERAL", title_style))
    elements.append(Paragraph(f"Al {fecha_corte.strftime('%d de %B de %Y')}", subtitle_style))
    
    # ACTIVOS
    elements.append(Paragraph("ACTIVOS", heading_style))
    activos_data = [['Código', 'Cuenta', 'Saldo']]
    
    for cuenta in balance.activos:
        activos_data.append([
            cuenta.codigo,
            cuenta.nombre,
            f"${cuenta.saldo:,.2f}"
        ])
    
    activos_data.append(['', 'TOTAL ACTIVOS', f"${balance.total_activos:,.2f}"])
    
    activos_table = Table(activos_data, colWidths=[1*inch, 4*inch, 1.5*inch])
    activos_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#3b82f6')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('ALIGN', (2, 0), (2, -1), 'RIGHT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#dbeafe')),
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ]))
    elements.append(activos_table)
    elements.append(Spacer(1, 0.3*inch))
    
    # PASIVOS
    elements.append(Paragraph("PASIVOS", heading_style))
    pasivos_data = [['Código', 'Cuenta', 'Saldo']]
    
    for cuenta in balance.pasivos:
        pasivos_data.append([
            cuenta.codigo,
            cuenta.nombre,
            f"${cuenta.saldo:,.2f}"
        ])
    
    pasivos_data.append(['', 'TOTAL PASIVOS', f"${balance.total_pasivos:,.2f}"])
    
    pasivos_table = Table(pasivos_data, colWidths=[1*inch, 4*inch, 1.5*inch])
    pasivos_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#ef4444')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('ALIGN', (2, 0), (2, -1), 'RIGHT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#fecaca')),
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ]))
    elements.append(pasivos_table)
    elements.append(Spacer(1, 0.3*inch))
    
    # PATRIMONIO
    elements.append(Paragraph("PATRIMONIO", heading_style))
    patrimonio_data = [['Código', 'Cuenta', 'Saldo']]
    
    for cuenta in balance.patrimonio:
        patrimonio_data.append([
            cuenta.codigo,
            cuenta.nombre,
            f"${cuenta.saldo:,.2f}"
        ])
    
    patrimonio_data.append(['', 'TOTAL PATRIMONIO', f"${balance.total_patrimonio:,.2f}"])
    
    patrimonio_table = Table(patrimonio_data, colWidths=[1*inch, 4*inch, 1.5*inch])
    patrimonio_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#10b981')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('ALIGN', (2, 0), (2, -1), 'RIGHT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#a7f3d0')),
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ]))
    elements.append(patrimonio_table)
    elements.append(Spacer(1, 0.3*inch))
    
    # Verificación de cuadre
    cuadre_ok = abs(balance.total_activos - (balance.total_pasivos + balance.total_patrimonio)) < 0.01
    cuadre_text = "✓ Balance Cuadrado" if cuadre_ok else "⚠ Balance Descuadrado"
    cuadre_color = colors.green if cuadre_ok else colors.red
    
    cuadre_style = ParagraphStyle(
        'Cuadre',
        parent=styles['Normal'],
        fontSize=12,
        textColor=cuadre_color,
        alignment=TA_CENTER,
        spaceAfter=12
    )
    elements.append(Paragraph(cuadre_text, cuadre_style))
    
    # Construir PDF
    doc.build(elements)
    buffer.seek(0)
    return buffer


def exportar_cartera_excel(db: Session, fecha_corte: date) -> BytesIO:
    """
    Exportar reporte de cartera a Excel.
    """
    # Generar datos de cartera
    reporte = generar_reporte_cartera(db, fecha_corte)
    
    # Crear workbook
    wb = Workbook()
    ws = wb.active
    ws.title = "Cartera"
    
    # Estilos
    header_fill = PatternFill(start_color="4472C4", end_color="4472C4", fill_type="solid")
    header_font = Font(bold=True, color="FFFFFF", size=12)
    border = Border(
        left=Side(style='thin'),
        right=Side(style='thin'),
        top=Side(style='thin'),
        bottom=Side(style='thin')
    )
    
    # Título
    ws.merge_cells('A1:H1')
    ws['A1'] = f"REPORTE DE CARTERA AL {fecha_corte.strftime('%d/%m/%Y')}"
    ws['A1'].font = Font(bold=True, size=14)
    ws['A1'].alignment = Alignment(horizontal='center')
    
    # Estadísticas
    ws['A3'] = "ESTADÍSTICAS"
    ws['A3'].font = Font(bold=True, size=12)
    ws['A4'] = "Total Cartera:"
    ws['B4'] = reporte.estadisticas.total_cartera
    ws['B4'].number_format = '$#,##0.00'
    ws['A5'] = "Créditos al Día:"
    ws['B5'] = reporte.estadisticas.creditos_al_dia
    ws['C5'] = "Monto:"
    ws['D5'] = reporte.estadisticas.monto_al_dia
    ws['D5'].number_format = '$#,##0.00'
    ws['A6'] = "Créditos en Mora:"
    ws['B6'] = reporte.estadisticas.creditos_mora
    ws['C6'] = "Monto:"
    ws['D6'] = reporte.estadisticas.monto_mora
    ws['D6'].number_format = '$#,##0.00'
    
    # Encabezados de tabla
    row = 9
    headers = ['ID', 'Asociado', 'Tipo', 'Monto Original', 'Saldo Actual', 'Cuota', 'Estado', 'Días Mora']
    for col, header in enumerate(headers, start=1):
        cell = ws.cell(row=row, column=col, value=header)
        cell.fill = header_fill
        cell.font = header_font
        cell.border = border
        cell.alignment = Alignment(horizontal='center')
    
    # Datos
    row += 1
    for credito in reporte.creditos:
        ws.cell(row=row, column=1, value=credito.credito_id).border = border
        ws.cell(row=row, column=2, value=credito.asociado_nombre).border = border
        ws.cell(row=row, column=3, value=credito.tipo_credito).border = border
        
        cell = ws.cell(row=row, column=4, value=float(credito.monto_credito))
        cell.number_format = '$#,##0.00'
        cell.border = border
        
        cell = ws.cell(row=row, column=5, value=float(credito.saldo_actual))
        cell.number_format = '$#,##0.00'
        cell.border = border
        
        cell = ws.cell(row=row, column=6, value=float(credito.cuota_mensual))
        cell.number_format = '$#,##0.00'
        cell.border = border
        
        ws.cell(row=row, column=7, value=credito.estado).border = border
        ws.cell(row=row, column=8, value=credito.dias_mora if credito.dias_mora else 0).border = border
        row += 1
    
    # Ajustar anchos
    ws.column_dimensions['A'].width = 10
    ws.column_dimensions['B'].width = 30
    ws.column_dimensions['C'].width = 20
    ws.column_dimensions['D'].width = 15
    ws.column_dimensions['E'].width = 15
    ws.column_dimensions['F'].width = 15
    ws.column_dimensions['G'].width = 12
    ws.column_dimensions['H'].width = 12
    
    # Guardar en buffer
    buffer = BytesIO()
    wb.save(buffer)
    buffer.seek(0)
    return buffer


def exportar_estado_resultados_pdf(db: Session, fecha_inicio: date, fecha_fin: date) -> BytesIO:
    """
    Exportar Estado de Resultados a PDF.
    """
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=0.5*inch, bottomMargin=0.5*inch)
    elements = []
    styles = getSampleStyleSheet()
    
    # Generar datos del estado
    estado = generar_estado_resultados(db, fecha_inicio, fecha_fin)
    
    # Estilos
    title_style = ParagraphStyle('Title', parent=styles['Heading1'], fontSize=18, 
                                  textColor=colors.HexColor('#1e40af'), spaceAfter=6, alignment=TA_CENTER)
    subtitle_style = ParagraphStyle('Subtitle', parent=styles['Normal'], fontSize=10, 
                                     textColor=colors.grey, spaceAfter=20, alignment=TA_CENTER)
    heading_style = ParagraphStyle('Heading', parent=styles['Heading2'], fontSize=14, 
                                    textColor=colors.HexColor('#1e40af'), spaceAfter=12, spaceBefore=12)
    
    # Título
    elements.append(Paragraph("ESTADO DE RESULTADOS", title_style))
    elements.append(Paragraph(
        f"Del {fecha_inicio.strftime('%d/%m/%Y')} al {fecha_fin.strftime('%d/%m/%Y')}", 
        subtitle_style
    ))
    
    # KPIs
    kpi_data = [
        ['Total Ingresos', f"${estado.total_ingresos:,.2f}"],
        ['Total Gastos', f"${estado.total_gastos:,.2f}"],
        ['Utilidad Operacional', f"${estado.utilidad_operacional:,.2f}"],
        ['Utilidad Neta', f"${estado.utilidad_neta:,.2f}"],
        ['Margen Neto', f"{estado.margen_neto:.2f}%"]
    ]
    kpi_table = Table(kpi_data, colWidths=[3*inch, 2*inch])
    kpi_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#e0e7ff')),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ]))
    elements.append(kpi_table)
    elements.append(Spacer(1, 0.3*inch))
    
    # INGRESOS
    elements.append(Paragraph("INGRESOS", heading_style))
    
    def add_conceptos_table(conceptos, title, color):
        if conceptos:
            data = [['Código', 'Concepto', 'Monto', '% Ingresos']]
            for c in conceptos:
                data.append([c.codigo, c.nombre, f"${c.monto:,.2f}", f"{c.porcentaje_ingresos:.2f}%"])
            
            table = Table(data, colWidths=[1*inch, 3*inch, 1.5*inch, 1*inch])
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), color),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('ALIGN', (2, 0), (-1, -1), 'RIGHT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ]))
            elements.append(Paragraph(title, styles['Normal']))
            elements.append(table)
            elements.append(Spacer(1, 0.1*inch))
    
    add_conceptos_table(estado.ingresos_operacionales, "Ingresos Operacionales", colors.HexColor('#10b981'))
    add_conceptos_table(estado.ingresos_financieros, "Ingresos Financieros", colors.HexColor('#10b981'))
    add_conceptos_table(estado.otros_ingresos, "Otros Ingresos", colors.HexColor('#10b981'))
    
    total_ingresos_data = [['TOTAL INGRESOS', f"${estado.total_ingresos:,.2f}"]]
    total_ingresos_table = Table(total_ingresos_data, colWidths=[4.5*inch, 1.5*inch])
    total_ingresos_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#a7f3d0')),
        ('ALIGN', (0, 0), (0, -1), 'LEFT'),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 12),
    ]))
    elements.append(total_ingresos_table)
    elements.append(Spacer(1, 0.3*inch))
    
    # GASTOS
    elements.append(Paragraph("GASTOS", heading_style))
    add_conceptos_table(estado.gastos_administrativos, "Gastos Administrativos", colors.HexColor('#ef4444'))
    add_conceptos_table(estado.gastos_financieros, "Gastos Financieros", colors.HexColor('#ef4444'))
    add_conceptos_table(estado.otros_gastos, "Otros Gastos", colors.HexColor('#ef4444'))
    
    total_gastos_data = [['TOTAL GASTOS', f"${estado.total_gastos:,.2f}"]]
    total_gastos_table = Table(total_gastos_data, colWidths=[4.5*inch, 1.5*inch])
    total_gastos_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#fecaca')),
        ('ALIGN', (0, 0), (0, -1), 'LEFT'),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 12),
    ]))
    elements.append(total_gastos_table)
    elements.append(Spacer(1, 0.3*inch))
    
    # RESULTADOS
    resultados_data = [
        ['Utilidad Operacional', f"${estado.utilidad_operacional:,.2f}"],
        ['Utilidad Antes de Impuestos', f"${estado.utilidad_antes_impuestos:,.2f}"],
        ['(-) Provisiones', f"${estado.provisiones:,.2f}"],
        ['UTILIDAD NETA', f"${estado.utilidad_neta:,.2f}"]
    ]
    resultados_table = Table(resultados_data, colWidths=[4.5*inch, 1.5*inch])
    resultados_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -2), colors.HexColor('#dbeafe')),
        ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#3b82f6')),
        ('TEXTCOLOR', (0, -1), (-1, -1), colors.whitesmoke),
        ('ALIGN', (0, 0), (0, -1), 'LEFT'),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, -1), (-1, -1), 12),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ]))
    elements.append(resultados_table)
    
    doc.build(elements)
    buffer.seek(0)
    return buffer


def exportar_mora_excel(db: Session, dias_mora_minimo: int = 1) -> BytesIO:
    """
    Exportar Reporte de Mora a Excel.
    """
    # Generar datos de mora
    reporte = generar_reporte_mora(db, dias_mora_minimo)
    
    wb = Workbook()
    ws = wb.active
    ws.title = "Reporte Mora"
    
    # Estilos
    header_fill = PatternFill(start_color="DC2626", end_color="DC2626", fill_type="solid")
    header_font = Font(bold=True, color="FFFFFF", size=12)
    border = Border(
        left=Side(style='thin'),
        right=Side(style='thin'),
        top=Side(style='thin'),
        bottom=Side(style='thin')
    )
    
    # Título
    ws.merge_cells('A1:I1')
    ws['A1'] = f"REPORTE DE MOROSIDAD - {reporte.fecha_reporte.strftime('%d/%m/%Y')}"
    ws['A1'].font = Font(bold=True, size=14)
    ws['A1'].alignment = Alignment(horizontal='center')
    
    # Estadísticas
    ws['A3'] = "Total Créditos en Mora:"
    ws['B3'] = reporte.estadisticas.total_creditos_mora
    ws['A4'] = "Monto Total Mora:"
    ws['B4'] = float(reporte.estadisticas.monto_total_mora)
    ws['B4'].number_format = '$#,##0.00'
    ws['A5'] = "Provisión Total:"
    ws['B5'] = float(reporte.estadisticas.provision_total)
    ws['B5'].number_format = '$#,##0.00'
    
    # Encabezados
    row = 8
    headers = ['ID Crédito', 'Asociado', 'Teléfono', 'Email', 'Saldo Vencido', 
               'Días Mora', 'Rango', 'Cuotas Vencidas', 'Provisión']
    for col, header in enumerate(headers, start=1):
        cell = ws.cell(row=row, column=col, value=header)
        cell.fill = header_fill
        cell.font = header_font
        cell.border = border
        cell.alignment = Alignment(horizontal='center')
    
    # Datos
    row += 1
    for credito in reporte.creditos:
        ws.cell(row=row, column=1, value=credito.credito_id).border = border
        ws.cell(row=row, column=2, value=credito.asociado_nombre).border = border
        ws.cell(row=row, column=3, value=credito.asociado_telefono or '').border = border
        ws.cell(row=row, column=4, value=credito.asociado_email or '').border = border
        
        cell = ws.cell(row=row, column=5, value=float(credito.saldo_vencido))
        cell.number_format = '$#,##0.00'
        cell.border = border
        
        ws.cell(row=row, column=6, value=credito.dias_mora).border = border
        ws.cell(row=row, column=7, value=credito.rango_mora).border = border
        ws.cell(row=row, column=8, value=credito.cuotas_vencidas).border = border
        
        cell = ws.cell(row=row, column=9, value=float(credito.provision_requerida))
        cell.number_format = '$#,##0.00'
        cell.border = border
        
        row += 1
    
    # Ajustar anchos
    for col, width in [(1, 12), (2, 30), (3, 15), (4, 25), (5, 15), (6, 12), (7, 15), (8, 15), (9, 15)]:
        ws.column_dimensions[get_column_letter(col)].width = width
    
    buffer = BytesIO()
    wb.save(buffer)
    buffer.seek(0)
    return buffer


def exportar_estado_cuenta_pdf(db: Session, asociado_id: int, fecha_inicio: Optional[date], 
                                fecha_fin: date) -> BytesIO:
    """
    Exportar Estado de Cuenta del Asociado a PDF.
    """
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=0.5*inch, bottomMargin=0.5*inch)
    elements = []
    styles = getSampleStyleSheet()
    
    # Generar datos del estado de cuenta
    estado = generar_estado_cuenta(db, asociado_id, fecha_inicio, fecha_fin)
    
    # Estilos
    title_style = ParagraphStyle('Title', parent=styles['Heading1'], fontSize=18, 
                                  textColor=colors.HexColor('#1e40af'), spaceAfter=6, alignment=TA_CENTER)
    subtitle_style = ParagraphStyle('Subtitle', parent=styles['Normal'], fontSize=10, 
                                     textColor=colors.grey, spaceAfter=20, alignment=TA_CENTER)
    heading_style = ParagraphStyle('Heading', parent=styles['Heading2'], fontSize=14, 
                                    textColor=colors.HexColor('#1e40af'), spaceAfter=12, spaceBefore=12)
    
    # Título
    elements.append(Paragraph("ESTADO DE CUENTA", title_style))
    elements.append(Paragraph(f"Asociado: {estado.asociado_nombre}", subtitle_style))
    elements.append(Paragraph(f"Al {estado.fecha_reporte.strftime('%d de %B de %Y')}", subtitle_style))
    
    # Información del Asociado
    info_data = [
        ['ID Asociado:', str(estado.asociado_id)],
        ['Fecha Vinculación:', estado.fecha_vinculacion.strftime('%d/%m/%Y')],
        ['Estado:', estado.estado_asociado]
    ]
    info_table = Table(info_data, colWidths=[2*inch, 3*inch])
    info_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#e0e7ff')),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ]))
    elements.append(info_table)
    elements.append(Spacer(1, 0.3*inch))
    
    # KPIs Financieros
    kpi_data = [
        ['Total Aportes', f"${estado.total_aportes:,.2f}"],
        ['Total Deuda', f"${estado.total_deuda:,.2f}"],
        ['Total Ahorros', f"${estado.total_ahorros:,.2f}"],
        ['Patrimonio Neto', f"${estado.patrimonio_neto:,.2f}"]
    ]
    kpi_table = Table(kpi_data, colWidths=[3*inch, 2*inch])
    kpi_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#dbeafe')),
        ('ALIGN', (0, 0), (0, -1), 'LEFT'),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, -1), (-1, -1), 12),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ]))
    elements.append(kpi_table)
    elements.append(Spacer(1, 0.3*inch))
    
    # APORTES
    elements.append(Paragraph("RESUMEN DE APORTES", heading_style))
    aportes_data = [
        ['Aportes Obligatorios', f"${estado.resumen_aportes.aportes_obligatorios:,.2f}"],
        ['Aportes Voluntarios', f"${estado.resumen_aportes.aportes_voluntarios:,.2f}"],
        ['TOTAL APORTES', f"${estado.resumen_aportes.total_aportes:,.2f}"]
    ]
    aportes_table = Table(aportes_data, colWidths=[4*inch, 2*inch])
    aportes_table.setStyle(TableStyle([
        ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#3b82f6')),
        ('TEXTCOLOR', (0, -1), (-1, -1), colors.whitesmoke),
        ('ALIGN', (0, 0), (0, -1), 'LEFT'),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ]))
    elements.append(aportes_table)
    elements.append(Spacer(1, 0.3*inch))
    
    # CRÉDITOS
    if estado.creditos:
        elements.append(Paragraph("CRÉDITOS", heading_style))
        creditos_data = [['ID', 'Tipo', 'Monto Original', 'Saldo', 'Cuota', 'Estado']]
        for credito in estado.creditos:
            creditos_data.append([
                str(credito.credito_id),
                credito.tipo_credito,
                f"${credito.monto_original:,.2f}",
                f"${credito.saldo_actual:,.2f}",
                f"${credito.cuota_mensual:,.2f}",
                credito.estado
            ])
        
        creditos_table = Table(creditos_data, colWidths=[0.5*inch, 1.5*inch, 1.3*inch, 1.3*inch, 1.2*inch, 0.9*inch])
        creditos_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#ef4444')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('ALIGN', (2, 1), (-2, -1), 'RIGHT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ]))
        elements.append(creditos_table)
        elements.append(Spacer(1, 0.3*inch))
    
    # CUENTAS DE AHORRO
    if estado.cuentas_ahorro:
        elements.append(Paragraph("CUENTAS DE AHORRO", heading_style))
        ahorros_data = [['ID', 'Tipo', 'Saldo', 'Tasa', 'Estado']]
        for cuenta in estado.cuentas_ahorro:
            ahorros_data.append([
                str(cuenta.cuenta_id),
                cuenta.tipo_ahorro,
                f"${cuenta.saldo_actual:,.2f}",
                f"{cuenta.tasa_interes}%",
                cuenta.estado
            ])
        
        ahorros_table = Table(ahorros_data, colWidths=[0.7*inch, 2*inch, 1.5*inch, 1*inch, 1*inch])
        ahorros_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#10b981')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('ALIGN', (2, 1), (3, -1), 'RIGHT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ]))
        elements.append(ahorros_table)
    
    doc.build(elements)
    buffer.seek(0)
    return buffer
