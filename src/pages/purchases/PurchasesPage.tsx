import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { purchasesApi, suppliersApi, productsApi } from '../../api';
import DataTable from '../../components/common/DataTable';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import { Plus, Trash2, CreditCard, X, Eye, FileText, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const formatTND = (v: number) => `${(v || 0).toFixed(3)} TND`;
const PAYMENT_METHODS = [{ value: 'cash', label: 'Espèces' }, { value: 'virement', label: 'Virement' }, { value: 'cheque', label: 'Chèque' }, { value: 'online', label: 'En ligne' }];

const statusBadge = (s: string) => {
  const m: Record<string, [string, string]> = { paid: ['Payé', 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'], partial: ['Partiel', 'bg-amber-100 text-amber-700'], pending: ['En attente', 'bg-red-100 text-red-600'] };
  const [l, c] = m[s] || ['—', ''];
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c}`}>{l}</span>;
};

const PurchasesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { state: confirmState, confirm, proceed, cancel } = useConfirmDialog();
  const [showForm, setShowForm] = useState(false);
  const [showPayment, setShowPayment] = useState<any>(null);
  const [detailPurchase, setDetailPurchase] = useState<any>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('cash');
  const [payNote, setPayNote] = useState('');

  const emptyItem = () => ({ productId: '', productName: '', quantity: 1, unitPrice: 0, tva: 19 });
  const [form, setForm] = useState({ supplierId: '', items: [emptyItem()], initialPayment: 0, paymentMethod: 'cash', notes: '' });

  const { data: purchases = [], isLoading } = useQuery({ queryKey: ['purchases'], queryFn: () => purchasesApi.getAll() });
  const { data: suppliers = [] } = useQuery({ queryKey: ['suppliers'], queryFn: () => suppliersApi.getAll() });
  const { data: allProducts = [] } = useQuery({ queryKey: ['products'], queryFn: () => productsApi.getAll() });

  // Products filtered by selected supplier
  const supplierProducts = form.supplierId
    ? (allProducts as any[]).filter((p: any) => (p.supplierIds || []).includes(form.supplierId))
    : (allProducts as any[]);

  const { data: purchaseDetail } = useQuery({
    queryKey: ['purchase-detail', detailPurchase?._id],
    queryFn: () => purchasesApi.getOne(detailPurchase._id),
    enabled: !!detailPurchase?._id,
  });

  const createMut = useMutation({
    mutationFn: purchasesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] }); queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Achat créé'); setShowForm(false); setForm({ supplierId: '', items: [emptyItem()], initialPayment: 0, paymentMethod: 'cash', notes: '' });
    },
  });
  const deleteMut = useMutation({
    mutationFn: purchasesApi.remove,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['purchases'] }); queryClient.invalidateQueries({ queryKey: ['products'] }); toast.success('Achat supprimé'); },
  });
  const paymentMut = useMutation({
    mutationFn: ({ id, data }: any) => purchasesApi.addPayment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] }); queryClient.invalidateQueries({ queryKey: ['purchase-detail'] });
      toast.success('Paiement enregistré'); setShowPayment(null); setPayAmount('');
    },
  });
  const deletePaymentMut = useMutation({
    mutationFn: ({ purchaseId, paymentId }: any) => purchasesApi.removePayment(purchaseId, paymentId),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['purchases'] }); queryClient.invalidateQueries({ queryKey: ['purchase-detail'] }); toast.success('Paiement supprimé'); },
  });

  const handleDelete = (p: any) => confirm(
    { title: 'Supprimer cet achat', message: `Supprimer l'achat de "${p.supplierName}" de ${formatTND(p.totalTTC)} ?`, dangerMessage: 'Cet achat sera supprimé DÉFINITIVEMENT. Nous ne sommes pas responsables de cette perte.', confirmLabel: 'Supprimer définitivement' },
    () => deleteMut.mutate(p._id)
  );

  const handleDeletePayment = (purchaseId: string, paymentId: string, amount: number) => confirm(
    { title: 'Supprimer ce paiement', message: `Supprimer le paiement de ${formatTND(amount)} ?`, dangerMessage: 'Ce paiement sera supprimé DÉFINITIVEMENT. Nous ne sommes pas responsables de cette perte.', confirmLabel: 'Supprimer définitivement' },
    () => deletePaymentMut.mutate({ purchaseId, paymentId })
  );

  const handleAddPayment = (purchase: any) => {
    if (!payAmount) return;
    confirm(
      { title: 'Confirmer le paiement', message: `Confirmer le paiement de ${payAmount} TND pour l'achat de "${purchase.supplierName}" par ${PAYMENT_METHODS.find(m => m.value === payMethod)?.label} ?` },
      () => paymentMut.mutate({ id: purchase._id, data: { amount: +payAmount, method: payMethod, note: payNote } })
    );
  };

  const selectProduct = (i: number, productId: string) => {
    const p = (allProducts as any[]).find((p: any) => p._id === productId);
    setForm(f => ({ ...f, items: f.items.map((item, idx) => idx === i ? { ...item, productId: p?._id || '', productName: p?.name || '', unitPrice: p?.purchasePrice || 0, tva: p?.tva || 0 } : item) }));
  };

  const totalTTC = form.items.reduce((s, i) => s + i.quantity * i.unitPrice * (1 + i.tva / 100), 0);
  const inp = 'w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500';

  const handleDownloadInvoice = async (id: string) => {
    try {
      const blob = await purchasesApi.getInvoice(id);
      const url = URL.createObjectURL(blob); const a = document.createElement('a');
      a.href = url; a.download = `facture-achat-${id}.pdf`; a.click(); URL.revokeObjectURL(url);
    } catch { toast.error('Facture non disponible'); }
  };

  const columns = [
    { key: 'supplierName', header: 'Fournisseur', sortable: true, render: (v: string) => <span className="font-medium">{v}</span> },
    { key: 'totalTTC', header: 'Total TTC', render: formatTND, sortable: true },
    { key: 'amountPaid', header: 'Payé', render: formatTND, sortable: true },
    { key: 'amountRemaining', header: 'Reste', render: (v: number) => <span className={v > 0 ? 'text-red-600 font-semibold' : 'text-green-600'}>{formatTND(v)}</span>, sortable: true },
    { key: 'status', header: 'Statut', render: statusBadge },
    { key: 'createdAt', header: 'Date', render: (v: string) => v ? format(new Date(v), 'dd/MM/yyyy') : '-', sortable: true },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Achats</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">{(purchases as any[]).length} achat{(purchases as any[]).length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium">
          <Plus size={16} /> Nouvel achat
        </button>
      </div>

      <DataTable data={purchases as any[]} columns={columns} searchKeys={['supplierName', 'status']}
        isLoading={isLoading} emptyMessage="Aucun achat" onRowClick={setDetailPurchase}
        actions={(row) => (
          <div className="flex items-center justify-end gap-1">
            <button onClick={(e) => { e.stopPropagation(); setDetailPurchase(row); }} className="p-1.5 text-gray-500 hover:bg-gray-50 rounded-lg"><Eye size={15} /></button>
            <button onClick={(e) => { e.stopPropagation(); handleDownloadInvoice(row._id); }} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg"><FileText size={15} /></button>
            {row.status !== 'paid' && (
              <button onClick={(e) => { e.stopPropagation(); setShowPayment(row); }} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg"><CreditCard size={15} /></button>
            )}
            <button onClick={(e) => { e.stopPropagation(); handleDelete(row); }} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={15} /></button>
          </div>
        )}
      />

      {/* New Purchase Form */}
      {showForm && (
        <div className="fixed inset-0 z-40 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowForm(false)} className="absolute top-4 right-4"><X size={18} /></button>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-5">Nouvel achat</h2>
            <form onSubmit={(e) => { e.preventDefault(); createMut.mutate(form as any); }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fournisseur <span className="text-red-500">*</span></label>
                <select required value={form.supplierId} onChange={e => { setForm(f => ({ ...f, supplierId: e.target.value, items: [emptyItem()] })); }} className={inp}>
                  <option value="">Sélectionner un fournisseur</option>
                  {(suppliers as any[]).map((s: any) => <option key={s._id} value={s._id}>{s.name} — {s.phone}</option>)}
                </select>
                {form.supplierId && supplierProducts.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">⚠️ Aucun produit associé à ce fournisseur. Allez dans Fournisseurs pour en ajouter.</p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Produits <span className="text-red-500">*</span></span>
                  <button type="button" onClick={() => setForm(f => ({ ...f, items: [...f.items, emptyItem()] }))} className="text-xs text-blue-600 hover:underline">+ Ajouter ligne</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead><tr className="text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
                      <th className="text-left pb-2">Produit</th><th className="text-left pb-2 w-16">Qté</th><th className="text-left pb-2 w-24">Prix HT</th><th className="text-left pb-2 w-16">TVA%</th><th className="pb-2 w-16 text-right">Sous-total</th><th className="w-8" />
                    </tr></thead>
                    <tbody>
                      {form.items.map((item, i) => (
                        <tr key={i} className="border-b border-gray-50 dark:border-gray-800">
                          <td className="pr-2 py-1">
                            <select value={item.productId} onChange={e => selectProduct(i, e.target.value)} className="w-full px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none text-xs">
                              <option value="">—</option>
                              {(form.supplierId ? supplierProducts : (allProducts as any[])).map((p: any) => <option key={p._id} value={p._id}>{p.name}</option>)}
                            </select>
                          </td>
                          <td className="pr-1 py-1"><input type="number" min={1} value={item.quantity} onChange={e => setForm(f => ({ ...f, items: f.items.map((x, j) => j === i ? { ...x, quantity: +e.target.value } : x) }))} className="w-full px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs focus:outline-none" /></td>
                          <td className="pr-1 py-1"><input type="number" min={0} step={0.001} value={item.unitPrice} onChange={e => setForm(f => ({ ...f, items: f.items.map((x, j) => j === i ? { ...x, unitPrice: +e.target.value } : x) }))} className="w-full px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs focus:outline-none" /></td>
                          <td className="pr-1 py-1"><input type="number" min={0} value={item.tva} onChange={e => setForm(f => ({ ...f, items: f.items.map((x, j) => j === i ? { ...x, tva: +e.target.value } : x) }))} className="w-full px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs focus:outline-none" /></td>
                          <td className="text-right py-1 text-gray-600 dark:text-gray-300">{(item.quantity * item.unitPrice * (1 + item.tva / 100)).toFixed(3)}</td>
                          <td>{form.items.length > 1 && <button type="button" onClick={() => setForm(f => ({ ...f, items: f.items.filter((_, j) => j !== i) }))} className="text-red-400 hover:text-red-600 ml-1">✕</button>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="text-right mt-2"><span className="text-sm font-bold text-gray-900 dark:text-white">Total TTC: {formatTND(totalTTC)}</span></div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Paiement initial</label>
                  <input type="number" min={0} step={0.001} value={form.initialPayment} onChange={e => setForm(f => ({ ...f, initialPayment: +e.target.value }))} className={inp} /></div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mode de paiement</label>
                  <select value={form.paymentMethod} onChange={e => setForm(f => ({ ...f, paymentMethod: e.target.value }))} className={inp}>
                    {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select></div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
                  <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className={inp} /></div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium">Annuler</button>
                <button type="submit" disabled={createMut.isPending} className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl text-sm font-medium">{createMut.isPending ? 'Enregistrement...' : 'Créer l\'achat'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPayment && (
        <div className="fixed inset-0 z-40 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowPayment(null)} />
          <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
            <button onClick={() => setShowPayment(null)} className="absolute top-4 right-4"><X size={18} /></button>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Ajouter un paiement</h2>
            <p className="text-sm text-gray-500 mb-4">Reste: <strong className="text-red-600">{formatTND(showPayment.amountRemaining)}</strong></p>
            <div className="space-y-3">
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Montant (TND) <span className="text-red-500">*</span></label>
                <input type="number" min={0.001} step={0.001} max={showPayment.amountRemaining} value={payAmount} onChange={e => setPayAmount(e.target.value)} className={inp} /></div>
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mode</label>
                <select value={payMethod} onChange={e => setPayMethod(e.target.value)} className={inp}>{PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}</select></div>
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Note</label>
                <input value={payNote} onChange={e => setPayNote(e.target.value)} className={inp} /></div>
              <div className="flex gap-3">
                <button onClick={() => setShowPayment(null)} className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium">Annuler</button>
                <button onClick={() => handleAddPayment(showPayment)} disabled={!payAmount || paymentMut.isPending} className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-xl text-sm font-medium">{paymentMut.isPending ? '...' : 'Confirmer'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detail Drawer */}
      {detailPurchase && (
        <div className="fixed inset-0 z-40 flex">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDetailPurchase(null)} />
          <div className="relative ml-auto w-full max-w-xl bg-white dark:bg-gray-900 shadow-2xl overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-6 py-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">Achat — {purchaseDetail?.supplierName || detailPurchase.supplierName}</h2>
                  {statusBadge(purchaseDetail?.status || detailPurchase.status)}
                </div>
                <p className="text-xs text-gray-400 mt-0.5">{detailPurchase.createdAt ? format(new Date(detailPurchase.createdAt), 'dd/MM/yyyy HH:mm') : '—'}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => handleDownloadInvoice(detailPurchase._id)} className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 dark:border-gray-700 text-gray-700 rounded-lg text-xs hover:bg-gray-50"><Download size={13} /> Facture</button>
                <button onClick={() => setDetailPurchase(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"><X size={20} /></button>
              </div>
            </div>

            <div className="p-6 space-y-5">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Total TTC', value: formatTND(purchaseDetail?.totalTTC || detailPurchase.totalTTC), cls: 'text-gray-900 dark:text-white' },
                  { label: 'Payé', value: formatTND(purchaseDetail?.amountPaid || detailPurchase.amountPaid), cls: 'text-green-600' },
                  { label: 'Reste', value: formatTND(purchaseDetail?.amountRemaining || detailPurchase.amountRemaining), cls: 'text-red-600' },
                ].map(({ label, value, cls }) => (
                  <div key={label} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-center">
                    <p className="text-xs text-gray-500 mb-1">{label}</p>
                    <p className={`text-sm font-bold ${cls}`}>{value}</p>
                  </div>
                ))}
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Produits</h3>
                <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-700">
                  <table className="w-full text-xs">
                    <thead><tr className="bg-gray-50 dark:bg-gray-800"><th className="text-left px-3 py-2 text-gray-500">Produit</th><th className="px-3 py-2 text-gray-500 text-right">Qté</th><th className="px-3 py-2 text-gray-500 text-right">Prix HT</th><th className="px-3 py-2 text-gray-500 text-right">Total</th></tr></thead>
                    <tbody>{(purchaseDetail?.items || []).map((item: any, i: number) => (
                      <tr key={i} className="border-t border-gray-100 dark:border-gray-700">
                        <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{item.productName}</td>
                        <td className="px-3 py-2 text-right">{item.quantity}</td>
                        <td className="px-3 py-2 text-right">{formatTND(item.unitPrice)}</td>
                        <td className="px-3 py-2 text-right font-medium">{formatTND(item.quantity * item.unitPrice * (1 + item.tva / 100))}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Paiements</h3>
                  {(purchaseDetail?.status !== 'paid') && (
                    <button onClick={() => setShowPayment(purchaseDetail || detailPurchase)} className="text-xs text-green-600 hover:underline flex items-center gap-1"><Plus size={12} />Ajouter</button>
                  )}
                </div>
                {(purchaseDetail?.payments || []).length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-3">Aucun paiement</p>
                ) : (
                  <div className="space-y-2">
                    {(purchaseDetail?.payments || []).map((p: any) => (
                      <div key={p._id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">{formatTND(p.amount)}</span>
                            <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{PAYMENT_METHODS.find(m => m.value === p.method)?.label || p.method}</span>
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5">{p.date ? format(new Date(p.date), 'dd/MM/yyyy HH:mm') : '—'}{p.note ? ` — ${p.note}` : ''}</p>
                        </div>
                        <button onClick={() => handleDeletePayment(detailPurchase._id, p._id, p.amount)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg"><Trash2 size={13} /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog {...confirmState} onProceed={proceed} onCancel={cancel} />
    </div>
  );
};

export default PurchasesPage;
