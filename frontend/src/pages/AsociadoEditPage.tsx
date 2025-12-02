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
  observaciones?: string;
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
      // Preparar datos para enviar - solo campos básicos del tab activo
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

      // Agregar datos adicionales si existen
      if (formData.datos_personales && Object.keys(formData.datos_personales).length > 0) {
        dataToSend.datos_personales = formData.datos_personales;
      }
      
      if (formData.datos_laborales && Object.keys(formData.datos_laborales).length > 0) {
        dataToSend.datos_laborales = formData.datos_laborales;
      }
      
      if (formData.informacion_financiera && Object.keys(formData.informacion_financiera).length > 0) {
        dataToSend.informacion_financiera = formData.informacion_financiera;
      }

      if (id) {
        await api.put(`/asociados/${id}`, dataToSend);
        showToast('success', 'Asociado actualizado correctamente');
      } else {
        await api.post('/asociados/', dataToSend);
        showToast('success', 'Asociado creado correctamente');
      }
      navigate('/asociados');
    } catch (error: any) {
      showToast('error', error.response?.data?.detail || 'Error al guardar el asociado');
      console.error('Error al guardar:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNestedChange = (section: 'datos_personales' | 'datos_laborales' | 'informacion_financiera', field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const tabs = [
    { id: 'basico', label: 'Datos Básicos' },
    { id: 'personal', label: 'Datos Personales' },
    { id: 'laboral', label: 'Datos Laborales' },
    { id: 'financiero', label: 'Información Financiera' },
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
                value={formData.datos_personales?.numero_hijos?.toString() || '0'}
                onChange={(e) => handleNestedChange('datos_personales', 'numero_hijos', parseInt(e.target.value) || 0)}
              />

              <Input
                label="Personas a Cargo"
                type="number"
                value={formData.datos_personales?.personas_a_cargo?.toString() || '0'}
                onChange={(e) => handleNestedChange('datos_personales', 'personas_a_cargo', parseInt(e.target.value) || 0)}
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
                onChange={(e) => handleNestedChange('datos_laborales', 'salario_basico', parseFloat(e.target.value) || 0)}
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
                onChange={(e) => handleNestedChange('informacion_financiera', 'ingresos_mensuales', parseFloat(e.target.value) || 0)}
              />

              <Input
                label="Ingresos Adicionales"
                type="number"
                value={formData.informacion_financiera?.ingresos_adicionales?.toString() || ''}
                onChange={(e) => handleNestedChange('informacion_financiera', 'ingresos_adicionales', parseFloat(e.target.value) || 0)}
              />

              <Input
                label="Egresos Mensuales"
                type="number"
                value={formData.informacion_financiera?.egresos_mensuales?.toString() || ''}
                onChange={(e) => handleNestedChange('informacion_financiera', 'egresos_mensuales', parseFloat(e.target.value) || 0)}
              />

              <Input
                label="Ingresos Familiares"
                type="number"
                value={formData.informacion_financiera?.ingresos_familiares?.toString() || ''}
                onChange={(e) => handleNestedChange('informacion_financiera', 'ingresos_familiares', parseFloat(e.target.value) || 0)}
              />

              <Input
                label="Gastos Familiares"
                type="number"
                value={formData.informacion_financiera?.gastos_familiares?.toString() || ''}
                onChange={(e) => handleNestedChange('informacion_financiera', 'gastos_familiares', parseFloat(e.target.value) || 0)}
              />

              <Input
                label="Endeudamiento"
                type="number"
                value={formData.informacion_financiera?.endeudamiento?.toString() || ''}
                onChange={(e) => handleNestedChange('informacion_financiera', 'endeudamiento', parseFloat(e.target.value) || 0)}
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
