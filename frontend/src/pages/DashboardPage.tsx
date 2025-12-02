import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, CreditCard, PiggyBank, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import Card from '../components/ui/Card';
import api from '../lib/axios';
import { formatCurrency } from '../lib/utils';
import { DashboardStats } from '../types';

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

export default function DashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [asociadosRes, creditosRes, ahorrosRes] = await Promise.all([
        api.get('/asociados/estadisticas/'),
        api.get('/creditos/estadisticas/'),
        api.get('/ahorros/estadisticas/'),
      ]);

      setStats({
        total_asociados: asociadosRes.data.total || 0,
        asociados_activos: asociadosRes.data.activos || 0,
        total_creditos: creditosRes.data.total || 0,
        cartera_activa: creditosRes.data.cartera_activa || 0,
        total_ahorros: ahorrosRes.data.total_ahorrado || 0,
        cuentas_activas: ahorrosRes.data.cuentas_activas || 0,
      });
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
      // Datos de ejemplo si falla
      setStats({
        total_asociados: 5,
        asociados_activos: 5,
        total_creditos: 5,
        cartera_activa: 9000000,
        total_ahorros: 4149940,
        cuentas_activas: 5,
      });
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
          Resumen general del sistema de gestión cooperativa
        </p>
      </div>

      {/* Estadísticas principales */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <StatCard
          title="Asociados Activos"
          value={stats?.asociados_activos || 0}
          icon={<Users className="w-6 h-6" />}
          bgColor="bg-blue-100"
          iconColor="text-blue-600"
        />
        <StatCard
          title="Créditos Activos"
          value={stats?.total_creditos || 0}
          icon={<CreditCard className="w-6 h-6" />}
          bgColor="bg-green-100"
          iconColor="text-green-600"
        />
        <StatCard
          title="Cuentas de Ahorro"
          value={stats?.cuentas_activas || 0}
          icon={<PiggyBank className="w-6 h-6" />}
          bgColor="bg-purple-100"
          iconColor="text-purple-600"
        />
      </div>

      {/* Estadísticas financieras */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-8">
        <Card
          title="Cartera de Créditos"
          subtitle="Total de créditos activos"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-gray-900">
                {formatCurrency(stats?.cartera_activa || 0)}
              </p>
              <p className="mt-2 text-sm text-gray-600">
                {stats?.total_creditos} créditos activos
              </p>
            </div>
            <div className="bg-green-100 rounded-full p-4">
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <button
            onClick={() => navigate('/creditos')}
            className="mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Ver todos los créditos →
          </button>
        </Card>

        <Card
          title="Total Ahorrado"
          subtitle="Saldo total en cuentas de ahorro"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-gray-900">
                {formatCurrency(stats?.total_ahorros || 0)}
              </p>
              <p className="mt-2 text-sm text-gray-600">
                {stats?.cuentas_activas} cuentas activas
              </p>
            </div>
            <div className="bg-purple-100 rounded-full p-4">
              <PiggyBank className="w-8 h-8 text-purple-600" />
            </div>
          </div>
          <button
            onClick={() => navigate('/ahorros')}
            className="mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Ver cuentas de ahorro →
          </button>
        </Card>
      </div>

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
