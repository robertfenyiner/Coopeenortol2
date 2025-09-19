import React, { useState } from 'react';
import AsociadosModule from './AsociadosModule';

interface User {
  username: string;
  email: string;
  nombre_completo: string;
  rol: string;
}

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const [activeModule, setActiveModule] = useState<string | null>(null);

  if (activeModule === 'asociados') {
    return <AsociadosModule onBack={() => setActiveModule(null)} />;
  }
  return (
    <div 
      className="min-h-screen bg-gray-50"
      style={{
        minHeight: '100vh',
        backgroundColor: '#f9fafb'
      }}
    >
      {/* Header */}
      <header 
        className="bg-white shadow-sm border-b"
        style={{
          backgroundColor: 'white',
          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
          borderBottom: '1px solid #e5e7eb'
        }}
      >
        <div 
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
          style={{
            maxWidth: '80rem',
            margin: '0 auto',
            padding: '0 1rem'
          }}
        >
          <div 
            className="flex justify-between items-center h-16"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              height: '4rem'
            }}
          >
            <div 
              className="flex items-center"
              style={{
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <img 
                src="/assets/logo.svg" 
                alt="Logo"
                style={{
                  height: '2.5rem',
                  width: '2.5rem',
                  marginRight: '0.75rem'
                }}
              />
              <h1 
                className="text-xl font-semibold text-gray-900"
                style={{
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  color: '#111827'
                }}
              >
                Coopeenortol
              </h1>
            </div>
            
            <div 
              className="flex items-center space-x-4"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem'
              }}
            >
              <span 
                className="text-sm text-gray-600"
                style={{
                  fontSize: '0.875rem',
                  color: '#4b5563'
                }}
              >
                {user.nombre_completo}
              </span>
              <span 
                className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded"
                style={{
                  fontSize: '0.75rem',
                  backgroundColor: '#dcfce7',
                  color: '#166534',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '0.25rem'
                }}
              >
                {user.rol}
              </span>
              <button
                onClick={onLogout}
                className="text-sm text-gray-600 hover:text-gray-900"
                style={{
                  fontSize: '0.875rem',
                  color: '#4b5563',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.5rem'
                }}
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main 
        className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8"
        style={{
          maxWidth: '80rem',
          margin: '0 auto',
          padding: '1.5rem 1rem'
        }}
      >
        <div 
          className="px-4 py-6 sm:px-0"
          style={{
            padding: '1.5rem 1rem'
          }}
        >
          <h2 
            className="text-2xl font-bold text-gray-900 mb-6"
            style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: '#111827',
              marginBottom: '1.5rem'
            }}
          >
            Panel Principal
          </h2>
          
          {/* Navigation Cards */}
          <div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '1.5rem'
            }}
          >
            {/* Card: Panel Principal */}
            <div 
              className="bg-white overflow-hidden shadow rounded-lg cursor-pointer hover:shadow-md transition-shadow"
              style={{
                backgroundColor: 'white',
                borderRadius: '0.5rem',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
                cursor: 'pointer',
                transition: 'box-shadow 0.2s'
              }}
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
                    className="flex-shrink-0"
                    style={{
                      flexShrink: '0'
                    }}
                  >
                    <svg 
                      style={{
                        height: '2rem',
                        width: '2rem',
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
                        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" 
                      />
                    </svg>
                  </div>
                  <div 
                    className="ml-4"
                    style={{
                      marginLeft: '1rem'
                    }}
                  >
                    <h3 
                      className="text-lg font-medium text-gray-900"
                      style={{
                        fontSize: '1.125rem',
                        fontWeight: '500',
                        color: '#111827'
                      }}
                    >
                      Panel Principal
                    </h3>
                    <p 
                      className="text-sm text-gray-500"
                      style={{
                        fontSize: '0.875rem',
                        color: '#6b7280'
                      }}
                    >
                      Vista general del sistema
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Card: Gestión de Asociados */}
            <div 
              onClick={() => setActiveModule('asociados')}
              className="bg-white overflow-hidden shadow rounded-lg cursor-pointer hover:shadow-md transition-shadow"
              style={{
                backgroundColor: 'white',
                borderRadius: '0.5rem',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
                cursor: 'pointer',
                transition: 'box-shadow 0.2s'
              }}
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
                    className="flex-shrink-0"
                    style={{
                      flexShrink: '0'
                    }}
                  >
                    <svg 
                      style={{
                        height: '2rem',
                        width: '2rem',
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
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" 
                      />
                    </svg>
                  </div>
                  <div 
                    className="ml-4"
                    style={{
                      marginLeft: '1rem'
                    }}
                  >
                    <h3 
                      className="text-lg font-medium text-gray-900"
                      style={{
                        fontSize: '1.125rem',
                        fontWeight: '500',
                        color: '#111827'
                      }}
                    >
                      Gestión de Asociados
                    </h3>
                    <p 
                      className="text-sm text-gray-500"
                      style={{
                        fontSize: '0.875rem',
                        color: '#6b7280'
                      }}
                    >
                      Administrar miembros
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Card: Gestión de Usuarios */}
            <div 
              className="bg-white overflow-hidden shadow rounded-lg cursor-pointer hover:shadow-md transition-shadow"
              style={{
                backgroundColor: 'white',
                borderRadius: '0.5rem',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
                cursor: 'pointer',
                transition: 'box-shadow 0.2s'
              }}
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
                    className="flex-shrink-0"
                    style={{
                      flexShrink: '0'
                    }}
                  >
                    <svg 
                      style={{
                        height: '2rem',
                        width: '2rem',
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
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" 
                      />
                    </svg>
                  </div>
                  <div 
                    className="ml-4"
                    style={{
                      marginLeft: '1rem'
                    }}
                  >
                    <h3 
                      className="text-lg font-medium text-gray-900"
                      style={{
                        fontSize: '1.125rem',
                        fontWeight: '500',
                        color: '#111827'
                      }}
                    >
                      Gestión de Usuarios
                    </h3>
                    <p 
                      className="text-sm text-gray-500"
                      style={{
                        fontSize: '0.875rem',
                        color: '#6b7280'
                      }}
                    >
                      Administrar accesos
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Card: Reportes */}
            <div 
              className="bg-white overflow-hidden shadow rounded-lg cursor-pointer hover:shadow-md transition-shadow"
              style={{
                backgroundColor: 'white',
                borderRadius: '0.5rem',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
                cursor: 'pointer',
                transition: 'box-shadow 0.2s'
              }}
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
                    className="flex-shrink-0"
                    style={{
                      flexShrink: '0'
                    }}
                  >
                    <svg 
                      style={{
                        height: '2rem',
                        width: '2rem',
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
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" 
                      />
                    </svg>
                  </div>
                  <div 
                    className="ml-4"
                    style={{
                      marginLeft: '1rem'
                    }}
                  >
                    <h3 
                      className="text-lg font-medium text-gray-900"
                      style={{
                        fontSize: '1.125rem',
                        fontWeight: '500',
                        color: '#111827'
                      }}
                    >
                      Reportes
                    </h3>
                    <p 
                      className="text-sm text-gray-500"
                      style={{
                        fontSize: '0.875rem',
                        color: '#6b7280'
                      }}
                    >
                      Informes y estadísticas
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
