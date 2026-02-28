import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Users, Truck, Package, ShoppingCart, ShoppingBag,
  Warehouse, FileText, Receipt, UserCog, Calculator, BarChart3,
  Bell, Settings, LogOut, ChevronLeft, ChevronRight,
  Shield, CreditCard, Sun, Moon, Languages, Check,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useQuery } from '@tanstack/react-query';
import { notificationsApi } from '../../api';
import logo from '../../assets/logo.png';
import { Lang, useI18n } from '../../context/I18nContext';

// ── Nav items ────────────────────────────────────────────────────────────────
const userNavItems = [
  { icon: LayoutDashboard, labelKey: 'nav.dashboard',  to: '/dashboard' },
  { icon: Users,           labelKey: 'nav.clients',    to: '/clients' },
  { icon: Truck,           labelKey: 'nav.suppliers',  to: '/suppliers' },
  { icon: Package,         labelKey: 'nav.products',   to: '/products' },
  { icon: ShoppingCart,    labelKey: 'nav.sales',      to: '/sales' },
  { icon: ShoppingBag,     labelKey: 'nav.purchases',  to: '/purchases' },
  { icon: Warehouse,       labelKey: 'nav.stock',      to: '/stock' },
  { icon: FileText,        labelKey: 'nav.quotes',     to: '/quotes' },
  { icon: Receipt,         labelKey: 'nav.charges',    to: '/charges' },
  { icon: UserCog,         labelKey: 'nav.employees',  to: '/employees' },
  { icon: Calculator,      labelKey: 'nav.accounting', to: '/accounting' },
  { icon: BarChart3,       labelKey: 'nav.reports',    to: '/reports' },
];

const adminNavItems = [
  { icon: LayoutDashboard, labelKey: 'nav.dashboard',  to: '/dashboard' },
  { icon: Users,           labelKey: 'nav.clients',    to: '/admin/users' },
  { icon: CreditCard,      labelKey: 'nav.accounting', to: '/admin/subscriptions' },
];

const LANGS: { code: Lang; flag: string; label: string; native: string }[] = [
  { code: 'fr', flag: '🇫🇷', label: 'FR', native: 'Français' },
  { code: 'ar', flag: '🇹🇳', label: 'AR', native: 'العربية' },
  { code: 'en', flag: '🇬🇧', label: 'EN', native: 'English' },
];

const isMobile = () => window.innerWidth < 768;

// ── Component ────────────────────────────────────────────────────────────────
const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(() => isMobile());
  const [langOpen, setLangOpen]   = useState(false);

  const { user, logout }           = useAuth();
  const { isDark, toggleTheme }    = useTheme();          // ✅ vrai ThemeContext
  const { t, lang, setLang }       = useI18n();           // ✅ vrai I18nContext

  const navItems = user?.role === 'admin' ? adminNavItems : userNavItems;

  // Auto-collapse mobile
  useEffect(() => {
    const onResize = () => { if (isMobile()) setCollapsed(true); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Ferme dropdown si collapsed
  useEffect(() => { if (collapsed) setLangOpen(false); }, [collapsed]);

  const { data: unreadData } = useQuery({
    queryKey: ['notifications-unread'],
    queryFn: notificationsApi.getUnreadCount,
    refetchInterval: 30_000,
    enabled: user?.role !== 'admin',
  });
  const unreadCount = unreadData?.count ?? 0;

  const currentLang = LANGS.find(l => l.code === lang) ?? LANGS[0];

  return (
      <aside
          className={`relative flex flex-col h-screen bg-white dark:bg-gray-950 border-r border-gray-100 dark:border-gray-800 transition-all duration-300 flex-shrink-0 ${
              collapsed ? 'w-16' : 'w-64'
          }`}
      >
        {/* ── Logo ── */}
        <div className={`flex items-center gap-3 px-4 py-5 border-b border-gray-100 dark:border-gray-800 ${collapsed ? 'justify-center' : ''}`}>
          <div className="w-9 h-9 flex-shrink-0">
            <img src={logo} alt="KY-Pro" className="w-full h-full object-contain rounded-full" />
          </div>
          {!collapsed && (
              <div className="min-w-0">
                <p className="font-bold text-gray-900 dark:text-white text-sm">KY-Pro</p>
                <p className="text-xs text-gray-400 truncate max-w-[140px]">{user?.businessName || user?.name}</p>
              </div>
          )}
        </div>

        {/* ── Admin Badge ── */}
        {!collapsed && user?.role === 'admin' && (
            <div className="mx-3 mt-2 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg flex items-center gap-2">
              <Shield size={14} className="text-amber-600" />
              <span className="text-xs font-medium text-amber-700 dark:text-amber-400">Administrateur</span>
            </div>
        )}

        {/* ── Navigation ── */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {navItems.map(({ icon: Icon, labelKey, to }) => {
            const label = t(labelKey);
            return (
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
            );
          })}
        </nav>

        {/* ── Bottom ── */}
        <div className="border-t border-gray-100 dark:border-gray-800 p-2 space-y-0.5">

          {/* Notifications */}
          {user?.role !== 'admin' && (
              <NavLink
                  to="/notifications"
                  title={collapsed ? t('nav.notifications') : undefined}
                  className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                          isActive ? 'bg-blue-50 dark:bg-blue-950 text-blue-600' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900'
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
                {!collapsed && <span>{t('nav.notifications')}</span>}
              </NavLink>
          )}

          {/* Settings */}
          <NavLink
              to="/settings"
              title={collapsed ? t('nav.settings') : undefined}
              className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive ? 'bg-blue-50 dark:bg-blue-950 text-blue-600' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900'
                  }`
              }
          >
            <Settings size={18} />
            {!collapsed && <span>{t('nav.settings')}</span>}
          </NavLink>

          {/* ── Divider ── */}
          <div className="h-px bg-gray-100 dark:bg-gray-800 !my-2" />

          {/* ── Theme Toggle ── */}
          <button
              onClick={toggleTheme}
              title={collapsed ? (isDark ? 'Mode clair' : 'Mode sombre') : undefined}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900 transition-all group"
          >
            <div className="flex-shrink-0">
              {isDark
                  ? <Sun size={18} className="text-amber-400 group-hover:rotate-12 transition-transform" />
                  : <Moon size={18} className="text-indigo-500 group-hover:-rotate-12 transition-transform" />
              }
            </div>

            {!collapsed && (
                <div className="flex items-center justify-between flex-1">
                  <span>{isDark ? 'Mode clair' : 'Mode sombre'}</span>
                  {/* Toggle switch */}
                  <div className={`w-9 h-5 rounded-full transition-colors duration-300 relative flex-shrink-0 ${isDark ? 'bg-indigo-500' : 'bg-gray-200 dark:bg-gray-700'}`}>
                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-300 ${isDark ? 'translate-x-4' : 'translate-x-0.5'}`} />
                  </div>
                </div>
            )}
          </button>

          {/* ── Language Selector ── */}
          <div className="relative">
            <button
                onClick={() => {
                  if (collapsed) {
                    // Mode collapsed : cycle direct entre les 3 langues
                    const idx  = LANGS.findIndex(l => l.code === lang);
                    const next = LANGS[(idx + 1) % LANGS.length];
                    setLang(next.code);
                  } else {
                    setLangOpen(o => !o);
                  }
                }}
                title={collapsed ? `${currentLang.flag} ${currentLang.label}` : undefined}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900 transition-all"
            >
              {/* En mode collapsed : affiche le drapeau */}
              {collapsed
                  ? <span className="text-base leading-none">{currentLang.flag}</span>
                  : <Languages size={18} className="flex-shrink-0 text-blue-500" />
              }

              {!collapsed && (
                  <div className="flex items-center justify-between flex-1">
                <span className="flex items-center gap-1.5">
                  <span className="text-base leading-none">{currentLang.flag}</span>
                  <span>{currentLang.native}</span>
                </span>
                    <ChevronRight
                        size={14}
                        className={`text-gray-400 transition-transform duration-200 ${langOpen ? 'rotate-90' : ''}`}
                    />
                  </div>
              )}
            </button>

            {/* Dropdown — seulement en mode expanded */}
            {!collapsed && langOpen && (
                <div className="mx-1 mb-1 overflow-hidden rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 shadow-lg">
                  {LANGS.map(l => (
                      <button
                          key={l.code}
                          onClick={() => { setLang(l.code); setLangOpen(false); }}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-colors ${
                              lang === l.code
                                  ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-medium'
                                  : 'text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800'
                          }`}
                      >
                        <span className="text-base leading-none w-5">{l.flag}</span>
                        <span className="flex-1 text-left">{l.native}</span>
                        <span className="text-xs text-gray-400 dark:text-gray-600">{l.label}</span>
                        {lang === l.code && <Check size={13} className="text-blue-500 flex-shrink-0" />}
                      </button>
                  ))}
                </div>
            )}
          </div>

          {/* ── Divider ── */}
          <div className="h-px bg-gray-100 dark:bg-gray-800 !my-2" />

          {/* Logout */}
          <button
              onClick={logout}
              title={collapsed ? t('nav.logout') : undefined}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all"
          >
            <LogOut size={18} className="flex-shrink-0" />
            {!collapsed && <span>{t('nav.logout')}</span>}
          </button>
        </div>

        {/* ── Collapse button ── */}
        <button
            onClick={() => setCollapsed(p => !p)}
            className="absolute -right-3 top-20 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-full w-6 h-6 flex items-center justify-center shadow-sm hover:shadow-md transition-shadow z-10"
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </aside>
  );
};

export default Sidebar;