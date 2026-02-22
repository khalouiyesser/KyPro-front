import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { employeesApi } from '../../api';
import DataTable from '../../components/common/DataTable';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import { Plus, Pencil, Trash2, X, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const formatTND = (v: number) => `${(v || 0).toFixed(3)} TND`;

const CONTRACTS = ['CDI', 'CDD', 'SIVP', 'Stage', 'Intérim', 'Autre'];
const ROLES = ['Gérant', 'Comptable', 'Commercial', 'Technicien', 'Livreur', 'Caissier', 'Secrétaire', 'Autre'];

const defaultForm = {
  firstName: '', lastName: '', phone: '+216', email: '', position: '', department: '',
  contractType: 'CDI', salary: 0, hireDate: new Date().toISOString().split('T')[0],
  cin: '', cnss: '', rib: '', isActive: true, notes: ''
};

const EmployeesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { state: confirmState, confirm, proceed, cancel } = useConfirmDialog();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);

  const { data: employees = [], isLoading } = useQuery({ queryKey: ['employees'], queryFn: () => employeesApi.getAll() });

  const createMut = useMutation({ mutationFn: employeesApi.create, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['employees'] }); toast.success('Employé ajouté'); setShowForm(false); setForm(defaultForm); } });
  const updateMut = useMutation({ mutationFn: ({ id, data }: any) => employeesApi.update(id, data), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['employees'] }); toast.success('Employé modifié'); setShowForm(false); setEditingId(null); setForm(defaultForm); } });
  const deleteMut = useMutation({ mutationFn: employeesApi.remove, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['employees'] }); toast.success('Employé supprimé'); } });

  const handleEdit = (e: any) => {
    setEditingId(e._id);
    setForm({ firstName: e.firstName || '', lastName: e.lastName || '', phone: e.phone || '+216', email: e.email || '', position: e.position || '', department: e.department || '', contractType: e.contractType || 'CDI', salary: e.salary || 0, hireDate: e.hireDate?.split('T')[0] || '', cin: e.cin || '', cnss: e.cnss || '', rib: e.rib || '', isActive: e.isActive ?? true, notes: e.notes || '' });
    setShowForm(true);
  };

  const handleDelete = (e: any) => confirm(
    { title: `Supprimer "${e.firstName} ${e.lastName}"`, message: 'Cet employé sera supprimé.', dangerMessage: 'Toutes les données de cet employé seront supprimées DÉFINITIVEMENT. Nous ne sommes pas responsables de cette perte.', confirmLabel: 'Supprimer définitivement' },
    () => deleteMut.mutate(e._id)
  );

  const inp = 'w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500';

  const columns = [
    { key: 'firstName', header: 'Prénom & Nom', sortable: true, render: (_: any, row: any) => (
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0">
          <User size={14} className="text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <p className="font-medium text-gray-900 dark:text-white">{row.firstName} {row.lastName}</p>
          <p className="text-xs text-gray-400">{row.position || '—'}</p>
        </div>
      </div>
    )},
    { key: 'phone', header: 'Téléphone', sortable: true },
    { key: 'contractType', header: 'Contrat', render: (v: string) => <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded-full">{v}</span>, sortable: true },
    { key: 'salary', header: 'Salaire', render: formatTND, sortable: true },
    { key: 'hireDate', header: 'Embauche', render: (v: string) => v ? format(new Date(v), 'dd/MM/yyyy') : '—', sortable: true },
    { key: 'isActive', header: 'Statut', render: (v: boolean) => (
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${v ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{v ? 'Actif' : 'Inactif'}</span>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ressources Humaines</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">{(employees as any[]).length} employé{(employees as any[]).length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => { setEditingId(null); setForm(defaultForm); setShowForm(true); }} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium">
          <Plus size={16} /> Nouvel employé
        </button>
      </div>

      <DataTable data={employees as any[]} columns={columns} searchKeys={['firstName', 'lastName', 'phone', 'position', 'department']}
        isLoading={isLoading} emptyMessage="Aucun employé"
        actions={(row) => (
          <div className="flex items-center justify-end gap-1">
            <button onClick={() => handleEdit(row)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><Pencil size={15} /></button>
            <button onClick={() => handleDelete(row)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={15} /></button>
          </div>
        )}
      />

      {showForm && (
        <div className="fixed inset-0 z-40 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowForm(false)} className="absolute top-4 right-4"><X size={18} /></button>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-5">{editingId ? 'Modifier l\'employé' : 'Nouvel employé'}</h2>
            <form onSubmit={(e) => { e.preventDefault(); if (editingId) updateMut.mutate({ id: editingId, data: form }); else createMut.mutate(form as any); }} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Prénom <span className="text-red-500">*</span></label><input required value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} className={inp} /></div>
                <div><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Nom <span className="text-red-500">*</span></label><input required value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} className={inp} /></div>
                <div><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Téléphone</label><input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} pattern="^\+216[0-9]{8}$" className={inp} /></div>
                <div><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Email</label><input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className={inp} /></div>
                <div><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Poste</label><input value={form.position} onChange={e => setForm(f => ({ ...f, position: e.target.value }))} className={inp} /></div>
                <div><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Département</label><input value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} className={inp} /></div>
                <div><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Type de contrat</label>
                  <select value={form.contractType} onChange={e => setForm(f => ({ ...f, contractType: e.target.value }))} className={inp}>{CONTRACTS.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                <div><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Salaire (TND)</label><input type="number" min={0} step={0.001} value={form.salary} onChange={e => setForm(f => ({ ...f, salary: +e.target.value }))} className={inp} /></div>
                <div><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Date d'embauche</label><input type="date" value={form.hireDate} onChange={e => setForm(f => ({ ...f, hireDate: e.target.value }))} className={inp} /></div>
                <div><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">CIN</label><input value={form.cin} onChange={e => setForm(f => ({ ...f, cin: e.target.value }))} className={inp} /></div>
                <div><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">N° CNSS</label><input value={form.cnss} onChange={e => setForm(f => ({ ...f, cnss: e.target.value }))} className={inp} /></div>
                <div><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">RIB</label><input value={form.rib} onChange={e => setForm(f => ({ ...f, rib: e.target.value }))} className={inp} /></div>
                <div className="col-span-2"><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Notes</label><textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} className={inp + ' resize-none'} /></div>
                <div className="col-span-2 flex items-center gap-2">
                  <input type="checkbox" id="empActive" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} className="rounded" />
                  <label htmlFor="empActive" className="text-sm text-gray-700 dark:text-gray-300">Employé actif</label>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium">Annuler</button>
                <button type="submit" disabled={createMut.isPending || updateMut.isPending} className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl text-sm font-medium">{createMut.isPending || updateMut.isPending ? 'Enregistrement...' : editingId ? 'Modifier' : 'Créer'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog {...confirmState} onProceed={proceed} onCancel={cancel} />
    </div>
  );
};

export default EmployeesPage;
