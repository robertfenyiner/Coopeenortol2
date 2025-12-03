import { useState } from 'react';
import { ArrowLeft, Download, User, CreditCard, PiggyBank, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface AportesAsociado {
  total_aportes: number;
  numero_aportes: number;
  ultimo_aporte_fecha: string | null;
  ultimo_aporte_valor: number | null;
}

interface CreditoEstadoCuenta {
  numero_credito: string;
  tipo_credito: string;
  monto_desembolsado: number;
  saldo_capital: number;
  valor_cuota: number;
  estado: string;
  dias_mora: number;
}

interface CuentaAhorroEstadoCuenta {
  numero_cuenta: string;
  tipo_ahorro: string;
  saldo_actual: number;
  estado: string;
}

interface EstadoCuenta {
  asociado_id: number;
  nombres: string;
  apellidos: string;
  numero_documento: string;
  fecha_generacion: string;
  fecha_inicio: string | null;
  fecha_fin: string;
  aportes: AportesAsociado;
  creditos: CreditoEstadoCuenta[];
  cuentas_ahorro: CuentaAhorroEstadoCuenta[];
  total_aportes: number;
  total_deuda: number;
  total_ahorros: number;
  patrimonio_neto: number;
}

export default function EstadoCuentaPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);
  const [estado, setEstado] = useState<EstadoCuenta | null>(null);
  const [numeroDocumento, setNumeroDocumento] = useState('');

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
      al_dia: 'bg-green-100 text-green-800',
      MORA: 'bg-red-100 text-red-800',
      mora: 'bg-red-100 text-red-800',
      CANCELADO: 'bg-gray-100 text-gray-800',
      INACTIVO: 'bg-gray-100 text-gray-800',
    };
    return colors[estado] || 'bg-gray-100 text-gray-800';
  };

  const handleGenerate = async () => {
    if (!numeroDocumento) {
      alert('Por favor ingresa el número de documento');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_URL}/api/v1/reportes/estado-cuenta/${numeroDocumento}`,
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
        alert(`Asociado con documento ${numeroDocumento} no encontrado`);
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
        `${API_URL}/api/v1/reportes/estado-cuenta/${numeroDocumento}/export/pdf`,
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
      link.setAttribute('download', `estado_cuenta_${numeroDocumento}_${today}.pdf`);
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

  const handleExportExcel = async () => {
    try {
      setExportingExcel(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_URL}/api/v1/reportes/estado-cuenta/${numeroDocumento}/export/excel`,
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
      link.setAttribute('download', `estado_cuenta_${numeroDocumento}_${today}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error al exportar Excel:', error);
      alert('Error al exportar el Excel');
    } finally {
      setExportingExcel(false);
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <Input
              label="Número de Documento (Cédula)"
              type="text"
              value={numeroDocumento}
              onChange={(e) => setNumeroDocumento(e.target.value)}
              placeholder="Ej: 94123456"
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
            <>
              <div className="flex items-end gap-2">
                <Button
                  variant="secondary"
                  onClick={handleExportPDF}
                  disabled={exporting}
                  className="flex-1"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {exporting ? 'PDF...' : 'PDF'}
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleExportExcel}
                  disabled={exportingExcel}
                  className="flex-1"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {exportingExcel ? 'Excel...' : 'Excel'}
                </Button>
              </div>
            </>
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
                  <h2 className="text-2xl font-bold text-gray-900">{estado.nombres} {estado.apellidos}</h2>
                  <p className="text-gray-600">Documento: {estado.numero_documento}</p>
                </div>
              </div>
              <span className="px-3 py-1 text-sm font-semibold rounded bg-green-100 text-green-800">
                ACTIVO
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-gray-600">Fecha Inicio</p>
                <p className="text-lg font-semibold text-gray-900">
                  {estado.fecha_inicio ? new Date(estado.fecha_inicio).toLocaleDateString('es-CO') : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Fecha Fin</p>
                <p className="text-lg font-semibold text-gray-900">
                  {new Date(estado.fecha_fin).toLocaleDateString('es-CO')}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Créditos Activos</p>
                <p className="text-lg font-semibold text-gray-900">
                  {estado.creditos.length}
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
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(estado.total_aportes)}
                  </p>
                </div>
                <div className="bg-blue-100 p-3 rounded-lg">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Deuda</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(estado.total_deuda)}
                  </p>
                </div>
                <div className="bg-red-100 p-3 rounded-lg">
                  <CreditCard className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Ahorros</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(estado.total_ahorros)}
                  </p>
                </div>
                <div className="bg-green-100 p-3 rounded-lg">
                  <PiggyBank className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Patrimonio Neto</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(estado.patrimonio_neto)}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${estado.patrimonio_neto >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                  <FileText className={`h-6 w-6 ${estado.patrimonio_neto >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                </div>
              </div>
            </Card>
          </div>

          {/* Aportes */}
          <Card>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Resumen de Aportes</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-700 font-medium mb-1">Número de Aportes</p>
                <p className="text-2xl font-bold text-blue-900">
                  {estado.aportes.numero_aportes}
                </p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-700 font-medium mb-1">Último Aporte</p>
                <p className="text-2xl font-bold text-blue-900">
                  {estado.aportes.ultimo_aporte_valor ? formatCurrency(estado.aportes.ultimo_aporte_valor) : 'N/A'}
                </p>
              </div>
              <div className="bg-blue-100 p-4 rounded-lg border-2 border-blue-300">
                <p className="text-sm text-blue-700 font-medium mb-1">Total Aportes</p>
                <p className="text-2xl font-bold text-blue-900">
                  {formatCurrency(estado.total_aportes)}
                </p>
              </div>
            </div>
            {estado.aportes.ultimo_aporte_fecha && (
              <div className="mt-4 text-sm text-gray-600">
                Fecha último aporte: {new Date(estado.aportes.ultimo_aporte_fecha).toLocaleDateString('es-CO')}
              </div>
            )}
          </Card>

          {/* Créditos */}
          <Card>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Créditos</h3>
            {estado.creditos.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Número</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Tipo</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">Desembolsado</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">Saldo Capital</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">Cuota</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">Días Mora</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {estado.creditos.map((credito, index) => (
                      <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <span className="font-medium text-blue-600">{credito.numero_credito}</span>
                        </td>
                        <td className="py-3 px-4">{credito.tipo_credito}</td>
                        <td className="py-3 px-4 text-right">
                          {formatCurrency(credito.monto_desembolsado)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {formatCurrency(credito.saldo_capital)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {formatCurrency(credito.valor_cuota)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {credito.dias_mora > 0 ? (
                            <span className="text-red-600 font-semibold">{credito.dias_mora}</span>
                          ) : (
                            <span className="text-green-600">0</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getEstadoBadge(credito.estado)}`}>
                            {credito.estado}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No hay créditos activos
              </div>
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
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Número Cuenta</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Tipo</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">Saldo</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {estado.cuentas_ahorro.map((cuenta, index) => (
                      <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <span className="font-medium text-green-600">{cuenta.numero_cuenta}</span>
                        </td>
                        <td className="py-3 px-4">{cuenta.tipo_ahorro}</td>
                        <td className="py-3 px-4 text-right">{formatCurrency(cuenta.saldo_actual)}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getEstadoBadge(cuenta.estado)}`}>
                            {cuenta.estado}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No hay cuentas de ahorro
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
