import { Search, User } from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';
import { NotificationBell } from './NotificationBell';
import { ProfileDropdown } from './ProfileDropdown';

export default function Header() {
  const user = useAuthStore((state) => state.user);

  return (
    <header className="bg-white border-b border-gray-100 px-6 py-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 font-display">
            Bienvenido de vuelta
          </h2>
          <p className="text-sm text-gray-500">
            Gestiona tu ferretería de forma inteligente
          </p>
        </div>

        <div className="hidden md:flex items-center gap-3 px-4 py-2 border border-gray-200 rounded-xl bg-gray-50">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar clientes, productos..."
            className="bg-transparent text-sm text-gray-700 focus:outline-none w-64"
          />
        </div>

        {/* User Info & Notifications */}
        <div className="flex items-center gap-3">
          {/* Notification Bell */}
          <NotificationBell />

          {/* User Name */}
          <div className="hidden sm:block text-right mr-2">
            <p className="text-sm font-medium text-gray-900">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-gray-500">{user?.role}</p>
          </div>

          {/* Profile Dropdown */}
          <ProfileDropdown />
        </div>
      </div>
    </header>
  );
}