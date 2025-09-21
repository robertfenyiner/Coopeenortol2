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

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={onBack}
                className="mr-4 p-2 hover:bg-gray-100 rounded"
              >
                <svg className="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Gestión de Asociados</h1>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
            >
              Nuevo Asociado
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto py-6 px-4">
        {!showForm ? (
          <>
            {/* Búsqueda */}
            <div className="mb-6">
              <input
                type="text"
                placeholder="Buscar por nombres, apellidos, documento o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
              />
            </div>

            {/* Tabla de Asociados */}
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              {filteredAsociados.length === 0 ? (
                <div className="p-6 text-center">
                  <div className="text-gray-500">
                    {searchTerm ? 'No se encontraron asociados que coincidan con la búsqueda' : 'No hay asociados registrados'}
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Documento
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Nombre Completo
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Estado
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredAsociados.map((asociado) => (
                        <tr key={asociado.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {asociado.tipo_documento} {asociado.numero_documento}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {asociado.nombres} {asociado.apellidos}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {asociado.correo_electronico}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              asociado.estado === 'activo' 
                                ? 'bg-green-100 text-green-800'
                                : asociado.estado === 'inactivo'
                                ? 'bg-gray-100 text-gray-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {asociado.estado}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => handleEdit(asociado)}
                              className="text-indigo-600 hover:text-indigo-900 mr-4"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => handleDelete(asociado.id)}
                              className="text-red-600 hover:text-red-900"
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
          <div className="bg-white shadow sm:rounded-md p-6">
            <div className="mb-6">
              <h2 className="text-lg font-medium text-gray-900">
                {editingAsociado ? 'Editar Asociado' : 'Nuevo Asociado'}
              </h2>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Documento *
                  </label>
                  <select
                    required
                    value={formData.tipo_documento}
                    onChange={(e) => setFormData({...formData, tipo_documento: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="CC">Cédula de Ciudadanía</option>
                    <option value="CE">Cédula de Extranjería</option>
                    <option value="TI">Tarjeta de Identidad</option>
                    <option value="PAS">Pasaporte</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Número de Documento *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.numero_documento}
                    onChange={(e) => setFormData({...formData, numero_documento: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombres *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nombres}
                    onChange={(e) => setFormData({...formData, nombres: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Apellidos *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.apellidos}
                    onChange={(e) => setFormData({...formData, apellidos: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.correo_electronico}
                    onChange={(e) => setFormData({...formData, correo_electronico: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono
                  </label>
                  <input
                    type="text"
                    value={formData.telefono_principal}
                    onChange={(e) => setFormData({...formData, telefono_principal: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha de Ingreso *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.fecha_ingreso}
                    onChange={(e) => setFormData({...formData, fecha_ingreso: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estado
                  </label>
                  <select
                    value={formData.estado}
                    onChange={(e) => setFormData({...formData, estado: e.target.value as 'activo' | 'inactivo' | 'retirado'})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="activo">Activo</option>
                    <option value="inactivo">Inactivo</option>
                    <option value="retirado">Retirado</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Observaciones
                  </label>
                  <textarea
                    value={formData.observaciones}
                    onChange={(e) => setFormData({...formData, observaciones: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingAsociado(null);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
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