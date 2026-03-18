import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../api/auth.api';
import { Building2, Eye, EyeOff, Lock, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

const inputCls = 'w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all';

const ChangePasswordPage: React.FC = () => {
  const [form, setForm]       = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [show, setShow]       = useState({ current: false, new: false, confirm: false });
  const [isLoading, setLoading] = useState(false);
  const { user, updateUser }  = useAuth();
  const navigate              = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) { toast.error('Les mots de passe ne correspondent pas'); return; }
    if (form.newPassword.length < 8)               { toast.error('Minimum 8 caractères requis'); return; }
    setLoading(true);
    try {
      await authApi.changePassword({ currentPassword: form.currentPassword, newPassword: form.newPassword });
      updateUser({ mustChangePassword: false });
      toast.success('Mot de passe changé avec succès');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur lors du changement');
    } finally {
      setLoading(false);
    }
  };

  const toggle = (field: keyof typeof show) => setShow(s => ({ ...s, [field]: !s[field] }));

  const fields: { key: keyof typeof form; label: string; showKey: keyof typeof show }[] = [
    { key: 'currentPassword', label: 'Mot de passe actuel',           showKey: 'current' },
    { key: 'newPassword',     label: 'Nouveau mot de passe',          showKey: 'new' },
    { key: 'confirmPassword', label: 'Confirmer le nouveau mot de passe', showKey: 'confirm' },
  ];

  return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 px-4">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 p-8">

            {/* Logo */}
            <div className="flex flex-col items-center mb-8">
              <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-blue-200 dark:shadow-blue-900/40">
                <ShieldCheck size={28} className="text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Changer votre mot de passe</h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 text-center">
                {user?.mustChangePassword
                    ? 'Première connexion — veuillez définir votre mot de passe.'
                    : 'Mettez à jour votre mot de passe.'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {fields.map(({ key, label, showKey }) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {label}
                      {key !== 'currentPassword' && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    <div className="relative">
                      <input
                          type={show[showKey] ? 'text' : 'password'}
                          value={form[key]}
                          onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                          required
                          placeholder="••••••••"
                          className={inputCls}
                      />
                      <button
                          type="button"
                          onClick={() => toggle(showKey)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        {show[showKey] ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
              ))}

              <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-xl transition-colors text-sm mt-2"
              >
                {isLoading
                    ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <><Lock size={16} /> Changer le mot de passe</>
                }
              </button>
            </form>
          </div>
        </div>
      </div>
  );
};

export default ChangePasswordPage;