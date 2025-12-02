import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, DollarSign, Calendar, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Credito } from '../types';
import api from '../lib/axios';
import { useToast } from '../contexts/ToastContext';
import { formatDate, formatCurrency } from '../lib/utils';

export default function CreditoDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [credito, setCredito] = useState<Credito | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCredito();
  }, [id]);

  const loadCredito = async () => {
    try {
      const response = await api.get(`/creditos/${id}`);
      setCredito(response.data);
    } catch (error: any) {
      showToast('error', 'Error al cargar el crédito');
      console.error(error);
      navigate('/creditos');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!credito) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Crédito no encontrado</p>
      </div>
    );
  }

  const getEstadoBadge = (estado: string) => {
    const colors: Record<string, string> = {
      solicitado: 'bg-yellow-100 text-yellow-800',
      en_estudio: 'bg-blue-100 text-blue-800',
      aprobado: 'bg-green-100 text-green-800',
      rechazado: 'bg-red-100 text-red-800',
      desembolsado: 'bg-purple-100 text-purple-800',
      activo: 'bg-green-100 text-green-800',
      cancelado: 'bg-gray-100 text-gray-800',
      castigado: 'bg-red-100 text-red-800',
    };

    return (
      <span className={`px-3 py-1 text-sm font-semibold rounded-full ${colors[estado] || 'bg-gray-100 text-gray-800'}`}>
        {estado.replace(/_/g, ' ').toUpperCase()}
      </span>
    );
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/creditos')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver a Créditos
        </button>
        
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Crédito #{credito.id}
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              {credito.tipo_credito.replace(/_/g, ' ').toUpperCase()}
            </p>
          </div>
          <div>
            {getEstadoBadge(credito.estado)}
          </div>
        </div>
      </div>

      {/* Información Principal */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Monto Solicitado</p>
              <p className="text-lg font-semibold">{formatCurrency(credito.monto_solicitado)}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Tasa de Interés</p>
              <p className="text-lg font-semibold">{credito.tasa_interes}%</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Plazo</p>
              <p className="text-lg font-semibold">{credito.plazo_meses} meses</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="p-3 bg-orange-100 rounded-lg">
              {credito.dias_mora && credito.dias_mora > 0 ? (
                <AlertCircle className="w-6 h-6 text-orange-600" />
              ) : (
                <CheckCircle className="w-6 h-6 text-green-600" />
              )}
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Días en Mora</p>
              <p className="text-lg font-semibold">{credito.dias_mora || 0}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Detalles del Crédito */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Información del Crédito</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Solicitud</label>
              <p className="text-gray-900">{formatDate(credito.fecha_solicitud)}</p>
            </div>
            
            {credito.fecha_aprobacion && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Aprobación</label>
                <p className="text-gray-900">{formatDate(credito.fecha_aprobacion)}</p>
              </div>
            )}
            
            {credito.fecha_desembolso && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Desembolso</label>
                <p className="text-gray-900">{formatDate(credito.fecha_desembolso)}</p>
              </div>
            )}
            
            {credito.cuota_mensual && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cuota Mensual</label>
                <p className="text-gray-900 text-lg font-semibold">{formatCurrency(credito.cuota_mensual)}</p>
              </div>
            )}
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Saldos</h2>
          <div className="space-y-4">
            {credito.saldo_capital !== undefined && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Saldo Capital</label>
                <p className="text-gray-900 text-lg font-semibold">{formatCurrency(credito.saldo_capital)}</p>
              </div>
            )}
            
            {credito.saldo_interes !== undefined && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Saldo Interés</label>
                <p className="text-gray-900 text-lg font-semibold">{formatCurrency(credito.saldo_interes)}</p>
              </div>
            )}
            
            {credito.saldo_capital !== undefined && credito.saldo_interes !== undefined && (
              <div className="pt-4 border-t border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-1">Saldo Total</label>
                <p className="text-gray-900 text-xl font-bold">
                  {formatCurrency(credito.saldo_capital + credito.saldo_interes)}
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Asociado */}
      {credito.asociado && (
        <Card className="mt-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Información del Asociado</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
              <p className="text-gray-900">{credito.asociado.nombre_completo || `${credito.asociado.nombres} ${credito.asociado.apellidos}`}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Documento</label>
              <p className="text-gray-900">{credito.asociado.tipo_documento}: {credito.asociado.numero_documento}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
              <p className="text-gray-900">{credito.asociado.telefono || credito.asociado.telefono_principal || 'N/A'}</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
