import React, { useState, useEffect } from 'react';
import AsociadoFormExpanded from './AsociadoFormExpanded';

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
  foto_url?: string;
  
  // Datos expandidos opcionales
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
      telefono: string;
      tiempo_relacion?: string;
    }>;
    ingresos_familiares?: number;
    gastos_familiares?: number;
    activos?: Array<{
      tipo: string;
      descripcion: string;
      valor_estimado: number;
    }>;
  };

  informacion_vivienda?: {
    tipo_vivienda: 'casa' | 'apartamento' | 'finca' | 'otro';
    tenencia: 'propia' | 'arrendada' | 'familiar' | 'otro';
    valor_arriendo?: number;
    tiempo_residencia?: number;
    servicios_publicos?: string[];
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

  const fetchAsociados = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No hay token de autenticación');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/v1/asociados', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setAsociados(Array.isArray(data) ? data : []);
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

  const handleFormSubmit = async (formData: any) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Error: No hay token de autenticación');
        return;
      }

      const url = editingAsociado
        ? `/api/v1/asociados/${editingAsociado.id}`
        : '/api/v1/asociados';
      
      const method = editingAsociado ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error del servidor: ${response.status} - ${errorText}`);
      }

      alert(editingAsociado ? 'Asociado actualizado exitosamente' : 'Asociado creado exitosamente');
      
      setShowForm(false);
      setEditingAsociado(null);
      await fetchAsociados();
      
    } catch (error: any) {
      console.error('Error al guardar asociado:', error);
      alert(`Error al guardar el asociado: ${error.message}`);
    }
  };

  const handleEdit = (asociado: Asociado) => {
    setEditingAsociado(asociado);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este asociado?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Error: No hay token de autenticación');
        return;
      }

      const response = await fetch(`/api/v1/asociados/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      alert('Asociado eliminado exitosamente');
      await fetchAsociados();
    } catch (error: any) {
      console.error('Error al eliminar asociado:', error);
      alert(`Error al eliminar el asociado: ${error.message}`);
    }
  };

  if (showForm) {
    return (
      <AsociadoFormExpanded 
        onClose={() => {
          setShowForm(false);
          setEditingAsociado(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={editingAsociado}
        isEditing={!!editingAsociado}
      />
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      {/* Header */}
      <div style={{ backgroundColor: 'white', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: '80rem', margin: '0 auto', padding: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button
              onClick={onBack}
              style={{ marginRight: '1rem', padding: '0.5rem', borderRadius: '0.25rem', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', color: '#4b5563' }}
            >
              ← Volver
            </button>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827', margin: 0 }}>
              Gestión de Asociados
            </h1>
          </div>
          <button
            onClick={() => setShowForm(true)}
            style={{ backgroundColor: '#059669', color: 'white', padding: '0.5rem 1rem', borderRadius: '0.375rem', border: 'none', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '500' }}
          >
            ➕ Nuevo Asociado
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '1.5rem 1rem' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem 0' }}>
            <div style={{ color: '#6b7280' }}>Cargando asociados...</div>
          </div>
        ) : asociados.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 0' }}>
            <div style={{ color: '#6b7280', marginBottom: '1rem' }}>No hay asociados registrados.</div>
            <button
              onClick={() => setShowForm(true)}
              style={{ backgroundColor: '#059669', color: 'white', padding: '0.5rem 1.5rem', borderRadius: '0.375rem', border: 'none', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '500' }}
            >
              Crear primer asociado
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
            {asociados.map((asociado) => (
              <div 
                key={asociado.id}
                style={{ backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', padding: '1.5rem' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                  <div style={{ width: '4rem', height: '4rem', backgroundColor: '#e5e7eb', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '1rem' }}>
                    {asociado.foto_url ? (
                      <img 
                        src={asociado.foto_url} 
                        alt={`${asociado.nombres} ${asociado.apellidos}`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                      />
                    ) : (
                      <span style={{ fontSize: '1.5rem', color: '#9ca3af' }}>👤</span>
                    )}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', margin: 0 }}>
                      {asociado.nombres} {asociado.apellidos}
                    </h3>
                    <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                      {asociado.tipo_documento}: {asociado.numero_documento}
                    </p>
                  </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                    <span style={{ color: '#6b7280', marginRight: '0.5rem' }}>📧</span>
                    <span style={{ color: '#111827' }}>{asociado.correo_electronico}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                    <span style={{ color: '#6b7280', marginRight: '0.5rem' }}>📱</span>
                    <span style={{ color: '#111827' }}>{asociado.telefono_principal || 'No especificado'}</span>
                  </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <span 
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '0.125rem 0.625rem',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: '500',
                      backgroundColor: asociado.estado === 'activo' ? '#dcfce7' : '#fee2e2',
                      color: asociado.estado === 'activo' ? '#166534' : '#991b1b'
                    }}
                  >
                    {asociado.estado === 'activo' ? '🟢' : '🔴'}
                    {asociado.estado.charAt(0).toUpperCase() + asociado.estado.slice(1)}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                  <button
                    onClick={() => handleEdit(asociado)}
                    style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem', backgroundColor: '#2563eb', color: 'white', borderRadius: '0.25rem', border: 'none', cursor: 'pointer' }}
                  >
                    ✏️ Editar
                  </button>
                  <button
                    onClick={() => handleDelete(asociado.id)}
                    style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem', backgroundColor: '#dc2626', color: 'white', borderRadius: '0.25rem', border: 'none', cursor: 'pointer' }}
                  >
                    🗑️ Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AsociadosModule;