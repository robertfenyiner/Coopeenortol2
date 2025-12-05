import api from '../lib/axios';

export interface CreditoSolicitud {
  asociado_id: number;
  tipo_credito: string;
  monto_solicitado: number;
  plazo_meses: number;
  tasa_interes: number;
  destino: string;
  garantia?: string;
  modalidad_pago?: string;
  tipo_cuota?: string;
  fecha_solicitud: string;
  observaciones?: string;
}

export interface Credito {
  id: number;
  numero_credito: string;
  asociado_id: number;
  tipo_credito: string;
  monto_solicitado: number;
  monto_aprobado: number | null;
  monto_desembolsado: number | null;
  plazo_meses: number;
  tasa_interes: number;
  valor_cuota: number | null;
  total_intereses: number | null;
  total_a_pagar: number | null;
  saldo_capital: number;
  saldo_interes: number;
  saldo_mora: number;
  dias_mora: number;
  estado: string;
  destino: string;
  garantia: string | null;
  modalidad_pago: string;
  tipo_cuota: string;
  fecha_solicitud: string;
  fecha_aprobacion: string | null;
  fecha_desembolso: string | null;
  fecha_primer_pago: string | null;
  fecha_ultimo_pago: string | null;
  observaciones: string | null;
  created_at: string;
  updated_at: string;
}

export const creditoService = {
  // Listar créditos
  async listar() {
    const response = await api.get('/creditos/');
    return response.data;
  },

  // Obtener crédito por ID
  async obtenerPorId(id: number) {
    const response = await api.get(`/creditos/${id}`);
    return response.data;
  },

  // Solicitar nuevo crédito
  async solicitar(data: CreditoSolicitud) {
    const response = await api.post('/creditos/solicitar', data);
    return response.data;
  },

  // Aprobar crédito
  async aprobar(id: number, data: { monto_aprobado: number; fecha_aprobacion: string; observaciones?: string }) {
    const response = await api.post(`/creditos/${id}/aprobar`, data);
    return response.data;
  },

  // Rechazar crédito
  async rechazar(id: number, data: { motivo_rechazo: string }) {
    const response = await api.post(`/creditos/${id}/rechazar`, data);
    return response.data;
  },

  // Desembolsar crédito
  async desembolsar(id: number, data: { monto_desembolsado: number; fecha_desembolso: string; observaciones?: string }) {
    const response = await api.post(`/creditos/${id}/desembolsar`, data);
    return response.data;
  },

  // Registrar pago
  async registrarPago(id: number, data: { monto: number; fecha_pago: string; metodo_pago: string; referencia?: string; observaciones?: string }) {
    const response = await api.post(`/creditos/${id}/pagos`, data);
    return response.data;
  },

  // Obtener tabla de amortización
  async obtenerAmortizacion(id: number) {
    const response = await api.get(`/creditos/${id}/amortizacion`);
    return response.data;
  },

  // Obtener pagos
  async obtenerPagos(id: number) {
    const response = await api.get(`/creditos/${id}/pagos`);
    return response.data;
  },

  // Obtener estadísticas
  async obtenerEstadisticas() {
    const response = await api.get('/creditos/estadisticas');
    return response.data;
  },

  // Simular crédito
  async simular(data: { monto: number; plazo_meses: number; tasa_interes: number }) {
    const response = await api.post('/creditos/simular', data);
    return response.data;
  }
};
