from typing import List, Optional

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models import Asociado
from app.schemas import AsociadoActualizar, AsociadoCrear


class DocumentoDuplicadoError(Exception):
    """Se lanza cuando el número de documento ya existe."""


def listar_asociados(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    estado: Optional[str] = None,
    numero_documento: Optional[str] = None,
) -> List[Asociado]:
    consulta = db.query(Asociado)
    if estado:
        consulta = consulta.filter(Asociado.estado == estado)
    if numero_documento:
        consulta = consulta.filter(Asociado.numero_documento == numero_documento)
    return consulta.offset(skip).limit(limit).all()


def obtener_asociado(db: Session, asociado_id: int) -> Optional[Asociado]:
    return db.query(Asociado).filter(Asociado.id == asociado_id).first()


def obtener_por_documento(db: Session, numero_documento: str) -> Optional[Asociado]:
    return db.query(Asociado).filter(Asociado.numero_documento == numero_documento).first()


def crear_asociado(db: Session, asociado_in: AsociadoCrear) -> Asociado:
    if obtener_por_documento(db, asociado_in.numero_documento):
        raise DocumentoDuplicadoError("El número de documento ya está registrado.")

    db_asociado = Asociado(
        tipo_documento=asociado_in.tipo_documento,
        numero_documento=asociado_in.numero_documento,
        nombres=asociado_in.nombres,
        apellidos=asociado_in.apellidos,
        correo_electronico=asociado_in.correo_electronico,
        telefono_principal=asociado_in.telefono_principal,
        estado=asociado_in.estado,
        fecha_ingreso=asociado_in.fecha_ingreso,
        hoja_vida_url=asociado_in.hoja_vida_url,
        observaciones=asociado_in.observaciones,
        datos_personales=asociado_in.datos_personales.dict(),
        datos_laborales=asociado_in.datos_laborales.dict(),
        informacion_familiar=asociado_in.informacion_familiar.dict(),
        informacion_financiera=asociado_in.informacion_financiera.dict(),
    )
    db.add(db_asociado)
    try:
        db.commit()
    except IntegrityError as exc:  # seguridad adicional en caso de condición de carrera
        db.rollback()
        raise DocumentoDuplicadoError("El número de documento ya está registrado.") from exc
    db.refresh(db_asociado)
    return db_asociado


def actualizar_asociado(db: Session, db_obj: Asociado, asociado_in: AsociadoActualizar) -> Asociado:
    datos_actualizados = asociado_in.dict(exclude_unset=True)

    for campo, valor in datos_actualizados.items():
        if campo in {
            "datos_personales",
            "datos_laborales",
            "informacion_familiar",
            "informacion_financiera",
        } and valor is not None:
            if hasattr(valor, "dict"):
                valor = valor.dict()
        setattr(db_obj, campo, valor)

    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def eliminar_asociado(db: Session, db_obj: Asociado) -> None:
    db.delete(db_obj)
    db.commit()
