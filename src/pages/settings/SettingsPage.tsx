// import React, { useState } from 'react';
// import { useMutation, useQuery } from '@tanstack/react-query';
// import { useAuth } from '../../context/AuthContext';
// import { useTheme } from '../../context/ThemeContext';
// import { authApi } from '../../api/auth.api';
// import { profileApi } from '../../api';
// import { Sun, Moon, Save, Lock, Building2, Eye, EyeOff } from 'lucide-react';
// import toast from 'react-hot-toast';
//
// const TAX_REGIMES = ['Régime réel', 'Forfait B', 'BIC simplifié', 'Non assujetti'];
// const BUSINESS_TYPES = ['Commerce', 'Services', 'Industrie', 'Agriculture', 'Artisanat', 'Professions libérales', 'Autre'];
//
// const SettingsPage: React.FC = () => {
//   const { user, updateUser } = useAuth();
//   const { isDark, toggleTheme, primaryColor, setPrimaryColor } = useTheme();
//
//   const [profileForm, setProfileForm] = useState({
//     businessName: user?.businessName || '',
//     taxId: (user as any)?.taxId || '',
//     fiscalRegime: (user as any)?.fiscalRegime || 'Régime réel',
//     activityType: (user as any)?.activityType || 'Commerce',
//     address: (user as any)?.address || '',
//     phone: (user as any)?.phone || '+216',
//     website: (user as any)?.website || '',
//   });
//
//   const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
//   const [showPass, setShowPass] = useState({ current: false, new: false, confirm: false });
//
//   const changePwMut = useMutation({
//     mutationFn: authApi.changePassword,
//     onSuccess: () => { toast.success('Mot de passe changé'); setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' }); },
//     onError: (e: any) => toast.error(e?.response?.data?.message || 'Erreur'),
//   });
//
//   const updateProfileMut = useMutation({
//     mutationFn: profileApi.update,
//     onSuccess: (data) => { updateUser(data); toast.success('Profil mis à jour'); },
//     onError: () => toast.error('Erreur lors de la mise à jour'),
//   });
//
//   const handlePasswordSubmit = (e: React.FormEvent) => {
//     e.preventDefault();
//     if (passwordForm.newPassword !== passwordForm.confirmPassword) { toast.error('Les mots de passe ne correspondent pas'); return; }
//     if (passwordForm.newPassword.length < 8) { toast.error('Minimum 8 caractères'); return; }
//     changePwMut.mutate({ currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword });
//   };
//
//   const COLORS = ['#2563EB', '#7C3AED', '#059669', '#DC2626', '#D97706', '#0891B2', '#DB2777'];
//   const inp = 'w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500';
//
//   return (
//     <div className="max-w-2xl mx-auto space-y-6">
//       <div>
//         <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Paramètres</h1>
//         <p className="text-gray-500 dark:text-gray-400 text-sm">Gérez votre profil et les préférences système</p>
//       </div>
//
//       {/* Business Profile */}
//       <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
//         <div className="flex items-center gap-3 mb-5">
//           <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-xl"><Building2 size={20} className="text-blue-600" /></div>
//           <div>
//             <h2 className="font-semibold text-gray-900 dark:text-white">Informations entreprise</h2>
//             <p className="text-xs text-gray-400">Informations légales et fiscales</p>
//           </div>
//         </div>
//         <div className="grid grid-cols-2 gap-3">
//           <div className="col-span-2">
//             <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Nom de l'entreprise</label>
//             <input value={profileForm.businessName} onChange={e => setProfileForm(f => ({ ...f, businessName: e.target.value }))} className={inp} />
//           </div>
//           <div>
//             <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Matricule fiscal</label>
//             <input value={profileForm.taxId} onChange={e => setProfileForm(f => ({ ...f, taxId: e.target.value }))} placeholder="Ex: 1234567A/P/M/000" className={inp} />
//           </div>
//           <div>
//             <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Régime fiscal</label>
//             <select value={profileForm.fiscalRegime} onChange={e => setProfileForm(f => ({ ...f, fiscalRegime: e.target.value }))} className={inp}>
//               {TAX_REGIMES.map(r => <option key={r} value={r}>{r}</option>)}
//             </select>
//           </div>
//           <div>
//             <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Type d'activité</label>
//             <select value={profileForm.activityType} onChange={e => setProfileForm(f => ({ ...f, activityType: e.target.value }))} className={inp}>
//               {BUSINESS_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
//             </select>
//           </div>
//           <div>
//             <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Téléphone</label>
//             <input value={profileForm.phone} onChange={e => setProfileForm(f => ({ ...f, phone: e.target.value }))} className={inp} />
//           </div>
//           <div className="col-span-2">
//             <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Adresse</label>
//             <input value={profileForm.address} onChange={e => setProfileForm(f => ({ ...f, address: e.target.value }))} className={inp} />
//           </div>
//           <div className="col-span-2">
//             <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Site web</label>
//             <input value={profileForm.website} onChange={e => setProfileForm(f => ({ ...f, website: e.target.value }))} placeholder="https://..." className={inp} />
//           </div>
//         </div>
//         <button onClick={() => updateProfileMut.mutate(profileForm)} disabled={updateProfileMut.isPending}
//           className="mt-4 flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl text-sm font-medium">
//           <Save size={14} />{updateProfileMut.isPending ? 'Enregistrement...' : 'Sauvegarder le profil'}
//         </button>
//       </div>
//
//       {/* Appearance */}
//       <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
//         <h2 className="font-semibold text-gray-900 dark:text-white mb-5">Apparence</h2>
//         <div className="space-y-4">
//           <div className="flex items-center justify-between">
//             <div>
//               <p className="text-sm font-medium text-gray-900 dark:text-white">Thème</p>
//               <p className="text-xs text-gray-400">Basculer entre le mode clair et sombre</p>
//             </div>
//             <button onClick={toggleTheme}
//               className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-700'}`}>
//               {isDark ? <Moon size={16} /> : <Sun size={16} />}
//               {isDark ? 'Sombre' : 'Clair'}
//             </button>
//           </div>
//           <div>
//             <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">Couleur principale</p>
//             <div className="flex gap-2">
//               {COLORS.map(color => (
//                 <button key={color} onClick={() => setPrimaryColor(color)}
//                   className={`w-8 h-8 rounded-full transition-all ${primaryColor === color ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-900 scale-110' : 'hover:scale-110'}`}
//                   style={{ backgroundColor: color, outlineColor: color }} />
//               ))}
//             </div>
//           </div>
//         </div>
//       </div>
//
//       {/* Change Password */}
//       <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
//         <div className="flex items-center gap-3 mb-5">
//           <div className="p-2.5 bg-amber-50 dark:bg-amber-900/20 rounded-xl"><Lock size={20} className="text-amber-600" /></div>
//           <h2 className="font-semibold text-gray-900 dark:text-white">Changer le mot de passe</h2>
//         </div>
//         <form onSubmit={handlePasswordSubmit} className="space-y-3">
//           {([
//             { key: 'currentPassword', label: 'Mot de passe actuel', show: showPass.current, field: 'current' as const },
//             { key: 'newPassword', label: 'Nouveau mot de passe', show: showPass.new, field: 'new' as const },
//             { key: 'confirmPassword', label: 'Confirmer le nouveau', show: showPass.confirm, field: 'confirm' as const },
//           ] as any[]).map(({ key, label, show, field }) => (
//             <div key={key}>
//               <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{label}</label>
//               <div className="relative">
//                 <input type={show ? 'text' : 'password'} required value={(passwordForm as any)[key]} onChange={e => setPasswordForm(f => ({ ...f, [key]: e.target.value }))} className={inp + ' pr-10'} />
//                 <button type="button" onClick={() => setShowPass(s => ({ ...s, [field]: !s[field] }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
//                   {show ? <EyeOff size={16} /> : <Eye size={16} />}
//                 </button>
//               </div>
//             </div>
//           ))}
//           <button type="submit" disabled={changePwMut.isPending}
//             className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-400 text-white rounded-xl text-sm font-medium mt-2">
//             <Lock size={14} />{changePwMut.isPending ? 'Changement...' : 'Changer le mot de passe'}
//           </button>
//         </form>
//       </div>
//     </div>
//   );
// };
//
// export default SettingsPage;
import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { authApi } from '../../api/auth.api';
import { profileApi } from '../../api';
import { Sun, Moon, Save, Lock, Building2, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

const TAX_REGIMES = ['Régime réel', 'Forfait B', 'BIC simplifié', 'Non assujetti'];
const BUSINESS_TYPES = ['Commerce', 'Services', 'Industrie', 'Agriculture', 'Artisanat', 'Professions libérales', 'Autre'];

type PasswordKeys = 'currentPassword' | 'newPassword' | 'confirmPassword';
type ShowKeys = 'current' | 'new' | 'confirm';

const SettingsPage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { isDark, toggleTheme, primaryColor, setPrimaryColor } = useTheme();

  const [profileForm, setProfileForm] = useState({
    businessName: user?.businessName || '',
    taxId: (user as any)?.taxId || '',
    fiscalRegime: (user as any)?.fiscalRegime || 'Régime réel',
    activityType: (user as any)?.activityType || 'Commerce',
    address: (user as any)?.address || '',
    phone: (user as any)?.phone || '+216',
    website: (user as any)?.website || '',
  });

  const [passwordForm, setPasswordForm] = useState<Record<PasswordKeys, string>>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [showPass, setShowPass] = useState<Record<ShowKeys, boolean>>({
    current: false,
    new: false,
    confirm: false
  });

  const changePwMut = useMutation({
    mutationFn: authApi.changePassword,
    onSuccess: () => {
      toast.success('Mot de passe changé');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Erreur'),
  });

  const updateProfileMut = useMutation({
    mutationFn: profileApi.update,
    onSuccess: (data) => { updateUser(data); toast.success('Profil mis à jour'); },
    onError: () => toast.error('Erreur lors de la mise à jour'),
  });

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) { toast.error('Les mots de passe ne correspondent pas'); return; }
    if (passwordForm.newPassword.length < 8) { toast.error('Minimum 8 caractères'); return; }
    changePwMut.mutate({ currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword });
  };

  const COLORS = ['#2563EB', '#7C3AED', '#059669', '#DC2626', '#D97706', '#0891B2', '#DB2777'];
  const inp = 'w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500';

  const passwordFields: { key: PasswordKeys; label: string; field: ShowKeys }[] = [
    { key: 'currentPassword', label: 'Mot de passe actuel', field: 'current' },
    { key: 'newPassword', label: 'Nouveau mot de passe', field: 'new' },
    { key: 'confirmPassword', label: 'Confirmer le nouveau', field: 'confirm' },
  ];

  return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Paramètres</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Gérez votre profil et les préférences système</p>
        </div>

        {/* Business Profile */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-xl"><Building2 size={20} className="text-blue-600" /></div>
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white">Informations entreprise</h2>
              <p className="text-xs text-gray-400">Informations légales et fiscales</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Nom de l'entreprise</label>
              <input value={profileForm.businessName} onChange={e => setProfileForm(f => ({ ...f, businessName: e.target.value }))} className={inp} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Matricule fiscal</label>
              <input value={profileForm.taxId} onChange={e => setProfileForm(f => ({ ...f, taxId: e.target.value }))} placeholder="Ex: 1234567A/P/M/000" className={inp} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Régime fiscal</label>
              <select value={profileForm.fiscalRegime} onChange={e => setProfileForm(f => ({ ...f, fiscalRegime: e.target.value }))} className={inp}>
                {TAX_REGIMES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Type d'activité</label>
              <select value={profileForm.activityType} onChange={e => setProfileForm(f => ({ ...f, activityType: e.target.value }))} className={inp}>
                {BUSINESS_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Téléphone</label>
              <input value={profileForm.phone} onChange={e => setProfileForm(f => ({ ...f, phone: e.target.value }))} className={inp} />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Adresse</label>
              <input value={profileForm.address} onChange={e => setProfileForm(f => ({ ...f, address: e.target.value }))} className={inp} />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Site web</label>
              <input value={profileForm.website} onChange={e => setProfileForm(f => ({ ...f, website: e.target.value }))} placeholder="https://..." className={inp} />
            </div>
          </div>
          <button onClick={() => updateProfileMut.mutate(profileForm)} disabled={updateProfileMut.isPending}
                  className="mt-4 flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl text-sm font-medium">
            <Save size={14} />{updateProfileMut.isPending ? 'Enregistrement...' : 'Sauvegarder le profil'}
          </button>
        </div>

        {/* Appearance */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-5">Apparence</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Thème</p>
                <p className="text-xs text-gray-400">Basculer entre le mode clair et sombre</p>
              </div>
              <button onClick={toggleTheme}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-700'}`}>
                {isDark ? <Moon size={16} /> : <Sun size={16} />}
                {isDark ? 'Sombre' : 'Clair'}
              </button>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">Couleur principale</p>
              <div className="flex gap-2">
                {COLORS.map(color => (
                    <button key={color} onClick={() => setPrimaryColor(color)}
                            className={`w-8 h-8 rounded-full transition-all ${primaryColor === color ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-900 scale-110' : 'hover:scale-110'}`}
                            style={{ backgroundColor: color, outlineColor: color }} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Change Password */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2.5 bg-amber-50 dark:bg-amber-900/20 rounded-xl"><Lock size={20} className="text-amber-600" /></div>
            <h2 className="font-semibold text-gray-900 dark:text-white">Changer le mot de passe</h2>
          </div>
          <form onSubmit={handlePasswordSubmit} className="space-y-3">
            {passwordFields.map(({ key, label, field }) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{label}</label>
                  <div className="relative">
                    <input
                        type={showPass[field] ? 'text' : 'password'}
                        required
                        value={passwordForm[key]}
                        onChange={e => setPasswordForm(f => ({ ...f, [key]: e.target.value }))}
                        className={inp + ' pr-10'}
                    />
                    <button
                        type="button"
                        onClick={() => setShowPass(s => ({ ...s, [field]: !s[field] }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                    >
                      {showPass[field] ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
            ))}
            <button type="submit" disabled={changePwMut.isPending}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-400 text-white rounded-xl text-sm font-medium mt-2">
              <Lock size={14} />{changePwMut.isPending ? 'Changement...' : 'Changer le mot de passe'}
            </button>
          </form>
        </div>
      </div>
  );
};

export default SettingsPage;
