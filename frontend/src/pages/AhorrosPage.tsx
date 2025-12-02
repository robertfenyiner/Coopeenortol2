import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Eye, PiggyBank, TrendingUp } from 'lucide-react';
import Card from '../components/ui/Card';
import Table from '../components/ui/Table';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { CuentaAhorro } from '../types';
import api from '../lib/axios';
import { useToast } from '../contexts/ToastContext';
import { formatCurrency, formatDate } from '../lib/utils';

export default function AhorrosPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [cuentas, setCuentas] = useState<CuentaAhorro[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadCuentas();
  }, []);

  const loadCuentas = async () => {
    try {
      const response = await api.get('/ahorros/');
      setCuentas(response.data.cuentas || []);
    } catch (error: any) {
      showToast('error', 'Error al cargar cuentas de ahorro');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCuentas = cuentas.filter((cuenta) =>
    cuenta.asociado?.nombre_completo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cuenta.numero_cuenta.includes(searchTerm)
  );

  const getEstadoBadge = (estado: string) => {
    const colors = {
      activa: 'bg-green-100 text-green-800',
      inactiva: 'bg-gray-100 text-gray-800',
      cerrada: 'bg-red-100 text-red-800',
      bloqueada: 'bg-yellow-100 text-yellow-800',
    };

    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${colors[estado as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`}>
        {estado.charAt(0).toUpperCase() + estado.slice(1)}
      </span>
    );
  };

  const getTipoBadge = (tipo: string) => {
    const labels = {
      a_la_vista: 'A la Vista',
      programado: 'Programado',
      cdat: 'CDAT',
      contractual: 'Contractual',
      aportes: 'Aportes',
    };

    return labels[tipo as keyof typeof labels] || tipo;
  };

  const columns = [
    {
      key: 'numero_cuenta',
      label: 'Nº Cuenta',
    },
    {
      key: 'asociado',
      label: 'Asociado',
      render: (cuenta: CuentaAhorro) => cuenta.asociado?.nombre_completo || 'N/A',
    },
    {
      key: 'tipo_cuenta',
      label: 'Tipo',
      render: (cuenta: CuentaAhorro) => getTipoBadge(cuenta.tipo_cuenta),
    },
    {
      key: 'saldo',
      label: 'Saldo',
      render: (cuenta: CuentaAhorro) => (
        <span className="font-semibold">{formatCurrency(cuenta.saldo)}</span>
      ),
    },
    {
      key: 'tasa_interes',
      label: 'Tasa',
      render: (cuenta: CuentaAhorro) => `${cuenta.tasa_interes}%`,
    },
    {
      key: 'estado',
      label: 'Estado',
      render: (cuenta: CuentaAhorro) => getEstadoBadge(cuenta.estado),
    },
    {
      key: 'acciones',
      label: 'Acciones',
      render: (cuenta: CuentaAhorro) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/ahorros/${cuenta.id}`);
          }}
          className="text-blue-600 hover:text-blue-800"
          title="Ver detalle"
        >
          <Eye className="w-4 h-4" />
        </button>
      ),
    },
  ];

  const totalAhorrado = cuentas.reduce((sum, cuenta) => sum + cuenta.saldo, 0);
  const cuentasActivas = cuentas.filter((c) => c.estado === 'activa').length;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Gestión de Ahorros</h1>
        <p className="mt-2 text-sm text-gray-600">
          Administra las cuentas de ahorro de los asociados
        </p>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <Card>
          <div className="flex items-center">
            <div className="bg-purple-100 rounded-lg p-3">
              <PiggyBank className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Ahorrado</p>
              <p className="text-xl font-semibold text-gray-900">
                {formatCurrency(totalAhorrado)}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="bg-green-100 rounded-lg p-3">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Cuentas Activas</p>
              <p className="text-xl font-semibold text-gray-900">
                {cuentasActivas} de {cuentas.length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Buscar por asociado o nº cuenta..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Button
            onClick={() => navigate('/ahorros/nuevo')}
            className="flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nueva Cuenta
          </Button>
        </div>

        <Table
          data={filteredCuentas}
          columns={columns}
          isLoading={loading}
          emptyMessage="No se encontraron cuentas de ahorro"
          onRowClick={(cuenta) => navigate(`/ahorros/${cuenta.id}`)}
        />

        {!loading && filteredCuentas.length > 0 && (
          <div className="mt-4 text-sm text-gray-600">
            Mostrando {filteredCuentas.length} de {cuentas.length} cuentas
          </div>
        )}
      </Card>
    </div>
  );
}
