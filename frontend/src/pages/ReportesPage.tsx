import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

const ReportesPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const reportes = [
    {
      id: 'balance-general',
      title: 'Balance General',
      description: 'Estado de activos, pasivos y patrimonio a una fecha específica',
      icon: '📊',
      color: 'bg-blue-500',
      route: '/reportes/balance-general'
    },
    {
      id: 'estado-resultados',
      title: 'Estado de Resultados',
      description: 'Ingresos, gastos y utilidad del período',
      icon: '📈',
      color: 'bg-green-500',
      route: '/reportes/estado-resultados'
    },
    {
      id: 'cartera',
      title: 'Reporte de Cartera',
      description: 'Análisis completo de créditos y cartera',
      icon: '💰',
      color: 'bg-purple-500',
      route: '/reportes/cartera'
    },
    {
      id: 'mora',
      title: 'Reporte de Mora',
      description: 'Créditos en mora clasificados por rangos',
      icon: '⚠️',
      color: 'bg-red-500',
      route: '/reportes/mora'
    },
    {
      id: 'estado-cuenta',
      title: 'Estado de Cuenta',
      description: 'Estado financiero completo de un asociado',
      icon: '👤',
      color: 'bg-indigo-500',
      route: '/reportes/estado-cuenta'
    },
    {
      id: 'estadisticas',
      title: 'Estadísticas Generales',
      description: 'KPIs y métricas del sistema',
      icon: '📉',
      color: 'bg-yellow-500',
      route: '/reportes/estadisticas'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reportes Financieros</h1>
          <p className="mt-2 text-gray-600">
            Genera y consulta reportes financieros y administrativos
          </p>
        </div>
      </div>

      {/* Grid de Reportes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reportes.map((reporte) => (
          <Card
            key={reporte.id}
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => navigate(reporte.route)}
          >
            <div className="p-6">
              <div className="flex items-start space-x-4">
                <div className={`${reporte.color} w-12 h-12 rounded-lg flex items-center justify-center text-2xl flex-shrink-0`}>
                  {reporte.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {reporte.title}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {reporte.description}
                  </p>
                  <div className="mt-4">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(reporte.route);
                      }}
                    >
                      Ver Reporte →
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Sección de Ayuda */}
      <Card className="bg-blue-50 border-blue-200">
        <div className="p-6">
          <div className="flex items-start space-x-3">
            <div className="text-2xl">💡</div>
            <div>
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                Información de Reportes
              </h3>
              <ul className="space-y-2 text-sm text-blue-800">
                <li>• Los reportes se generan en tiempo real con la información actual del sistema</li>
                <li>• Puedes exportar reportes en formato PDF y Excel</li>
                <li>• Todos los reportes requieren permisos de lectura</li>
                <li>• Las exportaciones requieren permisos adicionales</li>
              </ul>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ReportesPage;
