import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Users, Truck, Package, ShoppingCart, ShoppingBag,
  Warehouse, FileText, Receipt, UserCog, Calculator, BarChart3,
  Bell, Settings, LogOut, ChevronLeft, ChevronRight,
  Shield, CreditCard,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { notificationsApi } from '../../api';
import logo from '../../assets/logo.png';

const userNavItems = [
  { icon: LayoutDashboard, label: 'Tableau de bord', to: '/dashboard' },
  { icon: Users, label: 'Clients', to: '/clients' },
  { icon: Truck, label: 'Fournisseurs', to: '/suppliers' },
  { icon: Package, label: 'Produits', to: '/products' },
  { icon: ShoppingCart, label: 'Ventes', to: '/sales' },
  { icon: ShoppingBag, label: 'Achats', to: '/purchases' },
  { icon: Warehouse, label: 'Stock', to: '/stock' },
  { icon: FileText, label: 'Devis', to: '/quotes' },
  { icon: Receipt, label: 'Charges', to: '/charges' },
  { icon: UserCog, label: 'RH', to: '/employees' },
  { icon: Calculator, label: 'Comptabilité', to: '/accounting' },
  { icon: BarChart3, label: 'Rapports', to: '/reports' },
];

const adminNavItems = [
  { icon: LayoutDashboard, label: 'Tableau de bord', to: '/dashboard' },
  { icon: Users, label: 'Utilisateurs', to: '/admin/users' },
  { icon: CreditCard, label: 'Abonnements', to: '/admin/subscriptions' },
];

const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();

  const navItems = user?.role === 'admin' ? adminNavItems : userNavItems;

  const { data: unreadData } = useQuery({
    queryKey: ['notifications-unread'],
    queryFn: notificationsApi.getUnreadCount,
    refetchInterval: 30000,
    enabled: user?.role !== 'admin',
  });

  const unreadCount = unreadData?.count || 0;

  return (
      <aside
          className={`relative flex flex-col h-screen bg-white dark:bg-gray-950 border-r border-gray-100 dark:border-gray-800 transition-all duration-300 ${
              collapsed ? 'w-16' : 'w-64'
          }`}
      >
        {/* Logo */}
        <div
            className={`flex items-center gap-3 px-4 py-5 border-b border-gray-100 dark:border-gray-800 ${
                collapsed ? 'justify-center' : ''
            }`}
        >
          <div className="w-10 h-10 flex items-center justify-center flex-shrink-0">
            <img
                src={logo}
                alt="KY-Pro Logo"
                className="w-full h-full object-contain rounded-full"
            />
          </div>

          {!collapsed && (
              <div className="min-w-0">
                <p className="font-bold text-gray-900 dark:text-white text-sm">
                  KY-Pro
                </p>
                <p className="text-xs text-gray-400 truncate max-w-[140px]">
                  {user?.businessName || user?.name}
                </p>
              </div>
          )}
        </div>

        {/* Admin Badge */}
        {!collapsed && user?.role === 'admin' && (
            <div className="mx-3 mt-2 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg flex items-center gap-2">
              <Shield size={14} className="text-amber-600" />
              <span className="text-xs font-medium text-amber-700 dark:text-amber-400">
            Administrateur
          </span>
            </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {navItems.map(({ icon: Icon, label, to }) => (
              <NavLink
                  key={to}
                  to={to}
                  title={collapsed ? label : undefined}
                  className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                          isActive
                              ? 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400'
                              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900 hover:text-gray-900 dark:hover:text-white'
                      }`
                  }
              >
                <Icon size={18} className="flex-shrink-0" />
                {!collapsed && <span>{label}</span>}
              </NavLink>
          ))}
        </nav>

        {/* Bottom */}
        <div className="border-t border-gray-100 dark:border-gray-800 p-2 space-y-0.5">
          {user?.role !== 'admin' && (
              <NavLink
                  to="/notifications"
                  title={collapsed ? 'Notifications' : undefined}
                  className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                          isActive
                              ? 'bg-blue-50 dark:bg-blue-950 text-blue-600'
                              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900'
                      }`
                  }
              >
                <div className="relative flex-shrink-0">
                  <Bell size={18} />
                  {unreadCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
                  )}
                </div>
                {!collapsed && <span>Notifications</span>}
              </NavLink>
          )}

          <NavLink
              to="/settings"
              title={collapsed ? 'Paramètres' : undefined}
              className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive
                          ? 'bg-blue-50 dark:bg-blue-950 text-blue-600'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900'
                  }`
              }
          >
            <Settings size={18} />
            {!collapsed && 'Paramètres'}
          </NavLink>

          <button
              onClick={logout}
              title={collapsed ? 'Déconnexion' : undefined}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all"
          >
            <LogOut size={18} />
            {!collapsed && 'Déconnexion'}
          </button>
        </div>

        {/* Collapse Button */}
        <button
            onClick={() => setCollapsed((p) => !p)}
            className="absolute -right-3 top-20 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-full w-6 h-6 flex items-center justify-center shadow-sm hover:shadow-md transition-shadow z-10"
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </aside>
  );
};

export default Sidebar;