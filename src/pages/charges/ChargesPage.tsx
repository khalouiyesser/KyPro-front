import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chargesApi } from '../../api';
import DataTable from '../../components/common/DataTable';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import { Plus, Pencil, Trash2, X, Sparkles, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { useAuth } from '../../context/AuthContext';

const formatTND = (v: number) => `${(v || 0).toFixed(3)} TND`;

const CHARGE_TYPES = ['rent', 'salary', 'utilities', 'equipment', 'marketing', 'tax', 'insurance', 'accounting', 'fuel', 'other'];
const TYPE_LABELS: Record<string, string> = {
  rent: 'Loyer', salary: 'Salaires', utilities: 'Services publics', equipment: 'Équipement',
  marketing: 'Marketing', tax: 'Taxes & Impôts', insurance: 'Assurance', accounting: 'Comptabilité',
  fuel: 'Carburant', other: 'Autre'
};

const defaultForm = {
  description: '', amount: 0, date: new Date().toISOString().split('T')[0],
  type: 'other', source: '', notes: '', vatAmount: 0, receiptFile: ''
};

const ChargesPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { state: confirmState, confirm, proceed, cancel } = useConfirmDialog();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);

  const { data: charges = [], isLoading } = useQuery({ queryKey: ['charges'], queryFn: () => chargesApi.getAll() });

  const ocrLeft = (user as any)?.ocrAttemptsLeft ?? 5;

  const createMut = useMutation({ mutationFn: chargesApi.create, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['charges'] }); toast.success('Charge ajoutée'); setShowForm(false); setForm(defaultForm); } });
  const updateMut = useMutation({ mutationFn: ({ id, data }: any) => chargesApi.update(id, data), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['charges'] }); toast.success('Charge modifiée'); setShowForm(false); setEditingId(null); setForm(defaultForm); } });
  const deleteMut = useMutation({ mutationFn: chargesApi.remove, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['charges'] }); toast.success('Charge supprimée'); } });
  const analyzeMut = useMutation({
    mutationFn: chargesApi.analyzeWithAI,
    onSuccess: (data: any) => {
      if (data) {
        setForm(f => ({ ...f, ...data }));
        toast.success('Facture analysée avec l\'IA');
      }
      queryClient.invalidateQueries({ queryKey: ['auth-user'] });
    },
    onError: () => toast.error('Analyse échouée'),
    onSettled: () => setAnalyzingId(null),
  });

  const handleEdit = (c: any) => { setEditingId(c._id); setForm({ description: c.description || '', amount: c.amount || 0, date: c.date?.split('T')[0] || '', type: c.type || 'other', source: c.source || '', notes: c.notes || '', vatAmount: c.vatAmount || 0, receiptFile: c.receiptFile || '' }); setShowForm(true); };
  const handleDelete = (c: any) => confirm(
    { title: `Supprimer "${c.description}"`, message: `Cette charge de ${formatTND(c.amount)} sera supprimée.`, dangerMessage: 'Cette charge sera supprimée DÉFINITIVEMENT. Nous ne sommes pas responsables de cette perte.', confirmLabel: 'Supprimer définitivement' },
    () => deleteMut.mutate(c._id)
  );

  const inp = 'w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500';

  const columns = [
    { key: 'description', header: 'Description', sortable: true, render: (v: string) => <span className="font-medium text-gray-900 dark:text-white">{v}</span> },
    { key: 'type', header: 'Type', render: (v: string) => <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded-full">{TYPE_LABELS[v] || v}</span>, sortable: true },
    { key: 'amount', header: 'Montant HT', render: formatTND, sortable: true },
    { key: 'vatAmount', header: 'TVA', render: (v: number) => v ? formatTND(v) : '—', sortable: true },
    { key: 'source', header: 'Référence', render: (v: string) => v || '—' },
    { key: 'date', header: 'Date', render: (v: string) => v ? format(new Date(v), 'dd/MM/yyyy') : '-', sortable: true },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Charges & Factures</h1>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-gray-500 dark:text-gray-400 text-sm">{(charges as any[]).length} charge{(charges as any[]).length !== 1 ? 's' : ''}</p>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ocrLeft > 0 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
              <Sparkles size={11} className="inline mr-1" />IA: {ocrLeft}/5 analyses restantes
            </span>
          </div>
        </div>
        <button onClick={() => { setEditingId(null); setForm(defaultForm); setShowForm(true); }} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium">
          <Plus size={16} /> Ajouter une charge
        </button>
      </div>

      <DataTable data={charges as any[]} columns={columns} searchKeys={['description', 'type', 'source']}
        isLoading={isLoading} emptyMessage="Aucune charge"
        actions={(row) => (
          <div className="flex items-center justify-end gap-1">
            {ocrLeft > 0 && (
              <button onClick={() => { setAnalyzingId(row._id); analyzeMut.mutate(row._id); }}
                disabled={analyzeMut.isPending}
                className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg" title="Analyser avec IA">
                {analyzingId === row._id && analyzeMut.isPending ? <div className="w-3 h-3 border border-purple-600/30 border-t-purple-600 rounded-full animate-spin" /> : <Sparkles size={15} />}
              </button>
            )}
            <button onClick={() => handleEdit(row)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><Pencil size={15} /></button>
            <button onClick={() => handleDelete(row)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={15} /></button>
          </div>
        )}
      />

      {showForm && (
        <div className="fixed inset-0 z-40 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowForm(false)} className="absolute top-4 right-4"><X size={18} /></button>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-5">{editingId ? 'Modifier la charge' : 'Nouvelle charge'}</h2>
            <form onSubmit={(e) => { e.preventDefault(); if (editingId) updateMut.mutate({ id: editingId, data: form }); else createMut.mutate(form as any); }} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2"><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Description <span className="text-red-500">*</span></label>
                  <input required value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className={inp} /></div>
                <div><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Montant HT (TND) <span className="text-red-500">*</span></label>
                  <input required type="number" min={0} step={0.001} value={form.amount} onChange={e => setForm(f => ({ ...f, amount: +e.target.value }))} className={inp} /></div>
                <div><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">TVA (TND)</label>
                  <input type="number" min={0} step={0.001} value={form.vatAmount} onChange={e => setForm(f => ({ ...f, vatAmount: +e.target.value }))} className={inp} /></div>
                <div><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Date <span className="text-red-500">*</span></label>
                  <input required type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className={inp} /></div>
                <div><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Type</label>
                  <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className={inp}>{CHARGE_TYPES.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}</select></div>
                <div><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Référence facture</label>
                  <input value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))} className={inp} /></div>
                <div><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Notes</label>
                  <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className={inp} /></div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Image de la facture (URL ou chemin)</label>
                  <input value={form.receiptFile} onChange={e => setForm(f => ({ ...f, receiptFile: e.target.value }))} placeholder="URL de l'image..." className={inp} />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium">Annuler</button>
                <button type="submit" disabled={createMut.isPending || updateMut.isPending} className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl text-sm font-medium">{createMut.isPending || updateMut.isPending ? '...' : editingId ? 'Modifier' : 'Ajouter'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog {...confirmState} onProceed={proceed} onCancel={cancel} />
    </div>
  );
};

export default ChargesPage;
