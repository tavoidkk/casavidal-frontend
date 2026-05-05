import { useRef, useState } from 'react';
import { User, Settings, LogOut } from 'lucide-react';
import { useClickOutside } from '../../hooks/useClickOutside';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';

export function ProfileDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { logout, user } = useAuthStore();

  useClickOutside(ref, () => setOpen(false));

  const handleLogout = () => {
    setOpen(false);
    logout();
  };

  const handleSettings = () => {
    setOpen(false);
    navigate('/settings');
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center hover:bg-primary-200 transition-colors focus:outline-2 focus:outline-primary-500 focus:outline-offset-2"
        aria-label="Menú de perfil"
        aria-expanded={open}
        aria-haspopup="true"
      >
        <User className="w-6 h-6 text-primary-600" />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
          {user?.role === 'ADMIN' && (
            <button
              onClick={handleSettings}
              className="flex items-center w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Settings className="w-4 h-4 mr-3 text-gray-400" />
              Configuración
            </button>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-4 h-4 mr-3" />
            Cerrar Sesión
          </button>
        </div>
      )}
    </div>
  );
}