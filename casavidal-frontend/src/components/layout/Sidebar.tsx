import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Package, ShoppingCart, FileText, Activity, ClipboardList, Truck, Settings } from 'lucide-react';
import { useAuthStore } from '../../store/auth. store';
import { settingsApi } from '../../api/settings. api';
import type { Settings } from '../../types';

const menuItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/clients', icon: Users, label: 'Clientes' },
  { to: '/products', icon: Package, label: 'Productos' },
  { to: '/sales', icon: ShoppingCart, label: 'Ventas' },
  { to: '/quotations', icon: FileText, label: 'Cotizaciones' },
  { to: '/crm', icon: Activity, label: 'CRM' },
  { to: '/special-orders', icon: ClipboardList, label: 'Pedidos Especiales' },
  { to: '/suppliers', icon: Truck, label: 'Proveedores' },
];

export default function Sidebar() {
  const user = useAuthStore((state) => state.user);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    const loadLogo = async () => {
      try {
        const settings = await settingsApi.getSettings();
        if (settings. companyLogo) {
          setLogoUrl(settings. companyLogo);
        }
      } catch {
        // Silenciar
      }
    };
    loadLogo();
  }, []);

  return (
    <div className="w-64 bg- primary-500 border- r border- primary-600 flex flex- col">
      {/* Logo */}
      <div className="p-6 border- b border- primary-600">
        <div className="flex items- center gap-3">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt="Logo"
              className="h-10 w-10 rounded- 2xl object- cover"
            />
          ) : (
            <div className="h-10 w-10 rounded- 2xl bg- white/20 text- white flex items- center justify- center font- display font- semibold backdrop- blur- sm">
              CV
            </div>
          )}
          <div>
            <h1 className="text-xl font- semibold text- white font- display">CasaVidal</h1>
            <p className="text- xs text- primary-100">Sistema de Gestión</p>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 p-4 space- y-2">
        {menuItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items- center px-4 py-3 rounded- xl transition- all ${isActive ? 'bg- white/20 text- white shadow- sm backdrop- blur- sm' : 'text- primary-100 hover: bg- primary-600/50 hover: text- white'}`
            }
          >
            <item.icon className="w-5 h-5 mr-3" />
            <span className="font- medium">{item.label}</span>
          </NavLink>
        ))}
        {user?.role === 'ADMIN' && (
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `flex items- center px-4 py-3 rounded- xl transition- all ${isActive ? 'bg- white/20 text- white shadow- sm backdrop- blur- sm' : 'text- primary-100 hover: bg- primary-600/50 hover: text- white'}`
            }
          >
            <Settings className="w-5 h-5 mr-3" />
            <span className="font- medium">Configuración</span>
          </NavLink>
        )}
      </nav>
    </div>
  );
}