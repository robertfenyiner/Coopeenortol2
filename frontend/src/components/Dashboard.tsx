import React, { useState } from 'react';
import AsociadosModule from './AsociadosModule';

interface User {
  id?: number;
  username: string;
  email: string;
  nombre_completo: string;
  rol: string;
}

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

type ActiveModule = null | 'asociados' | 'usuarios' | 'reportes';

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const [activeModule, setActiveModule] = useState<ActiveModule>(null);

  // Manejar navegación a módulos
  const handleModuleClick = (module: ActiveModule) => {
    setActiveModule(module);
  };

  // Volver al dashboard principal
  const handleBackToDashboard = () => {
    setActiveModule(null);
  };

  // Si hay un módulo activo, mostrar el componente correspondiente
  if (activeModule === 'asociados') {
    return <AsociadosModule onBack={handleBackToDashboard} />;
  }

  // Dashboard principal
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
          borderBottom: '1px solid #e5e7eb'
        }}
      >
        <div 
          className="max-w-7xl mx-auto px-4 py-4"
          style={{
            maxWidth: '80rem',
            margin: '0 auto',
            padding: '1rem'
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
            {/* Logo y título */}
            <div 
              className="flex items-center"
              style={{
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <img
                src="/assets/logo-principal.jpg"
                alt="Coopeenortol Logo"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' fill='%2316a34a'/%3E%3Ctext x='20' y='25' text-anchor='middle' fill='white' font-size='14' font-weight='bold'%3EC%3C/text%3E%3C/svg%3E";
                }}
                style={{
                  height: '3rem',
                  width: 'auto',
                  marginRight: '1rem'
                }}
              />
              <h1 
                className="text-2xl font-bold text-gray-900"
                style={{
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  color: '#111827'
                }}
              >
                Coopeenortol - Sistema de Gestión
              </h1>
            </div>
            
            {/* Usuario y logout */}
            <div 
              className="flex items-center space-x-4"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem'
              }}
            >
              <span 
                className="text-gray-700"
                style={{
                  color: '#374151'
                }}
              >
                Bienvenido, {user.nombre_completo || user.email}
              </span>
              <button
                onClick={onLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
                style={{
                  backgroundColor: '#dc2626',
                  color: 'white',
                  padding: '0.5rem 1rem',
                  borderRadius: '0.375rem',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div 
        className="max-w-7xl mx-auto py-6 px-4"
        style={{
          maxWidth: '80rem',
          margin: '0 auto',
          padding: '1.5rem 1rem'
        }}
      >
        {/* Tarjetas de módulos */}
        <div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '1.5rem'
          }}
        >
          {/* Gestión de Asociados */}
          <div 
            className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
            style={{
              backgroundColor: 'white',
              borderRadius: '0.5rem',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              cursor: 'pointer',
              transition: 'box-shadow 0.3s'
            }}
            onClick={() => handleModuleClick('asociados')}
          >
            <div 
              className="p-6"
              style={{
                padding: '1.5rem'
              }}
            >
              <div 
                className="flex items-center"
                style={{
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <div 
                  className="bg-green-100 p-3 rounded-full"
                  style={{
                    backgroundColor: '#dcfce7',
                    padding: '0.75rem',
                    borderRadius: '50%',
                    marginRight: '1rem'
                  }}
                >
                  <svg 
                    className="w-6 h-6 text-green-600"
                    style={{
                      width: '1.5rem',
                      height: '1.5rem',
                      color: '#16a34a'
                    }}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" 
                    />
                  </svg>
                </div>
                <div>
                  <h3 
                    className="text-lg font-semibold text-gray-900"
                    style={{
                      fontSize: '1.125rem',
                      fontWeight: '600',
                      color: '#111827'
                    }}
                  >
                    Gestión de Asociados
                  </h3>
                  <p 
                    className="text-gray-600 text-sm"
                    style={{
                      color: '#4b5563',
                      fontSize: '0.875rem',
                      marginTop: '0.25rem'
                    }}
                  >
                    Administrar miembros de la cooperativa
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Gestión de Usuarios */}
          <div 
            className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
            style={{
              backgroundColor: 'white',
              borderRadius: '0.5rem',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              cursor: 'pointer',
              transition: 'box-shadow 0.3s'
            }}
            onClick={() => handleModuleClick('usuarios')}
          >
            <div 
              className="p-6"
              style={{
                padding: '1.5rem'
              }}
            >
              <div 
                className="flex items-center"
                style={{
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <div 
                  className="bg-blue-100 p-3 rounded-full"
                  style={{
                    backgroundColor: '#dbeafe',
                    padding: '0.75rem',
                    borderRadius: '50%',
                    marginRight: '1rem'
                  }}
                >
                  <svg 
                    className="w-6 h-6 text-blue-600"
                    style={{
                      width: '1.5rem',
                      height: '1.5rem',
                      color: '#2563eb'
                    }}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" 
                    />
                  </svg>
                </div>
                <div>
                  <h3 
                    className="text-lg font-semibold text-gray-900"
                    style={{
                      fontSize: '1.125rem',
                      fontWeight: '600',
                      color: '#111827'
                    }}
                  >
                    Gestión de Usuarios
                  </h3>
                  <p 
                    className="text-gray-600 text-sm"
                    style={{
                      color: '#4b5563',
                      fontSize: '0.875rem',
                      marginTop: '0.25rem'
                    }}
                  >
                    Administrar acceso al sistema
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Reportes */}
          <div 
            className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
            style={{
              backgroundColor: 'white',
              borderRadius: '0.5rem',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              cursor: 'pointer',
              transition: 'box-shadow 0.3s'
            }}
            onClick={() => handleModuleClick('reportes')}
          >
            <div 
              className="p-6"
              style={{
                padding: '1.5rem'
              }}
            >
              <div 
                className="flex items-center"
                style={{
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <div 
                  className="bg-purple-100 p-3 rounded-full"
                  style={{
                    backgroundColor: '#f3e8ff',
                    padding: '0.75rem',
                    borderRadius: '50%',
                    marginRight: '1rem'
                  }}
                >
                  <svg 
                    className="w-6 h-6 text-purple-600"
                    style={{
                      width: '1.5rem',
                      height: '1.5rem',
                      color: '#9333ea'
                    }}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
                    />
                  </svg>
                </div>
                <div>
                  <h3 
                    className="text-lg font-semibold text-gray-900"
                    style={{
                      fontSize: '1.125rem',
                      fontWeight: '600',
                      color: '#111827'
                    }}
                  >
                    Reportes
                  </h3>
                  <p 
                    className="text-gray-600 text-sm"
                    style={{
                      color: '#4b5563',
                      fontSize: '0.875rem',
                      marginTop: '0.25rem'
                    }}
                  >
                    Generar informes y estadísticas
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Estadísticas rápidas */}
        <div 
          className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4"
          style={{
            marginTop: '2rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem'
          }}
        >
          <div 
            className="bg-white p-4 rounded-lg shadow"
            style={{
              backgroundColor: 'white',
              padding: '1rem',
              borderRadius: '0.5rem',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
            }}
          >
            <h4 
              className="text-sm font-medium text-gray-500"
              style={{
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#6b7280'
              }}
            >
              Total Asociados
            </h4>
            <p 
              className="text-2xl font-bold text-gray-900"
              style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: '#111827',
                marginTop: '0.25rem'
              }}
            >
              0
            </p>
          </div>
          
          <div 
            className="bg-white p-4 rounded-lg shadow"
            style={{
              backgroundColor: 'white',
              padding: '1rem',
              borderRadius: '0.5rem',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
            }}
          >
            <h4 
              className="text-sm font-medium text-gray-500"
              style={{
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#6b7280'
              }}
            >
              Asociados Activos
            </h4>
            <p 
              className="text-2xl font-bold text-green-600"
              style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: '#16a34a',
                marginTop: '0.25rem'
              }}
            >
              0
            </p>
          </div>
          
          <div 
            className="bg-white p-4 rounded-lg shadow"
            style={{
              backgroundColor: 'white',
              padding: '1rem',
              borderRadius: '0.5rem',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
            }}
          >
            <h4 
              className="text-sm font-medium text-gray-500"
              style={{
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#6b7280'
              }}
            >
              Usuarios del Sistema
            </h4>
            <p 
              className="text-2xl font-bold text-blue-600"
              style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: '#2563eb',
                marginTop: '0.25rem'
              }}
            >
              1
            </p>
          </div>
          
          <div 
            className="bg-white p-4 rounded-lg shadow"
            style={{
              backgroundColor: 'white',
              padding: '1rem',
              borderRadius: '0.5rem',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
            }}
          >
            <h4 
              className="text-sm font-medium text-gray-500"
              style={{
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#6b7280'
              }}
            >
              Reportes Generados
            </h4>
            <p 
              className="text-2xl font-bold text-purple-600"
              style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: '#9333ea',
                marginTop: '0.25rem'
              }}
            >
              0
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
