import { Card } from '../components/ui/Card';
import { Users, Package, TrendingUp, AlertCircle } from 'lucide-react';

export default function DashboardPage() {
  const stats = [
    { icon: Users, label: 'Clientes Totales', value: '1,250', color: 'bg-blue-500' },
    { icon: Package, label: 'Productos', value: '450', color: 'bg-green-500' },
    { icon: TrendingUp, label: 'Ventas Hoy', value: '$12,500', color: 'bg-purple-500' },
    { icon: AlertCircle, label: 'Stock Bajo', value: '8', color: 'bg-red-500' },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <Card key={index}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`${stat.color} p-3 rounded-full`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Mensaje temporal */}
      <Card>
        <h2 className="text-xl font-semibold mb-4">🚀 Sistema Funcional</h2>
        <p className="text-gray-600">
          El backend está conectado y funcionando. Las páginas de Clientes y Productos se crearán en los siguientes pasos.
        </p>
      </Card>
    </div>
  );
}