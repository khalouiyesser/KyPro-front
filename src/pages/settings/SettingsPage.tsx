import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useI18n, LangSelector } from '../../context/I18nContext';
import { authApi } from '../../api/auth.api';
import api from '../../api/client';
import {
  Sun, Moon, Save, Lock, Building2, Eye, EyeOff,
  User, ChevronDown, ChevronUp, Palette, Globe,
  Shield, Bell, Settings, Check,
} from 'lucide-react';
import toast from 'react-hot-toast';

// ── Types ──────────────────────────────────────────────────────────────────────
type PasswordKeys = 'currentPassword' | 'newPassword' | 'confirmPassword';
type ShowKeys = 'current' | 'new' | 'confirm';

// ── API helpers ────────────────────────────────────────────────────────────────
const companyApi = {
  getInfo:    ()        => api.get('/company/info').then(r => r.data),
  updateInfo: (d: any)  => api.patch('/company/info', d).then(r => r.data),
  getMe:      ()        => api.get('/company/me').then(r => r.data),
  updateMe:   (d: any)  => api.patch('/company/me', d).then(r => r.data),
};

// ── Accordéon ──────────────────────────────────────────────────────────────────
const Section: React.FC<{
  id: string;
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  accent?: string;
}> = ({ icon, title, subtitle, open, onToggle, children, accent = 'bg-blue-50 dark:bg-blue-900/20' }) => (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden transition-all">
      <button
          onClick={onToggle}
          className="w-full flex items-center gap-4 px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
      >
        <div className={`p-2.5 rounded-xl flex-shrink-0 ${accent}`}>{icon}</div>
        <div className="flex-1 text-left">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">{title}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
        {open
            ? <ChevronUp size={16} className="text-gray-400 flex-shrink-0" />
            : <ChevronDown size={16} className="text-gray-400 flex-shrink-0" />}
      </button>
      {open && (
          <div className="px-6 pb-6 border-t border-gray-100 dark:border-gray-800 pt-5">
            {children}
          </div>
      )}
    </div>
);

// ── Input style ────────────────────────────────────────────────────────────────
const inp = 'w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all';
const labelCls = 'block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5';

// ── Main Component ─────────────────────────────────────────────────────────────
const SettingsPage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { isDark, toggleTheme, primaryColor, setPrimaryColor } = useTheme();
  const { t, lang } = useI18n();
  const queryClient = useQueryClient();

  const isAdminCompany = (user as any)?.role === 'admin_company' || (user as any)?.role === 'system_admin';

  // Sections ouvertes
  const [open, setOpen] = useState<Record<string, boolean>>({
    profile: true,
    company: false,
    appearance: false,
    password: false,
    notifications: false,
  });
  const toggle = (key: string) => setOpen(p => ({ ...p, [key]: !p[key] }));

  // ── Profil utilisateur ────────────────────────────────────────────────────
  const [profileForm, setProfileForm] = useState({
    name:      (user as any)?.name      || '',
    phone:     (user as any)?.phone     || '',
    position:  (user as any)?.position  || '',
    avatarUrl: (user as any)?.avatarUrl || '',
  });

  const updateMeMut = useMutation({
    mutationFn: companyApi.updateMe,
    onSuccess: (data) => { updateUser(data); toast.success('Profil mis à jour'); },
    onError: () => toast.error('Erreur lors de la mise à jour'),
  });

  // ── Infos company ─────────────────────────────────────────────────────────
  const { data: company } = useQuery({
    queryKey: ['company-info'],
    queryFn:  companyApi.getInfo,
    enabled:  isAdminCompany,
  });

  const [companyForm, setCompanyForm] = useState<Record<string, any>>({});
  React.useEffect(() => {
    if (company) {
      setCompanyForm({
        name:            company.name            || '',
        email:           company.email           || '',
        phone:           company.phone           || '',
        address:         company.address         || '',
        city:            company.city            || '',
        country:         company.country         || 'Tunisie',
        matriculeFiscal: company.matriculeFiscal || '',
        fiscalRegime:    company.fiscalRegime    || '',
        activityType:    company.activityType    || '',
        primaryColor:    company.primaryColor    || '#2563EB',
        logoUrl:         company.logoUrl         || '',
        notes:           company.notes           || '',
      });
    }
  }, [company]);

  const updateCompanyMut = useMutation({
    mutationFn: companyApi.updateInfo,
    onSuccess: () => {
      toast.success('Informations entreprise mises à jour');
      queryClient.invalidateQueries({ queryKey: ['company-info'] });
    },
    onError: () => toast.error('Erreur lors de la mise à jour'),
  });

  // ── Mot de passe ──────────────────────────────────────────────────────────
  const [passwordForm, setPasswordForm] = useState<Record<PasswordKeys, string>>({
    currentPassword: '',
    newPassword:     '',
    confirmPassword: '',
  });
  const [showPass, setShowPass] = useState<Record<ShowKeys, boolean>>({
    current: false, new: false, confirm: false,
  });

  const changePwMut = useMutation({
    mutationFn: authApi.changePassword,
    onSuccess: () => {
      toast.success('Mot de passe changé');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Erreur'),
  });

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas'); return;
    }
    if (passwordForm.newPassword.length < 8) {
      toast.error('Minimum 8 caractères'); return;
    }
    changePwMut.mutate({ currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword });
  };

  const COLORS = ['#2563EB', '#7C3AED', '#059669', '#DC2626', '#D97706', '#0891B2', '#DB2777', '#0F172A'];

  // Notifications — un seul useState hors du .map
  const NOTIF_ITEMS = [
    { key: 'stock',    label: 'Alertes de stock bas',   sub: 'Quand un produit passe sous le seuil', def: true  },
    { key: 'sales',    label: 'Nouvelles ventes',       sub: 'Notification à chaque vente créée',    def: true  },
    { key: 'payments', label: 'Paiements reçus',        sub: 'À chaque paiement enregistré',          def: true  },
    { key: 'expiry',   label: 'Expiration abonnement',  sub: "7 jours avant la date d'expiration",  def: true  },
    { key: 'reports',  label: 'Rapports hebdomadaires', sub: 'Résumé envoyé chaque lundi',           def: false },
  ] as const;
  type NotifKey = typeof NOTIF_ITEMS[number]['key'];
  const [notifToggles, setNotifToggles] = useState<Record<NotifKey, boolean>>(
      () => Object.fromEntries(NOTIF_ITEMS.map(n => [n.key, n.def])) as Record<NotifKey, boolean>
  );
  const toggleNotif = (key: NotifKey) => setNotifToggles(p => ({ ...p, [key]: !p[key] }));

  const FISCAL_REGIMES = ['reel', 'forfait', 'simplifie', 'exonere'];
  const FISCAL_LABELS: Record<string, string> = {
    reel: 'Régime réel', forfait: 'Régime forfaitaire',
    simplifie: 'Régime simplifié', exonere: 'Exonéré',
  };
  const ACTIVITY_TYPES = [
    'Commerce de détail', 'Commerce de gros', 'Services informatiques',
    'Services financiers', 'Industrie manufacturière', 'BTP / Construction',
    'Transport et logistique', 'Agriculture', 'Tourisme et hôtellerie',
    'Santé', 'Éducation et formation', 'Exportation', 'Autre',
  ];

  const passwordFields: { key: PasswordKeys; label: string; field: ShowKeys }[] = [
    { key: 'currentPassword', label: 'Mot de passe actuel',    field: 'current' },
    { key: 'newPassword',     label: 'Nouveau mot de passe',   field: 'new' },
    { key: 'confirmPassword', label: 'Confirmer le nouveau',   field: 'confirm' },
  ];

  return (
      <div className="max-w-2xl mx-auto space-y-3 pb-10">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Settings size={22} /> {t('nav.settings')}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Gérez votre profil, votre entreprise et les préférences système
          </p>
        </div>

        {/* ── 1. Profil utilisateur ─────────────────────────────────────── */}
        <Section
            id="profile"
            icon={<User size={18} className="text-blue-600" />}
            title="Profil utilisateur"
            subtitle={`${(user as any)?.name || ''} · ${(user as any)?.email || ''}`}
            open={open.profile}
            onToggle={() => toggle('profile')}
            accent="bg-blue-50 dark:bg-blue-900/20"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className={labelCls}>Nom complet</label>
              <input className={inp} value={profileForm.name}
                     onChange={e => setProfileForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label className={labelCls}>Téléphone</label>
              <input className={inp} value={profileForm.phone} placeholder="+216 XX XXX XXX"
                     onChange={e => setProfileForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
            <div>
              <label className={labelCls}>Poste / Fonction</label>
              <input className={inp} value={profileForm.position} placeholder="Ex: Comptable"
                     onChange={e => setProfileForm(f => ({ ...f, position: e.target.value }))} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>URL de l'avatar</label>
              <div className="flex items-center gap-3">
                {profileForm.avatarUrl && (
                    <img src={profileForm.avatarUrl} alt="avatar"
                         className="w-10 h-10 rounded-full object-cover flex-shrink-0 border border-gray-200 dark:border-gray-700" />
                )}
                <input className={inp} value={profileForm.avatarUrl} placeholder="https://..."
                       onChange={e => setProfileForm(f => ({ ...f, avatarUrl: e.target.value }))} />
              </div>
            </div>
          </div>

          {/* Rôle (lecture seule) */}
          <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl flex items-center gap-3">
            <Shield size={14} className="text-gray-400" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Rôle système</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {({ system_admin: 'Administrateur système', admin_company: 'Administrateur entreprise', resource: 'Utilisateur' } as Record<string, string>)[(user as any)?.role] || (user as any)?.role}
              </p>
            </div>
          </div>

          <button
              onClick={() => updateMeMut.mutate(profileForm)}
              disabled={updateMeMut.isPending}
              className="mt-4 flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl text-sm font-medium transition-colors"
          >
            <Save size={14} />
            {updateMeMut.isPending ? 'Enregistrement...' : 'Sauvegarder le profil'}
          </button>
        </Section>

        {/* ── 2. Informations entreprise (admin uniquement) ─────────────── */}
        {isAdminCompany && (
            <Section
                id="company"
                icon={<Building2 size={18} className="text-purple-600" />}
                title="Informations entreprise"
                subtitle={company?.name || 'Chargement...'}
                open={open.company}
                onToggle={() => toggle('company')}
                accent="bg-purple-50 dark:bg-purple-900/20"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className={labelCls}>Raison sociale</label>
                  <input className={inp} value={companyForm.name || ''}
                         onChange={e => setCompanyForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div>
                  <label className={labelCls}>Email professionnel</label>
                  <input className={inp} type="email" value={companyForm.email || ''}
                         onChange={e => setCompanyForm(f => ({ ...f, email: e.target.value }))} />
                </div>
                <div>
                  <label className={labelCls}>Téléphone</label>
                  <input className={inp} value={companyForm.phone || ''}
                         onChange={e => setCompanyForm(f => ({ ...f, phone: e.target.value }))} />
                </div>
                <div>
                  <label className={labelCls}>Matricule fiscal</label>
                  <input className={`${inp} uppercase`} value={companyForm.matriculeFiscal || ''}
                         placeholder="1234567A/P/A/000"
                         onChange={e => setCompanyForm(f => ({ ...f, matriculeFiscal: e.target.value.toUpperCase() }))} />
                </div>
                <div>
                  <label className={labelCls}>Régime fiscal</label>
                  <select className={inp} value={companyForm.fiscalRegime || ''}
                          onChange={e => setCompanyForm(f => ({ ...f, fiscalRegime: e.target.value }))}>
                    <option value="">Sélectionner...</option>
                    {FISCAL_REGIMES.map(r => <option key={r} value={r}>{FISCAL_LABELS[r]}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Type d'activité</label>
                  <select className={inp} value={companyForm.activityType || ''}
                          onChange={e => setCompanyForm(f => ({ ...f, activityType: e.target.value }))}>
                    <option value="">Sélectionner...</option>
                    {ACTIVITY_TYPES.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Ville</label>
                  <input className={inp} value={companyForm.city || ''}
                         onChange={e => setCompanyForm(f => ({ ...f, city: e.target.value }))} />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelCls}>Adresse</label>
                  <input className={inp} value={companyForm.address || ''}
                         placeholder="12 rue de la République"
                         onChange={e => setCompanyForm(f => ({ ...f, address: e.target.value }))} />
                </div>
                <div>
                  <label className={labelCls}>Couleur principale</label>
                  <div className="flex items-center gap-3">
                    <input type="color" value={companyForm.primaryColor || '#2563EB'}
                           onChange={e => setCompanyForm(f => ({ ...f, primaryColor: e.target.value }))}
                           className="w-10 h-10 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer p-0.5 bg-transparent flex-shrink-0" />
                    <input className={inp} value={companyForm.primaryColor || ''}
                           onChange={e => setCompanyForm(f => ({ ...f, primaryColor: e.target.value }))}
                           placeholder="#2563EB" />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>URL du logo</label>
                  <input className={inp} value={companyForm.logoUrl || ''} placeholder="https://..."
                         onChange={e => setCompanyForm(f => ({ ...f, logoUrl: e.target.value }))} />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelCls}>Notes internes</label>
                  <textarea className={`${inp} resize-none`} rows={3}
                            value={companyForm.notes || ''}
                            onChange={e => setCompanyForm(f => ({ ...f, notes: e.target.value }))} />
                </div>
              </div>
              <button
                  onClick={() => updateCompanyMut.mutate(companyForm)}
                  disabled={updateCompanyMut.isPending}
                  className="mt-4 flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-xl text-sm font-medium transition-colors"
              >
                <Save size={14} />
                {updateCompanyMut.isPending ? 'Enregistrement...' : "Sauvegarder l'entreprise"}
              </button>
            </Section>
        )}

        {/* ── 3. Apparence ──────────────────────────────────────────────── */}
        <Section
            id="appearance"
            icon={<Palette size={18} className="text-amber-600" />}
            title="Apparence"
            subtitle={`Thème ${isDark ? 'sombre' : 'clair'} · Couleur ${primaryColor}`}
            open={open.appearance}
            onToggle={() => toggle('appearance')}
            accent="bg-amber-50 dark:bg-amber-900/20"
        >
          <div className="space-y-5">
            {/* Thème */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Thème</p>
                <p className="text-xs text-gray-400 mt-0.5">Basculer entre le mode clair et sombre</p>
              </div>
              <button
                  onClick={toggleTheme}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
                      isDark
                          ? 'bg-gray-800 border-gray-700 text-white'
                          : 'bg-gray-50 border-gray-200 text-gray-700'
                  }`}
              >
                {isDark ? <Moon size={16} /> : <Sun size={16} />}
                {isDark ? t('settings.dark') : t('settings.light')}
              </button>
            </div>

            {/* Couleur principale */}
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white mb-3">Couleur principale</p>
              <div className="flex flex-wrap gap-3">
                {COLORS.map(color => (
                    <button
                        key={color}
                        onClick={() => setPrimaryColor(color)}
                        className="relative w-9 h-9 rounded-full transition-all hover:scale-110"
                        style={{ backgroundColor: color }}
                    >
                      {primaryColor === color && (
                          <span className="absolute inset-0 flex items-center justify-center">
                                            <Check size={14} className="text-white drop-shadow" />
                                        </span>
                      )}
                    </button>
                ))}
              </div>
            </div>

            {/* Langue */}
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <Globe size={14} /> Langue de l'interface
              </p>
              <LangSelector />
            </div>
          </div>
        </Section>

        {/* ── 4. Sécurité / Mot de passe ───────────────────────────────── */}
        <Section
            id="password"
            icon={<Lock size={18} className="text-red-600" />}
            title="Sécurité"
            subtitle="Changer le mot de passe"
            open={open.password}
            onToggle={() => toggle('password')}
            accent="bg-red-50 dark:bg-red-900/20"
        >
          {/* Infos de sécurité */}
          <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl space-y-2 text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center justify-between">
              <span>Email</span>
              <span className="font-medium text-gray-700 dark:text-gray-300">{(user as any)?.email}</span>
            </div>
            {(user as any)?.lastLoginAt && (
                <div className="flex items-center justify-between">
                  <span>Dernière connexion</span>
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                                {new Date((user as any).lastLoginAt).toLocaleString('fr-TN')}
                            </span>
                </div>
            )}
            <div className="flex items-center justify-between">
              <span>Authentification 2FA</span>
              <span className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-gray-500 dark:text-gray-400">Non configuré</span>
            </div>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-3">
            {passwordFields.map(({ key, label, field }) => (
                <div key={key}>
                  <label className={labelCls}>{label}</label>
                  <div className="relative">
                    <input
                        type={showPass[field] ? 'text' : 'password'}
                        required
                        value={passwordForm[key]}
                        onChange={e => setPasswordForm(f => ({ ...f, [key]: e.target.value }))}
                        className={`${inp} pr-10`}
                    />
                    <button
                        type="button"
                        onClick={() => setShowPass(s => ({ ...s, [field]: !s[field] }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPass[field] ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
            ))}

            {/* Indicateur de force */}
            {passwordForm.newPassword && (
                <div className="space-y-1">
                  <p className="text-xs text-gray-400">Force du mot de passe</p>
                  <div className="flex gap-1">
                    {[1,2,3,4].map(i => {
                      const pw = passwordForm.newPassword;
                      const score =
                          (pw.length >= 8 ? 1 : 0) +
                          (/[A-Z]/.test(pw) ? 1 : 0) +
                          (/[0-9]/.test(pw) ? 1 : 0) +
                          (/[^A-Za-z0-9]/.test(pw) ? 1 : 0);
                      const colors = ['bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-green-500'];
                      return (
                          <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= score ? colors[score - 1] : 'bg-gray-200 dark:bg-gray-700'}`} />
                      );
                    })}
                  </div>
                </div>
            )}

            <button
                type="submit"
                disabled={changePwMut.isPending}
                className="mt-2 flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-xl text-sm font-medium transition-colors"
            >
              <Lock size={14} />
              {changePwMut.isPending ? 'Changement...' : 'Changer le mot de passe'}
            </button>
          </form>
        </Section>

        {/* ── 5. Notifications ─────────────────────────────────────────── */}
        <Section
            id="notifications"
            icon={<Bell size={18} className="text-green-600" />}
            title={t('notifications.title')}
            subtitle="Préférences de notifications"
            open={open.notifications}
            onToggle={() => toggle('notifications')}
            accent="bg-green-50 dark:bg-green-900/20"
        >
          <div className="space-y-3">
            {NOTIF_ITEMS.map(({ key, label, sub }) => (
                <div key={key} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
                  </div>
                  <button
                      type="button"
                      onClick={() => toggleNotif(key)}
                      style={{ width: '44px', height: '24px', flexShrink: 0 }}
                      className={`rounded-full relative transition-colors duration-200 ${notifToggles[key] ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                  >
                    <span style={{ width: '18px', height: '18px', top: '3px', left: notifToggles[key] ? '23px' : '3px' }} className="absolute bg-white rounded-full shadow transition-all duration-200" />
                  </button>
                </div>
            ))}
            <p className="text-xs text-gray-400 pt-1">
              Les préférences de notification sont sauvegardées localement.
            </p>
          </div>
        </Section>

        {/* ── Infos version ──────────────────────────────────────────────── */}
        <div className="text-center pt-4">
          <p className="text-xs text-gray-300 dark:text-gray-700">
            ERP Tunisie · v2.0.0 · {new Date().getFullYear()}
          </p>
        </div>
      </div>
  );
};

export default SettingsPage;