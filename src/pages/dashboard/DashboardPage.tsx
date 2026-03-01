// import React, { useState } from 'react';
// import { useQuery } from '@tanstack/react-query';
// import { dashboardApi, accountingApi } from '../../api';
// import { useI18n } from '../../context/I18nContext';
// import {
//     XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
//     AreaChart, Area, PieChart, Pie, Cell,
// } from 'recharts';
// import {
//     TrendingUp, ShoppingCart, Users, Package, AlertTriangle,
//     CreditCard, DollarSign, BarChart2, ArrowUpRight, ArrowDownRight, RefreshCw,
// } from 'lucide-react';
// import { format } from 'date-fns';
// import { fr } from 'date-fns/locale';
//
// const TND = (v: number) => `${(v || 0).toFixed(3)} TND`;
//
// const MONTHS_FR = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
// const PIE_COLORS = ['#10B981', '#F59E0B', '#EF4444'];
//
// const STATUS_LABEL: Record<string, string> = {
//     paid: 'Payé', partial: 'Partiel', pending: 'En attente',
// };
// const STATUS_CLS: Record<string, string> = {
//     paid:    'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400',
//     partial: 'text-amber-600  bg-amber-50  dark:bg-amber-900/20  dark:text-amber-400',
//     pending: 'text-red-500    bg-red-50    dark:bg-red-900/20    dark:text-red-400',
// };
//
// // ── KPI Card — ligne horizontale compacte ────────────────────────────────────
// const KPICard: React.FC<{
//     title: string;
//     value: string;
//     sub?: string;
//     icon: React.ReactNode;
//     iconBg: string;
//     trend?: number;
// }> = ({ title, value, sub, icon, iconBg, trend }) => (
//     <div className="bg-white dark:bg-gray-900 rounded-xl px-4 py-3 border border-gray-100 dark:border-gray-800 flex items-center gap-3">
//         {/* Icône à gauche */}
//         <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
//             {icon}
//         </div>
//         {/* Texte au centre */}
//         <div className="flex-1 min-w-0">
//             <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-tight">{title}</p>
//             <p className="text-base font-bold text-gray-900 dark:text-white leading-tight mt-0.5">{value}</p>
//             {sub && <p className="text-[11px] text-gray-400 dark:text-gray-500 leading-tight mt-0.5">{sub}</p>}
//         </div>
//         {/* Trend à droite si dispo */}
//         {trend !== undefined && (
//             <div className={`flex items-center gap-0.5 text-[11px] font-semibold flex-shrink-0 ${trend >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
//                 {trend >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
//                 {Math.abs(trend).toFixed(1)}%
//             </div>
//         )}
//     </div>
// );
//
// const Skeleton: React.FC<{ className?: string }> = ({ className }) => (
//     <div className={`bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse ${className}`} />
// );
//
// // ── Page ─────────────────────────────────────────────────────────────────────
// const DashboardPage: React.FC = () => {
//     const { t } = useI18n();
//     const [accountingPeriod, setAccountingPeriod] = useState<'month' | 'year'>('month');
//
//     const { data: dash, isLoading, refetch, isRefetching } = useQuery({
//         queryKey: ['dashboard'],
//         queryFn: () => dashboardApi.get(),
//         refetchInterval: 60_000,
//     });
//
//     const now = new Date();
//     const startMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
//     const endMonth   = now.toISOString().split('T')[0];
//     const startYear  = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
//
//     const { data: accounting } = useQuery({
//         queryKey: ['accounting-summary', accountingPeriod],
//         queryFn: () => accountingApi.getSummary({
//             startDate: accountingPeriod === 'month' ? startMonth : startYear,
//             endDate: endMonth,
//         }),
//     });
//
//     const chartData = (dash?.monthlyVentes || []).map((m: any) => ({
//         name: MONTHS_FR[(m._id?.month || 1) - 1],
//         CA: Number((m.revenue || 0).toFixed(3)),
//     }));
//
//     const recentVentes: any[] = dash?.recentVentes || [];
//
//     const statusData = [
//         { name: 'Payé',       value: recentVentes.filter((v) => v.status === 'paid').length },
//         { name: 'Partiel',    value: recentVentes.filter((v) => v.status === 'partial').length },
//         { name: 'En attente', value: recentVentes.filter((v) => v.status === 'pending').length },
//     ].filter(d => d.value > 0);
//
//     const o = dash?.overview;
//     const netProfit: number = (accounting?.profit?.net as number) ?? 0;
//
//     // ── Skeleton ──
//     if (isLoading) return (
//         <div className="px-3 py-4 space-y-2">
//             <Skeleton className="h-8 w-40" />
//             {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
//             <Skeleton className="h-48" />
//         </div>
//     );
//
//     return (
//         // px-3 sur mobile = 12px de chaque côté, très serré et propre
//         <div className="px-3 sm:px-4 py-4 space-y-3 pb-8">
//
//             {/* ── Header ── */}
//             <div className="flex items-center justify-between gap-2">
//                 <div>
//                     <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t('dashboard.title')}</h1>
//                     <p className="text-[11px] text-gray-500 dark:text-gray-400 capitalize mt-0.5">
//                         {format(now, 'EEEE dd MMMM yyyy', { locale: fr })}
//                     </p>
//                 </div>
//                 <button
//                     onClick={() => refetch()}
//                     disabled={isRefetching}
//                     className="p-2 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 transition-colors flex-shrink-0"
//                 >
//                     <RefreshCw size={16} className={isRefetching ? 'animate-spin' : ''} />
//                 </button>
//             </div>
//
//             {/* ── KPI Cards — 1 colonne sur mobile, 2 sur sm, 4 sur lg ── */}
//             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
//                 <KPICard
//                     title={t('dashboard.totalRevenue')}
//                     value={TND(o?.totalRevenue || 0)}
//                     sub={`Encaissé: ${TND(o?.totalRevenuePaid || 0)}`}
//                     icon={<TrendingUp size={18} className="text-blue-600" />}
//                     iconBg="bg-blue-50 dark:bg-blue-900/20"
//                 />
//                 <KPICard
//                     title={t('dashboard.monthRevenue')}
//                     value={TND(o?.monthRevenue || 0)}
//                     sub={`Encaissé: ${TND(o?.monthRevenuePaid || 0)}`}
//                     icon={<DollarSign size={18} className="text-emerald-600" />}
//                     iconBg="bg-emerald-50 dark:bg-emerald-900/20"
//                 />
//                 <KPICard
//                     title={t('dashboard.totalPurchases')}
//                     value={TND(o?.totalPurchases || 0)}
//                     sub={`Ce mois: ${TND(o?.monthPurchases || 0)}`}
//                     icon={<ShoppingCart size={18} className="text-amber-600" />}
//                     iconBg="bg-amber-50 dark:bg-amber-900/20"
//                 />
//                 <KPICard
//                     title={t('dashboard.netProfit')}
//                     value={TND((o?.monthRevenuePaid || 0) - (o?.monthPurchases || 0))}
//                     sub="Encaissé - Achats"
//                     icon={<BarChart2 size={18} className="text-purple-600" />}
//                     iconBg="bg-purple-50 dark:bg-purple-900/20"
//                 />
//                 <KPICard
//                     title={t('dashboard.totalClients')}
//                     value={String(o?.totalClients || 0)}
//                     sub={`${o?.activeClients || 0} actifs`}
//                     icon={<Users size={18} className="text-indigo-600" />}
//                     iconBg="bg-indigo-50 dark:bg-indigo-900/20"
//                 />
//                 <KPICard
//                     title={t('dashboard.totalProducts')}
//                     value={String(o?.totalProducts || 0)}
//                     sub={o?.lowStockCount > 0 ? `⚠️ ${o.lowStockCount} stock faible` : 'Stocks OK'}
//                     icon={<Package size={18} className="text-teal-600" />}
//                     iconBg="bg-teal-50 dark:bg-teal-900/20"
//                 />
//                 <KPICard
//                     title="TVA à payer"
//                     value={TND(accounting?.tva?.toPay || 0)}
//                     sub={`Collectée: ${TND(accounting?.tva?.collected || 0)}`}
//                     icon={<CreditCard size={18} className="text-rose-600" />}
//                     iconBg="bg-rose-50 dark:bg-rose-900/20"
//                 />
//                 <KPICard
//                     title="Créances clients"
//                     value={TND(accounting?.revenue?.outstanding || 0)}
//                     sub="Non encaissé"
//                     icon={<AlertTriangle size={18} className="text-orange-600" />}
//                     iconBg="bg-orange-50 dark:bg-orange-900/20"
//                 />
//             </div>
//
//             {/* ── Graphique CA ── */}
//             <div className="bg-white dark:bg-gray-900 rounded-xl p-3 border border-gray-100 dark:border-gray-800">
//                 <h3 className="text-xs font-semibold text-gray-900 dark:text-white mb-3">
//                     📈 Évolution du CA (6 mois)
//                 </h3>
//                 {chartData.length === 0 ? (
//                     <div className="h-36 flex items-center justify-center text-xs text-gray-400">
//                         Pas encore de données
//                     </div>
//                 ) : (
//                     <ResponsiveContainer width="100%" height={170}>
//                         <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
//                             <defs>
//                                 <linearGradient id="gradCA" x1="0" y1="0" x2="0" y2="1">
//                                     <stop offset="5%"  stopColor="#3B82F6" stopOpacity={0.18} />
//                                     <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
//                                 </linearGradient>
//                             </defs>
//                             <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
//                             <XAxis dataKey="name" tick={{ fontSize: 10 }} />
//                             <YAxis tick={{ fontSize: 10 }} />
//                             <Tooltip
//                                 formatter={(v: any) => [`${Number(v).toFixed(3)} TND`, 'CA']}
//                                 contentStyle={{ fontSize: 11, borderRadius: 8 }}
//                             />
//                             <Area type="monotone" dataKey="CA" stroke="#3B82F6" strokeWidth={2} fill="url(#gradCA)" />
//                         </AreaChart>
//                     </ResponsiveContainer>
//                 )}
//             </div>
//
//             {/* ── Statut des ventes ── */}
//             {statusData.length > 0 && (
//                 <div className="bg-white dark:bg-gray-900 rounded-xl p-3 border border-gray-100 dark:border-gray-800">
//                     <h3 className="text-xs font-semibold text-gray-900 dark:text-white mb-3">🎯 Statut des ventes</h3>
//                     <div className="flex items-center gap-3">
//                         <ResponsiveContainer width={120} height={120}>
//                             <PieChart>
//                                 <Pie data={statusData} cx="50%" cy="50%" innerRadius={32} outerRadius={52} dataKey="value">
//                                     {statusData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i] ?? '#6B7280'} />)}
//                                 </Pie>
//                             </PieChart>
//                         </ResponsiveContainer>
//                         <div className="flex flex-col gap-2 flex-1">
//                             {statusData.map((d, i) => (
//                                 <div key={i} className="flex items-center justify-between">
//                                     <div className="flex items-center gap-2">
//                                         <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: PIE_COLORS[i] }} />
//                                         <span className="text-xs text-gray-600 dark:text-gray-400">{d.name}</span>
//                                     </div>
//                                     <span className="text-xs font-semibold text-gray-900 dark:text-white">{d.value}</span>
//                                 </div>
//                             ))}
//                         </div>
//                     </div>
//                 </div>
//             )}
//
//             {/* ── Résumé comptable ── */}
//             <div className="bg-white dark:bg-gray-900 rounded-xl p-3 border border-gray-100 dark:border-gray-800">
//                 <div className="flex items-center justify-between mb-3">
//                     <h3 className="text-xs font-semibold text-gray-900 dark:text-white">💼 Résumé comptable</h3>
//                     <div className="flex gap-1">
//                         {(['month', 'year'] as const).map(p => (
//                             <button
//                                 key={p}
//                                 onClick={() => setAccountingPeriod(p)}
//                                 className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
//                                     accountingPeriod === p
//                                         ? 'bg-blue-600 text-white'
//                                         : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
//                                 }`}
//                             >
//                                 {p === 'month' ? 'Mois' : 'Année'}
//                             </button>
//                         ))}
//                     </div>
//                 </div>
//
//                 {/* Grille 2×2 */}
//                 <div className="grid grid-cols-2 gap-2 mb-3">
//                     {[
//                         { label: 'CA HT',       value: accounting?.revenue?.totalHT,   color: 'text-blue-600' },
//                         { label: 'Achats HT',   value: accounting?.purchases?.totalHT, color: 'text-amber-600' },
//                         { label: 'Marge brute', value: accounting?.profit?.gross,       color: 'text-emerald-600' },
//                         { label: 'Bén. net',    value: netProfit,                       color: netProfit >= 0 ? 'text-emerald-600' : 'text-red-500' },
//                     ].map(({ label, value, color }) => (
//                         <div key={label} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2.5 text-center">
//                             <p className="text-[11px] text-gray-500 dark:text-gray-400">{label}</p>
//                             <p className={`text-sm font-bold mt-0.5 ${color}`}>{TND(value ?? 0)}</p>
//                         </div>
//                     ))}
//                 </div>
//
//                 {/* TVA */}
//                 {accounting?.tva && (
//                     <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
//                         {[
//                             { label: 'TVA collectée',  value: accounting.tva.collected, color: 'text-gray-700 dark:text-gray-300' },
//                             { label: 'TVA déductible', value: accounting.tva.deductible, color: 'text-gray-700 dark:text-gray-300' },
//                             { label: 'TVA à payer',    value: accounting.tva.toPay,     color: accounting.tva.toPay > 0 ? 'text-red-600' : 'text-emerald-600' },
//                             { label: 'Crédit TVA',     value: accounting.tva.toRefund,  color: 'text-emerald-600' },
//                         ].map(({ label, value, color }) => (
//                             <div key={label} className="text-center py-1">
//                                 <p className="text-[10px] text-gray-400">{label}</p>
//                                 <p className={`text-xs font-semibold mt-0.5 ${color}`}>{TND(value)}</p>
//                             </div>
//                         ))}
//                     </div>
//                 )}
//             </div>
//
//             {/* ── Top Clients ── */}
//             <div className="bg-white dark:bg-gray-900 rounded-xl p-3 border border-gray-100 dark:border-gray-800">
//                 <h3 className="text-xs font-semibold text-gray-900 dark:text-white mb-3">
//                     🏆 {t('dashboard.topClients')}
//                 </h3>
//                 {(dash?.topClients || []).length === 0 ? (
//                     <p className="text-xs text-gray-400 text-center py-4">Aucun client</p>
//                 ) : (
//                     <div className="space-y-1">
//                         {(dash.topClients as any[]).map((c: any, i: number) => (
//                             <div key={i} className="flex items-center gap-3 py-2 px-1">
//                 <span className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0 ${
//                     i === 0 ? 'bg-yellow-500' : i === 1 ? 'bg-gray-400' : i === 2 ? 'bg-amber-700' : 'bg-blue-500'
//                 }`}>{i + 1}</span>
//                                 <span className="flex-1 text-sm text-gray-700 dark:text-gray-300 truncate">{c.clientName}</span>
//                                 <span className="text-sm font-bold text-blue-600 dark:text-blue-400 flex-shrink-0">{TND(c.revenue)}</span>
//                             </div>
//                         ))}
//                     </div>
//                 )}
//             </div>
//
//             {/* ── Ventes récentes ── */}
//             <div className="bg-white dark:bg-gray-900 rounded-xl p-3 border border-gray-100 dark:border-gray-800">
//                 <h3 className="text-xs font-semibold text-gray-900 dark:text-white mb-3">
//                     🕐 {t('dashboard.recentSales')}
//                 </h3>
//                 {recentVentes.length === 0 ? (
//                     <p className="text-xs text-gray-400 text-center py-4">Aucune vente</p>
//                 ) : (
//                     <div className="space-y-1">
//                         {recentVentes.slice(0, 5).map((v: any) => (
//                             <div key={v._id} className="flex items-center gap-3 py-2 px-1">
//                                 <div className="flex-1 min-w-0">
//                                     <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">{v.clientName}</p>
//                                     <p className="text-[11px] text-gray-400 mt-0.5">
//                                         {v.createdAt ? format(new Date(v.createdAt), 'dd/MM/yy') : '—'} · {TND(v.totalTTC)}
//                                     </p>
//                                 </div>
//                                 <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium whitespace-nowrap flex-shrink-0 ${STATUS_CLS[v.status] ?? ''}`}>
//                   {STATUS_LABEL[v.status] ?? v.status}
//                 </span>
//                             </div>
//                         ))}
//                     </div>
//                 )}
//             </div>
//
//         </div>
//     );
// };
//
// export default DashboardPage;
//


/*
  ┌─────────────────────────────────────────────────────────────────────────┐
  │  DashboardPage.tsx                                                      │
  │  • Mobile  → 1 colonne, aucune row                                      │
  │  • Tablet+ → grilles 2/4 colonnes                                       │
  │  • Font    → Nunito (Google Fonts, via index.html ou global CSS)        │
  │  • Mode    → Light / Dark via classe Tailwind `dark`                    │
  └─────────────────────────────────────────────────────────────────────────┘

  Ajouter dans index.html (ou global.css) :
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">

  Dans tailwind.config.js :
  theme: { extend: { fontFamily: { sans: ['Nunito', 'sans-serif'] } } }
*/
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

// ── Textes FR (fallback si t() ne résout pas encore les clés) ─────────────────
const L = {
    title:                      'Tableau de bord',
    collected:                  'Encaissé',
    sales:                      'ventes',
    positive:                   'Positif',
    negative:                   'Négatif',
    notCollected:               'Non encaissé',
    thisMonth:                  'Ce mois',
    active:                     'actifs',
    lowStock:                   'stock faible',
    stockOk:                    'Stocks OK',
    totalRevenue:               'CA Total',
    monthRevenue:               'CA ce mois',
    netProfit:                  'Bénéfice net',
    receivables:                'Créances',
    totalPurchases:             'Achats total',
    totalClients:               'Clients',
    vatToPay:                   'TVA à payer',
    totalProducts:              'Produits',
    performanceIndicators:      'Indicateurs de performance',
    calculatedThisMonth:        'Calculés sur le mois en cours',
    collectionRate:             'Encaissement',
    netMargin:                  'Marge nette',
    debtRate:                   'Taux créances',
    revenueVsPurchasesVsProfit: 'CA · Achats · Profit',
    last6Months:                '6 derniers mois',
    noData:                     'Pas encore de données',
    revenue:                    "Chiffre d'affaires",
    purchases:                  'Achats',
    profit:                     'Profit',
    charges:                    'Charges',
    salesStatus:                'Statut des ventes',
    paymentMethods:             'Méthodes de paiement',
    accountingSummary:          'Résumé comptable',
    month:                      'Mois',
    year:                       'Année',
    revenueHT:                  'CA HT',
    purchasesHT:                'Achats HT',
    netBenefit:                 'Bén. net',
    vatCollected:               'TVA collectée',
    vatDeductible:              'TVA déductible',
    vatToPay2:                  'TVA à payer',
    vatCredit:                  'Crédit TVA',
    dailySales:                 'Ventes journalières',
    financialEvolution:         'Évolution financière',
    topClients:                 'Top clients',
    topProducts:                'Top produits',
    byRevenue:                  'Par chiffre d\'affaires',
    noClients:                  'Aucun client',
    noProducts:                 'Aucun produit',
    lowStockProducts:           'Stock faible',
    belowThreshold:             'Produits sous le seuil',
    recentSales:                'Ventes récentes',
    last10Transactions:         '10 dernières transactions',
    noSales:                    'Aucune vente',
};

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

    const o            = dash?.overview    || {};
    const tva          = dash?.tva         || accounting?.tva || {};
    const netProfit    = o.netProfitMonth  ?? accounting?.profit?.net ?? 0;
    const recentVentes = dash?.recentVentes || [];
    const topClients   = dash?.topClients   || [];
    const topProducts  = dash?.topProducts  || [];
    const sparkCA      = (dash?.monthlyVentes || []).map((m: any) => m.revenue || 0);
    const maxClientRev = topClients[0]?.revenue ?? topClients[0]?.total ?? 1;

    const collectionRate = o.monthRevenue > 0 ? ((o.monthRevenuePaid || 0) / o.monthRevenue) * 100 : 0;
    const marginRate     = o.monthRevenue > 0 ? (netProfit / o.monthRevenue) * 100 : 0;
    const debtRate       = o.totalRevenue  > 0 ? ((o.totalRevenueDebt || 0) / o.totalRevenue) * 100 : 0;

    // ── Chart data ────────────────────────────────────────────────────────────
    const monthlyData = (dash?.monthlyVentes || []).map((m: any) => {
        const pur = (dash?.monthlyPurchases || []).find((p: any) =>
            p._id?.month === m._id?.month && p._id?.year === m._id?.year);
        const chg = (dash?.monthlyCharges   || []).find((c: any) =>
            c._id?.month === m._id?.month && c._id?.year === m._id?.year);
        return {
            name:    MONTHS_FR[(m._id?.month || 1) - 1],
            CA:      +(m.revenue        || 0).toFixed(3),
            Achats:  +(pur?.total       || 0).toFixed(3),
            Charges: +(chg?.total       || 0).toFixed(3),
            Profit:  +((m.revenue || 0) - (pur?.total || 0) - (chg?.total || 0)).toFixed(3),
        };
    });

    const dailyData = (dash?.dailySalesThisMonth || []).map((d: any) => ({
        day: `J${d._id?.day}`,
        CA:  +(d.revenue || 0).toFixed(3),
    }));

    const statusDist  = (dash?.ventesStatusDist  || []).map((s: any) => ({
        name: STATUS_LABEL[s._id] ?? s._id, value: s.count, total: s.total,
    }));
    const paymentDist = (dash?.paymentMethodDist || []).map((s: any) => ({
        name: s._id || 'Autre', value: s.count, total: s.total,
    }));

    const accCA  = period === 'month' ? (o.monthRevenueHT   ?? accounting?.revenue?.totalHT   ?? 0) : (o.yearRevenueHT    ?? 0);
    const accPur = period === 'month' ? (o.monthPurchasesHT ?? accounting?.purchases?.totalHT ?? 0) : (o.totalPurchasesHT ?? 0);
    const accChg = period === 'month' ? (o.chargesThisMonth ?? 0) : (o.chargesThisYear ?? 0);
    const accNet = period === 'month' ?  netProfit           : (o.netProfitYear ?? accounting?.profit?.net ?? 0);

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
                            {L.title}
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
                    {(dash?.unreadNotifications || 0) > 0 && (
                        <div className="flex items-center gap-1 px-2 py-1.5 rounded-lg
                            bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20">
                            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-black">
                                {dash.unreadNotifications}
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
                    title={L.totalRevenue}
                    value={o.totalRevenue || 0}
                    sub={`${L.collected}: ${TND(o.totalRevenuePaid || 0)} TND`}
                    icon={<TrendingUp size={15} className="text-cyan-500 dark:text-cyan-400" />}
                    gradFrom="#06B6D4" gradTo="#3B82F6" accentColor="#06B6D4"
                    trend={o.revenueTrend ?? null}
                    sparkData={sparkCA}
                />
                <KPICard
                    title={L.monthRevenue}
                    value={o.monthRevenue || 0}
                    sub={`${o.monthSalesCount || 0} ${L.sales}`}
                    icon={<DollarSign size={15} className="text-emerald-500 dark:text-emerald-400" />}
                    gradFrom="#10B981" gradTo="#14B8A6" accentColor="#10B981"
                    trend={o.revenueTrend ?? null}
                />
                <KPICard
                    title={L.netProfit}
                    value={Math.abs(netProfit)}
                    sub={netProfit >= 0 ? `✓ ${L.positive}` : `⚠ ${L.negative}`}
                    icon={<Zap size={15} className={netProfit >= 0 ? 'text-yellow-500 dark:text-yellow-400' : 'text-red-500'} />}
                    gradFrom={netProfit >= 0 ? '#F59E0B' : '#EF4444'}
                    gradTo={netProfit >= 0 ? '#EF4444' : '#F43F5E'}
                    accentColor={netProfit >= 0 ? '#F59E0B' : '#EF4444'}
                />
                <KPICard
                    title={L.receivables}
                    value={o.totalRevenueDebt || 0}
                    sub={L.notCollected}
                    icon={<AlertTriangle size={15} className="text-orange-500 dark:text-orange-400" />}
                    gradFrom="#F97316" gradTo="#EF4444" accentColor="#F97316"
                />
                <KPICard
                    title={L.totalPurchases}
                    value={o.totalPurchases || 0}
                    sub={`${L.thisMonth}: ${TND(o.monthPurchases || 0)} TND`}
                    icon={<ShoppingCart size={15} className="text-violet-500 dark:text-violet-400" />}
                    gradFrom="#8B5CF6" gradTo="#6366F1" accentColor="#8B5CF6"
                />
                <KPICard
                    title={L.totalClients}
                    value={o.totalClients || 0}
                    sub={`${o.activeClients || 0} ${L.active} · +${o.newClientsMonth || 0} ${L.thisMonth}`}
                    icon={<Users size={15} className="text-blue-500 dark:text-blue-400" />}
                    gradFrom="#3B82F6" gradTo="#6366F1" accentColor="#3B82F6"
                    isCount
                />
                <KPICard
                    title={L.vatToPay}
                    value={tva.toPay || 0}
                    sub={`${L.collected}: ${TND(tva.collected || 0)} TND`}
                    icon={<CreditCard size={15} className="text-rose-500 dark:text-rose-400" />}
                    gradFrom="#F43F5E" gradTo="#EC4899" accentColor="#F43F5E"
                />
                <KPICard
                    title={L.totalProducts}
                    value={o.totalProducts || 0}
                    sub={o.lowStockCount > 0
                        ? `⚠️ ${o.lowStockCount} ${L.lowStock}`
                        : `✓ ${L.stockOk}`}
                    icon={<Package size={15} className="text-teal-500 dark:text-teal-400" />}
                    gradFrom="#14B8A6" gradTo="#06B6D4" accentColor="#14B8A6"
                    isCount
                />
            </div>

            {/* ── GAUGES ──────────────────────────────────────────────────── */}
            <Panel>
                <Section
                    icon={<Target size={13} className="text-cyan-500 dark:text-cyan-400" />}
                    title={L.performanceIndicators}
                    sub={L.calculatedThisMonth}
                />
                <div className="grid grid-cols-3 gap-2">
                    <div className="flex flex-col items-center">
                        <Gauge pct={collectionRate} color="#06B6D4" label={L.collectionRate} />
                        <p className="text-[9px] text-gray-500 dark:text-slate-500 mt-1 text-center font-semibold truncate w-full px-1">
                            {TND_F(o.monthRevenuePaid || 0)}
                        </p>
                    </div>
                    <div className="flex flex-col items-center">
                        <Gauge pct={Math.max(0, marginRate)} color="#10B981" label={L.netMargin} />
                        <p className="text-[9px] text-gray-500 dark:text-slate-500 mt-1 text-center font-semibold truncate w-full px-1">
                            {TND_F(netProfit)}
                        </p>
                    </div>
                    <div className="flex flex-col items-center">
                        <Gauge pct={debtRate} color="#F59E0B" label={L.debtRate} />
                        <p className="text-[9px] text-gray-500 dark:text-slate-500 mt-1 text-center font-semibold truncate w-full px-1">
                            {TND_F(o.totalRevenueDebt || 0)}
                        </p>
                    </div>
                </div>
            </Panel>

            {/* ── COMBO CHART CA / ACHATS / PROFIT ────────────────────────── */}
            <Panel>
                <Section
                    icon={<Activity size={13} className="text-cyan-500 dark:text-cyan-400" />}
                    title={L.revenueVsPurchasesVsProfit}
                    sub={L.last6Months}
                />
                {monthlyData.length === 0 ? (
                    <div className="h-40 flex items-center justify-center text-xs text-gray-400 dark:text-slate-600 font-semibold">
                        {L.noData}
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={200}>
                        <ComposedChart data={monthlyData} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
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
                            <Area  type="monotone" dataKey="CA"     name={L.revenue}    stroke="#06B6D4" strokeWidth={2} fill="url(#gCA)" />
                            <Bar              dataKey="Achats"  name={L.purchases}  fill="#8B5CF6"   opacity={0.75} radius={[3,3,0,0]} />
                            <Line  type="monotone" dataKey="Profit" name={L.profit}     stroke="#10B981" strokeWidth={2} dot={{ r: 3, fill: '#10B981' }} />
                        </ComposedChart>
                    </ResponsiveContainer>
                )}
            </Panel>

            {/* ── STATUT + PAIEMENTS : mobile 1 col, sm+ 2 cols ──────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                {/* Statut */}
                <Panel>
                    <Section icon={<PieIcon size={13} className="text-cyan-500 dark:text-cyan-400" />} title={L.salesStatus} />
                    {statusDist.length === 0 ? (
                        <div className="h-32 flex items-center justify-center text-xs text-gray-400 dark:text-slate-600 font-semibold">
                            {L.noData}
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
                    <Section icon={<CreditCard size={13} className="text-cyan-500 dark:text-cyan-400" />} title={L.paymentMethods} />
                    {paymentDist.length === 0 ? (
                        <div className="h-32 flex items-center justify-center text-xs text-gray-400 dark:text-slate-600 font-semibold">
                            {L.noData}
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
                    title={L.accountingSummary}
                    right={
                        <div className="flex gap-1">
                            {(['month','year'] as const).map(p => (
                                <button key={p} onClick={() => setPeriod(p)}
                                        className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                                            period === p
                                                ? 'bg-cyan-50 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/30'
                                                : 'bg-gray-50 dark:bg-white/5 text-gray-400 dark:text-slate-500 border border-gray-100 dark:border-white/10'
                                        }`}>
                                    {p === 'month' ? L.month : L.year}
                                </button>
                            ))}
                        </div>
                    }
                />
                {/* tiles : mobile 1 col → sm 2 → lg 4 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 mb-4">
                    <MetricTile label={L.revenueHT}   value={accCA}  color="#06B6D4" />
                    <MetricTile label={L.purchasesHT} value={accPur} color="#8B5CF6" />
                    <MetricTile label={L.charges}     value={accChg} color="#F59E0B" />
                    <MetricTile label={L.netBenefit}  value={accNet} color={accNet >= 0 ? '#10B981' : '#EF4444'} />
                </div>

                {/* TVA : mobile 1 col → sm 2 → lg 4 */}
                <div className="pt-3 border-t border-gray-100 dark:border-white/[0.06]">
                    <p className="text-[10px] text-gray-400 dark:text-slate-500 uppercase tracking-widest font-black mb-2.5">TVA</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                        {[
                            { label: L.vatCollected,  value: tva.collected  || 0, cls: 'text-gray-700 dark:text-slate-300' },
                            { label: L.vatDeductible, value: tva.deductible || 0, cls: 'text-gray-700 dark:text-slate-300' },
                            { label: L.vatToPay2,     value: tva.toPay      || 0, cls: (tva.toPay || 0) > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400' },
                            { label: L.vatCredit,     value: tva.toRefund   || 0, cls: 'text-emerald-600 dark:text-emerald-400' },
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
                    title={L.dailySales}
                    sub={L.thisMonth}
                />
                {dailyData.length === 0 ? (
                    <div className="h-36 flex items-center justify-center text-xs text-gray-400 dark:text-slate-600 font-semibold">
                        {L.noData}
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
                    title={L.financialEvolution}
                    sub={L.last6Months}
                />
                {monthlyData.length === 0 ? (
                    <div className="h-36 flex items-center justify-center text-xs text-gray-400 dark:text-slate-600 font-semibold">
                        {L.noData}
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={170}>
                        <AreaChart data={monthlyData} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
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
                            <Area type="monotone" dataKey="CA"      name={L.revenue}    stroke="#06B6D4" strokeWidth={2} fill="url(#gCA2)" />
                            <Area type="monotone" dataKey="Achats"  name={L.purchases}  stroke="#8B5CF6" strokeWidth={2} fill="url(#gAch)" />
                            <Area type="monotone" dataKey="Charges" name={L.charges}    stroke="#F59E0B" strokeWidth={2} fill="url(#gChg)" />
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
                        title={L.topClients}
                        sub={L.byRevenue}
                    />
                    {topClients.length === 0 ? (
                        <p className="text-xs text-gray-400 dark:text-slate-600 text-center py-6 font-semibold">{L.noClients}</p>
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
                        title={L.topProducts}
                        sub={L.byRevenue}
                    />
                    {topProducts.length === 0 ? (
                        <p className="text-xs text-gray-400 dark:text-slate-600 text-center py-6 font-semibold">{L.noProducts}</p>
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
            {(dash?.lowStockProducts || []).length > 0 && (
                <Panel>
                    <Section
                        icon={<AlertTriangle size={13} className="text-amber-500" />}
                        title={L.lowStockProducts}
                        sub={L.belowThreshold}
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {(dash.lowStockProducts as any[]).map((p: any) => (
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
                    title={L.recentSales}
                    sub={L.last10Transactions}
                />
                {recentVentes.length === 0 ? (
                    <p className="text-xs text-gray-400 dark:text-slate-600 text-center py-6 font-semibold">{L.noSales}</p>
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