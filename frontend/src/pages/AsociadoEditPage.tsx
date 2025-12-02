import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { useToast } from '../contexts/ToastContext';
import api from '../lib/axios';

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
  datos_personales?: any;
  datos_laborales?: any;
  informacion_financiera?: any;
  informacion_academica?: any;
  informacion_vivienda?: any;
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
  });

  useEffect(() => {
    if (id) {
      loadAsociado();
    } else {
      setLoading(false);
    }
  }, [id]);

  const loadAsociado = async () => {
    try:
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
    console.log('Form submitted with data:', formData);
    setSaving(true);

    try {
      if (id) {
        console.log('Updating asociado:', id);
        const response = await api.put(`/asociados/${id}`, formData);
        console.log('Update response:', response.data);
        showToast('success', 'Asociado actualizado correctamente');
      } else {
        console.log('Creating new asociado');
        const response = await api.post('/asociados/', formData);
        console.log('Create response:', response.data);
        showToast('success', 'Asociado creado correctamente');
      }
      navigate('/asociados');
    } catch (error: any) {
      console.error('Error saving asociado:', error);
      console.error('Error response:', error.response?.data);
      showToast('error', error.response?.data?.detail || 'Error al guardar el asociado');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const tabs = [
    { id: 'basico', label: 'Datos Básicos' },
    { id: 'personal', label: 'Datos Personales' },
    { id: 'laboral', label: 'Datos Laborales' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
            <div className="text-center py-8 text-gray-500">
              <p>Sección de datos personales detallados</p>
              <p className="text-sm mt-2">Esta sección está en desarrollo</p>
            </div>
          )}

          {/* Datos Laborales */}
          {activeTab === 'laboral' && (
            <div className="text-center py-8 text-gray-500">
              <p>Sección de datos laborales</p>
              <p className="text-sm mt-2">Esta sección está en desarrollo</p>
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
              className="flex items-center"
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
