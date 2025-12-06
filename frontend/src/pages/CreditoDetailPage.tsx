import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, FileText, DollarSign, Calendar, CheckCircle, XCircle, TrendingUp } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Credito } from '../types';
import { creditoService } from '../services/creditoService';
import { useToast } from '../contexts/ToastContext';
import { formatDate, formatCurrency } from '../lib/utils';
import DocumentList from '../components/DocumentList';
import api from '../lib/axios';

export default function CreditoDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [credito, setCredito] = useState<Credito | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'informacion' | 'amortizacion' | 'documentacion'>('informacion');
  const [documentos, setDocumentos] = useState<any[]>([]);
  const [amortizacion, setAmortizacion] = useState<any[]>([]);

  // Estados para acciones
  const [showAprobarForm, setShowAprobarForm] = useState(false);
  const [showRechazarForm, setShowRechazarForm] = useState(false);
  const [showDesembolsarForm, setShowDesembolsarForm] = useState(false);
  const [showPagoForm, setShowPagoForm] = useState(false);

  const [aprobarForm, setAprobarForm] = useState({
    monto_aprobado: 0,
    observaciones: ''
  });

  const [rechazarForm, setRechazarForm] = useState({
    motivo_rechazo: ''
  });

  const [desembolsarForm, setDesembolsarForm] = useState({
    monto_desembolsado: 0,
    fecha_desembolso: new Date().toISOString().split('T')[0],
    numero_cuenta_desembolso: '',
    observaciones: ''
  });

  const [pagoForm, setPagoForm] = useState({
    monto: 0,
    fecha_pago: new Date().toISOString().split('T')[0],
    metodo_pago: 'efectivo',
    numero_recibo: '',
    observaciones: ''
  });

  useEffect(() => {
    loadCredito();
  }, [id]);

  const loadCredito = async () => {
    try {
      const data = await creditoService.obtenerPorId(parseInt(id!));
      setCredito(data);
      setAprobarForm({
        monto_aprobado: data.monto_solicitado,
        observaciones: ''
      });
      setDesembolsarForm({
        monto_desembolsado: data.monto_aprobado || data.monto_solicitado,
        fecha_desembolso: new Date().toISOString().split('T')[0],
        numero_cuenta_desembolso: '',
        observaciones: ''
      });
      loadDocumentos();
      if (data.estado !== 'solicitado' && data.estado !== 'rechazado') {
        loadAmortizacion();
      }
    } catch (error: any) {
      showToast('error', 'Error al cargar el crédito');
      console.error(error);
      navigate('/creditos');
    } finally {
      setLoading(false);
    }
  };

  const loadDocumentos = async () => {
    try {
      const response = await api.get(`/documentos?credito_id=${id}`);
      setDocumentos(response.data.documentos || []);
    } catch (error) {
      console.error('Error al cargar documentos:', error);
    }
  };

  const loadAmortizacion = async () => {
    try {
      const data = await creditoService.obtenerAmortizacion(parseInt(id!));
      setAmortizacion(data);
    } catch (error) {
      console.error('Error al cargar amortización:', error);
    }
  };

  const handleAprobar = async () => {
    try {
      await creditoService.aprobar(parseInt(id!), aprobarForm);
      showToast('success', 'Crédito aprobado exitosamente');
      setShowAprobarForm(false);
      loadCredito();
    } catch (error: any) {
      showToast('error', error.response?.data?.detail || 'Error al aprobar crédito');
    }
  };

  const handleRechazar = async () => {
    try {
      await creditoService.rechazar(parseInt(id!), rechazarForm);
      showToast('success', 'Crédito rechazado');
      setShowRechazarForm(false);
      loadCredito();
    } catch (error: any) {
      showToast('error', error.response?.data?.detail || 'Error al rechazar crédito');
    }
  };

  const handleDesembolsar = async () => {
    try {
      await creditoService.desembolsar(parseInt(id!), desembolsarForm);
      showToast('success', 'Crédito desembolsado exitosamente');
      setShowDesembolsarForm(false);
      loadCredito();
      loadAmortizacion();
    } catch (error: any) {
      showToast('error', error.response?.data?.detail || 'Error al desembolsar crédito');
    }
  };

  const handleRegistrarPago = async () => {
    try {
      await creditoService.registrarPago(parseInt(id!), pagoForm);
      showToast('success', 'Pago registrado exitosamente');
      setShowPagoForm(false);
      setPagoForm({
        monto: 0,
        fecha_pago: new Date().toISOString().split('T')[0],
        metodo_pago: 'efectivo',
        numero_recibo: '',
        observaciones: ''
      });
      loadCredito();
      loadAmortizacion();
    } catch (error: any) {
      showToast('error', error.response?.data?.detail || 'Error al registrar pago');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!credito) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Crédito no encontrado</p>
      </div>
    );
  }

  const getEstadoBadge = (estado: string) => {
    const colors = {
      solicitado: 'bg-blue-100 text-blue-800',
      en_estudio: 'bg-yellow-100 text-yellow-800',
      aprobado: 'bg-green-100 text-green-800',
      rechazado: 'bg-red-100 text-red-800',
      desembolsado: 'bg-purple-100 text-purple-800',
      activo: 'bg-green-100 text-green-800',
      cancelado: 'bg-gray-100 text-gray-800',
      castigado: 'bg-red-100 text-red-800',
    };

    return (
      <span className={`px-3 py-1 text-sm font-semibold rounded-full ${colors[estado as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`}>
        {estado.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  const tabs = [
    { id: 'informacion', label: 'Información General', icon: DollarSign },
    { id: 'amortizacion', label: 'Tabla de Amortización', icon: TrendingUp },
    { id: 'documentacion', label: 'Documentación', icon: FileText },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => navigate('/creditos')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Crédito #{credito.id}
            </h1>
            <p className="text-gray-500">
              {credito.asociado ? `${credito.asociado.nombres} ${credito.asociado.apellidos}` : 'N/A'}
            </p>
          </div>
        </div>
        {getEstadoBadge(credito.estado)}
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Monto Solicitado</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(credito.monto_solicitado)}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Monto Aprobado</p>
              <p className="text-xl font-bold text-gray-900">
                {credito.monto_aprobado ? formatCurrency(credito.monto_aprobado) : 'N/A'}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Plazo</p>
              <p className="text-xl font-bold text-gray-900">{credito.plazo_meses} meses</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="p-3 bg-orange-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Tasa de Interés</p>
              <p className="text-xl font-bold text-gray-900">{credito.tasa_interes}%</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Acciones según el estado */}
      {credito.estado === 'solicitado' && (
        <Card>
          <div className="flex items-center justify-between">
            <p className="text-gray-700">Este crédito está pendiente de aprobación</p>
            <div className="flex space-x-2">
              <Button onClick={() => setShowAprobarForm(true)}>
                <CheckCircle className="w-4 h-4 mr-2" />
                Aprobar
              </Button>
              <Button variant="outline" onClick={() => setShowRechazarForm(true)}>
                <XCircle className="w-4 h-4 mr-2" />
                Rechazar
              </Button>
            </div>
          </div>
        </Card>
      )}

      {credito.estado === 'aprobado' && (
        <Card>
          <div className="flex items-center justify-between">
            <p className="text-gray-700">Este crédito está aprobado y listo para desembolso</p>
            <Button onClick={() => setShowDesembolsarForm(true)}>
              <DollarSign className="w-4 h-4 mr-2" />
              Desembolsar
            </Button>
          </div>
        </Card>
      )}

      {(credito.estado === 'desembolsado' || credito.estado === 'activo') && (
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-700 font-medium">Saldo Actual</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(credito.saldo_capital || 0)}</p>
            </div>
            <Button onClick={() => setShowPagoForm(true)}>
              <Calendar className="w-4 h-4 mr-2" />
              Registrar Pago
            </Button>
          </div>
        </Card>
      )}

      {/* Formulario de Aprobación */}
      {showAprobarForm && (
        <Card>
          <h3 className="text-lg font-medium mb-4">Aprobar Crédito</h3>
          <div className="space-y-4">
            <Input
              label="Monto Aprobado"
              type="number"
              value={aprobarForm.monto_aprobado}
              onChange={(e) => setAprobarForm({ ...aprobarForm, monto_aprobado: parseFloat(e.target.value) })}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                rows={3}
                value={aprobarForm.observaciones}
                onChange={(e) => setAprobarForm({ ...aprobarForm, observaciones: e.target.value })}
              />
            </div>
            <div className="flex space-x-2">
              <Button onClick={handleAprobar}>Confirmar Aprobación</Button>
              <Button variant="outline" onClick={() => setShowAprobarForm(false)}>Cancelar</Button>
            </div>
          </div>
        </Card>
      )}

      {/* Formulario de Rechazo */}
      {showRechazarForm && (
        <Card>
          <h3 className="text-lg font-medium mb-4">Rechazar Crédito</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Motivo del Rechazo *</label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                rows={3}
                value={rechazarForm.motivo_rechazo}
                onChange={(e) => setRechazarForm({ ...rechazarForm, motivo_rechazo: e.target.value })}
                required
              />
            </div>
            <div className="flex space-x-2">
              <Button onClick={handleRechazar} disabled={!rechazarForm.motivo_rechazo}>
                Confirmar Rechazo
              </Button>
              <Button variant="outline" onClick={() => setShowRechazarForm(false)}>Cancelar</Button>
            </div>
          </div>
        </Card>
      )}

      {/* Formulario de Desembolso */}
      {showDesembolsarForm && (
        <Card>
          <h3 className="text-lg font-medium mb-4">Desembolsar Crédito</h3>
          <div className="space-y-4">
            <Input
              label="Monto a Desembolsar"
              type="number"
              value={desembolsarForm.monto_desembolsado}
              onChange={(e) => setDesembolsarForm({ ...desembolsarForm, monto_desembolsado: parseFloat(e.target.value) })}
            />
            <Input
              label="Fecha de Desembolso"
              type="date"
              value={desembolsarForm.fecha_desembolso}
              onChange={(e) => setDesembolsarForm({ ...desembolsarForm, fecha_desembolso: e.target.value })}
            />
            <Input
              label="Número de Cuenta"
              value={desembolsarForm.numero_cuenta_desembolso}
              onChange={(e) => setDesembolsarForm({ ...desembolsarForm, numero_cuenta_desembolso: e.target.value })}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                rows={3}
                value={desembolsarForm.observaciones}
                onChange={(e) => setDesembolsarForm({ ...desembolsarForm, observaciones: e.target.value })}
              />
            </div>
            <div className="flex space-x-2">
              <Button onClick={handleDesembolsar}>Confirmar Desembolso</Button>
              <Button variant="outline" onClick={() => setShowDesembolsarForm(false)}>Cancelar</Button>
            </div>
          </div>
        </Card>
      )}

      {/* Formulario de Pago */}
      {showPagoForm && (
        <Card>
          <h3 className="text-lg font-medium mb-4">Registrar Pago</h3>
          <div className="space-y-4">
            <Input
              label="Monto del Pago"
              type="number"
              value={pagoForm.monto}
              onChange={(e) => setPagoForm({ ...pagoForm, monto: parseFloat(e.target.value) })}
            />
            <Input
              label="Fecha de Pago"
              type="date"
              value={pagoForm.fecha_pago}
              onChange={(e) => setPagoForm({ ...pagoForm, fecha_pago: e.target.value })}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Método de Pago</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={pagoForm.metodo_pago}
                onChange={(e) => setPagoForm({ ...pagoForm, metodo_pago: e.target.value })}
              >
                <option value="efectivo">Efectivo</option>
                <option value="transferencia">Transferencia</option>
                <option value="cheque">Cheque</option>
                <option value="tarjeta">Tarjeta</option>
              </select>
            </div>
            <Input
              label="Número de Recibo"
              value={pagoForm.numero_recibo}
              onChange={(e) => setPagoForm({ ...pagoForm, numero_recibo: e.target.value })}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                rows={3}
                value={pagoForm.observaciones}
                onChange={(e) => setPagoForm({ ...pagoForm, observaciones: e.target.value })}
              />
            </div>
            <div className="flex space-x-2">
              <Button onClick={handleRegistrarPago}>Registrar Pago</Button>
              <Button variant="outline" onClick={() => setShowPagoForm(false)}>Cancelar</Button>
            </div>
          </div>
        </Card>
      )}

      {/* Tabs */}
      <Card>
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`
                    flex items-center py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                    ${activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon className="w-5 h-5 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* Información General */}
          {activeTab === 'informacion' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Número de Crédito</label>
                  <p className="text-gray-900">{credito.numero_credito || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Crédito</label>
                  <p className="text-gray-900 capitalize">{credito.tipo_credito.replace('_', ' ')}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Solicitud</label>
                  <p className="text-gray-900">{formatDate(credito.fecha_solicitud)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Aprobación</label>
                  <p className="text-gray-900">{credito.fecha_aprobacion ? formatDate(credito.fecha_aprobacion) : 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Desembolso</label>
                  <p className="text-gray-900">{credito.fecha_desembolso ? formatDate(credito.fecha_desembolso) : 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Modalidad de Pago</label>
                  <p className="text-gray-900 capitalize">{credito.modalidad_pago || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Cuota</label>
                  <p className="text-gray-900 capitalize">{credito.tipo_cuota || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valor de Cuota</label>
                  <p className="text-gray-900">{credito.cuota_mensual ? formatCurrency(credito.cuota_mensual) : 'N/A'}</p>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Destino</label>
                  <p className="text-gray-900">{credito.destino || 'N/A'}</p>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Garantía</label>
                  <p className="text-gray-900">{credito.garantia || 'N/A'}</p>
                </div>
                {credito.observaciones && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
                    <p className="text-gray-900">{credito.observaciones}</p>
                  </div>
                )}
              </div>

              {/* Saldos */}
              {(credito.estado === 'desembolsado' || credito.estado === 'activo') && (
                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium mb-4">Saldos Actuales</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Saldo de Capital</label>
                      <p className="text-2xl font-bold text-gray-900">{formatCurrency(credito.saldo_capital || 0)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Saldo de Interés</label>
                      <p className="text-2xl font-bold text-gray-900">{formatCurrency(credito.saldo_interes || 0)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Días de Mora</label>
                      <p className="text-2xl font-bold text-red-600">{credito.dias_mora || 0}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tabla de Amortización */}
          {activeTab === 'amortizacion' && (
            <div>
              {amortizacion.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cuota</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Capital</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Interés</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Cuota</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Saldo</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {amortizacion.map((cuota: any) => (
                        <tr key={cuota.numero_cuota}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{cuota.numero_cuota}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(cuota.fecha_vencimiento)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatCurrency(cuota.capital)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatCurrency(cuota.interes)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">{formatCurrency(cuota.cuota)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatCurrency(cuota.saldo)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            {cuota.pagado ? (
                              <CheckCircle className="w-5 h-5 text-green-600 mx-auto" />
                            ) : (
                              <XCircle className="w-5 h-5 text-gray-400 mx-auto" />
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">No hay tabla de amortización disponible</p>
              )}
            </div>
          )}

          {/* Documentación */}
          {activeTab === 'documentacion' && (
            <div>
              <DocumentList
                documentos={documentos}
                onDocumentDeleted={loadDocumentos}
                editable={true}
                creditoId={parseInt(id!)}
              />
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
