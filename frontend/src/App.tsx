import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import ToastContainer from './components/ui/ToastContainer';
import MainLayout from './components/layout/MainLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AsociadosPage from './pages/AsociadosPage';
import AsociadoDetailPage from './pages/AsociadoDetailPage';
import AsociadoEditPage from './pages/AsociadoEditPage';
import CreditosPage from './pages/CreditosPage';
import CreditoDetailPage from './pages/CreditoDetailPage';
import AhorrosPage from './pages/AhorrosPage';
import CuentaAhorroDetailPage from './pages/CuentaAhorroDetailPage';
import ReportesPage from './pages/ReportesPage';
import BalanceGeneralPage from './pages/BalanceGeneralPage';
import ReporteCarteraPage from './pages/ReporteCarteraPage';
import EstadoResultadosPage from './pages/EstadoResultadosPage';
import ReporteMoraPage from './pages/ReporteMoraPage';
import EstadoCuentaPage from './pages/EstadoCuentaPage';
import EstadisticasGeneralesPage from './pages/EstadisticasGeneralesPage';

// Componente de ruta protegida
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();

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

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />
        }
      />
      
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Navigate to="/dashboard" replace />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <MainLayout>
              <DashboardPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/asociados"
        element={
          <ProtectedRoute>
            <MainLayout>
              <AsociadosPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/asociados/nuevo"
        element={
          <ProtectedRoute>
            <MainLayout>
              <AsociadoEditPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/asociados/:id/editar"
        element={
          <ProtectedRoute>
            <MainLayout>
              <AsociadoEditPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/asociados/:id"
        element={
          <ProtectedRoute>
            <MainLayout>
              <AsociadoDetailPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/creditos"
        element={
          <ProtectedRoute>
            <MainLayout>
              <CreditosPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/creditos/:id"
        element={
          <ProtectedRoute>
            <MainLayout>
              <CreditoDetailPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/ahorros"
        element={
          <ProtectedRoute>
            <MainLayout>
              <AhorrosPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/ahorros/:id"
        element={
          <ProtectedRoute>
            <MainLayout>
              <CuentaAhorroDetailPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/documentos"
        element={
          <ProtectedRoute>
            <MainLayout>
              <div className="text-center py-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Módulo de Documentos
                </h2>
                <p className="text-gray-600">En desarrollo...</p>
              </div>
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/contabilidad"
        element={
          <ProtectedRoute>
            <MainLayout>
              <div className="text-center py-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Módulo de Contabilidad
                </h2>
                <p className="text-gray-600">En desarrollo...</p>
              </div>
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/reportes"
        element={
          <ProtectedRoute>
            <MainLayout>
              <ReportesPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/reportes/balance-general"
        element={
          <ProtectedRoute>
            <MainLayout>
              <BalanceGeneralPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/reportes/cartera"
        element={
          <ProtectedRoute>
            <MainLayout>
              <ReporteCarteraPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/reportes/estado-resultados"
        element={
          <ProtectedRoute>
            <MainLayout>
              <EstadoResultadosPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/reportes/mora"
        element={
          <ProtectedRoute>
            <MainLayout>
              <ReporteMoraPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/reportes/estado-cuenta"
        element={
          <ProtectedRoute>
            <MainLayout>
              <EstadoCuentaPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/reportes/estadisticas"
        element={
          <ProtectedRoute>
            <MainLayout>
              <EstadisticasGeneralesPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/configuracion"
        element={
          <ProtectedRoute>
            <MainLayout>
              <div className="text-center py-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Configuración
                </h2>
                <p className="text-gray-600">En desarrollo...</p>
              </div>
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <ToastContainer />
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;