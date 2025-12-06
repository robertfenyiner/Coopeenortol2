import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Percent } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { creditoService, CreditoSolicitud } from '../services/creditoService';
import { useToast } from '../contexts/ToastContext';
import api from '../lib/axios';

interface Asociado {
  id: number;
  numero_documento: string;
  nombres: string;
  apellidos: string;
  estado: string;
}

export default function CreditoNuevoPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [asociados, setAsociados] = useState<Asociado[]>([]);
  const [loadingAsociados, setLoadingAsociados] = useState(true);

  const [formData, setFormData] = useState<CreditoSolicitud>({
    asociado_id: 0,
    tipo_credito: 'consumo',
    monto_solicitado: 0,
    plazo_meses: 12,
    tasa_interes: 2.0,
    destino: '',
    garantia: '',
    modalidad_pago: 'mensual',
    tipo_cuota: 'fija',
    fecha_solicitud: new Date().toISOString().split('T')[0],
    observaciones: ''
  });

  const [simulacion, setSimulacion] = useState<any>(null);

  useEffect(() => {
    cargarAsociados();
  }, []);

  const cargarAsociados = async () => {
    try {
      setLoadingAsociados(true);
      // Cargar solo asociados activos
      const response = await api.get('/asociados/?estado=activo&limit=100');
      setAsociados(response.data.datos || []);
    } catch (error: any) {
      console.error('Error al cargar asociados:', error);
      showToast('error', 'Error al cargar asociados');
    } finally {
      setLoadingAsociados(false);
    }
  };

  const handleChange = (field: keyof CreditoSolicitud, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSimular = async () => {
    if (!formData.monto_solicitado || !formData.plazo_meses || !formData.tasa_interes) {
      showToast('error', 'Complete monto, plazo y tasa para simular');
      return;
    }

    try {
      const resultado = await creditoService.simular({
        monto: formData.monto_solicitado,
        plazo_meses: formData.plazo_meses,
        tasa_interes: formData.tasa_interes
      });
      setSimulacion(resultado);
      showToast('success', 'Simulación realizada correctamente');
    } catch (error: any) {
      console.error('Error al simular:', error);
      showToast('error', error.response?.data?.detail || 'Error al simular crédito');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones
    if (!formData.asociado_id) {
      showToast('error', 'Debe seleccionar un asociado');
      return;
    }
    if (!formData.monto_solicitado || formData.monto_solicitado <= 0) {
      showToast('error', 'El monto debe ser mayor a 0');
      return;
    }
    if (!formData.plazo_meses || formData.plazo_meses <= 0) {
      showToast('error', 'El plazo debe ser mayor a 0');
      return;
    }
    if (!formData.destino.trim()) {
      showToast('error', 'Debe indicar el destino del crédito');
      return;
    }

    try {
      setLoading(true);
      await creditoService.solicitar(formData);
      showToast('success', 'Solicitud de crédito creada exitosamente');
      navigate('/creditos');
    } catch (error: any) {
      console.error('Error completo:', error);
      console.error('Error response:', error.response);
      
      let mensaje: string = 'Error al crear la solicitud de crédito';
      
      if (error.response?.data?.detail) {
        // Si detail es un array (errores de validación de Pydantic)
        if (Array.isArray(error.response.data.detail)) {
          const errores = error.response.data.detail.map((e: any) => {
            const campo = e.loc?.join(' > ') || 'Campo';
            return `${campo}: ${e.msg}`;
          }).join(', ');
          mensaje = `Errores de validación: ${errores}`;
        } else {
          mensaje = String(error.response.data.detail);
        }
      } else if (error.message) {
        mensaje = String(error.message);
      }
      
      showToast('error', mensaje);
    } finally {
      setLoading(false);
    }
  };

  const tiposCredito = [
    { value: 'consumo', label: 'Consumo' },
    { value: 'vivienda', label: 'Vivienda' },
    { value: 'vehiculo', label: 'Vehículo' },
    { value: 'educacion', label: 'Educación' },
    { value: 'microempresa', label: 'Microempresa' },
    { value: 'libre_inversion', label: 'Libre Inversión' },
    { value: 'otro', label: 'Otro' }
  ];

  const modalidadesPago = [
    { value: 'mensual', label: 'Mensual' },
    { value: 'quincenal', label: 'Quincenal' },
    { value: 'semanal', label: 'Semanal' }
  ];

  const tiposCuota = [
    { value: 'fija', label: 'Cuota Fija' },
    { value: 'variable', label: 'Cuota Variable' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={() => navigate('/creditos')}
            className="flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Nueva Solicitud de Crédito</h1>
            <p className="text-sm text-gray-600 mt-1">Complete los datos para solicitar un nuevo crédito</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información del Asociado */}
        <Card title="Información del Asociado">
          <div className="grid grid-cols-1 gap-6">
            <Select
              label="Asociado *"
              value={formData.asociado_id.toString()}
              onChange={(e) => handleChange('asociado_id', parseInt(e.target.value))}
              options={[
                { value: '0', label: loadingAsociados ? 'Cargando...' : 'Seleccione un asociado' },
                ...asociados.map(a => ({
                  value: a.id.toString(),
                  label: `${a.numero_documento} - ${a.nombres} ${a.apellidos}`
                }))
              ]}
              required
              disabled={loadingAsociados}
            />
          </div>
        </Card>

        {/* Información del Crédito */}
        <Card title="Información del Crédito">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Select
              label="Tipo de Crédito *"
              value={formData.tipo_credito}
              onChange={(e) => handleChange('tipo_credito', e.target.value)}
              options={tiposCredito}
              required
            />

            <Input
              label="Monto Solicitado *"
              type="number"
              value={formData.monto_solicitado || ''}
              onChange={(e) => handleChange('monto_solicitado', parseFloat(e.target.value) || 0)}
              placeholder="1000000"
              required
              min="1"
              step="1"
              max="9999999999"
            />

            <Input
              label="Plazo (meses) *"
              type="number"
              value={formData.plazo_meses || ''}
              onChange={(e) => handleChange('plazo_meses', parseInt(e.target.value) || 0)}
              placeholder="12"
              required
              min="1"
              max="360"
            />

            <Input
              label="Tasa de Interés (% mensual) *"
              type="number"
              value={formData.tasa_interes || ''}
              onChange={(e) => handleChange('tasa_interes', parseFloat(e.target.value) || 0)}
              placeholder="2.0"
              required
              min="0"
              step="0.1"
            />

            <Select
              label="Modalidad de Pago"
              value={formData.modalidad_pago || 'mensual'}
              onChange={(e) => handleChange('modalidad_pago', e.target.value)}
              options={modalidadesPago}
            />

            <Select
              label="Tipo de Cuota"
              value={formData.tipo_cuota || 'fija'}
              onChange={(e) => handleChange('tipo_cuota', e.target.value)}
              options={tiposCuota}
            />

            <Input
              label="Fecha de Solicitud *"
              type="date"
              value={formData.fecha_solicitud}
              onChange={(e) => handleChange('fecha_solicitud', e.target.value)}
              required
            />
          </div>

          <div className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={handleSimular}
              disabled={!formData.monto_solicitado || !formData.plazo_meses || !formData.tasa_interes}
              className="flex items-center"
            >
              <Percent className="w-4 h-4 mr-2" />
              Simular Crédito
            </Button>
          </div>

          {simulacion && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-3">Resultado de la Simulación</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-blue-600 font-medium">Cuota Mensual</p>
                  <p className="text-blue-900 font-bold">${simulacion.valor_cuota?.toLocaleString('es-CO')}</p>
                </div>
                <div>
                  <p className="text-blue-600 font-medium">Total Intereses</p>
                  <p className="text-blue-900 font-bold">${simulacion.total_intereses?.toLocaleString('es-CO')}</p>
                </div>
                <div>
                  <p className="text-blue-600 font-medium">Total a Pagar</p>
                  <p className="text-blue-900 font-bold">${simulacion.total_a_pagar?.toLocaleString('es-CO')}</p>
                </div>
                <div>
                  <p className="text-blue-600 font-medium">Plazo</p>
                  <p className="text-blue-900 font-bold">{simulacion.plazo_meses} meses</p>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Detalles Adicionales */}
        <Card title="Detalles Adicionales">
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Destino del Crédito *
              </label>
              <textarea
                value={formData.destino}
                onChange={(e) => handleChange('destino', e.target.value)}
                placeholder="Describa el destino del crédito"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                required
              />
            </div>

            <Input
              label="Garantía"
              type="text"
              value={formData.garantia || ''}
              onChange={(e) => handleChange('garantia', e.target.value)}
              placeholder="Ej: Pagaré, Hipoteca, Aval solidario"
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observaciones
              </label>
              <textarea
                value={formData.observaciones || ''}
                onChange={(e) => handleChange('observaciones', e.target.value)}
                placeholder="Observaciones adicionales"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
              />
            </div>
          </div>
        </Card>

        {/* Botones de acción */}
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/creditos')}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={loading}
          >
            {loading ? 'Guardando...' : 'Crear Solicitud'}
          </Button>
        </div>
      </form>
    </div>
  );
}
