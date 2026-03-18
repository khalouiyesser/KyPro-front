import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { I18nProvider } from './context/I18nContext';
import Layout             from './components/layout/Layout';
import LoginPage          from './pages/auth/LoginPage';
import ChangePasswordPage from './pages/auth/ChangePasswordPage';
import ForgotPasswordPage from "./pages/auth/Forgotpasswordpage";

// ── Lazy pages ────────────────────────────────────────────────────────────────
const DashboardPage          = lazy(() => import('./pages/dashboard/DashboardPage'));
const ClientsPage            = lazy(() => import('./pages/clients/ClientsPage'));
const ClientDetailPage       = lazy(() => import('./pages/clients/ClientDetailPage'));
const SuppliersPage          = lazy(() => import('./pages/suppliers/SuppliersPage'));
const SupplierDetailPage     = lazy(() => import('./pages/suppliers/Supplierdetailpage'));
const ProductsPage           = lazy(() => import('./pages/products/ProductsPage'));
const SalesPage              = lazy(() => import('./pages/sales/SalesPage'));
const PurchasesPage          = lazy(() => import('./pages/purchases/PurchasesPage'));
const StockPage              = lazy(() => import('./pages/stock/StockPage'));
const QuotesPage             = lazy(() => import('./pages/quotes/QuotesPage'));
const ChargesPage            = lazy(() => import('./pages/charges/ChargesPage'));
const EmployeesPage          = lazy(() => import('./pages/employees/EmployeesPage'));
const AccountingPage         = lazy(() => import('./pages/accounting/AccountingPage'));
const ReportsPage            = lazy(() => import('./pages/reports/ReportsPage'));
const SettingsPage           = lazy(() => import('./pages/settings/SettingsPage'));
const NotificationsPage      = lazy(() => import('./pages/notifications/NotificationsPage'));
const AdminUsersPage         = lazy(() => import('./pages/admin/AdminUsersPage'));
const AdminSubscriptionsPage = lazy(() => import('./pages/admin/AdminSubscriptionsPage'));
const AdminCompaniesPage     = lazy(() => import('./pages/admin/AdminCompaniesPage'));
const AddCompanyPage         = lazy(() => import('./pages/admin/AddCompanyPage'));
// const DeliveryPage           = lazy(() => import('./pages/delivery/DeliveryPage'));
// const ReturnsPage            = lazy(() => import('./pages/returns/ReturnsPage'));

// ── QueryClient ───────────────────────────────────────────────────────────────
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 1000 * 30 } },
});

// ── Spinner ───────────────────────────────────────────────────────────────────
const Spinner = () => (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
    </div>
);

// ── Route guards ──────────────────────────────────────────────────────────────
const ProtectedRoutes: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="w-8 h-8 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
      </div>
  );
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return (
      <Suspense fallback={<Spinner />}>
        <Layout />
      </Suspense>
  );
};

const SystemAdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  if (user?.role !== 'system_admin') return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

// ── App ───────────────────────────────────────────────────────────────────────
const App: React.FC = () => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <ThemeProvider>
            <I18nProvider>
              <Toaster
                  position="top-right"
                  toastOptions={{
                    className: 'dark:bg-gray-800 dark:text-white text-sm',
                    duration: 3000,
                  }}
              />
              <Routes>

                {/* ── Routes publiques (sans authentification) ── */}
                <Route path="/login"           element={<LoginPage />} />
                <Route path="/change-password" element={<ChangePasswordPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />

                {/* ── Routes protégées ── */}
                <Route path="/" element={<ProtectedRoutes />}>
                  <Route index element={<Navigate to="/dashboard" replace />} />
                  <Route path="dashboard"             element={<DashboardPage />} />
                  <Route path="clients"               element={<ClientsPage />} />
                  <Route path="clients/:clientId"     element={<ClientDetailPage />} />
                  <Route path="suppliers"             element={<SuppliersPage />} />
                  <Route path="suppliers/:supplierId" element={<SupplierDetailPage />} />
                  <Route path="products"              element={<ProductsPage />} />
                  <Route path="sales"                 element={<SalesPage />} />
                  <Route path="purchases"             element={<PurchasesPage />} />
                  <Route path="stock"                 element={<StockPage />} />
                  <Route path="quotes"                element={<QuotesPage />} />
                  <Route path="charges"               element={<ChargesPage />} />
                  <Route path="employees"             element={<EmployeesPage />} />
                  <Route path="accounting"            element={<AccountingPage />} />
                  <Route path="reports"               element={<ReportsPage />} />
                  <Route path="settings"              element={<SettingsPage />} />
                  <Route path="notifications"         element={<NotificationsPage />} />
                  {/*<Route path="delivery"              element={<DeliveryPage />} />*/}
                  {/*<Route path="returns"               element={<ReturnsPage />} />*/}

                  {/* ── System Admin uniquement ── */}
                  <Route path="admin/users"
                         element={<SystemAdminRoute><AdminUsersPage /></SystemAdminRoute>} />
                  <Route path="admin/subscriptions"
                         element={<SystemAdminRoute><AdminSubscriptionsPage /></SystemAdminRoute>} />
                  <Route path="admin/companies"
                         element={<SystemAdminRoute><AdminCompaniesPage /></SystemAdminRoute>} />
                  <Route path="admin/companies/new"
                         element={<SystemAdminRoute><AddCompanyPage /></SystemAdminRoute>} />
                </Route>

                {/* ── Fallback ── */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />

              </Routes>
            </I18nProvider>
          </ThemeProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
);

export default App;