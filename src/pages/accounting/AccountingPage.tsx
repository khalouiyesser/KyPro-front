import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { accountingApi } from '../../api';
import { TrendingUp, TrendingDown, Scale, Receipt } from 'lucide-react';

const formatTND = (v: number) => `${(v || 0).toFixed(3)} TND`;

const AccountingPage: React.FC = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['accounting', startDate, endDate],
    queryFn: () => accountingApi.getSummary({ startDate, endDate }),
  });

  const Card = ({ title, value, sub, icon: Icon, color }: any) => (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800">
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
        <div className={`p-2 rounded-xl ${color}`}><Icon size={18} className="text-white" /></div>
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{isLoading ? '...' : value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Comptabilité</h1>
        <div className="flex items-center gap-3">
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
          <span className="text-gray-400 text-sm">au</span>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card title="Chiffre d'affaires HT" value={formatTND(data?.revenue?.totalHT)} sub={`Encaissé: ${formatTND(data?.revenue?.totalPaid)}`} icon={TrendingUp} color="bg-blue-600" />
        <Card title="Achats HT" value={formatTND(data?.purchases?.totalHT)} sub={`Payé: ${formatTND(data?.purchases?.totalPaid)}`} icon={TrendingDown} color="bg-violet-600" />
        <Card title="Charges" value={formatTND(data?.charges?.total)} icon={Receipt} color="bg-orange-500" />
        <Card title="Bénéfice net" value={formatTND(data?.profit?.net)} sub={`Brut: ${formatTND(data?.profit?.gross)}`} icon={Scale} color={data?.profit?.net >= 0 ? 'bg-emerald-600' : 'bg-red-500'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* TVA Section */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">TVA</h2>
          <div className="space-y-3">
            {[
              ['TVA collectée (ventes)', data?.tva?.collected, 'text-blue-600'],
              ['TVA déductible (achats)', data?.tva?.deductible, 'text-violet-600'],
              ['Solde TVA', data?.tva?.balance, data?.tva?.balance >= 0 ? 'text-red-600' : 'text-green-600'],
            ].map(([label, value, cls]) => (
              <div key={label as string} className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-800 last:border-0">
                <span className="text-sm text-gray-600 dark:text-gray-400">{label as string}</span>
                <span className={`font-semibold text-sm ${cls as string}`}>{isLoading ? '...' : formatTND(value as number)}</span>
              </div>
            ))}
          </div>
          {data?.tva?.toPay > 0 && (
            <div className="mt-4 bg-red-50 dark:bg-red-900/20 rounded-xl p-3 text-sm text-red-700 dark:text-red-400">
              ⚠️ TVA à payer: <strong>{formatTND(data.tva.toPay)}</strong>
            </div>
          )}
          {data?.tva?.toRefund > 0 && (
            <div className="mt-4 bg-green-50 dark:bg-green-900/20 rounded-xl p-3 text-sm text-green-700 dark:text-green-400">
              ✓ Crédit TVA: <strong>{formatTND(data.tva.toRefund)}</strong>
            </div>
          )}
        </div>

        {/* Revenue breakdown */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Résumé financier</h2>
          <div className="space-y-3">
            {[
              ['CA Total TTC', data?.revenue?.totalTTC],
              ['CA Total HT', data?.revenue?.totalHT],
              ['Achats Total TTC', data?.purchases?.totalTTC],
              ['Achats Total HT', data?.purchases?.totalHT],
              ['Charges', data?.charges?.total],
            ].map(([label, value]) => (
              <div key={label as string} className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-800 last:border-0">
                <span className="text-sm text-gray-600 dark:text-gray-400">{label as string}</span>
                <span className="font-medium text-sm text-gray-900 dark:text-white">{isLoading ? '...' : formatTND(value as number)}</span>
              </div>
            ))}
            <div className="flex items-center justify-between py-2 bg-gray-50 dark:bg-gray-800 rounded-xl px-3 mt-2">
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Bénéfice net</span>
              <span className={`font-bold text-sm ${(data?.profit?.net || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{isLoading ? '...' : formatTND(data?.profit?.net)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountingPage;
