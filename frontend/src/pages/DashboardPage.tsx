import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, CreditCard, PiggyBank, TrendingUp, TrendingDown, DollarSign, AlertCircle } from 'lucide-react';
import Card from '../components/ui/Card';
import api from '../lib/axios';
import { formatCurrency } from '../lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: number;
  bgColor: string;
  iconColor: string;
}

function StatCard({ title, value, icon, trend, bgColor, iconColor }: StatCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <div className="flex items-center">
        <div className={`flex-shrink-0 ${bgColor} rounded-lg p-3`}>
          <div className={iconColor}>{icon}</div>
        </div>
        <div className="ml-4 flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
          {trend !== undefined && (
            <div className="flex items-center mt-1">
              {trend >= 0 ? (
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
              )}
              <span
                className={`text-xs font-medium ${
                  trend >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {Math.abs(trend)}%
              </span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

interface KPIData {
  asociados: {
    total: number;
    nuevos_mes: number;
    crecimiento_porcentaje: number;
  };
  ahorros: {
    total: number;
    crecimiento_porcentaje: number;
  };
  cartera: {
    total: number;
    creditos_vigentes: number;
    creditos_mora: number;
    crecimiento_porcentaje: number;
  };
  mora: {
    indice_porcentaje: number;
    total_creditos_mora: number;
  };
}

interface ActividadReciente {
  creditos_recientes: Array<{
    id: number;
    numero_credito: string;
    asociado_nombre: string;
    monto: number;
    estado: string;
    fecha: string;
  }>;
  consignaciones_recientes: Array<{
    id: number;
    numero_movimiento: string;
    cuenta_numero: string;
    asociado_nombre: string;
    valor: number;
    fecha: string;
  }>;
  asociados_recientes: Array<{
    id: number;
    numero_documento: string;
    nombre_completo: string;
    estado: string;
    fecha_ingreso: string;
  }>;
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [kpis, setKpis] = useState<KPIData | null>(null);
  const [actividad, setActividad] = useState<ActividadReciente | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [kpisRes, actividadRes] = await Promise.all([
        api.get('/dashboard/kpis'),
        api.get('/dashboard/actividad-reciente'),
      ]);

      setKpis(kpisRes.data);
      setActividad(actividadRes.data);
    } catch (error) {
      console.error('Error al cargar datos del dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-sm text-gray-600">
          Panel de control con métricas y actividad en tiempo real
        </p>
      </div>

      {/* KPIs principales */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard
          title="Asociados Activos"
          value={kpis?.asociados.total || 0}
          icon={<Users className="w-6 h-6" />}
          trend={kpis?.asociados.crecimiento_porcentaje}
          bgColor="bg-blue-100"
          iconColor="text-blue-600"
        />
        <StatCard
          title="Total Ahorros"
          value={formatCurrency(kpis?.ahorros.total || 0)}
          icon={<PiggyBank className="w-6 h-6" />}
          trend={kpis?.ahorros.crecimiento_porcentaje}
          bgColor="bg-purple-100"
          iconColor="text-purple-600"
        />
        <StatCard
          title="Cartera Total"
          value={formatCurrency(kpis?.cartera.total || 0)}
          icon={<DollarSign className="w-6 h-6" />}
          trend={kpis?.cartera.crecimiento_porcentaje}
          bgColor="bg-green-100"
          iconColor="text-green-600"
        />
        <StatCard
          title="Índice de Mora"
          value={`${kpis?.mora.indice_porcentaje.toFixed(1) || 0}%`}
          icon={<AlertCircle className="w-6 h-6" />}
          bgColor="bg-red-100"
          iconColor="text-red-600"
        />
      </div>

      {/* Información adicional */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 mb-8">
        <Card>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-600">Nuevos Asociados (Este Mes)</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">{kpis?.asociados.nuevos_mes || 0}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-600">Créditos Vigentes</p>
            <p className="text-3xl font-bold text-green-600 mt-2">{kpis?.cartera.creditos_vigentes || 0}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-600">Créditos en Mora</p>
            <p className="text-3xl font-bold text-red-600 mt-2">{kpis?.cartera.creditos_mora || 0}</p>
          </div>
        </Card>
      </div>

      {/* Actividad Reciente */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-8">
        {/* Últimos Créditos */}
        <Card title="Últimos Créditos Desembolsados">
          <div className="space-y-3">
            {actividad?.creditos_recientes.slice(0, 5).map((credito) => (
              <div key={credito.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{credito.asociado_nombre}</p>
                  <p className="text-xs text-gray-500">{credito.numero_credito}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-green-600">{formatCurrency(credito.monto)}</p>
                  <p className="text-xs text-gray-500">
                    {credito.fecha ? new Date(credito.fecha).toLocaleDateString('es-CO') : 'N/A'}
                  </p>
                </div>
              </div>
            ))}
            {(!actividad?.creditos_recientes || actividad.creditos_recientes.length === 0) && (
              <p className="text-sm text-gray-500 text-center py-4">No hay créditos recientes</p>
            )}
          </div>
          <button
            onClick={() => navigate('/creditos')}
            className="mt-4 w-full text-sm text-blue-600 hover:text-blue-700 font-medium text-center"
          >
            Ver todos los créditos →
          </button>
        </Card>

        {/* Últimas Consignaciones */}
        <Card title="Últimas Consignaciones">
          <div className="space-y-3">
            {actividad?.consignaciones_recientes.slice(0, 5).map((consignacion) => (
              <div key={consignacion.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{consignacion.asociado_nombre}</p>
                  <p className="text-xs text-gray-500">{consignacion.cuenta_numero}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-purple-600">{formatCurrency(consignacion.valor)}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(consignacion.fecha).toLocaleDateString('es-CO')}
                  </p>
                </div>
              </div>
            ))}
            {(!actividad?.consignaciones_recientes || actividad.consignaciones_recientes.length === 0) && (
              <p className="text-sm text-gray-500 text-center py-4">No hay consignaciones recientes</p>
            )}
          </div>
          <button
            onClick={() => navigate('/ahorros')}
            className="mt-4 w-full text-sm text-blue-600 hover:text-blue-700 font-medium text-center"
          >
            Ver cuentas de ahorro →
          </button>
        </Card>
      </div>

      {/* Nuevos Asociados */}
      <Card title="Nuevos Asociados" className="mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {actividad?.asociados_recientes.slice(0, 6).map((asociado) => (
            <div 
              key={asociado.id} 
              className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
              onClick={() => navigate(`/asociados/${asociado.id}`)}
            >
              <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-900">{asociado.nombre_completo}</p>
                <p className="text-xs text-gray-500">{asociado.numero_documento}</p>
              </div>
            </div>
          ))}
          {(!actividad?.asociados_recientes || actividad.asociados_recientes.length === 0) && (
            <p className="text-sm text-gray-500 text-center py-4 col-span-full">No hay asociados recientes</p>
          )}
        </div>
        <button
          onClick={() => navigate('/asociados')}
          className="mt-4 w-full text-sm text-blue-600 hover:text-blue-700 font-medium text-center"
        >
          Ver todos los asociados →
        </button>
      </Card>

      {/* Accesos rápidos */}
      <Card title="Accesos Rápidos">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => navigate('/asociados/nuevo')}
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-center"
          >
            <Users className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm font-medium text-gray-700">Nuevo Asociado</p>
          </button>

          <button
            onClick={() => navigate('/creditos/nuevo')}
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors text-center"
          >
            <CreditCard className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm font-medium text-gray-700">Solicitar Crédito</p>
          </button>

          <button
            onClick={() => navigate('/ahorros/nuevo')}
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors text-center"
          >
            <PiggyBank className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm font-medium text-gray-700">Nueva Cuenta Ahorro</p>
          </button>

          <button
            onClick={() => navigate('/documentos')}
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors text-center"
          >
            <DollarSign className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm font-medium text-gray-700">Subir Documento</p>
          </button>
        </div>
      </Card>
    </div>
  );
}
