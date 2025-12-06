import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Eye, DollarSign, Calendar } from 'lucide-react';
import Card from '../components/ui/Card';
import Table from '../components/ui/Table';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Credito } from '../types';
import api from '../lib/axios';
import { useToast } from '../contexts/ToastContext';
import { formatCurrency, formatDate } from '../lib/utils';

export default function CreditosPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [creditos, setCreditos] = useState<Credito[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadCreditos();
  }, []);

  const loadCreditos = async () => {
    try {
      const response = await api.get('/creditos/');
      setCreditos(response.data.creditos || []);
    } catch (error: any) {
      showToast('error', 'Error al cargar créditos');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCreditos = creditos.filter((credito) => {
    const nombreCompleto = credito.asociado 
      ? `${credito.asociado.nombres} ${credito.asociado.apellidos}`
      : '';
    return nombreCompleto.toLowerCase().includes(searchTerm.toLowerCase()) ||
           credito.id.toString().includes(searchTerm);
  });

  const getEstadoBadge = (estado: string) => {
    const colors = {
      solicitado: 'bg-blue-100 text-blue-800',
      en_estudio: 'bg-yellow-100 text-yellow-800',
      aprobado: 'bg-green-100 text-green-800',
      rechazado: 'bg-red-100 text-red-800',
      desembolsado: 'bg-purple-100 text-purple-800',
      activo: 'bg-green-100 text-green-800',
      cancelado: 'bg-gray-100 text-gray-800',
      castigado: 'bg-red-100 text-red-800',
    };

    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${colors[estado as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`}>
        {estado.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  const columns = [
    {
      key: 'id',
      label: 'ID',
      render: (credito: Credito) => `#${credito.id}`,
    },
    {
      key: 'asociado',
      label: 'Asociado',
      render: (credito: Credito) => credito.asociado 
        ? `${credito.asociado.nombres} ${credito.asociado.apellidos}`
        : 'N/A',
    },
    {
      key: 'fecha_solicitud',
      label: 'Fecha Solicitud',
      render: (credito: Credito) => new Date(credito.fecha_solicitud).toLocaleDateString('es-CO'),
    },
    {
      key: 'tipo_credito',
      label: 'Tipo',
      render: (credito: Credito) => (
        <span className="capitalize">{credito.tipo_credito.replace('_', ' ')}</span>
      ),
    },
    {
      key: 'monto_solicitado',
      label: 'Monto',
      render: (credito: Credito) => formatCurrency(credito.monto_solicitado),
    },
    {
      key: 'plazo_meses',
      label: 'Plazo',
      render: (credito: Credito) => `${credito.plazo_meses} meses`,
    },
    {
      key: 'estado',
      label: 'Estado',
      render: (credito: Credito) => getEstadoBadge(credito.estado),
    },
    {
      key: 'saldo_capital',
      label: 'Saldo',
      render: (credito: Credito) => credito.saldo_capital ? formatCurrency(credito.saldo_capital) : 'N/A',
    },
    {
      key: 'acciones',
      label: 'Acciones',
      render: (credito: Credito) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/creditos/${credito.id}`);
          }}
          className="text-blue-600 hover:text-blue-800"
          title="Ver detalle"
        >
          <Eye className="w-4 h-4" />
        </button>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Gestión de Créditos</h1>
        <p className="mt-2 text-sm text-gray-600">
          Administra las solicitudes y créditos activos
        </p>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card>
          <div className="flex items-center">
            <div className="bg-green-100 rounded-lg p-3">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Cartera Total</p>
              <p className="text-xl font-semibold text-gray-900">
                {formatCurrency(
                  creditos
                    .filter((c) => c.estado === 'activo')
                    .reduce((sum, c) => sum + (c.saldo_capital || 0), 0)
                )}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="bg-blue-100 rounded-lg p-3">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Créditos Activos</p>
              <p className="text-xl font-semibold text-gray-900">
                {creditos.filter((c) => c.estado === 'activo').length}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="bg-yellow-100 rounded-lg p-3">
              <Search className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">En Estudio</p>
              <p className="text-xl font-semibold text-gray-900">
                {creditos.filter((c) => c.estado === 'en_estudio' || c.estado === 'solicitado').length}
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
                placeholder="Buscar por asociado o ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Button
            onClick={() => navigate('/creditos/nuevo')}
            className="flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nueva Solicitud
          </Button>
        </div>

        <Table
          data={filteredCreditos}
          columns={columns}
          isLoading={loading}
          emptyMessage="No se encontraron créditos"
          onRowClick={(credito) => navigate(`/creditos/${credito.id}`)}
        />

        {!loading && filteredCreditos.length > 0 && (
          <div className="mt-4 text-sm text-gray-600">
            Mostrando {filteredCreditos.length} de {creditos.length} créditos
          </div>
        )}
      </Card>
    </div>
  );
}
