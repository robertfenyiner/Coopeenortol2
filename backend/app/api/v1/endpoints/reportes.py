"""
Endpoints para reportes financieros y administrativos.
"""
from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core import deps
from app.core.deps import require_permission
from app.database import get_db
from app.models.usuario import Usuario
from app.services import reportes as service
from app.schemas.reportes import (
    BalanceGeneralResponse,
    EstadoResultadosResponse,
    ReporteCarteraResponse,
    EstadoCuentaAsociadoResponse,
    ReporteMoraResponse,
    EstadisticasGeneralesResponse
)

router = APIRouter()


@router.get("/balance-general", response_model=BalanceGeneralResponse)
def generar_balance_general(
    fecha_corte: date = Query(..., description="Fecha de corte del balance"),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_permission("reportes:leer")),
):
    """
    Generar Balance General a una fecha específica.
    
    Muestra:
    - Activos (Bancos, Cartera, Aportes)
    - Pasivos (Ahorros, Obligaciones)
    - Patrimonio (Capital, Reservas, Resultados)
    """
    return service.generar_balance_general(db, fecha_corte)


@router.get("/estado-resultados", response_model=EstadoResultadosResponse)
def generar_estado_resultados(
    fecha_inicio: date = Query(..., description="Fecha inicial del período"),
    fecha_fin: date = Query(..., description="Fecha final del período"),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_permission("reportes:leer")),
):
    """
    Generar Estado de Resultados para un período.
    
    Muestra:
    - Ingresos operacionales
    - Gastos operacionales
    - Utilidad/Pérdida del período
    """
    if fecha_inicio > fecha_fin:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La fecha inicial no puede ser mayor a la fecha final"
        )
    
    return service.generar_estado_resultados(db, fecha_inicio, fecha_fin)


@router.get("/cartera", response_model=ReporteCarteraResponse)
def generar_reporte_cartera(
    fecha_corte: Optional[date] = Query(None, description="Fecha de corte (default: hoy)"),
    tipo_credito: Optional[str] = Query(None, description="Filtrar por tipo de crédito"),
    estado: Optional[str] = Query(None, description="Filtrar por estado (al_día, mora, castigado)"),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_permission("reportes:leer")),
):
    """
    Generar Reporte de Cartera de Créditos.
    
    Muestra:
    - Total cartera por estado
    - Créditos en mora
    - Indicadores de calidad (tasa de mora, provisiones)
    - Detalle por tipo de crédito
    """
    return service.generar_reporte_cartera(
        db,
        fecha_corte=fecha_corte or date.today(),
        tipo_credito=tipo_credito,
        estado=estado
    )


@router.get("/mora", response_model=ReporteMoraResponse)
def generar_reporte_mora(
    dias_mora_minimo: int = Query(default=1, ge=1, description="Días mínimos de mora"),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_permission("reportes:leer")),
):
    """
    Generar Reporte de Créditos en Mora.
    
    Muestra:
    - Créditos con días de mora >= al mínimo especificado
    - Valor total en mora
    - Detalle por asociado
    - Rangos de mora (1-30, 31-60, 61-90, 90+)
    """
    return service.generar_reporte_mora(db, dias_mora_minimo)


@router.get("/estado-cuenta/{asociado_id}", response_model=EstadoCuentaAsociadoResponse)
def generar_estado_cuenta(
    asociado_id: int,
    fecha_inicio: Optional[date] = Query(None, description="Fecha inicial (default: hace 6 meses)"),
    fecha_fin: Optional[date] = Query(None, description="Fecha final (default: hoy)"),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_permission("reportes:leer")),
):
    """
    Generar Estado de Cuenta de un Asociado.
    
    Muestra:
    - Información del asociado
    - Aportes realizados
    - Créditos activos y pagos
    - Cuentas de ahorro y movimientos
    - Resumen financiero
    """
    return service.generar_estado_cuenta(
        db,
        asociado_id=asociado_id,
        fecha_inicio=fecha_inicio,
        fecha_fin=fecha_fin or date.today()
    )


@router.get("/estadisticas", response_model=EstadisticasGeneralesResponse)
def obtener_estadisticas_generales(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_permission("reportes:leer")),
):
    """
    Obtener estadísticas generales del sistema.
    
    Métricas rápidas para el dashboard:
    - Total asociados (activos/inactivos)
    - Cartera total y mora
    - Total ahorros
    - Aportes acumulados
    - Operaciones del mes
    """
    return service.obtener_estadisticas_generales(db)


@router.get("/balance-general/export/pdf")
def exportar_balance_pdf(
    fecha_corte: date = Query(..., description="Fecha de corte del balance"),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_permission("reportes:exportar")),
):
    """Exportar Balance General a PDF."""
    pdf_content = service.exportar_balance_pdf(db, fecha_corte)
    
    return StreamingResponse(
        pdf_content,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=balance_general_{fecha_corte}.pdf"
        }
    )


@router.get("/cartera/export/excel")
def exportar_cartera_excel(
    fecha_corte: Optional[date] = Query(None, description="Fecha de corte"),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_permission("reportes:exportar")),
):
    """Exportar Reporte de Cartera a Excel."""
    excel_content = service.exportar_cartera_excel(
        db,
        fecha_corte=fecha_corte or date.today()
    )
    
    return StreamingResponse(
        excel_content,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": f"attachment; filename=cartera_{fecha_corte or date.today()}.xlsx"
        }
    )
