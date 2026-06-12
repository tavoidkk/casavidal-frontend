import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card } from '../components/ui/Card';
import { Users, Package, TrendingUp, AlertCircle, ShoppingCart, Clock, ListTodo, Sparkles } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { dashboardApi, type PendingActivities } from '../api/dashboard.api';
import { suggestionsApi } from '../api/suggestions.api';
import type { DashboardStats, SalesTrendItem, TopProduct, TopClient } from '../types';
import { staggerContainer, staggerItem } from '../utils/motion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cachedFetch } from '../lib/requestCache';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [trend, setTrend] = useState<SalesTrendItem[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [topClients, setTopClients] = useState<TopClient[]>([]);
  const [pendingActivities, setPendingActivities] = useState<PendingActivities | null>(null);
  const [suggestionCount, setSuggestionCount] = useState(0);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingTrend, setLoadingTrend] = useState(true);
  const [loadingTopProducts, setLoadingTopProducts] = useState(true);
  const [loadingTopClients, setLoadingTopClients] = useState(true);
  const [loadingActivities, setLoadingActivities] = useState(true);
  const [loadingSuggestions, setLoadingSuggestions] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    const loadStats = async () => {
      try {
        const s = await cachedFetch('dashboard:stats', () => dashboardApi.getStats());
        if (isActive) {
          setStats(s);
        }
      } catch (statsError) {
        console.error('Error loading dashboard stats:', statsError);
        if (isActive) {
          setError('No se pudo cargar el resumen del dashboard.');
        }
      } finally {
        if (isActive) {
          setInitialLoading(false);
        }
      }
    };

    const loadTrend = async () => {
      try {
        const t = await cachedFetch('dashboard:sales-trend', () => dashboardApi.getSalesTrend(14));
        if (isActive) {
          setTrend(t);
        }
      } catch (trendError) {
        console.error('Error loading sales trend:', trendError);
        if (isActive) {
          setTrend([]);
        }
      } finally {
        if (isActive) {
          setLoadingTrend(false);
        }
      }
    };

    const loadTopProducts = async () => {
      try {
        const tp = await cachedFetch('dashboard:top-products', () => dashboardApi.getTopProducts(5));
        if (isActive) {
          setTopProducts(tp);
        }
      } catch (topProductsError) {
        console.error('Error loading top products:', topProductsError);
        if (isActive) {
          setTopProducts([]);
        }
      } finally {
        if (isActive) {
          setLoadingTopProducts(false);
        }
      }
    };

    const loadTopClients = async () => {
      try {
        const tc = await cachedFetch('dashboard:top-clients', () => dashboardApi.getTopClients(5));
        if (isActive) {
          setTopClients(tc);
        }
      } catch (topClientsError) {
        console.error('Error loading top clients:', topClientsError);
        if (isActive) {
          setTopClients([]);
        }
      } finally {
        if (isActive) {
          setLoadingTopClients(false);
        }
      }
    };

    const loadPendingActivities = async () => {
      try {
        const pa = await cachedFetch('dashboard:pending', () => dashboardApi.getPendingActivities());
        if (isActive) {
          setPendingActivities(pa);
        }
      } catch (pendingError) {
        console.error('Error loading pending activities:', pendingError);
        if (isActive) {
          setPendingActivities(null);
        }
      } finally {
        if (isActive) {
          setLoadingActivities(false);
        }
      }
    };

    const loadSuggestionsCount = async () => {
      try {
        const sc = await cachedFetch('dashboard:suggestions-count', () => suggestionsApi.getSuggestionCount());
        if (isActive) {
          setSuggestionCount(sc ?? 0);
        }
      } catch (suggestionsError) {
        console.error('Error loading suggestions count:', suggestionsError);
        if (isActive) {
          setSuggestionCount(0);
        }
      } finally {
        if (isActive) {
          setLoadingSuggestions(false);
        }
      }
    };

    loadStats();
    loadTrend();
    loadTopProducts();
    loadTopClients();
    loadPendingActivities();
    loadSuggestionsCount();

    return () => {
      isActive = false;
    };
  }, []);

  const isSuggestionsLoading = loadingSuggestions && suggestionCount === 0;

  const statCards = [
      {
        icon: TrendingUp,
        label: 'Ventas Hoy',
         value: `$${(stats?.salesToday.total || 0).toLocaleString('es-VE', { minimumFractionDigits: 2 })}`,
         sub: `${stats?.salesToday.count || 0} transacciones`,
        color: 'bg-primary-500',
        onClick: () => navigate('/sales'),
      },
      {
        icon: ShoppingCart,
        label: 'Ventas del Mes',
        value: `$${(stats?.salesMonth.total || 0).toLocaleString('es-VE', { minimumFractionDigits: 2 })}`,
        sub: `${stats?.salesMonth.count || 0} transacciones`,
        color: 'bg-secondary-500',
        onClick: () => navigate('/sales'),
      },
      {
        icon: Users,
        label: 'Clientes Activos',
        value: (stats?.totalClients || 0).toLocaleString(),
        sub: 'en el sistema',
        color: 'bg-secondary-500',
        onClick: () => navigate('/clients'),
      },
    {
      icon: AlertCircle,
      label: 'Stock Bajo',
      value: String(stats?.lowStockCount || 0),
      sub: 'productos bajo mínimo',
      color: 'bg-red-500',
      onClick: () => navigate('/products?lowStock=true'),
    },
    {
      icon: Package,
      label: 'Pedidos Pendientes',
      value: String(stats?.pendingOrders || 0),
      sub: 'pedidos especiales activos',
      color: 'bg-amber-500',
      onClick: () => navigate('/special-orders'),
    },
    {
      icon: Sparkles,
      label: 'Sugerencias CRM',
       value: isSuggestionsLoading ? '…' : String(suggestionCount),
       sub: isSuggestionsLoading ? 'Cargando sugerencias…' : 'acciones recomendadas',
      color: 'bg-purple-500',
      onClick: () => navigate('/crm'),
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

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Stats Grid */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
      >
        {statCards.map((stat, index) => (
          <motion.div key={index} variants={staggerItem}>
            <Card interactive={!initialLoading} onClick={initialLoading ? undefined : stat.onClick}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
                  {initialLoading ? (
                    <>
                      <div className="h-6 w-28 rounded bg-gray-200 animate-pulse" />
                      <div className="mt-2 h-3 w-24 rounded bg-gray-100 animate-pulse" />
                    </>
                  ) : (
                    <>
                      <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{stat.sub}</p>
                    </>
                  )}
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
        {loadingTrend ? (
          <div className="h-40 w-full animate-pulse rounded-xl bg-gray-100" />
        ) : trendData.every((d) => d.total === 0) ? (
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
          {loadingTopProducts ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-gray-100 animate-pulse" />
                    <div className="space-y-1">
                      <div className="h-4 w-32 rounded bg-gray-100 animate-pulse" />
                      <div className="h-3 w-24 rounded bg-gray-100 animate-pulse" />
                    </div>
                  </div>
                  <div className="space-y-1 text-right">
                    <div className="h-4 w-12 rounded bg-gray-100 animate-pulse" />
                    <div className="h-3 w-20 rounded bg-gray-100 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : topProducts.length === 0 ? (
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
          {loadingTopClients ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-gray-100 animate-pulse" />
                    <div className="space-y-1">
                      <div className="h-4 w-32 rounded bg-gray-100 animate-pulse" />
                      <div className="h-3 w-20 rounded bg-gray-100 animate-pulse" />
                    </div>
                  </div>
                  <div className="space-y-1 text-right">
                    <div className="h-4 w-16 rounded bg-gray-100 animate-pulse" />
                    <div className="h-3 w-12 rounded bg-gray-100 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : topClients.length === 0 ? (
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

      {/* Actividades Pendientes */}
      <Card className="mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 font-display flex items-center gap-2">
            <ListTodo className="w-5 h-5 text-primary-500" /> Actividades Pendientes
          </h2>
          <span className="text-sm bg-primary-100 text-primary-700 px-3 py-1 rounded-full font-medium">
            {loadingActivities ? '…' : `${pendingActivities?.pendingTasks ?? 0} tareas`}
          </span>
        </div>
        {loadingActivities ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-gray-200" />
                  <div className="space-y-1">
                    <div className="h-4 w-36 rounded bg-gray-200" />
                    <div className="h-3 w-28 rounded bg-gray-100" />
                  </div>
                </div>
                <span className="h-3 w-10 rounded bg-gray-100" />
              </div>
            ))}
          </div>
        ) : !pendingActivities || pendingActivities.todayAppointments.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-4">No hay actividades programadas para hoy</p>
        ) : (
          <div className="space-y-3">
            {pendingActivities.todayAppointments.map((act) => (
              <div key={act.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${act.status === 'PENDIENTE' ? 'bg-amber-400' : act.status === 'PERDIDA' ? 'bg-red-400' : 'bg-green-400'}`} />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{act.subject}</p>
                    <p className="text-xs text-gray-500">
                      {act.client
                        ? act.client.clientType === 'JURIDICO'
                          ? act.client.companyName
                          : `${act.client.firstName || ''} ${act.client.lastName || ''}`
                        : 'Sin cliente'}
                    </p>
                  </div>
                </div>
                {act.dueDate && (
                  <span className="text-xs text-gray-400">
                    {format(new Date(act.dueDate), 'HH:mm', { locale: es })}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
