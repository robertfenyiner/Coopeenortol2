import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import { useToast } from '../contexts/ToastContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

interface CuentaBalance {
  codigo: string;
  nombre: string;
  saldo: number;
}

interface GrupoBalance {
  nombre: string;
  total: number;
  cuentas: CuentaBalance[];
}

interface BalanceGeneral {
  fecha_corte: string;
  activos: GrupoBalance[];
  pasivos: GrupoBalance[];
  patrimonio: GrupoBalance[];
  total_activos: number;
  total_pasivos: number;
  total_patrimonio: number;
  cuadrado: boolean;
}

const BalanceGeneralPage: React.FC = () => {
  const [fechaCorte, setFechaCorte] = useState(new Date().toISOString().split('T')[0]);
  const [balance, setBalance] = useState<BalanceGeneral | null>(null);
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  const cargarBalance = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/reportes/balance-general`, {
        params: { fecha_corte: fechaCorte },
        headers: { Authorization: `Bearer ${token}` }
      });
      setBalance(response.data);
    } catch (error: any) {
      addToast(
        error.response?.data?.detail || 'Error al cargar balance general',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(value);
  };

  const exportarPDF = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/reportes/balance-general/export/pdf`, {
        params: { fecha_corte: fechaCorte },
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `balance_general_${fechaCorte}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      addToast('Balance exportado correctamente', 'success');
    } catch (error: any) {
      addToast('Error al exportar balance', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Balance General</h1>
          <p className="mt-2 text-gray-600">
            Estado de activos, pasivos y patrimonio
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
              onClick={cargarBalance}
              disabled={loading}
            >
              {loading ? 'Cargando...' : 'Generar Balance'}
            </Button>
            {balance && (
              <Button
                variant="secondary"
                onClick={exportarPDF}
              >
                📄 Exportar PDF
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Resultado */}
      {balance && (
        <div className="space-y-6">
          {/* Indicador de Cuadre */}
          <Card className={balance.cuadrado ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}>
            <div className="p-4">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">{balance.cuadrado ? '✅' : '❌'}</span>
                <span className={`font-semibold ${balance.cuadrado ? 'text-green-800' : 'text-red-800'}`}>
                  {balance.cuadrado ? 'Balance Cuadrado' : 'Balance Descuadrado'}
                </span>
              </div>
            </div>
          </Card>

          {/* Resumen */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-blue-50">
              <div className="p-6">
                <div className="text-sm font-medium text-blue-600 mb-1">Total Activos</div>
                <div className="text-2xl font-bold text-blue-900">
                  {formatCurrency(balance.total_activos)}
                </div>
              </div>
            </Card>
            <Card className="bg-red-50">
              <div className="p-6">
                <div className="text-sm font-medium text-red-600 mb-1">Total Pasivos</div>
                <div className="text-2xl font-bold text-red-900">
                  {formatCurrency(balance.total_pasivos)}
                </div>
              </div>
            </Card>
            <Card className="bg-green-50">
              <div className="p-6">
                <div className="text-sm font-medium text-green-600 mb-1">Total Patrimonio</div>
                <div className="text-2xl font-bold text-green-900">
                  {formatCurrency(balance.total_patrimonio)}
                </div>
              </div>
            </Card>
          </div>

          {/* Detalle de Activos */}
          {balance.activos.map((grupo, idx) => (
            <Card key={idx}>
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-blue-900">{grupo.nombre}</h2>
                  <span className="text-lg font-semibold text-blue-700">
                    {formatCurrency(grupo.total)}
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Código
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Cuenta
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          Saldo
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {grupo.cuentas.map((cuenta, cidx) => (
                        <tr key={cidx}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {cuenta.codigo}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {cuenta.nombre}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                            {formatCurrency(cuenta.saldo)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </Card>
          ))}

          {/* Detalle de Pasivos */}
          {balance.pasivos.map((grupo, idx) => (
            <Card key={idx}>
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-red-900">{grupo.nombre}</h2>
                  <span className="text-lg font-semibold text-red-700">
                    {formatCurrency(grupo.total)}
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Código
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Cuenta
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          Saldo
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {grupo.cuentas.map((cuenta, cidx) => (
                        <tr key={cidx}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {cuenta.codigo}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {cuenta.nombre}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                            {formatCurrency(cuenta.saldo)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </Card>
          ))}

          {/* Detalle de Patrimonio */}
          {balance.patrimonio.map((grupo, idx) => (
            <Card key={idx}>
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-green-900">{grupo.nombre}</h2>
                  <span className="text-lg font-semibold text-green-700">
                    {formatCurrency(grupo.total)}
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Código
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Cuenta
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          Saldo
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {grupo.cuentas.map((cuenta, cidx) => (
                        <tr key={cidx}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {cuenta.codigo}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {cuenta.nombre}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                            {formatCurrency(cuenta.saldo)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {!balance && !loading && (
        <Card>
          <div className="p-12 text-center">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Selecciona una fecha y genera el balance
            </h3>
            <p className="text-gray-600">
              El balance mostrará el estado de activos, pasivos y patrimonio
            </p>
          </div>
        </Card>
      )}
    </div>
  );
};

export default BalanceGeneralPage;
