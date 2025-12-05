from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel, Field, HttpUrl


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
    fecha_nacimiento: Optional[date] = None
    lugar_nacimiento: Optional[str] = None
    direccion: Optional[str] = None
    barrio: Optional[str] = None
    ciudad: Optional[str] = None
    departamento: Optional[str] = None
    pais: str = "Colombia"
    codigo_postal: Optional[str] = None
    estado_civil: Optional[str] = None
    genero: Optional[str] = None
    grupo_sanguineo: Optional[str] = None
    eps: Optional[str] = None
    arl: Optional[str] = None
    telefono_alternativo: Optional[str] = None
    numero_hijos: Optional[int] = Field(default=0, ge=0)
    personas_a_cargo: Optional[int] = Field(default=0, ge=0)


class DatosLaborales(BaseModel):
    institucion_educativa: Optional[str] = None
    cargo: Optional[str] = None
    tipo_contrato: Optional[str] = None
    fecha_vinculacion: Optional[date] = None
    salario_basico: Optional[float] = Field(default=0, ge=0)
    horario: Optional[str] = None
    dependencia: Optional[str] = None


class InformacionFamiliar(BaseModel):
    familiares: List[Familiar] = Field(default_factory=list)
    contactos_emergencia: List[ContactoEmergencia] = Field(default_factory=list)
    personas_autorizadas: List[dict] = Field(default_factory=list)  # Para recogida de hijos, etc.


class InformacionAcademica(BaseModel):
    nivel_educativo: Optional[str] = None
    institucion: Optional[str] = None
    titulo_obtenido: Optional[str] = None
    ano_graduacion: Optional[int] = None
    en_estudio: bool = False
    programa_actual: Optional[str] = None
    institucion_actual: Optional[str] = None
    semestre_actual: Optional[int] = None
    certificaciones: Optional[List[dict]] = Field(default_factory=list)


class InformacionVivienda(BaseModel):
    tipo_vivienda: Optional[str] = None  # casa, apartamento, finca, otro
    tenencia: Optional[str] = None  # propia, arrendada, familiar, otro
    valor_arriendo: Optional[float] = Field(default=0, ge=0)
    tiempo_residencia: Optional[int] = None  # en meses
    servicios_publicos: Optional[List[str]] = Field(default_factory=list)
    estrato: Optional[int] = None


class InformacionFinanciera(BaseModel):
    ingresos_mensuales: Optional[float] = Field(default=0, ge=0)
    ingresos_adicionales: Optional[float] = Field(default=0, ge=0)
    egresos_mensuales: Optional[float] = Field(default=0, ge=0)
    ingresos_familiares: Optional[float] = Field(default=0, ge=0)
    gastos_familiares: Optional[float] = Field(default=0, ge=0)
    endeudamiento: Optional[float] = Field(default=None, ge=0)
    obligaciones: Optional[List[Obligacion]] = Field(default_factory=list)
    referencias_comerciales: Optional[List[dict]] = Field(default_factory=list)
    activos: Optional[List[dict]] = Field(default_factory=list)  # inmuebles, vehículos, inversiones
    calificacion_riesgo: Optional[str] = None
    observaciones: Optional[str] = None


class AsociadoBase(BaseModel):
    tipo_documento: str
    numero_documento: str
    nombres: str
    apellidos: str
    correo_electronico: Optional[str] = None
    telefono_principal: Optional[str] = None
    estado: str = Field(default="activo")
    fecha_ingreso: date
    hoja_vida_url: Optional[HttpUrl] = None
    foto_url: Optional[HttpUrl] = None
    observaciones: Optional[str] = None
    datos_personales: Optional[DatosPersonales] = None
    datos_laborales: Optional[DatosLaborales] = None
    informacion_familiar: Optional[InformacionFamiliar] = None
    informacion_financiera: Optional[InformacionFinanciera] = None
    informacion_academica: Optional[InformacionAcademica] = None
    informacion_vivienda: Optional[InformacionVivienda] = None


class AsociadoCrear(AsociadoBase):
    pass


class DatosPersonalesActualizar(BaseModel):
    """Datos personales con todos los campos opcionales para actualización"""
    fecha_nacimiento: Optional[date] = None
    lugar_nacimiento: Optional[str] = None
    direccion: Optional[str] = None
    barrio: Optional[str] = None
    ciudad: Optional[str] = None
    departamento: Optional[str] = None
    pais: Optional[str] = None
    codigo_postal: Optional[str] = None
    estado_civil: Optional[str] = None
    genero: Optional[str] = None
    grupo_sanguineo: Optional[str] = None
    eps: Optional[str] = None
    arl: Optional[str] = None
    telefono_alternativo: Optional[str] = None
    numero_hijos: Optional[int] = None
    personas_a_cargo: Optional[int] = None


class DatosLaboralesActualizar(BaseModel):
    """Datos laborales con todos los campos opcionales para actualización"""
    institucion_educativa: Optional[str] = None
    cargo: Optional[str] = None
    tipo_contrato: Optional[str] = None
    fecha_vinculacion: Optional[date] = None
    salario_basico: Optional[float] = None
    horario: Optional[str] = None
    dependencia: Optional[str] = None


class InformacionFinancieraActualizar(BaseModel):
    """Información financiera con todos los campos opcionales para actualización"""
    ingresos_mensuales: Optional[float] = None
    ingresos_adicionales: Optional[float] = None
    egresos_mensuales: Optional[float] = None
    ingresos_familiares: Optional[float] = None
    gastos_familiares: Optional[float] = None
    endeudamiento: Optional[float] = None
    obligaciones: Optional[List[Obligacion]] = None
    referencias_comerciales: Optional[List[dict]] = None
    activos: Optional[List[dict]] = None
    calificacion_riesgo: Optional[str] = None
    observaciones: Optional[str] = None


class InformacionAcademicaActualizar(BaseModel):
    """Información académica con todos los campos opcionales para actualización"""
    nivel_educativo: Optional[str] = None
    institucion: Optional[str] = None
    titulo_obtenido: Optional[str] = None
    ano_graduacion: Optional[int] = None
    en_estudio: Optional[bool] = None
    programa_actual: Optional[str] = None
    institucion_actual: Optional[str] = None
    semestre_actual: Optional[int] = None
    certificaciones: Optional[List[dict]] = None


class InformacionViviendaActualizar(BaseModel):
    """Información de vivienda con todos los campos opcionales para actualización"""
    tipo_vivienda: Optional[str] = None
    tenencia: Optional[str] = None
    valor_arriendo: Optional[float] = None
    tiempo_residencia: Optional[int] = None
    servicios_publicos: Optional[List[str]] = None
    estrato: Optional[int] = None


class AsociadoActualizar(BaseModel):
    tipo_documento: Optional[str] = None
    numero_documento: Optional[str] = None
    nombres: Optional[str] = None
    apellidos: Optional[str] = None
    correo_electronico: Optional[str] = None
    telefono_principal: Optional[str] = None
    estado: Optional[str] = None
    fecha_ingreso: Optional[date] = None
    hoja_vida_url: Optional[HttpUrl] = None
    foto_url: Optional[HttpUrl] = None
    observaciones: Optional[str] = None
    datos_personales: Optional[DatosPersonalesActualizar] = None
    datos_laborales: Optional[DatosLaboralesActualizar] = None
    informacion_familiar: Optional[InformacionFamiliar] = None
    informacion_financiera: Optional[InformacionFinancieraActualizar] = None
    informacion_academica: Optional[InformacionAcademicaActualizar] = None
    informacion_vivienda: Optional[InformacionViviendaActualizar] = None


class AsociadoEnDB(AsociadoBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True


class AsociadoDetalle(BaseModel):
    """Modelo flexible para vista de detalle de asociado"""
    id: int
    tipo_documento: str
    numero_documento: str
    nombres: str
    apellidos: str
    correo_electronico: Optional[str] = None
    telefono_principal: Optional[str] = None
    estado: str
    fecha_ingreso: date
    hoja_vida_url: Optional[str] = None
    foto_url: Optional[str] = None
    observaciones: Optional[str] = None
    datos_personales: Optional[dict] = None
    datos_laborales: Optional[dict] = None
    informacion_familiar: Optional[dict] = None
    informacion_financiera: Optional[dict] = None
    informacion_academica: Optional[dict] = None
    informacion_vivienda: Optional[dict] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True


class AsociadoSimple(BaseModel):
    """Modelo simplificado para listados"""
    id: int
    tipo_documento: str
    numero_documento: str
    nombres: str
    apellidos: str
    correo_electronico: Optional[str] = None
    telefono_principal: Optional[str] = None
    estado: str
    fecha_ingreso: date
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
    datos: List[AsociadoSimple] = Field(description="Lista de asociados")
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
