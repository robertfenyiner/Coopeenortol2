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
    lugar_nacimiento: Optional[str] = None
    direccion: str
    ciudad: str
    departamento: str
    pais: str = Field(default="Colombia")
    estado_civil: Optional[str] = Field(default=None, description="soltero, casado, union_libre, divorciado, viudo")
    genero: Optional[str] = Field(default=None, description="masculino, femenino, otro")
    nivel_academico: Optional[str] = Field(default=None, description="primaria, secundaria, tecnico, tecnologo, universitario, posgrado")
    profesion: Optional[str] = None
    tipo_vivienda: Optional[str] = Field(default=None, description="propia, arrendada, familiar, otra")
    telefono_alternativo: Optional[str] = None
    tiene_discapacidad: Optional[bool] = Field(default=False)
    tipo_discapacidad: Optional[str] = None
    grupo_sanguineo: Optional[str] = None
    eps: Optional[str] = None
    arl: Optional[str] = None


class DatosLaborales(BaseModel):
    institucion_educativa: str
    cargo: str
    tipo_contrato: str = Field(description="indefinido, fijo, obra_labor, prestacion_servicios")
    fecha_vinculacion: date
    salario_basico: float = Field(ge=0)
    otros_ingresos: Optional[float] = Field(default=0, ge=0, description="Bonificaciones, horas extras, etc.")
    horario: Optional[str] = None
    dependencia: Optional[str] = None
    jefe_inmediato: Optional[str] = None
    telefono_trabajo: Optional[str] = None
    correo_institucional: Optional[str] = None
    sede_trabajo: Optional[str] = None


class InformacionFamiliar(BaseModel):
    estado_civil: Optional[str] = None
    numero_hijos: Optional[int] = Field(default=None, ge=0)
    personas_a_cargo: Optional[int] = Field(default=None, ge=0)
    familiares: List[Familiar] = Field(default_factory=list)
    contactos_emergencia: List[ContactoEmergencia] = Field(default_factory=list)


class InformacionFinanciera(BaseModel):
    ingresos_mensuales: float = Field(ge=0, description="Ingresos totales mensuales")
    ingresos_adicionales: Optional[float] = Field(default=0, ge=0, description="Ingresos por otras fuentes")
    egresos_mensuales: float = Field(ge=0, description="Gastos mensuales totales")
    gastos_financieros: Optional[float] = Field(default=0, ge=0, description="Pagos de créditos y tarjetas")
    capacidad_ahorro: Optional[float] = Field(default=0, ge=0, description="Capacidad mensual de ahorro")
    patrimonio_neto: Optional[float] = Field(default=0, ge=0, description="Activos menos pasivos")
    endeudamiento: Optional[float] = Field(default=None, ge=0, description="Nivel de endeudamiento total")
    obligaciones: List[Obligacion] = Field(default_factory=list)
    cuenta_bancaria_principal: Optional[str] = None
    entidad_bancaria: Optional[str] = None
    calificacion_riesgo: Optional[str] = Field(default=None, description="A, B, C, D, E")
    score_crediticio: Optional[int] = Field(default=None, ge=0, le=1000)
    reportes_centrales: Optional[bool] = Field(default=False, description="¿Reportado en centrales de riesgo?")
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
    foto_url: Optional[HttpUrl] = None
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
    foto_url: Optional[HttpUrl] = None
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
