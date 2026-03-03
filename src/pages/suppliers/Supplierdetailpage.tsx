import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { suppliersApi, productsApi } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';
import {
    ArrowLeft, Phone, Mail, MapPin, TrendingDown, TrendingUp, CreditCard, Download,
    Package, ChevronRight, ChevronLeft, Calendar, Filter, ShoppingBag, X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

/* ─── Helpers ──────────────────────────────────────────────────────────────── */
const formatTND = (v: number) => `${(v || 0).toFixed(3)} TND`;
const todayStr  = () => new Date().toISOString().split('T')[0];

const getProductId = (p: any): string => {
    if (!p) return '';
    if (typeof p === 'string') return p;
    if (typeof p === 'object') return p._id?.toString() || '';
    return String(p);
};

/* ═══════════════════════════════════════════════════════════════════════════ */
const SupplierDetailPage: React.FC = () => {
    const { supplierId } = useParams<{ supplierId: string }>();
    const navigate       = useNavigate();
    const { user }       = useAuth();
    const userId: string = user?.id ?? '';
    const { t, dir }     = useI18n();

    const statusConfig: Record<string, { label: string; cls: string }> = {
        paid:    { label: t('sales.status.paid'),    cls: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
        partial: { label: t('sales.status.partial'), cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
        pending: { label: t('sales.status.pending'), cls: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' },
    };

    const [selectedPurchase, setSelectedPurchase] = useState<any>(null);
    const [selectedProduct,  setSelectedProduct]  = useState<any>(null);
    const [exportStartDate,  setExportStartDate]  = useState('');
    const [exportEndDate,    setExportEndDate]    = useState('');
    const [exportQuick,      setExportQuick]      = useState('');
    const [filterStartDate,  setFilterStartDate]  = useState('');
    const [filterEndDate,    setFilterEndDate]    = useState('');
    const [filterQuick,      setFilterQuick]      = useState('');

    /* ── Queries ─────────────────────────────────────────────────────────── */
    const { data: supplier, isLoading: supplierLoading } = useQuery({
        queryKey: ['supplier-detail', supplierId],
        queryFn:  () => suppliersApi.getOne(supplierId!),
        enabled:  !!supplierId,
    });

    const { data: allProducts = [] } = useQuery({
        queryKey: ['products'],
        queryFn:  () => productsApi.getAll(),
    });

    const { data: statsData, isLoading: statsLoading } = useQuery({
        queryKey: ['supplier-stats', supplierId, userId],
        queryFn:  () => suppliersApi.getPurchases(supplierId!, userId),
        enabled:  !!supplierId && !!userId,
    });

    useEffect(() => {
        setSelectedPurchase(null);
        setExportStartDate(''); setExportEndDate(''); setExportQuick('');
        setFilterStartDate(''); setFilterEndDate(''); setFilterQuick('');
    }, [supplierId]);

    /* ── Résolution produit : ID → objet complet ─────────────────────────── */
    const resolveProduct = (p: any): any => {
        if (!p) return null;
        // Déjà un objet populé avec nom → OK
        if (typeof p === 'object' && p.name) return p;
        // Sinon chercher dans allProducts par _id
        const id = typeof p === 'string' ? p : p._id?.toString();
        return (allProducts as any[]).find((x: any) => x._id === id) || { _id: id, name: id };
    };

    /* Enrichir les produits du fournisseur avec les données complètes */
    const resolvedProducts = useMemo(() => {
        return (supplier?.products || []).map(resolveProduct).filter(Boolean);
    }, [supplier?.products, allProducts]);

    /* ── Filtrage achats ─────────────────────────────────────────────────── */
    const allPurchases: any[] = statsData?.purchases || [];

    const filteredPurchases = useMemo(() => {
        if (!filterStartDate && !filterEndDate) return allPurchases;
        return allPurchases.filter((p) => {
            if (!p.createdAt) return false;
            const d = new Date(p.createdAt).toISOString().split('T')[0];
            if (filterStartDate && d < filterStartDate) return false;
            if (filterEndDate   && d > filterEndDate)   return false;
            return true;
        });
    }, [allPurchases, filterStartDate, filterEndDate]);

    const filterDiffDays = filterStartDate && filterEndDate
        ? Math.ceil((new Date(filterEndDate).getTime() - new Date(filterStartDate).getTime()) / 86_400_000) + 1
        : 0;
    const exportDiffDays = exportStartDate && exportEndDate
        ? Math.ceil((new Date(exportEndDate).getTime() - new Date(exportStartDate).getTime()) / 86_400_000) + 1
        : 0;

    /* ── Date helpers ────────────────────────────────────────────────────── */
    const buildQuickDates = (period: string) => {
        const end   = todayStr();
        const start = new Date();
        switch (period) {
            case '1d': start.setDate(start.getDate() - 1);         break;
            case '3d': start.setDate(start.getDate() - 3);         break;
            case '7d': start.setDate(start.getDate() - 7);         break;
            case '1m': start.setMonth(start.getMonth() - 1);       break;
            case '3m': start.setMonth(start.getMonth() - 3);       break;
            case '6m': start.setMonth(start.getMonth() - 6);       break;
            case '1y': start.setFullYear(start.getFullYear() - 1); break;
            default: return null;
        }
        return { start: start.toISOString().split('T')[0], end };
    };
    const applyExportQuick = (k: string) => { const d = buildQuickDates(k); if (!d) return; setExportStartDate(d.start); setExportEndDate(d.end); setExportQuick(k); };
    const applyFilterQuick = (k: string) => { const d = buildQuickDates(k); if (!d) return; setFilterStartDate(d.start); setFilterEndDate(d.end); setFilterQuick(k); };
    const clearFilterDates = () => { setFilterStartDate(''); setFilterEndDate(''); setFilterQuick(''); };

    const handleExport = async (fmt: string) => {
        if (!exportStartDate || !exportEndDate) { toast.error(t('common.required')); return; }
        try {
            const blob = await suppliersApi.exportBilan(supplierId!, { startDate: exportStartDate, endDate: exportEndDate, format: fmt });
            const url  = URL.createObjectURL(blob);
            const a    = document.createElement('a');
            a.href = url; a.download = `bilan-${supplier?.name}-${exportStartDate}-${exportEndDate}.${fmt}`; a.click();
            URL.revokeObjectURL(url);
        } catch { toast.error(t('error.generic')); }
    };

    /* ── Styles ──────────────────────────────────────────────────────────── */
    const quickPeriods = [
        { key: '1d', label: '1j' }, { key: '3d', label: '3j' }, { key: '7d', label: '7j' },
        { key: '1m', label: '1m' }, { key: '3m', label: '3m' }, { key: '6m', label: '6m' },
        { key: '1y', label: '1 an' },
    ];
    const QuickButtons = ({ active, onApply }: { active: string; onApply: (k: string) => void }) => (
        <div className="flex gap-1.5 flex-wrap">
            {quickPeriods.map(({ key, label }) => (
                <button key={key} onClick={() => onApply(key)}
                        className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors border ${
                            active === key
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
                        }`}>{label}
                </button>
            ))}
        </div>
    );
    const dateCls = 'w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500';

    if (supplierLoading) return (
        <div className="h-screen flex items-center justify-center">
            <div className="text-center">
                <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-2" />
                <p className="text-gray-500 text-sm">{t('common.loading')}</p>
            </div>
        </div>
    );

    /* ════════════════════════════════════════════════════════════════════════ */
    return (
        <div className="space-y-4 sm:space-y-6 max-w-3xl mx-auto pb-16 sm:pb-12 px-0" dir={dir}>

            {/* ── Header ── */}
            <div className="flex items-start gap-3 sm:gap-4">
                <button onClick={() => navigate('/suppliers')}
                        className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shrink-0 mt-0.5">
                    <ArrowLeft size={16} className="text-gray-600 dark:text-gray-300" />
                </button>
                <div className="min-w-0">
                    <h1 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white leading-tight truncate">{supplier?.name}</h1>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                        {supplier?.phone   && <span className="flex items-center gap-1 text-xs text-gray-500"><Phone  size={11} />{supplier.phone}</span>}
                        {supplier?.email   && <span className="flex items-center gap-1 text-xs text-gray-500 hidden sm:flex"><Mail   size={11} />{supplier.email}</span>}
                        {supplier?.address && <span className="flex items-center gap-1 text-xs text-gray-500"><MapPin size={11} />{supplier.address}</span>}
                    </div>
                    {supplier?.email && <span className="flex items-center gap-1 text-xs text-gray-500 mt-1 sm:hidden"><Mail size={11} />{supplier.email}</span>}
                </div>
            </div>

            {/* ── Stats ── */}
            {statsLoading ? (
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    {[1,2,3].map(i => <div key={i} className="bg-gray-100 dark:bg-gray-800 rounded-xl h-20 animate-pulse" />)}
                </div>
            ) : (
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    {[
                        { label: 'Total dépensé', value: formatTND(statsData?.stats?.totalSpent || 0), icon: ShoppingBag, color: 'text-blue-600  bg-blue-50  dark:bg-blue-900/20'  },
                        { label: t('sales.paid'), value: formatTND(statsData?.stats?.totalPaid   || 0), icon: TrendingUp,  color: 'text-green-600 bg-green-50 dark:bg-green-900/20' },
                        { label: 'Total dû',      value: formatTND(statsData?.stats?.totalDebt   || 0), icon: TrendingDown, color: 'text-red-600   bg-red-50   dark:bg-red-900/20'   },
                    ].map(({ label, value, icon: Icon, color }) => (
                        <div key={label} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-2.5 sm:p-3 text-center">
                            <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center mx-auto mb-1.5 ${color}`}>
                                <Icon size={14} />
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight line-clamp-1">{label}</p>
                            <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white mt-0.5 truncate">{value}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Produits associés ── ✅ FIX : resolvedProducts avec noms résolus */}
            {resolvedProducts.length > 0 && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 sm:p-4">
                    <h3 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white mb-2 sm:mb-3 flex items-center gap-2">
                        <Package size={14} className="text-gray-400" />
                        {t('products.title')} ({resolvedProducts.length})
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {resolvedProducts.map((p: any, i: number) => (
                            <button
                                key={p._id || i}
                                onClick={() => setSelectedProduct(p)}
                                className="flex items-center gap-1.5 text-xs sm:text-sm bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full transition-colors active:scale-95"
                            >
                                <Package size={11} />
                                <span>{p.name}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Filtre achats ── */}
            <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 rounded-xl p-3 sm:p-4">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs sm:text-sm font-semibold text-blue-800 dark:text-blue-300 flex items-center gap-2">
                        <Filter size={13} /> {t('common.filter')}
                    </h3>
                    {(filterStartDate || filterEndDate) && (
                        <button onClick={clearFilterDates} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">{t('common.reset')}</button>
                    )}
                </div>
                <QuickButtons active={filterQuick} onApply={applyFilterQuick} />
                <div className="grid grid-cols-2 gap-2 sm:gap-3 mt-3">
                    <div>
                        <label className="block text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">{t('common.date')} début</label>
                        <input type="date" value={filterStartDate} max={filterEndDate || todayStr()} onChange={e => { setFilterStartDate(e.target.value); setFilterQuick(''); }} className={dateCls} />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">{t('common.date')} fin</label>
                        <input type="date" value={filterEndDate} min={filterStartDate} max={todayStr()} onChange={e => { setFilterEndDate(e.target.value); setFilterQuick(''); }} className={dateCls} />
                    </div>
                </div>
                {filterStartDate && filterEndDate && (
                    <div className="mt-2 text-xs text-blue-700 dark:text-blue-300 text-center">
                        {format(new Date(filterStartDate), 'dd/MM/yyyy')} → {format(new Date(filterEndDate), 'dd/MM/yyyy')}
                        {' · '}<span className="font-semibold">{filterDiffDays}j</span>
                        {' · '}<span className="font-semibold">{filteredPurchases.length} {t('nav.purchases').toLowerCase()}</span>
                    </div>
                )}
            </div>

            {/* ── Liste des achats ── */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <ShoppingBag size={14} className="text-gray-400" />
                        {t('nav.purchases')}
                        {allPurchases.length > 0 && (
                            <span className="text-xs font-normal text-gray-400">
                                ({filteredPurchases.length}{filterStartDate || filterEndDate ? ` / ${allPurchases.length}` : ''})
                            </span>
                        )}
                    </h3>
                </div>
                {statsLoading ? (
                    <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-14 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />)}</div>
                ) : filteredPurchases.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-xl">
                        <ShoppingBag size={28} className="mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                        <p className="text-xs sm:text-sm text-gray-400">
                            {filterStartDate || filterEndDate ? t('common.noData') : t('clients.noSales')}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {filteredPurchases.map((p: any) => (
                            <button key={p._id} onClick={() => setSelectedPurchase(p)}
                                    className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/10 border border-transparent hover:border-blue-200 dark:hover:border-blue-800 transition-all text-left active:scale-[0.99]">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">{formatTND(p.totalTTC)}</p>
                                        {(p.amountRemaining ?? 0) > 0 && (
                                            <span className="text-xs text-red-500 hidden xs:inline">{t('sales.remaining')}: {formatTND(p.amountRemaining)}</span>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        {p.createdAt ? format(new Date(p.createdAt), 'dd/MM/yyyy') : '—'}
                                        {p.items?.length > 0 && ` · ${p.items.length} art.`}
                                        {(p.amountRemaining ?? 0) > 0 && <span className="text-red-500 xs:hidden"> · -{formatTND(p.amountRemaining)}</span>}
                                    </p>
                                </div>
                                <div className="flex items-center gap-1.5 ms-2 shrink-0">
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusConfig[p.status]?.cls || ''}`}>
                                        {statusConfig[p.status]?.label || p.status}
                                    </span>
                                    <ChevronRight size={13} className="text-gray-400 rtl:rotate-180" />
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Export bilan ── */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 sm:p-4">
                <h3 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Calendar size={14} className="text-gray-400" /> {t('common.export')}
                </h3>
                <QuickButtons active={exportQuick} onApply={applyExportQuick} />
                <div className="grid grid-cols-2 gap-2 sm:gap-3 mt-3 mb-3">
                    <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">{t('common.date')} début</label>
                        <input type="date" value={exportStartDate} max={exportEndDate || todayStr()} onChange={e => { setExportStartDate(e.target.value); setExportQuick(''); }} className={dateCls} />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">{t('common.date')} fin</label>
                        <input type="date" value={exportEndDate} min={exportStartDate} max={todayStr()} onChange={e => { setExportEndDate(e.target.value); setExportQuick(''); }} className={dateCls} />
                    </div>
                </div>
                {exportStartDate && exportEndDate && (
                    <div className="mb-3 px-3 py-2 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                        <p className="text-xs text-gray-600 dark:text-gray-300 text-center">
                            {format(new Date(exportStartDate), 'dd/MM/yyyy')} → {format(new Date(exportEndDate), 'dd/MM/yyyy')}
                            {' · '}<span className="font-semibold">{exportDiffDays} j</span>
                        </p>
                    </div>
                )}
                <div className="flex gap-2">
                    <button onClick={() => handleExport('pdf')} disabled={!exportStartDate || !exportEndDate}
                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 sm:py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-300 dark:disabled:bg-red-900/40 disabled:cursor-not-allowed text-white rounded-lg text-xs font-medium transition-colors">
                        <Download size={13} /> PDF
                    </button>
                    <button onClick={() => handleExport('xlsx')} disabled={!exportStartDate || !exportEndDate}
                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 sm:py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-300 dark:disabled:bg-green-900/40 disabled:cursor-not-allowed text-white rounded-lg text-xs font-medium transition-colors">
                        <Download size={13} /> Excel
                    </button>
                </div>
            </div>

            {/* ══════════════════════════════════════════════════════════════════
                MODAL : Détail produit ── ✅ popup complet avec toutes les infos
            ══════════════════════════════════════════════════════════════════ */}
            {selectedProduct && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm"
                     onClick={() => setSelectedProduct(null)}>
                    <div className="relative bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm shadow-2xl"
                         onClick={e => e.stopPropagation()}>

                        {/* Drag handle mobile */}
                        <div className="w-10 h-1 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mt-3 mb-1 sm:hidden" />

                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                                    <Package size={20} className="text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">{selectedProduct.name}</h3>
                                    <p className="text-xs text-gray-400 mt-0.5">{selectedProduct.unit || '—'}</p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedProduct(null)}
                                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 transition-colors">
                                <X size={16} />
                            </button>
                        </div>

                        {/* Corps */}
                        <div className="px-5 py-3 space-y-0">
                            {[
                                {
                                    icon:  <CreditCard size={15} className="text-blue-400" />,
                                    label: "Prix d'achat HT",
                                    value: formatTND(selectedProduct.purchasePrice || 0),
                                    cls:   'text-gray-900 dark:text-white',
                                },
                                {
                                    icon:  <TrendingUp size={15} className="text-purple-400" />,
                                    label: 'TVA',
                                    value: `${selectedProduct.tva ?? 0} %`,
                                    cls:   'text-gray-900 dark:text-white',
                                },
                                {
                                    icon:  <ShoppingBag size={15} className="text-green-400" />,
                                    label: 'Prix TTC',
                                    value: formatTND((selectedProduct.purchasePrice || 0) * (1 + (selectedProduct.tva || 0) / 100)),
                                    cls:   'text-blue-600 dark:text-blue-400 font-bold',
                                    bold:  true,
                                },
                                ...(selectedProduct.salePrice
                                    ? [{
                                        icon:  <TrendingUp size={15} className="text-emerald-400" />,
                                        label: 'Prix de vente',
                                        value: formatTND(selectedProduct.salePrice),
                                        cls:   'text-emerald-600 dark:text-emerald-400',
                                    }]
                                    : []),
                            ].map(({ icon, label, value, cls, bold }) => (
                                <div key={label} className="flex items-center justify-between py-3 border-b border-gray-50 dark:border-gray-800 last:border-0">
                                    <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">{icon}{label}</span>
                                    <span className={`text-xs sm:text-sm ${bold ? 'font-bold' : 'font-semibold'} ${cls}`}>{value}</span>
                                </div>
                            ))}

                            {/* Stock si disponible */}
                            {selectedProduct.stockQuantity !== undefined && (
                                <div className="flex items-center justify-between py-3">
                                    <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                        <TrendingDown size={15} className="text-orange-400" />Stock
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-xs sm:text-sm font-bold ${
                                            selectedProduct.stockQuantity <= (selectedProduct.stockThreshold || 0)
                                                ? 'text-red-500'
                                                : 'text-green-600 dark:text-green-400'
                                        }`}>
                                            {selectedProduct.stockQuantity} {selectedProduct.unit || ''}
                                        </span>
                                        {selectedProduct.stockQuantity <= (selectedProduct.stockThreshold || 0) && (
                                            <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full">
                                                Stock bas
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Badges info bas */}
                        <div className="px-5 pb-2 flex flex-wrap gap-2">
                            <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-2.5 py-1 rounded-full">
                                Unité : {selectedProduct.unit || '—'}
                            </span>
                            {selectedProduct.createdAt && (
                                <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-2.5 py-1 rounded-full">
                                    Ajouté le {format(new Date(selectedProduct.createdAt), 'dd/MM/yyyy')}
                                </span>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-5 pb-5 pt-2">
                            <button onClick={() => setSelectedProduct(null)}
                                    className="w-full py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors">
                                Fermer
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════════════
                PANEL : Détail d'un achat
            ══════════════════════════════════════════════════════════════════ */}
            {selectedPurchase && (
                <div className="fixed inset-0 z-50 flex items-end sm:justify-end" dir={dir}>
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedPurchase(null)} />
                    <div className="relative w-full sm:w-auto sm:max-w-md sm:h-full bg-white dark:bg-gray-900 shadow-2xl overflow-y-auto rounded-t-2xl sm:rounded-none max-h-[92vh] sm:max-h-full">
                        <div className="w-10 h-1 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mt-3 sm:hidden" />

                        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between z-10 mt-1 sm:mt-0">
                            <div className="flex items-center gap-2 sm:gap-3">
                                <button onClick={() => setSelectedPurchase(null)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                                    <ChevronLeft size={18} className="text-gray-500 rtl:rotate-180" />
                                </button>
                                <div>
                                    <h2 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">{t('sales.invoice')}</h2>
                                    <p className="text-xs text-gray-400">{selectedPurchase.createdAt ? format(new Date(selectedPurchase.createdAt), "dd/MM/yyyy 'à' HH:mm") : '—'}</p>
                                </div>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusConfig[selectedPurchase.status]?.cls || ''}`}>
                                {statusConfig[selectedPurchase.status]?.label || selectedPurchase.status}
                            </span>
                        </div>

                        <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
                            <div className="grid grid-cols-3 gap-2 sm:gap-3">
                                {[
                                    { label: t('sales.totalTTC'), value: formatTND(selectedPurchase.totalTTC),       cls: 'text-blue-600 dark:text-blue-400' },
                                    { label: t('sales.paid'),     value: formatTND(selectedPurchase.amountPaid ?? (selectedPurchase.totalTTC - (selectedPurchase.amountRemaining ?? 0))), cls: 'text-green-600 dark:text-green-400' },
                                    { label: t('sales.remaining'),value: formatTND(selectedPurchase.amountRemaining ?? 0), cls: (selectedPurchase.amountRemaining ?? 0) > 0 ? 'text-red-500 dark:text-red-400' : 'text-gray-400' },
                                ].map(({ label, value, cls }) => (
                                    <div key={label} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-2.5 sm:p-3 text-center">
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 line-clamp-1">{label}</p>
                                        <p className={`text-xs sm:text-sm font-bold ${cls} truncate`}>{value}</p>
                                    </div>
                                ))}
                            </div>

                            {(selectedPurchase.items || []).length > 0 && (
                                <div>
                                    <h3 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                        <Package size={14} className="text-gray-400" />{t('products.title')}
                                    </h3>
                                    <div className="space-y-2">
                                        {(selectedPurchase.items || []).map((item: any, idx: number) => (
                                            <div key={idx} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white truncate">
                                                            {item.productName || item.name || 'Produit'}
                                                        </p>
                                                        <div className="flex items-center gap-2 sm:gap-3 mt-1 flex-wrap">
                                                            <span className="text-xs text-gray-500">{t('sales.quantity')}: <span className="font-medium text-gray-700 dark:text-gray-300">{item.quantity}</span></span>
                                                            <span className="text-xs text-gray-500">{t('sales.unitPrice')}: <span className="font-medium text-gray-700 dark:text-gray-300">{formatTND(item.unitPrice || 0)}</span></span>
                                                            {item.tva > 0 && <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-1.5 py-0.5 rounded-md">{t('products.tva')} {item.tva}%</span>}
                                                        </div>
                                                    </div>
                                                    <div className="text-right shrink-0">
                                                        <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">{formatTND(item.totalTTC || 0)}</p>
                                                        {item.tva > 0 && <p className="text-xs text-gray-400">HT: {formatTND(item.totalHT || 0)}</p>}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 sm:p-4 space-y-2">
                                {selectedPurchase.totalHT != null && <>
                                    <div className="flex justify-between text-xs sm:text-sm text-gray-600 dark:text-gray-400"><span>{t('sales.totalHT')}</span><span>{formatTND(selectedPurchase.totalHT)}</span></div>
                                    <div className="flex justify-between text-xs sm:text-sm text-gray-600 dark:text-gray-400"><span>TVA</span><span>{formatTND(selectedPurchase.totalTTC - selectedPurchase.totalHT)}</span></div>
                                </>}
                                <div className="border-t border-gray-200 dark:border-gray-700 pt-2 flex justify-between text-sm sm:text-base font-bold text-gray-900 dark:text-white">
                                    <span>{t('sales.totalTTC')}</span><span>{formatTND(selectedPurchase.totalTTC)}</span>
                                </div>
                            </div>

                            {(selectedPurchase.payments || []).length > 0 && (
                                <div>
                                    <h3 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                        <CreditCard size={14} className="text-gray-400" />{t('sales.addPayment')}
                                    </h3>
                                    <div className="space-y-2">
                                        {selectedPurchase.payments.map((pmt: any, idx: number) => (
                                            <div key={idx} className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/10 rounded-xl border border-green-100 dark:border-green-900/20">
                                                <div>
                                                    <p className="text-xs text-gray-500">{pmt.date ? format(new Date(pmt.date), "dd/MM/yyyy 'à' HH:mm") : '—'}</p>
                                                    {pmt.note && <p className="text-xs text-gray-400 italic mt-0.5">{pmt.note}</p>}
                                                </div>
                                                <p className="text-xs sm:text-sm font-bold text-green-600 dark:text-green-400">+{formatTND(pmt.amount)}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {selectedPurchase.notes && (
                                <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 rounded-xl p-3 sm:p-4">
                                    <p className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-1">{t('common.notes')}</p>
                                    <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">{selectedPurchase.notes}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SupplierDetailPage;