import React from 'react';
import AsociadoFormExpanded from './AsociadoFormExpanded';

interface AsociadosModuleProps {
  onBack: () => void;
}

const AsociadosModule: React.FC<AsociadosModuleProps> = ({ onBack }) => {
  return (
    <div>
      <h1>Gestión de Asociados</h1>
      <button onClick={onBack}>Volver</button>
      <AsociadoFormExpanded 
        onClose={() => {}}
        onSubmit={() => {}}
      />
    </div>
  );
};

export default AsociadosModule;

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
  observaciones?: string;
  created_at: string;
  updated_at: string;
  foto_url?: string; // URL de la foto del asociado
  
  // Datos personales expandidos
  datos_personales?: {
    fecha_nacimiento: string;
    lugar_nacimiento?: string;
    direccion: string;
    barrio?: string;
    ciudad: string;
    departamento: string;
    pais: string;
    codigo_postal?: string;
    telefono_secundario?: string;
    estado_civil?: 'soltero' | 'casado' | 'union_libre' | 'separado' | 'divorciado' | 'viudo';
    genero?: 'masculino' | 'femenino' | 'otro';
    grupo_sanguineo?: string;
    eps?: string;
    arl?: string;
  };

  // Información académica
  informacion_academica?: {
    nivel_educativo: 'primaria' | 'bachillerato' | 'tecnico' | 'tecnologo' | 'universitario' | 'especializacion' | 'maestria' | 'doctorado';
    institucion?: string;
    titulo_obtenido?: string;
    ano_graduacion?: number;
    en_estudio?: boolean;
    programa_actual?: string;
    institucion_actual?: string;
    semestre_actual?: number;
    certificaciones?: Array<{
      nombre: string;
      institucion: string;
      fecha_obtencion: string;
      vigencia?: string;
    }>;
  };

  // Información laboral expandida
  datos_laborales?: {
    institucion_educativa: string;
    cargo: string;
    area_trabajo?: string;
    tipo_contrato: string;
    fecha_vinculacion: string;
    salario_basico: number;
    bonificaciones?: number;
    jefe_inmediato?: string;
    telefono_jefe?: string;
    email_jefe?: string;
    sede_trabajo?: string;
    horario_trabajo?: string;
    experiencia_laboral?: Array<{
      empresa: string;
      cargo: string;
      fecha_inicio: string;
      fecha_fin?: string;
      motivo_retiro?: string;
      funciones?: string;
    }>;
  };

  // Información familiar expandida
  informacion_familiar?: {
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
    personas_autorizadas?: Array<{
      nombre: string;
      documento: string;
      telefono: string;
      parentesco?: string;
      puede_recoger_hijo?: boolean;
    }>;
  };

  // Información financiera expandida
  informacion_financiera?: {
    ingresos_mensuales: number;
    ingresos_adicionales?: number;
    egresos_mensuales: number;
    obligaciones: Array<{
      tipo: string;
      entidad: string;
      valor_cuota: number;
      saldo_actual?: number;
      fecha_vencimiento?: string;
    }>;
    referencias_comerciales?: Array<{
      entidad: string;
      tipo_producto: string;
      telefono?: string;
      comportamiento?: 'excelente' | 'bueno' | 'regular' | 'malo';
    }>;
    ingresos_familiares?: number;
    gastos_familiares?: number;
    activos?: Array<{
      tipo: 'inmueble' | 'vehiculo' | 'inversion' | 'otro';
      descripcion: string;
      valor_estimado?: number;
    }>;
  };

  // Información de vivienda
  informacion_vivienda?: {
    tipo_vivienda?: 'casa' | 'apartamento' | 'finca' | 'otro';
    tenencia?: 'propia' | 'arrendada' | 'familiar' | 'otro';
    valor_arriendo?: number;
    tiempo_residencia?: number;
    servicios_publicos?: Array<string>;
    estrato?: number;
  };
}

interface AsociadosModuleProps {
  onBack: () => void;
}

const AsociadosModule: React.FC<AsociadosModuleProps> = ({ onBack }) => {
  const [asociados, setAsociados] = useState<Asociado[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAsociado, setEditingAsociado] = useState<Asociado | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  


  // Formulario state - versión expandida
  const [formData, setFormData] = useState({
    tipo_documento: 'CC',
    numero_documento: '',
    nombres: '',
    apellidos: '',
    correo_electronico: '',
    telefono_principal: '',
    estado: 'activo' as 'activo' | 'inactivo' | 'retirado',
    fecha_ingreso: new Date().toISOString().split('T')[0],
    observaciones: '',
    
    // Datos personales expandidos
    datos_personales: {
      fecha_nacimiento: '1990-01-01',
      lugar_nacimiento: '',
      direccion: '',
      barrio: '',
      ciudad: 'Bogotá',
      departamento: 'Cundinamarca',
      pais: 'Colombia',
      codigo_postal: '',
      telefono_secundario: '',
      estado_civil: '' as '' | 'soltero' | 'casado' | 'union_libre' | 'separado' | 'divorciado' | 'viudo',
      genero: '' as '' | 'masculino' | 'femenino' | 'otro',
      grupo_sanguineo: '',
      eps: '',
      arl: ''
    },
    
    // Información académica
    informacion_academica: {
      nivel_educativo: '' as '' | 'primaria' | 'bachillerato' | 'tecnico' | 'tecnologo' | 'universitario' | 'especializacion' | 'maestria' | 'doctorado',
      institucion: '',
      titulo_obtenido: '',
      ano_graduacion: new Date().getFullYear(),
      en_estudio: false,
      programa_actual: '',
      institucion_actual: '',
      semestre_actual: 1,
      certificaciones: [] as Array<{
        nombre: string;
        institucion: string;
        fecha_obtencion: string;
        vigencia?: string;
      }>
    },
    
    // Datos laborales expandidos
    datos_laborales: {
      institucion_educativa: 'Coopeenortol',
      cargo: '',
      area_trabajo: '',
      tipo_contrato: 'Indefinido',
      fecha_vinculacion: new Date().toISOString().split('T')[0],
      salario_basico: 0,
      bonificaciones: 0,
      jefe_inmediato: '',
      telefono_jefe: '',
      email_jefe: '',
      sede_trabajo: '',
      horario_trabajo: '',
      experiencia_laboral: [] as Array<{
        empresa: string;
        cargo: string;
        fecha_inicio: string;
        fecha_fin?: string;
        motivo_retiro?: string;
        funciones?: string;
      }>
    },
    
    // Información familiar expandida
    informacion_familiar: {
      familiares: [] as Array<{
        nombre: string;
        parentesco: string;
        fecha_nacimiento?: string;
        documento?: string;
        telefono?: string;
        ocupacion?: string;
        depende_economicamente?: boolean;
      }>,
      contactos_emergencia: [] as Array<{
        nombre: string;
        parentesco: string;
        telefono: string;
        direccion?: string;
        es_principal?: boolean;
      }>,
      personas_autorizadas: [] as Array<{
        nombre: string;
        documento: string;
        telefono: string;
        parentesco?: string;
        puede_recoger_hijo?: boolean;
      }>
    },
    
    // Información financiera expandida
    informacion_financiera: {
      ingresos_mensuales: 0,
      ingresos_adicionales: 0,
      egresos_mensuales: 0,
      obligaciones: [] as Array<{
        tipo: string;
        entidad: string;
        valor_cuota: number;
        saldo_actual?: number;
        fecha_vencimiento?: string;
      }>,
      referencias_comerciales: [] as Array<{
        entidad: string;
        tipo_producto: string;
        telefono?: string;
        comportamiento?: 'excelente' | 'bueno' | 'regular' | 'malo';
      }>,
      ingresos_familiares: 0,
      gastos_familiares: 0,
      activos: [] as Array<{
        tipo: 'inmueble' | 'vehiculo' | 'inversion' | 'otro';
        descripcion: string;
        valor_estimado?: number;
      }>
    },
    
    // Información de vivienda
    informacion_vivienda: {
      tipo_vivienda: '' as '' | 'casa' | 'apartamento' | 'finca' | 'otro',
      tenencia: '' as '' | 'propia' | 'arrendada' | 'familiar' | 'otro',
      valor_arriendo: 0,
      tiempo_residencia: 0,
      servicios_publicos: [] as Array<string>,
      estrato: 1
    }
  });

  // Cargar asociados
  const fetchAsociados = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/v1/asociados', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        // Si viene paginado, extraer los datos
        const asociadosData = data.datos || data;
        setAsociados(Array.isArray(asociadosData) ? asociadosData : []);
      } else {
        setAsociados([]);
      }
    } catch (error) {
      console.error('Error al cargar asociados:', error);
      setAsociados([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAsociados();
  }, []);

  // Filtrar asociados
  const filteredAsociados = (Array.isArray(asociados) ? asociados : []).filter(asociado =>
    asociado.nombres?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asociado.apellidos?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asociado.numero_documento?.includes(searchTerm) ||
    asociado.correo_electronico?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Resetear formulario
  const resetForm = () => {
    setFormData({
      tipo_documento: 'CC',
      numero_documento: '',
      nombres: '',
      apellidos: '',
      correo_electronico: '',
      telefono_principal: '',
      estado: 'activo' as 'activo' | 'inactivo' | 'retirado',
      fecha_ingreso: new Date().toISOString().split('T')[0],
      observaciones: '',
      datos_personales: {
        fecha_nacimiento: '1990-01-01',
        lugar_nacimiento: '',
        direccion: '',
        barrio: '',
        ciudad: 'Bogotá',
        departamento: 'Cundinamarca',
        pais: 'Colombia',
        codigo_postal: '',
        telefono_secundario: '',
        estado_civil: '' as '' | 'soltero' | 'casado' | 'union_libre' | 'separado' | 'divorciado' | 'viudo',
        genero: '' as '' | 'masculino' | 'femenino' | 'otro',
        grupo_sanguineo: '',
        eps: '',
        arl: ''
      },
      informacion_academica: {
        nivel_educativo: '' as '' | 'primaria' | 'bachillerato' | 'tecnico' | 'tecnologo' | 'universitario' | 'especializacion' | 'maestria' | 'doctorado',
        institucion: '',
        titulo_obtenido: '',
        ano_graduacion: new Date().getFullYear(),
        en_estudio: false,
        programa_actual: '',
        institucion_actual: '',
        semestre_actual: 1,
        certificaciones: []
      },
      datos_laborales: {
        institucion_educativa: 'Coopeenortol',
        cargo: '',
        area_trabajo: '',
        tipo_contrato: 'Indefinido',
        fecha_vinculacion: new Date().toISOString().split('T')[0],
        salario_basico: 0,
        bonificaciones: 0,
        jefe_inmediato: '',
        telefono_jefe: '',
        email_jefe: '',
        sede_trabajo: '',
        horario_trabajo: '',
        experiencia_laboral: []
      },
      informacion_familiar: {
        familiares: [],
        contactos_emergencia: [],
        personas_autorizadas: []
      },
      informacion_financiera: {
        ingresos_mensuales: 0,
        ingresos_adicionales: 0,
        egresos_mensuales: 0,
        obligaciones: [],
        referencias_comerciales: [],
        ingresos_familiares: 0,
        gastos_familiares: 0,
        activos: []
      },
      informacion_vivienda: {
        tipo_vivienda: '' as '' | 'casa' | 'apartamento' | 'finca' | 'otro',
        tenencia: '' as '' | 'propia' | 'arrendada' | 'familiar' | 'otro',
        valor_arriendo: 0,
        tiempo_residencia: 0,
        servicios_publicos: [],
        estrato: 1
      }
    });
  };

  // Manejar envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🚀 Iniciando envío de formulario...');
    console.log('📝 Datos del formulario:', formData);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Error: No hay token de autenticación. Por favor, inicia sesión nuevamente.');
        return;
      }
      
      const url = editingAsociado 
        ? `/api/v1/asociados/${editingAsociado.id}`
        : '/api/v1/asociados';
      
      const method = editingAsociado ? 'PUT' : 'POST';
      
      // Preparar los datos con estructura completa requerida por el backend
      const submitData = {
        ...formData,
        datos_laborales: {
          ...formData.datos_laborales,
          salario_basico: Number(formData.datos_laborales.salario_basico) || 0
        },
        informacion_financiera: {
          ...formData.informacion_financiera,
          ingresos_mensuales: Number(formData.informacion_financiera.ingresos_mensuales) || 0,
          egresos_mensuales: Number(formData.informacion_financiera.egresos_mensuales) || 0
        }
      };
      
      console.log('🌐 URL de envío:', url);
      console.log('📤 Método HTTP:', method);
      console.log('📦 Datos a enviar:', submitData);
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(submitData),
      });

      console.log('📨 Respuesta del servidor:', response.status, response.statusText);

      if (response.ok) {
        const responseData = await response.json();
        console.log('✅ Datos de respuesta:', responseData);
        
        await fetchAsociados();
        setShowForm(false);
        setEditingAsociado(null);
        resetForm();
        alert(editingAsociado ? 'Asociado actualizado correctamente' : 'Asociado creado correctamente');
      } else {
        const errorData = await response.json();
        console.error('❌ Error del servidor:', errorData);
        alert('Error: ' + (errorData.detail || 'No se pudo guardar el asociado'));
      }
    } catch (error) {
      console.error('💥 Error al guardar asociado:', error);
      alert('Error al guardar el asociado: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  // Editar asociado
  const handleEdit = (asociado: Asociado) => {
    setEditingAsociado(asociado);
    setFormData({
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
        fecha_nacimiento: asociado.datos_personales?.fecha_nacimiento || '1990-01-01',
        lugar_nacimiento: asociado.datos_personales?.lugar_nacimiento || '',
        direccion: asociado.datos_personales?.direccion || '',
        barrio: asociado.datos_personales?.barrio || '',
        ciudad: asociado.datos_personales?.ciudad || 'Bogotá',
        departamento: asociado.datos_personales?.departamento || 'Cundinamarca',
        pais: asociado.datos_personales?.pais || 'Colombia',
        codigo_postal: asociado.datos_personales?.codigo_postal || '',
        telefono_secundario: asociado.datos_personales?.telefono_secundario || '',
        estado_civil: asociado.datos_personales?.estado_civil || '' as '' | 'soltero' | 'casado' | 'union_libre' | 'separado' | 'divorciado' | 'viudo',
        genero: asociado.datos_personales?.genero || '' as '' | 'masculino' | 'femenino' | 'otro',
        grupo_sanguineo: asociado.datos_personales?.grupo_sanguineo || '',
        eps: asociado.datos_personales?.eps || '',
        arl: asociado.datos_personales?.arl || ''
      },
      
      informacion_academica: {
        nivel_educativo: asociado.informacion_academica?.nivel_educativo || '' as '' | 'primaria' | 'bachillerato' | 'tecnico' | 'tecnologo' | 'universitario' | 'especializacion' | 'maestria' | 'doctorado',
        institucion: asociado.informacion_academica?.institucion || '',
        titulo_obtenido: asociado.informacion_academica?.titulo_obtenido || '',
        ano_graduacion: asociado.informacion_academica?.ano_graduacion || new Date().getFullYear(),
        en_estudio: asociado.informacion_academica?.en_estudio || false,
        programa_actual: asociado.informacion_academica?.programa_actual || '',
        institucion_actual: asociado.informacion_academica?.institucion_actual || '',
        semestre_actual: asociado.informacion_academica?.semestre_actual || 1,
        certificaciones: asociado.informacion_academica?.certificaciones || []
      },
      
      datos_laborales: {
        institucion_educativa: asociado.datos_laborales?.institucion_educativa || 'Coopeenortol',
        cargo: asociado.datos_laborales?.cargo || '',
        area_trabajo: asociado.datos_laborales?.area_trabajo || '',
        tipo_contrato: asociado.datos_laborales?.tipo_contrato || 'Indefinido',
        fecha_vinculacion: asociado.datos_laborales?.fecha_vinculacion || new Date().toISOString().split('T')[0],
        salario_basico: asociado.datos_laborales?.salario_basico || 0,
        bonificaciones: asociado.datos_laborales?.bonificaciones || 0,
        jefe_inmediato: asociado.datos_laborales?.jefe_inmediato || '',
        telefono_jefe: asociado.datos_laborales?.telefono_jefe || '',
        email_jefe: asociado.datos_laborales?.email_jefe || '',
        sede_trabajo: asociado.datos_laborales?.sede_trabajo || '',
        horario_trabajo: asociado.datos_laborales?.horario_trabajo || '',
        experiencia_laboral: asociado.datos_laborales?.experiencia_laboral || []
      },
      
      informacion_familiar: {
        familiares: asociado.informacion_familiar?.familiares || [],
        contactos_emergencia: asociado.informacion_familiar?.contactos_emergencia || [],
        personas_autorizadas: asociado.informacion_familiar?.personas_autorizadas || []
      },
      
      informacion_financiera: {
        ingresos_mensuales: asociado.informacion_financiera?.ingresos_mensuales || 0,
        ingresos_adicionales: asociado.informacion_financiera?.ingresos_adicionales || 0,
        egresos_mensuales: asociado.informacion_financiera?.egresos_mensuales || 0,
        obligaciones: asociado.informacion_financiera?.obligaciones || [],
        referencias_comerciales: asociado.informacion_financiera?.referencias_comerciales || [],
        ingresos_familiares: asociado.informacion_financiera?.ingresos_familiares || 0,
        gastos_familiares: asociado.informacion_financiera?.gastos_familiares || 0,
        activos: asociado.informacion_financiera?.activos || []
      },
      
      informacion_vivienda: {
        tipo_vivienda: asociado.informacion_vivienda?.tipo_vivienda || '' as '' | 'casa' | 'apartamento' | 'finca' | 'otro',
        tenencia: asociado.informacion_vivienda?.tenencia || '' as '' | 'propia' | 'arrendada' | 'familiar' | 'otro',
        valor_arriendo: asociado.informacion_vivienda?.valor_arriendo || 0,
        tiempo_residencia: asociado.informacion_vivienda?.tiempo_residencia || 0,
        servicios_publicos: asociado.informacion_vivienda?.servicios_publicos || [],
        estrato: asociado.informacion_vivienda?.estrato || 1
      }
    });
    setShowForm(true);
  };

  // Eliminar asociado
  const handleDelete = async (id: number) => {
    if (confirm('¿Está seguro de eliminar este asociado?')) {
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
          alert('Asociado eliminado correctamente');
        } else {
          alert('Error al eliminar el asociado');
        }
      } catch (error) {
        console.error('Error al eliminar asociado:', error);
        alert('Error al eliminar el asociado');
      }
    }
  };

  return (
    <div 
      className="min-h-screen bg-gray-50"
      style={{
        minHeight: '100vh',
        backgroundColor: '#f9fafb'
      }}
    >
      {/* Header */}
      <div 
        className="bg-white shadow-sm border-b"
        style={{
          backgroundColor: 'white',
          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
          borderBottom: '1px solid #e5e7eb',
          padding: '1rem 2rem'
        }}
      >
        <div 
          className="flex items-center justify-between"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div 
            className="flex items-center"
            style={{
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <button
              onClick={onBack}
              className="mr-4 p-2 hover:bg-gray-100 rounded"
              style={{
                marginRight: '1rem',
                padding: '0.5rem',
                backgroundColor: 'transparent',
                border: 'none',
                borderRadius: '0.25rem',
                cursor: 'pointer'
              }}
            >
              <svg 
                style={{
                  height: '1.5rem',
                  width: '1.5rem',
                  color: '#4b5563'
                }}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M15 19l-7-7 7-7" 
                />
              </svg>
            </button>
            <h1 
              className="text-2xl font-bold text-gray-900"
              style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: '#111827'
              }}
            >
              Gestión de Asociados
            </h1>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
            style={{
              backgroundColor: '#16a34a',
              color: 'white',
              padding: '0.5rem 1rem',
              borderRadius: '0.375rem',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}
          >
            Nuevo Asociado
          </button>
        </div>
      </div>

      {/* Content */}
      <div 
        className="max-w-7xl mx-auto py-6 px-4"
        style={{
          maxWidth: '80rem',
          margin: '0 auto',
          padding: '1.5rem 1rem'
        }}
      >
        {!showForm ? (
          <>
            {/* Búsqueda */}
            <div 
              className="mb-6"
              style={{
                marginBottom: '1.5rem'
              }}
            >
              <input
                type="text"
                placeholder="Buscar por nombres, apellidos, documento o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                style={{
                  width: '100%',
                  padding: '0.5rem 1rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '1rem'
                }}
              />
            </div>

            {/* Tabla de Asociados */}
            <div 
              className="bg-white shadow overflow-hidden sm:rounded-md"
              style={{
                backgroundColor: 'white',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
                borderRadius: '0.375rem',
                overflow: 'hidden'
              }}
            >
              {loading ? (
                <div 
                  className="p-6 text-center"
                  style={{
                    padding: '1.5rem',
                    textAlign: 'center'
                  }}
                >
                  <div 
                    className="text-gray-500"
                    style={{
                      color: '#6b7280'
                    }}
                  >
                    Cargando asociados...
                  </div>
                </div>
              ) : filteredAsociados.length === 0 ? (
                <div 
                  className="p-6 text-center"
                  style={{
                    padding: '1.5rem',
                    textAlign: 'center'
                  }}
                >
                  <div 
                    className="text-gray-500"
                    style={{
                      color: '#6b7280'
                    }}
                  >
                    {searchTerm ? 'No se encontraron asociados que coincidan con la búsqueda' : 'No hay asociados registrados'}
                  </div>
                </div>
              ) : (
                <div 
                  className="overflow-x-auto"
                  style={{
                    overflowX: 'auto'
                  }}
                >
                  <table 
                    className="min-w-full divide-y divide-gray-200"
                    style={{
                      minWidth: '100%',
                      borderCollapse: 'collapse'
                    }}
                  >
                    <thead 
                      className="bg-gray-50"
                      style={{
                        backgroundColor: '#f9fafb'
                      }}
                    >
                      <tr>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          style={{
                            padding: '0.75rem 1.5rem',
                            textAlign: 'left',
                            fontSize: '0.75rem',
                            fontWeight: '500',
                            color: '#6b7280',
                            textTransform: 'uppercase'
                          }}
                        >
                          ID Asociado
                        </th>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          style={{
                            padding: '0.75rem 1.5rem',
                            textAlign: 'left',
                            fontSize: '0.75rem',
                            fontWeight: '500',
                            color: '#6b7280',
                            textTransform: 'uppercase'
                          }}
                        >
                          Documento
                        </th>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          style={{
                            padding: '0.75rem 1.5rem',
                            textAlign: 'left',
                            fontSize: '0.75rem',
                            fontWeight: '500',
                            color: '#6b7280',
                            textTransform: 'uppercase'
                          }}
                        >
                          Nombre Completo
                        </th>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          style={{
                            padding: '0.75rem 1.5rem',
                            textAlign: 'left',
                            fontSize: '0.75rem',
                            fontWeight: '500',
                            color: '#6b7280',
                            textTransform: 'uppercase'
                          }}
                        >
                          Email
                        </th>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          style={{
                            padding: '0.75rem 1.5rem',
                            textAlign: 'left',
                            fontSize: '0.75rem',
                            fontWeight: '500',
                            color: '#6b7280',
                            textTransform: 'uppercase'
                          }}
                        >
                          Estado
                        </th>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          style={{
                            padding: '0.75rem 1.5rem',
                            textAlign: 'left',
                            fontSize: '0.75rem',
                            fontWeight: '500',
                            color: '#6b7280',
                            textTransform: 'uppercase'
                          }}
                        >
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody 
                      className="bg-white divide-y divide-gray-200"
                      style={{
                        backgroundColor: 'white'
                      }}
                    >
                      {filteredAsociados.map((asociado) => (
                        <tr key={asociado.id}>
                          <td 
                            className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900"
                            style={{
                              padding: '1rem 1.5rem',
                              fontSize: '0.875rem',
                              fontWeight: '500',
                              color: '#111827'
                            }}
                          >
                            #{asociado.id}
                          </td>
                          <td 
                            className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                            style={{
                              padding: '1rem 1.5rem',
                              fontSize: '0.875rem',
                              color: '#111827'
                            }}
                          >
                            {asociado.tipo_documento} {asociado.numero_documento}
                          </td>
                          <td 
                            className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                            style={{
                              padding: '1rem 1.5rem',
                              fontSize: '0.875rem',
                              color: '#111827'
                            }}
                          >
                            {asociado.nombres} {asociado.apellidos}
                          </td>
                          <td 
                            className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                            style={{
                              padding: '1rem 1.5rem',
                              fontSize: '0.875rem',
                              color: '#111827'
                            }}
                          >
                            {asociado.correo_electronico}
                          </td>
                          <td 
                            className="px-6 py-4 whitespace-nowrap"
                            style={{
                              padding: '1rem 1.5rem'
                            }}
                          >
                            <span 
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                asociado.estado === 'activo' 
                                  ? 'bg-green-100 text-green-800'
                                  : asociado.estado === 'inactivo'
                                  ? 'bg-gray-100 text-gray-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                              style={{
                                display: 'inline-flex',
                                padding: '0.25rem 0.5rem',
                                fontSize: '0.75rem',
                                fontWeight: '600',
                                borderRadius: '9999px',
                                backgroundColor: asociado.estado === 'activo' ? '#dcfce7' : asociado.estado === 'inactivo' ? '#f3f4f6' : '#fee2e2',
                                color: asociado.estado === 'activo' ? '#166534' : asociado.estado === 'inactivo' ? '#374151' : '#991b1b'
                              }}
                            >
                              {asociado.estado}
                            </span>
                          </td>
                          <td 
                            className="px-6 py-4 whitespace-nowrap text-sm font-medium"
                            style={{
                              padding: '1rem 1.5rem',
                              fontSize: '0.875rem',
                              fontWeight: '500'
                            }}
                          >
                            <button
                              onClick={() => handleEdit(asociado)}
                              className="text-indigo-600 hover:text-indigo-900 mr-4"
                              style={{
                                color: '#4f46e5',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                marginRight: '1rem'
                              }}
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => handleDelete(asociado.id)}
                              className="text-red-600 hover:text-red-900"
                              style={{
                                color: '#dc2626',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer'
                              }}
                            >
                              Eliminar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        ) : (
          /* Formulario Simplificado */
          <div 
            className="bg-white shadow sm:rounded-md"
            style={{
              backgroundColor: 'white',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
              borderRadius: '0.375rem',
              padding: '1.5rem'
            }}
          >
            <div 
              className="mb-6"
              style={{
                marginBottom: '1.5rem'
              }}
            >
              <h2 
                className="text-lg font-medium text-gray-900"
                style={{
                  fontSize: '1.125rem',
                  fontWeight: '500',
                  color: '#111827'
                }}
              >
                {editingAsociado ? 'Editar Asociado' : 'Nuevo Asociado'}
              </h2>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div 
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                  gap: '1.5rem',
                  marginBottom: '1.5rem'
                }}
              >
                <div>
                  <label 
                    className="block text-sm font-medium text-gray-700 mb-1"
                    style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '0.25rem'
                    }}
                  >
                    Tipo de Documento *
                  </label>
                  <select
                    required
                    value={formData.tipo_documento}
                    onChange={(e) => setFormData({...formData, tipo_documento: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem'
                    }}
                  >
                    <option value="">Seleccione tipo de documento</option>
                    <option value="TI">Tarjeta de Identidad</option>
                    <option value="CC">Cédula de Ciudadanía</option>
                    <option value="CE">Cédula de Extranjería</option>
                    <option value="PAS">Pasaporte</option>
                  </select>
                </div>

                <div>
                  <label 
                    className="block text-sm font-medium text-gray-700 mb-1"
                    style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '0.25rem'
                    }}
                  >
                    Número de Documento *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.numero_documento}
                    onChange={(e) => setFormData({...formData, numero_documento: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>

                <div>
                  <label 
                    className="block text-sm font-medium text-gray-700 mb-1"
                    style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '0.25rem'
                    }}
                  >
                    Nombres *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nombres}
                    onChange={(e) => setFormData({...formData, nombres: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>

                <div>
                  <label 
                    className="block text-sm font-medium text-gray-700 mb-1"
                    style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '0.25rem'
                    }}
                  >
                    Apellidos *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.apellidos}
                    onChange={(e) => setFormData({...formData, apellidos: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>

                <div>
                  <label 
                    className="block text-sm font-medium text-gray-700 mb-1"
                    style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '0.25rem'
                    }}
                  >
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.correo_electronico}
                    onChange={(e) => setFormData({...formData, correo_electronico: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>

                <div>
                  <label 
                    className="block text-sm font-medium text-gray-700 mb-1"
                    style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '0.25rem'
                    }}
                  >
                    Teléfono
                  </label>
                  <input
                    type="text"
                    value={formData.telefono_principal}
                    onChange={(e) => setFormData({...formData, telefono_principal: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>

                <div>
                  <label 
                    className="block text-sm font-medium text-gray-700 mb-1"
                    style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '0.25rem'
                    }}
                  >
                    Fecha de Ingreso *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.fecha_ingreso}
                    onChange={(e) => setFormData({...formData, fecha_ingreso: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>

                <div>
                  <label 
                    className="block text-sm font-medium text-gray-700 mb-1"
                    style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '0.25rem'
                    }}
                  >
                    Estado
                  </label>
                  <select
                    value={formData.estado}
                    onChange={(e) => setFormData({...formData, estado: e.target.value as 'activo' | 'inactivo' | 'retirado'})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem'
                    }}
                  >
                    <option value="activo">Activo</option>
                    <option value="inactivo">Inactivo</option>
                    <option value="retirado">Retirado</option>
                  </select>
                </div>

                <div 
                  className="md:col-span-2"
                  style={{
                    gridColumn: 'span 2'
                  }}
                >
                  <label 
                    className="block text-sm font-medium text-gray-700 mb-1"
                    style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '0.25rem'
                    }}
                  >
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
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>

                <div>
                  <label 
                    className="block text-sm font-medium text-gray-700 mb-1"
                    style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '0.25rem'
                    }}
                  >
                    Cargo
                  </label>
                  <input
                    type="text"
                    value={formData.datos_laborales.cargo}
                    onChange={(e) => setFormData({
                      ...formData, 
                      datos_laborales: {
                        ...formData.datos_laborales,
                        cargo: e.target.value
                      }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>

                <div>
                  <label 
                    className="block text-sm font-medium text-gray-700 mb-1"
                    style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '0.25rem'
                    }}
                  >
                    Salario Básico
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.datos_laborales.salario_basico}
                    onChange={(e) => setFormData({
                      ...formData, 
                      datos_laborales: {
                        ...formData.datos_laborales,
                        salario_basico: Number(e.target.value)
                      }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>

                <div 
                  className="md:col-span-2"
                  style={{
                    gridColumn: 'span 2'
                  }}
                >
                  <label 
                    className="block text-sm font-medium text-gray-700 mb-1"
                    style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '0.25rem'
                    }}
                  >
                    Observaciones
                  </label>
                  <textarea
                    value={formData.observaciones}
                    onChange={(e) => setFormData({...formData, observaciones: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem',
                      resize: 'vertical'
                    }}
                  />
                </div>
              </div>

              <div 
                className="flex justify-end space-x-4"
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '1rem'
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingAsociado(null);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  style={{
                    padding: '0.5rem 1rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    color: '#374151',
                    backgroundColor: 'white',
                    cursor: 'pointer',
                    fontSize: '0.875rem'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#16a34a',
                    color: 'white',
                    borderRadius: '0.375rem',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '500'
                  }}
                >
                  {editingAsociado ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default AsociadosModule;
