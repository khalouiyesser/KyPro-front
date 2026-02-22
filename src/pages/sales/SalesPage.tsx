import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {clientsApi, productsApi, VentesApi} from '../../api';
import DataTable from '../../components/common/DataTable';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import {
  Plus, Trash2, CreditCard, X, Download, Eye,
   FileText, CheckCircle2, Clock, AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const formatTND = (v: number) => `${(v || 0).toFixed(3)} TND`;

const statusBadge = (status: string) => {
  const map: Record<string, [string, string, any]> = {
    paid: ['Payé', 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', CheckCircle2],
    partial: ['Partiel', 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', Clock],
    pending: ['En attente', 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400', AlertCircle],
  };
  const [label, cls, Icon] = map[status] || ['—', 'bg-gray-100 text-gray-500', null];
  return <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${cls}`}>
    {Icon && <Icon size={11} />}{label}
  </span>;
};

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Espèces' },
  { value: 'virement', label: 'Virement' },
  { value: 'cheque', label: 'Chèque' },
  { value: 'online', label: 'En ligne' },
];

const SalesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { state: confirmState, confirm, proceed, cancel } = useConfirmDialog();
  const [showForm, setShowForm] = useState(false);
  const [showPayment, setShowPayment] = useState<any>(null);
  const [detailSale, setDetailSale] = useState<any>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [showAddClientForm, setShowAddClientForm] = useState(false);
  const [newClientForm, setNewClientForm] = useState({ name: '', phone: '+216' });

  const emptyItem = () => ({ productId: '', productName: '', quantity: 1, unitPrice: 0, tva: 19 });
  const [form, setForm] = useState({ clientId: '', items: [emptyItem()], initialPayment: 0, paymentMethod: 'cash', notes: '' });

  const { data: sales = [], isLoading } = useQuery({ queryKey: ['sales'], queryFn: () => VentesApi.getAll() });
  const { data: clients = [] } = useQuery({ queryKey: ['clients'], queryFn: () => clientsApi.getAll() });
  const { data: products = [] } = useQuery({ queryKey: ['products'], queryFn: () => productsApi.getAll() });

  const { data: saleDetail } = useQuery({
    queryKey: ['sale-detail', detailSale?._id],
    queryFn: () => VentesApi.getOne(detailSale._id),
    enabled: !!detailSale?._id,
  });

  const createMut = useMutation({
    mutationFn: VentesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] }); queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Vente créée'); setShowForm(false); setForm({ clientId: '', items: [emptyItem()], initialPayment: 0, paymentMethod: 'cash', notes: '' });
    },
  });
  const deleteMut = useMutation({
    mutationFn: VentesApi.remove,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['sales'] }); queryClient.invalidateQueries({ queryKey: ['products'] }); toast.success('Vente supprimée'); },
  });
  const paymentMut = useMutation({
    mutationFn: ({ id, data }: any) => VentesApi.addPayment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] }); queryClient.invalidateQueries({ queryKey: ['sale-detail'] });
      toast.success('Paiement enregistré'); setShowPayment(null); setPaymentAmount(''); setPaymentNote('');
    },
  });
  const deletePaymentMut = useMutation({
    mutationFn: ({ saleId, paymentId }: any) => VentesApi.removePayment(saleId, paymentId),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['sales'] }); queryClient.invalidateQueries({ queryKey: ['sale-detail'] }); toast.success('Paiement supprimé'); },
  });
  const createClientMut = useMutation({
    mutationFn: clientsApi.create,
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setForm(f => ({ ...f, clientId: data._id }));
      setShowAddClientForm(false); setNewClientForm({ name: '', phone: '+216' });
      toast.success('Client créé');
    }
  });

  const handleDelete = (s: any) => confirm(
    {
      title: `Supprimer la vente`,
      message: `Supprimer la vente de "${s.clientName}" d'un montant de ${formatTND(s.totalTTC)} ?`,
      dangerMessage: 'Cette vente sera supprimée DÉFINITIVEMENT, le stock sera restauré. Nous ne sommes pas responsables de cette perte.',
      confirmLabel: 'Supprimer définitivement'
    },
    () => deleteMut.mutate(s._id)
  );

  const handleDeletePayment = (saleId: string, paymentId: string, amount: number) => confirm(
    {
      title: 'Supprimer ce paiement',
      message: `Supprimer le paiement de ${formatTND(amount)} ?`,
      dangerMessage: 'Ce paiement sera supprimé DÉFINITIVEMENT. Le montant restant sera ajusté. Nous ne sommes pas responsables de cette perte.',
      confirmLabel: 'Supprimer définitivement'
    },
    () => deletePaymentMut.mutate({ saleId, paymentId })
  );

  const handleAddPayment = () => {
    if (!showPayment || !paymentAmount) return;
    confirm(
      { title: 'Confirmer le paiement', message: `Confirmer le paiement de ${paymentAmount} TND pour la vente de "${showPayment.clientName}" par ${PAYMENT_METHODS.find(m => m.value === paymentMethod)?.label} ?` },
      () => paymentMut.mutate({ id: showPayment._id, data: { amount: +paymentAmount, note: paymentNote, method: paymentMethod } })
    );
  };

  const handleDownloadInvoice = async (saleId: string) => {
    try {
      const blob = await VentesApi.getInvoice(saleId);
      const url = URL.createObjectURL(blob); const a = document.createElement('a');
      a.href = url; a.download = `facture-vente-${saleId}.pdf`; a.click(); URL.revokeObjectURL(url);
    } catch { toast.error('Facture non disponible'); }
  };

  const selectProduct = (i: number, productId: string) => {
    const p = (products as any[]).find((p: any) => p._id === productId);
    setForm(f => ({ ...f, items: f.items.map((item, idx) => idx === i ? { ...item, productId: p?._id || '', productName: p?.name || '', unitPrice: p?.salePrice || 0, tva: p?.tva || 0 } : item) }));
  };

  const totalTTC = form.items.reduce((s, i) => s + i.quantity * i.unitPrice * (1 + i.tva / 100), 0);
  const inp = 'w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500';

  const columns = [
    { key: 'clientName', header: 'Client', sortable: true, render: (v: string) => <span className="font-medium">{v}</span> },
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ventes</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">{(sales as any[]).length} vente{(sales as any[]).length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium">
          <Plus size={16} /> Nouvelle vente
        </button>
      </div>

      <DataTable data={sales as any[]} columns={columns} searchKeys={['clientName', 'status']}
        isLoading={isLoading} emptyMessage="Aucune vente" onRowClick={setDetailSale}
        actions={(row) => (
          <div className="flex items-center justify-end gap-1">
            <button onClick={(e) => { e.stopPropagation(); setDetailSale(row); }} className="p-1.5 text-gray-500 hover:bg-gray-50 rounded-lg" title="Détails"><Eye size={15} /></button>
            <button onClick={(e) => { e.stopPropagation(); handleDownloadInvoice(row._id); }} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg" title="Facture PDF"><FileText size={15} /></button>
            {row.status !== 'paid' && (
              <button onClick={(e) => { e.stopPropagation(); setShowPayment(row); }} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg" title="Ajouter paiement"><CreditCard size={15} /></button>
            )}
            <button onClick={(e) => { e.stopPropagation(); handleDelete(row); }} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg" title="Supprimer"><Trash2 size={15} /></button>
          </div>
        )}
      />

      {/* New Sale Form */}
      {showForm && (
        <div className="fixed inset-0 z-40 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowForm(false)} className="absolute top-4 right-4"><X size={18} /></button>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-5">Nouvelle vente</h2>
            <form onSubmit={(e) => { e.preventDefault(); createMut.mutate(form as any); }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Client <span className="text-red-500">*</span></label>
                <div className="flex gap-2">
                  <select required value={form.clientId} onChange={e => setForm(f => ({ ...f, clientId: e.target.value }))} className={inp + ' flex-1'}>
                    <option value="">Sélectionner un client</option>
                    {(clients as any[]).map((c: any) => <option key={c._id} value={c._id}>{c.name} — {c.phone}</option>)}
                  </select>
                  <button type="button" onClick={() => setShowAddClientForm(true)} className="px-3 py-2 border border-dashed border-blue-400 text-blue-600 rounded-xl text-sm hover:bg-blue-50">+ Nouveau</button>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Produits <span className="text-red-500">*</span></span>
                  <button type="button" onClick={() => setForm(f => ({ ...f, items: [...f.items, emptyItem()] }))} className="text-xs text-blue-600 hover:underline">+ Ajouter ligne</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead><tr className="text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
                      <th className="text-left pb-2">Produit</th>
                      <th className="text-left pb-2 w-16">Qté</th>
                      <th className="text-left pb-2 w-24">Prix HT</th>
                      <th className="text-left pb-2 w-16">TVA%</th>
                      <th className="pb-2 w-16">Sous-total</th>
                      <th className="w-8" />
                    </tr></thead>
                    <tbody>
                      {form.items.map((item, i) => (
                        <tr key={i} className="border-b border-gray-50 dark:border-gray-800">
                          <td className="pr-2 py-1">
                            <select value={item.productId} onChange={e => selectProduct(i, e.target.value)} className="w-full px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none text-xs">
                              <option value="">—</option>
                              {(products as any[]).map((p: any) => <option key={p._id} value={p._id}>{p.name}</option>)}
                            </select>
                          </td>
                          <td className="pr-1 py-1"><input type="number" min={1} value={item.quantity} onChange={e => setForm(f => ({ ...f, items: f.items.map((x, j) => j === i ? { ...x, quantity: +e.target.value } : x) }))} className="w-full px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none text-xs" /></td>
                          <td className="pr-1 py-1"><input type="number" min={0} step={0.001} value={item.unitPrice} onChange={e => setForm(f => ({ ...f, items: f.items.map((x, j) => j === i ? { ...x, unitPrice: +e.target.value } : x) }))} className="w-full px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none text-xs" /></td>
                          <td className="pr-1 py-1"><input type="number" min={0} value={item.tva} onChange={e => setForm(f => ({ ...f, items: f.items.map((x, j) => j === i ? { ...x, tva: +e.target.value } : x) }))} className="w-full px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none text-xs" /></td>
                          <td className="text-right py-1 text-gray-600 dark:text-gray-300">{(item.quantity * item.unitPrice * (1 + item.tva / 100)).toFixed(3)}</td>
                          <td>{form.items.length > 1 && <button type="button" onClick={() => setForm(f => ({ ...f, items: f.items.filter((_, j) => j !== i) }))} className="text-red-400 hover:text-red-600 ml-1">✕</button>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="text-right mt-2">
                  <span className="text-sm font-bold text-gray-900 dark:text-white">Total TTC: {formatTND(totalTTC)}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Paiement initial (TND)</label>
                  <input type="number" min={0} step={0.001} value={form.initialPayment} onChange={e => setForm(f => ({ ...f, initialPayment: +e.target.value }))} className={inp} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mode de paiement</label>
                  <select value={form.paymentMethod} onChange={e => setForm(f => ({ ...f, paymentMethod: e.target.value }))} className={inp}>
                    {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
                  <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className={inp} />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50">Annuler</button>
                <button type="submit" disabled={createMut.isPending} className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl text-sm font-medium">
                  {createMut.isPending ? 'Enregistrement...' : 'Créer la vente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Add Client Modal */}
      {showAddClientForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAddClientForm(false)} />
          <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
            <button onClick={() => setShowAddClientForm(false)} className="absolute top-4 right-4"><X size={18} /></button>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Nouveau client (rapide)</h3>
            <div className="space-y-3">
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom <span className="text-red-500">*</span></label>
                <input value={newClientForm.name} onChange={e => setNewClientForm(f => ({ ...f, name: e.target.value }))} className={inp} /></div>
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Téléphone <span className="text-red-500">*</span></label>
                <input value={newClientForm.phone} onChange={e => setNewClientForm(f => ({ ...f, phone: e.target.value }))} pattern="^\+216[0-9]{8}$" className={inp} /></div>
              <button onClick={() => { if (newClientForm.name && newClientForm.phone) createClientMut.mutate(newClientForm as any); }}
                disabled={!newClientForm.name || createClientMut.isPending}
                className="w-full py-2 bg-blue-600 text-white rounded-xl text-sm font-medium disabled:bg-blue-400">
                {createClientMut.isPending ? 'Création...' : 'Créer le client'}
              </button>
            </div>
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
                <input type="number" min={0.001} step={0.001} max={showPayment.amountRemaining} value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} className={inp} /></div>
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mode de paiement</label>
                <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className={inp}>
                  {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select></div>
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Note</label>
                <input value={paymentNote} onChange={e => setPaymentNote(e.target.value)} className={inp} /></div>
              <div className="flex gap-3">
                <button onClick={() => setShowPayment(null)} className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium">Annuler</button>
                <button onClick={handleAddPayment} disabled={!paymentAmount || paymentMut.isPending} className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-xl text-sm font-medium">
                  {paymentMut.isPending ? 'Enregistrement...' : 'Confirmer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detail Drawer */}
      {detailSale && (
        <div className="fixed inset-0 z-40 flex">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDetailSale(null)} />
          <div className="relative ml-auto w-full max-w-xl bg-white dark:bg-gray-900 shadow-2xl overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-6 py-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">Vente — {saleDetail?.clientName || detailSale.clientName}</h2>
                  {statusBadge(saleDetail?.status || detailSale.status)}
                </div>
                <p className="text-xs text-gray-400 mt-0.5">{detailSale.createdAt ? format(new Date(detailSale.createdAt), 'dd/MM/yyyy HH:mm') : '—'}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => handleDownloadInvoice(detailSale._id)} className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-xs hover:bg-gray-50">
                  <Download size={13} /> Facture
                </button>
                <button onClick={() => setDetailSale(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"><X size={20} /></button>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Total TTC', value: formatTND(saleDetail?.totalTTC || detailSale.totalTTC), cls: 'text-gray-900 dark:text-white' },
                  { label: 'Payé', value: formatTND(saleDetail?.amountPaid || detailSale.amountPaid), cls: 'text-green-600' },
                  { label: 'Reste', value: formatTND(saleDetail?.amountRemaining || detailSale.amountRemaining), cls: 'text-red-600' },
                ].map(({ label, value, cls }) => (
                  <div key={label} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</p>
                    <p className={`text-sm font-bold ${cls}`}>{value}</p>
                  </div>
                ))}
              </div>

              {/* Products */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Produits</h3>
                <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-700">
                  <table className="w-full text-xs">
                    <thead><tr className="bg-gray-50 dark:bg-gray-800"><th className="text-left px-3 py-2 text-gray-500">Produit</th><th className="px-3 py-2 text-gray-500 text-right">Qté</th><th className="px-3 py-2 text-gray-500 text-right">Prix HT</th><th className="px-3 py-2 text-gray-500 text-right">TVA</th><th className="px-3 py-2 text-gray-500 text-right">Total</th></tr></thead>
                    <tbody>{(saleDetail?.items || []).map((item: any, i: number) => (
                      <tr key={i} className="border-t border-gray-100 dark:border-gray-700">
                        <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{item.productName}</td>
                        <td className="px-3 py-2 text-right text-gray-600 dark:text-gray-300">{item.quantity}</td>
                        <td className="px-3 py-2 text-right text-gray-600 dark:text-gray-300">{formatTND(item.unitPrice)}</td>
                        <td className="px-3 py-2 text-right text-gray-600 dark:text-gray-300">{item.tva}%</td>
                        <td className="px-3 py-2 text-right font-medium text-gray-900 dark:text-white">{formatTND(item.quantity * item.unitPrice * (1 + item.tva / 100))}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              </div>

              {/* Payment History */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Historique des paiements</h3>
                  {(saleDetail?.status !== 'paid') && (
                    <button onClick={() => setShowPayment(saleDetail || detailSale)} className="flex items-center gap-1 text-xs text-green-600 hover:underline"><Plus size={12} /> Ajouter</button>
                  )}
                </div>
                {(saleDetail?.payments || []).length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-3">Aucun paiement</p>
                ) : (
                  <div className="space-y-2">
                    {(saleDetail?.payments || []).map((p: any) => (
                      <div key={p._id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">{formatTND(p.amount)}</span>
                            <span className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full">{PAYMENT_METHODS.find(m => m.value === p.method)?.label || p.method}</span>
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5">{p.date ? format(new Date(p.date), 'dd/MM/yyyy HH:mm') : '—'}{p.note ? ` — ${p.note}` : ''}</p>
                        </div>
                        <button onClick={() => handleDeletePayment(detailSale._id, p._id, p.amount)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg hover:text-red-600"><Trash2 size={13} /></button>
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

export default SalesPage;
