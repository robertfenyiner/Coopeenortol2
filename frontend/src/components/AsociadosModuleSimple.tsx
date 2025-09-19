import React, { useState, useEffect } from 'react';

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

  // Formulario state - versión simplificada
  const [formData, setFormData] = useState({
    tipo_documento: 'CC',
    numero_documento: '',
    nombres: '',
    apellidos: '',
    correo_electronico: '',
    telefono_principal: '',
    estado: 'activo' as 'activo' | 'inactivo' | 'retirado',
    fecha_ingreso: new Date().toISOString().split('T')[0],
    observaciones: '',
    // Datos mínimos requeridos por el backend
    datos_personales: {
      fecha_nacimiento: '1990-01-01',
      direccion: '',
      ciudad: 'Bogotá',
      departamento: 'Cundinamarca',
      pais: 'Colombia'
    },
    datos_laborales: {
      institucion_educativa: 'Coopeenortol',
      cargo: '',
      tipo_contrato: 'Indefinido',
      fecha_vinculacion: new Date().toISOString().split('T')[0],
      salario_basico: 0
    },
    informacion_familiar: {
      familiares: [],
      contactos_emergencia: []
    },
    informacion_financiera: {
      ingresos_mensuales: 0,
      egresos_mensuales: 0,
      obligaciones: []
    }
  });

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

  // Filtrar asociados
  const filteredAsociados = asociados.filter(asociado =>
    asociado.nombres.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asociado.apellidos.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asociado.numero_documento.includes(searchTerm) ||
    asociado.correo_electronico.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Manejar envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const url = editingAsociado 
        ? `/api/v1/asociados/${editingAsociado.id}`
        : '/api/v1/asociados';
      
      const method = editingAsociado ? 'PUT' : 'POST';
      
      // Preparar los datos con estructura completa requerida por el backend
      const submitData = {
        ...formData,
        datos_laborales: {
          ...formData.datos_laborales,
          salario_basico: Number(formData.datos_laborales.salario_basico) || 0
        },
        informacion_financiera: {
          ...formData.informacion_financiera,
          ingresos_mensuales: Number(formData.informacion_financiera.ingresos_mensuales) || 0,
          egresos_mensuales: Number(formData.informacion_financiera.egresos_mensuales) || 0
        }
      };
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(submitData),
      });

      if (response.ok) {
        await fetchAsociados();
        setShowForm(false);
        setEditingAsociado(null);
        resetForm();
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

  const resetForm = () => {
    setFormData({
      tipo_documento: 'CC',
      numero_documento: '',
      nombres: '',
      apellidos: '',
      correo_electronico: '',
      telefono_principal: '',
      estado: 'activo',
      fecha_ingreso: new Date().toISOString().split('T')[0],
      observaciones: '',
      datos_personales: {
        fecha_nacimiento: '1990-01-01',
        direccion: '',
        ciudad: 'Bogotá',
        departamento: 'Cundinamarca',
        pais: 'Colombia'
      },
      datos_laborales: {
        institucion_educativa: 'Coopeenortol',
        cargo: '',
        tipo_contrato: 'Indefinido',
        fecha_vinculacion: new Date().toISOString().split('T')[0],
        salario_basico: 0
      },
      informacion_familiar: {
        familiares: [],
        contactos_emergencia: []
      },
      informacion_financiera: {
        ingresos_mensuales: 0,
        egresos_mensuales: 0,
        obligaciones: []
      }
    });
  };

  // Editar asociado
  const handleEdit = (asociado: Asociado) => {
    setEditingAsociado(asociado);
    setFormData({
      tipo_documento: asociado.tipo_documento,
      numero_documento: asociado.numero_documento,
      nombres: asociado.nombres,
      apellidos: asociado.apellidos,
      correo_electronico: asociado.correo_electronico,
      telefono_principal: asociado.telefono_principal || '',
      estado: asociado.estado,
      fecha_ingreso: asociado.fecha_ingreso,
      observaciones: asociado.observaciones || '',
      datos_personales: {
        fecha_nacimiento: '1990-01-01',
        direccion: '',
        ciudad: 'Bogotá',
        departamento: 'Cundinamarca',
        pais: 'Colombia'
      },
      datos_laborales: {
        institucion_educativa: 'Coopeenortol',
        cargo: '',
        tipo_contrato: 'Indefinido',
        fecha_vinculacion: new Date().toISOString().split('T')[0],
        salario_basico: 0
      },
      informacion_familiar: {
        familiares: [],
        contactos_emergencia: []
      },
      informacion_financiera: {
        ingresos_mensuales: 0,
        egresos_mensuales: 0,
        obligaciones: []
      }
    });
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

                <div 
                  className="md:col-span-2"
                  style={{
                    gridColumn: 'span 2'
                  }}
                >
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
                    Dirección
                  </label>
                  <input
                    type="text"
                    value={formData.datos_personales.direccion}
                    onChange={(e) => setFormData({
                      ...formData, 
                      datos_personales: {
                        ...formData.datos_personales,
                        direccion: e.target.value
                      }
                    })}
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
                    Cargo
                  </label>
                  <input
                    type="text"
                    value={formData.datos_laborales.cargo}
                    onChange={(e) => setFormData({
                      ...formData, 
                      datos_laborales: {
                        ...formData.datos_laborales,
                        cargo: e.target.value
                      }
                    })}
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
                    Salario Básico
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.datos_laborales.salario_basico}
                    onChange={(e) => setFormData({
                      ...formData, 
                      datos_laborales: {
                        ...formData.datos_laborales,
                        salario_basico: Number(e.target.value)
                      }
                    })}
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

                <div 
                  className="md:col-span-2"
                  style={{
                    gridColumn: 'span 2'
                  }}
                >
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
                    Observaciones
                  </label>
                  <textarea
                    value={formData.observaciones}
                    onChange={(e) => setFormData({...formData, observaciones: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem',
                      resize: 'vertical'
                    }}
                  />
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
