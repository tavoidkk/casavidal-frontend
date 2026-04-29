import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Package,
  ShoppingCart,
  FileText,
  Activity,
  ClipboardList,
  Truck,
  Settings,
  LogOut 
} from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';

const menuItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/clients', icon: Users, label: 'Clientes' },
  { to: '/products', icon: Package, label: 'Productos' },
  { to: '/sales', icon: ShoppingCart, label: 'Ventas' },
  { to: '/quotations', icon: FileText, label: 'Cotizaciones' },
  { to: '/crm', icon: Activity, label: 'CRM' },
  { to: '/special-orders', icon: ClipboardList, label: 'Pedidos Especiales' },
  { to: '/suppliers', icon: Truck, label: 'Proveedores' },
  { to: '/settings', icon: Settings, label: 'Configuración', adminOnly: true },
];

export default function Sidebar() {
  const { logout, user } = useAuthStore();

  return (
    <div className="w-64 bg-primary-500 border-r border-primary-600 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-primary-600">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-white/20 text-white flex items-center justify-center font-display font-semibold backdrop-blur-sm">
            CV
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white font-display">CasaVidal</h1>
            <p className="text-xs text-primary-100">Sistema de Gestión</p>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          if (item.adminOnly && user?.role !== 'ADMIN') {
            return null;
          }
          
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center px-4 py-3 rounded-xl transition-all ${
                  isActive
                    ? 'bg-white/20 text-white shadow-sm backdrop-blur-sm'
                    : 'text-primary-100 hover:bg-primary-600/50 hover:text-white'
                }`
              }
            >
              <item.icon className="w-5 h-5 mr-3" />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-primary-600">
        <button
          onClick={logout}
          className="flex items-center w-full px-4 py-3 text-primary-100 hover:bg-red-500/30 hover:text-white rounded-xl transition-colors"
        >
          <LogOut className="w-5 h-5 mr-3" />
          <span className="font-medium">Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );
}