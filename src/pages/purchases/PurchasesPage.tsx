import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { purchasesApi, suppliersApi, productsApi } from '../../api';
import DataTable from '../../components/common/DataTable';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import { useI18n } from '../../context/I18nContext';
import {
  Plus, Trash2, CreditCard, X, Eye, FileText, Download,
  Package, ChevronRight, ChevronLeft,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const formatTND = (v: number) => `${(v || 0).toFixed(3)} TND`;

const PAYMENT_METHODS = [
  { value: 'cash',     label: 'payment.cash' },
  { value: 'virement', label: 'payment.virement' },
  { value: 'cheque',   label: 'payment.cheque' },
  { value: 'online',   label: 'payment.online' },
];

const PurchasesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { state: confirmState, confirm, proceed, cancel } = useConfirmDialog();
  const { t, dir } = useI18n();

  const [showForm,             setShowForm]             = useState(false);
  const [showPayment,          setShowPayment]          = useState<any>(null);
  const [detailPurchase,       setDetailPurchase]       = useState<any>(null);
  const [selectedItem,         setSelectedItem]         = useState<any>(null);
  const [payAmount,            setPayAmount]            = useState('');
  const [payMethod,            setPayMethod]            = useState('cash');
  const [payNote,              setPayNote]              = useState('');
  const [showAddSupplierForm,  setShowAddSupplierForm]  = useState(false);
  const [newSupplierForm,      setNewSupplierForm]      = useState({ name: '', phone: '+216' });

  const emptyItem = () => ({ productId: '', productName: '', quantity: 1, unitPrice: 0, tva: 19 });
  const [form, setForm] = useState({
    FournisseurId: '',
    items: [emptyItem()],
    initialPayment: 0,
    paymentMethod: 'cash',
    notes: '',
  });

  /* ── Queries ─────────────────────────────────────────────────────────── */
  const { data: purchases = [], isLoading } = useQuery({
    queryKey: ['purchases'],
    queryFn:  () => purchasesApi.getAll(),
  });
  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers'],
    queryFn:  () => suppliersApi.getAll(),
  });
  const { data: allProducts = [] } = useQuery({
    queryKey: ['products'],
    queryFn:  () => productsApi.getAll(),
  });
  const { data: purchaseDetail } = useQuery({
    queryKey: ['purchase-detail', detailPurchase?._id],
    queryFn:  () => purchasesApi.getOne(detailPurchase._id),
    enabled:  !!detailPurchase?._id,
  });

  /* ── Produits filtrés par fournisseur ────────────────────────────────── */
  const selectedSupplier = (suppliers as any[]).find((s: any) => s._id === form.FournisseurId);
  const supplierProductIds: string[] = (selectedSupplier?.products || []).map((p: any) =>
      typeof p === 'string' ? p : p._id?.toString()
  );
  const supplierProducts = form.FournisseurId
      ? (allProducts as any[]).filter((p: any) => supplierProductIds.includes(p._id))
      : (allProducts as any[]);

  /* ── Status config ───────────────────────────────────────────────────── */
  const statusConfig: Record<string, { label: string; cls: string }> = {
    paid:    { label: t('sales.status.paid'),    cls: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
    partial: { label: t('sales.status.partial'), cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
    pending: { label: t('sales.status.pending'), cls: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' },
  };
  const statusBadge = (s: string) => {
    const cfg = statusConfig[s] || { label: s, cls: 'bg-gray-100 text-gray-500' };
    return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.cls}`}>{cfg.label}</span>;
  };

  /* ── Mutations ───────────────────────────────────────────────────────── */
  const createMut = useMutation({
    mutationFn: purchasesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success(t('nav.purchases'));
      setShowForm(false);
      setForm({ FournisseurId: '', items: [emptyItem()], initialPayment: 0, paymentMethod: 'cash', notes: '' });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || t('error.generic')),
  });

  const deleteMut = useMutation({
    mutationFn: purchasesApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success(t('common.delete'));
    },
  });

  const paymentMut = useMutation({
    mutationFn: ({ id, data }: any) => purchasesApi.addPayment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-detail'] });
      toast.success(t('sales.addPayment'));
      setShowPayment(null);
      setPayAmount('');
      setPayNote('');
    },
  });

  const deletePaymentMut = useMutation({
    mutationFn: ({ purchaseId, paymentId }: any) => purchasesApi.removePayment(purchaseId, paymentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-detail'] });
      toast.success(t('common.delete'));
    },
  });

  const createSupplierMut = useMutation({
    mutationFn: suppliersApi.create,
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      setForm(f => ({ ...f, FournisseurId: data._id, items: [emptyItem()] }));
      setShowAddSupplierForm(false);
      setNewSupplierForm({ name: '', phone: '+216' });
      toast.success(t('suppliers.new'));
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || t('error.generic')),
  });

  /* ── Handlers ────────────────────────────────────────────────────────── */
  const handleDelete = (p: any) => confirm(
      {
        title:         `${t('common.delete')} "${p.FournisseurName}"`,
        message:       `${t('common.delete')} ${formatTND(p.totalTTC)} ?`,
        dangerMessage: t('error.generic'),
        confirmLabel:  t('common.delete'),
      },
      () => deleteMut.mutate(p._id),
  );

  const handleDeletePayment = (purchaseId: string, paymentId: string, amount: number) => confirm(
      {
        title:         t('common.delete'),
        message:       `${t('common.delete')} ${formatTND(amount)} ?`,
        dangerMessage: t('error.generic'),
        confirmLabel:  t('common.delete'),
      },
      () => deletePaymentMut.mutate({ purchaseId, paymentId }),
  );

  const handleAddPayment = (purchase: any) => {
    if (!payAmount) return;
    confirm(
        {
          title:   t('sales.addPayment'),
          message: `${payAmount} TND — ${t(PAYMENT_METHODS.find(m => m.value === payMethod)?.label || '')}`,
        },
        () => paymentMut.mutate({ id: purchase._id, data: { amount: +payAmount, method: payMethod, note: payNote } }),
    );
  };

  const selectProduct = (i: number, productId: string) => {
    const p = (allProducts as any[]).find((x: any) => x._id === productId);
    setForm(f => ({
      ...f,
      items: f.items.map((item, idx) =>
          idx === i
              ? { ...item, productId: p?._id || '', productName: p?.name || '', unitPrice: p?.purchasePrice || 0, tva: p?.tva ?? 19 }
              : item,
      ),
    }));
  };

  const totalHT  = form.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const totalTTC = form.items.reduce((s, i) => s + i.quantity * i.unitPrice * (1 + i.tva / 100), 0);

  const handleDownloadInvoice = async (id: string) => {
    try {
      const blob = await purchasesApi.getInvoice(id);
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = `facture-achat-${id}.pdf`; a.click();
      URL.revokeObjectURL(url);
    } catch { toast.error(t('error.generic')); }
  };

  const inp = 'w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500';

  /* ── Columns ─────────────────────────────────────────────────────────── */
  const columns = [
    {
      key: 'FournisseurName', header: t('nav.suppliers'), sortable: true,
      render: (v: string) => <span className="font-medium text-gray-900 dark:text-white">{v}</span>,
    },
    { key: 'totalTTC',        header: t('sales.totalTTC'), sortable: true, render: (v: number) => formatTND(v) },
    { key: 'amountPaid',      header: t('sales.paid'),     sortable: true, render: (v: number) => <span className="text-green-600 font-medium">{formatTND(v)}</span> },
    {
      key: 'amountRemaining', header: t('sales.remaining'), sortable: true,
      render: (v: number) => <span className={v > 0 ? 'text-red-600 font-semibold' : 'text-green-600'}>{formatTND(v)}</span>,
    },
    { key: 'status',    header: t('common.status'), render: (v: string) => statusBadge(v) },
    { key: 'createdAt', header: t('common.date'),   sortable: true, render: (v: string) => v ? format(new Date(v), 'dd/MM/yyyy') : '-' },
  ];

  /* ════════════════════════════════════════════════════════════════════════ */
  return (
      <div className="space-y-4 sm:space-y-6" dir={dir}>

        {/* ── En-tête ── */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{t('nav.purchases')}</h1>
            <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">
              {(purchases as any[]).length} {t('nav.purchases').toLowerCase()}
            </p>
          </div>
          <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-medium transition-colors shrink-0"
          >
            <Plus size={15} />
            <span>{t('nav.purchases')}</span>
          </button>
        </div>

        {/* ── Tableau ── */}
        <DataTable
            data={purchases as any[]}
            columns={columns}
            searchKeys={['FournisseurName', 'status']}
            isLoading={isLoading}
            emptyMessage={t('common.noData')}
            onRowClick={setDetailPurchase}
            actions={(row) => (
                <div className="flex items-center justify-end gap-1">
                  <button onClick={(e) => { e.stopPropagation(); setDetailPurchase(row); }}           className="p-1.5 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg"><Eye size={15} /></button>
                  <button onClick={(e) => { e.stopPropagation(); handleDownloadInvoice(row._id); }}   className="p-1.5 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg"><FileText size={15} /></button>
                  {row.status !== 'paid' && (
                      <button onClick={(e) => { e.stopPropagation(); setShowPayment(row); }}             className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg"><CreditCard size={15} /></button>
                  )}
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(row); }}                className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"><Trash2 size={15} /></button>
                </div>
            )}
        />

        {/* ══════════════════════════════════════════════════════════════════
            MODAL : Nouvel achat — bottom sheet mobile
        ══════════════════════════════════════════════════════════════════ */}
        {showForm && (
            <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center">
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowForm(false)} />
              <div className="relative bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-2xl mx-0 sm:mx-4 max-h-[94vh] overflow-y-auto">

                <div className="w-10 h-1 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mt-3 sm:hidden" />

                <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between rounded-t-2xl">
                  <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">{t('nav.purchases')}</h2>
                  <button onClick={() => setShowForm(false)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"><X size={18} /></button>
                </div>

                <form onSubmit={(e) => { e.preventDefault(); createMut.mutate(form as any); }} className="p-4 sm:p-6 space-y-5">

                  {/* Fournisseur */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('nav.suppliers')} <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <select
                          required
                          value={form.FournisseurId}
                          onChange={e => setForm(f => ({ ...f, FournisseurId: e.target.value, items: [emptyItem()] }))}
                          className={inp + ' flex-1'}
                      >
                        <option value="">{t('common.search')}</option>
                        {(suppliers as any[]).map((s: any) => (
                            <option key={s._id} value={s._id}>{s.name} — {s.phone}</option>
                        ))}
                      </select>
                      <button
                          type="button"
                          onClick={() => setShowAddSupplierForm(true)}
                          className="px-3 py-2 border border-dashed border-blue-400 text-blue-600 dark:text-blue-400 rounded-xl text-xs sm:text-sm hover:bg-blue-50 dark:hover:bg-blue-900/20 whitespace-nowrap transition-colors"
                      >
                        + {t('suppliers.new')}
                      </button>
                    </div>
                    {form.FournisseurId && supplierProducts.length === 0 && (
                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-1.5">
                          ⚠️ {t('common.noData')}
                        </p>
                    )}
                  </div>

                  {/* Lignes produits */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('products.title')} <span className="text-red-500">*</span>
                      </span>
                      <button type="button" onClick={() => setForm(f => ({ ...f, items: [...f.items, emptyItem()] }))}
                              className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                        <Plus size={11} /> {t('sales.addProduct')}
                      </button>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-700">
                      <table className="w-full text-xs">
                        <thead>
                        <tr className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                          <th className="text-left px-3 py-2">{t('products.title')}</th>
                          <th className="px-2 py-2 w-16 text-right">{t('sales.quantity')}</th>
                          <th className="px-2 py-2 w-24 text-right">{t('sales.unitPrice')}</th>
                          <th className="px-2 py-2 w-16 text-right">{t('products.tva')}</th>
                          <th className="px-3 py-2 w-24 text-right">{t('common.total')}</th>
                          <th className="w-8" />
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                        {form.items.map((item, i) => (
                            <tr key={i}>
                              <td className="px-3 py-2">
                                <select value={item.productId} onChange={e => selectProduct(i, e.target.value)}
                                        className="w-full px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none text-xs min-w-[120px]">
                                  <option value="">— {t('common.search')} —</option>
                                  {(form.FournisseurId ? supplierProducts : (allProducts as any[])).map((p: any) => (
                                      <option key={p._id} value={p._id}>{p.name}</option>
                                  ))}
                                </select>
                              </td>
                              <td className="px-2 py-2">
                                <input type="number" min={1} value={item.quantity}
                                       onChange={e => setForm(f => ({ ...f, items: f.items.map((x, j) => j === i ? { ...x, quantity: +e.target.value } : x) }))}
                                       className="w-full px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-right text-gray-900 dark:text-white focus:outline-none" />
                              </td>
                              <td className="px-2 py-2">
                                <input type="number" min={0} step={0.001} value={item.unitPrice}
                                       onChange={e => setForm(f => ({ ...f, items: f.items.map((x, j) => j === i ? { ...x, unitPrice: +e.target.value } : x) }))}
                                       className="w-full px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-right text-gray-900 dark:text-white focus:outline-none" />
                              </td>
                              <td className="px-2 py-2">
                                <input type="number" min={0} value={item.tva}
                                       onChange={e => setForm(f => ({ ...f, items: f.items.map((x, j) => j === i ? { ...x, tva: +e.target.value } : x) }))}
                                       className="w-full px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-right text-gray-900 dark:text-white focus:outline-none" />
                              </td>
                              <td className="px-3 py-2 text-right font-medium text-gray-700 dark:text-gray-300">
                                {(item.quantity * item.unitPrice * (1 + item.tva / 100)).toFixed(3)}
                              </td>
                              <td className="pr-2 py-2">
                                {form.items.length > 1 && (
                                    <button type="button" onClick={() => setForm(f => ({ ...f, items: f.items.filter((_, j) => j !== i) }))}
                                            className="text-red-400 hover:text-red-600 p-1 rounded">
                                      <X size={12} />
                                    </button>
                                )}
                              </td>
                            </tr>
                        ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Totaux */}
                    <div className="mt-3 flex justify-end gap-4 sm:gap-6 text-xs text-gray-500 dark:text-gray-400 px-1 flex-wrap">
                      <span>{t('sales.totalHT')} : <strong className="text-gray-900 dark:text-white">{formatTND(totalHT)}</strong></span>
                      <span>TVA : <strong className="text-gray-900 dark:text-white">{formatTND(totalTTC - totalHT)}</strong></span>
                      <span className="text-sm">{t('sales.totalTTC')} : <strong className="text-blue-600 dark:text-blue-400 text-base">{formatTND(totalTTC)}</strong></span>
                    </div>
                  </div>

                  {/* Paiement + mode + notes */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('sales.initialPayment')}</label>
                      <input type="number" min={0} step={0.001} max={totalTTC} value={form.initialPayment}
                             onChange={e => setForm(f => ({ ...f, initialPayment: +e.target.value }))} className={inp} />
                      {form.initialPayment > 0 && (
                          <p className="text-xs text-gray-400 mt-1">
                            {t('sales.remaining')} : <span className={totalTTC - form.initialPayment > 0 ? 'text-red-500 font-medium' : 'text-green-500 font-medium'}>
                              {formatTND(Math.max(0, totalTTC - form.initialPayment))}
                            </span>
                          </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('sales.paymentMethod')}</label>
                      <select value={form.paymentMethod} onChange={e => setForm(f => ({ ...f, paymentMethod: e.target.value }))} className={inp}>
                        {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{t(m.label)}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('common.notes')}</label>
                      <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder={t('common.optional')} className={inp} />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-1">
                    <button type="button" onClick={() => setShowForm(false)}
                            className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-xs sm:text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      {t('common.cancel')}
                    </button>
                    <button type="submit" disabled={createMut.isPending || !form.FournisseurId || form.items.every(i => !i.productId)}
                            className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl text-xs sm:text-sm font-medium transition-colors">
                      {createMut.isPending ? t('common.loading') : t('common.create')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            MODAL : Nouveau fournisseur rapide
        ══════════════════════════════════════════════════════════════════ */}
        {showAddSupplierForm && (
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAddSupplierForm(false)} />
              <div className="relative bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-sm mx-0 sm:mx-4 p-5 sm:p-6">
                <div className="w-10 h-1 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-4 sm:hidden" />
                <button onClick={() => setShowAddSupplierForm(false)} className="absolute top-4 right-4 p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                  <X size={18} />
                </button>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('suppliers.new')}</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('common.name')} <span className="text-red-500">*</span>
                    </label>
                    <input
                        value={newSupplierForm.name}
                        onChange={e => setNewSupplierForm(f => ({ ...f, name: e.target.value }))}
                        placeholder={t('common.optional')}
                        className={inp}
                        autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('common.phone')} <span className="text-red-500">*</span>
                    </label>
                    <input
                        value={newSupplierForm.phone}
                        onChange={e => setNewSupplierForm(f => ({ ...f, phone: e.target.value }))}
                        pattern="^\+216[0-9]{8}$"
                        className={inp}
                    />
                  </div>
                  <div className="flex gap-3 pt-1">
                    <button
                        type="button"
                        onClick={() => setShowAddSupplierForm(false)}
                        className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      {t('common.cancel')}
                    </button>
                    <button
                        type="button"
                        onClick={() => { if (newSupplierForm.name && newSupplierForm.phone) createSupplierMut.mutate(newSupplierForm as any); }}
                        disabled={!newSupplierForm.name || createSupplierMut.isPending}
                        className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl text-sm font-medium transition-colors"
                    >
                      {createSupplierMut.isPending ? t('common.loading') : t('common.create')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            MODAL : Ajouter un paiement
        ══════════════════════════════════════════════════════════════════ */}
        {showPayment && (
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowPayment(null)} />
              <div className="relative bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-sm mx-0 sm:mx-4 p-5 sm:p-6">
                <div className="w-10 h-1 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-4 sm:hidden" />
                <button onClick={() => setShowPayment(null)} className="absolute top-4 right-4 p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"><X size={18} /></button>
                <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-1">{t('sales.addPayment')}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  {t('sales.remaining')} : <strong className="text-red-600 dark:text-red-400">{formatTND(showPayment.amountRemaining)}</strong>
                </p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Montant (TND) <span className="text-red-500">*</span></label>
                    <input type="number" min={0.001} step={0.001} max={showPayment.amountRemaining}
                           value={payAmount} onChange={e => setPayAmount(e.target.value)} className={inp} autoFocus />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('sales.paymentMethod')}</label>
                    <select value={payMethod} onChange={e => setPayMethod(e.target.value)} className={inp}>
                      {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{t(m.label)}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('common.notes')}</label>
                    <input value={payNote} onChange={e => setPayNote(e.target.value)} placeholder={t('common.optional')} className={inp} />
                  </div>
                  <div className="flex gap-3 pt-1">
                    <button onClick={() => setShowPayment(null)}
                            className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      {t('common.cancel')}
                    </button>
                    <button onClick={() => handleAddPayment(showPayment)} disabled={!payAmount || paymentMut.isPending}
                            className="flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-xl text-sm font-medium transition-colors">
                      {paymentMut.isPending ? t('common.loading') : t('common.confirm')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            DRAWER : Détail d'un achat
        ══════════════════════════════════════════════════════════════════ */}
        {detailPurchase && (
            <div className="fixed inset-0 z-40 flex items-end sm:justify-end" dir={dir}>
              <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { setDetailPurchase(null); setSelectedItem(null); }} />
              <div className="relative w-full sm:w-auto sm:max-w-xl sm:h-full bg-white dark:bg-gray-900 shadow-2xl overflow-y-auto rounded-t-2xl sm:rounded-none max-h-[92vh] sm:max-h-full">

                <div className="w-10 h-1 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mt-3 sm:hidden" />

                <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between mt-1 sm:mt-0">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                        {t('nav.purchases')} — {purchaseDetail?.FournisseurName || detailPurchase.FournisseurName}
                      </h2>
                      {statusBadge(purchaseDetail?.status || detailPurchase.status)}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {detailPurchase.createdAt ? format(new Date(detailPurchase.createdAt), 'dd/MM/yyyy HH:mm') : '—'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleDownloadInvoice(detailPurchase._id)}
                            className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-xs hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <Download size={13} /> {t('sales.invoice')}
                    </button>
                    <button onClick={() => { setDetailPurchase(null); setSelectedItem(null); }} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                      <X size={18} />
                    </button>
                  </div>
                </div>

                <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    {[
                      { label: t('sales.totalTTC'), value: formatTND(purchaseDetail?.totalTTC    || detailPurchase.totalTTC),    cls: 'text-blue-600 dark:text-blue-400' },
                      { label: t('sales.paid'),     value: formatTND(purchaseDetail?.amountPaid  || detailPurchase.amountPaid),  cls: 'text-green-600 dark:text-green-400' },
                      { label: t('sales.remaining'),value: formatTND(purchaseDetail?.amountRemaining ?? detailPurchase.amountRemaining), cls: (purchaseDetail?.amountRemaining ?? detailPurchase.amountRemaining) > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-400' },
                    ].map(({ label, value, cls }) => (
                        <div key={label} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-2.5 sm:p-3 text-center">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 line-clamp-1">{label}</p>
                          <p className={`text-xs sm:text-sm font-bold ${cls} truncate`}>{value}</p>
                        </div>
                    ))}
                  </div>

                  {/* Produits */}
                  <div>
                    <h3 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white mb-2 sm:mb-3 flex items-center gap-2">
                      <Package size={14} className="text-gray-400" />
                      {t('products.title')} ({(purchaseDetail?.items || []).length})
                    </h3>
                    <div className="space-y-2">
                      {(purchaseDetail?.items || []).map((item: any, i: number) => (
                          <button key={i} onClick={() => setSelectedItem(item)}
                                  className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/10 border border-transparent hover:border-blue-200 dark:hover:border-blue-800 transition-all text-left active:scale-[0.99]">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white truncate">{item.productName}</p>
                              <p className="text-xs text-gray-400 mt-0.5">
                                {t('sales.quantity')}: {item.quantity} · {t('sales.unitPrice')}: {formatTND(item.unitPrice)}
                                {item.tva > 0 && ` · TVA ${item.tva}%`}
                              </p>
                            </div>
                            <div className="flex items-center gap-1.5 ms-2 shrink-0">
                              <span className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">{formatTND(item.totalTTC)}</span>
                              <ChevronRight size={13} className="text-gray-400 rtl:rotate-180" />
                            </div>
                          </button>
                      ))}
                    </div>
                  </div>

                  {/* Paiements */}
                  <div>
                    <div className="flex items-center justify-between mb-2 sm:mb-3">
                      <h3 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">{t('sales.addPayment')}</h3>
                      {purchaseDetail?.status !== 'paid' && (
                          <button onClick={() => setShowPayment(purchaseDetail || detailPurchase)}
                                  className="text-xs text-green-600 dark:text-green-400 hover:underline flex items-center gap-1">
                            <Plus size={12} /> {t('common.create')}
                          </button>
                      )}
                    </div>
                    {(purchaseDetail?.payments || []).length === 0 ? (
                        <div className="text-center py-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                          <p className="text-xs sm:text-sm text-gray-400">{t('common.noData')}</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                          {(purchaseDetail?.payments || []).map((p: any) => (
                              <div key={p._id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                                <div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">{formatTND(p.amount)}</span>
                                    <span className="text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full">
                                      {t(PAYMENT_METHODS.find(m => m.value === p.method)?.label || '') || p.method}
                                    </span>
                                  </div>
                                  <p className="text-xs text-gray-400 mt-0.5">
                                    {p.date ? format(new Date(p.date), 'dd/MM/yyyy HH:mm') : '—'}
                                    {p.note ? ` — ${p.note}` : ''}
                                  </p>
                                </div>
                                <button onClick={() => handleDeletePayment(detailPurchase._id, p._id, p.amount)}
                                        className="p-1.5 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                                  <Trash2 size={13} />
                                </button>
                              </div>
                          ))}
                        </div>
                    )}
                  </div>

                  {/* Notes */}
                  {(purchaseDetail?.notes || detailPurchase.notes) && (
                      <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 rounded-xl p-3 sm:p-4">
                        <p className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-1">{t('common.notes')}</p>
                        <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">{purchaseDetail?.notes || detailPurchase.notes}</p>
                      </div>
                  )}
                </div>
              </div>
            </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            PANEL : Détail d'un item
        ══════════════════════════════════════════════════════════════════ */}
        {selectedItem && (
            <div className="fixed inset-0 z-50 flex items-end sm:justify-end" dir={dir}>
              <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedItem(null)} />
              <div className="relative w-full sm:w-auto sm:max-w-md sm:h-full bg-white dark:bg-gray-900 shadow-2xl overflow-y-auto rounded-t-2xl sm:rounded-none max-h-[92vh] sm:max-h-full">
                <div className="w-10 h-1 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mt-3 sm:hidden" />

                <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-4 sm:px-6 py-3 sm:py-4 flex items-center gap-2 mt-1 sm:mt-0">
                  <button onClick={() => setSelectedItem(null)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                    <ChevronLeft size={17} className="text-gray-500 rtl:rotate-180" />
                  </button>
                  <div>
                    <h2 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">{selectedItem.productName}</h2>
                    <p className="text-xs text-gray-400">{t('products.title')}</p>
                  </div>
                </div>

                <div className="p-4 sm:p-6 space-y-0">
                  {[
                    { label: t('sales.quantity'),  value: `${selectedItem.quantity}` },
                    { label: t('sales.unitPrice'), value: formatTND(selectedItem.unitPrice) },
                    { label: t('products.tva'),    value: `${selectedItem.tva ?? 0} %` },
                    { label: t('sales.totalHT'),   value: formatTND(selectedItem.totalHT || selectedItem.quantity * selectedItem.unitPrice) },
                    { label: t('sales.totalTTC'),  value: formatTND(selectedItem.totalTTC || selectedItem.quantity * selectedItem.unitPrice * (1 + (selectedItem.tva || 0) / 100)), bold: true, color: 'text-blue-600 dark:text-blue-400' },
                  ].map(({ label, value, bold, color }) => (
                      <div key={label} className="flex items-center justify-between py-3 border-b border-gray-50 dark:border-gray-800 last:border-0">
                        <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{label}</span>
                        <span className={`text-xs sm:text-sm ${bold ? 'font-bold' : 'font-semibold'} ${color || 'text-gray-900 dark:text-white'}`}>{value}</span>
                      </div>
                  ))}
                </div>

                <div className="px-4 sm:px-6 pb-5 pt-2">
                  <button onClick={() => setSelectedItem(null)}
                          className="w-full py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors">
                    {t('common.cancel')}
                  </button>
                </div>
              </div>
            </div>
        )}

        <ConfirmDialog {...confirmState} onProceed={proceed} onCancel={cancel} />
      </div>
  );
};

export default PurchasesPage;