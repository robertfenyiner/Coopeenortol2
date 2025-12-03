import { useState } from 'react';
import { ArrowLeft, Download, User, CreditCard, PiggyBank, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface ResumenAportes {
  aportes_obligatorios: number;
  aportes_voluntarios: number;
  total_aportes: number;
}

interface CreditoEstadoCuenta {
  credito_id: number;
  tipo_credito: string;
  monto_original: number;
  saldo_actual: number;
  cuota_mensual: number;
  proxima_cuota: string | null;
  estado: string;
}

interface CuentaAhorroEstadoCuenta {
  cuenta_id: number;
  tipo_ahorro: string;
  saldo_actual: number;
  tasa_interes: number;
  fecha_apertura: string;
  estado: string;
}

interface EstadoCuenta {
  asociado_id: number;
  asociado_nombre: string;
  fecha_vinculacion: string;
  estado_asociado: string;
  fecha_reporte: string;
  resumen_aportes: ResumenAportes;
  creditos: CreditoEstadoCuenta[];
  cuentas_ahorro: CuentaAhorroEstadoCuenta[];
  total_creditos_activos: number;
  total_deuda: number;
  total_ahorros: number;
  patrimonio_neto: number;
}

export default function EstadoCuentaPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [estado, setEstado] = useState<EstadoCuenta | null>(null);
  const [asociadoId, setAsociadoId] = useState('');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getEstadoBadge = (estado: string) => {
    const colors: Record<string, string> = {
      ACTIVO: 'bg-green-100 text-green-800',
      AL_DIA: 'bg-green-100 text-green-800',
      MORA: 'bg-red-100 text-red-800',
      CANCELADO: 'bg-gray-100 text-gray-800',
      INACTIVO: 'bg-gray-100 text-gray-800',
    };
    return colors[estado] || 'bg-gray-100 text-gray-800';
  };

  const handleGenerate = async () => {
    if (!asociadoId) {
      alert('Por favor ingresa el ID del asociado');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_URL}/api/v1/reportes/estado-cuenta/${asociadoId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setEstado(response.data);
    } catch (error: any) {
      console.error('Error al generar estado de cuenta:', error);
      if (error.response?.status === 404) {
        alert('Asociado no encontrado');
      } else {
        alert('Error al generar el estado de cuenta');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      setExporting(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_URL}/api/v1/reportes/estado-cuenta/${asociadoId}/export/pdf`,
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
      link.setAttribute('download', `estado_cuenta_${asociadoId}_${today}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error al exportar PDF:', error);
      alert('Error al exportar el PDF');
    } finally {
      setExporting(false);
    }
  };

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
          <h1 className="text-2xl font-bold text-gray-900">Estado de Cuenta</h1>
          <p className="text-gray-600">Resumen financiero del asociado</p>
        </div>
      </div>

      {/* Búsqueda */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1">
            <Input
              label="ID Asociado"
              type="number"
              value={asociadoId}
              onChange={(e) => setAsociadoId(e.target.value)}
              placeholder="Ingresa el ID del asociado"
            />
          </div>
          <div className="flex items-end">
            <Button
              variant="primary"
              onClick={handleGenerate}
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Generando...' : 'Generar Estado de Cuenta'}
            </Button>
          </div>
          {estado && (
            <div className="flex items-end">
              <Button
                variant="secondary"
                onClick={handleExportPDF}
                disabled={exporting}
                className="w-full"
              >
                <Download className="h-4 w-4 mr-2" />
                {exporting ? 'Exportando...' : 'Exportar PDF'}
              </Button>
            </div>
          )}
        </div>
      </Card>

      {estado && (
        <>
          {/* Información del Asociado */}
          <Card>
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center">
                <div className="bg-blue-100 p-4 rounded-full mr-4">
                  <User className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{estado.asociado_nombre}</h2>
                  <p className="text-gray-600">ID: {estado.asociado_id}</p>
                </div>
              </div>
              <span className={`px-3 py-1 text-sm font-semibold rounded ${getEstadoBadge(estado.estado_asociado)}`}>
                {estado.estado_asociado}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-gray-600">Fecha Vinculación</p>
                <p className="text-lg font-semibold text-gray-900">
                  {new Date(estado.fecha_vinculacion).toLocaleDateString('es-CO')}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Fecha Reporte</p>
                <p className="text-lg font-semibold text-gray-900">
                  {new Date(estado.fecha_reporte).toLocaleDateString('es-CO')}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Créditos Activos</p>
                <p className="text-lg font-semibold text-gray-900">
                  {estado.total_creditos_activos}
                </p>
              </div>
            </div>
          </Card>

          {/* Resumen Financiero */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Aportes</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatCurrency(estado.resumen_aportes.total_aportes)}
                  </p>
                </div>
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
            </Card>

            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Deuda</p>
                  <p className="text-2xl font-bold text-red-600">
                    {formatCurrency(estado.total_deuda)}
                  </p>
                </div>
                <CreditCard className="h-8 w-8 text-red-600" />
              </div>
            </Card>

            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Ahorros</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(estado.total_ahorros)}
                  </p>
                </div>
                <PiggyBank className="h-8 w-8 text-green-600" />
              </div>
            </Card>

            <Card>
              <div>
                <p className="text-sm text-gray-600">Patrimonio Neto</p>
                <p className={`text-2xl font-bold ${estado.patrimonio_neto >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(estado.patrimonio_neto)}
                </p>
              </div>
            </Card>
          </div>

          {/* Aportes */}
          <Card>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Resumen de Aportes</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-700 font-medium mb-1">Aportes Obligatorios</p>
                <p className="text-2xl font-bold text-blue-900">
                  {formatCurrency(estado.resumen_aportes.aportes_obligatorios)}
                </p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-700 font-medium mb-1">Aportes Voluntarios</p>
                <p className="text-2xl font-bold text-blue-900">
                  {formatCurrency(estado.resumen_aportes.aportes_voluntarios)}
                </p>
              </div>
              <div className="bg-blue-100 p-4 rounded-lg border-2 border-blue-300">
                <p className="text-sm text-blue-700 font-medium mb-1">Total Aportes</p>
                <p className="text-2xl font-bold text-blue-900">
                  {formatCurrency(estado.resumen_aportes.total_aportes)}
                </p>
              </div>
            </div>
          </Card>

          {/* Créditos */}
          <Card>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Créditos</h3>
            {estado.creditos.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">ID</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Tipo</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">Monto Original</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">Saldo Actual</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">Cuota Mensual</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Próxima Cuota</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {estado.creditos.map((credito) => (
                      <tr key={credito.credito_id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <span className="font-medium text-blue-600">#{credito.credito_id}</span>
                        </td>
                        <td className="py-3 px-4 text-gray-900">{credito.tipo_credito}</td>
                        <td className="py-3 px-4 text-right text-gray-900">
                          {formatCurrency(credito.monto_original)}
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-red-600">
                          {formatCurrency(credito.saldo_actual)}
                        </td>
                        <td className="py-3 px-4 text-right text-gray-900">
                          {formatCurrency(credito.cuota_mensual)}
                        </td>
                        <td className="py-3 px-4 text-gray-900">
                          {credito.proxima_cuota
                            ? new Date(credito.proxima_cuota).toLocaleDateString('es-CO')
                            : 'N/A'}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-1 text-xs font-semibold rounded ${getEstadoBadge(credito.estado)}`}>
                            {credito.estado}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No hay créditos registrados</p>
            )}
          </Card>

          {/* Cuentas de Ahorro */}
          <Card>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Cuentas de Ahorro</h3>
            {estado.cuentas_ahorro.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">ID</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Tipo</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">Saldo</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">Tasa Interés</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Fecha Apertura</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {estado.cuentas_ahorro.map((cuenta) => (
                      <tr key={cuenta.cuenta_id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <span className="font-medium text-green-600">#{cuenta.cuenta_id}</span>
                        </td>
                        <td className="py-3 px-4 text-gray-900">{cuenta.tipo_ahorro}</td>
                        <td className="py-3 px-4 text-right font-medium text-green-600">
                          {formatCurrency(cuenta.saldo_actual)}
                        </td>
                        <td className="py-3 px-4 text-right text-gray-900">
                          {cuenta.tasa_interes}%
                        </td>
                        <td className="py-3 px-4 text-gray-900">
                          {new Date(cuenta.fecha_apertura).toLocaleDateString('es-CO')}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-1 text-xs font-semibold rounded ${getEstadoBadge(cuenta.estado)}`}>
                            {cuenta.estado}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No hay cuentas de ahorro registradas</p>
            )}
          </Card>
        </>
      )}

      {!estado && !loading && (
        <Card>
          <div className="text-center py-12">
            <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">
              Ingresa el ID del asociado y haz clic en "Generar Estado de Cuenta"
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
