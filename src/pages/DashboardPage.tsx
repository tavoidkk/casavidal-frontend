import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '../components/ui/Card';
import { Users, Package, TrendingUp, AlertCircle, ShoppingCart, Clock } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { dashboardApi } from '../api/dashboard.api';
import type { DashboardStats, SalesTrendItem, TopProduct, TopClient } from '../types';
import { staggerContainer, staggerItem } from '../utils/motion';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [trend, setTrend] = useState<SalesTrendItem[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [topClients, setTopClients] = useState<TopClient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAll = async () => {
      try {
        const [s, t, tp, tc] = await Promise.all([
          dashboardApi.getStats(),
          dashboardApi.getSalesTrend(14),
          dashboardApi.getTopProducts(5),
          dashboardApi.getTopClients(5),
        ]);
        setStats(s);
        setTrend(t);
        setTopProducts(tp);
        setTopClients(tc);
      } catch (error) {
        console.error('Error loading dashboard:', error);
      } finally {
        setLoading(false);
      }
    };
    loadAll();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  const statCards = [
      {
        icon: TrendingUp,
        label: 'Ventas Hoy',
        value: `$${(stats?.salesToday.total || 0).toLocaleString('es-VE', { minimumFractionDigits: 2 })}`,
        sub: `${stats?.salesToday.count || 0} transacciones`,
        color: 'bg-primary-500',
      },
      {
        icon: ShoppingCart,
        label: 'Ventas del Mes',
        value: `$${(stats?.salesMonth.total || 0).toLocaleString('es-VE', { minimumFractionDigits: 2 })}`,
        sub: `${stats?.salesMonth.count || 0} transacciones`,
        color: 'bg-secondary-500',
      },
      {
        icon: Users,
        label: 'Clientes Activos',
        value: (stats?.totalClients || 0).toLocaleString(),
        sub: 'en el sistema',
        color: 'bg-secondary-500',
      },
    {
      icon: AlertCircle,
      label: 'Stock Bajo',
      value: String(stats?.lowStockCount || 0),
      sub: 'productos bajo mínimo',
      color: 'bg-red-500',
    },
    {
      icon: Package,
      label: 'Pedidos Pendientes',
      value: String(stats?.pendingOrders || 0),
      sub: 'pedidos especiales activos',
      color: 'bg-amber-500',
    },
    {
      icon: Clock,
      label: 'Listo para entregar',
      value: '—',
      sub: 'próximamente',
      color: 'bg-gray-400',
    },
  ];

  const trendData = trend.map((t) => ({
    date: new Date(t.date).toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit' }),
    total: t.total,
    count: t.count,
  }));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 font-display">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Resumen general de tu operacion</p>
        </div>
      </div>

      {/* Stats Grid */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
      >
        {statCards.map((stat, index) => (
          <motion.div key={index} variants={staggerItem}>
            <Card interactive>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
                  <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{stat.sub}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-2xl shrink-0 shadow-sm`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Gráfica de ventas */}
      <Card className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 font-display">Ventas últimos 14 días</h2>
        {trendData.every((d) => d.total === 0) ? (
          <div className="flex items-center justify-center h-40 text-gray-400">
            <p>No hay ventas registradas en este período</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis
                tick={{ fontSize: 11 }}
                tickFormatter={(v: number) => `$${v.toLocaleString()}`}
              />
              <Tooltip
                formatter={(value) => [`$${Number(value).toLocaleString('es-VE', { minimumFractionDigits: 2 })}`, 'Ventas']}
                labelFormatter={(label) => `Fecha: ${label}`}
              />
              <Line
                type="monotone"
                dataKey="total"
                stroke="#BF5824"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* Top productos y clientes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 font-display">Top 5 Productos</h2>
          {topProducts.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">Sin datos de ventas aún</p>
          ) : (
            <div className="space-y-3">
              {topProducts.map((p, idx) => (
                <div key={p.productId} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-xs font-bold">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium">{p.name}</p>
                      <p className="text-xs text-gray-400">{p.category}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{p.totalQuantity} und.</p>
                    <p className="text-xs text-gray-400">${p.totalRevenue.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 font-display">Top 5 Clientes</h2>
          {topClients.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">Sin clientes con compras aún</p>
          ) : (
            <div className="space-y-3">
              {topClients.map((c, idx) => (
                <div key={c.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center text-xs font-bold">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium">{c.displayName}</p>
                      <p className="text-xs text-gray-400">{c.category} · {c.purchaseCount} compras</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">
                      ${c.totalPurchases.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-gray-400">{c.loyaltyPoints} pts</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
