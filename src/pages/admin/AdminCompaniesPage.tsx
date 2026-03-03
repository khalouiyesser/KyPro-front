import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Building2, Plus, Search, Filter, MoreVertical,
    Power, Trash2, Eye, CheckCircle, XCircle,
    ChevronDown, AlertTriangle, X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { usersApi } from '../../api';

// ── Types ─────────────────────────────────────────────────────────────────────
interface Company {
    _id: string;
    name: string;
    email: string;
    phone: string;
    city?: string;
    country: string;
    plan: 'trial' | 'starter' | 'professional' | 'enterprise';
    subscriptionStatus: 'active' | 'trial' | 'suspended' | 'expired' | 'cancelled';
    subscriptionExpiresAt?: string;
    isActive: boolean;
    logoUrl?: string;
    primaryColor?: string;
    amountPaid: number;
    createdAt: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────
const PLAN_STYLES: Record<string, { label: string; cls: string }> = {
    trial:        { label: 'Trial',        cls: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
    starter:      { label: 'Starter',      cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400' },
    professional: { label: 'Pro',          cls: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400' },
    enterprise:   { label: 'Enterprise',   cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' },
};

const STATUS_STYLES: Record<string, { label: string; dot: string; cls: string }> = {
    active:    { label: 'Actif',     dot: 'bg-green-500',  cls: 'text-green-600 dark:text-green-400' },
    trial:     { label: 'Trial',     dot: 'bg-gray-400',   cls: 'text-gray-500 dark:text-gray-400' },
    suspended: { label: 'Suspendu',  dot: 'bg-orange-500', cls: 'text-orange-600 dark:text-orange-400' },
    expired:   { label: 'Expiré',    dot: 'bg-red-500',    cls: 'text-red-500 dark:text-red-400' },
    cancelled: { label: 'Annulé',    dot: 'bg-red-800',    cls: 'text-red-700 dark:text-red-500' },
};

const ALL_PLANS    = ['trial', 'starter', 'professional', 'enterprise'];
const ALL_STATUSES = ['active', 'trial', 'suspended', 'expired', 'cancelled'];

// ── Confirm Modal ─────────────────────────────────────────────────────────────
const ConfirmModal: React.FC<{
    title: string; message: string; confirmLabel: string;
    danger?: boolean; onConfirm: () => void; onCancel: () => void;
}> = ({ title, message, confirmLabel, danger, onConfirm, onCancel }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-xl w-full max-w-sm p-6">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${danger ? 'bg-red-100 dark:bg-red-900/30' : 'bg-amber-100 dark:bg-amber-900/30'}`}>
                <AlertTriangle size={22} className={danger ? 'text-red-600' : 'text-amber-600'} />
            </div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white text-center mb-2">{title}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">{message}</p>
            <div className="flex gap-3">
                <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    Annuler
                </button>
                <button onClick={onConfirm} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors ${danger ? 'bg-red-600 hover:bg-red-700' : 'bg-orange-500 hover:bg-orange-600'}`}>
                    {confirmLabel}
                </button>
            </div>
        </div>
    </div>
);

// ── Row Menu ──────────────────────────────────────────────────────────────────
const RowMenu: React.FC<{
    company: Company;
    onToggle: () => void;
    onDelete: () => void;
    onView: () => void;
}> = ({ company, onToggle, onDelete, onView }) => {
    const [open, setOpen] = useState(false);
    return (
        <div className="relative">
            <button
                onClick={() => setOpen(p => !p)}
                className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
                <MoreVertical size={16} />
            </button>
            {open && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
                    <div className="absolute right-0 top-8 z-20 w-44 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-lg overflow-hidden">
                        <button onClick={() => { onView(); setOpen(false); }}
                                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                            <Eye size={15} /> Voir le détail
                        </button>
                        <button onClick={() => { onToggle(); setOpen(false); }}
                                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                            <Power size={15} className={company.isActive ? 'text-orange-500' : 'text-green-500'} />
                            {company.isActive ? 'Suspendre' : 'Activer'}
                        </button>
                        <div className="h-px bg-gray-100 dark:bg-gray-800 mx-2" />
                        <button onClick={() => { onDelete(); setOpen(false); }}
                                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors">
                            <Trash2 size={15} /> Supprimer
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

// ── Main Component ─────────────────────────────────────────────────────────────
const AdminCompaniesPage: React.FC = () => {
    const navigate     = useNavigate();
    const queryClient  = useQueryClient();

    const [search,        setSearch]        = useState('');
    const [filterPlan,    setFilterPlan]    = useState<string[]>([]);
    const [filterStatus,  setFilterStatus]  = useState<string[]>([]);
    const [showFilters,   setShowFilters]   = useState(false);
    const [confirmModal,  setConfirmModal]  = useState<{
        type: 'toggle' | 'delete'; company: Company;
    } | null>(null);

    // ── Fetch ──────────────────────────────────────────────────────────────────
    const { data: companies = [], isLoading } = useQuery<Company[]>({
        queryKey: ['admin-companies'],
        queryFn: () => usersApi.getAll(), // ← adapter selon ton endpoint companies
    });

    // ── Mutations ──────────────────────────────────────────────────────────────
    const toggleMutation = useMutation({
        mutationFn: (c: Company) =>
            usersApi.update(c._id, { isActive: !c.isActive }),
        onSuccess: (_, c) => {
            toast.success(`Entreprise ${c.isActive ? 'suspendue' : 'activée'}`);
            queryClient.invalidateQueries({ queryKey: ['admin-companies'] });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => usersApi.remove(id),
        onSuccess: () => {
            toast.success('Entreprise supprimée');
            queryClient.invalidateQueries({ queryKey: ['admin-companies'] });
        },
    });

    // ── Filters ────────────────────────────────────────────────────────────────
    const filtered = companies.filter(c => {
        const q = search.toLowerCase();
        const matchSearch = !q || c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.city?.toLowerCase().includes(q);
        const matchPlan   = filterPlan.length === 0   || filterPlan.includes(c.plan);
        const matchStatus = filterStatus.length === 0 || filterStatus.includes(c.subscriptionStatus);
        return matchSearch && matchPlan && matchStatus;
    });

    const toggleFilter = (arr: string[], val: string, set: React.Dispatch<React.SetStateAction<string[]>>) =>
        set(prev => prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val]);

    const activeFiltersCount = filterPlan.length + filterStatus.length;

    // ── Stats ──────────────────────────────────────────────────────────────────
    const stats = {
        total:    companies.length,
        active:   companies.filter(c => c.isActive).length,
        trial:    companies.filter(c => c.plan === 'trial').length,
        revenue:  companies.reduce((s, c) => s + (c.amountPaid || 0), 0),
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">

            {/* ── Header ── */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">Entreprises</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{companies.length} entreprise{companies.length !== 1 ? 's' : ''} enregistrée{companies.length !== 1 ? 's' : ''}</p>
                </div>
                <button
                    onClick={() => navigate('/admin/companies/new')}
                    className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm shadow-blue-200 dark:shadow-none"
                >
                    <Plus size={16} /> Nouvelle entreprise
                </button>
            </div>

            {/* ── Stats cards ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total',      value: stats.total,                   color: 'text-gray-900 dark:text-white' },
                    { label: 'Actives',    value: stats.active,                  color: 'text-green-600 dark:text-green-400' },
                    { label: 'En trial',   value: stats.trial,                   color: 'text-gray-500 dark:text-gray-400' },
                    { label: 'CA encaissé',value: `${stats.revenue.toLocaleString()} TND`, color: 'text-blue-600 dark:text-blue-400' },
                ].map(s => (
                    <div key={s.label} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{s.label}</p>
                        <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                    </div>
                ))}
            </div>

            {/* ── Search + Filter bar ── */}
            <div className="flex items-center gap-3">
                <div className="relative flex-1">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Rechercher par nom, email, ville..."
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                    {search && (
                        <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                            <X size={14} />
                        </button>
                    )}
                </div>
                <button
                    onClick={() => setShowFilters(p => !p)}
                    className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                        showFilters || activeFiltersCount > 0
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-600'
                            : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                >
                    <Filter size={15} />
                    Filtres
                    {activeFiltersCount > 0 && (
                        <span className="w-5 h-5 bg-blue-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {activeFiltersCount}
            </span>
                    )}
                </button>
            </div>

            {/* ── Filter Panel ── */}
            {showFilters && (
                <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Filtres actifs</span>
                        {activeFiltersCount > 0 && (
                            <button onClick={() => { setFilterPlan([]); setFilterStatus([]); }} className="text-xs text-blue-600 hover:underline">
                                Tout effacer
                            </button>
                        )}
                    </div>
                    <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Plan</p>
                        <div className="flex flex-wrap gap-2">
                            {ALL_PLANS.map(p => (
                                <button key={p} onClick={() => toggleFilter(filterPlan, p, setFilterPlan)}
                                        className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
                                            filterPlan.includes(p)
                                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-600'
                                                : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                                        }`}>
                                    {PLAN_STYLES[p].label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Statut</p>
                        <div className="flex flex-wrap gap-2">
                            {ALL_STATUSES.map(s => (
                                <button key={s} onClick={() => toggleFilter(filterStatus, s, setFilterStatus)}
                                        className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
                                            filterStatus.includes(s)
                                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-600'
                                                : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                                        }`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${STATUS_STYLES[s].dot}`} />
                                    {STATUS_STYLES[s].label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Table ── */}
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center py-16">
                        <div className="w-6 h-6 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <Building2 size={40} className="text-gray-200 dark:text-gray-700 mb-3" />
                        <p className="text-sm font-medium text-gray-400 dark:text-gray-500">
                            {search || activeFiltersCount > 0 ? 'Aucun résultat pour cette recherche' : 'Aucune entreprise enregistrée'}
                        </p>
                        {!search && !activeFiltersCount && (
                            <button onClick={() => navigate('/admin/companies/new')} className="mt-3 text-sm text-blue-600 hover:underline">
                                Créer la première entreprise
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                            <tr className="border-b border-gray-100 dark:border-gray-800">
                                {['Entreprise', 'Contact', 'Plan', 'Statut', 'Expiration', 'CA', ''].map(h => (
                                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-gray-800/60">
                            {filtered.map(company => {
                                const plan   = PLAN_STYLES[company.plan]   ?? PLAN_STYLES.trial;
                                const status = STATUS_STYLES[company.subscriptionStatus] ?? STATUS_STYLES.trial;
                                return (
                                    <tr key={company._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                                        {/* Entreprise */}
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-white text-sm font-bold"
                                                    style={{ backgroundColor: company.primaryColor || '#2563EB' }}
                                                >
                                                    {company.logoUrl
                                                        ? <img src={company.logoUrl} alt="" className="w-full h-full object-cover rounded-xl" />
                                                        : company.name.charAt(0).toUpperCase()
                                                    }
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{company.name}</p>
                                                    <p className="text-xs text-gray-400 truncate">{company.city || company.country}</p>
                                                </div>
                                                {!company.isActive && (
                                                    <span className="px-1.5 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-[10px] font-semibold rounded-md">
                              Inactif
                            </span>
                                                )}
                                            </div>
                                        </td>
                                        {/* Contact */}
                                        <td className="px-4 py-3">
                                            <p className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-[160px]">{company.email}</p>
                                            <p className="text-xs text-gray-400">{company.phone}</p>
                                        </td>
                                        {/* Plan */}
                                        <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-md text-xs font-semibold ${plan.cls}`}>
                          {plan.label}
                        </span>
                                        </td>
                                        {/* Statut */}
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1.5">
                                                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${status.dot}`} />
                                                <span className={`text-sm font-medium ${status.cls}`}>{status.label}</span>
                                            </div>
                                        </td>
                                        {/* Expiration */}
                                        <td className="px-4 py-3">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {company.subscriptionExpiresAt
                              ? new Date(company.subscriptionExpiresAt).toLocaleDateString('fr-TN')
                              : '—'}
                        </span>
                                        </td>
                                        {/* CA */}
                                        <td className="px-4 py-3">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {(company.amountPaid || 0).toLocaleString()} TND
                        </span>
                                        </td>
                                        {/* Actions */}
                                        <td className="px-4 py-3">
                                            <RowMenu
                                                company={company}
                                                onView={() => navigate(`/admin/companies/${company._id}`)}
                                                onToggle={() => setConfirmModal({ type: 'toggle', company })}
                                                onDelete={() => setConfirmModal({ type: 'delete', company })}
                                            />
                                        </td>
                                    </tr>
                                );
                            })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Footer count */}
                {filtered.length > 0 && filtered.length !== companies.length && (
                    <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-400">
                        {filtered.length} résultat{filtered.length > 1 ? 's' : ''} sur {companies.length}
                    </div>
                )}
            </div>

            {/* ── Confirm Modal ── */}
            {confirmModal && (
                <ConfirmModal
                    danger={confirmModal.type === 'delete'}
                    title={
                        confirmModal.type === 'delete'
                            ? `Supprimer "${confirmModal.company.name}" ?`
                            : confirmModal.company.isActive
                                ? `Suspendre "${confirmModal.company.name}" ?`
                                : `Activer "${confirmModal.company.name}" ?`
                    }
                    message={
                        confirmModal.type === 'delete'
                            ? 'Cette action est irréversible. Toutes les données de l\'entreprise seront supprimées.'
                            : confirmModal.company.isActive
                                ? 'Les utilisateurs de cette entreprise ne pourront plus se connecter.'
                                : 'L\'entreprise et ses utilisateurs retrouveront l\'accès à la plateforme.'
                    }
                    confirmLabel={
                        confirmModal.type === 'delete'
                            ? 'Supprimer'
                            : confirmModal.company.isActive ? 'Suspendre' : 'Activer'
                    }
                    onCancel={() => setConfirmModal(null)}
                    onConfirm={() => {
                        if (confirmModal.type === 'delete') {
                            deleteMutation.mutate(confirmModal.company._id);
                        } else {
                            toggleMutation.mutate(confirmModal.company);
                        }
                        setConfirmModal(null);
                    }}
                />
            )}
        </div>
    );
};

export default AdminCompaniesPage;