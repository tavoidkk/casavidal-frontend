import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Package,
  ShoppingCart,
  Activity,
  ClipboardList,
  Truck,
  LogOut 
} from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';

const menuItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/clients', icon: Users, label: 'Clientes' },
  { to: '/products', icon: Package, label: 'Productos' },
  { to: '/sales', icon: ShoppingCart, label: 'Ventas' },
  { to: '/crm', icon: Activity, label: 'CRM' },
  { to: '/special-orders', icon: ClipboardList, label: 'Pedidos Especiales' },
  { to: '/suppliers', icon: Truck, label: 'Proveedores' },
];

export default function Sidebar() {
  const logout = useAuthStore((state) => state.logout);

  return (
    <div className="w-64 bg-white shadow-lg flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b">
        <h1 className="text-2xl font-bold text-primary-600">CasaVidal</h1>
        <p className="text-sm text-gray-500">Sistema de Gestión</p>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-primary-50 text-primary-600'
                  : 'text-gray-700 hover:bg-gray-50'
              }`
            }
          >
            <item.icon className="w-5 h-5 mr-3" />
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t">
        <button
          onClick={logout}
          className="flex items-center w-full px-4 py-3 text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
        >
          <LogOut className="w-5 h-5 mr-3" />
          <span className="font-medium">Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );
}
