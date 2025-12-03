import { useState } from 'react';
import { ArrowLeft, Download, AlertTriangle, Phone, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface CreditoMora {
  credito_id: number;
  asociado_id: number;
  asociado_nombre: string;
  asociado_telefono: string | null;
  asociado_email: string | null;
  monto_credito: number;
  saldo_actual: number;
  saldo_vencido: number;
  dias_mora: number;
  rango_mora: string;
  fecha_ultimo_pago: string | null;
  cuotas_vencidas: number;
  provision_requerida: number;
}

interface EstadisticasMora {
  total_creditos_mora: number;
  monto_total_mora: number;
  provision_total: number;
  mora_1_30: number;
  mora_31_60: number;
  mora_61_90: number;
  mora_91_mas: number;
}

interface ReporteMora {
  fecha_reporte: string;
  creditos: CreditoMora[];
  estadisticas: EstadisticasMora;
}

export default function ReporteMoraPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [reporte, setReporte] = useState<ReporteMora | null>(null);
  const [selectedRango, setSelectedRango] = useState<string>('todos');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getRangoBadgeColor = (rango: string) => {
    switch (rango) {
      case '1-30 días':
        return 'bg-yellow-100 text-yellow-800';
      case '31-60 días':
        return 'bg-orange-100 text-orange-800';
      case '61-90 días':
        return 'bg-red-100 text-red-800';
      case '91+ días':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleGenerate = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/v1/reportes/mora`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setReporte(response.data);
    } catch (error) {
      console.error('Error al generar reporte de mora:', error);
      alert('Error al generar el reporte de mora');
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      setExporting(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_URL}/api/v1/reportes/mora/export/excel`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          responseType: 'blob',
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const today = new Date().toISOString().split('T')[0];
      link.setAttribute('download', `reporte_mora_${today}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error al exportar Excel:', error);
      alert('Error al exportar el archivo Excel');
    } finally {
      setExporting(false);
    }
  };

  const filteredCreditos = reporte?.creditos.filter((credito) => {
    if (selectedRango === 'todos') return true;
    return credito.rango_mora === selectedRango;
  }) || [];

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
          <h1 className="text-2xl font-bold text-gray-900">Reporte de Mora</h1>
          <p className="text-gray-600">Análisis de créditos vencidos y morosidad</p>
        </div>
      </div>

      {/* Acciones */}
      <Card>
        <div className="flex gap-4">
          <Button
            variant="primary"
            onClick={handleGenerate}
            disabled={loading}
          >
            {loading ? 'Generando...' : 'Generar Reporte'}
          </Button>
          {reporte && (
            <Button
              variant="secondary"
              onClick={handleExportExcel}
              disabled={exporting}
            >
              <Download className="h-4 w-4 mr-2" />
              {exporting ? 'Exportando...' : 'Exportar Excel'}
            </Button>
          )}
        </div>
      </Card>

      {reporte && (
        <>
          {/* Estadísticas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Créditos en Mora</p>
                  <p className="text-2xl font-bold text-red-600">
                    {reporte.estadisticas.total_creditos_mora}
                  </p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </Card>

            <Card>
              <div>
                <p className="text-sm text-gray-600">Monto Total en Mora</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(reporte.estadisticas.monto_total_mora)}
                </p>
              </div>
            </Card>

            <Card>
              <div>
                <p className="text-sm text-gray-600">Provisión Requerida</p>
                <p className="text-2xl font-bold text-orange-600">
                  {formatCurrency(reporte.estadisticas.provision_total)}
                </p>
              </div>
            </Card>

            <Card>
              <div>
                <p className="text-sm text-gray-600 mb-2">Fecha Reporte</p>
                <p className="text-lg font-semibold text-gray-900">
                  {new Date(reporte.fecha_reporte).toLocaleDateString('es-CO')}
                </p>
              </div>
            </Card>
          </div>

          {/* Distribución por Rango */}
          <Card>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Distribución por Rango de Mora</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-yellow-50 p-4 rounded-lg border-2 border-yellow-200">
                <p className="text-sm text-yellow-700 font-medium">1-30 días</p>
                <p className="text-2xl font-bold text-yellow-800">
                  {formatCurrency(reporte.estadisticas.mora_1_30)}
                </p>
              </div>

              <div className="bg-orange-50 p-4 rounded-lg border-2 border-orange-200">
                <p className="text-sm text-orange-700 font-medium">31-60 días</p>
                <p className="text-2xl font-bold text-orange-800">
                  {formatCurrency(reporte.estadisticas.mora_31_60)}
                </p>
              </div>

              <div className="bg-red-50 p-4 rounded-lg border-2 border-red-200">
                <p className="text-sm text-red-700 font-medium">61-90 días</p>
                <p className="text-2xl font-bold text-red-800">
                  {formatCurrency(reporte.estadisticas.mora_61_90)}
                </p>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg border-2 border-purple-200">
                <p className="text-sm text-purple-700 font-medium">91+ días</p>
                <p className="text-2xl font-bold text-purple-800">
                  {formatCurrency(reporte.estadisticas.mora_91_mas)}
                </p>
              </div>
            </div>
          </Card>

          {/* Filtro */}
          <Card>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedRango('todos')}
                className={`px-4 py-2 rounded ${
                  selectedRango === 'todos'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Todos ({reporte.creditos.length})
              </button>
              {['1-30 días', '31-60 días', '61-90 días', '91+ días'].map((rango) => {
                const count = reporte.creditos.filter(c => c.rango_mora === rango).length;
                return (
                  <button
                    key={rango}
                    onClick={() => setSelectedRango(rango)}
                    className={`px-4 py-2 rounded ${
                      selectedRango === rango
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {rango} ({count})
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Tabla de Créditos */}
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Crédito</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Asociado</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Contacto</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Saldo Vencido</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Días Mora</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Rango</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Cuotas Vencidas</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Provisión</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCreditos.map((credito) => (
                    <tr key={credito.credito_id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <span className="font-medium text-blue-600">#{credito.credito_id}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-gray-900">{credito.asociado_nombre}</p>
                          <p className="text-sm text-gray-500">ID: {credito.asociado_id}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          {credito.asociado_telefono && (
                            <div className="flex items-center text-sm text-gray-600">
                              <Phone className="h-3 w-3 mr-1" />
                              {credito.asociado_telefono}
                            </div>
                          )}
                          {credito.asociado_email && (
                            <div className="flex items-center text-sm text-gray-600">
                              <Mail className="h-3 w-3 mr-1" />
                              {credito.asociado_email}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="font-medium text-red-600">
                          {formatCurrency(credito.saldo_vencido)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="font-bold text-red-600">{credito.dias_mora}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-1 text-xs font-semibold rounded ${getRangoBadgeColor(credito.rango_mora)}`}>
                          {credito.rango_mora}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="text-gray-900">{credito.cuotas_vencidas}</span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="font-medium text-orange-600">
                          {formatCurrency(credito.provision_requerida)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredCreditos.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500">No hay créditos en mora para este filtro</p>
                </div>
              )}
            </div>
          </Card>
        </>
      )}

      {!reporte && !loading && (
        <Card>
          <div className="text-center py-12">
            <AlertTriangle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">
              Haz clic en "Generar Reporte" para ver el análisis de mora actual
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
