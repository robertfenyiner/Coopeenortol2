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
  foto_url?: string;
  observaciones?: string;
  datos_personales?: any;
  datos_laborales?: any;
  informacion_familiar?: any;
  informacion_financiera?: any;
  created_at?: string;
  updated_at?: string;
}

interface AsociadosModuleProps {
  onBack: () => void;
}

// Datos iniciales para el formulario expandido
const initialFormData = {
  tipo_documento: 'CC',
  numero_documento: '',
  nombres: '',
  apellidos: '',
  correo_electronico: '',
  telefono_principal: '',
  estado: 'activo' as const,
  fecha_ingreso: new Date().toISOString().split('T')[0],
  observaciones: '',
  
  datos_personales: {
    fecha_nacimiento: '',
    lugar_nacimiento: '',
    direccion: '',
    barrio: '',
    ciudad: '',
    departamento: '',
    pais: 'Colombia',
    codigo_postal: '',
    telefono_secundario: '',
    estado_civil: '' as const,
    genero: '' as const,
    grupo_sanguineo: '',
    eps: '',
    arl: '',
  },
  
  informacion_academica: {
    nivel_educativo: '' as const,
    institucion: '',
    titulo_obtenido: '',
    ano_graduacion: new Date().getFullYear(),
    en_estudio: false,
    programa_actual: '',
    institucion_actual: '',
    semestre_actual: 1,
    certificaciones: [],
  },
  
  datos_laborales: {
    institucion_educativa: '',
    cargo: '',
    area_trabajo: '',
    tipo_contrato: 'indefinido',
    fecha_vinculacion: new Date().toISOString().split('T')[0],
    salario_basico: 0,
    bonificaciones: 0,
    jefe_inmediato: '',
    telefono_jefe: '',
    email_jefe: '',
    sede_trabajo: '',
    horario_trabajo: '',
    experiencia_laboral: [],
  },
  
  informacion_familiar: {
    familiares: [],
    contactos_emergencia: [],
    personas_autorizadas: [],
  },
  
  informacion_financiera: {
    ingresos_mensuales: 0,
    ingresos_adicionales: 0,
    egresos_mensuales: 0,
    obligaciones: [],
    referencias_comerciales: [],
    ingresos_familiares: 0,
    gastos_familiares: 0,
    activos: [],
  },
  
  informacion_vivienda: {
    tipo_vivienda: '' as const,
    tenencia: '' as const,
    valor_arriendo: 0,
    tiempo_residencia: 0,
    servicios_publicos: [],
    estrato: 1,
  },
};

const AsociadosModuleNew: React.FC<AsociadosModuleProps> = ({ onBack }) => {
  const [asociados, setAsociados] = useState<Asociado[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAsociado, setEditingAsociado] = useState<Asociado | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  
  // Estado del formulario expandido
  const [formData, setFormData] = useState(initialFormData);

  // Cargar asociados
  const fetchAsociados = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/v1/asociados/', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setAsociados(data.datos || data);
      } else {
        console.error('Error al cargar asociados:', response.statusText);
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
      
      // Transformar datos para enviar al backend
      const payload = {
        ...formData,
        datos_personales: {
          fecha_nacimiento: formData.datos_personales.fecha_nacimiento,
          lugar_nacimiento: formData.datos_personales.lugar_nacimiento,
          direccion: formData.datos_personales.direccion,
          ciudad: formData.datos_personales.ciudad,
          departamento: formData.datos_personales.departamento,
          pais: formData.datos_personales.pais,
          estado_civil: formData.datos_personales.estado_civil,
          genero: formData.datos_personales.genero,
          nivel_academico: formData.informacion_academica.nivel_educativo,
          profesion: formData.datos_laborales.cargo,
          tipo_vivienda: formData.informacion_vivienda.tenencia,
          telefono_alternativo: formData.datos_personales.telefono_secundario,
          tiene_discapacidad: false,
          tipo_discapacidad: null,
          grupo_sanguineo: formData.datos_personales.grupo_sanguineo,
          eps: formData.datos_personales.eps,
          arl: formData.datos_personales.arl,
        },
        datos_laborales: {
          institucion_educativa: formData.datos_laborales.institucion_educativa,
          cargo: formData.datos_laborales.cargo,
          tipo_contrato: formData.datos_laborales.tipo_contrato,
          fecha_vinculacion: formData.datos_laborales.fecha_vinculacion,
          salario_basico: formData.datos_laborales.salario_basico,
          otros_ingresos: formData.datos_laborales.bonificaciones,
          horario: formData.datos_laborales.horario_trabajo,
          dependencia: formData.datos_laborales.area_trabajo,
          jefe_inmediato: formData.datos_laborales.jefe_inmediato,
          telefono_trabajo: formData.datos_laborales.telefono_jefe,
          correo_institucional: formData.datos_laborales.email_jefe,
          sede_trabajo: formData.datos_laborales.sede_trabajo,
        },
        informacion_familiar: {
          estado_civil: formData.datos_personales.estado_civil,
          numero_hijos: formData.informacion_familiar.familiares.filter(f => f.parentesco.includes('hijo')).length,
          personas_a_cargo: formData.informacion_familiar.familiares.filter(f => f.depende_economicamente).length,
          familiares: formData.informacion_familiar.familiares.map(f => ({
            nombre: f.nombre,
            parentesco: f.parentesco,
            fecha_nacimiento: f.fecha_nacimiento || null,
            ocupacion: f.ocupacion || null,
            convive: f.depende_economicamente || false,
          })),
          contactos_emergencia: formData.informacion_familiar.contactos_emergencia.map(c => ({
            nombre: c.nombre,
            parentesco: c.parentesco,
            telefono: c.telefono,
          })),
        },
        informacion_financiera: {
          ingresos_mensuales: formData.informacion_financiera.ingresos_mensuales,
          ingresos_adicionales: formData.informacion_financiera.ingresos_adicionales,
          egresos_mensuales: formData.informacion_financiera.egresos_mensuales,
          gastos_financieros: formData.informacion_financiera.obligaciones.reduce((sum, o) => sum + o.valor_cuota, 0),
          capacidad_ahorro: Math.max(0, (formData.informacion_financiera.ingresos_mensuales + formData.informacion_financiera.ingresos_adicionales) - formData.informacion_financiera.egresos_mensuales),
          patrimonio_neto: formData.informacion_financiera.activos.reduce((sum, a) => sum + (a.valor_estimado || 0), 0),
          endeudamiento: formData.informacion_financiera.obligaciones.reduce((sum, o) => sum + (o.saldo_actual || 0), 0),
          obligaciones: formData.informacion_financiera.obligaciones.map(o => ({
            entidad: o.entidad,
            tipo: o.tipo,
            saldo: o.saldo_actual || 0,
            cuota_mensual: o.valor_cuota,
          })),
          cuenta_bancaria_principal: null,
          entidad_bancaria: null,
          calificacion_riesgo: null,
          score_crediticio: null,
          reportes_centrales: false,
          observaciones: null,
        },
      };
      
      const url = editingAsociado 
        ? `/api/v1/asociados/${editingAsociado.id}`
        : '/api/v1/asociados/';
      
      const method = editingAsociado ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const savedAsociado = await response.json();
        
        // Subir foto si existe
        if (photoFile && savedAsociado.id) {
          const formDataPhoto = new FormData();
          formDataPhoto.append('file', photoFile);
          
          await fetch(`/api/v1/archivos/asociados/${savedAsociado.id}/foto`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
            body: formDataPhoto,
          });
        }
        
        await fetchAsociados();
        setShowForm(false);
        setEditingAsociado(null);
        setFormData(initialFormData);
        setPhotoFile(null);
        setPhotoPreview(null);
        setCurrentStep(0);
        alert(editingAsociado ? 'Asociado actualizado exitosamente' : 'Asociado creado exitosamente');
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.detail || 'Error al guardar asociado'}`);
      }
    } catch (error) {
      console.error('Error al guardar asociado:', error);
      alert('Error al guardar asociado');
    }
  };

  // Manejar edición
  const handleEdit = (asociado: Asociado) => {
    setEditingAsociado(asociado);
    
    // Mapear datos del asociado al formato del formulario
    setFormData({
      ...initialFormData,
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
        ...initialFormData.datos_personales,
        ...(asociado.datos_personales || {}),
      },
      datos_laborales: {
        ...initialFormData.datos_laborales,
        ...(asociado.datos_laborales || {}),
      },
      informacion_familiar: {
        ...initialFormData.informacion_familiar,
        ...(asociado.informacion_familiar || {}),
      },
      informacion_financiera: {
        ...initialFormData.informacion_financiera,
        ...(asociado.informacion_financiera || {}),
      },
    });
    
    if (asociado.foto_url) {
      setPhotoPreview(asociado.foto_url);
    }
    
    setShowForm(true);
    setCurrentStep(0);
  };

  // Eliminar asociado (cambiar a inactivo)
  const handleDelete = async (id: number) => {
    if (confirm('¿Está seguro de eliminar este asociado? Será marcado como inactivo.')) {
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
          alert('Asociado eliminado exitosamente');
        }
      } catch (error) {
        console.error('Error al eliminar asociado:', error);
        alert('Error al eliminar asociado');
      }
    }
  };

  // Cancelar edición/creación
  const handleCancel = () => {
    setShowForm(false);
    setEditingAsociado(null);
    setFormData(initialFormData);
    setPhotoFile(null);
    setPhotoPreview(null);
    setCurrentStep(0);
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
      {showForm ? (
        <AsociadoFormExpanded
          formData={formData}
          setFormData={setFormData}
          currentStep={currentStep}
          setCurrentStep={setCurrentStep}
          photoFile={photoFile}
          setPhotoFile={setPhotoFile}
          photoPreview={photoPreview}
          setPhotoPreview={setPhotoPreview}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isEditing={!!editingAsociado}
        />
      ) : (
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Volver
              </button>
              <h1 className="text-3xl font-bold text-gray-900">Gestión de Asociados</h1>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors shadow-lg"
            >
              + Nuevo Asociado
            </button>
          </div>

          {/* Buscador */}
          <div className="mb-6">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar por nombres, apellidos, documento o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <svg className="w-5 h-5 text-gray-400 absolute left-4 top-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Lista de asociados */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Foto</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Documento</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre Completo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAsociados.map((asociado) => (
                    <tr key={asociado.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex-shrink-0 h-12 w-12">
                          {asociado.foto_url ? (
                            <img
                              className="h-12 w-12 rounded-full object-cover"
                              src={asociado.foto_url}
                              alt={`${asociado.nombres} ${asociado.apellidos}`}
                            />
                          ) : (
                            <div className="h-12 w-12 rounded-full bg-gray-300 flex items-center justify-center">
                              <svg className="h-6 w-6 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                              </svg>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{asociado.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {asociado.tipo_documento} {asociado.numero_documento}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {asociado.nombres} {asociado.apellidos}
                        </div>
                        <div className="text-sm text-gray-500">
                          {asociado.telefono_principal}
                        </div>
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleEdit(asociado)}
                          className="text-blue-600 hover:text-blue-900 transition-colors"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(asociado.id)}
                          className="text-red-600 hover:text-red-900 transition-colors"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {filteredAsociados.length === 0 && (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No se encontraron asociados</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm ? 'Intenta con otros términos de búsqueda.' : 'Comienza agregando un nuevo asociado.'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AsociadosModuleNew;