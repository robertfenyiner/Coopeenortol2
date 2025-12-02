// Tipos globales de la aplicación

export interface User {
  id: number;
  username: string;
  email: string;
  nombre_completo: string;
  rol: 'ADMIN' | 'ANALISTA' | 'SUPERUSUARIO';
  activo: boolean;
  ultima_sesion?: string;
}

export interface Asociado {
  id: number;
  nombres: string;
  apellidos: string;
  nombre_completo?: string;
  tipo_documento: 'CC' | 'TI' | 'CE' | 'PA' | 'NIT';
  numero_documento: string;
  correo_electronico?: string;
  email?: string;
  telefono_principal?: string;
  telefono?: string;
  fecha_ingreso: string;
  estado: 'activo' | 'inactivo' | 'retirado' | 'suspendido';
  datos_personales?: Record<string, any>;
  datos_laborales?: Record<string, any>;
  datos_familiares?: Record<string, any>;
  datos_financieros?: Record<string, any>;
  informacion_financiera?: Record<string, any>;
  informacion_familiar?: Record<string, any>;
  informacion_academica?: Record<string, any>;
  informacion_vivienda?: Record<string, any>;
}

export interface Credito {
  id: number;
  asociado_id: number;
  tipo_credito: string;
  monto_solicitado: number;
  tasa_interes: number;
  plazo_meses: number;
  estado: 'solicitado' | 'en_estudio' | 'aprobado' | 'rechazado' | 'desembolsado' | 'activo' | 'cancelado' | 'castigado';
  fecha_solicitud: string;
  fecha_aprobacion?: string;
  fecha_desembolso?: string;
  cuota_mensual?: number;
  saldo_capital?: number;
  saldo_interes?: number;
  dias_mora?: number;
  asociado?: Asociado;
}

export interface CuentaAhorro {
  id: number;
  asociado_id: number;
  numero_cuenta: string;
  tipo_cuenta: 'a_la_vista' | 'programado' | 'cdat' | 'contractual' | 'aportes';
  saldo: number;
  tasa_interes: number;
  estado: 'activa' | 'inactiva' | 'cerrada' | 'bloqueada';
  fecha_apertura: string;
  meta?: number;
  cuota_mensual?: number;
  asociado?: Asociado;
}

export interface Documento {
  id: number;
  nombre_archivo: string;
  tipo_documento: string;
  ruta_archivo: string;
  tamano_bytes: number;
  fecha_subida: string;
  asociado_id?: number;
  credito_id?: number;
}

export interface Paginacion {
  page: number;
  per_page: number;
  total: number;
  pages: number;
}

export interface ApiResponse<T> {
  data?: T;
  items?: T[];
  message?: string;
  pagination?: Paginacion;
}

export interface DashboardStats {
  total_asociados: number;
  asociados_activos: number;
  total_creditos: number;
  cartera_activa: number;
  total_ahorros: number;
  cuentas_activas: number;
}

export interface CuotaCredito {
  numero_cuota: number;
  fecha_vencimiento: string;
  cuota_total: number;
  capital: number;
  interes: number;
  saldo: number;
  estado: 'pendiente' | 'pagada' | 'vencida';
}
