import { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  Home,
  Users,
  CreditCard,
  PiggyBank,
  FileText,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';

interface MainLayoutProps {
  children: ReactNode;
}

interface NavItem {
  label: string;
  path: string;
  icon: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems: NavItem[] = [
    { label: 'Dashboard', path: '/dashboard', icon: <Home className="w-5 h-5" /> },
    { label: 'Asociados', path: '/asociados', icon: <Users className="w-5 h-5" /> },
    { label: 'Créditos', path: '/creditos', icon: <CreditCard className="w-5 h-5" /> },
    { label: 'Ahorros', path: '/ahorros', icon: <PiggyBank className="w-5 h-5" /> },
    { label: 'Documentos', path: '/documentos', icon: <FileText className="w-5 h-5" /> },
    { label: 'Contabilidad', path: '/contabilidad', icon: <BarChart3 className="w-5 h-5" /> },
    { label: 'Configuración', path: '/configuracion', icon: <Settings className="w-5 h-5" /> },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar para desktop */}
      <aside className="hidden md:flex md:flex-shrink-0 md:fixed md:inset-y-0 md:z-50">
        <div className="flex flex-col w-64 bg-white border-r border-gray-200">
          {/* Logo */}
          <div className="flex flex-col items-center justify-center px-4 py-6 bg-white border-b border-gray-200">
            <div className="h-32 w-32 mb-3 flex items-center justify-center">
              <img
                src="/logo-principal.png"
                alt="Coopeenortol Logo"
                className="h-full w-full object-contain"
              />
            </div>
            <h1 className="text-xl font-bold text-green-700 text-center">Coopeenortol</h1>
          </div>

          {/* Navegación */}
          <nav className="flex-1 flex flex-col justify-center px-2 py-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  {item.icon}
                  <span className="ml-3">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Usuario y logout */}
          <div className="flex-shrink-0 p-4 border-t border-gray-200">
            <div className="flex items-center mb-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {user?.nombre_completo?.charAt(0) || 'U'}
                  </span>
                </div>
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.nombre_completo}
                </p>
                <p className="text-xs text-gray-500 truncate">{user?.rol}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="ml-3">Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Sidebar móvil */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black bg-opacity-50 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 md:hidden transform transition-transform">
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between px-4 py-4 bg-white border-b border-gray-200">
                <div className="flex items-center">
                  <div className="h-10 w-10 mr-2 flex items-center justify-center">
                    <img
                      src="/logo-principal.png"
                      alt="Coopeenortol Logo"
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <h1 className="text-lg font-bold text-green-700">Coopeenortol</h1>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <button
                      key={item.path}
                      onClick={() => {
                        navigate(item.path);
                        setSidebarOpen(false);
                      }}
                      className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                        isActive
                          ? 'bg-blue-50 text-blue-600'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      {item.icon}
                      <span className="ml-3">{item.label}</span>
                    </button>
                  );
                })}
              </nav>

              <div className="flex-shrink-0 p-4 border-t border-gray-200">
                <div className="flex items-center mb-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {user?.nombre_completo?.charAt(0) || 'U'}
                      </span>
                    </div>
                  </div>
                  <div className="ml-3 flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user?.nombre_completo}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{user?.rol}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="ml-3">Cerrar Sesión</span>
                </button>
              </div>
            </div>
          </aside>
        </>
      )}

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col md:ml-64">
        {/* Header móvil */}
        <header className="md:hidden bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="flex items-center justify-between h-16 px-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-gray-700"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-semibold">Coopeenortol</h1>
            <div className="w-6" /> {/* Spacer */}
          </div>
        </header>

        {/* Contenido */}
        <main className="flex-1">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
