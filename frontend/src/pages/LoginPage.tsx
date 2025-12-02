import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

export default function LoginPage() {
  const { login } = useAuth();
  const { showToast } = useToast();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username || !password) {
      showToast('error', 'Por favor completa todos los campos');
      return;
    }

    setIsLoading(true);

    try {
      await login(username, password);
      showToast('success', 'Sesión iniciada correctamente');
    } catch (error: any) {
      showToast('error', error.message || 'Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-48 w-48 flex items-center justify-center">
            <img
              src="/logo-principal.png"
              alt="Coopeenortol Logo"
              className="h-full w-full object-contain"
            />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-green-700">Coopeenortol</h2>
          <p className="mt-2 text-sm text-gray-600">
            Sistema de Gestión Cooperativa
          </p>
        </div>

        <div className="bg-white py-8 px-6 shadow-xl rounded-lg">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Usuario"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Ingresa tu usuario"
              required
              autoComplete="username"
            />

            <Input
              label="Contraseña"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Ingresa tu contraseña"
              required
              autoComplete="current-password"
            />

            <Button
              type="submit"
              className="w-full"
              isLoading={isLoading}
              disabled={isLoading}
            >
              {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              ¿Problemas para ingresar? Contacta al administrador
            </p>
          </div>
        </div>

        <div className="text-center text-xs text-gray-500">
          © 2024 Coopeenortol. Todos los derechos reservados.
        </div>
      </div>
    </div>
  );
}
