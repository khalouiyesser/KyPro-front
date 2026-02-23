import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi, accountingApi } from '../../api';
import { useI18n } from '../../context/I18nContext';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area,
  PieChart, Pie, Cell,
} from 'recharts';
import {
  TrendingUp, ShoppingCart, Users, Package, AlertTriangle,
  CreditCard, DollarSign, BarChart2, ArrowUpRight, ArrowDownRight, RefreshCw,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const TND = (v: number) => `${(v || 0).toFixed(3)} TND`;

const MONTHS_FR = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
const PIE_COLORS = ['#10B981', '#F59E0B', '#EF4444'];

const STATUS_LABEL: Record<string, string> = {
  paid: 'Payé',
  partial: 'Partiel',
  pending: 'En attente',
};

const STATUS_CLS: Record<string, string> = {
  paid: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400',
  partial: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400',
  pending: 'text-red-500 bg-red-50 dark:bg-red-900/20 dark:text-red-400',
};

// ── KPI Card ─────────────────────────────────────────────────────────────────
const KPICard: React.FC<{
  title: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  iconBg: string;
  trend?: number;
}> = ({ title, value, sub, icon, iconBg, trend }) => (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800 hover:shadow-md transition-all duration-200 active:scale-[0.98]">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{title}</p>
          <p className="text-base sm:text-lg font-bold text-gray-900 dark:text-white leading-tight">{value}</p>
          {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{sub}</p>}
        </div>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
          {icon}
        </div>
      </div>
      {trend !== undefined && (
          <div className={`flex items-center gap-1 mt-3 text-xs font-medium ${trend >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            {trend >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {Math.abs(trend).toFixed(1)}% vs mois précédent
          </div>
      )}
    </div>
);

// ── Skeleton ─────────────────────────────────────────────────────────────────
const Skeleton: React.FC<{ className?: string }> = ({ className }) => (
    <div className={`bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse ${className}`} />
);

// ── Page ─────────────────────────────────────────────────────────────────────
const DashboardPage: React.FC = () => {
  const { t } = useI18n();
  const [accountingPeriod, setAccountingPeriod] = useState<'month' | 'year'>('month');

  const { data: dash, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => dashboardApi.get(),
    refetchInterval: 60_000,
  });

  const now = new Date();
  const startMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const endMonth = now.toISOString().split('T')[0];
  const startYear = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];

  const { data: accounting } = useQuery({
    queryKey: ['accounting-summary', accountingPeriod],
    queryFn: () =>
        accountingApi.getSummary({
          startDate: accountingPeriod === 'month' ? startMonth : startYear,
          endDate: endMonth,
        }),
  });

  const chartData = (dash?.monthlyVentes || []).map((m: any) => ({
    name: MONTHS_FR[(m._id?.month || 1) - 1],
    CA: Number((m.revenue || 0).toFixed(3)),
    Ventes: m.count || 0,
  }));

  const recentVentes: any[] = dash?.recentVentes || [];

  const statusData = [
    { name: 'Payé', value: recentVentes.filter((v: any) => v.status === 'paid').length },
    { name: 'Partiel', value: recentVentes.filter((v: any) => v.status === 'partial').length },
    { name: 'En attente', value: recentVentes.filter((v: any) => v.status === 'pending').length },
  ].filter(d => d.value > 0);

  const o = dash?.overview;
  const netProfit: number = (accounting?.profit?.net as number) ?? 0;

  // ── Loading ──
  if (isLoading) return (
      <div className="space-y-4 p-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-9 w-9" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
  );

  return (
      <div className="space-y-4 pb-8 px-4 sm:px-0">

        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-3 pt-2">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              {t('dashboard.title')}
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 capitalize">
              {format(now, 'EEEE dd MMMM yyyy', { locale: fr })}
            </p>
          </div>
          <button
              onClick={() => refetch()}
              disabled={isRefetching}
              className="p-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 flex-shrink-0"
          >
            <RefreshCw size={16} className={isRefetching ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* ── KPI Grid ──
           Mobile  : 1 colonne
           Tablet  : 2 colonnes
           Desktop : 4 colonnes
      */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <KPICard
              title={t('dashboard.totalRevenue')}
              value={TND(o?.totalRevenue || 0)}
              sub={`Encaissé: ${TND(o?.totalRevenuePaid || 0)}`}
              icon={<TrendingUp size={20} className="text-blue-600" />}
              iconBg="bg-blue-50 dark:bg-blue-900/20"
          />
          <KPICard
              title={t('dashboard.monthRevenue')}
              value={TND(o?.monthRevenue || 0)}
              sub={`Encaissé: ${TND(o?.monthRevenuePaid || 0)}`}
              icon={<DollarSign size={20} className="text-emerald-600" />}
              iconBg="bg-emerald-50 dark:bg-emerald-900/20"
          />
          <KPICard
              title={t('dashboard.totalPurchases')}
              value={TND(o?.totalPurchases || 0)}
              sub={`Ce mois: ${TND(o?.monthPurchases || 0)}`}
              icon={<ShoppingCart size={20} className="text-amber-600" />}
              iconBg="bg-amber-50 dark:bg-amber-900/20"
          />
          <KPICard
              title={t('dashboard.netProfit')}
              value={TND((o?.monthRevenuePaid || 0) - (o?.monthPurchases || 0))}
              sub="Encaissé - Achats mois"
              icon={<BarChart2 size={20} className="text-purple-600" />}
              iconBg="bg-purple-50 dark:bg-purple-900/20"
          />
          <KPICard
              title={t('dashboard.totalClients')}
              value={String(o?.totalClients || 0)}
              sub={`${o?.activeClients || 0} actifs`}
              icon={<Users size={20} className="text-indigo-600" />}
              iconBg="bg-indigo-50 dark:bg-indigo-900/20"
          />
          <KPICard
              title={t('dashboard.totalProducts')}
              value={String(o?.totalProducts || 0)}
              sub={o?.lowStockCount > 0 ? `⚠️ ${o.lowStockCount} en stock faible` : 'Stocks OK'}
              icon={<Package size={20} className="text-teal-600" />}
              iconBg="bg-teal-50 dark:bg-teal-900/20"
          />
          <KPICard
              title="TVA à payer"
              value={TND(accounting?.tva?.toPay || 0)}
              sub={`Collectée: ${TND(accounting?.tva?.collected || 0)}`}
              icon={<CreditCard size={20} className="text-rose-600" />}
              iconBg="bg-rose-50 dark:bg-rose-900/20"
          />
          <KPICard
              title="Créances clients"
              value={TND(accounting?.revenue?.outstanding || 0)}
              sub="Non encore encaissé"
              icon={<AlertTriangle size={20} className="text-orange-600" />}
              iconBg="bg-orange-50 dark:bg-orange-900/20"
          />
        </div>

        {/* ── Graphique CA — pleine largeur sur mobile ── */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
            📈 Évolution du CA (6 mois)
          </h3>
          {chartData.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-gray-400 text-sm">Pas encore de données</div>
          ) : (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCA" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} width={55} />
                  <Tooltip
                      formatter={(v: any) => [`${Number(v).toFixed(3)} TND`, 'CA']}
                      contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  />
                  <Area type="monotone" dataKey="CA" stroke="#3B82F6" strokeWidth={2} fill="url(#colorCA)" />
                </AreaChart>
              </ResponsiveContainer>
          )}
        </div>

        {/* ── Statut ventes — pleine largeur sur mobile ── */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">🎯 Statut des ventes</h3>
          {statusData.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-gray-400 text-sm">Aucune vente</div>
          ) : (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value">
                      {statusData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i] ?? '#6B7280'} />)}
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-4 mt-2">
                  {statusData.map((d, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[i] }} />
                        {d.name} ({d.value})
                      </div>
                  ))}
                </div>
              </>
          )}
        </div>

        {/* ── Résumé comptable ── */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between mb-4 gap-2">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">💼 Résumé comptable</h3>
            <div className="flex gap-1">
              {(['month', 'year'] as const).map(p => (
                  <button
                      key={p}
                      onClick={() => setAccountingPeriod(p)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                          accountingPeriod === p
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                      }`}
                  >
                    {p === 'month' ? 'Mois' : 'Année'}
                  </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'CA HT', value: accounting?.revenue?.totalHT as number | undefined, color: 'text-blue-600' },
              { label: 'Achats HT', value: accounting?.purchases?.totalHT as number | undefined, color: 'text-amber-600' },
              { label: 'Marge brute', value: accounting?.profit?.gross as number | undefined, color: 'text-emerald-600' },
              { label: 'Bénéfice net', value: netProfit, color: netProfit >= 0 ? 'text-emerald-600' : 'text-red-500' },
            ].map(({ label, value, color }) => (
                <div key={label} className="text-center bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</p>
                  <p className={`text-sm font-bold ${color}`}>{TND(value ?? 0)}</p>
                </div>
            ))}
          </div>
          {accounting?.tva && (
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 grid grid-cols-2 gap-3">
                {[
                  { label: 'TVA collectée', value: accounting.tva.collected, color: 'text-gray-700 dark:text-gray-300' },
                  { label: 'TVA déductible', value: accounting.tva.deductible, color: 'text-gray-700 dark:text-gray-300' },
                  { label: 'TVA à payer', value: accounting.tva.toPay, color: accounting.tva.toPay > 0 ? 'text-red-600' : 'text-emerald-600' },
                  { label: 'Crédit TVA', value: accounting.tva.toRefund, color: 'text-emerald-600' },
                ].map(({ label, value, color }) => (
                    <div key={label} className="text-center">
                      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                      <p className={`text-sm font-semibold ${color}`}>{TND(value)}</p>
                    </div>
                ))}
              </div>
          )}
        </div>

        {/* ── Top Clients ── */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">🏆 {t('dashboard.topClients')}</h3>
          {(dash?.topClients || []).length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">Aucun client</p>
          ) : (
              <div className="space-y-2">
                {(dash.topClients as any[]).map((c: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 active:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ${
                      i === 0 ? 'bg-yellow-500' : i === 1 ? 'bg-gray-400' : i === 2 ? 'bg-amber-700' : 'bg-blue-500'
                  }`}>{i + 1}</span>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">{c.clientName}</span>
                      </div>
                      <span className="text-sm font-bold text-blue-600 dark:text-blue-400 flex-shrink-0 ml-2">{TND(c.revenue)}</span>
                    </div>
                ))}
              </div>
          )}
        </div>

        {/* ── Ventes récentes ── */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">🕐 {t('dashboard.recentSales')}</h3>
          {recentVentes.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">Aucune vente</p>
          ) : (
              <div className="space-y-2">
                {recentVentes.slice(0, 5).map((v: any) => (
                    <div key={v._id} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 active:bg-gray-100 transition-colors gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">{v.clientName}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {v.createdAt ? format(new Date(v.createdAt), 'dd/MM/yyyy') : '—'} · {TND(v.totalTTC)}
                        </p>
                      </div>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap flex-shrink-0 ${STATUS_CLS[v.status as string] ?? ''}`}>
                  {STATUS_LABEL[v.status as string] ?? v.status}
                </span>
                    </div>
                ))}
              </div>
          )}
        </div>

      </div>
  );
};

export default DashboardPage;