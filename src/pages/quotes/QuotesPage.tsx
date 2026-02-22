import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { quotesApi, productsApi, clientsApi } from '../../api';
import DataTable from '../../components/common/DataTable';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import { Plus, Trash2, X, Download, FileText, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const formatTND = (v: number) => `${(v || 0).toFixed(3)} TND`;
const emptyItem = () => ({ productId: '', productName: '', quantity: 1, unitPrice: 0, tva: 19 });

const QuotesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { state: confirmState, confirm, proceed, cancel } = useConfirmDialog();
  const [showForm, setShowForm] = useState(false);
  const [detailQuote, setDetailQuote] = useState<any>(null);
  const [form, setForm] = useState({
    clientName: '', clientPhone: '', clientEmail: '', clientAddress: '',
    validUntil: '', notes: '', items: [emptyItem()]
  });

  const { data: quotes = [], isLoading } = useQuery({ queryKey: ['quotes'], queryFn: () => quotesApi.getAll() });
  const { data: products = [] } = useQuery({ queryKey: ['products'], queryFn: () => productsApi.getAll() });

  const createMut = useMutation({
    mutationFn: quotesApi.create,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['quotes'] }); toast.success('Devis créé'); setShowForm(false); setForm({ clientName: '', clientPhone: '', clientEmail: '', clientAddress: '', validUntil: '', notes: '', items: [emptyItem()] }); }
  });
  const deleteMut = useMutation({
    mutationFn: quotesApi.remove,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['quotes'] }); toast.success('Devis supprimé'); }
  });

  const handleDelete = (q: any) => confirm(
    { title: `Supprimer le devis de "${q.clientName}"`, message: `Ce devis sera supprimé.`, dangerMessage: 'Ce devis sera supprimé DÉFINITIVEMENT. Nous ne sommes pas responsables de cette perte.', confirmLabel: 'Supprimer définitivement' },
    () => deleteMut.mutate(q._id)
  );

  const handleDownloadPDF = async (id: string, clientName: string) => {
    try {
      const blob = await quotesApi.getInvoice(id);
      const url = URL.createObjectURL(blob); const a = document.createElement('a');
      a.href = url; a.download = `devis-${clientName}.pdf`; a.click(); URL.revokeObjectURL(url);
    } catch { toast.error('PDF non disponible'); }
  };

  const selectProduct = (i: number, productId: string) => {
    const p = (products as any[]).find((p: any) => p._id === productId);
    setForm(f => ({ ...f, items: f.items.map((item, idx) => idx === i ? { ...item, productId: p?._id || '', productName: p?.name || '', unitPrice: p?.salePrice || 0, tva: p?.tva || 0 } : item) }));
  };

  const totalHT = form.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const totalTVA = form.items.reduce((s, i) => s + i.quantity * i.unitPrice * i.tva / 100, 0);
  const totalTTC = totalHT + totalTVA;

  const inp = 'w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500';

  const statusBadge = (status: string) => {
    const map: Record<string, [string, string]> = { draft: ['Brouillon', 'bg-gray-100 text-gray-600'], sent: ['Envoyé', 'bg-blue-100 text-blue-700'], accepted: ['Accepté', 'bg-green-100 text-green-700'], rejected: ['Refusé', 'bg-red-100 text-red-600'] };
    const [label, cls] = map[status] || ['—', 'bg-gray-100 text-gray-500'];
    return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cls}`}>{label}</span>;
  };

  const columns = [
    { key: 'clientName', header: 'Client', sortable: true, render: (v: string) => <span className="font-medium">{v}</span> },
    { key: 'totalTTC', header: 'Total TTC', render: formatTND, sortable: true },
    { key: 'status', header: 'Statut', render: (v: string) => statusBadge(v || 'draft') },
    { key: 'validUntil', header: 'Valide jusqu\'au', render: (v: string) => v ? format(new Date(v), 'dd/MM/yyyy') : '—', sortable: true },
    { key: 'createdAt', header: 'Créé le', render: (v: string) => v ? format(new Date(v), 'dd/MM/yyyy') : '-', sortable: true },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Devis</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">{(quotes as any[]).length} devis</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium">
          <Plus size={16} /> Nouveau devis
        </button>
      </div>

      <DataTable data={quotes as any[]} columns={columns} searchKeys={['clientName', 'status']}
        isLoading={isLoading} emptyMessage="Aucun devis"
        actions={(row) => (
          <div className="flex items-center justify-end gap-1">
            <button onClick={() => handleDownloadPDF(row._id, row.clientName)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg" title="Télécharger PDF"><FileText size={15} /></button>
            <button onClick={() => handleDelete(row)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={15} /></button>
          </div>
        )}
      />

      {/* New Quote Form */}
      {showForm && (
        <div className="fixed inset-0 z-40 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowForm(false)} className="absolute top-4 right-4"><X size={18} /></button>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-5">Nouveau devis</h2>
            <form onSubmit={(e) => { e.preventDefault(); createMut.mutate(form as any); }} className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Informations client</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Nom / Entreprise <span className="text-red-500">*</span></label>
                    <input required value={form.clientName} onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))} className={inp} /></div>
                  <div><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Téléphone</label>
                    <input value={form.clientPhone} onChange={e => setForm(f => ({ ...f, clientPhone: e.target.value }))} className={inp} /></div>
                  <div><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Email</label>
                    <input type="email" value={form.clientEmail} onChange={e => setForm(f => ({ ...f, clientEmail: e.target.value }))} className={inp} /></div>
                  <div><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Adresse</label>
                    <input value={form.clientAddress} onChange={e => setForm(f => ({ ...f, clientAddress: e.target.value }))} className={inp} /></div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Produits / Services <span className="text-red-500">*</span></span>
                  <button type="button" onClick={() => setForm(f => ({ ...f, items: [...f.items, emptyItem()] }))} className="text-xs text-blue-600 hover:underline">+ Ajouter ligne</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead><tr className="text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
                      <th className="text-left pb-2">Désignation</th><th className="pb-2 w-16 text-left">Qté</th><th className="pb-2 w-24 text-left">Prix HT</th><th className="pb-2 w-16 text-left">TVA%</th><th className="pb-2 w-20 text-right">Total HT</th><th className="w-8" />
                    </tr></thead>
                    <tbody>
                      {form.items.map((item, i) => (
                        <tr key={i} className="border-b border-gray-50 dark:border-gray-800">
                          <td className="pr-2 py-1">
                            <select value={item.productId} onChange={e => selectProduct(i, e.target.value)} className="w-full px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none text-xs">
                              <option value="">— Sélectionner —</option>
                              {(products as any[]).map((p: any) => <option key={p._id} value={p._id}>{p.name}</option>)}
                            </select>
                          </td>
                          <td className="pr-1 py-1"><input type="number" min={1} value={item.quantity} onChange={e => setForm(f => ({ ...f, items: f.items.map((x, j) => j === i ? { ...x, quantity: +e.target.value } : x) }))} className="w-full px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs focus:outline-none" /></td>
                          <td className="pr-1 py-1"><input type="number" min={0} step={0.001} value={item.unitPrice} onChange={e => setForm(f => ({ ...f, items: f.items.map((x, j) => j === i ? { ...x, unitPrice: +e.target.value } : x) }))} className="w-full px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs focus:outline-none" /></td>
                          <td className="pr-1 py-1"><input type="number" min={0} value={item.tva} onChange={e => setForm(f => ({ ...f, items: f.items.map((x, j) => j === i ? { ...x, tva: +e.target.value } : x) }))} className="w-full px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs focus:outline-none" /></td>
                          <td className="text-right py-1 text-gray-600 dark:text-gray-300">{(item.quantity * item.unitPrice).toFixed(3)}</td>
                          <td>{form.items.length > 1 && <button type="button" onClick={() => setForm(f => ({ ...f, items: f.items.filter((_, j) => j !== i) }))} className="text-red-400 ml-1">✕</button>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-2 text-right space-y-0.5">
                  <p className="text-xs text-gray-500">Total HT: <strong className="text-gray-700 dark:text-gray-300">{formatTND(totalHT)}</strong></p>
                  <p className="text-xs text-gray-500">TVA: <strong className="text-gray-700 dark:text-gray-300">{formatTND(totalTVA)}</strong></p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">Total TTC: {formatTND(totalTTC)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Valide jusqu'au</label>
                  <input type="date" value={form.validUntil} onChange={e => setForm(f => ({ ...f, validUntil: e.target.value }))} className={inp} /></div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
                  <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className={inp} /></div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium">Annuler</button>
                <button type="submit" disabled={createMut.isPending} className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl text-sm font-medium">{createMut.isPending ? 'Génération...' : 'Créer le devis'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog {...confirmState} onProceed={proceed} onCancel={cancel} />
    </div>
  );
};

export default QuotesPage;
