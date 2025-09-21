import math
from datetime import datetime, timedelta
from typing import List, Optional

from sqlalchemy import and_, desc, func, or_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models import Asociado
from app.schemas import AsociadoActualizar, AsociadoCrear, AsociadosListResponse, InfoPaginacion


class DocumentoDuplicadoError(Exception):
    """Se lanza cuando el número de documento ya existe."""


class EmailDuplicadoError(Exception):
    """Se lanza cuando el email ya existe."""


def listar_asociados(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    estado: Optional[str] = None,
    numero_documento: Optional[str] = None,
    nombre: Optional[str] = None,
    correo: Optional[str] = None,
    ordenar_por: str = "fecha_ingreso",
    orden: str = "desc",
) -> AsociadosListResponse:
    """
    Listar asociados con paginación y filtros avanzados.
    """
    consulta = db.query(Asociado)
    
    # Aplicar filtros
    if estado:
        consulta = consulta.filter(Asociado.estado == estado)
    if numero_documento:
        consulta = consulta.filter(Asociado.numero_documento.contains(numero_documento))
    if nombre:
        consulta = consulta.filter(
            or_(
                Asociado.nombres.ilike(f"%{nombre}%"),
                Asociado.apellidos.ilike(f"%{nombre}%")
            )
        )
    if correo:
        consulta = consulta.filter(Asociado.correo_electronico.ilike(f"%{correo}%"))
    
    # Obtener total de registros
    total = consulta.count()
    
    # Aplicar ordenamiento
    campo_orden = getattr(Asociado, ordenar_por, Asociado.fecha_ingreso)
    if orden == "desc":
        consulta = consulta.order_by(desc(campo_orden))
    else:
        consulta = consulta.order_by(campo_orden)
    
    # Aplicar paginación
    asociados = consulta.offset(skip).limit(limit).all()
    
    # Calcular información de paginación
    pagina_actual = (skip // limit) + 1
    total_paginas = math.ceil(total / limit) if total > 0 else 1
    
    paginacion = InfoPaginacion(
        total=total,
        pagina_actual=pagina_actual,
        por_pagina=limit,
        total_paginas=total_paginas,
        tiene_siguiente=pagina_actual < total_paginas,
        tiene_anterior=pagina_actual > 1
    )
    
    return AsociadosListResponse(
        datos=asociados,
        paginacion=paginacion
    )


def obtener_asociado(db: Session, asociado_id: int) -> Optional[Asociado]:
    """Obtener un asociado por su ID."""
    return db.query(Asociado).filter(Asociado.id == asociado_id).first()


def obtener_por_documento(db: Session, numero_documento: str) -> Optional[Asociado]:
    """Obtener un asociado por su número de documento."""
    return db.query(Asociado).filter(Asociado.numero_documento == numero_documento).first()


def obtener_por_email(db: Session, email: str, excluir_id: Optional[int] = None) -> Optional[Asociado]:
    """Obtener un asociado por su email, opcionalmente excluyendo un ID."""
    consulta = db.query(Asociado).filter(Asociado.correo_electronico == email)
    if excluir_id:
        consulta = consulta.filter(Asociado.id != excluir_id)
    return consulta.first()


def buscar_asociados(db: Session, termino: str, limite: int = 20) -> List[Asociado]:
    """
    Búsqueda de texto libre en asociados.
    Busca en nombres, apellidos, número de documento y correo.
    """
    termino_busqueda = f"%{termino}%"
    return db.query(Asociado).filter(
        or_(
            Asociado.nombres.ilike(termino_busqueda),
            Asociado.apellidos.ilike(termino_busqueda),
            Asociado.numero_documento.ilike(termino_busqueda),
            Asociado.correo_electronico.ilike(termino_busqueda)
        )
    ).limit(limite).all()


def obtener_estadisticas(db: Session) -> dict:
    """
    Obtener estadísticas generales de asociados.
    """
    # Contadores básicos
    total_asociados = db.query(Asociado).count()
    activos = db.query(Asociado).filter(Asociado.estado == "activo").count()
    inactivos = db.query(Asociado).filter(Asociado.estado == "inactivo").count()
    retirados = db.query(Asociado).filter(Asociado.estado == "retirado").count()
    
    # Nuevos este mes
    inicio_mes = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    nuevos_este_mes = db.query(Asociado).filter(
        Asociado.fecha_ingreso >= inicio_mes.date()
    ).count()
    
    # Distribución por año de ingreso
    distribucion_ano = db.query(
        func.extract('year', Asociado.fecha_ingreso).label('ano'),
        func.count(Asociado.id).label('cantidad')
    ).group_by(
        func.extract('year', Asociado.fecha_ingreso)
    ).all()
    
    distribucion_por_ano = {str(int(row.ano)): row.cantidad for row in distribucion_ano}
    
    return {
        "total_asociados": total_asociados,
        "activos": activos,
        "inactivos": inactivos,
        "retirados": retirados,
        "nuevos_este_mes": nuevos_este_mes,
        "distribucion_por_ano": distribucion_por_ano,
        "porcentaje_activos": round((activos / total_asociados * 100), 2) if total_asociados > 0 else 0
    }


def crear_asociado(db: Session, asociado_in: AsociadoCrear) -> Asociado:
    """
    Crear un nuevo asociado en la base de datos.
    Valida que el documento y email sean únicos.
    """
    # Verificar documento único
    if obtener_por_documento(db, asociado_in.numero_documento):
        raise DocumentoDuplicadoError("El número de documento ya está registrado.")
    
    # Verificar email único
    if obtener_por_email(db, asociado_in.correo_electronico):
        raise EmailDuplicadoError("El correo electrónico ya está registrado.")

    db_asociado = Asociado(
        tipo_documento=asociado_in.tipo_documento,
        numero_documento=asociado_in.numero_documento,
        nombres=asociado_in.nombres,
        apellidos=asociado_in.apellidos,
        correo_electronico=asociado_in.correo_electronico,
        telefono_principal=asociado_in.telefono_principal,
        estado=asociado_in.estado,
        fecha_ingreso=asociado_in.fecha_ingreso,
        hoja_vida_url=str(asociado_in.hoja_vida_url) if asociado_in.hoja_vida_url else None,
        foto_url=str(asociado_in.foto_url) if asociado_in.foto_url else None,
        observaciones=asociado_in.observaciones,
        datos_personales=asociado_in.datos_personales.dict(),
        datos_laborales=asociado_in.datos_laborales.dict(),
        informacion_familiar=asociado_in.informacion_familiar.dict(),
        informacion_financiera=asociado_in.informacion_financiera.dict(),
        informacion_academica=asociado_in.informacion_academica.dict(),
        informacion_vivienda=asociado_in.informacion_vivienda.dict(),
    )
    
    db.add(db_asociado)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise DocumentoDuplicadoError("Error de integridad en base de datos.") from exc
    
    db.refresh(db_asociado)
    return db_asociado


def actualizar_asociado(db: Session, db_obj: Asociado, asociado_in: AsociadoActualizar) -> Asociado:
    """
    Actualizar un asociado existente.
    Valida que el email sea único si se está cambiando.
    """
    datos_actualizados = asociado_in.dict(exclude_unset=True)
    
    # Verificar email único si se está cambiando
    if "correo_electronico" in datos_actualizados:
        email_existente = obtener_por_email(db, datos_actualizados["correo_electronico"], excluir_id=db_obj.id)
        if email_existente:
            raise EmailDuplicadoError("El correo electrónico ya está registrado por otro asociado.")

    for campo, valor in datos_actualizados.items():
        if campo in {
            "datos_personales",
            "datos_laborales", 
            "informacion_familiar",
            "informacion_financiera",
            "informacion_academica",
            "informacion_vivienda",
        } and valor is not None:
            if hasattr(valor, "dict"):
                valor = valor.dict()
        elif campo in {"hoja_vida_url", "foto_url"} and valor is not None:
            valor = str(valor)
        
        setattr(db_obj, campo, valor)

    db.add(db_obj)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise EmailDuplicadoError("Error de integridad en base de datos.") from exc
    
    db.refresh(db_obj)
    return db_obj


def eliminar_asociado(db: Session, db_obj: Asociado) -> None:
    """
    Eliminar (inactivar) un asociado.
    En lugar de eliminar físicamente, cambia el estado a 'inactivo'.
    """
    db_obj.estado = "inactivo"
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
