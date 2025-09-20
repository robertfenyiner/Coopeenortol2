import React from 'react';

// Interfaces para el formulario expandido
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
    ingresos_familiares: number;
    gastos_familiares: number;
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
    servicios_publicos: Array<string>;
    estrato: number;
  };
}

interface AsociadoFormExpandedProps {
  formData: FormDataExpanded;
  setFormData: React.Dispatch<React.SetStateAction<FormDataExpanded>>;
  currentStep: number;
  setCurrentStep: React.Dispatch<React.SetStateAction<number>>;
  photoFile: File | null;
  setPhotoFile: React.Dispatch<React.SetStateAction<File | null>>;
  photoPreview: string | null;
  setPhotoPreview: React.Dispatch<React.SetStateAction<string | null>>;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  isEditing?: boolean;
}

const AsociadoFormExpanded: React.FC<AsociadoFormExpandedProps> = ({
  formData,
  setFormData,
  currentStep,
  setCurrentStep,
  setPhotoFile,
  photoPreview,
  setPhotoPreview,
  onSubmit,
  onCancel,
  isEditing = false
}) => {
  
  // Definir los pasos del formulario
  const formSteps = [
    { id: 0, title: 'Datos Básicos', icon: '👤', description: 'Información básica de identificación' },
    { id: 1, title: 'Información Personal', icon: '📋', description: 'Datos personales y de contacto' },
    { id: 2, title: 'Información Académica', icon: '🎓', description: 'Educación y certificaciones' },
    { id: 3, title: 'Información Laboral', icon: '💼', description: 'Experiencia y datos laborales' },
    { id: 4, title: 'Información Familiar', icon: '👨‍👩‍👧‍👦', description: 'Familiares y contactos de emergencia' },
    { id: 5, title: 'Información Financiera', icon: '💰', description: 'Ingresos, egresos y patrimonio' },
    { id: 6, title: 'Información de Vivienda', icon: '🏠', description: 'Datos de la vivienda' },
    { id: 7, title: 'Foto y Revisión', icon: '📸', description: 'Foto del asociado y revisión final' }
  ];

  // Manejar foto del asociado
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        alert('Por favor selecciona un archivo de imagen válido');
        return;
      }
      
      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('La imagen debe ser menor a 5MB');
        return;
      }
      
      setPhotoFile(file);
      
      // Crear preview
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhotoPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Eliminar foto
  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  // Navegar entre pasos
  const nextStep = () => {
    if (currentStep < formSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToStep = (step: number) => {
    setCurrentStep(step);
  };

  // Validar paso actual
  const validateCurrentStep = (): boolean => {
    switch (currentStep) {
      case 0: // Datos Básicos
        return !!(formData.tipo_documento && formData.numero_documento && formData.nombres && formData.apellidos);
      case 1: // Información Personal
        return !!(formData.correo_electronico && formData.datos_personales.fecha_nacimiento);
      case 2: // Información Académica
        return !!formData.informacion_academica.nivel_educativo;
      case 3: // Información Laboral
        return !!(formData.datos_laborales.cargo && formData.datos_laborales.salario_basico > 0);
      default:
        return true;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-screen overflow-y-auto">
        {/* Header del modal */}
        <div className="bg-green-600 text-white p-6 rounded-t-lg">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">
              {isEditing ? 'Editar Asociado' : 'Nuevo Asociado'}
            </h2>
            <button
              onClick={onCancel}
              className="text-white hover:bg-green-700 p-2 rounded"
            >
              ✕
            </button>
          </div>
          
          {/* Indicador de progreso */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm">
              <span>Paso {currentStep + 1} de {formSteps.length}</span>
              <span>{Math.round(((currentStep + 1) / formSteps.length) * 100)}%</span>
            </div>
            <div className="w-full bg-green-500 rounded-full h-2 mt-2">
              <div 
                className="bg-white h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentStep + 1) / formSteps.length) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Navegación de pasos */}
        <div className="bg-gray-50 p-4 border-b">
          <div className="flex overflow-x-auto space-x-2">
            {formSteps.map((step) => (
              <button
                key={step.id}
                onClick={() => goToStep(step.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${
                  currentStep === step.id
                    ? 'bg-green-600 text-white'
                    : currentStep > step.id
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                <span className="text-lg">{step.icon}</span>
                <span>{step.title}</span>
                {currentStep > step.id && <span className="text-green-600">✓</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Contenido del formulario */}
        <form onSubmit={onSubmit} className="p-6">
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {formSteps[currentStep].title}
            </h3>
            <p className="text-gray-600 text-sm">
              {formSteps[currentStep].description}
            </p>
          </div>

          {/* Paso 0: Datos Básicos */}
          {currentStep === 0 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Documento *
                  </label>
                  <select
                    required
                    value={formData.tipo_documento}
                    onChange={(e) => setFormData({...formData, tipo_documento: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="">Seleccione tipo de documento</option>
                    <option value="TI">Tarjeta de Identidad</option>
                    <option value="CC">Cédula de Ciudadanía</option>
                    <option value="CE">Cédula de Extranjería</option>
                    <option value="PAS">Pasaporte</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Correo Electrónico *
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Teléfono Principal
                  </label>
                  <input
                    type="tel"
                    value={formData.telefono_principal}
                    onChange={(e) => setFormData({...formData, telefono_principal: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de Ingreso
                  </label>
                  <input
                    type="date"
                    value={formData.fecha_ingreso}
                    onChange={(e) => setFormData({...formData, fecha_ingreso: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
          )}

          {/* Paso 1: Información Personal */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de Nacimiento *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.datos_personales.fecha_nacimiento}
                    onChange={(e) => setFormData({
                      ...formData,
                      datos_personales: {
                        ...formData.datos_personales,
                        fecha_nacimiento: e.target.value
                      }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lugar de Nacimiento
                  </label>
                  <input
                    type="text"
                    value={formData.datos_personales.lugar_nacimiento}
                    onChange={(e) => setFormData({
                      ...formData,
                      datos_personales: {
                        ...formData.datos_personales,
                        lugar_nacimiento: e.target.value
                      }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estado Civil
                  </label>
                  <select
                    value={formData.datos_personales.estado_civil}
                    onChange={(e) => setFormData({
                      ...formData,
                      datos_personales: {
                        ...formData.datos_personales,
                        estado_civil: e.target.value as '' | 'soltero' | 'casado' | 'union_libre' | 'separado' | 'divorciado' | 'viudo'
                      }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="">Seleccione estado civil</option>
                    <option value="soltero">Soltero/a</option>
                    <option value="casado">Casado/a</option>
                    <option value="union_libre">Unión Libre</option>
                    <option value="separado">Separado/a</option>
                    <option value="divorciado">Divorciado/a</option>
                    <option value="viudo">Viudo/a</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Género
                  </label>
                  <select
                    value={formData.datos_personales.genero}
                    onChange={(e) => setFormData({
                      ...formData,
                      datos_personales: {
                        ...formData.datos_personales,
                        genero: e.target.value as '' | 'masculino' | 'femenino' | 'otro'
                      }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="">Seleccione género</option>
                    <option value="masculino">Masculino</option>
                    <option value="femenino">Femenino</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Barrio
                  </label>
                  <input
                    type="text"
                    value={formData.datos_personales.barrio}
                    onChange={(e) => setFormData({
                      ...formData,
                      datos_personales: {
                        ...formData.datos_personales,
                        barrio: e.target.value
                      }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ciudad
                  </label>
                  <input
                    type="text"
                    value={formData.datos_personales.ciudad}
                    onChange={(e) => setFormData({
                      ...formData,
                      datos_personales: {
                        ...formData.datos_personales,
                        ciudad: e.target.value
                      }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Departamento
                  </label>
                  <input
                    type="text"
                    value={formData.datos_personales.departamento}
                    onChange={(e) => setFormData({
                      ...formData,
                      datos_personales: {
                        ...formData.datos_personales,
                        departamento: e.target.value
                      }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    País
                  </label>
                  <input
                    type="text"
                    value={formData.datos_personales.pais}
                    onChange={(e) => setFormData({
                      ...formData,
                      datos_personales: {
                        ...formData.datos_personales,
                        pais: e.target.value
                      }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Teléfono Secundario
                  </label>
                  <input
                    type="tel"
                    value={formData.datos_personales.telefono_secundario}
                    onChange={(e) => setFormData({
                      ...formData,
                      datos_personales: {
                        ...formData.datos_personales,
                        telefono_secundario: e.target.value
                      }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Grupo Sanguíneo
                  </label>
                  <select
                    value={formData.datos_personales.grupo_sanguineo}
                    onChange={(e) => setFormData({
                      ...formData,
                      datos_personales: {
                        ...formData.datos_personales,
                        grupo_sanguineo: e.target.value
                      }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="">Seleccione grupo sanguíneo</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    EPS
                  </label>
                  <input
                    type="text"
                    value={formData.datos_personales.eps}
                    onChange={(e) => setFormData({
                      ...formData,
                      datos_personales: {
                        ...formData.datos_personales,
                        eps: e.target.value
                      }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ARL
                  </label>
                  <input
                    type="text"
                    value={formData.datos_personales.arl}
                    onChange={(e) => setFormData({
                      ...formData,
                      datos_personales: {
                        ...formData.datos_personales,
                        arl: e.target.value
                      }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Paso 2: Información Académica */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nivel Educativo *
                  </label>
                  <select
                    required
                    value={formData.informacion_academica.nivel_educativo}
                    onChange={(e) => setFormData({
                      ...formData,
                      informacion_academica: {
                        ...formData.informacion_academica,
                        nivel_educativo: e.target.value as '' | 'primaria' | 'bachillerato' | 'tecnico' | 'tecnologo' | 'universitario' | 'especializacion' | 'maestria' | 'doctorado'
                      }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="">Seleccione nivel educativo</option>
                    <option value="primaria">Primaria</option>
                    <option value="bachillerato">Bachillerato</option>
                    <option value="tecnico">Técnico</option>
                    <option value="tecnologo">Tecnólogo</option>
                    <option value="universitario">Universitario</option>
                    <option value="especializacion">Especialización</option>
                    <option value="maestria">Maestría</option>
                    <option value="doctorado">Doctorado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Institución
                  </label>
                  <input
                    type="text"
                    value={formData.informacion_academica.institucion}
                    onChange={(e) => setFormData({
                      ...formData,
                      informacion_academica: {
                        ...formData.informacion_academica,
                        institucion: e.target.value
                      }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Título Obtenido
                  </label>
                  <input
                    type="text"
                    value={formData.informacion_academica.titulo_obtenido}
                    onChange={(e) => setFormData({
                      ...formData,
                      informacion_academica: {
                        ...formData.informacion_academica,
                        titulo_obtenido: e.target.value
                      }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Año de Graduación
                  </label>
                  <input
                    type="number"
                    value={formData.informacion_academica.ano_graduacion}
                    onChange={(e) => setFormData({
                      ...formData,
                      informacion_academica: {
                        ...formData.informacion_academica,
                        ano_graduacion: parseInt(e.target.value) || new Date().getFullYear()
                      }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.informacion_academica.en_estudio}
                    onChange={(e) => setFormData({
                      ...formData,
                      informacion_academica: {
                        ...formData.informacion_academica,
                        en_estudio: e.target.checked
                      }
                    })}
                    className="rounded border-gray-300 focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-700">Actualmente estudiando</span>
                </label>
              </div>

              {formData.informacion_academica.en_estudio && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-green-50 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Programa Actual
                    </label>
                    <input
                      type="text"
                      value={formData.informacion_academica.programa_actual}
                      onChange={(e) => setFormData({
                        ...formData,
                        informacion_academica: {
                          ...formData.informacion_academica,
                          programa_actual: e.target.value
                        }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Institución Actual
                    </label>
                    <input
                      type="text"
                      value={formData.informacion_academica.institucion_actual}
                      onChange={(e) => setFormData({
                        ...formData,
                        informacion_academica: {
                          ...formData.informacion_academica,
                          institucion_actual: e.target.value
                        }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Semestre Actual
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="12"
                      value={formData.informacion_academica.semestre_actual}
                      onChange={(e) => setFormData({
                        ...formData,
                        informacion_academica: {
                          ...formData.informacion_academica,
                          semestre_actual: parseInt(e.target.value) || 1
                        }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Paso 7: Foto y Revisión */}
          {currentStep === 7 && (
            <div className="space-y-6">
              {/* Sección de foto */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Foto del Asociado</h4>
                
                {!photoPreview ? (
                  <div className="flex flex-col items-center">
                    <div className="w-32 h-32 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                      <span className="text-4xl text-gray-400">👤</span>
                    </div>
                    
                    <label className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 cursor-pointer">
                      Seleccionar Foto
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoChange}
                        className="hidden"
                      />
                    </label>
                    <p className="text-sm text-gray-500 mt-2">
                      Formatos permitidos: JPG, PNG. Máximo 5MB
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <img
                      src={photoPreview}
                      alt="Preview"
                      className="w-32 h-32 object-cover rounded-full mb-4"
                    />
                    <div className="flex space-x-2">
                      <label className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 cursor-pointer">
                        Cambiar Foto
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoChange}
                          className="hidden"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={removePhoto}
                        className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Resumen de datos */}
              <div className="bg-blue-50 p-6 rounded-lg">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Resumen de Información</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Datos Básicos:</strong>
                    <p>{formData.nombres} {formData.apellidos}</p>
                    <p>{formData.tipo_documento}: {formData.numero_documento}</p>
                    <p>{formData.correo_electronico}</p>
                  </div>
                  
                  <div>
                    <strong>Información Personal:</strong>
                    <p>Nacimiento: {formData.datos_personales.fecha_nacimiento}</p>
                    <p>Ciudad: {formData.datos_personales.ciudad}</p>
                    <p>Estado Civil: {formData.datos_personales.estado_civil}</p>
                  </div>

                  <div>
                    <strong>Información Académica:</strong>
                    <p>Nivel: {formData.informacion_academica.nivel_educativo}</p>
                    <p>Institución: {formData.informacion_academica.institucion}</p>
                  </div>

                  <div>
                    <strong>Información Laboral:</strong>
                    <p>Cargo: {formData.datos_laborales.cargo}</p>
                    <p>Salario: ${formData.datos_laborales.salario_basico?.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navegación */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t">
            <div>
              {currentStep > 0 && (
                <button
                  type="button"
                  onClick={prevStep}
                  className="bg-gray-200 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-300 transition-colors"
                >
                  ← Anterior
                </button>
              )}
            </div>

            <div className="flex space-x-4">
              <button
                type="button"
                onClick={onCancel}
                className="bg-gray-200 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cancelar
              </button>

              {currentStep < formSteps.length - 1 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={!validateCurrentStep()}
                  className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  Siguiente →
                </button>
              ) : (
                <button
                  type="submit"
                  className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors"
                >
                  {isEditing ? 'Actualizar Asociado' : 'Crear Asociado'}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AsociadoFormExpanded;