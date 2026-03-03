import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { suppliersApi, productsApi } from '../../api';
import DataTable from '../../components/common/DataTable';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';
import {
    Plus, Pencil, Trash2, Eye, X, Package, Phone, Mail,
    Download, TrendingDown, TrendingUp, ChevronRight, ChevronLeft,
    CreditCard, ShoppingBag, Calendar, AlertCircle, Check,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
const formatTND = (v: number) => `${(v || 0).toFixed(3)} TND`;

const getProductName = (p: any): string => {
    if (!p) return '';
    if (typeof p === 'string') return p;
    if (typeof p === 'object') return p.name || p['name'] || p._id?.toString() || '';
    return String(p.name);
};

const getProductId = (p: any): string => {
    if (!p) return '';
    if (typeof p === 'string') return p;
    if (typeof p === 'object') return p._id?.toString() || '';
    return String(p);
};

/* ─── Defaults ────────────────────────────────────────────────────────────── */
const defaultForm = { name: '', phone: '+216', email: '', address: '', notes: '' };
const defaultNewProductForm = { name: '', unit: 'unité', purchasePrice: 0, tva: 19 };

type QuickProduct = { name: string; unit: string; purchasePrice: number; tva: number };

/* ═══════════════════════════════════════════════════════════════════════════ */
const SuppliersPage: React.FC = () => {
    const queryClient = useQueryClient();
    const navigate    = useNavigate();
    const { state: confirmState, confirm, proceed, cancel } = useConfirmDialog();
    const { user } = useAuth();
    const userId: string = user?.id ?? '';
    const { t, dir } = useI18n();

    /* ── Status config ─────────────────────────────────────────────────────── */
    const statusConfig: Record<string, { label: string; cls: string }> = {
        paid:    { label: t('sales.status.paid'),    cls: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
        partial: { label: t('sales.status.partial'), cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
        pending: { label: t('sales.status.pending'), cls: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' },
    };

    /* ── UI state ─────────────────────────────────────────────────────────── */
    const [showForm,            setShowForm]            = useState(false);
    const [editingId,           setEditingId]           = useState<string | null>(null);
    const [form,                setForm]                = useState(defaultForm);
    const [selectedExistingIds, setSelectedExistingIds] = useState<string[]>([]);
    const [quickProducts,       setQuickProducts]       = useState<QuickProduct[]>([]);
    const [newProductForm,      setNewProductForm]      = useState(defaultNewProductForm);
    const [productTab,          setProductTab]          = useState<'existing' | 'new'>('existing');
    const [productSearch,       setProductSearch]       = useState('');
    const [detailSupplier,      setDetailSupplier]      = useState<any>(null);
    const [selectedPurchase,    setSelectedPurchase]    = useState<any>(null);
    const [selectedProduct,     setSelectedProduct]     = useState<any>(null);
    const [showAddProduct,      setShowAddProduct]      = useState(false);
    const [addProductMode,      setAddProductMode]      = useState<'existing' | 'new'>('existing');
    const [addExistingId,       setAddExistingId]       = useState('');
    const [addNewForm,          setAddNewForm]          = useState(defaultNewProductForm);
    const [exportPeriod,        setExportPeriod]        = useState('month');

    /* ── Queries ──────────────────────────────────────────────────────────── */
    const { data: suppliers = [], isLoading } = useQuery({
        queryKey: ['suppliers'],
        queryFn:  () => suppliersApi.getAll(),
    });

    const { data: allProducts = [] } = useQuery({
        queryKey: ['products'],
        queryFn:  () => productsApi.getAll(),
    });

    const { data: supplierStats, isLoading: isStatsLoading } = useQuery({
        queryKey: ['supplier-stats', detailSupplier?._id, userId],
        queryFn:  () => suppliersApi.getPurchases(detailSupplier._id, userId),
        enabled:  !!detailSupplier?._id && !!userId,
    });

    const drawerPurchases: any[] = supplierStats?.purchases || [];

    /* ── Helper : résoudre le nom d'un produit depuis allProducts ─────────── */
    const resolveProductName = (p: any): string => {
        if (!p) return '';
        // Si c'est un objet populé avec un nom → on l'utilise directement
        if (typeof p === 'object' && p.name) return p.name;
        // Sinon c'est un ID string → on cherche dans allProducts
        const id = typeof p === 'string' ? p : p._id?.toString();
        const found = (allProducts as any[]).find((x: any) => x._id === id);
        return found?.name || id || '';
    };

    /* ── Mutations ────────────────────────────────────────────────────────── */
    const createMut = useMutation({
        mutationFn: async (data: any) => {
            const { _selectedExistingIds = [], _quickProducts = [], ...supplierData } = data;
            const supplier = await suppliersApi.create(supplierData);
            for (const productId of _selectedExistingIds) {
                await suppliersApi.addProduct(supplier._id, productId);
            }
            for (const qp of _quickProducts) {
                await productsApi.create({ ...qp, supplierIds: [supplier._id] });
            }
            return supplier;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['suppliers'] });
            queryClient.invalidateQueries({ queryKey: ['products'] });
            toast.success(t('nav.suppliers'));
            closeCreateForm();
        },
        onError: (err: any) => {
            console.error('[createMut] Erreur création fournisseur:', err);
            toast.error(err?.response?.data?.message || t('error.generic'));
        },
    });

    const updateMut = useMutation({
        mutationFn: ({ id, data }: any) => suppliersApi.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['suppliers'] });
            toast.success(t('common.edit'));
            setShowForm(false);
            setEditingId(null);
            setForm(defaultForm);
        },
    });

    const deleteMut = useMutation({
        mutationFn: suppliersApi.remove,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['suppliers'] });
            toast.success(t('common.delete'));
        },
    });

    const addExistingMut = useMutation({
        mutationFn: ({ supplierId, productId }: any) => suppliersApi.addProduct(supplierId, productId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['suppliers'] });
            toast.success(t('products.title'));
            setShowAddProduct(false);
            setAddExistingId('');
        },
    });

    const addNewMut = useMutation({
        mutationFn: async ({ supplierId, productData }: any) => {
            const p = await productsApi.create({ ...productData, supplierIds: [supplierId] });
            return suppliersApi.addProduct(supplierId, p._id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            queryClient.invalidateQueries({ queryKey: ['suppliers'] });
            toast.success(t('products.new'));
            setShowAddProduct(false);
            setAddNewForm(defaultNewProductForm);
        },
    });

    /* ── Handlers ─────────────────────────────────────────────────────────── */
    const closeCreateForm = () => {
        setShowForm(false);
        setEditingId(null);
        setForm(defaultForm);
        setSelectedExistingIds([]);
        setQuickProducts([]);
        setNewProductForm(defaultNewProductForm);
        setProductSearch('');
    };

    const handleEdit = (s: any) => {
        setEditingId(s._id);
        setForm({ name: s.name, phone: s.phone || '+216', email: s.email || '', address: s.address || '', notes: s.notes || '' });
        setSelectedExistingIds([]);
        setQuickProducts([]);
        setShowForm(true);
    };

    const handleDelete = (s: any) =>
        confirm(
            {
                title:         `${t('common.delete')} "${s.name}"`,
                message:       'Voulez-vous supprimer ce fournisseur et toutes ses données ?',
                dangerMessage: 'Toutes les données seront supprimées DÉFINITIVEMENT.',
                confirmLabel:  t('common.delete'),
            },
            () => deleteMut.mutate(s._id),
        );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingId) {
            updateMut.mutate({ id: editingId, data: form });
        } else {
            createMut.mutate({
                ...form,
                _selectedExistingIds: selectedExistingIds,
                _quickProducts: quickProducts,
            });
        }
    };

    const toggleExistingProduct = (id: string) => {
        setSelectedExistingIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id],
        );
    };

    const addQuickProduct = () => {
        if (!newProductForm.name.trim()) return;
        setQuickProducts(prev => [...prev, { ...newProductForm }]);
        setNewProductForm(defaultNewProductForm);
    };

    const handleExport = async (fmt: string) => {
        try {
            const blob = await suppliersApi.exportBilan(detailSupplier._id, { period: exportPeriod, format: fmt });
            const url  = URL.createObjectURL(blob);
            const a    = document.createElement('a');
            a.href     = url;
            a.download = `bilan-fournisseur-${detailSupplier.name}.${fmt}`;
            a.click();
            URL.revokeObjectURL(url);
        } catch {
            toast.error(t('error.generic'));
        }
    };

    const closeDetail = () => { setDetailSupplier(null); setSelectedPurchase(null); };

    /* ── Styles ───────────────────────────────────────────────────────────── */
    const inp = 'w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500';

    const filteredProducts = (allProducts as any[]).filter((p: any) =>
        getProductName(p).toLowerCase().includes(productSearch.toLowerCase()),
    );

    /* ── Columns ─────────────────────────────────────────────────────────── */
    const columns = [
        {
            key: 'name', header: t('common.name'), sortable: true,
            render: (v: string, row: any) => (
                <div>
                    <span className="font-medium text-gray-900 dark:text-white">{v}</span>
                    {row.phone && <p className="text-xs text-gray-400 sm:hidden mt-0.5">{row.phone}</p>}
                </div>
            ),
        },
        { key: 'phone', header: t('common.phone'), sortable: true, className: 'hidden sm:table-cell' },
        {
            key: 'email', header: t('common.email'), sortable: true, className: 'hidden md:table-cell',
            render: (v: string) => v || <span className="text-gray-400">-</span>,
        },
        {
            key: 'products', header: t('products.title'), className: 'hidden sm:table-cell',
            render: (_: any, row: any) => (
                <div className="flex flex-wrap gap-1">
                    {(row.products || []).slice(0, 2).map((p: any, i: number) => {
                        const productId = getProductId(p);
                        // ✅ FIX : résoudre le nom depuis allProducts si p est un ID string
                        const name = resolveProductName(p);
                        return (
                            <span key={productId || i} className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">
                                {name}
                            </span>
                        );
                    })}
                    {(row.products || []).length > 2 && (
                        <span className="text-xs text-gray-400">+{(row.products || []).length - 2}</span>
                    )}
                </div>
            ),
        },
        {
            key: 'createdAt', header: t('common.date'), sortable: true, className: 'hidden lg:table-cell',
            render: (v: string) => v ? format(new Date(v), 'dd/MM/yyyy') : '-',
        },
    ];

    /* ════════════════════════════════════════════════════════════════════════ */
    return (
        <div className="space-y-4 sm:space-y-6" dir={dir}>

            {/* ── En-tête ── */}
            <div className="flex items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{t('nav.suppliers')}</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">
                        {(suppliers as any[]).length} {t('nav.suppliers').toLowerCase()}
                    </p>
                </div>
                <button
                    onClick={() => { setEditingId(null); setForm(defaultForm); setShowForm(true); }}
                    className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-medium transition-colors shrink-0"
                >
                    <Plus size={15} />
                    <span className="hidden xs:inline">{t('nav.suppliers')}</span>
                    <span className="xs:hidden">{t('common.create')}</span>
                </button>
            </div>

            {/* ── Tableau ── */}
            <DataTable
                data={suppliers as any[]}
                columns={columns}
                searchKeys={['name', 'phone', 'email']}
                isLoading={isLoading}
                emptyMessage={t('common.noData')}
                onRowClick={(row) => navigate(`/suppliers/${row._id}`)}
                actions={(row) => (
                    <div className="flex items-center justify-end gap-1">
                        <button onClick={(e) => { e.stopPropagation(); navigate(`/suppliers/${row._id}`); }} className="p-1.5 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg"><Eye size={15} /></button>
                        <button onClick={(e) => { e.stopPropagation(); handleEdit(row); }}    className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"><Pencil size={15} /></button>
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(row); }} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"><Trash2 size={15} /></button>
                    </div>
                )}
            />

            {/* ══════════════════════════════════════════════════════════════════
                MODAL : Formulaire fournisseur
            ══════════════════════════════════════════════════════════════════ */}
            {showForm && (
                <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center" dir={dir}>
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeCreateForm} />
                    <div className="relative bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-2xl mx-0 sm:mx-4 max-h-[94vh] overflow-y-auto">

                        <div className="w-10 h-1 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mt-3 sm:hidden" />

                        <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between rounded-t-2xl sm:rounded-t-2xl">
                            <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                                {editingId ? t('common.edit') : t('nav.suppliers')}
                            </h2>
                            <button onClick={closeCreateForm} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"><X size={18} /></button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-5">

                            <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
                                <div className="col-span-1 xs:col-span-2">
                                    <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('common.name')} <span className="text-red-500">*</span></label>
                                    <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required className={inp} placeholder={t('nav.suppliers')} />
                                </div>
                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('common.phone')} <span className="text-red-500">*</span></label>
                                    <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} required pattern="^\+216[0-9]{8}$" placeholder="+21620000000" className={inp} />
                                </div>
                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('common.email')}</label>
                                    <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className={inp} />
                                </div>
                                <div className="col-span-1 xs:col-span-2">
                                    <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Adresse</label>
                                    <input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} className={inp} />
                                </div>
                                <div className="col-span-1 xs:col-span-2">
                                    <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('common.notes')}</label>
                                    <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} className={inp + ' resize-none'} />
                                </div>
                            </div>

                            {/* ── Section Produits (création uniquement) ── */}
                            {!editingId && (
                                <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                                    <div className="bg-gray-50 dark:bg-gray-800 px-3 sm:px-4 py-3 flex items-center justify-between">
                                        <span className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                            <Package size={14} className="text-blue-500" />
                                            {t('products.title')}
                                            {(selectedExistingIds.length + quickProducts.length) > 0 && (
                                                <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full">
                                                    {selectedExistingIds.length + quickProducts.length}
                                                </span>
                                            )}
                                        </span>
                                        <span className="text-xs text-gray-400">{t('common.optional')}</span>
                                    </div>

                                    <div className="flex border-b border-gray-200 dark:border-gray-700">
                                        {(['existing', 'new'] as const).map((tab) => (
                                            <button
                                                key={tab}
                                                type="button"
                                                onClick={() => setProductTab(tab)}
                                                className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
                                                    productTab === tab
                                                        ? 'text-blue-600 border-b-2 border-blue-600 bg-white dark:bg-gray-900'
                                                        : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 bg-gray-50 dark:bg-gray-800'
                                                }`}
                                            >
                                                {tab === 'existing' ? t('products.title') : t('products.new')}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="p-3 sm:p-4">
                                        {productTab === 'existing' && (
                                            <div className="space-y-3">
                                                <input
                                                    type="text"
                                                    placeholder={t('common.search')}
                                                    value={productSearch}
                                                    onChange={e => setProductSearch(e.target.value)}
                                                    className={inp}
                                                />
                                                <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
                                                    {filteredProducts.length === 0 ? (
                                                        <p className="text-sm text-gray-400 text-center py-4">{t('common.noData')}</p>
                                                    ) : filteredProducts.map((p: any) => {
                                                        const selected = selectedExistingIds.includes(p._id);
                                                        return (
                                                            <button
                                                                key={p._id}
                                                                type="button"
                                                                onClick={() => toggleExistingProduct(p._id)}
                                                                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all border ${
                                                                    selected
                                                                        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300'
                                                                        : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-blue-200 dark:hover:border-blue-800'
                                                                }`}
                                                            >
                                                                <div className="flex items-center gap-2 min-w-0">
                                                                    <Package size={12} className={selected ? 'text-blue-500' : 'text-gray-400'} />
                                                                    <span className="truncate font-medium text-xs sm:text-sm">{p.name}</span>
                                                                    <span className="text-xs text-gray-400 shrink-0">{p.unit}</span>
                                                                </div>
                                                                <div className="flex items-center gap-1.5 shrink-0 ms-2">
                                                                    <span className="text-xs text-gray-400 hidden xs:inline">{(p.purchasePrice || 0).toFixed(3)} TND</span>
                                                                    {selected && <Check size={13} className="text-blue-500" />}
                                                                </div>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                                {selectedExistingIds.length > 0 && (
                                                    <p className="text-xs text-blue-600 dark:text-blue-400">
                                                        ✓ {selectedExistingIds.length} {t('products.title').toLowerCase()}
                                                    </p>
                                                )}
                                            </div>
                                        )}

                                        {productTab === 'new' && (
                                            <div className="space-y-3">
                                                {quickProducts.length > 0 && (
                                                    <div className="space-y-1 mb-2">
                                                        {quickProducts.map((qp, idx) => (
                                                            <div key={idx} className="flex items-center justify-between px-3 py-2 bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/20 rounded-lg">
                                                                <div className="flex items-center gap-2 text-xs sm:text-sm text-green-700 dark:text-green-400 min-w-0">
                                                                    <Package size={12} />
                                                                    <span className="font-medium truncate">{qp.name}</span>
                                                                    <span className="text-xs text-gray-400 shrink-0 hidden xs:inline">{qp.unit} · {qp.purchasePrice.toFixed(3)} TND</span>
                                                                </div>
                                                                <button type="button" onClick={() => setQuickProducts(prev => prev.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-600 shrink-0 ms-2">
                                                                    <X size={13} />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 space-y-2 border border-dashed border-gray-200 dark:border-gray-700">
                                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">{t('products.new')}</p>
                                                    <input
                                                        placeholder={`${t('common.name')} *`}
                                                        value={newProductForm.name}
                                                        onChange={e => setNewProductForm(f => ({ ...f, name: e.target.value }))}
                                                        className={inp}
                                                    />
                                                    <div className="grid grid-cols-3 gap-2">
                                                        <input placeholder={t('products.unit')} value={newProductForm.unit} onChange={e => setNewProductForm(f => ({ ...f, unit: e.target.value }))} className={inp} />
                                                        <input type="number" step="0.001" min="0" placeholder={t('products.purchasePrice').split(' ')[0]} value={newProductForm.purchasePrice} onChange={e => setNewProductForm(f => ({ ...f, purchasePrice: +e.target.value }))} className={inp} />
                                                        <input type="number" min="0" placeholder={t('products.tva')} value={newProductForm.tva} onChange={e => setNewProductForm(f => ({ ...f, tva: +e.target.value }))} className={inp} />
                                                    </div>
                                                    <button type="button" onClick={addQuickProduct} disabled={!newProductForm.name.trim()} className="w-full flex items-center justify-center gap-2 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-xl text-xs sm:text-sm font-medium transition-colors">
                                                        <Plus size={13} /> {t('common.create')}
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Récapitulatif produits */}
                            {!editingId && (selectedExistingIds.length + quickProducts.length) > 0 && (
                                <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20 rounded-xl p-3">
                                    <p className="text-xs font-medium text-blue-700 dark:text-blue-400 mb-2">
                                        {selectedExistingIds.length + quickProducts.length} {t('products.title').toLowerCase()}
                                    </p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {selectedExistingIds.map(id => {
                                            const p = (allProducts as any[]).find((x: any) => x._id === id);
                                            return p ? (
                                                <span key={id} className="text-xs bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">{p.name}</span>
                                            ) : null;
                                        })}
                                        {quickProducts.map((qp, i) => (
                                            <span key={`new-${i}`} className="text-xs bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full">✦ {qp.name}</span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-3 pt-1">
                                <button type="button" onClick={closeCreateForm} className="flex-1 px-4 py-2.5 sm:py-2 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-xs sm:text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                    {t('common.cancel')}
                                </button>
                                <button type="submit" disabled={createMut.isPending || updateMut.isPending} className="flex-1 px-4 py-2.5 sm:py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl text-xs sm:text-sm font-medium transition-colors">
                                    {createMut.isPending || updateMut.isPending ? t('common.loading') : editingId ? t('common.edit') : t('common.create')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════════════
                DRAWER : Détail fournisseur
            ══════════════════════════════════════════════════════════════════ */}
            {detailSupplier && (
                <div className="fixed inset-0 z-40 flex items-end sm:justify-end" dir={dir}>
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeDetail} />
                    <div className="relative w-full sm:w-auto sm:max-w-xl sm:h-full bg-white dark:bg-gray-900 shadow-2xl overflow-y-auto rounded-t-2xl sm:rounded-none max-h-[92vh] sm:max-h-full">

                        <div className="w-10 h-1 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mt-3 sm:hidden" />

                        <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between mt-1 sm:mt-0">
                            <div>
                                <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">{detailSupplier.name}</h2>
                                <div className="flex items-center gap-2 sm:gap-3 mt-0.5 flex-wrap">
                                    <span className="flex items-center gap-1 text-xs text-gray-500"><Phone size={10} />{detailSupplier.phone}</span>
                                    {detailSupplier.email && <span className="flex items-center gap-1 text-xs text-gray-500 hidden xs:flex"><Mail size={10} />{detailSupplier.email}</span>}
                                </div>
                            </div>
                            <button onClick={closeDetail} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"><X size={18} /></button>
                        </div>

                        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                            {!userId && (
                                <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-3 text-xs sm:text-sm text-amber-700 dark:text-amber-400">
                                    <AlertCircle size={15} className="shrink-0 mt-0.5" />
                                    <span>Session expirée.</span>
                                </div>
                            )}

                            {/* Stats */}
                            <div className="grid grid-cols-3 gap-2 sm:gap-3">
                                <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20 rounded-xl p-3 sm:p-4 text-center">
                                    <ShoppingBag size={16} className="text-blue-500 mx-auto mb-1" />
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Total dépensé</p>
                                    <p className="text-xs sm:text-sm font-bold text-blue-600 dark:text-blue-400">
                                        {isStatsLoading ? <span className="inline-block w-16 h-4 bg-blue-200 dark:bg-blue-800 rounded animate-pulse" /> : formatTND(supplierStats?.stats?.totalSpent || 0)}
                                    </p>
                                </div>
                                <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-xl p-3 sm:p-4 text-center">
                                    <TrendingDown size={16} className="text-red-500 mx-auto mb-1" />
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Total dû</p>
                                    <p className="text-xs sm:text-sm font-bold text-red-600 dark:text-red-400">
                                        {isStatsLoading ? <span className="inline-block w-16 h-4 bg-red-200 dark:bg-red-800 rounded animate-pulse" /> : formatTND(supplierStats?.stats?.totalDebt || 0)}
                                    </p>
                                </div>
                                <div className="bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/20 rounded-xl p-3 sm:p-4 text-center">
                                    <TrendingUp size={16} className="text-green-500 mx-auto mb-1" />
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{t('sales.paid')}</p>
                                    <p className="text-xs sm:text-sm font-bold text-green-600 dark:text-green-400">
                                        {isStatsLoading ? <span className="inline-block w-16 h-4 bg-green-200 dark:bg-green-800 rounded animate-pulse" /> : formatTND(supplierStats?.stats?.totalPaid || 0)}
                                    </p>
                                </div>
                            </div>

                            {/* Produits du drawer — ✅ FIX aussi ici */}
                            <div>
                                <div className="flex items-center justify-between mb-2 sm:mb-3">
                                    <h3 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
                                        {t('products.title')} ({(detailSupplier.products || []).length})
                                    </h3>
                                    <button onClick={() => setShowAddProduct(true)} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline">
                                        <Plus size={11} /> {t('common.create')}
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                                    {(detailSupplier.products || []).map((p: any, i: number) => {
                                        const name = resolveProductName(p);
                                        // Pour le clic détail, on résout aussi l'objet complet
                                        const resolvedObj = typeof p === 'object' && p.name
                                            ? p
                                            : (allProducts as any[]).find((x: any) => x._id === getProductId(p));
                                        return (
                                            <button
                                                key={getProductId(p) || i}
                                                onClick={() => resolvedObj ? setSelectedProduct(resolvedObj) : null}
                                                className="flex items-center gap-1.5 text-xs sm:text-sm bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full transition-colors cursor-pointer active:scale-95"
                                            >
                                                <Package size={11} />
                                                <span>{name}</span>
                                            </button>
                                        );
                                    })}
                                    {(detailSupplier.products || []).length === 0 && (
                                        <p className="text-xs text-gray-400">{t('common.noData')}</p>
                                    )}
                                </div>
                            </div>

                            {/* Achats */}
                            <div>
                                <div className="flex items-center justify-between mb-2 sm:mb-3">
                                    <h3 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                        <ShoppingBag size={14} className="text-gray-400" />
                                        {t('nav.purchases')}
                                        {drawerPurchases.length > 0 && (
                                            <span className="text-xs font-normal text-gray-400">({drawerPurchases.length})</span>
                                        )}
                                    </h3>
                                </div>
                                {isStatsLoading ? (
                                    <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-14 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />)}</div>
                                ) : drawerPurchases.length === 0 ? (
                                    <div className="text-center py-6 bg-gray-50 dark:bg-gray-800 rounded-xl">
                                        <ShoppingBag size={24} className="mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                                        <p className="text-xs sm:text-sm text-gray-400">{t('clients.noSales')}</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {drawerPurchases.map((p: any) => (
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
                                                        {p.createdAt ? format(new Date(p.createdAt), 'dd/MM/yyyy') : '-'}
                                                        {p.items?.length > 0 && ` · ${p.items.length} art.`}
                                                        {(p.amountRemaining ?? 0) > 0 && <span className="text-red-500 xs:hidden"> · -{formatTND(p.amountRemaining)}</span>}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-1.5 ms-2 shrink-0">
                                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusConfig[p.status]?.cls || 'bg-gray-100 text-gray-600'}`}>
                                                        {statusConfig[p.status]?.label || p.status}
                                                    </span>
                                                    <ChevronRight size={13} className="text-gray-400 rtl:rotate-180" />
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Export */}
                            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 sm:p-4">
                                <h3 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                    <Calendar size={13} className="text-gray-400" /> {t('common.export')}
                                </h3>
                                <div className="flex flex-wrap gap-1.5 mb-3">
                                    {[{key:'day',label:'J'},{key:'week',label:'7j'},{key:'month',label:'1m'},{key:'quarter',label:'3m'},{key:'semester',label:'6m'},{key:'year',label:'1an'}].map(({key,label}) => (
                                        <button key={key} onClick={() => setExportPeriod(key)}
                                                className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors border ${exportPeriod===key?'bg-blue-600 text-white border-blue-600':'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'}`}>
                                            {label}
                                        </button>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => handleExport('pdf')}  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 sm:py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-medium transition-colors"><Download size={12} />PDF</button>
                                    <button onClick={() => handleExport('xlsx')} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 sm:py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-medium transition-colors"><Download size={12} />Excel</button>
                                </div>
                            </div>
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

                        <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between mt-1 sm:mt-0">
                            <div className="flex items-center gap-2 sm:gap-3">
                                <button onClick={() => setSelectedPurchase(null)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"><ChevronLeft size={17} className="text-gray-500 rtl:rotate-180" /></button>
                                <div>
                                    <h2 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">{t('sales.invoice')}</h2>
                                    <p className="text-xs text-gray-400">{selectedPurchase.createdAt ? format(new Date(selectedPurchase.createdAt), "dd/MM/yyyy 'à' HH:mm") : '-'}</p>
                                </div>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusConfig[selectedPurchase.status]?.cls || 'bg-gray-100 text-gray-600'}`}>
                                {statusConfig[selectedPurchase.status]?.label || selectedPurchase.status}
                            </span>
                        </div>

                        <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
                            <div className="grid grid-cols-3 gap-2 sm:gap-3">
                                {[
                                    { label: t('sales.totalTTC'), value: formatTND(selectedPurchase.totalTTC), cls: 'text-blue-600 dark:text-blue-400' },
                                    { label: t('sales.paid'),     value: formatTND(selectedPurchase.amountPaid ?? (selectedPurchase.totalTTC - (selectedPurchase.amountRemaining ?? 0))), cls: 'text-green-600 dark:text-green-400' },
                                    { label: t('sales.remaining'),value: formatTND(selectedPurchase.amountRemaining ?? (selectedPurchase.totalTTC - (selectedPurchase.amountPaid ?? 0))), cls: (selectedPurchase.amountRemaining ?? 0) > 0 ? 'text-red-500 dark:text-red-400' : 'text-gray-400' },
                                ].map(({ label, value, cls }) => (
                                    <div key={label} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-2.5 sm:p-3 text-center">
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 line-clamp-1">{label}</p>
                                        <p className={`text-xs sm:text-sm font-bold ${cls} truncate`}>{value}</p>
                                    </div>
                                ))}
                            </div>

                            {(selectedPurchase.items || []).length > 0 && (
                                <div>
                                    <h3 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2"><Package size={14} className="text-gray-400" />{t('products.title')}</h3>
                                    <div className="space-y-2">
                                        {(selectedPurchase.items || []).map((item: any, idx: number) => (
                                            <div key={idx} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white truncate">{item.productName || item.name || 'Produit'}</p>
                                                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                            <span className="text-xs text-gray-500">{t('sales.quantity')}: <span className="font-medium">{item.quantity}</span></span>
                                                            <span className="text-xs text-gray-500">{t('sales.unitPrice')}: <span className="font-medium">{formatTND(item.unitPrice || item.purchasePrice || 0)}</span></span>
                                                            {item.tva > 0 && <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-1.5 py-0.5 rounded-md">{t('products.tva')} {item.tva}%</span>}
                                                        </div>
                                                    </div>
                                                    <div className="text-right shrink-0">
                                                        <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">{formatTND(item.totalTTC || item.total || 0)}</p>
                                                        {item.tva > 0 && <p className="text-xs text-gray-400">HT: {formatTND(item.totalHT || 0)}</p>}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 sm:p-4 space-y-2">
                                {selectedPurchase.totalHT != null && <div className="flex justify-between text-xs sm:text-sm text-gray-600 dark:text-gray-400"><span>{t('sales.totalHT')}</span><span>{formatTND(selectedPurchase.totalHT)}</span></div>}
                                {selectedPurchase.totalHT != null && <div className="flex justify-between text-xs sm:text-sm text-gray-600 dark:text-gray-400"><span>TVA</span><span>{formatTND(selectedPurchase.totalTTC - selectedPurchase.totalHT)}</span></div>}
                                <div className="border-t border-gray-200 dark:border-gray-700 pt-2 flex justify-between text-sm sm:text-base font-bold text-gray-900 dark:text-white">
                                    <span>{t('sales.totalTTC')}</span><span>{formatTND(selectedPurchase.totalTTC)}</span>
                                </div>
                            </div>

                            {(selectedPurchase.payments || []).length > 0 && (
                                <div>
                                    <h3 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2"><CreditCard size={14} className="text-gray-400" />{t('sales.addPayment')}</h3>
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

            {/* ══════════════════════════════════════════════════════════════════
                MODAL : Ajouter un produit depuis le drawer
            ══════════════════════════════════════════════════════════════════ */}
            {showAddProduct && detailSupplier && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" dir={dir}>
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAddProduct(false)} />
                    <div className="relative bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md mx-0 sm:mx-4 p-4 sm:p-6">
                        <div className="w-10 h-1 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-4 sm:hidden" />
                        <button onClick={() => setShowAddProduct(false)} className="absolute top-4 right-4 p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"><X size={17} /></button>
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
                            {t('products.new')} — {detailSupplier.name}
                        </h3>
                        <div className="flex gap-2 mb-3 sm:mb-4">
                            <button onClick={() => setAddProductMode('existing')} className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors ${addProductMode==='existing'?'bg-blue-600 text-white':'border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>{t('products.title')}</button>
                            <button onClick={() => setAddProductMode('new')}      className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors ${addProductMode==='new'     ?'bg-blue-600 text-white':'border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>{t('products.new')}</button>
                        </div>

                        {addProductMode === 'existing' ? (
                            <div className="space-y-3">
                                <select value={addExistingId} onChange={e => setAddExistingId(e.target.value)} className={inp}>
                                    <option value="">{t('common.search')}</option>
                                    {(allProducts as any[]).map((p: any) => <option key={p._id} value={p._id}>{p.name}</option>)}
                                </select>
                                <button onClick={() => { if (addExistingId) addExistingMut.mutate({ supplierId: detailSupplier._id, productId: addExistingId }); }} disabled={!addExistingId || addExistingMut.isPending}
                                        className="w-full py-2.5 sm:py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl text-xs sm:text-sm font-medium transition-colors">
                                    {addExistingMut.isPending ? t('common.loading') : t('common.confirm')}
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{t('common.name')} <span className="text-red-500">*</span></label>
                                    <input value={addNewForm.name} onChange={e => setAddNewForm(f => ({ ...f, name: e.target.value }))} className={inp} />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{t('products.unit')}</label>
                                        <input value={addNewForm.unit} onChange={e => setAddNewForm(f => ({ ...f, unit: e.target.value }))} className={inp} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{t('products.tva')}</label>
                                        <input type="number" value={addNewForm.tva} onChange={e => setAddNewForm(f => ({ ...f, tva: +e.target.value }))} className={inp} />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{t('products.purchasePrice')}</label>
                                        <input type="number" step="0.001" value={addNewForm.purchasePrice} onChange={e => setAddNewForm(f => ({ ...f, purchasePrice: +e.target.value }))} className={inp} />
                                    </div>
                                </div>
                                <button onClick={() => { if (addNewForm.name) addNewMut.mutate({ supplierId: detailSupplier._id, productData: addNewForm }); }} disabled={!addNewForm.name || addNewMut.isPending}
                                        className="w-full py-2.5 sm:py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl text-xs sm:text-sm font-medium transition-colors">
                                    {addNewMut.isPending ? t('common.loading') : t('common.create')}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <ConfirmDialog {...confirmState} onProceed={proceed} onCancel={cancel} />

            {/* ── Modal détail produit ── */}
            {selectedProduct && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setSelectedProduct(null)}>
                    <div className="relative bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="w-10 h-1 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mt-3 sm:hidden" />
                        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-100 dark:border-gray-800">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                    <Package size={18} className="text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">{selectedProduct.name}</h3>
                                    <p className="text-xs text-gray-400">{t('products.title')}</p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedProduct(null)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 transition-colors">✕</button>
                        </div>
                        <div className="p-4 sm:p-5 space-y-1">
                            {[
                                { icon: <CreditCard size={14} className="text-blue-400" />, label: t('products.purchasePrice') || "Prix d'achat", value: formatTND(selectedProduct.purchasePrice || 0) },
                                { icon: <TrendingUp size={14} className="text-green-400" />, label: 'TVA', value: `${selectedProduct.tva ?? 0} %` },
                                { icon: <ShoppingBag size={14} className="text-purple-400" />, label: 'Prix TTC', value: formatTND((selectedProduct.purchasePrice || 0) * (1 + (selectedProduct.tva || 0) / 100)), bold: true, color: 'text-blue-600 dark:text-blue-400' },
                                { icon: <Package size={14} className="text-orange-400" />, label: t('products.unit') || 'Unité', value: selectedProduct.unit || '—' },
                            ].map(({ icon, label, value, bold, color }) => (
                                <div key={label} className="flex items-center justify-between py-2.5 border-b border-gray-50 dark:border-gray-800 last:border-0">
                                    <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">{icon}{label}</span>
                                    <span className={`text-xs sm:text-sm font-${bold ? 'bold' : 'semibold'} ${color || 'text-gray-900 dark:text-white'}`}>{value}</span>
                                </div>
                            ))}
                            {selectedProduct.stockQuantity !== undefined && (
                                <div className="flex items-center justify-between py-2.5">
                                    <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2"><TrendingDown size={14} className="text-red-400" />{t('stock.quantity') || 'Stock'}</span>
                                    <span className={`text-xs sm:text-sm font-bold ${selectedProduct.stockQuantity <= (selectedProduct.stockThreshold || 0) ? 'text-red-500' : 'text-green-600 dark:text-green-400'}`}>
                                        {selectedProduct.stockQuantity} {selectedProduct.unit || ''}
                                        {selectedProduct.stockQuantity <= (selectedProduct.stockThreshold || 0) && <span className="ml-2 text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">Stock bas</span>}
                                    </span>
                                </div>
                            )}
                        </div>
                        <div className="px-4 sm:px-5 pb-5">
                            <button onClick={() => setSelectedProduct(null)} className="w-full py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors">
                                {t('common.close') || 'Fermer'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SuppliersPage;