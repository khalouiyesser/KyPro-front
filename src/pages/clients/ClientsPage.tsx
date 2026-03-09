import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { clientsApi } from '../../api';
import DataTable from '../../components/common/DataTable';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import {
  Plus, Pencil, Trash2, Eye, UserCheck, UserX, X, Phone,
  User, Mail, MapPin, CreditCard, FileText, Building2,
  ChevronRight, Banknote, CheckCircle2, AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { useI18n } from '../../context/I18nContext';

// ── Types ─────────────────────────────────────────────────────────────────────
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

interface QuickPaymentForm {
  amount: string;
  note: string;
}



const defaultForm: ClientFormData = {
  name: '', firstName: '', phone: '+216', email: '',
  sector: '', creditLimit: 0, isActive: true, notes: '',
};

const defaultPayment: QuickPaymentForm = { amount: '', note: '' };

const formatTND = (v: number) => `${(v || 0).toFixed(3)} TND`;

// ══════════════════════════════════════════════════════════════════════════════
const ClientsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const navigate    = useNavigate();
  const { state: confirmState, confirm, proceed, cancel } = useConfirmDialog();
  const { t, dir } = useI18n();

  // ── State ─────────────────────────────────────────────────────────────────
  const [showForm,             setShowForm]             = useState(false);
  const [editingId,            setEditingId]            = useState<string | null>(null);
  const [form,                 setForm]                 = useState<ClientFormData>(defaultForm);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);

  // Payment rapide
  const [paymentTarget,  setPaymentTarget]  = useState<any>(null);
  const [paymentForm,    setPaymentForm]    = useState<QuickPaymentForm>(defaultPayment);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // ── Queries ───────────────────────────────────────────────────────────────
  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn:  () => clientsApi.getAll(),
  });

  // ── Mutations ─────────────────────────────────────────────────────────────
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

  // Mutation paiement rapide — POST /clients/payment/:clientId
  const paymentMut = useMutation({
    mutationFn: ({ clientId, data }: { clientId: string; data: { amount: number; note?: string } }) =>
        clientsApi.addPayment(clientId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['client-stats', paymentTarget?._id] });
      setPaymentSuccess(true);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg[0] : msg || t('error.generic'));
    },
  });

  // ── Handlers ─────────────────────────────────────────────────────────────
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

  const openPayment = (client: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setPaymentTarget(client);
    setPaymentForm(defaultPayment);
    setPaymentSuccess(false);
    paymentMut.reset();
  };

  const closePayment = () => {
    setPaymentTarget(null);
    setPaymentForm(defaultPayment);
    setPaymentSuccess(false);
    paymentMut.reset();
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(paymentForm.amount);
    if (!amount || amount <= 0) { toast.error('Montant invalide'); return; }
    paymentMut.mutate({
      clientId: paymentTarget._id,
      data: { amount, note: paymentForm.note || undefined },
    });
  };

  // ── Styles ────────────────────────────────────────────────────────────────
  const inputCls = 'w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/60 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 transition-all duration-150';
  const labelCls = 'block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5';

  // ── Columns ───────────────────────────────────────────────────────────────
  const columns = [
    {
      key: 'name', header: t('common.name'), sortable: true,
      render: (v: string, row: any) => (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shrink-0 shadow-sm">
              <span className="text-white text-xs font-bold">{(v || '?').charAt(0).toUpperCase()}</span>
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{v}</p>
              {row.firstName && <p className="text-xs text-gray-400 truncate">{row.firstName}</p>}
              <div className="flex flex-wrap gap-x-2 mt-0.5 sm:hidden">
                {row.phone  && <span className="text-xs text-gray-400 flex items-center gap-0.5"><Phone size={9} />{row.phone}</span>}
                {row.sector && <span className="text-xs text-gray-400 flex items-center gap-0.5"><Building2 size={9} />{row.sector}</span>}
              </div>
            </div>
          </div>
      ),
    },
    {
      key: 'phone', header: t('common.phone'), sortable: true, className: 'hidden sm:table-cell',
      render: (v: string) => (
          <span className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300">
          <Phone size={12} className="text-gray-400" />{v}
        </span>
      ),
    },
    {
      key: 'email', header: t('common.email'), sortable: true, className: 'hidden md:table-cell',
      render: (v: string) => v
          ? <span className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300"><Mail size={12} className="text-gray-400" />{v}</span>
          : <span className="text-gray-300 dark:text-gray-600 text-xs">—</span>,
    },
    {
      key: 'sector', header: t('clients.sector'), sortable: true, className: 'hidden lg:table-cell',
      render: (v: string) => v
          ? <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"><Building2 size={10} />{v}</span>
          : <span className="text-gray-300 dark:text-gray-600 text-xs">—</span>,
    },
    {
      key: 'totalCredit', header: 'Solde', className: 'hidden sm:table-cell',
      render: (_: any, row: any) => {
        const credit = row.totalCredit ?? 0;
        if (credit <= 0) return (
            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800">
            ✓ Payé
          </span>
        );
        return (
            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-semibold bg-red-50 text-red-500 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800">
            -{formatTND(credit)}
          </span>
        );
      },
    },
    {
      key: 'isActive', header: t('common.status'),
      render: (val: boolean) => (
          <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-semibold border ${
              val
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800'
                  : 'bg-gray-50 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700'
          }`}>
          {val ? <UserCheck size={11} /> : <UserX size={11} />}
            <span className="hidden xs:inline">{val ? t('common.active') : t('common.inactive')}</span>
        </span>
      ),
    },
    {
      key: 'createdAt', header: t('common.date'), sortable: true, className: 'hidden lg:table-cell',
      render: (v: string) => v
          ? <span className="text-xs text-gray-400">{format(new Date(v), 'dd/MM/yyyy')}</span>
          : <span className="text-gray-300">—</span>,
    },
  ];

  const allClients    = clients as any[];
  const activeCount   = allClients.filter(c => c.isActive).length;
  const inactiveCount = allClients.filter(c => !c.isActive).length;
  const withCredit    = allClients.filter(c => c.creditLimit > 0).length;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
      <div className="space-y-4 sm:space-y-6" dir={dir}>

        {/* ── Page Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
              {t('clients.title')}
            </h1>
            <p className="text-gray-400 dark:text-gray-500 text-xs sm:text-sm mt-0.5">
              {allClients.length} {t('nav.clients').toLowerCase()}
              {activeCount > 0 && <span className="text-emerald-500 ms-1.5">· {activeCount} actifs</span>}
            </p>
          </div>
          <button
              onClick={() => { setEditingId(null); setForm(defaultForm); setShowForm(true); }}
              className="self-start sm:self-auto flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-sm font-semibold transition-all shadow-sm shadow-blue-500/20"
          >
            <Plus size={16} /> {t('clients.new')}
          </button>
        </div>

        {/* ── Stat chips ── */}
        {allClients.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 font-medium">
                <UserCheck size={11} /> {activeCount} actifs
              </div>
              {inactiveCount > 0 && (
                  <div className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 font-medium">
                    <UserX size={11} /> {inactiveCount} inactifs
                  </div>
              )}
              {withCredit > 0 && (
                  <div className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 font-medium">
                    <CreditCard size={11} /> {withCredit} avec crédit
                  </div>
              )}
            </div>
        )}

        {/* ── Table ── */}
        <DataTable
            data={allClients}
            columns={columns}
            searchKeys={['name', 'phone', 'email', 'sector', 'firstName']}
            isLoading={isLoading}
            emptyMessage={t('common.noData')}
            onRowClick={(row) => navigate(`/clients/${row._id}`)}
            actions={(row) => (
                <div className="flex items-center justify-end gap-0.5">
                  <button
                      onClick={(e) => { e.stopPropagation(); navigate(`/clients/${row._id}`); }}
                      className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                      title="Détails"
                  >
                    <Eye size={14} />
                  </button>
                  {/* ── Paiement rapide ── */}
                  <button
                      onClick={(e) => openPayment(row, e)}
                      className="p-1.5 text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                      title="Paiement rapide"
                  >
                    <Banknote size={14} />
                  </button>
                  <button
                      onClick={(e) => { e.stopPropagation(); handleEdit(row); }}
                      className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                      title={t('common.edit')}
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(row); }}
                      className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title={t('common.delete')}
                  >
                    <Trash2 size={14} />
                  </button>
                  <ChevronRight size={12} className="text-gray-300 dark:text-gray-600 ms-0.5" />
                </div>
            )}
        />

        {/* ══════════════════════════════════════════════════════════════════════
          ── Quick Payment Modal ──
      ══════════════════════════════════════════════════════════════════════ */}
        {paymentTarget && (
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" dir={dir}>
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closePayment} />
              <div className="relative bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md mx-0 sm:mx-4 overflow-hidden">

                <div className="w-10 h-1 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mt-3 mb-1 sm:hidden" />

                {/* Header */}
                <div className="px-5 pt-4 pb-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-sm shadow-emerald-500/30">
                      <Banknote size={18} className="text-white" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-gray-900 dark:text-white">Paiement rapide</h2>
                      <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                        <User size={10} />
                        {paymentTarget.name}{paymentTarget.firstName ? ` ${paymentTarget.firstName}` : ''}
                      </p>
                    </div>
                  </div>
                  <button onClick={closePayment} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors text-gray-400">
                    <X size={16} />
                  </button>
                </div>

                {/* Body */}
                <div className="p-5">
                  {paymentSuccess ? (
                      /* Succès */
                      <div className="text-center py-4">
                        <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-4">
                          <CheckCircle2 size={32} className="text-emerald-500" />
                        </div>
                        <h3 className="font-bold text-gray-900 dark:text-white text-base mb-1">Paiement enregistré !</h3>
                        <p className="text-sm text-gray-400 mb-1">
                          <span className="font-semibold text-emerald-600">+{formatTND(parseFloat(paymentForm.amount))}</span>
                          {' '}pour {paymentTarget.name}
                        </p>
                        {paymentForm.note && <p className="text-xs text-gray-400 italic mb-4">« {paymentForm.note} »</p>}
                        <div className="flex gap-2 mt-5">
                          <button
                              onClick={() => { setPaymentSuccess(false); setPaymentForm(defaultPayment); paymentMut.reset(); }}
                              className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                          >
                            Nouveau paiement
                          </button>
                          <button
                              onClick={closePayment}
                              className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-colors"
                          >
                            Fermer
                          </button>
                        </div>
                      </div>
                  ) : (
                      /* Formulaire */
                      <form onSubmit={handlePaymentSubmit} className="space-y-4">

                        {paymentTarget.creditUsed > 0 && (
                            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800">
                              <AlertCircle size={14} className="text-amber-500 shrink-0 mt-0.5" />
                              <div>
                                <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">Crédit en cours</p>
                                <p className="text-xs text-amber-600 dark:text-amber-500 mt-0.5">
                                  Crédit utilisé : <span className="font-bold">{formatTND(paymentTarget.creditUsed)}</span>
                                  {paymentTarget.creditLimit > 0 && ` / ${formatTND(paymentTarget.creditLimit)}`}
                                </p>
                              </div>
                            </div>
                        )}

                        {/* Montant */}
                        <div>
                          <label className={labelCls}>Montant (TND) <span className="text-red-400 normal-case font-normal">*</span></label>
                          <div className="relative">
                            <Banknote size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="number"
                                min="0.001"
                                step="0.001"
                                value={paymentForm.amount}
                                onChange={e => setPaymentForm(f => ({ ...f, amount: e.target.value }))}
                                required
                                placeholder="0.000"
                                className="w-full ps-10 pe-16 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/60 text-lg font-bold text-gray-900 dark:text-white placeholder:text-gray-300 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500 transition-all"
                                autoFocus
                            />
                            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400">TND</span>
                          </div>
                          {paymentForm.amount && parseFloat(paymentForm.amount) > 0 && (
                              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 ms-1 font-medium">
                                ✓ {formatTND(parseFloat(paymentForm.amount))}
                              </p>
                          )}
                        </div>

                        {/* Note */}
                        <div>
                          <label className={labelCls}>Note <span className="text-red-400 normal-case font-normal">*</span></label>
                          <div className="relative">
                            <FileText size={14} className="absolute left-3.5 top-3 text-gray-400" />
                            <textarea
                                value={paymentForm.note}
                                onChange={e => setPaymentForm(f => ({ ...f, note: e.target.value }))}
                                rows={2}
                                placeholder="Ex: Règlement facture du 01/03..."
                                className="w-full ps-10 py-2.5 pe-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/60 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500 resize-none transition-all"
                            />
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 pt-1">
                          <button
                              type="button"
                              onClick={closePayment}
                              className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                          >
                            {t('common.cancel')}
                          </button>
                          <button
                              type="submit"
                              disabled={paymentMut.isPending || !paymentForm.amount || parseFloat(paymentForm.amount) <= 0 || !paymentForm.note?.trim()}
                              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 dark:disabled:bg-emerald-900/40 disabled:cursor-not-allowed active:scale-95 text-white rounded-xl text-sm font-semibold transition-all shadow-sm shadow-emerald-500/20"
                          >
                            {paymentMut.isPending ? (
                                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Enregistrement...</>
                            ) : (
                                <><Banknote size={15} />Enregistrer</>
                            )}
                          </button>
                        </div>
                      </form>
                  )}
                </div>
              </div>
            </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
          ── Client Form Modal — single page, 2-col grid ──
      ══════════════════════════════════════════════════════════════════════ */}
        {showForm && (
            <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center" dir={dir}>
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowForm(false)} />
              <div className="relative bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-2xl mx-0 sm:mx-4 max-h-[95vh] sm:max-h-[90vh] flex flex-col overflow-hidden">

                {/* Drag handle mobile */}
                <div className="w-10 h-1 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mt-3 mb-1 sm:hidden shrink-0" />

                {/* Header */}
                <div className="px-5 sm:px-6 pt-3 sm:pt-5 pb-4 border-b border-gray-100 dark:border-gray-800 shrink-0 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-sm shadow-blue-500/30">
                      <User size={16} className="text-white" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-gray-900 dark:text-white leading-tight">
                        {editingId ? t('clients.edit') : t('clients.new')}
                      </h2>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {editingId ? 'Modifier les informations du client' : 'Remplissez les informations du client'}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors text-gray-400">
                    <X size={18} />
                  </button>
                </div>

                {/* Form — tout en une seule page */}
                <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                  <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5 space-y-4">

                    {/* Row 1 : Nom · Prénom */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <label className={labelCls}>Nom <span className="text-red-400 normal-case font-normal">*</span></label>
                        <div className="relative">
                          <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input
                              value={form.name}
                              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                              required
                              placeholder="Nom ou raison sociale"
                              className={inputCls + ' ps-8'}
                          />
                        </div>
                      </div>
                      <div>
                        <label className={labelCls}>Prénom</label>
                        <div className="relative">
                          <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input
                              value={form.firstName}
                              onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
                              placeholder="Optionnel"
                              className={inputCls + ' ps-8'}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Row 2 : Téléphone · Email */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <label className={labelCls}>Téléphone <span className="text-red-400 normal-case font-normal">*</span></label>
                        <div className="relative">
                          <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input
                              value={form.phone}
                              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                              required
                              pattern="^\+216[0-9]{8}$"
                              placeholder="+21620000000"
                              className={inputCls + ' ps-8'}
                          />
                        </div>
                        <p className="text-xs text-gray-400 mt-1 ms-1">Format : +216 suivi de 8 chiffres</p>
                      </div>
                      <div>
                        <label className={labelCls}>Email</label>
                        <div className="relative">
                          <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input
                              type="email"
                              value={form.email}
                              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                              placeholder="client@exemple.com (optionnel)"
                              className={inputCls + ' ps-8'}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Row 3 : Secteur · Crédit */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <label className={labelCls}>Secteur / Région</label>
                        <div className="relative">
                          <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input
                              value={form.sector}
                              onChange={e => setForm(f => ({ ...f, sector: e.target.value }))}
                              placeholder="Ex: Commerce, Industrie, Sfax..."
                              className={inputCls + ' ps-8'}
                          />
                        </div>
                      </div>
                      <div>
                        <label className={labelCls}>Limite de crédit (TND)</label>
                        <div className="relative">
                          <CreditCard size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input
                              type="number"
                              min="0"
                              step="any"
                              value={form.creditLimit === 0 ? '' : form.creditLimit}
                              onChange={e => setForm(f => ({ ...f, creditLimit: e.target.value === '' ? 0 : +e.target.value }))}
                              placeholder="Entrer le montant à crédit"
                              className={inputCls + ' ps-8 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'}
                          />
                        </div>
                        <p className="text-xs text-gray-400 mt-1 ms-1">Laisser vide = pas de limite</p>
                      </div>
                    </div>

                    {/* Row 4 : Notes (pleine largeur) */}
                    <div>
                      <label className={labelCls}>Notes internes</label>
                      <div className="relative">
                        <FileText size={14} className="absolute left-3 top-3.5 text-gray-400" />
                        <textarea
                            value={form.notes}
                            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                            rows={3}
                            placeholder="Informations supplémentaires, remarques, conditions particulières..."
                            className={inputCls + ' resize-none ps-8 pt-2.5'}
                        />
                      </div>
                    </div>

                    {/* Toggle actif */}
                    <div
                        className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                            form.isActive
                                ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800'
                                : 'bg-gray-50 border-gray-200 dark:bg-gray-800/50 dark:border-gray-700'
                        }`}
                        onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${form.isActive ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                          {form.isActive ? <UserCheck size={15} className="text-white" /> : <UserX size={15} className="text-white" />}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">{form.isActive ? 'Client actif' : 'Client inactif'}</p>
                          <p className="text-xs text-gray-400">{form.isActive ? 'Apparaît dans les ventes' : 'Masqué des ventes'}</p>
                        </div>
                      </div>
                      <div className={`w-11 h-6 rounded-full transition-all relative ${form.isActive ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${form.isActive ? 'left-6' : 'left-1'}`} />
                      </div>
                    </div>

                  </div>

                  {/* Footer */}
                  <div className="px-5 sm:px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-end gap-3 shrink-0 bg-gray-50/50 dark:bg-gray-900">
                    <button
                        type="button"
                        onClick={() => setShowForm(false)}
                        className="px-4 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      {t('common.cancel')}
                    </button>
                    <button
                        type="submit"
                        disabled={createMut.isPending || updateMut.isPending}
                        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 active:scale-95 text-white rounded-xl text-sm font-semibold transition-all shadow-sm shadow-blue-500/20"
                    >
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
                <div className="w-14 h-14 bg-amber-100 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Phone size={26} className="text-amber-600 dark:text-amber-400" />
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-1.5">Client déjà existant</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">Un client avec ce numéro de téléphone existe déjà dans votre base.</p>
                <button onClick={() => setShowDuplicateWarning(false)} className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors">
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