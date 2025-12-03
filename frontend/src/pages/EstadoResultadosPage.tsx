import { useState } from 'react';
import { ArrowLeft, Download, TrendingUp, TrendingDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface ConceptoEstadoResultados {
  codigo: string;
  nombre: string;
  monto: number;
  porcentaje_ingresos: number;
}

interface EstadoResultados {
  fecha_inicio: string;
  fecha_fin: string;
  ingresos_operacionales: ConceptoEstadoResultados[];
  ingresos_financieros: ConceptoEstadoResultados[];
  gastos_administrativos: ConceptoEstadoResultados[];
  gastos_financieros: ConceptoEstadoResultados[];
  otros_ingresos: ConceptoEstadoResultados[];
  otros_gastos: ConceptoEstadoResultados[];
  total_ingresos: number;
  total_gastos: number;
  utilidad_operacional: number;
  utilidad_antes_impuestos: number;
  provisiones: number;
  utilidad_neta: number;
  margen_operacional: number;
  margen_neto: number;
}

export default function EstadoResultadosPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [estado, setEstado] = useState<EstadoResultados | null>(null);
  
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const [fechaInicio, setFechaInicio] = useState(firstDayOfMonth.toISOString().split('T')[0]);
  const [fechaFin, setFechaFin] = useState(today.toISOString().split('T')[0]);

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

  const handleGenerate = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/v1/reportes/estado-resultados`, {
        params: {
          fecha_inicio: fechaInicio,
          fecha_fin: fechaFin,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setEstado(response.data);
    } catch (error) {
      console.error('Error al generar estado de resultados:', error);
      alert('Error al generar el estado de resultados');
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      setExporting(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_URL}/api/v1/reportes/estado-resultados/export/pdf`,
        {
          params: {
            fecha_inicio: fechaInicio,
            fecha_fin: fechaFin,
          },
          headers: {
            Authorization: `Bearer ${token}`,
          },
          responseType: 'blob',
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `estado_resultados_${fechaInicio}_${fechaFin}.pdf`);
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

  const renderConceptos = (conceptos: ConceptoEstadoResultados[], title: string, color: string) => {
    if (!conceptos || conceptos.length === 0) return null;

    return (
      <div className="mb-6">
        <h4 className={`font-semibold ${color} mb-2`}>{title}</h4>
        <table className="w-full text-sm">
          <tbody>
            {conceptos.map((concepto, index) => (
              <tr key={index} className="border-b border-gray-100">
                <td className="py-2 text-gray-600">{concepto.codigo}</td>
                <td className="py-2 text-gray-900">{concepto.nombre}</td>
                <td className="py-2 text-right font-medium">{formatCurrency(concepto.monto)}</td>
                <td className="py-2 text-right text-gray-500">
                  {formatPercentage(concepto.porcentaje_ingresos)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
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
          <h1 className="text-2xl font-bold text-gray-900">Estado de Resultados</h1>
          <p className="text-gray-600">Análisis de ingresos y gastos del período</p>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input
            label="Fecha Inicio"
            type="date"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
          />
          <Input
            label="Fecha Fin"
            type="date"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
          />
          <div className="flex items-end">
            <Button
              variant="primary"
              onClick={handleGenerate}
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Generando...' : 'Generar'}
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
          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Ingresos</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(estado.total_ingresos)}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </Card>

            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Gastos</p>
                  <p className="text-2xl font-bold text-red-600">
                    {formatCurrency(estado.total_gastos)}
                  </p>
                </div>
                <TrendingDown className="h-8 w-8 text-red-600" />
              </div>
            </Card>

            <Card>
              <div>
                <p className="text-sm text-gray-600">Utilidad Operacional</p>
                <p className={`text-2xl font-bold ${estado.utilidad_operacional >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(estado.utilidad_operacional)}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Margen: {formatPercentage(estado.margen_operacional)}
                </p>
              </div>
            </Card>

            <Card>
              <div>
                <p className="text-sm text-gray-600">Utilidad Neta</p>
                <p className={`text-2xl font-bold ${estado.utilidad_neta >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(estado.utilidad_neta)}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Margen: {formatPercentage(estado.margen_neto)}
                </p>
              </div>
            </Card>
          </div>

          {/* Estado de Resultados Detallado */}
          <Card>
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-1">Estado de Resultados</h3>
              <p className="text-sm text-gray-600">
                Del {new Date(estado.fecha_inicio).toLocaleDateString('es-CO')} al{' '}
                {new Date(estado.fecha_fin).toLocaleDateString('es-CO')}
              </p>
            </div>

            {/* Ingresos */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-green-700 mb-4 pb-2 border-b-2 border-green-200">
                INGRESOS
              </h3>
              
              {renderConceptos(estado.ingresos_operacionales, 'Ingresos Operacionales', 'text-green-600')}
              {renderConceptos(estado.ingresos_financieros, 'Ingresos Financieros', 'text-green-600')}
              {renderConceptos(estado.otros_ingresos, 'Otros Ingresos', 'text-green-600')}

              <div className="flex justify-between items-center pt-4 border-t-2 border-green-300">
                <span className="font-bold text-lg">TOTAL INGRESOS</span>
                <span className="font-bold text-lg text-green-700">
                  {formatCurrency(estado.total_ingresos)}
                </span>
              </div>
            </div>

            {/* Gastos */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-red-700 mb-4 pb-2 border-b-2 border-red-200">
                GASTOS
              </h3>
              
              {renderConceptos(estado.gastos_administrativos, 'Gastos Administrativos', 'text-red-600')}
              {renderConceptos(estado.gastos_financieros, 'Gastos Financieros', 'text-red-600')}
              {renderConceptos(estado.otros_gastos, 'Otros Gastos', 'text-red-600')}

              <div className="flex justify-between items-center pt-4 border-t-2 border-red-300">
                <span className="font-bold text-lg">TOTAL GASTOS</span>
                <span className="font-bold text-lg text-red-700">
                  {formatCurrency(estado.total_gastos)}
                </span>
              </div>
            </div>

            {/* Resultados */}
            <div className="bg-blue-50 p-6 rounded-lg space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-semibold">Utilidad Operacional</span>
                <span className={`font-semibold ${estado.utilidad_operacional >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(estado.utilidad_operacional)}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="font-semibold">Utilidad Antes de Impuestos</span>
                <span className={`font-semibold ${estado.utilidad_antes_impuestos >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(estado.utilidad_antes_impuestos)}
                </span>
              </div>

              <div className="flex justify-between items-center text-red-600">
                <span className="font-semibold">(-) Provisiones</span>
                <span className="font-semibold">
                  {formatCurrency(estado.provisiones)}
                </span>
              </div>

              <div className="flex justify-between items-center pt-4 border-t-2 border-blue-300">
                <span className="font-bold text-xl">UTILIDAD NETA</span>
                <span className={`font-bold text-xl ${estado.utilidad_neta >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(estado.utilidad_neta)}
                </span>
              </div>
            </div>
          </Card>
        </>
      )}

      {!estado && !loading && (
        <Card>
          <div className="text-center py-12">
            <p className="text-gray-500">
              Selecciona un rango de fechas y haz clic en "Generar" para ver el estado de resultados
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
