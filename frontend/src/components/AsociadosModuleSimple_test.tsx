import React, { useState, useEffect } from 'react';
import AsociadoFormExpanded from './AsociadoFormExpanded';

interface AsociadosModuleProps {
  onBack: () => void;
}

interface Asociado {
  id: number;
  tipo_documento: string;
  numero_documento: string;
  nombres: string;
  apellidos: string;
  correo_electronico: string;
  telefono_principal?: string;
  estado: 'activo' | 'inactivo' | 'retirado';
  fecha_ingreso: string;
  observaciones?: string;
  created_at: string;
  updated_at: string;
  foto_url?: string;
  
  // Datos expandidos opcionales
  datos_personales?: {
    fecha_nacimiento: string;
    lugar_nacimiento?: string;
    direccion: string;
    barrio?: string;
    ciudad: string;
    departamento: string;
    pais: string;
    codigo_postal?: string;
    telefono_secundario?: string;
    estado_civil?: 'soltero' | 'casado' | 'union_libre' | 'separado' | 'divorciado' | 'viudo';
    genero?: 'masculino' | 'femenino' | 'otro';
    grupo_sanguineo?: string;
    eps?: string;
    arl?: string;
  };

  informacion_academica?: {
    nivel_educativo: 'primaria' | 'bachillerato' | 'tecnico' | 'tecnologo' | 'universitario' | 'especializacion' | 'maestria' | 'doctorado';
    institucion?: string;
    titulo_obtenido?: string;
    ano_graduacion?: number;
    en_estudio?: boolean;
    programa_actual?: string;
    institucion_actual?: string;
    semestre_actual?: number;
    certificaciones?: Array<{
      nombre: string;
      institucion: string;
      fecha_obtencion: string;
      vigencia?: string;
    }>;
  };

  informacion_familiar?: {
    familiares: Array<{
      nombres: string;
      apellidos: string;
      parentesco: string;
      fecha_nacimiento: string;
      telefono?: string;
      vive_con_asociado: boolean;
      depende_economicamente: boolean;
    }>;
    contactos_emergencia: Array<{
      nombres: string;
      apellidos: string;
      telefono: string;
      parentesco: string;
      direccion?: string;
    }>;
  };

  datos_laborales?: {
    institucion_educativa: string;
    cargo: string;
    tipo_contrato: 'Indefinido' | 'Temporal' | 'Por obra';
    fecha_vinculacion: string;
    salario_basico: number;
    bonificaciones?: number;
    otras_compensaciones?: string;
    horario_trabajo?: string;
    sede_trabajo?: string;
  };

  informacion_financiera?: {
    ingresos_mensuales: number;
    egresos_mensuales: number;
    obligaciones: Array<{
      tipo: string;
      entidad: string;
      valor_cuota: number;
      saldo_pendiente: number;
      fecha_vencimiento?: string;
    }>;
    ingresos_adicionales?: Array<{
      fuente: string;
      valor_mensual: number;
      descripcion?: string;
    }>;
    gastos_familiares?: {
      vivienda: number;
      alimentacion: number;
      transporte: number;
      educacion: number;
      salud: number;
      otros: number;
    };
  };

  informacion_vivienda?: {
    tipo_vivienda: 'propia' | 'arrendada' | 'familiar' | 'otra';
    valor_arriendo?: number;
    num_habitaciones?: number;
    num_personas_hogar?: number;
    servicios_publicos?: {
      agua: boolean;
      luz: boolean;
      gas: boolean;
      internet: boolean;
      telefono: boolean;
    };
    estrato?: number;
  };
}

const AsociadosModule: React.FC<AsociadosModuleProps> = ({ onBack }) => {
  const [asociados, setAsociados] = useState<Asociado[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAsociado, setEditingAsociado] = useState<Asociado | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Cargar asociados
  const fetchAsociados = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/v1/asociados', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        // Si viene paginado, extraer los datos
        const asociadosData = data.datos || data;
        setAsociados(asociadosData);
      }
    } catch (error) {
      console.error('Error al cargar asociados:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAsociados();
  }, []);

  // Manejar envío del formulario expandido
  const handleFormSubmit = async (formData: any) => {
    try {
      const token = localStorage.getItem('token');
      const url = editingAsociado 
        ? `/api/v1/asociados/${editingAsociado.id}`
        : '/api/v1/asociados';
      
      const method = editingAsociado ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchAsociados();
        setShowForm(false);
        setEditingAsociado(null);
        alert(editingAsociado ? 'Asociado actualizado correctamente' : 'Asociado creado correctamente');
      } else {
        const errorData = await response.json();
        alert('Error: ' + (errorData.detail || 'No se pudo guardar el asociado'));
      }
    } catch (error) {
      console.error('Error al guardar asociado:', error);
      alert('Error al guardar el asociado');
    }
  };

  // Filtrar asociados
  const filteredAsociados = asociados.filter(asociado =>
    asociado.nombres?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asociado.apellidos?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asociado.numero_documento?.includes(searchTerm) ||
    asociado.correo_electronico?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Editar asociado
  const handleEdit = (asociado: Asociado) => {
    setEditingAsociado(asociado);
    setShowForm(true);
  };

  // Eliminar asociado
  const handleDelete = async (id: number) => {
    if (confirm('¿Está seguro de eliminar este asociado?')) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/v1/asociados/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (response.ok) {
          await fetchAsociados();
          alert('Asociado eliminado correctamente');
        } else {
          alert('Error al eliminar el asociado');
        }
      } catch (error) {
        console.error('Error al eliminar asociado:', error);
        alert('Error al eliminar el asociado');
      }
    }
  };

  if (showForm) {
    return (
      <AsociadoFormExpanded 
        onClose={() => {
          setShowForm(false);
          setEditingAsociado(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={editingAsociado}
        isEditing={!!editingAsociado}
      />
    );
  }

  return (
    <div 
      className="min-h-screen bg-gray-50"
      style={{
        minHeight: '100vh',
        backgroundColor: '#f9fafb'
      }}
    >
      {/* Header */}
      <div 
        className="bg-white shadow-sm border-b"
        style={{
          backgroundColor: 'white',
          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
          borderBottom: '1px solid #e5e7eb',
          padding: '1rem 2rem'
        }}
      >
        <div 
          className="flex items-center justify-between"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div 
            className="flex items-center"
            style={{
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <button
              onClick={onBack}
              className="mr-4 p-2 hover:bg-gray-100 rounded"
              style={{
                marginRight: '1rem',
                padding: '0.5rem',
                backgroundColor: 'transparent',
                border: 'none',
                borderRadius: '0.25rem',
                cursor: 'pointer'
              }}
            >
              <svg 
                style={{
                  height: '1.5rem',
                  width: '1.5rem',
                  color: '#4b5563'
                }}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M15 19l-7-7 7-7" 
                />
              </svg>
            </button>
            <h1 
              className="text-2xl font-bold text-gray-900"
              style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: '#111827'
              }}
            >
              Gestión de Asociados
            </h1>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
            style={{
              backgroundColor: '#16a34a',
              color: 'white',
              padding: '0.5rem 1rem',
              borderRadius: '0.375rem',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}
          >
            Nuevo Asociado
          </button>
        </div>
      </div>

      {/* Content */}
      <div 
        className="max-w-7xl mx-auto py-6 px-4"
        style={{
          maxWidth: '80rem',
          margin: '0 auto',
          padding: '1.5rem 1rem'
        }}
      >
        {/* Búsqueda */}
        <div 
          className="mb-6"
          style={{
            marginBottom: '1.5rem'
          }}
        >
          <input
            type="text"
            placeholder="Buscar por nombres, apellidos, documento o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
            style={{
              width: '100%',
              padding: '0.5rem 1rem',
              border: '1px solid #d1d5db',
              borderRadius: '0.375rem',
              fontSize: '1rem'
            }}
          />
        </div>

        {/* Tabla de Asociados */}
        <div 
          className="bg-white shadow overflow-hidden sm:rounded-md"
          style={{
            backgroundColor: 'white',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
            borderRadius: '0.375rem',
            overflow: 'hidden'
          }}
        >
          {loading ? (
            <div 
              className="p-6 text-center"
              style={{
                padding: '1.5rem',
                textAlign: 'center'
              }}
            >
              <div 
                className="text-gray-500"
                style={{
                  color: '#6b7280'
                }}
              >
                Cargando asociados...
              </div>
            </div>
          ) : filteredAsociados.length === 0 ? (
            <div 
              className="p-6 text-center"
              style={{
                padding: '1.5rem',
                textAlign: 'center'
              }}
            >
              <div 
                className="text-gray-500"
                style={{
                  color: '#6b7280'
                }}
              >
                {searchTerm ? 'No se encontraron asociados que coincidan con la búsqueda' : 'No hay asociados registrados'}
              </div>
            </div>
          ) : (
            <div 
              className="overflow-x-auto"
              style={{
                overflowX: 'auto'
              }}
            >
              <table 
                className="min-w-full divide-y divide-gray-200"
                style={{
                  minWidth: '100%',
                  borderCollapse: 'collapse'
                }}
              >
                <thead 
                  className="bg-gray-50"
                  style={{
                    backgroundColor: '#f9fafb'
                  }}
                >
                  <tr>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      style={{
                        padding: '0.75rem 1.5rem',
                        textAlign: 'left',
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        color: '#6b7280',
                        textTransform: 'uppercase'
                      }}
                    >
                      Documento
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      style={{
                        padding: '0.75rem 1.5rem',
                        textAlign: 'left',
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        color: '#6b7280',
                        textTransform: 'uppercase'
                      }}
                    >
                      Nombre Completo
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      style={{
                        padding: '0.75rem 1.5rem',
                        textAlign: 'left',
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        color: '#6b7280',
                        textTransform: 'uppercase'
                      }}
                    >
                      Email
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      style={{
                        padding: '0.75rem 1.5rem',
                        textAlign: 'left',
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        color: '#6b7280',
                        textTransform: 'uppercase'
                      }}
                    >
                      Estado
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      style={{
                        padding: '0.75rem 1.5rem',
                        textAlign: 'left',
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        color: '#6b7280',
                        textTransform: 'uppercase'
                      }}
                    >
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody 
                  className="bg-white divide-y divide-gray-200"
                  style={{
                    backgroundColor: 'white'
                  }}
                >
                  {filteredAsociados.map((asociado) => (
                    <tr key={asociado.id}>
                      <td 
                        className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900"
                        style={{
                          padding: '1rem 1.5rem',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          color: '#111827'
                        }}
                      >
                        {asociado.tipo_documento} {asociado.numero_documento}
                      </td>
                      <td 
                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                        style={{
                          padding: '1rem 1.5rem',
                          fontSize: '0.875rem',
                          color: '#111827'
                        }}
                      >
                        {asociado.nombres} {asociado.apellidos}
                      </td>
                      <td 
                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                        style={{
                          padding: '1rem 1.5rem',
                          fontSize: '0.875rem',
                          color: '#111827'
                        }}
                      >
                        {asociado.correo_electronico}
                      </td>
                      <td 
                        className="px-6 py-4 whitespace-nowrap"
                        style={{
                          padding: '1rem 1.5rem'
                        }}
                      >
                        <span 
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            asociado.estado === 'activo' 
                              ? 'bg-green-100 text-green-800'
                              : asociado.estado === 'inactivo'
                              ? 'bg-gray-100 text-gray-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                          style={{
                            display: 'inline-flex',
                            padding: '0.25rem 0.5rem',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            borderRadius: '9999px',
                            backgroundColor: asociado.estado === 'activo' ? '#dcfce7' : asociado.estado === 'inactivo' ? '#f3f4f6' : '#fee2e2',
                            color: asociado.estado === 'activo' ? '#166534' : asociado.estado === 'inactivo' ? '#374151' : '#991b1b'
                          }}
                        >
                          {asociado.estado}
                        </span>
                      </td>
                      <td 
                        className="px-6 py-4 whitespace-nowrap text-sm font-medium"
                        style={{
                          padding: '1rem 1.5rem',
                          fontSize: '0.875rem',
                          fontWeight: '500'
                        }}
                      >
                        <button
                          onClick={() => handleEdit(asociado)}
                          className="text-indigo-600 hover:text-indigo-900 mr-4"
                          style={{
                            color: '#4f46e5',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            marginRight: '1rem'
                          }}
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(asociado.id)}
                          className="text-red-600 hover:text-red-900"
                          style={{
                            color: '#dc2626',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer'
                          }}
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AsociadosModule;