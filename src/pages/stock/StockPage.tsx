import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { stockApi, productsApi } from '../../api';
import DataTable from '../../components/common/DataTable';
import { useI18n } from '../../context/I18nContext';
import { AlertTriangle, ArrowDown, ArrowUp, Sliders, X, Package, TrendingDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const StockPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { t, dir } = useI18n();

  const [showAdjust,     setShowAdjust]     = useState(false);
  const [showThreshold,  setShowThreshold]  = useState<any>(null);
  const [adjustForm,     setAdjustForm]     = useState({ productId: '', quantity: '', notes: '' });
  const [thresholdValue, setThresholdValue] = useState(0);
  const [view,           setView]           = useState<'products' | 'movements'>('products');

  /* ── Queries ──────────────────────────────────────────────────────────── */
  const { data: movements = [], isLoading: movLoading } = useQuery({
    queryKey: ['stock-movements'],
    queryFn:  () => stockApi.getMovements(),
  });
  const { data: products = [], isLoading: prodLoading } = useQuery({
    queryKey: ['products'],
    queryFn:  () => productsApi.getAll(),
  });

  /* ── Alertes calculées côté client ───────────────────────────────────── */
  const alerts = (products as any[]).filter(
      (p: any) => (p.stockQuantity ?? 0) <= (p.stockThreshold ?? 5),
  );

  /* ── Mutations ────────────────────────────────────────────────────────── */
  const adjustMut = useMutation({
    mutationFn: stockApi.adjust,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success(t('stock.adjust'));
      setShowAdjust(false);
      setAdjustForm({ productId: '', quantity: '', notes: '' });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || t('error.generic')),
  });

  const thresholdMut = useMutation({
    mutationFn: ({ productId, threshold }: any) => stockApi.updateThreshold(productId, threshold),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success(t('stock.thresholdSaved'));
      setShowThreshold(null);
    },
    onError: () => toast.error(t('error.generic')),
  });

  const inp = 'w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500';

  /* ── Colonnes Produits ────────────────────────────────────────────────── */
  const productColumns = [
    {
      key: 'name', header: t('products.title'), sortable: true,
      render: (v: string) => <span className="font-medium text-gray-900 dark:text-white">{v}</span>,
    },
    {
      key: 'stockQuantity', header: t('stock.quantity'), sortable: true,
      render: (v: number, row: any) => {
        const th  = row.stockThreshold ?? 5;
        const cls = v <= 0 ? 'text-red-600 dark:text-red-400' : v <= th ? 'text-amber-600 dark:text-amber-400' : 'text-green-600 dark:text-green-400';
        return <span className={`font-semibold ${cls}`}>{v ?? 0} {row.unit}</span>;
      },
    },
    {
      key: 'stockThreshold', header: t('stock.threshold'), sortable: true,
      render: (v: number, row: any) => <span className="text-gray-500 dark:text-gray-400">{v ?? 5} {row.unit}</span>,
    },
    {
      key: 'purchasePrice', header: t('products.purchasePrice'), sortable: true,
      render: (v: number) => `${(v || 0).toFixed(3)} TND`,
    },
    {
      key: 'salePrice', header: t('products.salePrice'), sortable: true,
      render: (v: number) => `${(v || 0).toFixed(3)} TND`,
    },
    {
      key: 'stockStatus', header: t('common.status'),
      render: (_: any, row: any) => {
        const qty = row.stockQuantity ?? 0;
        const th  = row.stockThreshold ?? 5;
        if (qty <= 0)  return <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-2 py-0.5 rounded-full font-medium inline-flex items-center gap-1"><AlertTriangle size={10} />{t('products.outOfStock')}</span>;
        if (qty <= th) return <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full font-medium inline-flex items-center gap-1"><AlertTriangle size={10} />{t('products.lowStock')}</span>;
        return <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full font-medium">{t('stock.normal')}</span>;
      },
    },
  ];

  /* ── Colonnes Mouvements ──────────────────────────────────────────────── */
  const movColumns = [
    {
      key: 'productName', header: t('products.title'), sortable: true,
      render: (v: string) => <span className="font-medium text-gray-900 dark:text-white">{v}</span>,
    },
    {
      key: 'type', header: t('common.type'), sortable: true,
      render: (v: string) => {
        const map: Record<string, { label: string; cls: string; Icon: any }> = {
          in:         { label: t('stock.in'),         cls: 'text-green-600 dark:text-green-400', Icon: ArrowDown },
          out:        { label: t('stock.out'),        cls: 'text-red-500 dark:text-red-400',    Icon: ArrowUp   },
          adjustment: { label: t('stock.adjustment'), cls: 'text-blue-600 dark:text-blue-400',  Icon: Sliders   },
          IN:         { label: t('stock.in'),         cls: 'text-green-600 dark:text-green-400', Icon: ArrowDown },
          OUT:        { label: t('stock.out'),        cls: 'text-red-500 dark:text-red-400',    Icon: ArrowUp   },
          ADJUSTMENT: { label: t('stock.adjustment'), cls: 'text-blue-600 dark:text-blue-400',  Icon: Sliders   },
        };
        const cfg = map[v] || { label: v, cls: 'text-gray-500', Icon: Sliders };
        return (
            <span className={`flex items-center gap-1 text-xs font-medium w-fit ${cfg.cls}`}>
            <cfg.Icon size={12} />
              {cfg.label}
          </span>
        );
      },
    },
    {
      key: 'quantity', header: t('stock.quantity'), sortable: true,
      render: (v: number) => (
          <span className={v > 0 ? 'text-green-600 dark:text-green-400 font-semibold' : 'text-red-500 dark:text-red-400 font-semibold'}>
          {v > 0 ? '+' : ''}{v}
        </span>
      ),
    },
    {
      key: 'stockBefore', header: t('stock.before'),
      render: (v: number) => <span className="text-gray-500 dark:text-gray-400">{v ?? '—'}</span>,
    },
    {
      key: 'stockAfter', header: t('stock.after'),
      render: (v: number) => <span className="font-medium text-gray-900 dark:text-white">{v ?? '—'}</span>,
    },
    {
      key: 'source', header: t('stock.source'),
      render: (v: string) => v
          ? <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full">{v}</span>
          : '—',
    },
    {
      key: 'notes', header: t('common.notes'),
      render: (v: string) => <span className="text-gray-400 text-xs truncate max-w-[120px] block">{v || '—'}</span>,
    },
    {
      key: 'createdAt', header: t('common.date'), sortable: true,
      render: (v: string) => v ? format(new Date(v), 'dd/MM/yyyy HH:mm') : '—',
    },
  ];

  /* ── Stats rapides ────────────────────────────────────────────────────── */
  const totalProducts  = (products as any[]).length;
  const lowStockCount  = (products as any[]).filter((p: any) => (p.stockQuantity ?? 0) > 0 && (p.stockQuantity ?? 0) <= (p.stockThreshold ?? 5)).length;
  const outStockCount  = (products as any[]).filter((p: any) => (p.stockQuantity ?? 0) <= 0).length;
  const totalMovements = (movements as any[]).length;

  /* ── Calcul aperçu ajustement ─────────────────────────────────────────── */
  const parsedQty      = adjustForm.quantity === '' ? 0 : Number(adjustForm.quantity);
  const isValidSubmit  = adjustForm.productId !== '' && adjustForm.quantity !== '' && parsedQty !== 0;
  const selectedProduct = (products as any[]).find((p: any) => p._id === adjustForm.productId);
  const previewAfter    = selectedProduct != null ? (selectedProduct.stockQuantity ?? 0) + parsedQty : null;

  /* ════════════════════════════════════════════════════════════════════════ */
  return (
      <div className="space-y-4 sm:space-y-6" dir={dir}>

        {/* ── En-tête ── */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{t('stock.title')}</h1>
            <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">
              {alerts.length > 0
                  ? <span className="text-amber-600 dark:text-amber-400">{alerts.length} {t('stock.alerts')}</span>
                  : <span className="text-green-600 dark:text-green-400">{t('dashboard.stockOk')}</span>
              }
            </p>
          </div>
          <button
              onClick={() => setShowAdjust(true)}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-medium transition-colors shrink-0"
          >
            <Sliders size={15} />
            <span>{t('stock.adjust')}</span>
          </button>
        </div>

        {/* ── Stats cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          {[
            { label: t('products.title'),      value: totalProducts,  cls: 'text-blue-600 dark:text-blue-400',   Icon: Package       },
            { label: t('stock.movements'),     value: totalMovements, cls: 'text-gray-700 dark:text-gray-300',   Icon: Sliders       },
            { label: t('products.lowStock'),   value: lowStockCount,  cls: 'text-amber-600 dark:text-amber-400', Icon: TrendingDown  },
            { label: t('products.outOfStock'), value: outStockCount,  cls: 'text-red-600 dark:text-red-400',     Icon: AlertTriangle },
          ].map(({ label, value, cls, Icon }) => (
              <div key={label} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-3 sm:p-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{label}</p>
                  <Icon size={14} className={cls} />
                </div>
                <p className={`text-xl sm:text-2xl font-bold ${cls}`}>{value}</p>
              </div>
          ))}
        </div>

        {/* ── Alertes ── */}
        {alerts.length > 0 && (
            <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-2xl p-3 sm:p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={16} className="text-amber-600 dark:text-amber-400 shrink-0" />
                <p className="font-semibold text-amber-800 dark:text-amber-300 text-xs sm:text-sm">
                  {alerts.length} {alerts.length > 1 ? t('stock.productsLowStock') : t('products.lowStock')}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {alerts.map((a: any) => (
                    <div key={a._id} className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-amber-200 dark:border-amber-700 rounded-xl px-2.5 sm:px-3 py-2 flex-wrap">
                      <AlertTriangle size={11} className="text-amber-600 shrink-0" />
                      <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">{a.name}</span>
                      <span className="text-xs text-gray-400">
                  {a.stockQuantity ?? 0} {a.unit} / {t('stock.threshold')}: {a.stockThreshold ?? 5}
                </span>
                      <button
                          onClick={() => { setShowThreshold(a); setThresholdValue(a.stockThreshold ?? 5); }}
                          className="text-xs text-blue-600 dark:text-blue-400 hover:underline ml-0.5"
                      >
                        {t('stock.editThreshold')}
                      </button>
                    </div>
                ))}
              </div>
            </div>
        )}

        {/* ── Tabs ── */}
        <div className="flex gap-2">
          {(['products', 'movements'] as const).map((tab) => (
              <button
                  key={tab}
                  onClick={() => setView(tab)}
                  className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors ${
                      view === tab
                          ? 'bg-blue-600 text-white'
                          : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
              >
                {tab === 'products' ? t('stock.stockProducts') : t('stock.movements')}
              </button>
          ))}
        </div>

        {/* ── Tables ── */}
        {view === 'products' ? (
            <DataTable
                data={products as any[]}
                columns={productColumns}
                searchKeys={['name', 'unit']}
                isLoading={prodLoading}
                emptyMessage={t('common.noData')}
                actions={(row) => (
                    <button
                        onClick={() => { setShowThreshold(row); setThresholdValue(row.stockThreshold ?? 5); }}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline px-2 whitespace-nowrap"
                    >
                      {t('stock.threshold')}
                    </button>
                )}
            />
        ) : (
            <DataTable
                data={movements as any[]}
                columns={movColumns}
                searchKeys={['productName', 'type', 'source']}
                isLoading={movLoading}
                emptyMessage={t('common.noData')}
            />
        )}

        {/* ══════════════════════════════════════════════════════════════════
          MODAL : Ajustement manuel — bottom sheet mobile
      ══════════════════════════════════════════════════════════════════ */}
        {showAdjust && (
            <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center">
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowAdjust(false)} />
              <div className="relative bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-sm mx-0 sm:mx-4 p-5 sm:p-6">
                <div className="w-10 h-1 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-4 sm:hidden" />
                <button
                    onClick={() => setShowAdjust(false)}
                    className="absolute top-4 right-4 p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                >
                  <X size={18} />
                </button>
                <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-5">{t('stock.adjust')}</h2>

                <div className="space-y-3">

                  {/* Produit */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('products.title')} <span className="text-red-500">*</span>
                    </label>
                    <select
                        value={adjustForm.productId}
                        onChange={e => setAdjustForm(f => ({ ...f, productId: e.target.value }))}
                        className={inp}
                    >
                      <option value="">{t('common.search')}</option>
                      {(products as any[]).map((p: any) => (
                          <option key={p._id} value={p._id}>
                            {p.name} — {t('stock.quantity')}: {p.stockQuantity ?? 0} {p.unit}
                          </option>
                      ))}
                    </select>
                  </div>

                  {/* Quantité — sans min, accepte les négatifs */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('stock.quantityHint')} <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="number"
                        value={adjustForm.quantity}
                        onChange={e => setAdjustForm(f => ({ ...f, quantity: e.target.value }))}
                        placeholder="ex: 10 ou -2"
                        step="1"
                        className={inp}
                        autoFocus
                    />

                    {/* Aperçu entrée / sortie */}
                    {adjustForm.quantity !== '' && parsedQty !== 0 && (
                        <div className={`mt-1.5 flex items-center gap-1.5 text-xs font-medium ${parsedQty > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                          {parsedQty > 0
                              ? <><ArrowDown size={12} /> {t('stock.in')} : +{parsedQty}</>
                              : <><ArrowUp   size={12} /> {t('stock.out')} : {parsedQty}</>
                          }
                          {previewAfter !== null && (
                              <span className="text-gray-400 dark:text-gray-500 font-normal ms-1">
                        → {t('stock.after')} : <strong className="text-gray-700 dark:text-gray-300">{previewAfter}</strong>
                      </span>
                          )}
                        </div>
                    )}
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('common.notes')}</label>
                    <input
                        value={adjustForm.notes}
                        onChange={e => setAdjustForm(f => ({ ...f, notes: e.target.value }))}
                        placeholder={t('common.optional')}
                        className={inp}
                    />
                  </div>

                  <div className="flex gap-3 pt-1">
                    <button
                        type="button"
                        onClick={() => setShowAdjust(false)}
                        className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      {t('common.cancel')}
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                          if (isValidSubmit) {
                            adjustMut.mutate({ ...adjustForm, quantity: parsedQty } as any);
                          }
                        }}
                        disabled={!isValidSubmit || adjustMut.isPending}
                        className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl text-sm font-medium transition-colors"
                    >
                      {adjustMut.isPending ? t('common.loading') : t('common.confirm')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
          MODAL : Seuil d'alerte — bottom sheet mobile
      ══════════════════════════════════════════════════════════════════ */}
        {showThreshold && (
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowThreshold(null)} />
              <div className="relative bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-sm mx-0 sm:mx-4 p-5 sm:p-6">
                <div className="w-10 h-1 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-4 sm:hidden" />
                <button
                    onClick={() => setShowThreshold(null)}
                    className="absolute top-4 right-4 p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                >
                  <X size={18} />
                </button>
                <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-1">{t('stock.alerts')}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  {t('products.title')} : <strong className="text-gray-700 dark:text-gray-300">{showThreshold.name}</strong>
                </p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('stock.threshold')} ({showThreshold.unit})
                    </label>
                    <input
                        type="number"
                        min={0}
                        value={thresholdValue}
                        onChange={e => setThresholdValue(+e.target.value)}
                        className={inp}
                        autoFocus
                    />
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{t('stock.thresholdHint')}</p>
                  </div>
                  <div className="flex gap-3 pt-1">
                    <button
                        type="button"
                        onClick={() => setShowThreshold(null)}
                        className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      {t('common.cancel')}
                    </button>
                    <button
                        type="button"
                        onClick={() => thresholdMut.mutate({ productId: showThreshold._id, threshold: thresholdValue })}
                        disabled={thresholdMut.isPending}
                        className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl text-sm font-medium transition-colors"
                    >
                      {thresholdMut.isPending ? t('common.loading') : t('common.save')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
        )}

      </div>
  );
};

export default StockPage;