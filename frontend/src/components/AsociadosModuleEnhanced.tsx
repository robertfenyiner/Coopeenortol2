import React, { useState, useEffect } from 'react';
import { asociadoService, Asociado, AsociadoFormData } from '../services/asociadoService';
import AsociadoFormExpanded from './AsociadoFormExpanded';

// Importar el tipo FormDataExpanded del componente
interface FormDataExpanded {
  tipo_documento: string;
  numero_documento: string;
  nombres: string;
  apellidos: string;
  correo_electronico: string;
  telefono_principal: string;
  estado: 'activo' | 'inactivo' | 'retirado';
  fecha_ingreso: string;
  observaciones: string;
  
  datos_personales: {
    fecha_nacimiento: string;
    lugar_nacimiento: string;
    direccion: string;
    barrio: string;
    ciudad: string;
    departamento: string;
    pais: string;
    codigo_postal: string;
    telefono_secundario: string;
    estado_civil: '' | 'soltero' | 'casado' | 'union_libre' | 'separado' | 'divorciado' | 'viudo';
    genero: '' | 'masculino' | 'femenino' | 'otro';
    grupo_sanguineo: string;
    eps: string;
    arl: string;
  };
  
  informacion_academica: {
    nivel_educativo: '' | 'primaria' | 'bachillerato' | 'tecnico' | 'tecnologo' | 'universitario' | 'especializacion' | 'maestria' | 'doctorado';
    institucion: string;
    titulo_obtenido: string;
    ano_graduacion: number;
    en_estudio: boolean;
    programa_actual: string;
    institucion_actual: string;
    semestre_actual: number;
    certificaciones: Array<{
      nombre: string;
      institucion: string;
      fecha_obtencion: string;
      vigencia?: string;
    }>;
  };
  
  datos_laborales: {
    institucion_educativa: string;
    cargo: string;
    area_trabajo: string;
    tipo_contrato: string;
    fecha_vinculacion: string;
    salario_basico: number;
    bonificaciones: number;
    jefe_inmediato: string;
    telefono_jefe: string;
    email_jefe: string;
    sede_trabajo: string;
    horario_trabajo: string;
    experiencia_laboral: Array<{
      empresa: string;
      cargo: string;
      fecha_inicio: string;
      fecha_fin?: string;
      motivo_retiro?: string;
      funciones?: string;
    }>;
  };
  
  informacion_familiar: {
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
    personas_autorizadas: Array<{
      nombre: string;
      documento: string;
      telefono: string;
      parentesco?: string;
      puede_recoger_hijo?: boolean;
    }>;
  };
  
  informacion_financiera: {
    ingresos_mensuales: number;
    ingresos_adicionales: number;
    egresos_mensuales: number;
    ingresos_familiares: number;
    gastos_familiares: number;
    obligaciones: Array<{
      tipo: string;
      entidad: string;
      valor_cuota: number;
      saldo_actual?: number;
      fecha_vencimiento?: string;
    }>;
    referencias_comerciales: Array<{
      entidad: string;
      tipo_producto: string;
      telefono?: string;
      comportamiento?: 'excelente' | 'bueno' | 'regular' | 'malo';
    }>;
    activos: Array<{
      tipo: 'inmueble' | 'vehiculo' | 'inversion' | 'otro';
      descripcion: string;
      valor_estimado?: number;
    }>;
  };
  
  informacion_vivienda: {
    tipo_vivienda: '' | 'casa' | 'apartamento' | 'finca' | 'otro';
    tenencia: '' | 'propia' | 'arrendada' | 'familiar' | 'otro';
    valor_arriendo: number;
    tiempo_residencia: number;
    servicios_publicos: string[];
    estrato: number;
  };
}

interface AsociadosModuleEnhancedProps {
  // onClose?: () => void; // Removido ya que no se usa
}

const AsociadosModuleEnhanced: React.FC<AsociadosModuleEnhancedProps> = () => {
  const [asociados, setAsociados] = useState<Asociado[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingAsociado, setEditingAsociado] = useState<Asociado | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Estado del formulario
  const [formData, setFormData] = useState<FormDataExpanded>({
    tipo_documento: '',
    numero_documento: '',
    nombres: '',
    apellidos: '',
    correo_electronico: '',
    telefono_principal: '',
    estado: 'activo',
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
      estado_civil: '',
      genero: '',
      grupo_sanguineo: '',
      eps: '',
      arl: '',
      numero_hijos: 0,
      personas_a_cargo: 0,
    },
    
    informacion_academica: {
      nivel_educativo: '',
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
      tipo_contrato: '',
      fecha_vinculacion: '',
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
      ingresos_familiares: 0,
      gastos_familiares: 0,
      obligaciones: [],
      referencias_comerciales: [],
      activos: [],
    },
    
    informacion_vivienda: {
      tipo_vivienda: '',
      tenencia: '',
      valor_arriendo: 0,
      tiempo_residencia: 0,
      servicios_publicos: [],
      estrato: 0,
    },
  });

  // Cargar asociados al montar el componente
  useEffect(() => {
    cargarAsociados();
  }, []);

  const cargarAsociados = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await asociadoService.listarAsociados({ limit: 50 });
      setAsociados(response.datos);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar asociados');
    } finally {
      setLoading(false);
    }
  };

  const handleCrearAsociado = () => {
    resetForm();
    setEditingAsociado(null);
    setShowForm(true);
    setCurrentStep(0);
  };

  const handleEditarAsociado = (asociado: Asociado) => {
    // Convertir datos del backend al formato del formulario
    const formDataFromAsociado: FormDataExpanded = {
      tipo_documento: asociado.tipo_documento,
      numero_documento: asociado.numero_documento,
      nombres: asociado.nombres,
      apellidos: asociado.apellidos,
      correo_electronico: asociado.correo_electronico,
      telefono_principal: asociado.telefono_principal || '',
      estado: asociado.estado as 'activo' | 'inactivo' | 'retirado',
      fecha_ingreso: asociado.fecha_ingreso,
      observaciones: asociado.observaciones || '',
      
      datos_personales: {
        fecha_nacimiento: asociado.datos_personales?.fecha_nacimiento || '',
        lugar_nacimiento: asociado.datos_personales?.lugar_nacimiento || '',
        direccion: asociado.datos_personales?.direccion || '',
        barrio: asociado.datos_personales?.barrio || '',
        ciudad: asociado.datos_personales?.ciudad || '',
        departamento: asociado.datos_personales?.departamento || '',
        pais: asociado.datos_personales?.pais || 'Colombia',
        codigo_postal: asociado.datos_personales?.codigo_postal || '',
        telefono_secundario: asociado.datos_personales?.telefono_alternativo || '',
        estado_civil: asociado.datos_personales?.estado_civil || '',
        genero: asociado.datos_personales?.genero || '',
        grupo_sanguineo: asociado.datos_personales?.grupo_sanguineo || '',
        eps: asociado.datos_personales?.eps || '',
        arl: asociado.datos_personales?.arl || '',
        numero_hijos: asociado.datos_personales?.numero_hijos || 0,
        personas_a_cargo: asociado.datos_personales?.personas_a_cargo || 0,
      },
      
      informacion_academica: {
        nivel_educativo: asociado.informacion_academica?.nivel_educativo || '',
        institucion: asociado.informacion_academica?.institucion || '',
        titulo_obtenido: asociado.informacion_academica?.titulo_obtenido || '',
        ano_graduacion: asociado.informacion_academica?.ano_graduacion || new Date().getFullYear(),
        en_estudio: asociado.informacion_academica?.en_estudio || false,
        programa_actual: asociado.informacion_academica?.programa_actual || '',
        institucion_actual: asociado.informacion_academica?.institucion_actual || '',
        semestre_actual: asociado.informacion_academica?.semestre_actual || 1,
        certificaciones: asociado.informacion_academica?.certificaciones || [],
      },
      
      datos_laborales: {
        institucion_educativa: asociado.datos_laborales?.institucion_educativa || '',
        cargo: asociado.datos_laborales?.cargo || '',
        area_trabajo: asociado.datos_laborales?.area_trabajo || '',
        tipo_contrato: asociado.datos_laborales?.tipo_contrato || '',
        fecha_vinculacion: asociado.datos_laborales?.fecha_vinculacion || '',
        salario_basico: asociado.datos_laborales?.salario_basico || 0,
        bonificaciones: asociado.datos_laborales?.bonificaciones || 0,
        jefe_inmediato: asociado.datos_laborales?.jefe_inmediato || '',
        telefono_jefe: asociado.datos_laborales?.telefono_jefe || '',
        email_jefe: asociado.datos_laborales?.email_jefe || '',
        sede_trabajo: asociado.datos_laborales?.sede_trabajo || '',
        horario_trabajo: asociado.datos_laborales?.horario_trabajo || '',
        experiencia_laboral: asociado.datos_laborales?.experiencia_laboral || [],
      },
      
      informacion_familiar: {
        familiares: asociado.informacion_familiar?.familiares || [],
        contactos_emergencia: asociado.informacion_familiar?.contactos_emergencia || [],
        personas_autorizadas: asociado.informacion_familiar?.personas_autorizadas || [],
      },
      
      informacion_financiera: {
        ingresos_mensuales: asociado.informacion_financiera?.ingresos_mensuales || 0,
        ingresos_adicionales: asociado.informacion_financiera?.ingresos_adicionales || 0,
        egresos_mensuales: asociado.informacion_financiera?.egresos_mensuales || 0,
        ingresos_familiares: asociado.informacion_financiera?.ingresos_familiares || 0,
        gastos_familiares: asociado.informacion_financiera?.gastos_familiares || 0,
        obligaciones: asociado.informacion_financiera?.obligaciones || [],
        referencias_comerciales: asociado.informacion_financiera?.referencias_comerciales || [],
        activos: asociado.informacion_financiera?.activos || [],
      },
      
      informacion_vivienda: {
        tipo_vivienda: asociado.informacion_vivienda?.tipo_vivienda || '',
        tenencia: asociado.informacion_vivienda?.tenencia || '',
        valor_arriendo: asociado.informacion_vivienda?.valor_arriendo || 0,
        tiempo_residencia: asociado.informacion_vivienda?.tiempo_residencia || 0,
        servicios_publicos: asociado.informacion_vivienda?.servicios_publicos || [],
        estrato: asociado.informacion_vivienda?.estrato || 0,
      },
    };

    setFormData(formDataFromAsociado);
    setEditingAsociado(asociado);
    setShowForm(true);
    setCurrentStep(0);
    
    // Si hay foto, cargar preview
    if (asociado.foto_url) {
      setPhotoPreview(asociado.foto_url);
    }
  };

  const resetForm = () => {
    setFormData({
      tipo_documento: '',
      numero_documento: '',
      nombres: '',
      apellidos: '',
      correo_electronico: '',
      telefono_principal: '',
      estado: 'activo',
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
        estado_civil: '',
        genero: '',
        grupo_sanguineo: '',
        eps: '',
        arl: '',
        numero_hijos: 0,
        personas_a_cargo: 0,
      },
      
      informacion_academica: {
        nivel_educativo: '',
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
        tipo_contrato: '',
        fecha_vinculacion: '',
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
        ingresos_familiares: 0,
        gastos_familiares: 0,
        obligaciones: [],
        referencias_comerciales: [],
        activos: [],
      },
      
      informacion_vivienda: {
        tipo_vivienda: '',
        tenencia: '',
        valor_arriendo: 0,
        tiempo_residencia: 0,
        servicios_publicos: [],
        estrato: 0,
      },
    });
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);

      // Convertir FormDataExpanded a AsociadoFormData
      const dataToSend: AsociadoFormData = {
        ...formData,
        datos_personales: {
          ...formData.datos_personales,
          numero_hijos: 0, // Valor por defecto
          personas_a_cargo: 0, // Valor por defecto
        }
      };

      let asociado: Asociado;

      if (editingAsociado) {
        // Actualizar asociado existente
        asociado = await asociadoService.actualizarAsociado(editingAsociado.id, dataToSend);
      } else {
        // Crear nuevo asociado
        asociado = await asociadoService.crearAsociado(dataToSend);
      }

      // Si hay foto, subirla
      if (photoFile && asociado.id) {
        await asociadoService.subirFoto(asociado.id, photoFile);
      }

      // Recargar lista de asociados
      await cargarAsociados();
      
      // Cerrar formulario
      setShowForm(false);
      resetForm();
      
      alert(editingAsociado ? 'Asociado actualizado exitosamente' : 'Asociado creado exitosamente');
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar asociado');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    resetForm();
  };

  const handleEliminarAsociado = async (id: number) => {
    if (!confirm('¿Está seguro de que desea eliminar este asociado?')) {
      return;
    }

    try {
      setLoading(true);
      await asociadoService.eliminarAsociado(id);
      await cargarAsociados();
      alert('Asociado eliminado exitosamente');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar asociado');
    } finally {
      setLoading(false);
    }
  };

  if (showForm) {
    return (
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
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Gestión de Asociados</h1>
        <button
          onClick={handleCrearAsociado}
          className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          Nuevo Asociado
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      ) : (
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Foto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Documento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nombre Completo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Correo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha Ingreso
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {asociados.map((asociado) => (
                  <tr key={asociado.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {asociado.foto_url ? (
                        <img
                          src={asociado.foto_url}
                          alt="Foto"
                          className="h-12 w-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-400 text-lg">👤</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {asociado.tipo_documento}: {asociado.numero_documento}
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
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {asociado.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(asociado.fecha_ingreso).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditarAsociado(asociado)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleEliminarAsociado(asociado.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {asociados.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No hay asociados registrados</p>
          <button
            onClick={handleCrearAsociado}
            className="mt-4 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Crear Primer Asociado
          </button>
        </div>
      )}
    </div>
  );
};

export default AsociadosModuleEnhanced;
