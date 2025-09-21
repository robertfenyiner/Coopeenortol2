const API_BASE_URL = 'http://localhost:8000/api/v1';

export interface AsociadoFormData {
  tipo_documento: string;
  numero_documento: string;
  nombres: string;
  apellidos: string;
  correo_electronico: string;
  telefono_principal: string;
  estado: 'activo' | 'inactivo' | 'retirado';
  fecha_ingreso: string;
  observaciones: string;
  
  datos_personales: {
    fecha_nacimiento: string;
    lugar_nacimiento: string;
    direccion: string;
    barrio: string;
    ciudad: string;
    departamento: string;
    pais: string;
    codigo_postal: string;
    telefono_secundario: string;
    estado_civil: '' | 'soltero' | 'casado' | 'union_libre' | 'separado' | 'divorciado' | 'viudo';
    genero: '' | 'masculino' | 'femenino' | 'otro';
    grupo_sanguineo: string;
    eps: string;
    arl: string;
    numero_hijos: number;
    personas_a_cargo: number;
  };
  
  informacion_academica: {
    nivel_educativo: '' | 'primaria' | 'bachillerato' | 'tecnico' | 'tecnologo' | 'universitario' | 'especializacion' | 'maestria' | 'doctorado';
    institucion: string;
    titulo_obtenido: string;
    ano_graduacion: number;
    en_estudio: boolean;
    programa_actual: string;
    institucion_actual: string;
    semestre_actual: number;
    certificaciones: Array<{
      nombre: string;
      institucion: string;
      fecha_obtencion: string;
      vigencia?: string;
    }>;
  };
  
  datos_laborales: {
    institucion_educativa: string;
    cargo: string;
    area_trabajo: string;
    tipo_contrato: string;
    fecha_vinculacion: string;
    salario_basico: number;
    bonificaciones: number;
    jefe_inmediato: string;
    telefono_jefe: string;
    email_jefe: string;
    sede_trabajo: string;
    horario_trabajo: string;
    experiencia_laboral: Array<{
      empresa: string;
      cargo: string;
      fecha_inicio: string;
      fecha_fin?: string;
      motivo_retiro?: string;
      funciones?: string;
    }>;
  };
  
  informacion_familiar: {
    familiares: Array<{
      nombre: string;
      parentesco: string;
      fecha_nacimiento?: string;
      documento?: string;
      telefono?: string;
      ocupacion?: string;
      depende_economicamente?: boolean;
    }>;
    contactos_emergencia: Array<{
      nombre: string;
      parentesco: string;
      telefono: string;
      direccion?: string;
      es_principal?: boolean;
    }>;
    personas_autorizadas: Array<{
      nombre: string;
      documento: string;
      telefono: string;
      parentesco?: string;
      puede_recoger_hijo?: boolean;
    }>;
  };
  
  informacion_financiera: {
    ingresos_mensuales: number;
    ingresos_adicionales: number;
    egresos_mensuales: number;
    ingresos_familiares: number;
    gastos_familiares: number;
    obligaciones: Array<{
      tipo: string;
      entidad: string;
      valor_cuota: number;
      saldo_actual?: number;
      fecha_vencimiento?: string;
    }>;
    referencias_comerciales: Array<{
      entidad: string;
      tipo_producto: string;
      telefono?: string;
      comportamiento?: 'excelente' | 'bueno' | 'regular' | 'malo';
    }>;
    activos: Array<{
      tipo: 'inmueble' | 'vehiculo' | 'inversion' | 'otro';
      descripcion: string;
      valor_estimado?: number;
    }>;
  };
  
  informacion_vivienda: {
    tipo_vivienda: '' | 'casa' | 'apartamento' | 'finca' | 'otro';
    tenencia: '' | 'propia' | 'arrendada' | 'familiar' | 'otro';
    valor_arriendo: number;
    tiempo_residencia: number;
    servicios_publicos: string[];
    estrato: number;
  };
}

export interface Asociado {
  id: number;
  tipo_documento: string;
  numero_documento: string;
  nombres: string;
  apellidos: string;
  correo_electronico: string;
  telefono_principal?: string;
  estado: string;
  fecha_ingreso: string;
  foto_url?: string;
  hoja_vida_url?: string;
  observaciones?: string;
  datos_personales: any;
  datos_laborales: any;
  informacion_familiar: any;
  informacion_financiera: any;
  informacion_academica: any;
  informacion_vivienda: any;
  created_at: string;
  updated_at: string;
}

export interface AsociadosResponse {
  datos: Asociado[];
  paginacion: {
    total: number;
    pagina_actual: number;
    por_pagina: number;
    total_paginas: number;
    tiene_siguiente: boolean;
    tiene_anterior: boolean;
  };
}

class AsociadoService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Error ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  async listarAsociados(params: {
    skip?: number;
    limit?: number;
    estado?: string;
    numero_documento?: string;
    nombre?: string;
    correo?: string;
    ordenar_por?: string;
    orden?: string;
  } = {}): Promise<AsociadosResponse> {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, value.toString());
      }
    });

    const queryString = searchParams.toString();
    const endpoint = `/asociados/${queryString ? `?${queryString}` : ''}`;
    
    return this.request<AsociadosResponse>(endpoint);
  }

  async obtenerAsociado(id: number): Promise<Asociado> {
    return this.request<Asociado>(`/asociados/${id}`);
  }

  async crearAsociado(data: AsociadoFormData): Promise<Asociado> {
    return this.request<Asociado>('/asociados/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async actualizarAsociado(id: number, data: Partial<AsociadoFormData>): Promise<Asociado> {
    return this.request<Asociado>(`/asociados/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async eliminarAsociado(id: number): Promise<void> {
    return this.request<void>(`/asociados/${id}`, {
      method: 'DELETE',
    });
  }

  async buscarAsociados(q: string, limite: number = 20): Promise<Asociado[]> {
    return this.request<Asociado[]>(`/asociados/buscar?q=${encodeURIComponent(q)}&limite=${limite}`);
  }

  async obtenerEstadisticas(): Promise<any> {
    return this.request<any>('/asociados/estadisticas');
  }

  async subirFoto(id: number, file: File): Promise<{ message: string; foto_url: string; filename: string }> {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('file', file);

    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/asociados/${id}/foto`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Error ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }
}

export const asociadoService = new AsociadoService();
