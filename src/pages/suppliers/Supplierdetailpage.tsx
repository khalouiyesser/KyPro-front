import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { suppliersApi } from '../../api';
import {
    ArrowLeft, Phone, Mail, MapPin, TrendingDown, TrendingUp, CreditCard, Download,
    Package, ChevronRight, ChevronLeft, Calendar, Filter, Plus, ShoppingBag,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { useAuth } from '../../context/AuthContext';

const formatTND = (v: number) => `${(v || 0).toFixed(3)} TND`;
const todayStr = () => new Date().toISOString().split('T')[0];

const statusConfig: Record<string, { label: string; cls: string }> = {
    paid:    { label: 'Payé',       cls: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
    partial: { label: 'Partiel',    cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
    pending: { label: 'En attente', cls: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' },
};

const SupplierDetailPage: React.FC = () => {
    const { supplierId } = useParams<{ supplierId: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const userId: string = user?.id ?? '';

    const [selectedPurchase,  setSelectedPurchase]  = useState<any>(null);
    const [exportStartDate,   setExportStartDate]   = useState('');
    const [exportEndDate,     setExportEndDate]     = useState('');
    const [exportQuick,       setExportQuick]       = useState('');
    const [filterStartDate,   setFilterStartDate]   = useState('');
    const [filterEndDate,     setFilterEndDate]     = useState('');
    const [filterQuick,       setFilterQuick]       = useState('');

    const { data: supplier, isLoading: supplierLoading } = useQuery({
        queryKey: ['supplier-detail', supplierId],
        queryFn:  () => suppliersApi.getOne(supplierId!),
        enabled:  !!supplierId,
    });

    const { data: supplierStats, isLoading: statsLoading } = useQuery({
        queryKey: ['supplier-stats', supplierId, userId],
        queryFn:  () => suppliersApi.getPurchases(supplierId!, userId),
        enabled:  !!supplierId && !!userId,
    });

    // Réinitialiser les états quand le supplierId change
    useEffect(() => {
        setSelectedPurchase(null);
        setExportStartDate('');
        setExportEndDate('');
        setExportQuick('');
        setFilterStartDate('');
        setFilterEndDate('');
        setFilterQuick('');
    }, [supplierId]);

    const filteredPurchases = useMemo(() => {
        const purchases: any[] = supplierStats?.recentPurchases || [];
        if (!filterStartDate && !filterEndDate) return purchases;
        return purchases.filter((p) => {
            if (!p.createdAt) return false;
            const d = new Date(p.createdAt).toISOString().split('T')[0];
            if (filterStartDate && d < filterStartDate) return false;
            if (filterEndDate   && d > filterEndDate)   return false;
            return true;
        });
    }, [supplierStats?.recentPurchases, filterStartDate, filterEndDate]);

    const filterDiffDays = filterStartDate && filterEndDate
        ? Math.ceil((new Date(filterEndDate).getTime() - new Date(filterStartDate).getTime()) / 86_400_000) + 1
        : 0;

    const exportDiffDays = exportStartDate && exportEndDate
        ? Math.ceil((new Date(exportEndDate).getTime() - new Date(exportStartDate).getTime()) / 86_400_000) + 1
        : 0;

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

    const applyExportQuick = (period: string) => {
        const dates = buildQuickDates(period);
        if (!dates) return;
        setExportStartDate(dates.start);
        setExportEndDate(dates.end);
        setExportQuick(period);
    };

    const applyFilterQuick = (period: string) => {
        const dates = buildQuickDates(period);
        if (!dates) return;
        setFilterStartDate(dates.start);
        setFilterEndDate(dates.end);
        setFilterQuick(period);
    };

    const clearFilterDates = () => {
        setFilterStartDate('');
        setFilterEndDate('');
        setFilterQuick('');
    };

    const handleExport = async (fmt: string) => {
        if (!exportStartDate || !exportEndDate) {
            toast.error('Veuillez sélectionner une période');
            return;
        }
        try {
            const blob = await suppliersApi.exportBilan(supplierId!, {
                startDate: exportStartDate,
                endDate:   exportEndDate,
                format:    fmt,
            });
            const url = URL.createObjectURL(blob);
            const a   = document.createElement('a');
            a.href     = url;
            a.download = `bilan-${supplier?.name}-${exportStartDate}-${exportEndDate}.${fmt}`;
            a.click();
            URL.revokeObjectURL(url);
        } catch {
            toast.error("Erreur lors de l'export");
        }
    };

    const QuickButtons = ({ active, onApply }: { active: string; onApply: (k: string) => void }) => (
        <div className="flex gap-1.5 flex-wrap">
            {[
                { key: '1d', label: '1j' },
                { key: '3d', label: '3j' },
                { key: '7d', label: '7j' },
                { key: '1m', label: '1m' },
                { key: '3m', label: '3m' },
                { key: '6m', label: '6m' },
                { key: '1y', label: '1 an' },
            ].map(({ key, label }) => (
                <button
                    key={key}
                    onClick={() => onApply(key)}
                    className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors border ${
                        active === key
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
                    }`}
                >
                    {label}
                </button>
            ))}
        </div>
    );

    const dateCls = 'w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500';

    if (supplierLoading) {
        return (
            <div className="h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-gray-500">Chargement...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-3xl mx-auto pb-12">

            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/suppliers')}
                    className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    title="Retour aux fournisseurs"
                >
                    <ArrowLeft size={18} className="text-gray-600 dark:text-gray-300" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{supplier?.name}</h1>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                        {supplier?.phone   && <span className="flex items-center gap-1 text-xs text-gray-500"><Phone  size={11} />{supplier.phone}</span>}
                        {supplier?.email   && <span className="flex items-center gap-1 text-xs text-gray-500"><Mail   size={11} />{supplier.email}</span>}
                        {supplier?.address && <span className="flex items-center gap-1 text-xs text-gray-500"><MapPin size={11} />{supplier.address}</span>}
                    </div>
                </div>
            </div>

            {/* Stats */}
            {statsLoading ? (
                <div className="grid grid-cols-2 gap-3">
                    {[1, 2].map(i => <div key={i} className="bg-gray-100 dark:bg-gray-800 rounded-xl h-20 animate-pulse" />)}
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-xl p-4 text-center">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-2 bg-red-100 dark:bg-red-900/30">
                            <TrendingDown size={16} className="text-red-600" />
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Total dû (je dois)</p>
                        <p className="text-sm font-bold text-red-600 dark:text-red-400 mt-0.5">{formatTND(supplierStats?.totalDebt || 0)}</p>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/20 rounded-xl p-4 text-center">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-2 bg-green-100 dark:bg-green-900/30">
                            <TrendingUp size={16} className="text-green-600" />
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Total payé</p>
                        <p className="text-sm font-bold text-green-600 dark:text-green-400 mt-0.5">{formatTND(supplierStats?.totalPaid || 0)}</p>
                    </div>
                </div>
            )}

            {/* Produits associés */}
            {(supplier?.products || []).length > 0 && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <Package size={15} className="text-gray-400" />
                        Produits ({(supplier?.products || []).length})
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {(supplier?.products || []).map((p: any) => (
                            <span key={p._id || p} className="flex items-center gap-1.5 text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800 px-3 py-1 rounded-full">
                <Package size={11} />{p.name || p}
              </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Filtre date achats */}
            <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-300 flex items-center gap-2">
                        <Filter size={14} />
                        Filtrer les achats par date
                    </h3>
                    {(filterStartDate || filterEndDate) && (
                        <button onClick={clearFilterDates} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
                            Réinitialiser
                        </button>
                    )}
                </div>
                <QuickButtons active={filterQuick} onApply={applyFilterQuick} />
                <div className="grid grid-cols-2 gap-3 mt-3">
                    <div>
                        <label className="block text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">Début</label>
                        <input type="date" value={filterStartDate} max={filterEndDate || todayStr()} onChange={e => { setFilterStartDate(e.target.value); setFilterQuick(''); }} className={dateCls} />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">Fin</label>
                        <input type="date" value={filterEndDate} min={filterStartDate} max={todayStr()} onChange={e => { setFilterEndDate(e.target.value); setFilterQuick(''); }} className={dateCls} />
                    </div>
                </div>
                {filterStartDate && filterEndDate && (
                    <div className="mt-2 text-xs text-blue-700 dark:text-blue-300 text-center">
                        Affichage du{' '}
                        <span className="font-semibold">{format(new Date(filterStartDate), 'dd/MM/yyyy')}</span>
                        {' au '}
                        <span className="font-semibold">{format(new Date(filterEndDate), 'dd/MM/yyyy')}</span>
                        {' · '}
                        <span className="font-semibold">{filterDiffDays} jour{filterDiffDays > 1 ? 's' : ''}</span>
                        {' · '}
                        <span className="font-semibold">{filteredPurchases.length} achat{filteredPurchases.length !== 1 ? 's' : ''}</span>
                    </div>
                )}
            </div>

            {/* Liste achats */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <ShoppingBag size={15} className="text-gray-400" />
                        Achats
                        {(supplierStats?.recentPurchases || []).length > 0 && (
                            <span className="ml-1 text-xs font-normal text-gray-400">
                ({filteredPurchases.length}{filterStartDate || filterEndDate ? ` / ${(supplierStats?.recentPurchases || []).length}` : ''} au total)
              </span>
                        )}
                    </h3>
                </div>
                {statsLoading ? (
                    <div className="space-y-2">
                        {[1, 2, 3].map(i => <div key={i} className="h-14 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />)}
                    </div>
                ) : filteredPurchases.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-xl">
                        <ShoppingBag size={32} className="mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                        <p className="text-sm text-gray-400">
                            {filterStartDate || filterEndDate ? 'Aucun achat sur cette période' : 'Aucun achat enregistré'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {filteredPurchases.map((p: any) => (
                            <button
                                key={p._id}
                                onClick={() => setSelectedPurchase(p)}
                                className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/10 border border-transparent hover:border-blue-200 dark:hover:border-blue-800 transition-all text-left"
                            >
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{formatTND(p.totalTTC)}</p>
                                        {(p.amountRemaining ?? (p.totalTTC - (p.amountPaid || 0))) > 0 && (
                                            <span className="text-xs text-red-500">Reste : {formatTND(p.amountRemaining ?? (p.totalTTC - (p.amountPaid || 0)))}</span>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        {p.createdAt ? format(new Date(p.createdAt), 'dd/MM/yyyy') : '—'}
                                        {p.items?.length > 0 && ` · ${p.items.length} article${p.items.length > 1 ? 's' : ''}`}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 ml-3 shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusConfig[p.status]?.cls || ''}`}>
                    {statusConfig[p.status]?.label || p.status}
                  </span>
                                    <ChevronRight size={14} className="text-gray-400" />
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Export bilan */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Calendar size={15} className="text-gray-400" />
                    Exporter le bilan
                </h3>
                <QuickButtons active={exportQuick} onApply={applyExportQuick} />
                <div className="grid grid-cols-2 gap-3 mt-3 mb-3">
                    <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Date de début</label>
                        <input type="date" value={exportStartDate} max={exportEndDate || todayStr()} onChange={e => { setExportStartDate(e.target.value); setExportQuick(''); }} className={dateCls} />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Date de fin</label>
                        <input type="date" value={exportEndDate} min={exportStartDate} max={todayStr()} onChange={e => { setExportEndDate(e.target.value); setExportQuick(''); }} className={dateCls} />
                    </div>
                </div>
                {exportStartDate && exportEndDate && (
                    <div className="mb-4 px-3 py-2 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                        <p className="text-xs text-gray-600 dark:text-gray-300 text-center">
                            <span className="font-semibold">{format(new Date(exportStartDate), 'dd/MM/yyyy')}</span>
                            {' → '}
                            <span className="font-semibold">{format(new Date(exportEndDate), 'dd/MM/yyyy')}</span>
                            {' · '}
                            <span className="font-semibold">{exportDiffDays} jour{exportDiffDays > 1 ? 's' : ''}</span>
                        </p>
                    </div>
                )}
                <div className="flex gap-2">
                    <button onClick={() => handleExport('pdf')} disabled={!exportStartDate || !exportEndDate} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-300 dark:disabled:bg-red-900/40 disabled:cursor-not-allowed text-white rounded-lg text-xs font-medium transition-colors">
                        <Download size={14} /> PDF
                    </button>
                    <button onClick={() => handleExport('xlsx')} disabled={!exportStartDate || !exportEndDate} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-300 dark:disabled:bg-green-900/40 disabled:cursor-not-allowed text-white rounded-lg text-xs font-medium transition-colors">
                        <Download size={14} /> Excel
                    </button>
                </div>
            </div>

            {/* Panel détail achat */}
            {selectedPurchase && (
                <div className="fixed inset-0 z-50 flex">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedPurchase(null)} />
                    <div className="relative ml-auto w-full max-w-md bg-white dark:bg-gray-900 shadow-2xl overflow-y-auto">

                        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-6 py-4 flex items-center justify-between z-10">
                            <div className="flex items-center gap-3">
                                <button onClick={() => setSelectedPurchase(null)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                                    <ChevronLeft size={18} className="text-gray-500" />
                                </button>
                                <div>
                                    <h2 className="text-base font-bold text-gray-900 dark:text-white">Détail de l'achat</h2>
                                    <p className="text-xs text-gray-400">
                                        {selectedPurchase.createdAt ? format(new Date(selectedPurchase.createdAt), "dd/MM/yyyy 'à' HH:mm") : '—'}
                                    </p>
                                </div>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusConfig[selectedPurchase.status]?.cls || ''}`}>
                {statusConfig[selectedPurchase.status]?.label || selectedPurchase.status}
              </span>
                        </div>

                        <div className="p-6 space-y-5">
                            {/* Résumé financier */}
                            <div className="grid grid-cols-3 gap-3">
                                {[
                                    { label: 'Total TTC', value: formatTND(selectedPurchase.totalTTC),       cls: 'text-blue-600' },
                                    { label: 'Payé',      value: formatTND(selectedPurchase.amountPaid ?? (selectedPurchase.totalTTC - (selectedPurchase.amountRemaining ?? 0))), cls: 'text-green-600' },
                                    { label: 'Restant',   value: formatTND(selectedPurchase.amountRemaining ?? (selectedPurchase.totalTTC - (selectedPurchase.amountPaid ?? 0))), cls: (selectedPurchase.amountRemaining ?? 0) > 0 ? 'text-red-500' : 'text-gray-400' },
                                ].map(({ label, value, cls }) => (
                                    <div key={label} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-center">
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</p>
                                        <p className={`text-sm font-bold ${cls}`}>{value}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Produits */}
                            {(selectedPurchase.items || []).length > 0 && (
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                        <Package size={15} className="text-gray-400" />
                                        Produits achetés
                                    </h3>
                                    <div className="space-y-2">
                                        {(selectedPurchase.items || []).map((item: any, idx: number) => (
                                            <div key={idx} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{item.productName || item.name || 'Produit'}</p>
                                                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                                                            <span className="text-xs text-gray-500">Qté : <span className="font-medium text-gray-700 dark:text-gray-300">{item.quantity}</span></span>
                                                            <span className="text-xs text-gray-500">P.U. : <span className="font-medium text-gray-700 dark:text-gray-300">{formatTND(item.unitPrice || item.purchasePrice || 0)}</span></span>
                                                            {item.tva > 0 && <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-1.5 py-0.5 rounded-md">TVA {item.tva}%</span>}
                                                        </div>
                                                    </div>
                                                    <div className="text-right shrink-0">
                                                        <p className="text-sm font-bold text-gray-900 dark:text-white">{formatTND(item.totalTTC || item.total || 0)}</p>
                                                        {item.tva > 0 && <p className="text-xs text-gray-400">HT : {formatTND(item.totalHT || 0)}</p>}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Totaux */}
                            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 space-y-2">
                                {selectedPurchase.totalHT != null && (
                                    <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400"><span>Total HT</span><span>{formatTND(selectedPurchase.totalHT)}</span></div>
                                )}
                                {selectedPurchase.totalHT != null && (
                                    <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400"><span>TVA</span><span>{formatTND(selectedPurchase.totalTTC - selectedPurchase.totalHT)}</span></div>
                                )}
                                <div className="border-t border-gray-200 dark:border-gray-700 pt-2 flex justify-between text-base font-bold text-gray-900 dark:text-white">
                                    <span>Total TTC</span><span>{formatTND(selectedPurchase.totalTTC)}</span>
                                </div>
                            </div>

                            {/* Historique paiements */}
                            {(selectedPurchase.payments || []).length > 0 && (
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                        <CreditCard size={15} className="text-gray-400" />
                                        Historique des paiements
                                    </h3>
                                    <div className="space-y-2">
                                        {selectedPurchase.payments.map((p: any, idx: number) => (
                                            <div key={idx} className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/10 rounded-xl border border-green-100 dark:border-green-900/20">
                                                <div>
                                                    <p className="text-xs text-gray-500">{p.date ? format(new Date(p.date), "dd/MM/yyyy 'à' HH:mm") : '—'}</p>
                                                    {p.note && <p className="text-xs text-gray-400 italic mt-0.5">{p.note}</p>}
                                                </div>
                                                <p className="text-sm font-bold text-green-600 dark:text-green-400">+{formatTND(p.amount)}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Notes */}
                            {selectedPurchase.notes && (
                                <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 rounded-xl p-4">
                                    <p className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-1">Notes</p>
                                    <p className="text-sm text-gray-700 dark:text-gray-300">{selectedPurchase.notes}</p>
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