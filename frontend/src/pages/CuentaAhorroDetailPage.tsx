import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, PiggyBank, TrendingUp, Calendar, DollarSign } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { CuentaAhorro } from '../types';
import api from '../lib/axios';
import { useToast } from '../contexts/ToastContext';
import { formatDate, formatCurrency } from '../lib/utils';

export default function CuentaAhorroDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [cuenta, setCuenta] = useState<CuentaAhorro | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCuenta();
  }, [id]);

  const loadCuenta = async () => {
    try {
      const response = await api.get(`/ahorros/${id}`);
      setCuenta(response.data);
    } catch (error: any) {
      showToast('error', 'Error al cargar la cuenta de ahorro');
      console.error(error);
      navigate('/ahorros');
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

  if (!cuenta) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Cuenta de ahorro no encontrada</p>
      </div>
    );
  }

  const getEstadoBadge = (estado: string) => {
    const colors: Record<string, string> = {
      activa: 'bg-green-100 text-green-800',
      inactiva: 'bg-gray-100 text-gray-800',
      cerrada: 'bg-red-100 text-red-800',
      bloqueada: 'bg-yellow-100 text-yellow-800',
    };

    return (
      <span className={`px-3 py-1 text-sm font-semibold rounded-full ${colors[estado] || 'bg-gray-100 text-gray-800'}`}>
        {estado.toUpperCase()}
      </span>
    );
  };

  const getTipoCuentaLabel = (tipo: string) => {
    const tipos: Record<string, string> = {
      a_la_vista: 'A la Vista',
      programado: 'Programado',
      cdat: 'CDAT',
      contractual: 'Contractual',
      aportes: 'Aportes',
    };
    return tipos[tipo] || tipo;
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/ahorros')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver a Ahorros
        </button>
        
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Cuenta {cuenta.numero_cuenta}
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              {getTipoCuentaLabel(cuenta.tipo_cuenta)}
            </p>
          </div>
          <div>
            {getEstadoBadge(cuenta.estado)}
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
              <p className="text-sm text-gray-600">Saldo Disponible</p>
              <p className="text-lg font-semibold">{formatCurrency(cuenta.saldo_disponible)}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <PiggyBank className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Saldo Bloqueado</p>
              <p className="text-lg font-semibold">{formatCurrency(cuenta.saldo_bloqueado)}</p>
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
              <p className="text-lg font-semibold">{cuenta.tasa_interes_anual}% anual</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Saldo Total</p>
              <p className="text-lg font-semibold">
                {formatCurrency(cuenta.saldo_disponible + cuenta.saldo_bloqueado)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Detalles de la Cuenta */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Información de la Cuenta</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Número de Cuenta</label>
              <p className="text-gray-900 font-mono">{cuenta.numero_cuenta}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Cuenta</label>
              <p className="text-gray-900">{getTipoCuentaLabel(cuenta.tipo_cuenta)}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
              <p className="text-gray-900 capitalize">{cuenta.estado}</p>
            </div>
            
            {cuenta.cuota_manejo > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cuota de Manejo</label>
                <p className="text-gray-900">{formatCurrency(cuenta.cuota_manejo)}</p>
              </div>
            )}
            
            {cuenta.fecha_apertura && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Apertura</label>
                <p className="text-gray-900">{formatDate(cuenta.fecha_apertura)}</p>
              </div>
            )}
          </div>
        </Card>

        {/* Información Adicional según el tipo */}
        <Card>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Detalles Adicionales</h2>
          <div className="space-y-4">
            {cuenta.tipo_cuenta === 'programado' && (
              <>
                {cuenta.meta_ahorro && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Meta de Ahorro</label>
                    <p className="text-gray-900 text-lg font-semibold">{formatCurrency(cuenta.meta_ahorro)}</p>
                  </div>
                )}
                
                {cuenta.cuota_mensual && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cuota Mensual</label>
                    <p className="text-gray-900">{formatCurrency(cuenta.cuota_mensual)}</p>
                  </div>
                )}
                
                {cuenta.fecha_inicio_programado && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Inicio</label>
                    <p className="text-gray-900">{formatDate(cuenta.fecha_inicio_programado)}</p>
                  </div>
                )}
                
                {cuenta.fecha_fin_programado && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Finalización</label>
                    <p className="text-gray-900">{formatDate(cuenta.fecha_fin_programado)}</p>
                  </div>
                )}
              </>
            )}
            
            {cuenta.tipo_cuenta === 'cdat' && (
              <>
                {cuenta.plazo_dias && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Plazo</label>
                    <p className="text-gray-900">{cuenta.plazo_dias} días</p>
                  </div>
                )}
                
                {cuenta.fecha_apertura_cdat && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Apertura</label>
                    <p className="text-gray-900">{formatDate(cuenta.fecha_apertura_cdat)}</p>
                  </div>
                )}
                
                {cuenta.fecha_vencimiento_cdat && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Vencimiento</label>
                    <p className="text-gray-900">{formatDate(cuenta.fecha_vencimiento_cdat)}</p>
                  </div>
                )}
              </>
            )}
            
            {cuenta.observaciones && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
                <p className="text-gray-900">{cuenta.observaciones}</p>
              </div>
            )}
            
            {!cuenta.meta_ahorro && !cuenta.plazo_dias && !cuenta.observaciones && (
              <p className="text-gray-500">No hay información adicional disponible</p>
            )}
          </div>
        </Card>
      </div>

      {/* Progreso (solo para cuentas programadas) */}
      {cuenta.tipo_cuenta === 'programado' && cuenta.meta_ahorro && (
        <Card className="mt-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Progreso de Ahorro</h2>
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm text-gray-600">
                {formatCurrency(cuenta.saldo_disponible)} de {formatCurrency(cuenta.meta_ahorro)}
              </span>
              <span className="text-sm font-semibold text-gray-900">
                {((cuenta.saldo_disponible / cuenta.meta_ahorro) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className="bg-blue-600 h-4 rounded-full transition-all duration-300"
                style={{ width: `${Math.min((cuenta.saldo_disponible / cuenta.meta_ahorro) * 100, 100)}%` }}
              />
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
