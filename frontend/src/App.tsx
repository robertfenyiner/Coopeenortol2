import { useState, useEffect } from 'react';
import LoginForm from './components/LoginForm';
import Dashboard from './components/Dashboard';

interface User {
  username: string;
  email: string;
  nombre_completo: string;
  rol: string;
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar si hay un token guardado en localStorage
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (savedToken && savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setToken(savedToken);
        setUser(userData);
      } catch (error) {
        // Si hay error al parsear, limpiar localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    
    setLoading(false);
  }, []);

  const handleLogin = (accessToken: string) => {
    // El token y user ya fueron guardados en LoginForm
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setToken(accessToken);
      setUser(JSON.parse(savedUser));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  // Si no hay usuario logueado, mostrar login
  if (!user || !token) {
    return <LoginForm onLogin={handleLogin} />;
  }

  // Si hay usuario logueado, mostrar dashboard
  return <Dashboard user={user} onLogout={handleLogout} />;
}

export default App;