import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { useToast } from '../contexts/ToastContext';
import api from '../lib/axios';

interface DatosPersonales {
  fecha_nacimiento?: string;
  lugar_nacimiento?: string;
  direccion?: string;
  barrio?: string;
  ciudad?: string;
  departamento?: string;
  pais?: string;
  estado_civil?: string;
  genero?: string;
  grupo_sanguineo?: string;
  eps?: string;
  arl?: string;
  telefono_alternativo?: string;
  numero_hijos?: number;
  personas_a_cargo?: number;
}

interface DatosLaborales {
  institucion_educativa?: string;
  cargo?: string;
  tipo_contrato?: string;
  fecha_vinculacion?: string;
  salario_basico?: number;
  horario?: string;
  dependencia?: string;
}

interface InformacionFinanciera {
  ingresos_mensuales?: number;
  ingresos_adicionales?: number;
  egresos_mensuales?: number;
  ingresos_familiares?: number;
  gastos_familiares?: number;
  endeudamiento?: number;
  calificacion_riesgo?: string;
  observaciones?: string;
}

interface InformacionAcademica {
  nivel_educativo?: string;
  institucion?: string;
  titulo_obtenido?: string;
  ano_graduacion?: number;
  en_estudio?: boolean;
  programa_actual?: string;
  institucion_actual?: string;
  semestre_actual?: number;
}

interface InformacionVivienda {
  tipo_vivienda?: string;
  tenencia?: string;
  valor_arriendo?: number;
  tiempo_residencia?: number;
  estrato?: number;
}

interface AsociadoData {
  tipo_documento: string;
  numero_documento: string;
  nombres: string;
  apellidos: string;
  correo_electronico: string;
  telefono_principal: string;
  estado: string;
  fecha_ingreso: string;
  observaciones?: string;
  datos_personales?: DatosPersonales;
  datos_laborales?: DatosLaborales;
  informacion_financiera?: InformacionFinanciera;
  informacion_academica?: InformacionAcademica;
  informacion_vivienda?: InformacionVivienda;
}

export default function AsociadoEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('basico');
  const [formData, setFormData] = useState<AsociadoData>({
    tipo_documento: 'CC',
    numero_documento: '',
    nombres: '',
    apellidos: '',
    correo_electronico: '',
    telefono_principal: '',
    estado: 'activo',
    fecha_ingreso: new Date().toISOString().split('T')[0],
    observaciones: '',
    datos_personales: {},
    datos_laborales: {},
    informacion_financiera: {},
    informacion_academica: {},
    informacion_vivienda: {},
  });

  useEffect(() => {
    if (id) {
      loadAsociado();
    } else {
      setLoading(false);
    }
  }, [id]);

  const loadAsociado = async () => {
    try {
      const response = await api.get(`/asociados/${id}`);
      const data = response.data;
      setFormData({
        tipo_documento: data.tipo_documento || 'CC',
        numero_documento: data.numero_documento || '',
        nombres: data.nombres || '',
        apellidos: data.apellidos || '',
        correo_electronico: data.correo_electronico || '',
        telefono_principal: data.telefono_principal || '',
        estado: data.estado || 'activo',
        fecha_ingreso: data.fecha_ingreso || new Date().toISOString().split('T')[0],
        observaciones: data.observaciones || '',
        datos_personales: data.datos_personales || {},
        datos_laborales: data.datos_laborales || {},
        informacion_financiera: data.informacion_financiera || {},
        informacion_academica: data.informacion_academica || {},
        informacion_vivienda: data.informacion_vivienda || {},
      });
    } catch (error: any) {
      showToast('error', 'Error al cargar el asociado');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Función para limpiar objetos y filtrar solo campos válidos
      const cleanObject = (obj: any, validFields: string[]): any => {
        const cleaned: any = {};
        Object.keys(obj).forEach(key => {
          // Solo incluir si está en la lista de campos válidos
          if (!validFields.includes(key)) return;
          
          const value = obj[key];
          if (value !== null && value !== undefined && value !== '') {
            cleaned[key] = value;
          }
        });
        return Object.keys(cleaned).length > 0 ? cleaned : null;
      };

      // Preparar datos para enviar - solo campos básicos
      const dataToSend: any = {
        tipo_documento: formData.tipo_documento,
        numero_documento: formData.numero_documento,
        nombres: formData.nombres,
        apellidos: formData.apellidos,
        correo_electronico: formData.correo_electronico,
        telefono_principal: formData.telefono_principal,
        estado: formData.estado,
        fecha_ingreso: formData.fecha_ingreso,
      };
      
      if (formData.observaciones) {
        dataToSend.observaciones = formData.observaciones;
      }

      // Agregar datos adicionales si existen y tienen contenido
      const validPersonalFields = [
        'fecha_nacimiento', 'lugar_nacimiento', 'direccion', 'barrio', 'ciudad',
        'departamento', 'pais', 'estado_civil', 'genero', 'grupo_sanguineo',
        'eps', 'arl', 'telefono_alternativo', 'numero_hijos', 'personas_a_cargo'
      ];
      const datosPersonalesLimpios = cleanObject(formData.datos_personales || {}, validPersonalFields);
      if (datosPersonalesLimpios) {
        dataToSend.datos_personales = datosPersonalesLimpios;
      }
      
      const validLaboralFields = [
        'institucion_educativa', 'cargo', 'tipo_contrato', 'fecha_vinculacion',
        'salario_basico', 'horario', 'dependencia'
      ];
      const datosLaboralesLimpios = cleanObject(formData.datos_laborales || {}, validLaboralFields);
      if (datosLaboralesLimpios) {
        dataToSend.datos_laborales = datosLaboralesLimpios;
      }
      
      const validFinancialFields = [
        'ingresos_mensuales', 'ingresos_adicionales', 'egresos_mensuales',
        'ingresos_familiares', 'gastos_familiares', 'endeudamiento', 'calificacion_riesgo', 'observaciones'
      ];
      const informacionFinancieraLimpia = cleanObject(formData.informacion_financiera || {}, validFinancialFields);
      if (informacionFinancieraLimpia) {
        dataToSend.informacion_financiera = informacionFinancieraLimpia;
      }
      
      const validAcademicFields = [
        'nivel_educativo', 'institucion', 'titulo_obtenido', 'ano_graduacion',
        'en_estudio', 'programa_actual', 'institucion_actual', 'semestre_actual'
      ];
      const informacionAcademicaLimpia = cleanObject(formData.informacion_academica || {}, validAcademicFields);
      if (informacionAcademicaLimpia) {
        dataToSend.informacion_academica = informacionAcademicaLimpia;
      }
      
      const validViviendaFields = [
        'tipo_vivienda', 'tenencia', 'valor_arriendo', 'tiempo_residencia', 'estrato'
      ];
      const informacionViviendaLimpia = cleanObject(formData.informacion_vivienda || {}, validViviendaFields);
      if (informacionViviendaLimpia) {
        dataToSend.informacion_vivienda = informacionViviendaLimpia;
      }

      console.log('Datos a enviar:', JSON.stringify(dataToSend, null, 2));

      if (id) {
        await api.put(`/asociados/${id}`, dataToSend);
        showToast('success', 'Asociado actualizado correctamente');
      } else {
        await api.post('/asociados/', dataToSend);
        showToast('success', 'Asociado creado correctamente');
      }
      navigate('/asociados');
    } catch (error: any) {
      const errorDetail = error.response?.data?.detail;
      const errorMessage = typeof errorDetail === 'string' 
        ? errorDetail 
        : 'Error al guardar el asociado';
      showToast('error', errorMessage);
      console.error('Error al guardar:', error.response?.data);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNestedChange = (
    section: 'datos_personales' | 'datos_laborales' | 'informacion_financiera' | 'informacion_academica' | 'informacion_vivienda', 
    field: string, 
    value: any
  ) => {
    // Convertir a número si el campo es numérico y no está vacío
    const integerFields = ['numero_hijos', 'personas_a_cargo', 'ano_graduacion', 'semestre_actual', 'tiempo_residencia', 'estrato'];
    const floatFields = [
      'salario_basico', 'ingresos_mensuales', 'ingresos_adicionales', 'egresos_mensuales',
      'ingresos_familiares', 'gastos_familiares', 'endeudamiento', 'valor_arriendo'
    ];
    
    let processedValue = value;
    if (value !== '') {
      if (integerFields.includes(field)) {
        const numValue = parseInt(value);
        processedValue = isNaN(numValue) ? value : numValue;
      } else if (floatFields.includes(field)) {
        const numValue = parseFloat(value);
        processedValue = isNaN(numValue) ? value : numValue;
      }
    }
    
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: processedValue,
      },
    }));
  };

  const tabs = [
    { id: 'basico', label: 'Datos Básicos' },
    { id: 'personal', label: 'Datos Personales' },
    { id: 'laboral', label: 'Datos Laborales' },
    { id: 'financiero', label: 'Información Financiera' },
    { id: 'academico', label: 'Información Académica' },
    { id: 'vivienda', label: 'Información de Vivienda' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <button
            onClick={() => navigate('/asociados')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Asociados
          </button>
          <h1 className="text-3xl font-bold text-gray-900">
            {id ? 'Editar Asociado' : 'Nuevo Asociado'}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          {/* Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-green-600 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Datos Básicos */}
          {activeTab === 'basico' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Select
                label="Tipo de Documento *"
                value={formData.tipo_documento}
                onChange={(e) => handleChange('tipo_documento', e.target.value)}
                required
                options={[
                  { value: 'CC', label: 'Cédula de Ciudadanía' },
                  { value: 'TI', label: 'Tarjeta de Identidad' },
                  { value: 'CE', label: 'Cédula de Extranjería' },
                  { value: 'PA', label: 'Pasaporte' },
                  { value: 'NIT', label: 'NIT' },
                ]}
              />

              <Input
                label="Número de Documento *"
                type="text"
                value={formData.numero_documento}
                onChange={(e) => handleChange('numero_documento', e.target.value)}
                required
              />

              <Input
                label="Nombres *"
                type="text"
                value={formData.nombres}
                onChange={(e) => handleChange('nombres', e.target.value)}
                required
              />

              <Input
                label="Apellidos *"
                type="text"
                value={formData.apellidos}
                onChange={(e) => handleChange('apellidos', e.target.value)}
                required
              />

              <Input
                label="Correo Electrónico *"
                type="email"
                value={formData.correo_electronico}
                onChange={(e) => handleChange('correo_electronico', e.target.value)}
                required
              />

              <Input
                label="Teléfono Principal"
                type="tel"
                value={formData.telefono_principal}
                onChange={(e) => handleChange('telefono_principal', e.target.value)}
              />

              <Select
                label="Estado *"
                value={formData.estado}
                onChange={(e) => handleChange('estado', e.target.value)}
                required
                options={[
                  { value: 'activo', label: 'Activo' },
                  { value: 'inactivo', label: 'Inactivo' },
                  { value: 'suspendido', label: 'Suspendido' },
                  { value: 'retirado', label: 'Retirado' },
                ]}
              />

              <Input
                label="Fecha de Ingreso *"
                type="date"
                value={formData.fecha_ingreso}
                onChange={(e) => handleChange('fecha_ingreso', e.target.value)}
                required
              />

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Observaciones
                </label>
                <textarea
                  value={formData.observaciones || ''}
                  onChange={(e) => handleChange('observaciones', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
          )}

          {/* Datos Personales */}
          {activeTab === 'personal' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Fecha de Nacimiento"
                type="date"
                value={formData.datos_personales?.fecha_nacimiento || ''}
                onChange={(e) => handleNestedChange('datos_personales', 'fecha_nacimiento', e.target.value)}
              />

              <Input
                label="Lugar de Nacimiento"
                type="text"
                value={formData.datos_personales?.lugar_nacimiento || ''}
                onChange={(e) => handleNestedChange('datos_personales', 'lugar_nacimiento', e.target.value)}
              />

              <Input
                label="Dirección"
                type="text"
                value={formData.datos_personales?.direccion || ''}
                onChange={(e) => handleNestedChange('datos_personales', 'direccion', e.target.value)}
              />

              <Input
                label="Barrio"
                type="text"
                value={formData.datos_personales?.barrio || ''}
                onChange={(e) => handleNestedChange('datos_personales', 'barrio', e.target.value)}
              />

              <Input
                label="Ciudad"
                type="text"
                value={formData.datos_personales?.ciudad || ''}
                onChange={(e) => handleNestedChange('datos_personales', 'ciudad', e.target.value)}
              />

              <Input
                label="Departamento"
                type="text"
                value={formData.datos_personales?.departamento || ''}
                onChange={(e) => handleNestedChange('datos_personales', 'departamento', e.target.value)}
              />

              <Input
                label="País"
                type="text"
                value={formData.datos_personales?.pais || 'Colombia'}
                onChange={(e) => handleNestedChange('datos_personales', 'pais', e.target.value)}
              />

              <Select
                label="Estado Civil"
                value={formData.datos_personales?.estado_civil || ''}
                onChange={(e) => handleNestedChange('datos_personales', 'estado_civil', e.target.value)}
                options={[
                  { value: '', label: 'Seleccionar...' },
                  { value: 'soltero', label: 'Soltero(a)' },
                  { value: 'casado', label: 'Casado(a)' },
                  { value: 'union_libre', label: 'Unión Libre' },
                  { value: 'divorciado', label: 'Divorciado(a)' },
                  { value: 'viudo', label: 'Viudo(a)' },
                ]}
              />

              <Select
                label="Género"
                value={formData.datos_personales?.genero || ''}
                onChange={(e) => handleNestedChange('datos_personales', 'genero', e.target.value)}
                options={[
                  { value: '', label: 'Seleccionar...' },
                  { value: 'M', label: 'Masculino' },
                  { value: 'F', label: 'Femenino' },
                  { value: 'otro', label: 'Otro' },
                ]}
              />

              <Input
                label="Grupo Sanguíneo"
                type="text"
                value={formData.datos_personales?.grupo_sanguineo || ''}
                onChange={(e) => handleNestedChange('datos_personales', 'grupo_sanguineo', e.target.value)}
              />

              <Input
                label="EPS"
                type="text"
                value={formData.datos_personales?.eps || ''}
                onChange={(e) => handleNestedChange('datos_personales', 'eps', e.target.value)}
              />

              <Input
                label="ARL"
                type="text"
                value={formData.datos_personales?.arl || ''}
                onChange={(e) => handleNestedChange('datos_personales', 'arl', e.target.value)}
              />

              <Input
                label="Teléfono Alternativo"
                type="tel"
                value={formData.datos_personales?.telefono_alternativo || ''}
                onChange={(e) => handleNestedChange('datos_personales', 'telefono_alternativo', e.target.value)}
              />

              <Input
                label="Número de Hijos"
                type="number"
                value={formData.datos_personales?.numero_hijos?.toString() || ''}
                onChange={(e) => handleNestedChange('datos_personales', 'numero_hijos', e.target.value)}
              />

              <Input
                label="Personas a Cargo"
                type="number"
                value={formData.datos_personales?.personas_a_cargo?.toString() || ''}
                onChange={(e) => handleNestedChange('datos_personales', 'personas_a_cargo', e.target.value)}
              />
            </div>
          )}

          {/* Datos Laborales */}
          {activeTab === 'laboral' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Institución Educativa"
                type="text"
                value={formData.datos_laborales?.institucion_educativa || ''}
                onChange={(e) => handleNestedChange('datos_laborales', 'institucion_educativa', e.target.value)}
              />

              <Input
                label="Cargo"
                type="text"
                value={formData.datos_laborales?.cargo || ''}
                onChange={(e) => handleNestedChange('datos_laborales', 'cargo', e.target.value)}
              />

              <Select
                label="Tipo de Contrato"
                value={formData.datos_laborales?.tipo_contrato || ''}
                onChange={(e) => handleNestedChange('datos_laborales', 'tipo_contrato', e.target.value)}
                options={[
                  { value: '', label: 'Seleccionar...' },
                  { value: 'indefinido', label: 'Indefinido' },
                  { value: 'fijo', label: 'Término Fijo' },
                  { value: 'prestacion_servicios', label: 'Prestación de Servicios' },
                  { value: 'obra_labor', label: 'Obra o Labor' },
                ]}
              />

              <Input
                label="Fecha de Vinculación"
                type="date"
                value={formData.datos_laborales?.fecha_vinculacion || ''}
                onChange={(e) => handleNestedChange('datos_laborales', 'fecha_vinculacion', e.target.value)}
              />

              <Input
                label="Salario Básico"
                type="number"
                value={formData.datos_laborales?.salario_basico?.toString() || ''}
                onChange={(e) => handleNestedChange('datos_laborales', 'salario_basico', e.target.value)}
              />

              <Input
                label="Horario"
                type="text"
                value={formData.datos_laborales?.horario || ''}
                onChange={(e) => handleNestedChange('datos_laborales', 'horario', e.target.value)}
              />

              <Input
                label="Dependencia"
                type="text"
                value={formData.datos_laborales?.dependencia || ''}
                onChange={(e) => handleNestedChange('datos_laborales', 'dependencia', e.target.value)}
              />
            </div>
          )}

          {/* Información Financiera */}
          {activeTab === 'financiero' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Ingresos Mensuales"
                type="number"
                value={formData.informacion_financiera?.ingresos_mensuales?.toString() || ''}
                onChange={(e) => handleNestedChange('informacion_financiera', 'ingresos_mensuales', e.target.value)}
              />

              <Input
                label="Ingresos Adicionales"
                type="number"
                value={formData.informacion_financiera?.ingresos_adicionales?.toString() || ''}
                onChange={(e) => handleNestedChange('informacion_financiera', 'ingresos_adicionales', e.target.value)}
              />

              <Input
                label="Egresos Mensuales"
                type="number"
                value={formData.informacion_financiera?.egresos_mensuales?.toString() || ''}
                onChange={(e) => handleNestedChange('informacion_financiera', 'egresos_mensuales', e.target.value)}
              />

              <Input
                label="Ingresos Familiares"
                type="number"
                value={formData.informacion_financiera?.ingresos_familiares?.toString() || ''}
                onChange={(e) => handleNestedChange('informacion_financiera', 'ingresos_familiares', e.target.value)}
              />

              <Input
                label="Gastos Familiares"
                type="number"
                value={formData.informacion_financiera?.gastos_familiares?.toString() || ''}
                onChange={(e) => handleNestedChange('informacion_financiera', 'gastos_familiares', e.target.value)}
              />

              <Input
                label="Endeudamiento"
                type="number"
                value={formData.informacion_financiera?.endeudamiento?.toString() || ''}
                onChange={(e) => handleNestedChange('informacion_financiera', 'endeudamiento', e.target.value)}
              />

              <Select
                label="Calificación de Riesgo"
                value={formData.informacion_financiera?.calificacion_riesgo || ''}
                onChange={(e) => handleNestedChange('informacion_financiera', 'calificacion_riesgo', e.target.value)}
                options={[
                  { value: '', label: 'Seleccionar...' },
                  { value: 'bajo', label: 'Bajo' },
                  { value: 'medio', label: 'Medio' },
                  { value: 'alto', label: 'Alto' },
                  { value: 'muy_alto', label: 'Muy Alto' },
                ]}
              />

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Observaciones Financieras
                </label>
                <textarea
                  value={formData.informacion_financiera?.observaciones || ''}
                  onChange={(e) => handleNestedChange('informacion_financiera', 'observaciones', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
          )}

          {/* Información Académica */}
          {activeTab === 'academico' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Select
                label="Nivel Educativo"
                value={formData.informacion_academica?.nivel_educativo || ''}
                onChange={(e) => handleNestedChange('informacion_academica', 'nivel_educativo', e.target.value)}
                options={[
                  { value: '', label: 'Seleccionar...' },
                  { value: 'primaria', label: 'Primaria' },
                  { value: 'bachillerato', label: 'Bachillerato' },
                  { value: 'tecnico', label: 'Técnico' },
                  { value: 'tecnologo', label: 'Tecnólogo' },
                  { value: 'profesional', label: 'Profesional' },
                  { value: 'especializacion', label: 'Especialización' },
                  { value: 'maestria', label: 'Maestría' },
                  { value: 'doctorado', label: 'Doctorado' },
                ]}
              />

              <Input
                label="Institución"
                type="text"
                value={formData.informacion_academica?.institucion || ''}
                onChange={(e) => handleNestedChange('informacion_academica', 'institucion', e.target.value)}
              />

              <Input
                label="Título Obtenido"
                type="text"
                value={formData.informacion_academica?.titulo_obtenido || ''}
                onChange={(e) => handleNestedChange('informacion_academica', 'titulo_obtenido', e.target.value)}
              />

              <Input
                label="Año de Graduación"
                type="number"
                value={formData.informacion_academica?.ano_graduacion?.toString() || ''}
                onChange={(e) => handleNestedChange('informacion_academica', 'ano_graduacion', e.target.value)}
              />

              <div className="flex items-center md:col-span-2">
                <input
                  type="checkbox"
                  id="en_estudio"
                  checked={formData.informacion_academica?.en_estudio || false}
                  onChange={(e) => handleNestedChange('informacion_academica', 'en_estudio', e.target.checked)}
                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <label htmlFor="en_estudio" className="ml-2 text-sm font-medium text-gray-700">
                  ¿Actualmente estudiando?
                </label>
              </div>

              {formData.informacion_academica?.en_estudio && (
                <>
                  <Input
                    label="Programa Actual"
                    type="text"
                    value={formData.informacion_academica?.programa_actual || ''}
                    onChange={(e) => handleNestedChange('informacion_academica', 'programa_actual', e.target.value)}
                  />

                  <Input
                    label="Institución Actual"
                    type="text"
                    value={formData.informacion_academica?.institucion_actual || ''}
                    onChange={(e) => handleNestedChange('informacion_academica', 'institucion_actual', e.target.value)}
                  />

                  <Input
                    label="Semestre Actual"
                    type="number"
                    value={formData.informacion_academica?.semestre_actual?.toString() || ''}
                    onChange={(e) => handleNestedChange('informacion_academica', 'semestre_actual', e.target.value)}
                  />
                </>
              )}
            </div>
          )}

          {/* Información de Vivienda */}
          {activeTab === 'vivienda' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Select
                label="Tipo de Vivienda"
                value={formData.informacion_vivienda?.tipo_vivienda || ''}
                onChange={(e) => handleNestedChange('informacion_vivienda', 'tipo_vivienda', e.target.value)}
                options={[
                  { value: '', label: 'Seleccionar...' },
                  { value: 'casa', label: 'Casa' },
                  { value: 'apartamento', label: 'Apartamento' },
                  { value: 'finca', label: 'Finca' },
                  { value: 'otro', label: 'Otro' },
                ]}
              />

              <Select
                label="Tenencia"
                value={formData.informacion_vivienda?.tenencia || ''}
                onChange={(e) => handleNestedChange('informacion_vivienda', 'tenencia', e.target.value)}
                options={[
                  { value: '', label: 'Seleccionar...' },
                  { value: 'propia', label: 'Propia' },
                  { value: 'arrendada', label: 'Arrendada' },
                  { value: 'familiar', label: 'Familiar' },
                  { value: 'otro', label: 'Otro' },
                ]}
              />

              <Input
                label="Valor Arriendo"
                type="number"
                value={formData.informacion_vivienda?.valor_arriendo?.toString() || ''}
                onChange={(e) => handleNestedChange('informacion_vivienda', 'valor_arriendo', e.target.value)}
              />

              <Input
                label="Tiempo de Residencia (meses)"
                type="number"
                value={formData.informacion_vivienda?.tiempo_residencia?.toString() || ''}
                onChange={(e) => handleNestedChange('informacion_vivienda', 'tiempo_residencia', e.target.value)}
              />

              <Input
                label="Estrato"
                type="number"
                value={formData.informacion_vivienda?.estrato?.toString() || ''}
                onChange={(e) => handleNestedChange('informacion_vivienda', 'estrato', e.target.value)}
              />
            </div>
          )}

          {/* Botones de acción */}
          <div className="mt-6 flex justify-end space-x-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/asociados')}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={saving}
              isLoading={saving}
              className="flex items-center bg-green-600 hover:bg-green-700 focus-visible:ring-green-600"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}
