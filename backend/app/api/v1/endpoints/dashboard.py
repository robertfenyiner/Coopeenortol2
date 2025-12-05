"""
Endpoints para el Dashboard con KPIs y estadísticas generales.
"""
from datetime import datetime
from typing import Dict

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.deps import get_current_active_user, require_permission
from app.database import get_db
from app.models.usuario import Usuario
from app.services.dashboard import DashboardService

router = APIRouter()


@router.get("/kpis")
def obtener_kpis(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
) -> Dict:
    """
    Obtener KPIs principales del sistema.
    
    Retorna métricas clave:
    - Total de asociados activos
    - Total de ahorros
    - Total de cartera de créditos
    - Índice de morosidad
    - Nuevos asociados del mes
    - Crecimiento vs mes anterior
    """
    return DashboardService.obtener_kpis(db)


@router.get("/actividad-reciente")
def obtener_actividad_reciente(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
) -> Dict:
    """
    Obtener actividad reciente del sistema.
    
    Retorna:
    - Últimos créditos aprobados
    - Últimas consignaciones
    - Últimos retiros
    - Nuevos asociados
    """
    return DashboardService.obtener_actividad_reciente(db)


@router.get("/estadisticas-mensuales")
def obtener_estadisticas_mensuales(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
) -> Dict:
    """
    Obtener estadísticas mensuales para gráficos.
    
    Retorna datos de los últimos 12 meses:
    - Ahorros mensuales
    - Créditos desembolsados
    - Número de asociados nuevos
    - Cartera total
    """
    return DashboardService.obtener_estadisticas_mensuales(db)
