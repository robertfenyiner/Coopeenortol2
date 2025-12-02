import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, FileText, CreditCard, PiggyBank, User, Briefcase, Home, GraduationCap, DollarSign } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Asociado } from '../types';
import api from '../lib/axios';
import { useToast } from '../contexts/ToastContext';
import { formatDate, formatCurrency } from '../lib/utils';
import ProfilePhoto from '../components/ProfilePhoto';
import DocumentList from '../components/DocumentList';

export default function AsociadoDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [asociado, setAsociado] = useState<Asociado | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'personal' | 'laboral' | 'financiero' | 'academico' | 'vivienda' | 'documentacion'>('personal');
  const [documentos, setDocumentos] = useState<any[]>([]);

  useEffect(() => {
    loadAsociado();
  }, [id]);

  const loadAsociado = async () => {
    try {
      const response = await api.get(`/asociados/${id}`);
      const data = response.data;
      setAsociado({
        ...data,
        nombre_completo: `${data.nombres} ${data.apellidos}`,
        email: data.correo_electronico,
        telefono: data.telefono_principal
      });
      loadDocumentos();
    } catch (error: any) {
      showToast('error', 'Error al cargar el asociado');
      console.error(error);
      navigate('/asociados');
    } finally {
      setLoading(false);
    }
  };

  const loadDocumentos = async () => {
    try {
      const response = await api.get(`/documentos?asociado_id=${id}`);
      setDocumentos(response.data.documentos || []);
    } catch (error) {
      console.error('Error al cargar documentos:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!asociado) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Asociado no encontrado</p>
      </div>
    );
  }

  const tabs = [
    { id: 'personal', label: 'Datos Personales', icon: User },
    { id: 'laboral', label: 'Datos Laborales', icon: Briefcase },
    { id: 'financiero', label: 'Información Financiera', icon: DollarSign },
    { id: 'academico', label: 'Información Académica', icon: GraduationCap },
    { id: 'vivienda', label: 'Información de Vivienda', icon: Home },
    { id: 'documentacion', label: 'Documentación', icon: FileText },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/asociados')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver a Asociados
        </button>
        
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{asociado.nombre_completo}</h1>
            <p className="mt-1 text-sm text-gray-600">
              {asociado.tipo_documento}: {asociado.numero_documento}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => navigate(`/asociados/${id}/editar`)}
            >
              <Edit className="w-4 h-4 mr-2" />
              Editar
            </Button>
          </div>
        </div>
      </div>

      {/* Información General */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <User className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Estado</p>
              <p className="text-lg font-semibold capitalize">{asociado.estado}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <FileText className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Fecha de Ingreso</p>
              <p className="text-lg font-semibold">{formatDate(asociado.fecha_ingreso)}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <CreditCard className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Contacto</p>
              <p className="text-sm font-semibold">{asociado.telefono}</p>
            </div>
          </div>
        </Card>
      </div>

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
          {/* Datos Personales */}
          {activeTab === 'personal' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
                <p className="text-gray-900">{asociado.email || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                <p className="text-gray-900">{asociado.telefono || 'N/A'}</p>
              </div>
              {asociado.datos_personales && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Nacimiento</label>
                    <p className="text-gray-900">{asociado.datos_personales.fecha_nacimiento ? formatDate(asociado.datos_personales.fecha_nacimiento) : 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Estado Civil</label>
                    <p className="text-gray-900 capitalize">{asociado.datos_personales.estado_civil || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Género</label>
                    <p className="text-gray-900 capitalize">{asociado.datos_personales.genero || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                    <p className="text-gray-900">{asociado.datos_personales.direccion || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad</label>
                    <p className="text-gray-900">{asociado.datos_personales.ciudad || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Departamento</label>
                    <p className="text-gray-900">{asociado.datos_personales.departamento || 'N/A'}</p>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Datos Laborales */}
          {activeTab === 'laboral' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {asociado.datos_laborales ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Institución</label>
                    <p className="text-gray-900">{asociado.datos_laborales.institucion_educativa || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cargo</label>
                    <p className="text-gray-900">{asociado.datos_laborales.cargo || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Contrato</label>
                    <p className="text-gray-900 capitalize">{asociado.datos_laborales.tipo_contrato || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Vinculación</label>
                    <p className="text-gray-900">{asociado.datos_laborales.fecha_vinculacion ? formatDate(asociado.datos_laborales.fecha_vinculacion) : 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Salario Básico</label>
                    <p className="text-gray-900">{asociado.datos_laborales.salario_basico ? formatCurrency(asociado.datos_laborales.salario_basico) : 'N/A'}</p>
                  </div>
                </>
              ) : (
                <p className="text-gray-500 col-span-2">No hay información laboral registrada</p>
              )}
            </div>
          )}

          {/* Información Financiera */}
          {activeTab === 'financiero' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {asociado.informacion_financiera ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ingresos Mensuales</label>
                    <p className="text-gray-900">{asociado.informacion_financiera.ingresos_mensuales ? formatCurrency(asociado.informacion_financiera.ingresos_mensuales) : 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ingresos Adicionales</label>
                    <p className="text-gray-900">{asociado.informacion_financiera.ingresos_adicionales ? formatCurrency(asociado.informacion_financiera.ingresos_adicionales) : 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Egresos Mensuales</label>
                    <p className="text-gray-900">{asociado.informacion_financiera.egresos_mensuales ? formatCurrency(asociado.informacion_financiera.egresos_mensuales) : 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ingresos Familiares</label>
                    <p className="text-gray-900">{asociado.informacion_financiera.ingresos_familiares ? formatCurrency(asociado.informacion_financiera.ingresos_familiares) : 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Gastos Familiares</label>
                    <p className="text-gray-900">{asociado.informacion_financiera.gastos_familiares ? formatCurrency(asociado.informacion_financiera.gastos_familiares) : 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Endeudamiento</label>
                    <p className="text-gray-900">{asociado.informacion_financiera.endeudamiento ? formatCurrency(asociado.informacion_financiera.endeudamiento) : 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Calificación de Riesgo</label>
                    <p className="text-gray-900">{asociado.informacion_financiera.calificacion_riesgo ? asociado.informacion_financiera.calificacion_riesgo.replace('_', ' ').toUpperCase() : 'N/A'}</p>
                  </div>
                  {asociado.informacion_financiera.observaciones && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
                      <p className="text-gray-900">{asociado.informacion_financiera.observaciones}</p>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-gray-500 col-span-2">No hay información financiera registrada</p>
              )}
            </div>
          )}

          {/* Información Académica */}
          {activeTab === 'academico' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {asociado.informacion_academica ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nivel Educativo</label>
                    <p className="text-gray-900 capitalize">{asociado.informacion_academica.nivel_educativo || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Institución</label>
                    <p className="text-gray-900">{asociado.informacion_academica.institucion || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Título Obtenido</label>
                    <p className="text-gray-900">{asociado.informacion_academica.titulo_obtenido || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Año de Graduación</label>
                    <p className="text-gray-900">{asociado.informacion_academica.ano_graduacion || 'N/A'}</p>
                  </div>
                  {asociado.informacion_academica.en_estudio && (
                    <>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Actualmente Estudiando</label>
                        <p className="text-gray-900">Sí</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Programa Actual</label>
                        <p className="text-gray-900">{asociado.informacion_academica.programa_actual || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Institución Actual</label>
                        <p className="text-gray-900">{asociado.informacion_academica.institucion_actual || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Semestre Actual</label>
                        <p className="text-gray-900">{asociado.informacion_academica.semestre_actual || 'N/A'}</p>
                      </div>
                    </>
                  )}
                </>
              ) : (
                <p className="text-gray-500 col-span-2">No hay información académica registrada</p>
              )}
            </div>
          )}

          {/* Información de Vivienda */}
          {activeTab === 'vivienda' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {asociado.informacion_vivienda ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Vivienda</label>
                    <p className="text-gray-900 capitalize">{asociado.informacion_vivienda.tipo_vivienda || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tenencia</label>
                    <p className="text-gray-900 capitalize">{asociado.informacion_vivienda.tenencia || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Valor Arriendo</label>
                    <p className="text-gray-900">{asociado.informacion_vivienda.valor_arriendo ? formatCurrency(asociado.informacion_vivienda.valor_arriendo) : 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tiempo de Residencia</label>
                    <p className="text-gray-900">{asociado.informacion_vivienda.tiempo_residencia ? `${asociado.informacion_vivienda.tiempo_residencia} meses` : 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Estrato</label>
                    <p className="text-gray-900">{asociado.informacion_vivienda.estrato || 'N/A'}</p>
                  </div>
                  {asociado.informacion_vivienda.departamento && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Departamento</label>
                      <p className="text-gray-900">{asociado.informacion_vivienda.departamento}</p>
                    </div>
                  )}
                  {asociado.informacion_vivienda.municipio && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Municipio</label>
                      <p className="text-gray-900">{asociado.informacion_vivienda.municipio}</p>
                    </div>
                  )}
                  {asociado.informacion_vivienda.direccion && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                      <p className="text-gray-900">{asociado.informacion_vivienda.direccion}</p>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-gray-500 col-span-2">No hay información de vivienda registrada</p>
              )}
            </div>
          )}

          {/* Documentación */}
          {activeTab === 'documentacion' && (
            <div className="space-y-6">
              {/* Foto de Perfil */}
              <div className="border-b pb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Foto de Perfil</h3>
                <ProfilePhoto
                  asociadoId={parseInt(id!)}
                  fotoUrl={asociado.foto_url || null}
                  onPhotoUpdate={() => {}}
                  editable={false}
                />
              </div>

              {/* Documentos */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Documentos</h3>
                <DocumentList
                  documentos={documentos}
                  onDocumentDeleted={loadDocumentos}
                  editable={false}
                />
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
