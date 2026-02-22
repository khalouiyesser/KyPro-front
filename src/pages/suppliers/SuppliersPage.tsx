import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { suppliersApi, productsApi } from '../../api';
import DataTable from '../../components/common/DataTable';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import { useAuth } from '../../context/AuthContext';
import {
  Plus, Pencil, Trash2, Eye, X, Package, Phone, Mail,
  Download, TrendingDown, TrendingUp, ChevronRight, ChevronLeft,
  CreditCard, ShoppingBag, Calendar, AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
const formatTND = (v: number) => `${(v || 0).toFixed(3)} TND`;

const statusConfig: Record<string, { label: string; cls: string }> = {
  paid:    { label: 'Payé',       cls: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  partial: { label: 'Partiel',    cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  pending: { label: 'En attente', cls: 'bg-red-100   text-red-600   dark:bg-red-900/30   dark:text-red-400'   },
};

/* ─── Defaults ────────────────────────────────────────────────────────────── */
const defaultForm        = { name: '', phone: '+216', email: '', address: '', notes: '' };
const defaultProductForm = { name: '', unit: 'unite', purchasePrice: 0, tva: 19 };

/* ═══════════════════════════════════════════════════════════════════════════ */
const SuppliersPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { state: confirmState, confirm, proceed, cancel } = useConfirmDialog();

  /* ── UI state ─────────────────────────────────────────────────────────── */
  const [showForm,        setShowForm]        = useState(false);
  const [editingId,       setEditingId]       = useState<string | null>(null);
  const [form,            setForm]            = useState(defaultForm);
  const [detailSupplier,  setDetailSupplier]  = useState<any>(null);
  const [selectedPurchase, setSelectedPurchase] = useState<any>(null);   // <-- detail achat
  const [showAddProduct,  setShowAddProduct]  = useState(false);
  const [newProductForm,  setNewProductForm]  = useState(defaultProductForm);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [addProductMode,  setAddProductMode]  = useState<'existing' | 'new'>('existing');
  const [exportPeriod,    setExportPeriod]    = useState('month');

  /* ── Auth ─────────────────────────────────────────────────────────────── */
  // L'interface User definit "id: string" (pas "_id")
  const { user } = useAuth();
  const userId: string = user?.id ?? '';

  /* ── Queries ──────────────────────────────────────────────────────────── */
  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ['suppliers'],
    queryFn:  () => suppliersApi.getAll(),
  });

  const { data: allProducts = [] } = useQuery({
    queryKey: ['products'],
    queryFn:  () => productsApi.getAll(),
  });

  // URL corrigee: /suppliers/userId/:userId/fournisseurId/:id/purchases
  const { data: supplierStats, isLoading: isStatsLoading } = useQuery({
    queryKey: ['supplier-stats', detailSupplier?._id, userId],
    queryFn:  () => suppliersApi.getPurchases(detailSupplier._id, userId),
    enabled:  !!detailSupplier?._id && !!userId,
  });

  /* ── Mutations ────────────────────────────────────────────────────────── */
  const createMut = useMutation({
    mutationFn: suppliersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success('Fournisseur cree');
      setShowForm(false);
      setForm(defaultForm);
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: any) => suppliersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success('Fournisseur modifie');
      setShowForm(false);
      setEditingId(null);
      setForm(defaultForm);
    },
  });

  const deleteMut = useMutation({
    mutationFn: suppliersApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success('Fournisseur supprime');
    },
  });

  const addProductMut = useMutation({
    mutationFn: ({ supplierId, productId }: any) => suppliersApi.addProduct(supplierId, productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success('Produit ajoute');
      setShowAddProduct(false);
      setSelectedProductId('');
    },
  });

  const createProductAndAddMut = useMutation({
    mutationFn: async ({ supplierId, productData }: any) => {
      const p = await productsApi.create(productData);
      return suppliersApi.addProduct(supplierId, p._id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success('Produit cree et ajoute');
      setShowAddProduct(false);
      setNewProductForm(defaultProductForm);
    },
  });

  /* ── Handlers ─────────────────────────────────────────────────────────── */
  const handleEdit = (s: any) => {
    setEditingId(s._id);
    setForm({ name: s.name, phone: s.phone || '+216', email: s.email || '', address: s.address || '', notes: s.notes || '' });
    setShowForm(true);
  };

  const handleDelete = (s: any) =>
      confirm(
          {
            title:         `Supprimer "${s.name}"`,
            message:       'Voulez-vous supprimer ce fournisseur et toutes ses donnees ?',
            dangerMessage: 'Toutes les donnees seront supprimees DEFINITIVEMENT.',
            confirmLabel:  'Supprimer definitivement',
          },
          () => deleteMut.mutate(s._id),
      );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) updateMut.mutate({ id: editingId, data: form });
    else           createMut.mutate(form as any);
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
      toast.error("Erreur lors de l'export");
    }
  };

  const closeDetail = () => {
    setDetailSupplier(null);
    setSelectedPurchase(null);
  };

  /* ── Styles ───────────────────────────────────────────────────────────── */
  const inp = 'w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500';

  /* ── Columns ──────────────────────────────────────────────────────────── */
  const columns = [
    {
      key: 'name', header: 'Nom', sortable: true,
      render: (v: string) => <span className="font-medium text-gray-900 dark:text-white">{v}</span>,
    },
    { key: 'phone', header: 'Telephone', sortable: true },
    {
      key: 'email', header: 'Email', sortable: true,
      render: (v: string) => v || <span className="text-gray-400">-</span>,
    },
    {
      key: 'products', header: 'Produits',
      render: (_: any, row: any) => (
          <div className="flex flex-wrap gap-1">
            {(row.products || []).slice(0, 3).map((p: any) => (
                <span key={p._id || p} className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">
              {p.name || p}
            </span>
            ))}
            {(row.products || []).length > 3 && (
                <span className="text-xs text-gray-400">+{(row.products || []).length - 3}</span>
            )}
          </div>
      ),
    },
    {
      key: 'createdAt', header: 'Cree le', sortable: true,
      render: (v: string) => v ? format(new Date(v), 'dd/MM/yyyy') : '-',
    },
  ];

  /* ════════════════════════════════════════════════════════════════════════ */
  return (
      <div className="space-y-6">

        {/* ── En-tete ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Fournisseurs</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              {(suppliers as any[]).length} fournisseur{(suppliers as any[]).length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
              onClick={() => { setEditingId(null); setForm(defaultForm); setShowForm(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors"
          >
            <Plus size={16} /> Nouveau fournisseur
          </button>
        </div>

        {/* ── Tableau ── */}
        <DataTable
            data={suppliers as any[]}
            columns={columns}
            searchKeys={['name', 'phone', 'email']}
            isLoading={isLoading}
            emptyMessage="Aucun fournisseur"
            onRowClick={setDetailSupplier}
            actions={(row) => (
                <div className="flex items-center justify-end gap-1">
                  <button onClick={(e) => { e.stopPropagation(); setDetailSupplier(row); }} className="p-1.5 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg" title="Details"><Eye size={15} /></button>
                  <button onClick={(e) => { e.stopPropagation(); handleEdit(row); }}       className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg" title="Modifier"><Pencil size={15} /></button>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(row); }}     className="p-1.5 text-red-500  hover:bg-red-50  dark:hover:bg-red-900/20  rounded-lg" title="Supprimer"><Trash2 size={15} /></button>
                </div>
            )}
        />

        {/* ══════════════════════════════════════════════════════════════════════
          MODAL : Formulaire fournisseur
      ══════════════════════════════════════════════════════════════════════ */}
        {showForm && (
            <div className="fixed inset-0 z-40 flex items-center justify-center">
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowForm(false)} />
              <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6">
                <button onClick={() => setShowForm(false)} className="absolute top-4 right-4 p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"><X size={18} /></button>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-5">
                  {editingId ? 'Modifier le fournisseur' : 'Nouveau fournisseur'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom <span className="text-red-500">*</span></label>
                      <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required className={inp} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Telephone <span className="text-red-500">*</span></label>
                      <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} required pattern="^\+216[0-9]{8}$" placeholder="+21620000000" className={inp} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                      <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className={inp} />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Adresse</label>
                      <input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} className={inp} />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
                      <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} className={inp + ' resize-none'} />
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Annuler</button>
                    <button type="submit" disabled={createMut.isPending || updateMut.isPending} className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl text-sm font-medium transition-colors">
                      {createMut.isPending || updateMut.isPending ? 'Enregistrement...' : editingId ? 'Modifier' : 'Creer'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
          DRAWER : Detail fournisseur
      ══════════════════════════════════════════════════════════════════════ */}
        {detailSupplier && (
            <div className="fixed inset-0 z-40 flex">
              <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeDetail} />
              <div className="relative ml-auto w-full max-w-xl bg-white dark:bg-gray-900 shadow-2xl overflow-y-auto">

                {/* Header sticky */}
                <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-6 py-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">{detailSupplier.name}</h2>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="flex items-center gap-1 text-xs text-gray-500"><Phone size={11} />{detailSupplier.phone}</span>
                      {detailSupplier.email && <span className="flex items-center gap-1 text-xs text-gray-500"><Mail size={11} />{detailSupplier.email}</span>}
                    </div>
                  </div>
                  <button onClick={closeDetail} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"><X size={20} /></button>
                </div>

                <div className="p-6 space-y-6">

                  {/* Alerte session */}
                  {!userId && (
                      <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-3 text-sm text-amber-700 dark:text-amber-400">
                        <AlertCircle size={16} className="shrink-0 mt-0.5" />
                        <span>Impossible de charger les achats : session expiree, veuillez vous reconnecter.</span>
                      </div>
                  )}

                  {/* ── Solde ── */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-xl p-4 text-center">
                      <TrendingDown size={20} className="text-red-500 mx-auto mb-1.5" />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total du (je dois)</p>
                      <p className="text-lg font-bold text-red-600 dark:text-red-400">
                        {isStatsLoading ? <span className="inline-block w-24 h-5 bg-red-200 dark:bg-red-800 rounded animate-pulse" /> : formatTND(supplierStats?.totalDebt || 0)}
                      </p>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/20 rounded-xl p-4 text-center">
                      <TrendingUp size={20} className="text-green-500 mx-auto mb-1.5" />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total paye</p>
                      <p className="text-lg font-bold text-green-600 dark:text-green-400">
                        {isStatsLoading ? <span className="inline-block w-24 h-5 bg-green-200 dark:bg-green-800 rounded animate-pulse" /> : formatTND(supplierStats?.totalPaid || 0)}
                      </p>
                    </div>
                  </div>

                  {/* ── Produits ── */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                        Produits <span className="text-gray-400 font-normal">({(detailSupplier.products || []).length})</span>
                      </h3>
                      <button onClick={() => setShowAddProduct(true)} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline">
                        <Plus size={12} /> Ajouter
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(detailSupplier.products || []).map((p: any) => (
                          <span key={p._id || p} className="flex items-center gap-1.5 text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800 px-3 py-1 rounded-full">
                      <Package size={11} />{p.name || p}
                    </span>
                      ))}
                      {(detailSupplier.products || []).length === 0 && (
                          <p className="text-sm text-gray-400">Aucun produit associe</p>
                      )}
                    </div>
                  </div>

                  {/* ══════════════════════════════════════════════════════════════
                  LISTE DES ACHATS — cliquable comme dans ClientsPage
              ══════════════════════════════════════════════════════════════ */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <ShoppingBag size={15} className="text-gray-400" />
                        Achats
                        {(supplierStats?.recentPurchases || []).length > 0 && (
                            <span className="text-xs font-normal text-gray-400">
                        ({(supplierStats?.recentPurchases || []).length} au total)
                      </span>
                        )}
                      </h3>
                    </div>

                    {isStatsLoading ? (
                        <div className="space-y-2">
                          {[1, 2, 3].map(i => (
                              <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
                          ))}
                        </div>
                    ) : !userId ? (
                        <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-xl">
                          <AlertCircle size={28} className="mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                          <p className="text-sm text-gray-400">Connexion requise</p>
                        </div>
                    ) : (supplierStats?.recentPurchases || []).length === 0 ? (
                        <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-xl">
                          <ShoppingBag size={28} className="mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                          <p className="text-sm text-gray-400">Aucun achat enregistre pour ce fournisseur</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                          {(supplierStats?.recentPurchases || []).map((p: any) => (
                              <button
                                  key={p._id}
                                  onClick={() => setSelectedPurchase(p)}
                                  className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/10 border border-transparent hover:border-blue-200 dark:hover:border-blue-800 transition-all text-left group"
                              >
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{formatTND(p.totalTTC)}</p>
                                    {(p.amountRemaining ?? (p.totalTTC - (p.amountPaid || 0))) > 0 && (
                                        <span className="text-xs text-red-500 dark:text-red-400">
                                Reste : {formatTND(p.amountRemaining ?? (p.totalTTC - (p.amountPaid || 0)))}
                              </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-gray-400 mt-0.5">
                                    {p.createdAt ? format(new Date(p.createdAt), 'dd/MM/yyyy') : '-'}
                                    {p.items?.length > 0 && ` · ${p.items.length} article${p.items.length > 1 ? 's' : ''}`}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2 ml-3 shrink-0">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusConfig[p.status]?.cls || 'bg-gray-100 text-gray-600'}`}>
                            {statusConfig[p.status]?.label || p.status}
                          </span>
                                  <ChevronRight size={14} className="text-gray-400 group-hover:text-blue-500 transition-colors" />
                                </div>
                              </button>
                          ))}
                        </div>
                    )}
                  </div>

                  {/* ── Export bilan ── */}
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <Calendar size={14} className="text-gray-400" />
                      Exporter le bilan
                    </h3>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {[
                        { key: 'day',      label: 'Jour' },
                        { key: 'week',     label: 'Semaine' },
                        { key: 'month',    label: 'Mois' },
                        { key: 'quarter',  label: 'Trimestre' },
                        { key: 'semester', label: 'Semestre' },
                        { key: 'year',     label: 'Annee' },
                      ].map(({ key, label }) => (
                          <button
                              key={key}
                              onClick={() => setExportPeriod(key)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors border ${
                                  exportPeriod === key
                                      ? 'bg-blue-600 text-white border-blue-600'
                                      : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
                              }`}
                          >
                            {label}
                          </button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleExport('pdf')}  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-600   hover:bg-red-700   text-white rounded-lg text-xs font-medium transition-colors"><Download size={13} />PDF</button>
                      <button onClick={() => handleExport('xlsx')} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-medium transition-colors"><Download size={13} />Excel</button>
                    </div>
                  </div>

                </div>
              </div>
            </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
          PANEL : Detail d'un achat (slide depuis la droite, au-dessus du drawer)
      ══════════════════════════════════════════════════════════════════════ */}
        {selectedPurchase && (
            <div className="fixed inset-0 z-50 flex">
              <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedPurchase(null)} />
              <div className="relative ml-auto w-full max-w-md bg-white dark:bg-gray-900 shadow-2xl overflow-y-auto">

                {/* Header */}
                <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                        onClick={() => setSelectedPurchase(null)}
                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    >
                      <ChevronLeft size={18} className="text-gray-500" />
                    </button>
                    <div>
                      <h2 className="text-base font-bold text-gray-900 dark:text-white">Detail de l'achat</h2>
                      <p className="text-xs text-gray-400">
                        {selectedPurchase.createdAt ? format(new Date(selectedPurchase.createdAt), "dd/MM/yyyy 'a' HH:mm") : '-'}
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusConfig[selectedPurchase.status]?.cls || 'bg-gray-100 text-gray-600'}`}>
                {statusConfig[selectedPurchase.status]?.label || selectedPurchase.status}
              </span>
                </div>

                <div className="p-6 space-y-5">

                  {/* Resumer financier */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'Total TTC', value: formatTND(selectedPurchase.totalTTC),       cls: 'text-blue-600  dark:text-blue-400'  },
                      { label: 'Paye',      value: formatTND(selectedPurchase.amountPaid ?? (selectedPurchase.totalTTC - (selectedPurchase.amountRemaining ?? 0))), cls: 'text-green-600 dark:text-green-400' },
                      {
                        label: 'Restant',
                        value: formatTND(selectedPurchase.amountRemaining ?? (selectedPurchase.totalTTC - (selectedPurchase.amountPaid ?? 0))),
                        cls: (selectedPurchase.amountRemaining ?? 0) > 0 ? 'text-red-500 dark:text-red-400' : 'text-gray-400',
                      },
                    ].map(({ label, value, cls }) => (
                        <div key={label} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-center">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</p>
                          <p className={`text-sm font-bold ${cls}`}>{value}</p>
                        </div>
                    ))}
                  </div>

                  {/* Produits de l'achat */}
                  {(selectedPurchase.items || []).length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                          <Package size={15} className="text-gray-400" />
                          Produits achetes
                        </h3>
                        <div className="space-y-2">
                          {(selectedPurchase.items || []).map((item: any, idx: number) => (
                              <div key={idx} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                      {item.productName || item.name || 'Produit'}
                                    </p>
                                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                                      <span className="text-xs text-gray-500">Qte : <span className="font-medium text-gray-700 dark:text-gray-300">{item.quantity}</span></span>
                                      <span className="text-xs text-gray-500">P.U. : <span className="font-medium text-gray-700 dark:text-gray-300">{formatTND(item.unitPrice || item.purchasePrice || 0)}</span></span>
                                      {item.tva > 0 && (
                                          <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-1.5 py-0.5 rounded-md">TVA {item.tva}%</span>
                                      )}
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
                  {(selectedPurchase.totalHT != null || selectedPurchase.totalTTC != null) && (
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 space-y-2">
                        {selectedPurchase.totalHT != null && (
                            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                              <span>Total HT</span><span>{formatTND(selectedPurchase.totalHT)}</span>
                            </div>
                        )}
                        {selectedPurchase.totalHT != null && selectedPurchase.totalTTC != null && (
                            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                              <span>TVA</span><span>{formatTND(selectedPurchase.totalTTC - selectedPurchase.totalHT)}</span>
                            </div>
                        )}
                        <div className="border-t border-gray-200 dark:border-gray-700 pt-2 flex justify-between text-base font-bold text-gray-900 dark:text-white">
                          <span>Total TTC</span><span>{formatTND(selectedPurchase.totalTTC)}</span>
                        </div>
                      </div>
                  )}

                  {/* Historique paiements */}
                  {(selectedPurchase.payments || []).length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                          <CreditCard size={15} className="text-gray-400" />
                          Historique des paiements
                        </h3>
                        <div className="space-y-2">
                          {selectedPurchase.payments.map((pmt: any, idx: number) => (
                              <div key={idx} className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/10 rounded-xl border border-green-100 dark:border-green-900/20">
                                <div>
                                  <p className="text-xs text-gray-500">
                                    {pmt.date ? format(new Date(pmt.date), "dd/MM/yyyy 'a' HH:mm") : '-'}
                                  </p>
                                  {pmt.note && <p className="text-xs text-gray-400 italic mt-0.5">{pmt.note}</p>}
                                </div>
                                <p className="text-sm font-bold text-green-600 dark:text-green-400">+{formatTND(pmt.amount)}</p>
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

        {/* ══════════════════════════════════════════════════════════════════════
          MODAL : Ajouter un produit au fournisseur
      ══════════════════════════════════════════════════════════════════════ */}
        {showAddProduct && detailSupplier && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAddProduct(false)} />
              <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
                <button onClick={() => setShowAddProduct(false)} className="absolute top-4 right-4 p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"><X size={18} /></button>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Ajouter un produit a {detailSupplier.name}
                </h3>
                <div className="flex gap-2 mb-4">
                  <button onClick={() => setAddProductMode('existing')} className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${addProductMode === 'existing' ? 'bg-blue-600 text-white' : 'border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>Produit existant</button>
                  <button onClick={() => setAddProductMode('new')}      className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${addProductMode === 'new'      ? 'bg-blue-600 text-white' : 'border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>Nouveau produit</button>
                </div>

                {addProductMode === 'existing' ? (
                    <div className="space-y-3">
                      <select value={selectedProductId} onChange={e => setSelectedProductId(e.target.value)} className={inp}>
                        <option value="">Selectionner un produit</option>
                        {(allProducts as any[]).map((p: any) => <option key={p._id} value={p._id}>{p.name}</option>)}
                      </select>
                      <button
                          onClick={() => { if (selectedProductId) addProductMut.mutate({ supplierId: detailSupplier._id, productId: selectedProductId }); }}
                          disabled={!selectedProductId || addProductMut.isPending}
                          className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl text-sm font-medium transition-colors"
                      >
                        {addProductMut.isPending ? 'Ajout...' : "Confirmer l'ajout"}
                      </button>
                    </div>
                ) : (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Nom du produit <span className="text-red-500">*</span></label>
                        <input value={newProductForm.name} onChange={e => setNewProductForm(f => ({ ...f, name: e.target.value }))} className={inp} />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Unite</label>
                          <input value={newProductForm.unit} onChange={e => setNewProductForm(f => ({ ...f, unit: e.target.value }))} className={inp} />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">TVA %</label>
                          <input type="number" value={newProductForm.tva} onChange={e => setNewProductForm(f => ({ ...f, tva: +e.target.value }))} className={inp} />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Prix d'achat</label>
                          <input type="number" step="0.001" value={newProductForm.purchasePrice} onChange={e => setNewProductForm(f => ({ ...f, purchasePrice: +e.target.value }))} className={inp} />
                        </div>
                      </div>
                      <button
                          onClick={() => { if (newProductForm.name) createProductAndAddMut.mutate({ supplierId: detailSupplier._id, productData: { ...newProductForm, supplierIds: [detailSupplier._id] } }); }}
                          disabled={!newProductForm.name || createProductAndAddMut.isPending}
                          className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl text-sm font-medium transition-colors"
                      >
                        {createProductAndAddMut.isPending ? 'Creation...' : 'Creer et ajouter'}
                      </button>
                    </div>
                )}
              </div>
            </div>
        )}

        <ConfirmDialog {...confirmState} onProceed={proceed} onCancel={cancel} />
      </div>
  );
};

export default SuppliersPage;