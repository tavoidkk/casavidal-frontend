import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { pageTransition } from './utils/motion';
import { useAuthStore } from '../src/store/auth.store';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ClientsPage from './pages/ClientsPage';
import ProductsPage from './pages/ProductsPage';
import SalesPage from './pages/SalesPage';
import QuotationsPage from './pages/QuotationsPage';
import SpecialOrdersPage from './pages/SpecialOrdersPage';
import SuppliersPage from './pages/SuppliersPage';
import CRMPage from './pages/CRMPage';
import SettingsPage from './pages/SettingsPage';

// Layout
import Layout from './components/layout/Layout';

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

function App() {
  const initAuth = useAuthStore((state) => state.initAuth);
  const location = useLocation();

  useEffect(() => {
    initAuth(); // Cargar auth del localStorage al iniciar
  }, [initAuth]);

  return (
    <AnimatePresence mode="wait">
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
          <Route
            path="dashboard"
            element={
              <motion.div {...pageTransition}>
                <DashboardPage />
              </motion.div>
            }
          />
          <Route
            path="clients"
            element={
              <motion.div {...pageTransition}>
                <ClientsPage />
              </motion.div>
            }
          />
          <Route
            path="products"
            element={
              <motion.div {...pageTransition}>
                <ProductsPage />
              </motion.div>
            }
          />
          <Route
            path="sales"
            element={
              <motion.div {...pageTransition}>
                <SalesPage />
              </motion.div>
            }
          />
          <Route
            path="quotations"
            element={
              <motion.div {...pageTransition}>
                <QuotationsPage />
              </motion.div>
            }
          />
          <Route
            path="crm"
            element={
              <motion.div {...pageTransition}>
                <CRMPage />
              </motion.div>
            }
          />
          <Route
            path="special-orders"
            element={
              <motion.div {...pageTransition}>
                <SpecialOrdersPage />
              </motion.div>
            }
          />
          <Route
            path="suppliers"
            element={
              <motion.div {...pageTransition}>
                <SuppliersPage />
              </motion.div>
            }
          />
          <Route
            path="settings"
            element={
              <motion.div {...pageTransition}>
                <SettingsPage />
              </motion.div>
            }
          />
        </Route>

        {/* Ruta 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

export default App;
