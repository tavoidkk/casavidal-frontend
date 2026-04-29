import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { LogIn, AlertCircle, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '../utils/motion';
import { authApi } from '../api/auth.api';
import { useAuthStore } from '../store/auth.store';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authApi.login(data);
      setAuth(response.user, response.token);
      navigate('/dashboard');
    } catch (err: any) {
      const message = err.response?.data?.error || 'Error al iniciar sesión';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-gray-50">
      <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-primary-50 via-white to-primary-100">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-primary-500 text-white flex items-center justify-center font-display font-semibold">
            CV
          </div>
          <div>
            <p className="text-sm text-gray-500">Plataforma CRM</p>
            <h1 className="text-2xl font-semibold text-gray-900 font-display">CasaVidal</h1>
          </div>
        </div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="max-w-md"
        >
          <motion.h2 variants={staggerItem} className="text-4xl font-semibold text-gray-900 font-display">
            Control total para tu ferreteria
          </motion.h2>
          <motion.p variants={staggerItem} className="mt-4 text-gray-600">
            Gestiona clientes, ventas e inventario con una interfaz moderna, dinamica y segura.
          </motion.p>
          <motion.div variants={staggerItem} className="mt-6 inline-flex items-center gap-2 text-primary-600">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">Experiencia premium</span>
          </motion.div>
        </motion.div>

        <p className="text-sm text-gray-400">© 2025 CasaVidal - Proyecto de Tesis URBE</p>
      </div>

      <div className="flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="w-full max-w-md"
        >
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-500 rounded-2xl mb-4">
              <LogIn className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-semibold text-gray-900 font-display">CasaVidal</h1>
            <p className="text-gray-600 mt-2">Sistema de Gestion Integral</p>
          </div>

          <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-8">
            <h2 className="text-2xl font-semibold text-gray-900 font-display mb-6">
              Iniciar Sesion
            </h2>

            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start">
                <AlertCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-red-800">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Email"
                type="email"
                placeholder="admin@casavidal.com"
                {...register('email')}
                error={errors.email?.message}
              />

              <Input
                label="Contrasena"
                type="password"
                placeholder="••••••••"
                {...register('password')}
                error={errors.password?.message}
              />

              <Button type="submit" className="w-full" isLoading={isLoading}>
                {isLoading ? 'Iniciando sesion...' : 'Iniciar Sesion'}
              </Button>
            </form>

            <div className="mt-6 p-4 bg-gray-50 rounded-xl">
              <p className="text-sm font-medium text-gray-700 mb-2">
                Credenciales de prueba:
              </p>
              <div className="text-sm text-gray-600 space-y-1">
                <p>admin@casavidal.com</p>
                <p>admin123</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
