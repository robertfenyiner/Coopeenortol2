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
    barrio: Optional[str] = None
    ciudad: str
    departamento: str
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
    institucion_educativa: str
    cargo: str
    tipo_contrato: str
    fecha_vinculacion: date
    salario_basico: float = Field(ge=0)
    horario: Optional[str] = None
    dependencia: Optional[str] = None


class InformacionFamiliar(BaseModel):
    familiares: List[Familiar] = Field(default_factory=list)
    contactos_emergencia: List[ContactoEmergencia] = Field(default_factory=list)
    personas_autorizadas: List[dict] = Field(default_factory=list)  # Para recogida de hijos, etc.


class InformacionAcademica(BaseModel):
    nivel_educativo: str
    institucion: Optional[str] = None
    titulo_obtenido: Optional[str] = None
    ano_graduacion: Optional[int] = None
    en_estudio: bool = False
    programa_actual: Optional[str] = None
    institucion_actual: Optional[str] = None
    semestre_actual: Optional[int] = None
    certificaciones: List[dict] = Field(default_factory=list)


class InformacionVivienda(BaseModel):
    tipo_vivienda: str  # casa, apartamento, finca, otro
    tenencia: str  # propia, arrendada, familiar, otro
    valor_arriendo: Optional[float] = Field(default=0, ge=0)
    tiempo_residencia: Optional[int] = None  # en meses
    servicios_publicos: List[str] = Field(default_factory=list)
    estrato: Optional[int] = None


class InformacionFinanciera(BaseModel):
    ingresos_mensuales: float = Field(ge=0)
    ingresos_adicionales: Optional[float] = Field(default=0, ge=0)
    egresos_mensuales: float = Field(ge=0)
    ingresos_familiares: Optional[float] = Field(default=0, ge=0)
    gastos_familiares: Optional[float] = Field(default=0, ge=0)
    endeudamiento: Optional[float] = Field(default=None, ge=0)
    obligaciones: List[Obligacion] = Field(default_factory=list)
    referencias_comerciales: List[dict] = Field(default_factory=list)
    activos: List[dict] = Field(default_factory=list)  # inmuebles, vehículos, inversiones
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
    foto_url: Optional[HttpUrl] = None
    observaciones: Optional[str] = None
    datos_personales: DatosPersonales
    datos_laborales: DatosLaborales
    informacion_familiar: InformacionFamiliar
    informacion_financiera: InformacionFinanciera
    informacion_academica: InformacionAcademica
    informacion_vivienda: InformacionVivienda


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
    foto_url: Optional[HttpUrl] = None
    observaciones: Optional[str] = None
    datos_personales: Optional[DatosPersonales] = None
    datos_laborales: Optional[DatosLaborales] = None
    informacion_familiar: Optional[InformacionFamiliar] = None
    informacion_financiera: Optional[InformacionFinanciera] = None
    informacion_academica: Optional[InformacionAcademica] = None
    informacion_vivienda: Optional[InformacionVivienda] = None


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
