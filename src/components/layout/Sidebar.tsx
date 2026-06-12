import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Package, ShoppingCart, FileText, Activity, ClipboardList, Truck, CalendarDays, BarChart3, Bell } from 'lucide-react';
import { settingsApi } from '../../api/settings.api';
import { dashboardApi } from '../../api/dashboard.api';
import { suggestionsApi } from '../../api/suggestions.api';

const menuItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/clients', icon: Users, label: 'Clientes' },
  { to: '/products', icon: Package, label: 'Productos' },
  { to: '/sales', icon: ShoppingCart, label: 'Ventas' },
  { to: '/quotations', icon: FileText, label: 'Cotizaciones' },
  { to: '/crm', icon: Activity, label: 'CRM' },
  { to: '/calendar', icon: CalendarDays, label: 'Calendario' },
  { to: '/reports', icon: BarChart3, label: 'Reportes' },
  { to: '/notifications', icon: Bell, label: 'Notificaciones' },
  { to: '/special-orders', icon: ClipboardList, label: 'Pedidos Especiales' },
  { to: '/suppliers', icon: Truck, label: 'Proveedores' },
];

export default function Sidebar() {
  const location = useLocation();
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const stored = window.localStorage.getItem('sidebarCollapsed');
    return stored === 'true';
  });
  const [crmBadge, setCrmBadge] = useState(0);

  useEffect(() => {
    window.localStorage.setItem('sidebarCollapsed', String(isCollapsed));
  }, [isCollapsed]);

  useEffect(() => {
    const loadLogo = async () => {
      try {
        const settings = await settingsApi.getSettings();
        if (settings.companyLogo) {
          setLogoUrl((prev) => prev !== settings.companyLogo ? settings.companyLogo : prev);
        }
      } catch {
        // Silenciar
      }
    };
    loadLogo();
  }, [location.pathname]);

  useEffect(() => {
    const fetchCrmBadge = async () => {
      try {
        const [pending, suggestions] = await Promise.all([
          dashboardApi.getPendingActivities(),
          suggestionsApi.getSuggestionCount(),
        ]);
        const current = (pending.pendingTasks || 0) + (suggestions || 0);
        const seen = parseInt(localStorage.getItem('crmBadgeSeen') || '0', 10);
        setCrmBadge(current > seen ? current : 0);
      } catch {
        // Silenciar
      }
    };
    fetchCrmBadge();
    const interval = setInterval(fetchCrmBadge, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className={`bg-primary-500 border-r border-primary-600 flex flex-col transition-[width] duration-300 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Logo */}
      <div className="px-4 py-5 border-b border-primary-600 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt="Logo"
              className="h-10 w-10 rounded-2xl object-cover"
              onError={() => setLogoUrl(null)}
            />
          ) : (
            <div className="h-10 w-10 rounded-2xl bg-white/20 text-white flex items-center justify-center font-display font-semibold backdrop-blur-sm">
              CV
            </div>
          )}
          {!isCollapsed && (
            <div>
              <h1 className="text-xl font-semibold text-white font-display">CasaVidal</h1>
              <p className="text-xs text-primary-100">Sistema de Gestión</p>
            </div>
          )}
        </div>
        <button
          type="button"
          aria-label={isCollapsed ? 'Expandir menú' : 'Colapsar menú'}
          className="text-white/80 hover:text-white focus:outline-none focus:ring-2 focus:ring-white rounded-full p-1"
          onClick={() => setIsCollapsed((prev) => !prev)}
        >
          {isCollapsed ? (
            <span className="text-sm font-semibold">›</span>
          ) : (
            <span className="text-sm font-semibold">‹</span>
          )}
        </button>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 p-3 space-y-2">
        {menuItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center px-3 py-3 rounded-xl transition-all ${isCollapsed ? 'justify-center gap-0 relative' : 'gap-3'} ${
                isActive
                  ? 'bg-white/20 text-white shadow-sm backdrop-blur-sm'
                  : 'text-primary-100 hover:bg-primary-600/50 hover:text-white'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            {!isCollapsed && <span className="font-medium">{item.label}</span>}
            {item.to === '/crm' && crmBadge > 0 && (
              <span className={`ml-auto bg-amber-400 text-amber-900 text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1 ${isCollapsed ? 'absolute top-0 right-0' : ''}`}>
                {crmBadge > 99 ? '99+' : crmBadge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
