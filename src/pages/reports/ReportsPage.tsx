import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '../../api';
import { Download, BarChart3, TrendingUp, TrendingDown, Package, Receipt } from 'lucide-react';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const formatTND = (v: number) => `${(v || 0).toFixed(3)} TND`;

const PERIODS = [
  { value: 'week', label: '7 jours' },
  { value: 'month', label: 'Ce mois' },
  { value: 'quarter', label: 'Trimestre' },
  { value: 'semester', label: 'Semestre' },
  { value: 'year', label: 'Année' },
];

const COLORS = ['#2563EB', '#7C3AED', '#059669', '#DC2626', '#D97706'];

const ReportsPage: React.FC = () => {
  const [period, setPeriod] = useState('month');

  const { data: salesData } = useQuery({ queryKey: ['reports-sales', period], queryFn: () => reportsApi.getSales({ period }) });
  const { data: purchasesData } = useQuery({ queryKey: ['reports-purchases', period], queryFn: () => reportsApi.getPurchases({ period }) });
  const { data: chargesData } = useQuery({ queryKey: ['reports-charges', period], queryFn: () => reportsApi.getCharges({ period }) });
  const { data: stockData } = useQuery({ queryKey: ['reports-stock'], queryFn: () => reportsApi.getStock() });

  const handleExport = async (type: string, fmt: string) => {
    try {
      const blob = await reportsApi.export(type, { period, format: fmt });
      const url = URL.createObjectURL(blob); const a = document.createElement('a');
      a.href = url; a.download = `rapport-${type}-${period}.${fmt}`; a.click(); URL.revokeObjectURL(url);
    } catch { toast.error('Erreur lors de l\'export'); }
  };

  const netResult = (salesData?.total || 0) - (purchasesData?.total || 0) - (chargesData?.total || 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Rapports & Analyses</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Vue synthétique de votre activité</p>
        </div>
        <div className="flex gap-1">
          {PERIODS.map(p => (
            <button key={p.value} onClick={() => setPeriod(p.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${period === p.value ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50'}`}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Chiffre d\'affaires', value: formatTND(salesData?.total || 0), icon: TrendingUp, color: 'bg-blue-600', sub: `${salesData?.count || 0} ventes` },
          { label: 'Achats', value: formatTND(purchasesData?.total || 0), icon: TrendingDown, color: 'bg-violet-600', sub: `${purchasesData?.count || 0} achats` },
          { label: 'Charges', value: formatTND(chargesData?.total || 0), icon: Receipt, color: 'bg-red-500', sub: `${chargesData?.count || 0} charges` },
          { label: 'Résultat net', value: formatTND(netResult), icon: BarChart3, color: netResult >= 0 ? 'bg-emerald-600' : 'bg-red-600', sub: netResult >= 0 ? 'Bénéfice' : 'Déficit' },
        ].map(({ label, value, icon: Icon, color, sub }) => (
          <div key={label} className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{label}</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
                <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
              </div>
              <div className={`p-2.5 rounded-xl ${color}`}><Icon size={18} className="text-white" /></div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 dark:text-white">Évolution des ventes</h2>
            <div className="flex gap-2">
              <button onClick={() => handleExport('sales', 'pdf')} className="text-xs flex items-center gap-1 px-2 py-1 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50"><Download size={12} />PDF</button>
              <button onClick={() => handleExport('sales', 'xlsx')} className="text-xs flex items-center gap-1 px-2 py-1 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50"><Download size={12} />Excel</button>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={salesData?.monthly || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="period" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: any) => formatTND(v)} />
              <Bar dataKey="revenue" fill="#2563EB" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 dark:text-white">Répartition des charges</h2>
            <button onClick={() => handleExport('charges', 'pdf')} className="text-xs flex items-center gap-1 px-2 py-1 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50"><Download size={12} />PDF</button>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={chargesData?.byType || []} dataKey="total" nameKey="type" cx="50%" cy="50%" outerRadius={80} label={({ type, percent }: any) => `${type} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                {(chargesData?.byType || []).map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v: any) => formatTND(v)} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Stock Summary */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900 dark:text-white">État du stock</h2>
          <button onClick={() => handleExport('stock', 'xlsx')} className="text-xs flex items-center gap-1 px-2 py-1 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50"><Download size={12} />Exporter</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 dark:bg-gray-800 text-xs">
              <th className="text-left px-3 py-2 text-gray-500">Produit</th>
              <th className="px-3 py-2 text-gray-500 text-right">Stock</th>
              <th className="px-3 py-2 text-gray-500 text-right">Unité</th>
              <th className="px-3 py-2 text-gray-500 text-right">Valeur</th>
              <th className="px-3 py-2 text-gray-500">Statut</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {(stockData?.products || []).slice(0, 10).map((p: any) => (
                <tr key={p._id}>
                  <td className="px-3 py-2.5 font-medium text-gray-900 dark:text-white">{p.name}</td>
                  <td className="px-3 py-2.5 text-right text-gray-700 dark:text-gray-300">{p.stockQuantity}</td>
                  <td className="px-3 py-2.5 text-right text-gray-400">{p.unit}</td>
                  <td className="px-3 py-2.5 text-right text-gray-700 dark:text-gray-300">{formatTND(p.stockQuantity * (p.purchasePrice || 0))}</td>
                  <td className="px-3 py-2.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.stockQuantity <= 0 ? 'bg-red-100 text-red-700' : p.stockQuantity <= (p.stockThreshold || 5) ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                      {p.stockQuantity <= 0 ? 'Épuisé' : p.stockQuantity <= (p.stockThreshold || 5) ? 'Bas' : 'Normal'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
