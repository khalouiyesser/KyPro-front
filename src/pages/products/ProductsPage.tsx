import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi, suppliersApi } from '../../api';
import DataTable from '../../components/common/DataTable';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import { Plus, Pencil, Trash2, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

const ProductsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { state: confirmState, confirm, proceed, cancel } = useConfirmDialog();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', tva: 19, unit: 'unité', purchasePrice: 0, salePrice: 0, stockQuantity: 0, stockThreshold: 5, supplierIds: [] as string[] });

  const { data: products = [], isLoading } = useQuery({ queryKey: ['products'], queryFn: () => productsApi.getAll() });
  const { data: suppliers = [] } = useQuery({ queryKey: ['suppliers'], queryFn: () => suppliersApi.getAll() });

  const createMut = useMutation({ mutationFn: productsApi.create, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['products'] }); toast.success('Produit créé'); setShowForm(false); } });
  const updateMut = useMutation({ mutationFn: ({ id, data }: any) => productsApi.update(id, data), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['products'] }); toast.success('Produit modifié'); setShowForm(false); setEditingId(null); } });
  const deleteMut = useMutation({ mutationFn: productsApi.remove, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['products'] }); toast.success('Produit supprimé'); } });

  const defaultForm = { name: '', tva: 19, unit: 'unité', purchasePrice: 0, salePrice: 0, stockQuantity: 0, stockThreshold: 5, supplierIds: [] as string[] };

  const handleEdit = (p: any) => {
    setEditingId(p._id);
    setForm({ name: p.name, tva: p.tva, unit: p.unit, purchasePrice: p.purchasePrice, salePrice: p.salePrice, stockQuantity: p.stockQuantity, stockThreshold: p.stockThreshold, supplierIds: p.supplierIds?.map((s: any) => s._id || s) || [] });
    setShowForm(true);
  };

  const handleDelete = (p: any) => confirm(
    { message: `Supprimer le produit "${p.name}" ?` },
    () => deleteMut.mutate(p._id)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) updateMut.mutate({ id: editingId, data: form });
    else createMut.mutate(form as any);
  };

  const columns = [
    { key: 'name', header: 'Produit', sortable: true },
    { key: 'unit', header: 'Unité', sortable: true },
    { key: 'tva', header: 'TVA', render: (v: number) => `${v}%`, sortable: true },
    { key: 'purchasePrice', header: 'Prix achat', render: (v: number) => `${v.toFixed(3)} TND`, sortable: true },
    { key: 'salePrice', header: 'Prix vente', render: (v: number) => `${v.toFixed(3)} TND`, sortable: true },
    {
      key: 'stockQuantity', header: 'Stock', sortable: true,
      render: (v: number, row: any) => (
        <div className="flex items-center gap-2">
          <span className={v <= (row.stockThreshold || 0) && row.stockThreshold > 0 ? 'text-red-600 font-semibold' : ''}>{v}</span>
          {v <= (row.stockThreshold || 0) && row.stockThreshold > 0 && <AlertTriangle size={14} className="text-amber-500" />}
        </div>
      )
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Produits</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">{products.length} produit{products.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => { setEditingId(null); setForm(defaultForm); setShowForm(true); }} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium">
          <Plus size={16} /> Nouveau produit
        </button>
      </div>

      <DataTable data={products} columns={columns} searchKeys={['name', 'unit']} isLoading={isLoading} emptyMessage="Aucun produit"
        actions={(row) => (
          <div className="flex items-center justify-end gap-1">
            <button onClick={() => handleEdit(row)} className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"><Pencil size={15} /></button>
            <button onClick={() => handleDelete(row)} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"><Trash2 size={15} /></button>
          </div>
        )}
      />

      {showForm && (
        <div className="fixed inset-0 z-40 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-5">{editingId ? 'Modifier' : 'Nouveau produit'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[['Unité', 'unit', 'text'], ['TVA (%)', 'tva', 'number'], ['Prix achat', 'purchasePrice', 'number'], ['Prix vente', 'salePrice', 'number'], ['Stock initial', 'stockQuantity', 'number'], ['Seuil alerte', 'stockThreshold', 'number']].map(([label, key, type]) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
                    <input type={type} min={type === 'number' ? 0 : undefined} step={type === 'number' ? (key === 'tva' ? 1 : 0.001) : undefined} value={(form as any)[key]} onChange={e => setForm(f => ({ ...f, [key]: type === 'number' ? +e.target.value : e.target.value }))} className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                  </div>
                ))}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fournisseurs</label>
                <select multiple value={form.supplierIds} onChange={e => setForm(f => ({ ...f, supplierIds: Array.from(e.target.selectedOptions, o => o.value) }))} className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 h-24">
                  {(suppliers as any[]).map((s: any) => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
                <p className="text-xs text-gray-400 mt-1">Ctrl+clic pour sélection multiple</p>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800">Annuler</button>
                <button type="submit" disabled={createMut.isPending || updateMut.isPending} className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl text-sm font-medium">
                  {createMut.isPending || updateMut.isPending ? 'Enregistrement...' : editingId ? 'Modifier' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog {...confirmState} onProceed={proceed} onCancel={cancel} confirmLabel="Supprimer" />
    </div>
  );
};

export default ProductsPage;
