/*
  DashboardPage.tsx
  • Fix 1 : overflow-x-hidden sur le container → plus de débordement sur la sidebar
  • Fix 2 : textes français hardcodés → plus de "dashboard.xxx" affiché brut
  • Mobile  → 1 colonne (grid-cols-1)
  • Tablet+ → 2 / 4 colonnes
  • Font    → Nunito via tailwind.config + index.html (voir commentaire ci-bas)
  • Mode    → Light / Dark (classe `dark` sur <html>)

  index.html :
  <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">

  tailwind.config.js :
  theme: { extend: { fontFamily: { sans: ['Nunito','sans-serif'] } } }
*/

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi, accountingApi } from '../../api';
import { useI18n } from '../../context/I18nContext';
import {
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar,
    Legend, ComposedChart, Line,
} from 'recharts';
import {
    TrendingUp, ShoppingCart, Users, Package, AlertTriangle,
    CreditCard, DollarSign, BarChart2, ArrowUpRight, ArrowDownRight,
    RefreshCw, Star, Zap, Activity, Target, Award, Calendar,
    PieChart as PieIcon,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';


// ── Helpers ───────────────────────────────────────────────────────────────────
const TND   = (v: number) => `${(v || 0).toFixed(3)}`;
const TND_F = (v: number) => `${(v || 0).toFixed(3)} TND`;

const MONTHS_FR  = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
const PIE_COLORS = ['#06B6D4','#F59E0B','#EF4444','#8B5CF6','#10B981'];

const STATUS_LABEL: Record<string, string> = {
    paid: 'Payé', partial: 'Partiel', pending: 'En attente',
};
const STATUS_CLS: Record<string, string> = {
    paid:    'text-cyan-600 bg-cyan-50 border border-cyan-200 dark:text-cyan-400 dark:bg-cyan-500/10 dark:border-cyan-500/20',
    partial: 'text-amber-600 bg-amber-50 border border-amber-200 dark:text-amber-400 dark:bg-amber-500/10 dark:border-amber-500/20',
    pending: 'text-red-600 bg-red-50 border border-red-200 dark:text-red-400 dark:bg-red-500/10 dark:border-red-500/20',
};
const STATUS_BAR: Record<string, string> = {
    paid: 'bg-cyan-500', partial: 'bg-amber-500', pending: 'bg-red-500',
};

// ── Count-up ──────────────────────────────────────────────────────────────────
const useCountUp = (target: number, ms = 1100) => {
    const [v, setV] = useState(0);
    useEffect(() => {
        if (!target) { setV(0); return; }
        let cur = 0;
        const step = target / (ms / 16);
        const id = setInterval(() => {
            cur += step;
            if (cur >= target) { setV(target); clearInterval(id); }
            else setV(cur);
        }, 16);
        return () => clearInterval(id);
    }, [target]);
    return v;
};

// ── Sparkline SVG ─────────────────────────────────────────────────────────────
const Spark: React.FC<{ data: number[]; color: string }> = ({ data, color }) => {
    if (!data?.length || data.length < 2) return null;
    const mx = Math.max(...data), mn = Math.min(...data), rng = mx - mn || 1;
    const W = 60, H = 26;
    const pts = data.map((v, i) =>
        `${(i / (data.length - 1)) * W},${H - ((v - mn) / rng) * (H - 4)}`
    ).join(' ');
    const lx = W;
    const ly = H - ((data[data.length - 1] - mn) / rng) * (H - 4);
    return (
        <svg width={W} height={H}>
            <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5"
                      strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
            <circle cx={lx} cy={ly} r="2.5" fill={color} />
        </svg>
    );
};

// ── Chart Tooltip ─────────────────────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white dark:bg-[#0F1729] border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 shadow-2xl">
            <p className="text-[10px] text-gray-500 dark:text-slate-400 mb-1 font-semibold">{label}</p>
            {payload.map((p: any, i: number) => (
                <p key={i} className="text-xs font-bold" style={{ color: p.color }}>
                    {p.name}: {Number(p.value).toFixed(3)} TND
                </p>
            ))}
        </div>
    );
};

// ── Gauge demi-cercle SVG ─────────────────────────────────────────────────────
const Gauge: React.FC<{ pct: number; color: string; label: string }> = ({ pct, color, label }) => {
    const r = 28, cx = 36, cy = 36, circ = Math.PI * r;
    const offset = circ * (1 - Math.min(1, Math.max(0, pct) / 100));
    return (
        <div className="flex flex-col items-center">
            <svg width="72" height="44" viewBox="0 0 72 44">
                <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
                      fill="none" stroke="#E5E7EB" strokeWidth="5" strokeLinecap="round" />
                <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
                      fill="none" stroke={color} strokeWidth="5" strokeLinecap="round"
                      strokeDasharray={circ} strokeDashoffset={offset}
                      style={{ transition: 'stroke-dashoffset 1.3s ease' }} />
                <text x={cx} y={cy - 2} textAnchor="middle" fontSize="11" fontWeight="800"
                      fill="currentColor" className="fill-gray-800 dark:fill-white">
                    {Math.round(Math.max(0, pct))}%
                </text>
            </svg>
            <span className="text-[9px] text-gray-400 dark:text-slate-500 uppercase tracking-wider text-center leading-tight mt-0.5 font-bold">
                {label}
            </span>
        </div>
    );
};

// ── Progress bar ──────────────────────────────────────────────────────────────
const ProgBar: React.FC<{ value: number; max: number; color: string }> = ({ value, max, color }) => (
    <div className="w-full h-1.5 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-1000"
             style={{ width: `${max > 0 ? Math.min(100, (value / max) * 100) : 0}%`, background: color }} />
    </div>
);

// ── KPI Card ──────────────────────────────────────────────────────────────────
const KPICard: React.FC<{
    title: string; value: number; sub?: string;
    icon: React.ReactNode; gradFrom: string; gradTo: string; accentColor: string;
    trend?: number | null; sparkData?: number[]; isCount?: boolean;
}> = ({ title, value, sub, icon, gradFrom, gradTo, accentColor, trend, sparkData, isCount }) => {
    const anim    = useCountUp(value);
    const display = isCount ? Math.round(anim).toString() : TND(anim);
    return (
        <div className="relative bg-white dark:bg-[#0B1628] border border-gray-100 dark:border-white/[0.06]
            rounded-2xl p-4 overflow-hidden hover:shadow-md dark:hover:shadow-[0_0_24px_rgba(0,0,0,0.5)]
            hover:border-gray-200 dark:hover:border-white/10 transition-all duration-300 w-full">
            <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-2xl"
                 style={{ background: `linear-gradient(to right, ${gradFrom}, ${gradTo})` }} />
            <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full blur-2xl opacity-[0.08] pointer-events-none"
                 style={{ background: gradFrom }} />

            <div className="relative flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                    <p className="text-[10px] uppercase tracking-widest text-gray-400 dark:text-slate-500 font-bold leading-tight truncate">
                        {title}
                    </p>
                    <div className="flex items-baseline gap-1 mt-1.5 flex-wrap">
                        <span className="text-2xl font-black text-gray-900 dark:text-white tabular-nums leading-none">
                            {display}
                        </span>
                        {!isCount && <span className="text-[10px] text-gray-400 dark:text-slate-500 font-semibold">TND</span>}
                    </div>
                    {sub && (
                        <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-1 truncate leading-tight font-medium">{sub}</p>
                    )}
                    {trend !== null && trend !== undefined && (
                        <div className={`flex items-center gap-0.5 mt-1.5 text-[10px] font-bold
                            ${trend >= 0 ? 'text-emerald-500 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                            {trend >= 0 ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
                            {Math.abs(trend).toFixed(1)}% vs mois préc.
                        </div>
                    )}
                </div>
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                         style={{ background: `${gradFrom}18` }}>
                        {icon}
                    </div>
                    {sparkData && sparkData.length > 1 && <Spark data={sparkData} color={accentColor} />}
                </div>
            </div>
        </div>
    );
};

// ── Section Header ────────────────────────────────────────────────────────────
const Section: React.FC<{
    icon: React.ReactNode; title: string; sub?: string; right?: React.ReactNode;
}> = ({ icon, title, sub, right }) => (
    <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
        <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-100 dark:border-cyan-500/20
                flex items-center justify-center flex-shrink-0">
                {icon}
            </div>
            <div className="min-w-0">
                <h3 className="text-sm font-extrabold text-gray-900 dark:text-white leading-none truncate">{title}</h3>
                {sub && <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-0.5 font-medium truncate">{sub}</p>}
            </div>
        </div>
        {right && <div className="flex-shrink-0">{right}</div>}
    </div>
);

// ── Panel ─────────────────────────────────────────────────────────────────────
const Panel: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
    <div className={`bg-white dark:bg-[#0B1628] border border-gray-100 dark:border-white/[0.06] rounded-2xl p-4 w-full ${className}`}>
        {children}
    </div>
);

// ── Skeleton ──────────────────────────────────────────────────────────────────
const Skel: React.FC<{ className?: string }> = ({ className }) => (
    <div className={`bg-gray-100 dark:bg-white/[0.04] rounded-2xl animate-pulse ${className}`} />
);

// ── Metric Tile ───────────────────────────────────────────────────────────────
const MetricTile: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => (
    <div className="relative bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06]
        rounded-xl p-3 text-center overflow-hidden w-full">
        <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: color }} />
        <p className="text-[10px] text-gray-400 dark:text-slate-500 uppercase tracking-wide font-bold truncate">{label}</p>
        <p className="text-base font-black mt-1 tabular-nums" style={{ color }}>{TND(value ?? 0)}</p>
        <p className="text-[9px] text-gray-300 dark:text-slate-600 mt-0.5 font-medium">TND</p>
    </div>
);

// ══════════════════════════════════════════════════════════════════════════════
// PAGE
// ══════════════════════════════════════════════════════════════════════════════
const DashboardPage: React.FC = () => {
    const { t } = useI18n();
    const [period, setPeriod] = useState<'month' | 'year'>('month');

    const { data: dash, isLoading, refetch, isRefetching } = useQuery({
        queryKey: ['dashboard'],
        queryFn: () => dashboardApi.get(),
        refetchInterval: 60_000,
    });

    const now        = new Date();
    const startMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const endMonth   = now.toISOString().split('T')[0];
    const startYear  = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];

    const { data: accounting } = useQuery({
        queryKey: ['accounting-summary', period],
        queryFn: () => accountingApi.getSummary({
            startDate: period === 'month' ? startMonth : startYear,
            endDate:   endMonth,
        }),
    });

    // ── Mapping réponse API réelle ────────────────────────────────────────────
    // Structure reçue :
    // { revenue, revenueThisMonth, purchases, clients,
    //   lowStockProducts, chargesThisMonth, unreadNotifications,
    //   recentSales, topClients }

    const revenue         = dash?.revenue          || {};   // { total, paid, remaining }
    const revenueMonth    = dash?.revenueThisMonth || {};   // { total, count }
    const purchases       = dash?.purchases        || {};   // { total, debt }
    const clientsData     = dash?.clients          || {};   // { active, total? }
    const recentVentes    = dash?.recentSales      || [];
    const topClients      = dash?.topClients       || [];
    const topProducts     = dash?.topProducts      || [];
    const lowStockProducts = dash?.lowStockProducts || [];

    // KPI valeurs
    const totalRevenue    = revenue.total    || 0;
    const totalRevenuePaid= revenue.paid     || 0;
    const totalDebt       = revenue.remaining|| 0;
    const monthRevenue    = revenueMonth.total || 0;
    const monthSalesCount = revenueMonth.count || 0;
    const totalPurchases  = purchases.total  || 0;
    const purchasesDebt   = purchases.debt   || 0;
    const activeClients   = clientsData.active || 0;
    const totalClients    = clientsData.total  || activeClients;
    const chargesMonth    = dash?.chargesThisMonth || 0;
    const unreadNotif     = dash?.unreadNotifications || 0;

    // Bénéfice net approx = CA mois - achats - charges
    const netProfit       = monthRevenue - totalPurchases - chargesMonth;

    // TVA (depuis accounting si disponible)
    const tva             = dash?.tva || accounting?.tva || {};

    // Taux de performance
    const collectionRate  = totalRevenue > 0 ? (totalRevenuePaid / totalRevenue) * 100 : 0;
    const marginRate      = monthRevenue > 0 ? (netProfit / monthRevenue) * 100 : 0;
    const debtRate        = totalRevenue > 0 ? (totalDebt / totalRevenue) * 100 : 0;

    // Spark CA (si données mensuelles disponibles, sinon vide)
    const sparkCA         = (dash?.monthlyVentes || []).map((m: any) => m.revenue || 0);
    const maxClientRev    = topClients[0]?.total ?? topClients[0]?.revenue ?? 1;

    // ── Chart data ────────────────────────────────────────────────────────────
    // Graphique mensuel (si le backend envoie monthlyVentes un jour)
    const monthlyData = (dash?.monthlyVentes || []).map((m: any) => {
        const pur = (dash?.monthlyPurchases || []).find((p: any) =>
            p._id?.month === m._id?.month && p._id?.year === m._id?.year);
        const chg = (dash?.monthlyCharges || []).find((c: any) =>
            c._id?.month === m._id?.month && c._id?.year === m._id?.year);
        return {
            name:    MONTHS_FR[(m._id?.month || 1) - 1],
            CA:      +(m.revenue     || 0).toFixed(3),
            Achats:  +(pur?.total    || 0).toFixed(3),
            Charges: +(chg?.total    || 0).toFixed(3),
            Profit:  +((m.revenue || 0) - (pur?.total || 0) - (chg?.total || 0)).toFixed(3),
        };
    });

    // Fallback : 1 point avec les données actuelles si pas de série mensuelle
    const chartData = monthlyData.length > 0 ? monthlyData : [
        {
            name: MONTHS_FR[new Date().getMonth()],
            CA:      +totalRevenue.toFixed(3),
            Achats:  +totalPurchases.toFixed(3),
            Charges: +chargesMonth.toFixed(3),
            Profit:  +netProfit.toFixed(3),
        },
    ];

    // Ventes journalières
    const dailyData = (dash?.dailySalesThisMonth || []).map((d: any) => ({
        day: `J${d._id?.day}`,
        CA:  +(d.revenue || 0).toFixed(3),
    }));

    // Distribution statuts depuis recentSales (calculée côté client si pas dispo)
    const rawStatusDist = dash?.ventesStatusDist || (() => {
        const counts: Record<string, { count: number; total: number }> = {};
        recentVentes.forEach((v: any) => {
            const s = v.status || 'pending';
            if (!counts[s]) counts[s] = { count: 0, total: 0 };
            counts[s].count += 1;
            counts[s].total += v.totalTTC || 0;
        });
        return Object.entries(counts).map(([id, d]) => ({ _id: id, ...d }));
    })();

    const statusDist = rawStatusDist.map((s: any) => ({
        name: STATUS_LABEL[s._id] ?? s._id, value: s.count, total: s.total,
    }));

    // Distribution méthodes paiement
    const rawPaymentDist = dash?.paymentMethodDist || (() => {
        const counts: Record<string, { count: number; total: number }> = {};
        recentVentes.forEach((v: any) => {
            const m = v.paymentMethod || 'autre';
            if (!counts[m]) counts[m] = { count: 0, total: 0 };
            counts[m].count += 1;
            counts[m].total += v.totalTTC || 0;
        });
        return Object.entries(counts).map(([id, d]) => ({ _id: id, ...d }));
    })();

    const paymentDist = rawPaymentDist.map((s: any) => ({
        name: s._id || 'Autre', value: s.count, total: s.total,
    }));

    // Comptabilité
    const accCA  = period === 'month' ? (dash?.revenueThisMonth?.totalHT  ?? accounting?.revenue?.totalHT  ?? monthRevenue)  : (accounting?.revenue?.totalHT  ?? totalRevenue);
    const accPur = period === 'month' ? (accounting?.purchases?.totalHT   ?? totalPurchases)  : (accounting?.purchases?.totalHT ?? totalPurchases);
    const accChg = period === 'month' ? chargesMonth : (accounting?.charges?.total ?? chargesMonth);
    const accNet = period === 'month' ? netProfit    : (accounting?.profit?.net    ?? netProfit);

    // ── Skeleton ──────────────────────────────────────────────────────────────
    if (isLoading) return (
        <div className="w-full overflow-x-hidden bg-gray-50 dark:bg-[#060E1F] min-h-screen px-3 py-4 space-y-3">
            <Skel className="h-10 w-52" />
            <div className="flex flex-col gap-2.5">
                {[...Array(4)].map((_, i) => <Skel key={i} className="h-24" />)}
            </div>
            <Skel className="h-48" />
            <Skel className="h-48" />
        </div>
    );

    // ────────────────────────────────────────────────────────────────────────
    // RENDER
    // ────────────────────────────────────────────────────────────────────────
    return (
        /* ── FIX OVERFLOW : w-full + overflow-x-hidden empêche le débordement sur la sidebar ── */
        <div className="w-full overflow-x-hidden bg-gray-50 dark:bg-[#060E1F] min-h-screen
            px-3 sm:px-5 py-4 pb-12 space-y-4 transition-colors duration-300">

            {/* ── HEADER ──────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between gap-3 w-full">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-cyan-500/20"
                         style={{ background: 'linear-gradient(135deg,#06B6D4,#3B82F6)' }}>
                        <BarChart2 size={17} className="text-white" />
                    </div>
                    <div className="min-w-0">
                        <h1 className="text-base font-black text-gray-900 dark:text-white tracking-tight leading-none truncate">
                            {t('dashboard.title')}
                        </h1>
                        <p className="text-[10px] text-gray-400 dark:text-slate-500 capitalize mt-0.5 font-semibold truncate">
                            {format(now, 'EEEE dd MMMM yyyy', { locale: fr })}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                    <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg
                        bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-black tracking-wider">LIVE</span>
                    </div>
                    {unreadNotif > 0 && (
                        <div className="flex items-center gap-1 px-2 py-1.5 rounded-lg
                            bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20">
                            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-black">
                                {unreadNotif}
                            </span>
                        </div>
                    )}
                    <button
                        onClick={() => refetch()}
                        disabled={isRefetching}
                        className="p-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl
                            text-gray-400 hover:text-gray-700 dark:hover:text-white
                            disabled:opacity-40 transition-all flex-shrink-0">
                        <RefreshCw size={14} className={isRefetching ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* ── KPI GRID : mobile 1 col → sm 2 cols → lg 4 cols ────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 w-full">
                <KPICard
                    title={t('dashboard.totalRevenue')}
                    value={totalRevenue}
                    sub={`${t('dashboard.collected')}: ${TND(totalRevenuePaid)} TND`}
                    icon={<TrendingUp size={15} className="text-cyan-500 dark:text-cyan-400" />}
                    gradFrom="#06B6D4" gradTo="#3B82F6" accentColor="#06B6D4"
                    trend={null}
                    sparkData={sparkCA}
                />
                <KPICard
                    title={t('dashboard.monthRevenue')}
                    value={monthRevenue}
                    sub={`${monthSalesCount} ${t('dashboard.sales')}`}
                    icon={<DollarSign size={15} className="text-emerald-500 dark:text-emerald-400" />}
                    gradFrom="#10B981" gradTo="#14B8A6" accentColor="#10B981"
                    trend={null}
                />
                <KPICard
                    title={t('dashboard.netProfit')}
                    value={Math.abs(netProfit)}
                    sub={netProfit >= 0 ? `✓ ${t('dashboard.positive')}` : `⚠ ${t('dashboard.negative')}`}
                    icon={<Zap size={15} className={netProfit >= 0 ? 'text-yellow-500 dark:text-yellow-400' : 'text-red-500'} />}
                    gradFrom={netProfit >= 0 ? '#F59E0B' : '#EF4444'}
                    gradTo={netProfit >= 0 ? '#EF4444' : '#F43F5E'}
                    accentColor={netProfit >= 0 ? '#F59E0B' : '#EF4444'}
                />
                <KPICard
                    title={t('dashboard.receivables')}
                    value={totalDebt}
                    sub={t('dashboard.notCollected')}
                    icon={<AlertTriangle size={15} className="text-orange-500 dark:text-orange-400" />}
                    gradFrom="#F97316" gradTo="#EF4444" accentColor="#F97316"
                />
                <KPICard
                    title={t('dashboard.totalPurchases')}
                    value={totalPurchases}
                    sub={`${t('dashboard.thisMonth')}: ${TND(totalPurchases)} TND`}
                    icon={<ShoppingCart size={15} className="text-violet-500 dark:text-violet-400" />}
                    gradFrom="#8B5CF6" gradTo="#6366F1" accentColor="#8B5CF6"
                />
                <KPICard
                    title={t('dashboard.totalClients')}
                    value={totalClients}
                    sub={`${activeClients} ${t('dashboard.active')}`}
                    icon={<Users size={15} className="text-blue-500 dark:text-blue-400" />}
                    gradFrom="#3B82F6" gradTo="#6366F1" accentColor="#3B82F6"
                    isCount
                />
                <KPICard
                    title={t('dashboard.vatToPay')}
                    value={tva?.toPay || 0}
                    sub={`${t('dashboard.collected')}: ${TND(tva?.collected || 0)} TND`}
                    icon={<CreditCard size={15} className="text-rose-500 dark:text-rose-400" />}
                    gradFrom="#F43F5E" gradTo="#EC4899" accentColor="#F43F5E"
                />
                <KPICard
                    title={t('dashboard.totalProducts')}
                    value={dash?.totalProducts || 0}
                    sub={lowStockProducts.length > 0
                        ? `⚠️ ${lowStockProducts.length} ${t('dashboard.lowStock')}`
                        : `✓ ${t('dashboard.stockOk')}`}
                    icon={<Package size={15} className="text-teal-500 dark:text-teal-400" />}
                    gradFrom="#14B8A6" gradTo="#06B6D4" accentColor="#14B8A6"
                    isCount
                />
            </div>

            {/* ── GAUGES ──────────────────────────────────────────────────── */}
            <Panel>
                <Section
                    icon={<Target size={13} className="text-cyan-500 dark:text-cyan-400" />}
                    title={t('dashboard.performanceIndicators')}
                    sub={t('dashboard.calculatedThisMonth')}
                />
                <div className="grid grid-cols-3 gap-2">
                    <div className="flex flex-col items-center">
                        <Gauge pct={collectionRate} color="#06B6D4" label={t('dashboard.collectionRate')} />
                        <p className="text-[9px] text-gray-500 dark:text-slate-500 mt-1 text-center font-semibold truncate w-full px-1">
                            {TND_F(totalRevenuePaid)}
                        </p>
                    </div>
                    <div className="flex flex-col items-center">
                        <Gauge pct={Math.max(0, marginRate)} color="#10B981" label={t('dashboard.netMargin')} />
                        <p className="text-[9px] text-gray-500 dark:text-slate-500 mt-1 text-center font-semibold truncate w-full px-1">
                            {TND_F(netProfit)}
                        </p>
                    </div>
                    <div className="flex flex-col items-center">
                        <Gauge pct={debtRate} color="#F59E0B" label={t('dashboard.debtRate')} />
                        <p className="text-[9px] text-gray-500 dark:text-slate-500 mt-1 text-center font-semibold truncate w-full px-1">
                            {TND_F(totalDebt)}
                        </p>
                    </div>
                </div>
            </Panel>

            {/* ── COMBO CHART CA / ACHATS / PROFIT ────────────────────────── */}
            <Panel>
                <Section
                    icon={<Activity size={13} className="text-cyan-500 dark:text-cyan-400" />}
                    title={t('dashboard.revenueVsPurchasesVsProfit')}
                    sub={t('dashboard.last6Months')}
                />
                {monthlyData.length === 0 ? (
                    <div className="h-40 flex items-center justify-center text-xs text-gray-400 dark:text-slate-600 font-semibold">
                        {t('dashboard.noData')}
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={200}>
                        <ComposedChart data={chartData} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
                            <defs>
                                <linearGradient id="gCA" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%"  stopColor="#06B6D4" stopOpacity={0.15} />
                                    <stop offset="95%" stopColor="#06B6D4" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9"
                                           className="dark:[stroke:rgba(255,255,255,0.04)]" />
                            <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                            <YAxis                tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                            <Tooltip content={<ChartTooltip />} />
                            <Legend wrapperStyle={{ fontSize: 10, color: '#94A3B8' }} />
                            <Area  type="monotone" dataKey="CA"     name={t('dashboard.revenue')}    stroke="#06B6D4" strokeWidth={2} fill="url(#gCA)" />
                            <Bar              dataKey="Achats"  name={t('dashboard.purchases')}  fill="#8B5CF6"   opacity={0.75} radius={[3,3,0,0]} />
                            <Line  type="monotone" dataKey="Profit" name={t('dashboard.profit')}     stroke="#10B981" strokeWidth={2} dot={{ r: 3, fill: '#10B981' }} />
                        </ComposedChart>
                    </ResponsiveContainer>
                )}
            </Panel>

            {/* ── STATUT + PAIEMENTS : mobile 1 col, sm+ 2 cols ──────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                {/* Statut */}
                <Panel>
                    <Section icon={<PieIcon size={13} className="text-cyan-500 dark:text-cyan-400" />} title={t('dashboard.salesStatus')} />
                    {statusDist.length === 0 ? (
                        <div className="h-32 flex items-center justify-center text-xs text-gray-400 dark:text-slate-600 font-semibold">
                            {t('dashboard.noData')}
                        </div>
                    ) : (
                        <>
                            <ResponsiveContainer width="100%" height={120}>
                                <PieChart>
                                    <Pie data={statusDist} cx="50%" cy="50%" innerRadius={32} outerRadius={50}
                                         dataKey="value" paddingAngle={3}>
                                        {statusDist.map((_: any, i: number) => (
                                            <Cell key={i} fill={PIE_COLORS[i] ?? '#6B7280'} stroke="transparent" />
                                        ))}
                                    </Pie>
                                    <Tooltip content={({ active, payload }: any) =>
                                        active && payload?.length ? (
                                            <div className="bg-white dark:bg-[#0F1729] border border-gray-200 dark:border-white/10 rounded-lg px-2.5 py-1.5 text-xs shadow-xl font-bold">
                                                <span style={{ color: PIE_COLORS[statusDist.findIndex((s: any) => s.name === payload[0].name)] }}>
                                                    {payload[0].name}: {payload[0].value}
                                                </span>
                                            </div>
                                        ) : null
                                    } />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="space-y-2 mt-1">
                                {statusDist.map((d: any, i: number) => (
                                    <div key={i} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: PIE_COLORS[i] }} />
                                            <span className="text-[11px] text-gray-600 dark:text-slate-400 font-semibold">{d.name}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] text-gray-400 dark:text-slate-500 font-medium">{TND(d.total)} TND</span>
                                            <span className="text-xs font-black text-gray-800 dark:text-white">{d.value}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </Panel>

                {/* Paiements */}
                <Panel>
                    <Section icon={<CreditCard size={13} className="text-cyan-500 dark:text-cyan-400" />} title={t('dashboard.paymentMethods')} />
                    {paymentDist.length === 0 ? (
                        <div className="h-32 flex items-center justify-center text-xs text-gray-400 dark:text-slate-600 font-semibold">
                            {t('dashboard.noData')}
                        </div>
                    ) : (
                        <>
                            <ResponsiveContainer width="100%" height={120}>
                                <PieChart>
                                    <Pie data={paymentDist} cx="50%" cy="50%" innerRadius={32} outerRadius={50}
                                         dataKey="value" paddingAngle={3}>
                                        {paymentDist.map((_: any, i: number) => (
                                            <Cell key={i}
                                                  fill={['#10B981','#3B82F6','#F59E0B','#EF4444'][i] ?? '#6B7280'}
                                                  stroke="transparent" />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="space-y-2 mt-1">
                                {paymentDist.map((d: any, i: number) => (
                                    <div key={i} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full flex-shrink-0"
                                                  style={{ background: ['#10B981','#3B82F6','#F59E0B','#EF4444'][i] ?? '#6B7280' }} />
                                            <span className="text-[11px] text-gray-600 dark:text-slate-400 capitalize font-semibold">{d.name}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] text-gray-400 dark:text-slate-500 font-medium">{TND(d.total)} TND</span>
                                            <span className="text-xs font-black text-gray-800 dark:text-white">{d.value}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </Panel>
            </div>

            {/* ── RÉSUMÉ COMPTABLE ─────────────────────────────────────────── */}
            <Panel>
                <Section
                    icon={<BarChart2 size={13} className="text-cyan-500 dark:text-cyan-400" />}
                    title={t('dashboard.accountingSummary')}
                    right={
                        <div className="flex gap-1">
                            {(['month','year'] as const).map(p => (
                                <button key={p} onClick={() => setPeriod(p)}
                                        className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                                            period === p
                                                ? 'bg-cyan-50 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/30'
                                                : 'bg-gray-50 dark:bg-white/5 text-gray-400 dark:text-slate-500 border border-gray-100 dark:border-white/10'
                                        }`}>
                                    {p === 'month' ? t('dashboard.month') : t('dashboard.year')}
                                </button>
                            ))}
                        </div>
                    }
                />
                {/* tiles : mobile 1 col → sm 2 → lg 4 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 mb-4">
                    <MetricTile label={t('dashboard.revenueHT')}   value={accCA}  color="#06B6D4" />
                    <MetricTile label={t('dashboard.purchasesHT')} value={accPur} color="#8B5CF6" />
                    <MetricTile label={t('dashboard.charges')}     value={accChg} color="#F59E0B" />
                    <MetricTile label={t('dashboard.netBenefit')}  value={accNet} color={accNet >= 0 ? '#10B981' : '#EF4444'} />
                </div>

                {/* TVA : mobile 1 col → sm 2 → lg 4 */}
                <div className="pt-3 border-t border-gray-100 dark:border-white/[0.06]">
                    <p className="text-[10px] text-gray-400 dark:text-slate-500 uppercase tracking-widest font-black mb-2.5">TVA</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                        {[
                            { label: t('dashboard.vatCollected'),  value: tva.collected  || 0, cls: 'text-gray-700 dark:text-slate-300' },
                            { label: t('dashboard.vatDeductible'), value: tva.deductible || 0, cls: 'text-gray-700 dark:text-slate-300' },
                            { label: t('dashboard.vatToPay'),      value: tva.toPay      || 0, cls: (tva.toPay || 0) > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400' },
                            { label: t('dashboard.vatCredit'),     value: tva.toRefund   || 0, cls: 'text-emerald-600 dark:text-emerald-400' },
                        ].map(({ label, value, cls }) => (
                            <div key={label}
                                 className="flex items-center justify-between py-2.5 px-3 bg-gray-50 dark:bg-white/[0.02] rounded-lg
                                    sm:flex-col sm:text-center sm:items-center sm:py-2 sm:px-1">
                                <p className="text-[10px] text-gray-400 dark:text-slate-600 uppercase tracking-wide font-bold">{label}</p>
                                <p className={`text-sm font-black tabular-nums ${cls}`}>{TND(value)} TND</p>
                            </div>
                        ))}
                    </div>
                </div>
            </Panel>

            {/* ── VENTES JOURNALIÈRES ─────────────────────────────────────── */}
            <Panel>
                <Section
                    icon={<Calendar size={13} className="text-cyan-500 dark:text-cyan-400" />}
                    title={t('dashboard.dailySales')}
                    sub={t('dashboard.thisMonth')}
                />
                {dailyData.length === 0 ? (
                    <div className="h-36 flex items-center justify-center text-xs text-gray-400 dark:text-slate-600 font-semibold">
                        {t('dashboard.noData')}
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={150}>
                        <BarChart data={dailyData} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9"
                                           className="dark:[stroke:rgba(255,255,255,0.04)]" />
                            <XAxis dataKey="day" tick={{ fontSize: 9, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                            <YAxis              tick={{ fontSize: 9, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                            <Tooltip content={<ChartTooltip />} />
                            <Bar dataKey="CA" name="CA" fill="#06B6D4" opacity={0.85} radius={[3,3,0,0]} />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </Panel>

            {/* ── ÉVOLUTION FINANCIÈRE 6 MOIS ─────────────────────────────── */}
            <Panel>
                <Section
                    icon={<TrendingUp size={13} className="text-cyan-500 dark:text-cyan-400" />}
                    title={t('dashboard.financialEvolution')}
                    sub={t('dashboard.last6Months')}
                />
                {monthlyData.length === 0 ? (
                    <div className="h-36 flex items-center justify-center text-xs text-gray-400 dark:text-slate-600 font-semibold">
                        {t('dashboard.noData')}
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={170}>
                        <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
                            <defs>
                                {[['gCA2','#06B6D4'],['gAch','#8B5CF6'],['gChg','#F59E0B']].map(([id, color]) => (
                                    <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%"  stopColor={color} stopOpacity={0.18} />
                                        <stop offset="95%" stopColor={color} stopOpacity={0} />
                                    </linearGradient>
                                ))}
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9"
                                           className="dark:[stroke:rgba(255,255,255,0.04)]" />
                            <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                            <YAxis              tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                            <Tooltip content={<ChartTooltip />} />
                            <Legend wrapperStyle={{ fontSize: 10, color: '#94A3B8' }} />
                            <Area type="monotone" dataKey="CA"      name={t('dashboard.revenue')}    stroke="#06B6D4" strokeWidth={2} fill="url(#gCA2)" />
                            <Area type="monotone" dataKey="Achats"  name={t('dashboard.purchases')}  stroke="#8B5CF6" strokeWidth={2} fill="url(#gAch)" />
                            <Area type="monotone" dataKey="Charges" name={t('dashboard.charges')}    stroke="#F59E0B" strokeWidth={2} fill="url(#gChg)" />
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </Panel>

            {/* ── TOP CLIENTS + TOP PRODUITS : mobile 1 col → sm 2 cols ───── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                {/* Top clients */}
                <Panel>
                    <Section
                        icon={<Award size={13} className="text-cyan-500 dark:text-cyan-400" />}
                        title={t('dashboard.topClients')}
                        sub={t('dashboard.byRevenue')}
                    />
                    {topClients.length === 0 ? (
                        <p className="text-xs text-gray-400 dark:text-slate-600 text-center py-6 font-semibold">{t('dashboard.noClients')}</p>
                    ) : (
                        <div className="space-y-3">
                            {topClients.map((c: any, i: number) => {
                                const rev = c.revenue ?? c.total ?? 0;
                                const MEDALS = ['#F59E0B','#94A3B8','#B45309'];
                                const mc = MEDALS[i] ?? '#3B82F6';
                                return (
                                    <div key={i} className="space-y-1.5">
                                        <div className="flex items-center gap-2.5">
                                            <span className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black flex-shrink-0"
                                                  style={{ background: `${mc}1A`, color: mc, border: `1px solid ${mc}40` }}>
                                                {i + 1}
                                            </span>
                                            <span className="flex-1 text-sm font-bold text-gray-800 dark:text-white truncate">
                                                {c.clientName}
                                            </span>
                                            <span className="text-xs font-black flex-shrink-0" style={{ color: mc }}>
                                                {TND_F(rev)}
                                            </span>
                                        </div>
                                        <ProgBar value={rev} max={maxClientRev} color={mc} />
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </Panel>

                {/* Top produits */}
                <Panel>
                    <Section
                        icon={<Star size={13} className="text-cyan-500 dark:text-cyan-400" />}
                        title={t('dashboard.topProducts')}
                        sub={t('dashboard.byRevenue')}
                    />
                    {topProducts.length === 0 ? (
                        <p className="text-xs text-gray-400 dark:text-slate-600 text-center py-6 font-semibold">{t('dashboard.noProducts')}</p>
                    ) : (
                        <div className="space-y-3">
                            {topProducts.map((p: any, i: number) => (
                                <div key={i} className="space-y-1.5">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-black text-gray-300 dark:text-slate-600 w-4 flex-shrink-0">
                                            #{i+1}
                                        </span>
                                        <span className="flex-1 text-sm font-bold text-gray-800 dark:text-white truncate">
                                            {p.productName}
                                        </span>
                                        <span className="text-[10px] text-gray-400 dark:text-slate-500 flex-shrink-0 font-semibold">
                                            {p.totalQty} u.
                                        </span>
                                        <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 flex-shrink-0">
                                            {TND_F(p.totalRevenue)}
                                        </span>
                                    </div>
                                    <ProgBar value={p.totalRevenue} max={topProducts[0]?.totalRevenue || 1} color={PIE_COLORS[i] ?? '#6B7280'} />
                                </div>
                            ))}
                        </div>
                    )}
                </Panel>
            </div>

            {/* ── STOCK FAIBLE (conditionnel) ──────────────────────────────── */}
            {lowStockProducts.length > 0 && (
                <Panel>
                    <Section
                        icon={<AlertTriangle size={13} className="text-amber-500" />}
                        title={t('dashboard.lowStockProducts')}
                        sub={t('dashboard.belowThreshold')}
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {(lowStockProducts as any[]).map((p: any) => (
                            <div key={p._id}
                                 className="flex items-center gap-3 py-2.5 px-3 rounded-xl
                                    bg-amber-50 dark:bg-amber-500/5 border border-amber-100 dark:border-amber-500/20">
                                <AlertTriangle size={13} className="text-amber-500 flex-shrink-0" />
                                <span className="flex-1 text-xs font-bold text-gray-800 dark:text-white truncate">{p.name}</span>
                                <div className="text-right flex-shrink-0">
                                    <p className="text-xs font-black text-amber-600 dark:text-amber-400">{p.stockQuantity}</p>
                                    <p className="text-[9px] text-gray-400 dark:text-slate-500 font-semibold">/ {p.stockThreshold} min</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </Panel>
            )}

            {/* ── VENTES RÉCENTES ──────────────────────────────────────────── */}
            <Panel>
                <Section
                    icon={<Activity size={13} className="text-cyan-500 dark:text-cyan-400" />}
                    title={t('dashboard.recentSales')}
                    sub={t('dashboard.last10Transactions')}
                />
                {recentVentes.length === 0 ? (
                    <p className="text-xs text-gray-400 dark:text-slate-600 text-center py-6 font-semibold">{t('dashboard.noSales')}</p>
                ) : (
                    <div className="space-y-0.5">
                        {recentVentes.map((v: any) => (
                            <div key={v._id}
                                 className="flex items-center gap-3 py-2.5 px-2 rounded-xl
                                    hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                                <div className={`w-1 h-9 rounded-full flex-shrink-0 ${STATUS_BAR[v.status] ?? 'bg-gray-200 dark:bg-slate-600'}`} />
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{v.clientName}</p>
                                    <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-0.5 font-medium">
                                        {v.createdAt ? format(new Date(v.createdAt), 'dd/MM/yyyy · HH:mm') : '—'}
                                        {v.items?.[0] && ` · ${v.items[0].productName}`}
                                    </p>
                                </div>
                                <div className="text-right flex-shrink-0 space-y-0.5">
                                    <p className="text-xs font-black text-cyan-600 dark:text-cyan-400">{TND_F(v.totalTTC)}</p>
                                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold whitespace-nowrap ${STATUS_CLS[v.status] ?? ''}`}>
                                        {STATUS_LABEL[v.status] ?? v.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Panel>

        </div>
    );
};

export default DashboardPage;