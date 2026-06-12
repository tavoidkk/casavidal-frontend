import { Suspense, lazy, type ComponentType, type LazyExoticComponent, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { pageTransition } from './utils/motion';
import PageLoader from './components/ui/PageLoader';
import { useAuthStore } from '../src/store/auth.store';
import { useCurrencyStore } from '../src/store/currency.store';

// Pages
import LoginPage from './pages/LoginPage';

const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const ClientsPage = lazy(() => import('./pages/ClientsPage'));
const ProductsPage = lazy(() => import('./pages/ProductsPage'));
const SalesPage = lazy(() => import('./pages/SalesPage'));
const QuotationsPage = lazy(() => import('./pages/QuotationsPage'));
const SpecialOrdersPage = lazy(() => import('./pages/SpecialOrdersPage'));
const SuppliersPage = lazy(() => import('./pages/SuppliersPage'));
const CRMPage = lazy(() => import('./pages/CRMPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const CalendarPage = lazy(() => import('./pages/CalendarPage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));

// Layout
import Layout from './components/layout/Layout';

type PageRoute = {
  path: string;
  Component: LazyExoticComponent<ComponentType<unknown>>;
};

const pageRoutes: PageRoute[] = [
  { path: 'dashboard', Component: DashboardPage },
  { path: 'clients', Component: ClientsPage },
  { path: 'products', Component: ProductsPage },
  { path: 'sales', Component: SalesPage },
  { path: 'quotations', Component: QuotationsPage },
  { path: 'crm', Component: CRMPage },
  { path: 'calendar', Component: CalendarPage },
  { path: 'reports', Component: ReportsPage },
  { path: 'special-orders', Component: SpecialOrdersPage },
  { path: 'suppliers', Component: SuppliersPage },
  { path: 'settings', Component: SettingsPage },
  { path: 'notifications', Component: NotificationsPage },
];

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

const AsyncPage = ({ Component }: { Component: PageRoute['Component'] }) => (
  <Suspense fallback={<PageLoader />}>
    <motion.div {...pageTransition} className="h-full">
      <Component />
    </motion.div>
  </Suspense>
);

function App() {
  const initAuth = useAuthStore((state) => state.initAuth);
  const loadRate = useCurrencyStore((s) => s.loadRate);
  const location = useLocation();

  useEffect(() => {
    initAuth(); // Cargar auth del localStorage al iniciar
    loadRate(); // Cargar tasa de cambio USD -> Bs
  }, [initAuth, loadRate]);

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        {/* Ruta pública */}
        <Route
          path="/login"
          element={
            <motion.div {...pageTransition}>
              <LoginPage />
            </motion.div>
          }
        />

        {/* Rutas protegidas */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          {pageRoutes.map(({ path, Component }) => (
            <Route key={path} path={path} element={<AsyncPage Component={Component} />} />
          ))}
        </Route>

        {/* Ruta 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

export default App;
