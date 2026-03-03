// // import React, { useState } from 'react';
// // import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// // import { useNavigate } from 'react-router-dom';          // ← ajout
// // import {clientsApi} from '../../api';
// // import DataTable from '../../components/common/DataTable';
// // import ConfirmDialog from '../../components/common/ConfirmDialog';
// // import { useConfirmDialog } from '../../hooks/useConfirmDialog';
// // import {
// //   Plus, Pencil, Trash2, Eye, UserCheck, UserX, X, Phone,
// // } from 'lucide-react';
// // import toast from 'react-hot-toast';
// // import { format } from 'date-fns';
// //
// // const formatTND = (v: number) => `${(v || 0).toFixed(3)} TND`;
// // const todayStr  = () => new Date().toISOString().split('T')[0];
// //
// // interface ClientFormData {
// //   name: string;
// //   firstName: string;
// //   phone: string;
// //   email: string;
// //   sector: string;
// //   creditLimit: number;
// //   isActive: boolean;
// //   notes: string;
// // }
// //
// // const defaultForm: ClientFormData = {
// //   name: '', firstName: '', phone: '+216', email: '',
// //   sector: '', creditLimit: 0, isActive: true, notes: '',
// // };
// //
// //
// // const ClientsPage: React.FC = () => {
// //   const queryClient = useQueryClient();
// //   const navigate = useNavigate();                         // ← ajout
// //   const { state: confirmState, confirm, proceed, cancel } = useConfirmDialog();
// //
// //   // ── State ────────────────────────────────────────────────────────────────────
// //   const [showForm,             setShowForm]             = useState(false);
// //   const [editingId,            setEditingId]            = useState<string | null>(null);
// //   const [form,                 setForm]                 = useState<ClientFormData>(defaultForm);
// //   const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
// //
// //   // ── Queries ──────────────────────────────────────────────────────────────────
// //   const { data: clients = [], isLoading } = useQuery({
// //     queryKey: ['clients'],
// //     queryFn:  () => clientsApi.getAll(),
// //   });
// //
// //   // ── Mutations ────────────────────────────────────────────────────────────────
// //   const createMut = useMutation({
// //     mutationFn: clientsApi.create,
// //     onSuccess: () => {
// //       queryClient.invalidateQueries({ queryKey: ['clients'] });
// //       toast.success('Client créé');
// //       setShowForm(false);
// //       setForm(defaultForm);
// //     },
// //     onError: (err: any) => {
// //       if (err?.response?.status === 409) setShowDuplicateWarning(true);
// //       else {
// //         const msg = err?.response?.data?.message;
// //         toast.error(Array.isArray(msg) ? msg[0] : msg || 'Erreur');
// //       }
// //     },
// //   });
// //
// //   const updateMut = useMutation({
// //     mutationFn: ({ id, data }: any) => clientsApi.update(id, data),
// //     onSuccess: () => {
// //       queryClient.invalidateQueries({ queryKey: ['clients'] });
// //       toast.success('Client modifié');
// //       setShowForm(false);
// //       setEditingId(null);
// //       setForm(defaultForm);
// //     },
// //     onError: (err: any) => {
// //       const msg = err?.response?.data?.message;
// //       toast.error(Array.isArray(msg) ? msg[0] : msg || 'Erreur');
// //     },
// //   });
// //
// //   const deleteMut = useMutation({
// //     mutationFn: clientsApi.remove,
// //     onSuccess: () => {
// //       queryClient.invalidateQueries({ queryKey: ['clients'] });
// //       toast.success('Client supprimé');
// //     },
// //   });
// //
// //   // ── Handlers ─────────────────────────────────────────────────────────────────
// //   const handleEdit = (client: any) => {
// //     setEditingId(client._id);
// //     setForm({
// //       name:        client.name        || '',
// //       firstName:   client.firstName   || '',
// //       phone:       client.phone       || '+216',
// //       email:       client.email       || '',
// //       sector:      client.sector      || '',
// //       creditLimit: client.creditLimit || 0,
// //       isActive:    client.isActive    ?? true,
// //       notes:       client.notes       || '',
// //     });
// //     setShowForm(true);
// //   };
// //
// //   const handleDelete = (client: any) => {
// //     confirm(
// //         {
// //           title:         `Supprimer le client "${client.name}"`,
// //           message:       `Vous êtes sur le point de supprimer "${client.name}". Cette action est irréversible.`,
// //           dangerMessage: 'Toutes les données (achats, paiements, historique) seront supprimées DÉFINITIVEMENT.',
// //           confirmLabel:  'Supprimer définitivement',
// //         },
// //         () => deleteMut.mutate(client._id),
// //     );
// //   };
// //
// //   const handleSubmit = (e: React.FormEvent) => {
// //     e.preventDefault();
// //     const payload: any = { ...form };
// //     if (!payload.firstName) delete payload.firstName;
// //     if (!payload.email)     delete payload.email;
// //     if (!payload.sector)    delete payload.sector;
// //     if (!payload.notes)     delete payload.notes;
// //     if (editingId) updateMut.mutate({ id: editingId, data: payload });
// //     else           createMut.mutate(payload);
// //   };
// //
// //   // ── Styles ───────────────────────────────────────────────────────────────────
// //   const inputCls = 'w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500';
// //
// //   // ── Columns ──────────────────────────────────────────────────────────────────
// //   const columns = [
// //     {
// //       key: 'name', header: 'Nom', sortable: true,
// //       render: (v: string, row: any) => (
// //           <div>
// //             <p className="font-medium text-gray-900 dark:text-white">{v}</p>
// //             {row.firstName && <p className="text-xs text-gray-400">{row.firstName}</p>}
// //           </div>
// //       ),
// //     },
// //     { key: 'phone',  header: 'Téléphone', sortable: true },
// //     { key: 'email',  header: 'Email',     sortable: true, render: (v: string) => v || <span className="text-gray-400">—</span> },
// //     { key: 'sector', header: 'Secteur',   sortable: true, render: (v: string) => v || <span className="text-gray-400">—</span> },
// //     {
// //       key: 'isActive', header: 'Statut',
// //       render: (val: boolean) => (
// //           <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${
// //               val
// //                   ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
// //                   : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
// //           }`}>
// //           {val ? <UserCheck size={12} /> : <UserX size={12} />}
// //             {val ? 'Actif' : 'Inactif'}
// //         </span>
// //       ),
// //     },
// //     { key: 'createdAt', header: 'Créé le', sortable: true, render: (v: string) => v ? format(new Date(v), 'dd/MM/yyyy') : '-' },
// //   ];
// //
// //   // ── Render ───────────────────────────────────────────────────────────────────
// //   return (
// //       <div className="space-y-6">
// //
// //         {/* ── Page Header ── */}
// //         <div className="flex items-center justify-between">
// //           <div>
// //             <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Clients</h1>
// //             <p className="text-gray-500 dark:text-gray-400 text-sm">
// //               {(clients as any[]).length} client{(clients as any[]).length !== 1 ? 's' : ''}
// //             </p>
// //           </div>
// //           <button
// //               onClick={() => { setEditingId(null); setForm(defaultForm); setShowForm(true); }}
// //               className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors"
// //           >
// //             <Plus size={16} /> Nouveau client
// //           </button>
// //         </div>
// //
// //         {/* ── Table ── */}
// //         <DataTable
// //             data={clients as any[]}
// //             columns={columns}
// //             searchKeys={['name', 'phone', 'email', 'sector', 'firstName']}
// //             isLoading={isLoading}
// //             emptyMessage="Aucun client trouvé"
// //             onRowClick={(row) => navigate(`/clients/${row._id}`)}
// //             actions={(row) => (
// //                 <div className="flex items-center justify-end gap-1">
// //                   <button
// //                       onClick={(e) => { e.stopPropagation(); navigate(`/clients/${row._id}`); }}
// //                       className="p-1.5 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg"
// //                       title="Détails"
// //                   >
// //                     <Eye size={15} />
// //                   </button>
// //                   <button onClick={(e) => { e.stopPropagation(); handleEdit(row); }}       className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg" title="Modifier"><Pencil size={15} /></button>
// //                   <button onClick={(e) => { e.stopPropagation(); handleDelete(row); }}     className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg" title="Supprimer"><Trash2 size={15} /></button>
// //                 </div>
// //             )}
// //         />
// //
// //         {/* ── Form Modal ── */}
// //         {showForm && (
// //             <div className="fixed inset-0 z-40 flex items-center justify-center">
// //               <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowForm(false)} />
// //               <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto">
// //                 <button onClick={() => setShowForm(false)} className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
// //                   <X size={18} />
// //                 </button>
// //                 <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-5">
// //                   {editingId ? 'Modifier le client' : 'Nouveau client'}
// //                 </h2>
// //                 <form onSubmit={handleSubmit} className="space-y-4">
// //                   <div className="grid grid-cols-2 gap-3">
// //                     <div>
// //                       <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom <span className="text-red-500">*</span></label>
// //                       <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required placeholder="Nom ou raison sociale" className={inputCls} />
// //                     </div>
// //                     <div>
// //                       <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Prénom</label>
// //                       <input value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} placeholder="Optionnel" className={inputCls} />
// //                     </div>
// //                     <div>
// //                       <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Téléphone <span className="text-red-500">*</span></label>
// //                       <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} required pattern="^\+216[0-9]{8}$" placeholder="+21620000000" className={inputCls} />
// //                     </div>
// //                     <div>
// //                       <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
// //                       <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="Optionnel" className={inputCls} />
// //                     </div>
// //                     <div>
// //                       <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Secteur</label>
// //                       <input value={form.sector} onChange={e => setForm(f => ({ ...f, sector: e.target.value }))} placeholder="Ex: Commerce" className={inputCls} />
// //                     </div>
// //                     <div>
// //                       <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Crédit max (TND)</label>
// //                       <input type="number" min="0" step="0.001" value={form.creditLimit} onChange={e => setForm(f => ({ ...f, creditLimit: +e.target.value }))} className={inputCls} />
// //                     </div>
// //                     <div className="col-span-2">
// //                       <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
// //                       <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} placeholder="Informations supplémentaires..." className={inputCls + ' resize-none'} />
// //                     </div>
// //                     <div className="col-span-2 flex items-center gap-2">
// //                       <input type="checkbox" id="isActive" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} className="rounded" />
// //                       <label htmlFor="isActive" className="text-sm text-gray-700 dark:text-gray-300">Client actif</label>
// //                     </div>
// //                   </div>
// //                   <div className="flex gap-3 pt-2">
// //                     <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800">Annuler</button>
// //                     <button type="submit" disabled={createMut.isPending || updateMut.isPending} className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl text-sm font-medium">
// //                       {createMut.isPending || updateMut.isPending ? 'Enregistrement...' : editingId ? 'Modifier' : 'Créer'}
// //                     </button>
// //                   </div>
// //                 </form>
// //               </div>
// //             </div>
// //         )}
// //
// //         {/* ── Duplicate Warning ── */}
// //         {showDuplicateWarning && (
// //             <div className="fixed inset-0 z-50 flex items-center justify-center">
// //               <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
// //               <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6 text-center">
// //                 <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
// //                   <Phone size={24} className="text-amber-600" />
// //                 </div>
// //                 <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Client déjà existant</h3>
// //                 <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Un client avec ce numéro de téléphone existe déjà.</p>
// //                 <button onClick={() => setShowDuplicateWarning(false)} className="w-full px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium">Fermer</button>
// //               </div>
// //             </div>
// //         )}
// //
// //         <ConfirmDialog {...confirmState} onProceed={proceed} onCancel={cancel} confirmLabel="Supprimer définitivement" />
// //       </div>
// //   );
// // };
// //
// // export default ClientsPage;
//
//
// import React, { useState } from 'react';
// import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// import { useNavigate } from 'react-router-dom';          // ← ajout
// import {clientsApi} from '../../api';
// import DataTable from '../../components/common/DataTable';
// import ConfirmDialog from '../../components/common/ConfirmDialog';
// import { useConfirmDialog } from '../../hooks/useConfirmDialog';
// import {
//   Plus, Pencil, Trash2, Eye, UserCheck, UserX, X, Phone,
// } from 'lucide-react';
// import toast from 'react-hot-toast';
// import { format } from 'date-fns';
//
// const formatTND = (v: number) => `${(v || 0).toFixed(3)} TND`;
// const todayStr  = () => new Date().toISOString().split('T')[0];
//
// interface ClientFormData {
//   name: string;
//   firstName: string;
//   phone: string;
//   email: string;
//   sector: string;
//   creditLimit: number;
//   isActive: boolean;
//   notes: string;
// }
//
// const defaultForm: ClientFormData = {
//   name: '', firstName: '', phone: '+216', email: '',
//   sector: '', creditLimit: 0, isActive: true, notes: '',
// };
//
//
// const ClientsPage: React.FC = () => {
//   const queryClient = useQueryClient();
//   const navigate = useNavigate();                         // ← ajout
//   const { state: confirmState, confirm, proceed, cancel } = useConfirmDialog();
//
//   // ── State ────────────────────────────────────────────────────────────────────
//   const [showForm,             setShowForm]             = useState(false);
//   const [editingId,            setEditingId]            = useState<string | null>(null);
//   const [form,                 setForm]                 = useState<ClientFormData>(defaultForm);
//   const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
//
//   // ── Queries ──────────────────────────────────────────────────────────────────
//   const { data: clients = [], isLoading } = useQuery({
//     queryKey: ['clients'],
//     queryFn:  () => clientsApi.getAll(),
//   });
//
//   // ── Mutations ────────────────────────────────────────────────────────────────
//   const createMut = useMutation({
//     mutationFn: clientsApi.create,
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ['clients'] });
//       toast.success('Client créé');
//       setShowForm(false);
//       setForm(defaultForm);
//     },
//     onError: (err: any) => {
//       if (err?.response?.status === 409) setShowDuplicateWarning(true);
//       else {
//         const msg = err?.response?.data?.message;
//         toast.error(Array.isArray(msg) ? msg[0] : msg || 'Erreur');
//       }
//     },
//   });
//
//   const updateMut = useMutation({
//     mutationFn: ({ id, data }: any) => clientsApi.update(id, data),
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ['clients'] });
//       toast.success('Client modifié');
//       setShowForm(false);
//       setEditingId(null);
//       setForm(defaultForm);
//     },
//     onError: (err: any) => {
//       const msg = err?.response?.data?.message;
//       toast.error(Array.isArray(msg) ? msg[0] : msg || 'Erreur');
//     },
//   });
//
//   const deleteMut = useMutation({
//     mutationFn: clientsApi.remove,
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ['clients'] });
//       toast.success('Client supprimé');
//     },
//   });
//
//   // ── Handlers ─────────────────────────────────────────────────────────────────
//   const handleEdit = (client: any) => {
//     setEditingId(client._id);
//     setForm({
//       name:        client.name        || '',
//       firstName:   client.firstName   || '',
//       phone:       client.phone       || '+216',
//       email:       client.email       || '',
//       sector:      client.sector      || '',
//       creditLimit: client.creditLimit || 0,
//       isActive:    client.isActive    ?? true,
//       notes:       client.notes       || '',
//     });
//     setShowForm(true);
//   };
//
//   const handleDelete = (client: any) => {
//     confirm(
//         {
//           title:         `Supprimer le client "${client.name}"`,
//           message:       `Vous êtes sur le point de supprimer "${client.name}". Cette action est irréversible.`,
//           dangerMessage: 'Toutes les données (achats, paiements, historique) seront supprimées DÉFINITIVEMENT.',
//           confirmLabel:  'Supprimer définitivement',
//         },
//         () => deleteMut.mutate(client._id),
//     );
//   };
//
//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault();
//     const payload: any = { ...form };
//     if (!payload.firstName) delete payload.firstName;
//     if (!payload.email)     delete payload.email;
//     if (!payload.sector)    delete payload.sector;
//     if (!payload.notes)     delete payload.notes;
//     if (editingId) updateMut.mutate({ id: editingId, data: payload });
//     else           createMut.mutate(payload);
//   };
//
//   // ── Styles ───────────────────────────────────────────────────────────────────
//   const inputCls = 'w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500';
//
//   // ── Columns ──────────────────────────────────────────────────────────────────
//   const columns = [
//     {
//       key: 'name', header: 'Nom', sortable: true,
//       render: (v: string, row: any) => (
//           <div>
//             <p className="font-medium text-gray-900 dark:text-white">{v}</p>
//             {row.firstName && <p className="text-xs text-gray-400">{row.firstName}</p>}
//           </div>
//       ),
//     },
//     { key: 'phone',  header: 'Téléphone', sortable: true },
//     { key: 'email',  header: 'Email',     sortable: true, render: (v: string) => v || <span className="text-gray-400">—</span> },
//     { key: 'sector', header: 'Secteur',   sortable: true, render: (v: string) => v || <span className="text-gray-400">—</span> },
//     {
//       key: 'isActive', header: 'Statut',
//       render: (val: boolean) => (
//           <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${
//               val
//                   ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
//                   : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
//           }`}>
//           {val ? <UserCheck size={12} /> : <UserX size={12} />}
//             {val ? 'Actif' : 'Inactif'}
//         </span>
//       ),
//     },
//     { key: 'createdAt', header: 'Créé le', sortable: true, render: (v: string) => v ? format(new Date(v), 'dd/MM/yyyy') : '-' },
//   ];
//
//   // ── Render ───────────────────────────────────────────────────────────────────
//   return (
//       <div className="space-y-6">
//
//         {/* ── Page Header ── */}
//         <div className="flex items-center justify-between">
//           <div>
//             <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Clients</h1>
//             <p className="text-gray-500 dark:text-gray-400 text-sm">
//               {(clients as any[]).length} client{(clients as any[]).length !== 1 ? 's' : ''}
//             </p>
//           </div>
//           <button
//               onClick={() => { setEditingId(null); setForm(defaultForm); setShowForm(true); }}
//               className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors"
//           >
//             <Plus size={16} /> Nouveau client
//           </button>
//         </div>
//
//         {/* ── Table ── */}
//         <DataTable
//             data={clients as any[]}
//             columns={columns}
//             searchKeys={['name', 'phone', 'email', 'sector', 'firstName']}
//             isLoading={isLoading}
//             emptyMessage="Aucun client trouvé"
//             onRowClick={(row) => navigate(`/clients/${row._id}`)}
//             actions={(row) => (
//                 <div className="flex items-center justify-end gap-1">
//                   <button
//                       onClick={(e) => { e.stopPropagation(); navigate(`/clients/${row._id}`); }}
//                       className="p-1.5 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg"
//                       title="Détails"
//                   >
//                     <Eye size={15} />
//                   </button>
//                   <button onClick={(e) => { e.stopPropagation(); handleEdit(row); }}       className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg" title="Modifier"><Pencil size={15} /></button>
//                   <button onClick={(e) => { e.stopPropagation(); handleDelete(row); }}     className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg" title="Supprimer"><Trash2 size={15} /></button>
//                 </div>
//             )}
//         />
//
//         {/* ── Form Modal ── */}
//         {showForm && (
//             <div className="fixed inset-0 z-40 flex items-center justify-center">
//               <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowForm(false)} />
//               <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto">
//                 <button onClick={() => setShowForm(false)} className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
//                   <X size={18} />
//                 </button>
//                 <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-5">
//                   {editingId ? 'Modifier le client' : 'Nouveau client'}
//                 </h2>
//                 <form onSubmit={handleSubmit} className="space-y-4">
//                   <div className="grid grid-cols-2 gap-3">
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom <span className="text-red-500">*</span></label>
//                       <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required placeholder="Nom ou raison sociale" className={inputCls} />
//                     </div>
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Prénom</label>
//                       <input value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} placeholder="Optionnel" className={inputCls} />
//                     </div>
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Téléphone <span className="text-red-500">*</span></label>
//                       <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} required pattern="^\+216[0-9]{8}$" placeholder="+21620000000" className={inputCls} />
//                     </div>
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
//                       <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="Optionnel" className={inputCls} />
//                     </div>
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Secteur</label>
//                       <input value={form.sector} onChange={e => setForm(f => ({ ...f, sector: e.target.value }))} placeholder="Ex: Commerce" className={inputCls} />
//                     </div>
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Crédit max (TND)</label>
//                       <input type="number" min="0" step="0.001" value={form.creditLimit} onChange={e => setForm(f => ({ ...f, creditLimit: +e.target.value }))} className={inputCls} />
//                     </div>
//                     <div className="col-span-2">
//                       <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
//                       <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} placeholder="Informations supplémentaires..." className={inputCls + ' resize-none'} />
//                     </div>
//                     <div className="col-span-2 flex items-center gap-2">
//                       <input type="checkbox" id="isActive" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} className="rounded" />
//                       <label htmlFor="isActive" className="text-sm text-gray-700 dark:text-gray-300">Client actif</label>
//                     </div>
//                   </div>
//                   <div className="flex gap-3 pt-2">
//                     <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800">Annuler</button>
//                     <button type="submit" disabled={createMut.isPending || updateMut.isPending} className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl text-sm font-medium">
//                       {createMut.isPending || updateMut.isPending ? 'Enregistrement...' : editingId ? 'Modifier' : 'Créer'}
//                     </button>
//                   </div>
//                 </form>
//               </div>
//             </div>
//         )}
//
//         {/* ── Duplicate Warning ── */}
//         {showDuplicateWarning && (
//             <div className="fixed inset-0 z-50 flex items-center justify-center">
//               <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
//               <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6 text-center">
//                 <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
//                   <Phone size={24} className="text-amber-600" />
//                 </div>
//                 <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Client déjà existant</h3>
//                 <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Un client avec ce numéro de téléphone existe déjà.</p>
//                 <button onClick={() => setShowDuplicateWarning(false)} className="w-full px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium">Fermer</button>
//               </div>
//             </div>
//         )}
//
//         <ConfirmDialog {...confirmState} onProceed={proceed} onCancel={cancel} confirmLabel="Supprimer définitivement" />
//       </div>
//   );
// };
//
// export default ClientsPage;


import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { clientsApi } from '../../api';
import DataTable from '../../components/common/DataTable';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import {
  Plus, Pencil, Trash2, Eye, UserCheck, UserX, X, Phone,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import {useI18n} from "../../context/I18nContext";

interface ClientFormData {
  name: string;
  firstName: string;
  phone: string;
  email: string;
  sector: string;
  creditLimit: number;
  isActive: boolean;
  notes: string;
}

const defaultForm: ClientFormData = {
  name: '', firstName: '', phone: '+216', email: '',
  sector: '', creditLimit: 0, isActive: true, notes: '',
};

const ClientsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { state: confirmState, confirm, proceed, cancel } = useConfirmDialog();
  const { t, dir } = useI18n(); // ← hook i18n

  // ── State ────────────────────────────────────────────────────────────────────
  const [showForm,             setShowForm]             = useState(false);
  const [editingId,            setEditingId]            = useState<string | null>(null);
  const [form,                 setForm]                 = useState<ClientFormData>(defaultForm);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);

  // ── Queries ──────────────────────────────────────────────────────────────────
  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn:  () => clientsApi.getAll(),
  });

  // ── Mutations ────────────────────────────────────────────────────────────────
  const createMut = useMutation({
    mutationFn: clientsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success(t('clients.new'));
      setShowForm(false);
      setForm(defaultForm);
    },
    onError: (err: any) => {
      if (err?.response?.status === 409) setShowDuplicateWarning(true);
      else {
        const msg = err?.response?.data?.message;
        toast.error(Array.isArray(msg) ? msg[0] : msg || t('error.generic'));
      }
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: any) => clientsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success(t('clients.edit'));
      setShowForm(false);
      setEditingId(null);
      setForm(defaultForm);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg[0] : msg || t('error.generic'));
    },
  });

  const deleteMut = useMutation({
    mutationFn: clientsApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success(t('common.delete'));
    },
  });

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleEdit = (client: any) => {
    setEditingId(client._id);
    setForm({
      name:        client.name        || '',
      firstName:   client.firstName   || '',
      phone:       client.phone       || '+216',
      email:       client.email       || '',
      sector:      client.sector      || '',
      creditLimit: client.creditLimit || 0,
      isActive:    client.isActive    ?? true,
      notes:       client.notes       || '',
    });
    setShowForm(true);
  };

  const handleDelete = (client: any) => {
    confirm(
        {
          title:         `${t('common.delete')} "${client.name}"`,
          message:       `Vous êtes sur le point de supprimer "${client.name}". Cette action est irréversible.`,
          dangerMessage: 'Toutes les données (achats, paiements, historique) seront supprimées DÉFINITIVEMENT.',
          confirmLabel:  t('common.delete'),
        },
        () => deleteMut.mutate(client._id),
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = { ...form };
    if (!payload.firstName) delete payload.firstName;
    if (!payload.email)     delete payload.email;
    if (!payload.sector)    delete payload.sector;
    if (!payload.notes)     delete payload.notes;
    if (editingId) updateMut.mutate({ id: editingId, data: payload });
    else           createMut.mutate(payload);
  };

  // ── Styles ───────────────────────────────────────────────────────────────────
  const inputCls = 'w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500';

  // ── Columns — masque email/secteur sur mobile ─────────────────────────────
  const columns = [
    {
      key: 'name', header: t('common.name'), sortable: true,
      render: (v: string, row: any) => (
          <div>
            <p className="font-medium text-gray-900 dark:text-white">{v}</p>
            {row.firstName && <p className="text-xs text-gray-400">{row.firstName}</p>}
            {/* Infos supplémentaires visibles uniquement sur mobile */}
            <div className="flex flex-wrap gap-x-3 mt-1 sm:hidden">
              {row.phone  && <span className="text-xs text-gray-400">{row.phone}</span>}
              {row.sector && <span className="text-xs text-gray-400">{row.sector}</span>}
            </div>
          </div>
      ),
    },
    { key: 'phone',  header: t('common.phone'),  sortable: true, className: 'hidden sm:table-cell' },
    { key: 'email',  header: t('common.email'),  sortable: true, className: 'hidden md:table-cell', render: (v: string) => v || <span className="text-gray-400">—</span> },
    { key: 'sector', header: t('clients.sector'), sortable: true, className: 'hidden md:table-cell', render: (v: string) => v || <span className="text-gray-400">—</span> },
    {
      key: 'isActive', header: t('common.status'),
      render: (val: boolean) => (
          <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${
              val
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
          }`}>
          {val ? <UserCheck size={12} /> : <UserX size={12} />}
            <span className="hidden xs:inline">{val ? t('common.active') : t('common.inactive')}</span>
        </span>
      ),
    },
    { key: 'createdAt', header: t('common.date'), sortable: true, className: 'hidden lg:table-cell', render: (v: string) => v ? format(new Date(v), 'dd/MM/yyyy') : '-' },
  ];

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
      <div className="space-y-4 sm:space-y-6" dir={dir}>

        {/* ── Page Header ── */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{t('clients.title')}</h1>
            <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">
              {(clients as any[]).length} {t('nav.clients').toLowerCase()}
            </p>
          </div>
          <button
              onClick={() => { setEditingId(null); setForm(defaultForm); setShowForm(true); }}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-medium transition-colors shrink-0"
          >
            <Plus size={15} />
            <span className="hidden xs:inline">{t('clients.new')}</span>
            <span className="xs:hidden">{t('common.create')}</span>
          </button>
        </div>

        {/* ── Table ── */}
        <DataTable
            data={clients as any[]}
            columns={columns}
            searchKeys={['name', 'phone', 'email', 'sector', 'firstName']}
            isLoading={isLoading}
            emptyMessage={t('common.noData')}
            onRowClick={(row) => navigate(`/clients/${row._id}`)}
            actions={(row) => (
                <div className="flex items-center justify-end gap-1">
                  <button
                      onClick={(e) => { e.stopPropagation(); navigate(`/clients/${row._id}`); }}
                      className="p-1.5 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg"
                      title={t('common.actions')}
                  >
                    <Eye size={15} />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleEdit(row); }}   className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg" title={t('common.edit')}><Pencil size={15} /></button>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(row); }} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg" title={t('common.delete')}><Trash2 size={15} /></button>
                </div>
            )}
        />

        {/* ── Form Modal ── */}
        {showForm && (
            <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center" dir={dir}>
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowForm(false)} />
              {/* Sur mobile : sheet du bas ; sur desktop : modal centré */}
              <div className="relative bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg mx-0 sm:mx-4 p-5 sm:p-6 max-h-[92vh] overflow-y-auto">
                <button onClick={() => setShowForm(false)} className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
                  <X size={18} />
                </button>
                {/* Drag handle visible sur mobile */}
                <div className="w-10 h-1 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-4 sm:hidden" />
                <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4 sm:mb-5">
                  {editingId ? t('clients.edit') : t('clients.new')}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                  <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('common.name')} <span className="text-red-500">*</span></label>
                      <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required placeholder={t('common.name')} className={inputCls} />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('clients.firstName')}</label>
                      <input value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} placeholder={t('common.optional')} className={inputCls} />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('common.phone')} <span className="text-red-500">*</span></label>
                      <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} required pattern="^\+216[0-9]{8}$" placeholder="+21620000000" className={inputCls} />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('common.email')}</label>
                      <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder={t('common.optional')} className={inputCls} />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('clients.sector')}</label>
                      <input value={form.sector} onChange={e => setForm(f => ({ ...f, sector: e.target.value }))} placeholder="Ex: Commerce" className={inputCls} />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('clients.creditLimit')}</label>
                      <input type="number" min="0" step="0.001" value={form.creditLimit} onChange={e => setForm(f => ({ ...f, creditLimit: +e.target.value }))} className={inputCls} />
                    </div>
                    <div className="col-span-1 xs:col-span-2">
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('common.notes')}</label>
                      <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} placeholder="..." className={inputCls + ' resize-none'} />
                    </div>
                    <div className="col-span-1 xs:col-span-2 flex items-center gap-2">
                      <input type="checkbox" id="isActive" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} className="rounded" />
                      <label htmlFor="isActive" className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">{t('common.active')}</label>
                    </div>
                  </div>
                  <div className="flex gap-3 pt-1 sm:pt-2">
                    <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-2.5 sm:py-2 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-xs sm:text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800">{t('common.cancel')}</button>
                    <button type="submit" disabled={createMut.isPending || updateMut.isPending} className="flex-1 px-4 py-2.5 sm:py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl text-xs sm:text-sm font-medium">
                      {createMut.isPending || updateMut.isPending ? t('common.loading') : editingId ? t('common.edit') : t('common.create')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
        )}

        {/* ── Duplicate Warning ── */}
        {showDuplicateWarning && (
            <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
              <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
                <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Phone size={24} className="text-amber-600" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Client déjà existant</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Un client avec ce numéro de téléphone existe déjà.</p>
                <button onClick={() => setShowDuplicateWarning(false)} className="w-full px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium">
                  {t('common.confirm')}
                </button>
              </div>
            </div>
        )}

        <ConfirmDialog {...confirmState} onProceed={proceed} onCancel={cancel} confirmLabel={t('common.delete')} />
      </div>
  );
};

export default ClientsPage;