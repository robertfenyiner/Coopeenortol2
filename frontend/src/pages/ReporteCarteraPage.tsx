import React, { useState } from 'react';
import axios from 'axios';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import { useToast } from '../contexts/ToastContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

interface CreditoCartera {
  numero_credito: string;
  asociado_nombre: string;
  asociado_documento: string;
  tipo_credito: string;
  monto_desembolsado: number;
  saldo_capital: number;
  saldo_interes: number;
  saldo_mora: number;
  dias_mora: number;
  estado: string;
  fecha_desembolso: string | null;
  fecha_ultimo_pago: string | null;
}

interface EstadisticasCartera {
  total_creditos: number;
  cartera_total: number;
  cartera_al_dia: number;
  cartera_mora: number;
  cartera_castigada: number;
  tasa_mora: number;
  creditos_mora: number;
  monto_provision: number;
}

interface ReporteCartera {
  fecha_corte: string;
  estadisticas: EstadisticasCartera;
  creditos: CreditoCartera[];
  por_tipo: Record<string, { total: number; creditos: number }>;
}

const ReporteCarteraPage: React.FC = () => {
  const [fechaCorte, setFechaCorte] = useState(new Date().toISOString().split('T')[0]);
  const [reporte, setReporte] = useState<ReporteCartera | null>(null);
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  const cargarReporte = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/reportes/cartera`, {
        params: { fecha_corte: fechaCorte },
        headers: { Authorization: `Bearer ${token}` }
      });
      setReporte(response.data);
    } catch (error: any) {
      addToast(
        error.response?.data?.detail || 'Error al cargar reporte de cartera',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const exportarExcel = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/reportes/cartera/export/excel`, {
        params: { fecha_corte: fechaCorte },
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `cartera_${fechaCorte}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      addToast('Reporte exportado correctamente', 'success');
    } catch (error: any) {
      addToast('Error al exportar reporte', 'error');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(value);
  };

  const getEstadoBadge = (estado: string) => {
    const badges: Record<string, string> = {
      'al_dia': 'bg-green-100 text-green-800',
      'mora': 'bg-red-100 text-red-800',
      'desembolsado': 'bg-blue-100 text-blue-800',
      'castigado': 'bg-gray-100 text-gray-800'
    };
    return badges[estado] || 'bg-gray-100 text-gray-800';
  };

  const getEstadoLabel = (estado: string) => {
    const labels: Record<string, string> = {
      'al_dia': 'Al Día',
      'mora': 'En Mora',
      'desembolsado': 'Desembolsado',
      'castigado': 'Castigado'
    };
    return labels[estado] || estado;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reporte de Cartera</h1>
          <p className="mt-2 text-gray-600">
            Análisis completo de la cartera de créditos
          </p>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <div className="p-6">
          <div className="flex items-end space-x-4">
            <div className="flex-1">
              <Input
                label="Fecha de Corte"
                type="date"
                value={fechaCorte}
                onChange={(e) => setFechaCorte(e.target.value)}
              />
            </div>
            <Button
              variant="primary"
              onClick={cargarReporte}
              disabled={loading}
            >
              {loading ? 'Cargando...' : 'Generar Reporte'}
            </Button>
            {reporte && (
              <Button
                variant="secondary"
                onClick={exportarExcel}
              >
                📊 Exportar Excel
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Estadísticas */}
      {reporte && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-blue-50">
              <div className="p-6">
                <div className="text-sm font-medium text-blue-600 mb-1">Cartera Total</div>
                <div className="text-2xl font-bold text-blue-900">
                  {formatCurrency(reporte.estadisticas.cartera_total)}
                </div>
                <div className="text-xs text-blue-600 mt-1">
                  {reporte.estadisticas.total_creditos} créditos
                </div>
              </div>
            </Card>

            <Card className="bg-green-50">
              <div className="p-6">
                <div className="text-sm font-medium text-green-600 mb-1">Cartera Al Día</div>
                <div className="text-2xl font-bold text-green-900">
                  {formatCurrency(reporte.estadisticas.cartera_al_dia)}
                </div>
                <div className="text-xs text-green-600 mt-1">
                  {((reporte.estadisticas.cartera_al_dia / reporte.estadisticas.cartera_total) * 100).toFixed(1)}%
                </div>
              </div>
            </Card>

            <Card className="bg-red-50">
              <div className="p-6">
                <div className="text-sm font-medium text-red-600 mb-1">Cartera en Mora</div>
                <div className="text-2xl font-bold text-red-900">
                  {formatCurrency(reporte.estadisticas.cartera_mora)}
                </div>
                <div className="text-xs text-red-600 mt-1">
                  Tasa: {reporte.estadisticas.tasa_mora.toFixed(2)}%
                </div>
              </div>
            </Card>

            <Card className="bg-purple-50">
              <div className="p-6">
                <div className="text-sm font-medium text-purple-600 mb-1">Provisión</div>
                <div className="text-2xl font-bold text-purple-900">
                  {formatCurrency(reporte.estadisticas.monto_provision)}
                </div>
                <div className="text-xs text-purple-600 mt-1">
                  {reporte.estadisticas.creditos_mora} créditos en mora
                </div>
              </div>
            </Card>
          </div>

          {/* Distribución por Tipo */}
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Distribución por Tipo de Crédito
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(reporte.por_tipo).map(([tipo, datos]) => (
                  <div key={tipo} className="border rounded-lg p-4">
                    <div className="text-sm font-medium text-gray-600 capitalize mb-1">
                      {tipo.replace('_', ' ')}
                    </div>
                    <div className="text-xl font-bold text-gray-900">
                      {formatCurrency(datos.total)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {datos.creditos} crédito{datos.creditos !== 1 ? 's' : ''}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Tabla de Créditos */}
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Detalle de Créditos ({reporte.creditos.length})
              </h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Número
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Asociado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Tipo
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Desembolsado
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Saldo
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                        Días Mora
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                        Estado
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reporte.creditos.map((credito) => (
                      <tr key={credito.numero_credito}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {credito.numero_credito}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <div>{credito.asociado_nombre}</div>
                          <div className="text-xs text-gray-500">
                            {credito.asociado_documento}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                          {credito.tipo_credito.replace('_', ' ')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                          {formatCurrency(credito.monto_desembolsado)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                          {formatCurrency(credito.saldo_capital)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                          {credito.dias_mora > 0 ? (
                            <span className="text-red-600 font-semibold">
                              {credito.dias_mora}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getEstadoBadge(credito.estado)}`}>
                            {getEstadoLabel(credito.estado)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        </div>
      )}

      {!reporte && !loading && (
        <Card>
          <div className="p-12 text-center">
            <div className="text-6xl mb-4">💰</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Selecciona una fecha y genera el reporte
            </h3>
            <p className="text-gray-600">
              El reporte mostrará el análisis completo de la cartera de créditos
            </p>
          </div>
        </Card>
      )}
    </div>
  );
};

export default ReporteCarteraPage;
