import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Edit, Eye } from 'lucide-react';
import Card from '../components/ui/Card';
import Table from '../components/ui/Table';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Asociado } from '../types';
import api from '../lib/axios';
import { useToast } from '../contexts/ToastContext';

export default function AsociadosPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [asociados, setAsociados] = useState<Asociado[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadAsociados();
  }, []);

  const loadAsociados = async () => {
    try {
      const response = await api.get('/asociados/');
      const data = response.data.datos || [];
      // Agregar nombre_completo, email y telefono computados
      const processed = data.map((a: any) => ({
        ...a,
        nombre_completo: `${a.nombres} ${a.apellidos}`,
        email: a.correo_electronico,
        telefono: a.telefono_principal
      }));
      setAsociados(processed);
    } catch (error: any) {
      showToast('error', 'Error al cargar asociados');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAsociados = asociados.filter((asociado) => {
    const nombreCompleto = asociado.nombre_completo || `${asociado.nombres} ${asociado.apellidos}`;
    return nombreCompleto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asociado.numero_documento.includes(searchTerm);
  });

  const getEstadoBadge = (estado: string) => {
    const colors = {
      activo: 'bg-green-100 text-green-800',
      inactivo: 'bg-gray-100 text-gray-800',
      retirado: 'bg-red-100 text-red-800',
      suspendido: 'bg-yellow-100 text-yellow-800',
    };

    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${colors[estado as keyof typeof colors] || colors.inactivo}`}>
        {estado.charAt(0).toUpperCase() + estado.slice(1)}
      </span>
    );
  };

  const columns = [
    {
      key: 'numero_documento',
      label: 'Documento',
    },
    {
      key: 'nombre_completo',
      label: 'Nombre Completo',
    },
    {
      key: 'telefono',
      label: 'Teléfono',
    },
    {
      key: 'email',
      label: 'Email',
      render: (asociado: Asociado) => asociado.email || 'N/A',
    },
    {
      key: 'estado',
      label: 'Estado',
      render: (asociado: Asociado) => getEstadoBadge(asociado.estado),
    },
    {
      key: 'acciones',
      label: 'Acciones',
      render: (asociado: Asociado) => (
        <div className="flex space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/asociados/${asociado.id}`);
            }}
            className="text-blue-600 hover:text-blue-800"
            title="Ver detalle"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/asociados/${asociado.id}/editar`);
            }}
            className="text-gray-600 hover:text-gray-800"
            title="Editar"
          >
            <Edit className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Gestión de Asociados</h1>
        <p className="mt-2 text-sm text-gray-600">
          Administra la información de los miembros de la cooperativa
        </p>
      </div>

      <Card>
        <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Buscar por nombre o documento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Button
            onClick={() => navigate('/asociados/nuevo')}
            className="flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Asociado
          </Button>
        </div>

        <Table
          data={filteredAsociados}
          columns={columns}
          isLoading={loading}
          emptyMessage="No se encontraron asociados"
          onRowClick={(asociado) => navigate(`/asociados/${asociado.id}`)}
        />

        {!loading && filteredAsociados.length > 0 && (
          <div className="mt-4 text-sm text-gray-600">
            Mostrando {filteredAsociados.length} de {asociados.length} asociados
          </div>
        )}
      </Card>
    </div>
  );
}
