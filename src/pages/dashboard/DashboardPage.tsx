import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi, accountingApi } from '../../api';
import { useI18n } from '../../context/I18nContext';
import {
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    AreaChart, Area, PieChart, Pie, Cell,
} from 'recharts';
import {
    TrendingUp, ShoppingCart, Users, Package, AlertTriangle,
    CreditCard, DollarSign, BarChart2, ArrowUpRight, ArrowDownRight, RefreshCw,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const TND = (v: number) => `${(v || 0).toFixed(3)} TND`;

const MONTHS_FR = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
const PIE_COLORS = ['#10B981', '#F59E0B', '#EF4444'];

const STATUS_LABEL: Record<string, string> = {
    paid: 'Payé', partial: 'Partiel', pending: 'En attente',
};
const STATUS_CLS: Record<string, string> = {
    paid:    'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400',
    partial: 'text-amber-600  bg-amber-50  dark:bg-amber-900/20  dark:text-amber-400',
    pending: 'text-red-500    bg-red-50    dark:bg-red-900/20    dark:text-red-400',
};

// ── KPI Card — ligne horizontale compacte ────────────────────────────────────
const KPICard: React.FC<{
    title: string;
    value: string;
    sub?: string;
    icon: React.ReactNode;
    iconBg: string;
    trend?: number;
}> = ({ title, value, sub, icon, iconBg, trend }) => (
    <div className="bg-white dark:bg-gray-900 rounded-xl px-4 py-3 border border-gray-100 dark:border-gray-800 flex items-center gap-3">
        {/* Icône à gauche */}
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
            {icon}
        </div>
        {/* Texte au centre */}
        <div className="flex-1 min-w-0">
            <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-tight">{title}</p>
            <p className="text-base font-bold text-gray-900 dark:text-white leading-tight mt-0.5">{value}</p>
            {sub && <p className="text-[11px] text-gray-400 dark:text-gray-500 leading-tight mt-0.5">{sub}</p>}
        </div>
        {/* Trend à droite si dispo */}
        {trend !== undefined && (
            <div className={`flex items-center gap-0.5 text-[11px] font-semibold flex-shrink-0 ${trend >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {trend >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                {Math.abs(trend).toFixed(1)}%
            </div>
        )}
    </div>
);

const Skeleton: React.FC<{ className?: string }> = ({ className }) => (
    <div className={`bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse ${className}`} />
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
    const endMonth   = now.toISOString().split('T')[0];
    const startYear  = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];

    const { data: accounting } = useQuery({
        queryKey: ['accounting-summary', accountingPeriod],
        queryFn: () => accountingApi.getSummary({
            startDate: accountingPeriod === 'month' ? startMonth : startYear,
            endDate: endMonth,
        }),
    });

    const chartData = (dash?.monthlyVentes || []).map((m: any) => ({
        name: MONTHS_FR[(m._id?.month || 1) - 1],
        CA: Number((m.revenue || 0).toFixed(3)),
    }));

    const recentVentes: any[] = dash?.recentVentes || [];

    const statusData = [
        { name: 'Payé',       value: recentVentes.filter((v) => v.status === 'paid').length },
        { name: 'Partiel',    value: recentVentes.filter((v) => v.status === 'partial').length },
        { name: 'En attente', value: recentVentes.filter((v) => v.status === 'pending').length },
    ].filter(d => d.value > 0);

    const o = dash?.overview;
    const netProfit: number = (accounting?.profit?.net as number) ?? 0;

    // ── Skeleton ──
    if (isLoading) return (
        <div className="px-3 py-4 space-y-2">
            <Skeleton className="h-8 w-40" />
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
            <Skeleton className="h-48" />
        </div>
    );

    return (
        // px-3 sur mobile = 12px de chaque côté, très serré et propre
        <div className="px-3 sm:px-4 py-4 space-y-3 pb-8">

            {/* ── Header ── */}
            <div className="flex items-center justify-between gap-2">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t('dashboard.title')}</h1>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 capitalize mt-0.5">
                        {format(now, 'EEEE dd MMMM yyyy', { locale: fr })}
                    </p>
                </div>
                <button
                    onClick={() => refetch()}
                    disabled={isRefetching}
                    className="p-2 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 transition-colors flex-shrink-0"
                >
                    <RefreshCw size={16} className={isRefetching ? 'animate-spin' : ''} />
                </button>
            </div>

            {/* ── KPI Cards — 1 colonne sur mobile, 2 sur sm, 4 sur lg ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                <KPICard
                    title={t('dashboard.totalRevenue')}
                    value={TND(o?.totalRevenue || 0)}
                    sub={`Encaissé: ${TND(o?.totalRevenuePaid || 0)}`}
                    icon={<TrendingUp size={18} className="text-blue-600" />}
                    iconBg="bg-blue-50 dark:bg-blue-900/20"
                />
                <KPICard
                    title={t('dashboard.monthRevenue')}
                    value={TND(o?.monthRevenue || 0)}
                    sub={`Encaissé: ${TND(o?.monthRevenuePaid || 0)}`}
                    icon={<DollarSign size={18} className="text-emerald-600" />}
                    iconBg="bg-emerald-50 dark:bg-emerald-900/20"
                />
                <KPICard
                    title={t('dashboard.totalPurchases')}
                    value={TND(o?.totalPurchases || 0)}
                    sub={`Ce mois: ${TND(o?.monthPurchases || 0)}`}
                    icon={<ShoppingCart size={18} className="text-amber-600" />}
                    iconBg="bg-amber-50 dark:bg-amber-900/20"
                />
                <KPICard
                    title={t('dashboard.netProfit')}
                    value={TND((o?.monthRevenuePaid || 0) - (o?.monthPurchases || 0))}
                    sub="Encaissé - Achats"
                    icon={<BarChart2 size={18} className="text-purple-600" />}
                    iconBg="bg-purple-50 dark:bg-purple-900/20"
                />
                <KPICard
                    title={t('dashboard.totalClients')}
                    value={String(o?.totalClients || 0)}
                    sub={`${o?.activeClients || 0} actifs`}
                    icon={<Users size={18} className="text-indigo-600" />}
                    iconBg="bg-indigo-50 dark:bg-indigo-900/20"
                />
                <KPICard
                    title={t('dashboard.totalProducts')}
                    value={String(o?.totalProducts || 0)}
                    sub={o?.lowStockCount > 0 ? `⚠️ ${o.lowStockCount} stock faible` : 'Stocks OK'}
                    icon={<Package size={18} className="text-teal-600" />}
                    iconBg="bg-teal-50 dark:bg-teal-900/20"
                />
                <KPICard
                    title="TVA à payer"
                    value={TND(accounting?.tva?.toPay || 0)}
                    sub={`Collectée: ${TND(accounting?.tva?.collected || 0)}`}
                    icon={<CreditCard size={18} className="text-rose-600" />}
                    iconBg="bg-rose-50 dark:bg-rose-900/20"
                />
                <KPICard
                    title="Créances clients"
                    value={TND(accounting?.revenue?.outstanding || 0)}
                    sub="Non encaissé"
                    icon={<AlertTriangle size={18} className="text-orange-600" />}
                    iconBg="bg-orange-50 dark:bg-orange-900/20"
                />
            </div>

            {/* ── Graphique CA ── */}
            <div className="bg-white dark:bg-gray-900 rounded-xl p-3 border border-gray-100 dark:border-gray-800">
                <h3 className="text-xs font-semibold text-gray-900 dark:text-white mb-3">
                    📈 Évolution du CA (6 mois)
                </h3>
                {chartData.length === 0 ? (
                    <div className="h-36 flex items-center justify-center text-xs text-gray-400">
                        Pas encore de données
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={170}>
                        <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                            <defs>
                                <linearGradient id="gradCA" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%"  stopColor="#3B82F6" stopOpacity={0.18} />
                                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                            <YAxis tick={{ fontSize: 10 }} />
                            <Tooltip
                                formatter={(v: any) => [`${Number(v).toFixed(3)} TND`, 'CA']}
                                contentStyle={{ fontSize: 11, borderRadius: 8 }}
                            />
                            <Area type="monotone" dataKey="CA" stroke="#3B82F6" strokeWidth={2} fill="url(#gradCA)" />
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </div>

            {/* ── Statut des ventes ── */}
            {statusData.length > 0 && (
                <div className="bg-white dark:bg-gray-900 rounded-xl p-3 border border-gray-100 dark:border-gray-800">
                    <h3 className="text-xs font-semibold text-gray-900 dark:text-white mb-3">🎯 Statut des ventes</h3>
                    <div className="flex items-center gap-3">
                        <ResponsiveContainer width={120} height={120}>
                            <PieChart>
                                <Pie data={statusData} cx="50%" cy="50%" innerRadius={32} outerRadius={52} dataKey="value">
                                    {statusData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i] ?? '#6B7280'} />)}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="flex flex-col gap-2 flex-1">
                            {statusData.map((d, i) => (
                                <div key={i} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: PIE_COLORS[i] }} />
                                        <span className="text-xs text-gray-600 dark:text-gray-400">{d.name}</span>
                                    </div>
                                    <span className="text-xs font-semibold text-gray-900 dark:text-white">{d.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Résumé comptable ── */}
            <div className="bg-white dark:bg-gray-900 rounded-xl p-3 border border-gray-100 dark:border-gray-800">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-semibold text-gray-900 dark:text-white">💼 Résumé comptable</h3>
                    <div className="flex gap-1">
                        {(['month', 'year'] as const).map(p => (
                            <button
                                key={p}
                                onClick={() => setAccountingPeriod(p)}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
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

                {/* Grille 2×2 */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                    {[
                        { label: 'CA HT',       value: accounting?.revenue?.totalHT,   color: 'text-blue-600' },
                        { label: 'Achats HT',   value: accounting?.purchases?.totalHT, color: 'text-amber-600' },
                        { label: 'Marge brute', value: accounting?.profit?.gross,       color: 'text-emerald-600' },
                        { label: 'Bén. net',    value: netProfit,                       color: netProfit >= 0 ? 'text-emerald-600' : 'text-red-500' },
                    ].map(({ label, value, color }) => (
                        <div key={label} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2.5 text-center">
                            <p className="text-[11px] text-gray-500 dark:text-gray-400">{label}</p>
                            <p className={`text-sm font-bold mt-0.5 ${color}`}>{TND(value ?? 0)}</p>
                        </div>
                    ))}
                </div>

                {/* TVA */}
                {accounting?.tva && (
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                        {[
                            { label: 'TVA collectée',  value: accounting.tva.collected, color: 'text-gray-700 dark:text-gray-300' },
                            { label: 'TVA déductible', value: accounting.tva.deductible, color: 'text-gray-700 dark:text-gray-300' },
                            { label: 'TVA à payer',    value: accounting.tva.toPay,     color: accounting.tva.toPay > 0 ? 'text-red-600' : 'text-emerald-600' },
                            { label: 'Crédit TVA',     value: accounting.tva.toRefund,  color: 'text-emerald-600' },
                        ].map(({ label, value, color }) => (
                            <div key={label} className="text-center py-1">
                                <p className="text-[10px] text-gray-400">{label}</p>
                                <p className={`text-xs font-semibold mt-0.5 ${color}`}>{TND(value)}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Top Clients ── */}
            <div className="bg-white dark:bg-gray-900 rounded-xl p-3 border border-gray-100 dark:border-gray-800">
                <h3 className="text-xs font-semibold text-gray-900 dark:text-white mb-3">
                    🏆 {t('dashboard.topClients')}
                </h3>
                {(dash?.topClients || []).length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-4">Aucun client</p>
                ) : (
                    <div className="space-y-1">
                        {(dash.topClients as any[]).map((c: any, i: number) => (
                            <div key={i} className="flex items-center gap-3 py-2 px-1">
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0 ${
                    i === 0 ? 'bg-yellow-500' : i === 1 ? 'bg-gray-400' : i === 2 ? 'bg-amber-700' : 'bg-blue-500'
                }`}>{i + 1}</span>
                                <span className="flex-1 text-sm text-gray-700 dark:text-gray-300 truncate">{c.clientName}</span>
                                <span className="text-sm font-bold text-blue-600 dark:text-blue-400 flex-shrink-0">{TND(c.revenue)}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Ventes récentes ── */}
            <div className="bg-white dark:bg-gray-900 rounded-xl p-3 border border-gray-100 dark:border-gray-800">
                <h3 className="text-xs font-semibold text-gray-900 dark:text-white mb-3">
                    🕐 {t('dashboard.recentSales')}
                </h3>
                {recentVentes.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-4">Aucune vente</p>
                ) : (
                    <div className="space-y-1">
                        {recentVentes.slice(0, 5).map((v: any) => (
                            <div key={v._id} className="flex items-center gap-3 py-2 px-1">
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">{v.clientName}</p>
                                    <p className="text-[11px] text-gray-400 mt-0.5">
                                        {v.createdAt ? format(new Date(v.createdAt), 'dd/MM/yy') : '—'} · {TND(v.totalTTC)}
                                    </p>
                                </div>
                                <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium whitespace-nowrap flex-shrink-0 ${STATUS_CLS[v.status] ?? ''}`}>
                  {STATUS_LABEL[v.status] ?? v.status}
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