import { User } from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';

export default function Header() {
  const user = useAuthStore((state) => state.user);

  return (
    <header className="bg-white shadow-sm border-b px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">
            Bienvenido de vuelta
          </h2>
          <p className="text-sm text-gray-500">
            Gestiona tu ferretería de forma inteligente
          </p>
        </div>

        {/* User Info */}
        <div className="flex items-center space-x-3">
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-gray-500">{user?.role}</p>
          </div>
          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
            <User className="w-6 h-6 text-primary-600" />
          </div>
        </div>
      </div>
    </header>
  );
}