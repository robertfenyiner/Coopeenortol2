from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel, EmailStr, Field, HttpUrl


class ContactoEmergencia(BaseModel):
    nombre: str
    parentesco: str
    telefono: str


class Familiar(BaseModel):
    nombre: str
    parentesco: str
    fecha_nacimiento: Optional[date] = None
    ocupacion: Optional[str] = None
    convive: bool = True


class Obligacion(BaseModel):
    entidad: str
    tipo: str
    saldo: float = Field(ge=0)
    cuota_mensual: float = Field(ge=0)


class DatosPersonales(BaseModel):
    fecha_nacimiento: date
    direccion: str
    ciudad: str
    departamento: str
    pais: str
    estado_civil: Optional[str] = None
    genero: Optional[str] = None
    nivel_academico: Optional[str] = None
    profesion: Optional[str] = None
    tipo_vivienda: Optional[str] = None
    telefono_alternativo: Optional[str] = None


class DatosLaborales(BaseModel):
    institucion_educativa: str
    cargo: str
    tipo_contrato: str
    fecha_vinculacion: date
    salario_basico: float = Field(ge=0)
    horario: Optional[str] = None
    dependencia: Optional[str] = None


class InformacionFamiliar(BaseModel):
    estado_civil: Optional[str] = None
    numero_hijos: Optional[int] = Field(default=None, ge=0)
    personas_a_cargo: Optional[int] = Field(default=None, ge=0)
    familiares: List[Familiar] = Field(default_factory=list)
    contactos_emergencia: List[ContactoEmergencia] = Field(default_factory=list)


class InformacionFinanciera(BaseModel):
    ingresos_mensuales: float = Field(ge=0)
    egresos_mensuales: float = Field(ge=0)
    endeudamiento: Optional[float] = Field(default=None, ge=0)
    obligaciones: List[Obligacion] = Field(default_factory=list)
    calificacion_riesgo: Optional[str] = None
    observaciones: Optional[str] = None


class AsociadoBase(BaseModel):
    tipo_documento: str
    numero_documento: str
    nombres: str
    apellidos: str
    correo_electronico: EmailStr
    telefono_principal: Optional[str] = None
    estado: str = Field(default="activo")
    fecha_ingreso: date
    hoja_vida_url: Optional[HttpUrl] = None
    observaciones: Optional[str] = None
    datos_personales: DatosPersonales
    datos_laborales: DatosLaborales
    informacion_familiar: InformacionFamiliar
    informacion_financiera: InformacionFinanciera


class AsociadoCrear(AsociadoBase):
    pass


class AsociadoActualizar(BaseModel):
    tipo_documento: Optional[str] = None
    numero_documento: Optional[str] = None
    nombres: Optional[str] = None
    apellidos: Optional[str] = None
    correo_electronico: Optional[EmailStr] = None
    telefono_principal: Optional[str] = None
    estado: Optional[str] = None
    fecha_ingreso: Optional[date] = None
    hoja_vida_url: Optional[HttpUrl] = None
    observaciones: Optional[str] = None
    datos_personales: Optional[DatosPersonales] = None
    datos_laborales: Optional[DatosLaborales] = None
    informacion_familiar: Optional[InformacionFamiliar] = None
    informacion_financiera: Optional[InformacionFinanciera] = None


class AsociadoEnDB(AsociadoBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True


class InfoPaginacion(BaseModel):
    """Información de paginación para listados"""
    total: int = Field(description="Total de registros")
    pagina_actual: int = Field(description="Página actual")
    por_pagina: int = Field(description="Registros por página")
    total_paginas: int = Field(description="Total de páginas")
    tiene_siguiente: bool = Field(description="Existe página siguiente")
    tiene_anterior: bool = Field(description="Existe página anterior")


class AsociadosListResponse(BaseModel):
    """Respuesta para listado de asociados con paginación"""
    datos: List[AsociadoEnDB] = Field(description="Lista de asociados")
    paginacion: InfoPaginacion = Field(description="Información de paginación")


class EstadisticasAsociados(BaseModel):
    """Estadísticas generales de asociados"""
    total_asociados: int
    activos: int
    inactivos: int
    retirados: int
    nuevos_este_mes: int
    distribucion_por_ano: dict
    promedio_edad: Optional[float] = None
    distribucion_por_estado_civil: dict
    distribucion_por_genero: dict
