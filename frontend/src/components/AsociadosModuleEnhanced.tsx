import React, { useState, useEffect } from 'react';
import { asociadoService, Asociado, AsociadoBackendData } from '../services/asociadoService';
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
    numero_hijos: number;
    personas_a_cargo: number;
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
  onBack?: () => void;
}

const AsociadosModuleEnhanced: React.FC<AsociadosModuleEnhancedProps> = ({ onBack }) => {
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
      console.error('Error al cargar asociados:', err);
      let errorMessage = 'Error al cargar asociados';
      
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'object' && err !== null) {
        errorMessage = (err as any).detail || (err as any).message || 'Error de conexión con el servidor';
      }
      
      setError(errorMessage);
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
    
    // LOGS SUPER DETALLADOS PARA DEBUG
    console.log('🚀 INICIO HANDLESUBMIT');
    console.log('FormData:', formData);
    
    try {
      setLoading(true);
      setError(null);

      console.log('📝 Preparando datos para envío...');

      // Convertir FormDataExpanded a la estructura que espera el backend
      const dataToSend = {
        tipo_documento: formData.tipo_documento,
        numero_documento: formData.numero_documento,
        nombres: formData.nombres,
        apellidos: formData.apellidos,
        correo_electronico: formData.correo_electronico,
        telefono_principal: formData.telefono_principal,
        estado: formData.estado,
        fecha_ingreso: formData.fecha_ingreso,
        observaciones: formData.observaciones || "",
        
        datos_personales: {
          fecha_nacimiento: formData.datos_personales.fecha_nacimiento,
          lugar_nacimiento: formData.datos_personales.lugar_nacimiento || "",
          direccion: formData.datos_personales.direccion,
          barrio: formData.datos_personales.barrio || "",
          ciudad: formData.datos_personales.ciudad,
          departamento: formData.datos_personales.departamento,
          pais: formData.datos_personales.pais || "Colombia",
          codigo_postal: formData.datos_personales.codigo_postal || "",
          estado_civil: formData.datos_personales.estado_civil || "",
          genero: formData.datos_personales.genero || "",
          grupo_sanguineo: formData.datos_personales.grupo_sanguineo || "",
          eps: formData.datos_personales.eps || "",
          arl: formData.datos_personales.arl || "",
          telefono_alternativo: formData.datos_personales.telefono_secundario || "",
          numero_hijos: formData.datos_personales.numero_hijos || 0,
          personas_a_cargo: formData.datos_personales.personas_a_cargo || 0,
        },
        
        datos_laborales: {
          institucion_educativa: formData.datos_laborales.institucion_educativa || "Sin especificar",
          cargo: formData.datos_laborales.cargo || "Sin especificar",
          tipo_contrato: formData.datos_laborales.tipo_contrato || "Sin especificar",
          fecha_vinculacion: formData.datos_laborales.fecha_vinculacion || formData.fecha_ingreso,
          salario_basico: formData.datos_laborales.salario_basico || 0,
          horario: formData.datos_laborales.horario_trabajo || "",
          dependencia: formData.datos_laborales.area_trabajo || "",
        },
        
        informacion_familiar: {
          familiares: formData.informacion_familiar.familiares || [],
          contactos_emergencia: formData.informacion_familiar.contactos_emergencia || [],
          personas_autorizadas: formData.informacion_familiar.personas_autorizadas || [],
        },
        
        informacion_financiera: {
          ingresos_mensuales: Math.max(formData.informacion_financiera.ingresos_mensuales || 0, 0),
          ingresos_adicionales: formData.informacion_financiera.ingresos_adicionales || 0,
          egresos_mensuales: Math.max(formData.informacion_financiera.egresos_mensuales || 0, 0),
          ingresos_familiares: formData.informacion_financiera.ingresos_familiares || 0,
          gastos_familiares: formData.informacion_financiera.gastos_familiares || 0,
          obligaciones: formData.informacion_financiera.obligaciones || [],
          referencias_comerciales: formData.informacion_financiera.referencias_comerciales || [],
          activos: formData.informacion_financiera.activos || [],
        },
        
        informacion_academica: {
          nivel_educativo: formData.informacion_academica.nivel_educativo || "Sin especificar",
          institucion: formData.informacion_academica.institucion || "",
          titulo_obtenido: formData.informacion_academica.titulo_obtenido || "",
          ano_graduacion: formData.informacion_academica.ano_graduacion || new Date().getFullYear(),
          en_estudio: formData.informacion_academica.en_estudio || false,
          programa_actual: formData.informacion_academica.programa_actual || "",
          institucion_actual: formData.informacion_academica.institucion_actual || "",
          semestre_actual: formData.informacion_academica.semestre_actual || 1,
          certificaciones: formData.informacion_academica.certificaciones || [],
        },
        
        informacion_vivienda: {
          tipo_vivienda: formData.informacion_vivienda.tipo_vivienda || "Sin especificar",
          tenencia: formData.informacion_vivienda.tenencia || "Sin especificar",
          valor_arriendo: formData.informacion_vivienda.valor_arriendo || 0,
          tiempo_residencia: formData.informacion_vivienda.tiempo_residencia || 0,
          servicios_publicos: formData.informacion_vivienda.servicios_publicos || [],
          estrato: formData.informacion_vivienda.estrato || 0,
        },
      };

      console.log('📤 Datos preparados para envío:', JSON.stringify(dataToSend, null, 2));

      let asociado: Asociado;

      console.log('🔄 Enviando datos al backend...');
      if (editingAsociado) {
        console.log('✏️ Actualizando asociado existente ID:', editingAsociado.id);
        // Actualizar asociado existente
        asociado = await asociadoService.actualizarAsociado(editingAsociado.id, dataToSend as unknown as AsociadoBackendData);
      } else {
        console.log('➕ Creando nuevo asociado...');
        // Crear nuevo asociado
        asociado = await asociadoService.crearAsociado(dataToSend as unknown as AsociadoBackendData);
      }

      console.log('✅ Respuesta del backend:', asociado);

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
      console.error('🔥 ERROR CAPTURADO EN HANDLESUBMIT:', err);
      console.error('🔍 Tipo de error:', typeof err);
      console.error('🔍 Constructor del error:', err?.constructor?.name);
      console.error('🔍 Error completo:', JSON.stringify(err, Object.getOwnPropertyNames(err)));
      
      let errorMessage = 'Error al guardar asociado';
      
      // INVESTIGACIÓN EXHAUSTIVA DEL ERROR
      if (err instanceof Error) {
        console.log('✅ Es una instancia de Error');
        console.log('📝 Message:', err.message);
        console.log('📝 Stack:', err.stack);
        errorMessage = err.message;
      } else if (err && typeof err === 'object') {
        console.log('⚠️ Es un objeto pero no Error');
        console.log('🔍 Keys del objeto:', Object.keys(err));
        console.log('🔍 Valores:', Object.values(err));
        
        const errorObj = err as any;
        
        // Buscar el mensaje en todas las propiedades posibles
        if (errorObj.detail) {
          console.log('📄 Tiene detail:', errorObj.detail);
          errorMessage = Array.isArray(errorObj.detail) 
            ? errorObj.detail.map((e: any) => e.msg || e).join(', ')
            : String(errorObj.detail);
        } else if (errorObj.message) {
          console.log('📄 Tiene message:', errorObj.message);
          errorMessage = String(errorObj.message);
        } else if (errorObj.error) {
          console.log('📄 Tiene error:', errorObj.error);
          errorMessage = String(errorObj.error);
        } else {
          console.log('📄 Convirtiendo objeto completo a string');
          errorMessage = `Error del servidor: ${JSON.stringify(errorObj)}`;
        }
      } else {
        console.log('❓ Tipo desconocido de error');
        errorMessage = String(err);
      }
      
      console.log('🎯 Error message final:', errorMessage);
      
      // Forzar que se muestre el error en múltiples lugares
      setError(errorMessage);
      alert(`🚨 ERROR DETALLADO:\n${errorMessage}\n\nRevisa la consola para más detalles.`);
      
      // También intentar mostrar en el DOM directamente
      const errorDiv = document.createElement('div');
      errorDiv.style.cssText = 'position:fixed;top:10px;right:10px;background:red;color:white;padding:10px;z-index:9999;max-width:400px;';
      errorDiv.innerHTML = `<strong>ERROR:</strong><br>${errorMessage}`;
      document.body.appendChild(errorDiv);
      setTimeout(() => document.body.removeChild(errorDiv), 10000);
      
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
        <div className="flex items-center">
          {onBack && (
            <button
              onClick={onBack}
              className="mr-4 p-2 hover:bg-gray-100 rounded"
            >
              <svg className="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Asociados</h1>
        </div>
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
