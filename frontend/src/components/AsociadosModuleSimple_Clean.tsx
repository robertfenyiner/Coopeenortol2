import React, { useState, useEffect } from 'react';
import AsociadoFormExpanded from './AsociadoFormExpanded';

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

  datos_laborales?: {
    institucion_educativa: string;
    cargo: string;
    area_trabajo?: string;
    tipo_contrato: string;
    fecha_vinculacion: string;
    salario_basico: number;
    bonificaciones?: number;
    jefe_inmediato?: string;
    telefono_jefe?: string;
    email_jefe?: string;
    sede_trabajo?: string;
    horario_trabajo?: string;
    experiencia_laboral?: Array<{
      empresa: string;
      cargo: string;
      fecha_inicio: string;
      fecha_fin?: string;
      motivo_retiro?: string;
      funciones?: string;
    }>;
  };

  informacion_familiar?: {
    familiares: Array<{
      nombre: string;
      parentesco: string;
      fecha_nacimiento?: string;
      documento?: string;
      telefono?: string;
      ocupacion?: string;
      depende_economicamente?: boolean;
    }>;
    contactos_emergencia: Array<{
      nombre: string;
      parentesco: string;
      telefono: string;
      direccion?: string;
      es_principal?: boolean;
    }>;
    personas_autorizadas?: Array<{
      nombre: string;
      documento: string;
      telefono: string;
      parentesco?: string;
      puede_recoger_hijo?: boolean;
    }>;
  };

  informacion_financiera?: {
    ingresos_mensuales: number;
    ingresos_adicionales?: number;
    egresos_mensuales: number;
    obligaciones: Array<{
      tipo: string;
      entidad: string;
      valor_cuota: number;
      saldo_actual?: number;
      fecha_vencimiento?: string;
    }>;
    referencias_comerciales?: Array<{
      entidad: string;
      tipo_producto: string;
      telefono: string;
      tiempo_relacion?: string;
    }>;
    ingresos_familiares?: number;
    gastos_familiares?: number;
    activos?: Array<{
      tipo: string;
      descripcion: string;
      valor_estimado: number;
    }>;
  };

  informacion_vivienda?: {
    tipo_vivienda: 'casa' | 'apartamento' | 'finca' | 'otro';
    tenencia: 'propia' | 'arrendada' | 'familiar' | 'otro';
    valor_arriendo?: number;
    tiempo_residencia?: number;
    servicios_publicos?: string[];
    estrato?: number;
  };
}

interface AsociadosModuleProps {
  onBack: () => void;
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

  const handleFormSubmit = async (formData: any) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Error: No hay token de autenticación');
        return;
      }

      const url = editingAsociado
        ? `/api/v1/asociados/${editingAsociado.id}`
        : '/api/v1/asociados';
      
      const method = editingAsociado ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error del servidor: ${response.status} - ${errorText}`);
      }

      alert(editingAsociado ? 'Asociado actualizado exitosamente' : 'Asociado creado exitosamente');
      
      setShowForm(false);
      setEditingAsociado(null);
      await fetchAsociados();
      
    } catch (error: any) {
      console.error('Error al guardar asociado:', error);
      alert(`Error al guardar el asociado: ${error.message}`);
    }
  };

  const handleEdit = (asociado: Asociado) => {
    setEditingAsociado(asociado);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este asociado?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Error: No hay token de autenticación');
        return;
      }

      const response = await fetch(`/api/v1/asociados/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      alert('Asociado eliminado exitosamente');
      await fetchAsociados();
    } catch (error: any) {
      console.error('Error al eliminar asociado:', error);
      alert(`Error al eliminar el asociado: ${error.message}`);
    }
  };

  const filteredAsociados = asociados.filter(asociado =>
    asociado.nombres?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asociado.apellidos?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asociado.numero_documento?.includes(searchTerm) ||
    asociado.correo_electronico?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        {!showForm ? (
          <>
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
          </>
        ) : (
          /* Formulario Simplificado */
          <div 
            className="bg-white shadow sm:rounded-md"
            style={{
              backgroundColor: 'white',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
              borderRadius: '0.375rem',
              padding: '1.5rem'
            }}
          >
            <div 
              className="mb-6"
              style={{
                marginBottom: '1.5rem'
              }}
            >
              <h2 
                className="text-lg font-medium text-gray-900"
                style={{
                  fontSize: '1.125rem',
                  fontWeight: '500',
                  color: '#111827'
                }}
              >
                {editingAsociado ? 'Editar Asociado' : 'Nuevo Asociado'}
              </h2>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div 
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                  gap: '1.5rem',
                  marginBottom: '1.5rem'
                }}
              >
                <div>
                  <label 
                    className="block text-sm font-medium text-gray-700 mb-1"
                    style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '0.25rem'
                    }}
                  >
                    Tipo de Documento *
                  </label>
                  <select
                    required
                    value={formData.tipo_documento}
                    onChange={(e) => setFormData({...formData, tipo_documento: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem'
                    }}
                  >
                    <option value="CC">Cédula de Ciudadanía</option>
                    <option value="CE">Cédula de Extranjería</option>
                    <option value="TI">Tarjeta de Identidad</option>
                    <option value="PAS">Pasaporte</option>
                  </select>
                </div>

                <div>
                  <label 
                    className="block text-sm font-medium text-gray-700 mb-1"
                    style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '0.25rem'
                    }}
                  >
                    Número de Documento *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.numero_documento}
                    onChange={(e) => setFormData({...formData, numero_documento: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>

                <div>
                  <label 
                    className="block text-sm font-medium text-gray-700 mb-1"
                    style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '0.25rem'
                    }}
                  >
                    Nombres *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nombres}
                    onChange={(e) => setFormData({...formData, nombres: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>

                <div>
                  <label 
                    className="block text-sm font-medium text-gray-700 mb-1"
                    style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '0.25rem'
                    }}
                  >
                    Apellidos *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.apellidos}
                    onChange={(e) => setFormData({...formData, apellidos: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>

                <div>
                  <label 
                    className="block text-sm font-medium text-gray-700 mb-1"
                    style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '0.25rem'
                    }}
                  >
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.correo_electronico}
                    onChange={(e) => setFormData({...formData, correo_electronico: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>

                <div>
                  <label 
                    className="block text-sm font-medium text-gray-700 mb-1"
                    style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '0.25rem'
                    }}
                  >
                    Teléfono
                  </label>
                  <input
                    type="text"
                    value={formData.telefono_principal}
                    onChange={(e) => setFormData({...formData, telefono_principal: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>

                <div>
                  <label 
                    className="block text-sm font-medium text-gray-700 mb-1"
                    style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '0.25rem'
                    }}
                  >
                    Fecha de Ingreso *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.fecha_ingreso}
                    onChange={(e) => setFormData({...formData, fecha_ingreso: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>

                <div>
                  <label 
                    className="block text-sm font-medium text-gray-700 mb-1"
                    style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '0.25rem'
                    }}
                  >
                    Estado
                  </label>
                  <select
                    value={formData.estado}
                    onChange={(e) => setFormData({...formData, estado: e.target.value as 'activo' | 'inactivo' | 'retirado'})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem'
                    }}
                  >
                    <option value="activo">Activo</option>
                    <option value="inactivo">Inactivo</option>
                    <option value="retirado">Retirado</option>
                  </select>
                </div>
              </div>

              <div 
                className="flex justify-end space-x-4"
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '1rem'
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingAsociado(null);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  style={{
                    padding: '0.5rem 1rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    color: '#374151',
                    backgroundColor: 'white',
                    cursor: 'pointer',
                    fontSize: '0.875rem'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#16a34a',
                    color: 'white',
                    borderRadius: '0.375rem',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '500'
                  }}
                >
                  {editingAsociado ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default AsociadosModule;