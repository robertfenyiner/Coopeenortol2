import React, { useState } from 'react';

interface LoginFormProps {
  onLogin: (accessToken: string) => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          username,
          password,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.access_token);
        
        // Obtener info del usuario
        const userResponse = await fetch('/api/v1/auth/me', {
          headers: {
            'Authorization': `Bearer ${data.access_token}`,
          },
        });
        
        if (userResponse.ok) {
          const userData = await userResponse.json();
          localStorage.setItem('user', JSON.stringify(userData));
          onLogin(data.access_token);
        }
      } else {
        setError('Credenciales inválidas');
      }
    } catch (error) {
      setError('Error de conexión');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100"
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(to bottom right, #f0fdf4, #dcfce7)'
      }}
    >
      <div 
        className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-lg"
        style={{
          maxWidth: '28rem',
          width: '100%',
          padding: '2rem',
          backgroundColor: 'white',
          borderRadius: '0.75rem',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
        }}
      >
        {/* Logo y título centrados */}
        <div 
          className="text-center"
          style={{
            textAlign: 'center'
          }}
        >
          {/* Logo principal */}
          <div 
            className="mx-auto mb-6"
            style={{
              margin: '0 auto 1.5rem auto',
              display: 'flex',
              justifyContent: 'center'
            }}
          >
            <img 
              src="/assets/logo-principal.jpg" 
              alt="Logo Coopeenortol"
              style={{
                height: '8rem',
                width: 'auto',
                maxWidth: '12rem',
                borderRadius: '0.75rem',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
              }}
              onError={(e) => {
                // Fallback al logo SVG si no se puede cargar la imagen
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.parentElement!.innerHTML = `
                  <div style="
                    height: 6rem; 
                    width: 6rem; 
                    display: flex; 
                    align-items: center; 
                    justify-content: center; 
                    border-radius: 50%; 
                    background-color: #dcfce7;
                    margin: 0 auto;
                  ">
                    <img src="/assets/logo.svg" alt="Logo Coopeenortol" style="height: 6rem; width: 6rem;" />
                  </div>
                `;
              }}
            />
          </div>
          
          {/* Nombre de la cooperativa */}
          <h1 
            className="text-4xl font-bold text-gray-900 mb-2"
            style={{
              fontSize: '2.25rem',
              fontWeight: 'bold',
              color: '#111827',
              marginBottom: '0.5rem',
              textAlign: 'center'
            }}
          >
            Coopeenortol
          </h1>
          
          {/* Subtítulo */}
          <p 
            className="text-lg text-gray-600 mb-8"
            style={{
              fontSize: '1.125rem',
              color: '#4b5563',
              marginBottom: '2rem',
              textAlign: 'center'
            }}
          >
            Sistema de Gestión de Asociados
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label 
                htmlFor="username" 
                className="block text-sm font-medium text-gray-700 mb-1"
                style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '0.25rem'
                }}
              >
                Usuario
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  color: '#111827',
                  fontSize: '1rem'
                }}
                placeholder="Ingrese su usuario"
              />
            </div>

            <div>
              <label 
                htmlFor="password" 
                className="block text-sm font-medium text-gray-700 mb-1"
                style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '0.25rem'
                }}
              >
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  color: '#111827',
                  fontSize: '1rem'
                }}
                placeholder="Ingrese su contraseña"
              />
            </div>
          </div>

          {error && (
            <div 
              className="text-red-600 text-sm text-center"
              style={{
                color: '#dc2626',
                fontSize: '0.875rem',
                textAlign: 'center',
                padding: '0.75rem',
                backgroundColor: '#fef2f2',
                borderRadius: '0.375rem',
                border: '1px solid #fecaca'
              }}
            >
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
              style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
                padding: '0.75rem 1rem',
                border: 'none',
                fontSize: '1rem',
                fontWeight: '600',
                borderRadius: '0.375rem',
                color: 'white',
                backgroundColor: isLoading ? '#9ca3af' : '#16a34a',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.7 : 1,
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (!isLoading) {
                  (e.target as HTMLButtonElement).style.backgroundColor = '#15803d';
                }
              }}
              onMouseLeave={(e) => {
                if (!isLoading) {
                  (e.target as HTMLButtonElement).style.backgroundColor = '#16a34a';
                }
              }}
            >
              {isLoading ? (
                <>
                  <svg 
                    style={{
                      animation: 'spin 1s linear infinite',
                      marginRight: '0.5rem',
                      height: '1rem',
                      width: '1rem'
                    }}
                    fill="none" 
                    viewBox="0 0 24 24"
                  >
                    <circle 
                      style={{
                        opacity: 0.25
                      }}
                      cx="12" 
                      cy="12" 
                      r="10" 
                      stroke="currentColor" 
                      strokeWidth="4"
                    />
                    <path 
                      style={{
                        opacity: 0.75
                      }}
                      fill="currentColor" 
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Iniciando sesión...
                </>
              ) : (
                'Iniciar Sesión'
              )}
            </button>
          </div>
        </form>
      </div>
      
      {/* CSS para la animación de carga */}
      <style>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};

export default LoginForm;
