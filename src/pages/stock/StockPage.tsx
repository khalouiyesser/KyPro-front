import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { stockApi, productsApi } from '../../api';
import DataTable from '../../components/common/DataTable';
import { AlertTriangle, ArrowDown, ArrowUp, Sliders, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const StockPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [showAdjust, setShowAdjust] = useState(false);
  const [showThreshold, setShowThreshold] = useState<any>(null);
  const [adjustForm, setAdjustForm] = useState({ productId: '', quantity: 0, notes: '' });
  const [thresholdValue, setThresholdValue] = useState(0);
  const [view, setView] = useState<'products' | 'movements'>('products');

  const { data: movements = [], isLoading: movLoading } = useQuery({ queryKey: ['stock-movements'], queryFn: () => stockApi.getMovements() });
  const { data: alerts = [] } = useQuery({ queryKey: ['stock-alerts'], queryFn: () => stockApi.getAlerts() });
  const { data: products = [], isLoading: prodLoading } = useQuery({ queryKey: ['products'], queryFn: () => productsApi.getAll() });

  const adjustMut = useMutation({
    mutationFn: stockApi.adjust,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['stock-movements'] }); queryClient.invalidateQueries({ queryKey: ['products'] }); toast.success('Stock ajusté'); setShowAdjust(false); setAdjustForm({ productId: '', quantity: 0, notes: '' }); },
  });
  const thresholdMut = useMutation({
    mutationFn: ({ productId, threshold }: any) => stockApi.updateThreshold(productId, threshold),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['products'] }); queryClient.invalidateQueries({ queryKey: ['stock-alerts'] }); toast.success('Seuil mis à jour'); setShowThreshold(null); },
  });

  const inp = 'w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500';

  const productColumns = [
    { key: 'name', header: 'Produit', sortable: true, render: (v: string) => <span className="font-medium text-gray-900 dark:text-white">{v}</span> },
    { key: 'stockQuantity', header: 'Quantité', sortable: true, render: (v: number, row: any) => (
      <span className={`font-semibold ${v <= 0 ? 'text-red-600' : v <= (row.stockThreshold || 5) ? 'text-amber-600' : 'text-green-600'}`}>{v} {row.unit}</span>
    )},
    { key: 'stockThreshold', header: 'Seuil alerte', render: (v: number, row: any) => `${v || 5} ${row.unit}` },
    { key: 'purchasePrice', header: 'Prix achat', render: (v: number) => `${(v || 0).toFixed(3)} TND`, sortable: true },
    { key: 'salePrice', header: 'Prix vente', render: (v: number) => `${(v || 0).toFixed(3)} TND`, sortable: true },
    { key: 'stockStatus', header: 'Statut', render: (_: any, row: any) => {
      const qty = row.stockQuantity || 0;
      const th = row.stockThreshold || 5;
      if (qty <= 0) return <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium inline-flex items-center gap-1"><AlertTriangle size={10} />Épuisé</span>;
      if (qty <= th) return <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium inline-flex items-center gap-1"><AlertTriangle size={10} />Stock bas</span>;
      return <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Normal</span>;
    }},
  ];

  const movColumns = [
    { key: 'productName', header: 'Produit', sortable: true },
    { key: 'type', header: 'Type', sortable: true, render: (v: string) => (
      <span className={`flex items-center gap-1 text-xs font-medium w-fit ${v === 'in' ? 'text-green-600' : v === 'out' ? 'text-red-500' : 'text-blue-600'}`}>
        {v === 'in' ? <ArrowDown size={12} /> : v === 'out' ? <ArrowUp size={12} /> : <Sliders size={12} />}
        {v === 'in' ? 'Entrée' : v === 'out' ? 'Sortie' : 'Ajustement'}
      </span>
    )},
    { key: 'quantity', header: 'Quantité', sortable: true, render: (v: number) => <span className={v > 0 ? 'text-green-600' : 'text-red-500'}>{v > 0 ? '+' : ''}{v}</span> },
    { key: 'reference', header: 'Référence', render: (v: string) => v || '—' },
    { key: 'notes', header: 'Notes', render: (v: string) => v || '—' },
    { key: 'createdAt', header: 'Date', render: (v: string) => v ? format(new Date(v), 'dd/MM/yyyy HH:mm') : '-', sortable: true },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestion du stock</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">{(alerts as any[]).length} alerte{(alerts as any[]).length !== 1 ? 's' : ''} de stock bas</p>
        </div>
        <button onClick={() => setShowAdjust(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium">
          <Sliders size={16} /> Ajustement manuel
        </button>
      </div>

      {/* Alerts */}
      {(alerts as any[]).length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={18} className="text-amber-600" />
            <p className="font-semibold text-amber-800 dark:text-amber-300 text-sm">{(alerts as any[]).length} produit{(alerts as any[]).length > 1 ? 's' : ''} en stock bas</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(alerts as any[]).map((a: any) => (
              <div key={a._id} className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-amber-200 dark:border-amber-700 rounded-xl px-3 py-2">
                <AlertTriangle size={12} className="text-amber-600" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">{a.name}</span>
                <span className="text-xs text-gray-500">{a.stockQuantity} {a.unit} / seuil: {a.stockThreshold}</span>
                <button onClick={() => { setShowThreshold(a); setThresholdValue(a.stockThreshold || 5); }} className="text-xs text-blue-600 hover:underline ml-1">Modifier seuil</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* View Toggle */}
      <div className="flex gap-2">
        <button onClick={() => setView('products')} className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${view === 'products' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'}`}>Produits & Stock</button>
        <button onClick={() => setView('movements')} className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${view === 'movements' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'}`}>Mouvements</button>
      </div>

      {view === 'products' ? (
        <DataTable data={products as any[]} columns={productColumns} searchKeys={['name', 'unit']}
          isLoading={prodLoading} emptyMessage="Aucun produit"
          actions={(row) => (
            <button onClick={() => { setShowThreshold(row); setThresholdValue(row.stockThreshold || 5); }} className="text-xs text-blue-600 hover:underline px-2">Seuil</button>
          )}
        />
      ) : (
        <DataTable data={movements as any[]} columns={movColumns} searchKeys={['productName', 'type', 'reference']}
          isLoading={movLoading} emptyMessage="Aucun mouvement de stock" />
      )}

      {/* Adjust Modal */}
      {showAdjust && (
        <div className="fixed inset-0 z-40 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowAdjust(false)} />
          <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
            <button onClick={() => setShowAdjust(false)} className="absolute top-4 right-4"><X size={18} /></button>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-5">Ajustement manuel de stock</h2>
            <div className="space-y-3">
              <div><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Produit <span className="text-red-500">*</span></label>
                <select value={adjustForm.productId} onChange={e => setAdjustForm(f => ({ ...f, productId: e.target.value }))} className={inp}>
                  <option value="">Sélectionner un produit</option>
                  {(products as any[]).map((p: any) => <option key={p._id} value={p._id}>{p.name} (stock: {p.stockQuantity} {p.unit})</option>)}
                </select></div>
              <div><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Quantité (positif=entrée, négatif=sortie)</label>
                <input type="number" value={adjustForm.quantity} onChange={e => setAdjustForm(f => ({ ...f, quantity: +e.target.value }))} className={inp} /></div>
              <div><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Notes</label>
                <input value={adjustForm.notes} onChange={e => setAdjustForm(f => ({ ...f, notes: e.target.value }))} className={inp} /></div>
              <div className="flex gap-3">
                <button onClick={() => setShowAdjust(false)} className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium">Annuler</button>
                <button onClick={() => { if (adjustForm.productId) adjustMut.mutate(adjustForm); }} disabled={!adjustForm.productId || adjustMut.isPending}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl text-sm font-medium">{adjustMut.isPending ? '...' : 'Ajuster'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Threshold Modal */}
      {showThreshold && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowThreshold(null)} />
          <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
            <button onClick={() => setShowThreshold(null)} className="absolute top-4 right-4"><X size={18} /></button>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Seuil d'alerte stock</h2>
            <p className="text-sm text-gray-500 mb-4">Produit: <strong className="text-gray-700 dark:text-gray-300">{showThreshold.name}</strong></p>
            <div className="space-y-3">
              <div><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Seuil d'alerte ({showThreshold.unit})</label>
                <input type="number" min={0} value={thresholdValue} onChange={e => setThresholdValue(+e.target.value)} className={inp} /></div>
              <p className="text-xs text-gray-400">Une notification sera envoyée quand le stock descend sous ce seuil.</p>
              <div className="flex gap-3">
                <button onClick={() => setShowThreshold(null)} className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium">Annuler</button>
                <button onClick={() => thresholdMut.mutate({ productId: showThreshold._id, threshold: thresholdValue })} disabled={thresholdMut.isPending}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl text-sm font-medium">{thresholdMut.isPending ? '...' : 'Sauvegarder'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockPage;
