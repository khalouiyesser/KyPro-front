import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../../api';
import { useAuth } from '../../context/AuthContext';
import {
  TrendingUp, ShoppingCart, ShoppingBag, Package, Users, AlertTriangle,
  ArrowUpRight, ArrowDownRight, Clock,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const StatCard: React.FC<{
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ElementType;
  trend?: number;
  color: string;
}> = ({ title, value, subtitle, icon: Icon, trend, color }) => (
  <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{title}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
        {subtitle && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon size={20} className="text-white" />
      </div>
    </div>
    {trend !== undefined && (
      <div className={`flex items-center gap-1 mt-3 text-xs font-medium ${trend >= 0 ? 'text-green-600' : 'text-red-500'}`}>
        {trend >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
        {Math.abs(trend).toFixed(1)}% ce mois
      </div>
    )}
  </div>
);

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('fr-TN', { style: 'currency', currency: 'TND', minimumFractionDigits: 3 }).format(v);

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({ queryKey: ['dashboard'], queryFn: dashboardApi.get });

  const overview = data?.overview || {};
  const monthlySales = (data?.monthlySales || []).map((m: any) => ({
    name: `${m._id.month}/${m._id.year}`,
    revenue: m.revenue,
    count: m.count,
  }));

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {greeting}, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          {format(new Date(), "EEEE d MMMM yyyy", { locale: fr })}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Chiffre d'affaires"
          value={isLoading ? '...' : formatCurrency(overview.totalRevenue || 0)}
          subtitle={`${formatCurrency(overview.monthRevenue || 0)} ce mois`}
          icon={TrendingUp}
          color="bg-blue-600"
        />
        <StatCard
          title="Achats"
          value={isLoading ? '...' : formatCurrency(overview.totalPurchases || 0)}
          subtitle={`${formatCurrency(overview.monthPurchases || 0)} ce mois`}
          icon={ShoppingBag}
          color="bg-violet-600"
        />
        <StatCard
          title="Clients"
          value={isLoading ? '...' : String(overview.totalClients || 0)}
          subtitle={`${overview.activeClients || 0} actifs`}
          icon={Users}
          color="bg-emerald-600"
        />
        <StatCard
          title="Alertes stock"
          value={isLoading ? '...' : String(overview.lowStockCount || 0)}
          subtitle="produits en rupture"
          icon={AlertTriangle}
          color={overview.lowStockCount > 0 ? 'bg-amber-500' : 'bg-gray-400'}
        />
      </div>

      {/* Chart + Top Clients */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Sales Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Évolution des ventes</h2>
          {isLoading ? (
            <div className="h-48 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={monthlySales}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: any) => formatCurrency(v)} />
                <Area type="monotone" dataKey="revenue" stroke="#2563EB" fill="url(#revGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Top Clients */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Top Clients</h2>
          <div className="space-y-3">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-10 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
              ))
            ) : (data?.topClients || []).length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Aucune vente</p>
            ) : (
              (data?.topClients || []).map((c: any, i: number) => (
                <div key={c._id} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-gray-400 w-4">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{c.clientName}</p>
                    <p className="text-xs text-gray-400">{formatCurrency(c.revenue)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Sales */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800">
        <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Ventes récentes</h2>
        <div className="space-y-2">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
            ))
          ) : (data?.recentSales || []).length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Aucune vente récente</p>
          ) : (
            (data?.recentSales || []).map((s: any) => (
              <div key={s._id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <ShoppingCart size={16} className="text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{s.clientName}</p>
                  <p className="text-xs text-gray-400 flex items-center gap-1">
                    <Clock size={11} />
                    {format(new Date(s.createdAt), 'dd/MM/yyyy HH:mm')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{formatCurrency(s.totalTTC)}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    s.status === 'paid' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                    s.status === 'partial' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  }`}>
                    {s.status === 'paid' ? 'Payé' : s.status === 'partial' ? 'Partiel' : 'En attente'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
