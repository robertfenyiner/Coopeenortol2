import { useState, useEffect } from 'react';
import { ArrowLeft, Users, CreditCard, PiggyBank, TrendingUp, AlertTriangle, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Card from '../components/ui/Card';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface EstadisticasAsociados {
  total_asociados: number;
  asociados_activos: number;
  asociados_inactivos: number;
  nuevos_mes_actual: number;
}

interface EstadisticasCreditos {
  total_creditos: number;
  creditos_activos: number;
  creditos_mora: number;
  monto_total_cartera: number;
  monto_total_mora: number;
  tasa_morosidad: number;
}

interface EstadisticasAhorros {
  total_cuentas: number;
  cuentas_activas: number;
  monto_total_ahorros: number;
  promedio_saldo: number;
}

interface EstadisticasFinancieras {
  total_activos: number;
  total_pasivos: number;
  total_patrimonio: number;
  utilidad_mes_actual: number;
  rentabilidad: number;
}

interface EstadisticasGenerales {
  fecha_reporte: string;
  asociados: EstadisticasAsociados;
  creditos: EstadisticasCreditos;
  ahorros: EstadisticasAhorros;
  financiero: EstadisticasFinancieras;
}

export default function EstadisticasGeneralesPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [estadisticas, setEstadisticas] = useState<EstadisticasGenerales | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const fetchEstadisticas = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/v1/reportes/estadisticas`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setEstadisticas(response.data);
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
      alert('Error al cargar las estadísticas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEstadisticas();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando estadísticas...</p>
        </div>
      </div>
    );
  }

  if (!estadisticas) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">No se pudieron cargar las estadísticas</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <button
            onClick={() => navigate('/reportes')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Volver a Reportes
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Estadísticas Generales</h1>
          <p className="text-gray-600">
            Reporte al {new Date(estadisticas.fecha_reporte).toLocaleDateString('es-CO')}
          </p>
        </div>
      </div>

      {/* Estadísticas Asociados */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
          <Users className="h-6 w-6 mr-2 text-blue-600" />
          Asociados
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Asociados</p>
                <p className="text-3xl font-bold text-blue-600">
                  {estadisticas.asociados.total_asociados}
                </p>
              </div>
              <Users className="h-12 w-12 text-blue-600 opacity-20" />
            </div>
          </Card>

          <Card>
            <div>
              <p className="text-sm text-gray-600">Activos</p>
              <p className="text-3xl font-bold text-green-600">
                {estadisticas.asociados.asociados_activos}
              </p>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full"
                  style={{
                    width: `${(estadisticas.asociados.asociados_activos / estadisticas.asociados.total_asociados) * 100}%`,
                  }}
                />
              </div>
            </div>
          </Card>

          <Card>
            <div>
              <p className="text-sm text-gray-600">Inactivos</p>
              <p className="text-3xl font-bold text-gray-600">
                {estadisticas.asociados.asociados_inactivos}
              </p>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gray-600 h-2 rounded-full"
                  style={{
                    width: `${(estadisticas.asociados.asociados_inactivos / estadisticas.asociados.total_asociados) * 100}%`,
                  }}
                />
              </div>
            </div>
          </Card>

          <Card>
            <div>
              <p className="text-sm text-gray-600">Nuevos Este Mes</p>
              <p className="text-3xl font-bold text-blue-600">
                {estadisticas.asociados.nuevos_mes_actual}
              </p>
              <p className="text-xs text-green-600 mt-1 flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" />
                Crecimiento mensual
              </p>
            </div>
          </Card>
        </div>
      </div>

      {/* Estadísticas Créditos */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
          <CreditCard className="h-6 w-6 mr-2 text-purple-600" />
          Cartera de Créditos
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <div>
              <p className="text-sm text-gray-600">Total Créditos</p>
              <p className="text-3xl font-bold text-purple-600">
                {estadisticas.creditos.total_creditos}
              </p>
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-green-600">Activos:</span>
                  <span className="font-semibold">{estadisticas.creditos.creditos_activos}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-red-600">En Mora:</span>
                  <span className="font-semibold">{estadisticas.creditos.creditos_mora}</span>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div>
              <p className="text-sm text-gray-600">Monto Total Cartera</p>
              <p className="text-2xl font-bold text-purple-600">
                {formatCurrency(estadisticas.creditos.monto_total_cartera)}
              </p>
              <div className="mt-4">
                <p className="text-xs text-gray-600">Monto en Mora:</p>
                <p className="text-lg font-semibold text-red-600">
                  {formatCurrency(estadisticas.creditos.monto_total_mora)}
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tasa de Morosidad</p>
                <p className={`text-3xl font-bold ${estadisticas.creditos.tasa_morosidad > 5 ? 'text-red-600' : 'text-yellow-600'}`}>
                  {formatPercentage(estadisticas.creditos.tasa_morosidad)}
                </p>
                {estadisticas.creditos.tasa_morosidad > 5 && (
                  <p className="text-xs text-red-600 mt-2 flex items-center">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Requiere atención
                  </p>
                )}
              </div>
              <AlertTriangle className={`h-12 w-12 ${estadisticas.creditos.tasa_morosidad > 5 ? 'text-red-600' : 'text-yellow-600'} opacity-20`} />
            </div>
          </Card>
        </div>
      </div>

      {/* Estadísticas Ahorros */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
          <PiggyBank className="h-6 w-6 mr-2 text-green-600" />
          Ahorros
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <div>
              <p className="text-sm text-gray-600">Total Cuentas</p>
              <p className="text-3xl font-bold text-green-600">
                {estadisticas.ahorros.total_cuentas}
              </p>
            </div>
          </Card>

          <Card>
            <div>
              <p className="text-sm text-gray-600">Cuentas Activas</p>
              <p className="text-3xl font-bold text-green-600">
                {estadisticas.ahorros.cuentas_activas}
              </p>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full"
                  style={{
                    width: `${(estadisticas.ahorros.cuentas_activas / estadisticas.ahorros.total_cuentas) * 100}%`,
                  }}
                />
              </div>
            </div>
          </Card>

          <Card>
            <div>
              <p className="text-sm text-gray-600">Monto Total</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(estadisticas.ahorros.monto_total_ahorros)}
              </p>
            </div>
          </Card>

          <Card>
            <div>
              <p className="text-sm text-gray-600">Promedio por Cuenta</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(estadisticas.ahorros.promedio_saldo)}
              </p>
            </div>
          </Card>
        </div>
      </div>

      {/* Estadísticas Financieras */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
          <FileText className="h-6 w-6 mr-2 text-indigo-600" />
          Resumen Financiero
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Balance General</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-3 border-b">
                <span className="text-gray-600">Activos</span>
                <span className="text-xl font-bold text-blue-600">
                  {formatCurrency(estadisticas.financiero.total_activos)}
                </span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b">
                <span className="text-gray-600">Pasivos</span>
                <span className="text-xl font-bold text-red-600">
                  {formatCurrency(estadisticas.financiero.total_pasivos)}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 bg-indigo-50 -mx-6 px-6 py-3 rounded-lg">
                <span className="font-semibold text-gray-900">Patrimonio</span>
                <span className="text-2xl font-bold text-indigo-600">
                  {formatCurrency(estadisticas.financiero.total_patrimonio)}
                </span>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Rentabilidad</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">Utilidad Mes Actual</p>
                <p className={`text-3xl font-bold ${estadisticas.financiero.utilidad_mes_actual >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(estadisticas.financiero.utilidad_mes_actual)}
                </p>
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm text-gray-600 mb-2">ROE (Return on Equity)</p>
                <p className={`text-3xl font-bold ${estadisticas.financiero.rentabilidad >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatPercentage(estadisticas.financiero.rentabilidad)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Utilidad / Patrimonio
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Resumen Ejecutivo */}
      <Card>
        <h3 className="text-lg font-bold text-gray-900 mb-4">Resumen Ejecutivo</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-gray-700 mb-3">Fortalezas</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>
                  {estadisticas.asociados.asociados_activos} asociados activos (
                  {formatPercentage((estadisticas.asociados.asociados_activos / estadisticas.asociados.total_asociados) * 100)})
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>
                  Patrimonio sólido de {formatCurrency(estadisticas.financiero.total_patrimonio)}
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>
                  Ahorros totales: {formatCurrency(estadisticas.ahorros.monto_total_ahorros)}
                </span>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-700 mb-3">Áreas de Atención</h4>
            <ul className="space-y-2 text-sm">
              {estadisticas.creditos.tasa_morosidad > 5 && (
                <li className="flex items-start">
                  <span className="text-red-500 mr-2">⚠</span>
                  <span>
                    Tasa de morosidad elevada ({formatPercentage(estadisticas.creditos.tasa_morosidad)})
                  </span>
                </li>
              )}
              {estadisticas.creditos.creditos_mora > 0 && (
                <li className="flex items-start">
                  <span className="text-yellow-500 mr-2">⚠</span>
                  <span>
                    {estadisticas.creditos.creditos_mora} créditos en mora requieren seguimiento
                  </span>
                </li>
              )}
              {estadisticas.asociados.asociados_inactivos > 0 && (
                <li className="flex items-start">
                  <span className="text-yellow-500 mr-2">⚠</span>
                  <span>
                    {estadisticas.asociados.asociados_inactivos} asociados inactivos - oportunidad de reactivación
                  </span>
                </li>
              )}
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
