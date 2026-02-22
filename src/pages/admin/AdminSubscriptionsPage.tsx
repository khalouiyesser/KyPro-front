import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '../../api';
import DataTable from '../../components/common/DataTable';
import { Plus, CreditCard, X, CheckCircle2, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const formatTND = (v: number) => `${(v || 0).toFixed(3)} TND`;

const AdminSubscriptionsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [showPayment, setShowPayment] = useState<any>(null);
  const [payForm, setPayForm] = useState({ amount: 0, month: new Date().toISOString().substring(0, 7), notes: '' });

  const { data: users = [], isLoading } = useQuery({ queryKey: ['admin-users'], queryFn: () => usersApi.getAll() });

  const addPaymentMut = useMutation({
    mutationFn: ({ userId, data }: any) => usersApi.addPayment(userId, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-users'] }); toast.success('Paiement enregistré'); setShowPayment(null); setPayForm({ amount: 0, month: new Date().toISOString().substring(0, 7), notes: '' }); }
  });

  const inp = 'w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500';

  const regularUsers = (users as any[]).filter((u: any) => u.role !== 'admin');

  const columns = [
    { key: 'name', header: 'Utilisateur', sortable: true, render: (v: string, row: any) => (
      <div><p className="font-medium text-gray-900 dark:text-white">{v}</p><p className="text-xs text-gray-400">{row.email}</p></div>
    )},
    { key: 'businessName', header: 'Entreprise', sortable: true, render: (v: string) => v || <span className="text-gray-400">—</span> },
    { key: 'subscriptionStatus', header: 'Statut', render: (v: string, row: any) => {
      const isActive = row.subscriptionPaidUntil && new Date(row.subscriptionPaidUntil) > new Date();
      return (
        <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${isActive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700'}`}>
          {isActive ? <><CheckCircle2 size={11} />Actif</> : <><Clock size={11} />Expiré</>}
        </span>
      );
    }},
    { key: 'subscriptionPaidUntil', header: 'Payé jusqu\'au', render: (v: string) => v ? format(new Date(v), 'dd/MM/yyyy') : <span className="text-gray-400">—</span>, sortable: true },
    { key: 'totalPaid', header: 'Total payé', render: (v: number) => formatTND(v || 0), sortable: true },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestion des abonnements</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">{regularUsers.length} utilisateur{regularUsers.length !== 1 ? 's' : ''}</p>
      </div>

      <DataTable data={regularUsers} columns={columns} searchKeys={['name', 'email', 'businessName']}
        isLoading={isLoading} emptyMessage="Aucun utilisateur"
        actions={(row) => (
          <button onClick={() => setShowPayment(row)} className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-medium">
            <CreditCard size={13} /> Paiement
          </button>
        )}
      />

      {showPayment && (
        <div className="fixed inset-0 z-40 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowPayment(null)} />
          <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
            <button onClick={() => setShowPayment(null)} className="absolute top-4 right-4"><X size={18} /></button>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Enregistrer un paiement</h2>
            <p className="text-sm text-gray-500 mb-4">Pour: <strong>{showPayment.name}</strong> — {showPayment.businessName}</p>
            <div className="space-y-3">
              <div><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Montant (TND)</label>
                <input type="number" min={0} step={0.001} value={payForm.amount} onChange={e => setPayForm(f => ({ ...f, amount: +e.target.value }))} className={inp} /></div>
              <div><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Mois d'abonnement</label>
                <input type="month" value={payForm.month} onChange={e => setPayForm(f => ({ ...f, month: e.target.value }))} className={inp} /></div>
              <div><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Notes</label>
                <input value={payForm.notes} onChange={e => setPayForm(f => ({ ...f, notes: e.target.value }))} className={inp} /></div>
              <div className="flex gap-3">
                <button onClick={() => setShowPayment(null)} className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium">Annuler</button>
                <button onClick={() => addPaymentMut.mutate({ userId: showPayment._id, data: payForm })} disabled={!payForm.amount || addPaymentMut.isPending}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-xl text-sm font-medium">
                  {addPaymentMut.isPending ? '...' : 'Confirmer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSubscriptionsPage;
