import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../../api/auth.api';
import { Building2, Mail, ArrowLeft, CheckCircle, Eye, EyeOff, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

// ── Password strength helper ──────────────────────────────────────────────────
const getStrength = (pw: string) => {
    const score =
        (pw.length >= 8          ? 1 : 0) +
        (/[A-Z]/.test(pw)        ? 1 : 0) +
        (/[0-9]/.test(pw)        ? 1 : 0) +
        (/[^A-Za-z0-9]/.test(pw) ? 1 : 0);
    const map = [
        { label: '',       color: 'bg-gray-200 dark:bg-gray-700' },
        { label: 'Faible', color: 'bg-red-400'    },
        { label: 'Moyen',  color: 'bg-orange-400' },
        { label: 'Bon',    color: 'bg-yellow-400' },
        { label: 'Fort',   color: 'bg-green-500'  },
    ];
    return { score, ...map[score] };
};

// ── Shared input class ────────────────────────────────────────────────────────
const inputCls = [
    'w-full px-4 py-3 rounded-xl border',
    'border-gray-200 dark:border-gray-700',
    'bg-gray-50 dark:bg-gray-800',
    'text-gray-900 dark:text-white placeholder-gray-400',
    'text-sm focus:outline-none focus:ring-2',
    'focus:ring-blue-500/20 focus:border-blue-500 transition-all',
].join(' ');

// ── Component ─────────────────────────────────────────────────────────────────
const ForgotPasswordPage: React.FC = () => {
    const navigate = useNavigate();

    const [step, setStep]               = useState<1 | 2 | 'done'>(1);
    const [email, setEmail]             = useState('');
    const [code, setCode]               = useState<string[]>(['', '', '', '', '', '']);
    const [newPassword, setNewPassword] = useState('');
    const [confirm, setConfirm]         = useState('');
    const [showPw, setShowPw]           = useState(false);
    const [showCf, setShowCf]           = useState(false);
    const [loading, setLoading]         = useState(false);

    const codeRefs = useRef<(HTMLInputElement | null)[]>([]);
    const strength = getStrength(newPassword);

    // Step 1 — send OTP
    const handleSendCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await authApi.forgotPassword({ email });
            toast.success('Code envoyé sur votre email !');
            setStep(2);
            setTimeout(() => codeRefs.current[0]?.focus(), 100);
        } catch {
            // handled by axios interceptor
        } finally {
            setLoading(false);
        }
    };

    // OTP input handlers
    const handleCodeChange = (idx: number, val: string) => {
        const digit = val.replace(/\D/g, '').slice(-1);
        const next  = [...code];
        next[idx]   = digit;
        setCode(next);
        if (digit && idx < 5) codeRefs.current[idx + 1]?.focus();
    };

    const handleCodeKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !code[idx] && idx > 0) {
            codeRefs.current[idx - 1]?.focus();
        }
    };

    const handleCodePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        const next   = ['', '', '', '', '', ''];
        pasted.split('').forEach((d, i) => { next[i] = d; });
        setCode(next);
        codeRefs.current[Math.min(pasted.length, 5)]?.focus();
    };

    // Step 2 — reset password
    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = code.join('');
        if (token.length < 6)       { toast.error('Entrez le code à 6 chiffres complet'); return; }
        if (newPassword !== confirm) { toast.error('Les mots de passe ne correspondent pas'); return; }
        if (newPassword.length < 8) { toast.error('Minimum 8 caractères requis'); return; }
        setLoading(true);
        try {
            await authApi.resetPassword({ email, token, newPassword });
            setStep('done');
        } catch {
            // handled by axios interceptor
        } finally {
            setLoading(false);
        }
    };

    const goBackToEmail = () => {
        setStep(1);
        setCode(['', '', '', '', '', '']);
        setNewPassword('');
        setConfirm('');
    };

    // ── Title / subtitle per step ─────────────────────────────────────────────
    const titles: Record<string, string> = {
        '1':    'Mot de passe oublie',
        '2':    'Verification du code',
        'done': 'Mot de passe reinitialise',
    };

    const subtitles: Record<string, React.ReactNode> = {
        '1':    'Entrez votre email pour recevoir un code de verification',
        '2':    <>Code envoye a <strong className="text-gray-700 dark:text-gray-300">{email}</strong></>,
        'done': 'Votre mot de passe a ete reinitialise avec succes',
    };

    const stepKey = String(step);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 px-4">
            <div className="w-full max-w-md">

                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 p-8">

                    {/* Logo + title */}
                    <div className="flex flex-col items-center mb-7">
                        <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-blue-200 dark:shadow-blue-900/40">
                            <Building2 size={28} className="text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white text-center">
                            {titles[stepKey]}
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 text-center">
                            {subtitles[stepKey]}
                        </p>
                    </div>

                    {/* Stepper */}
                    {step !== 'done' && (
                        <div className="flex items-center gap-2 mb-7">
                            {([1, 2] as const).map((s, i) => (
                                <React.Fragment key={s}>
                                    <div
                                        className={[
                                            'w-7 h-7 rounded-full flex items-center justify-center',
                                            'text-xs font-bold flex-shrink-0 transition-colors',
                                            step === s
                                                ? 'bg-blue-600 text-white'
                                                : typeof step === 'number' && step > s
                                                    ? 'bg-green-500 text-white'
                                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-400',
                                        ].join(' ')}
                                    >
                                        {typeof step === 'number' && step > s ? '✓' : s}
                                    </div>
                                    {i === 0 && (
                                        <div
                                            className={[
                                                'flex-1 h-0.5 transition-colors',
                                                typeof step === 'number' && step > 1
                                                    ? 'bg-green-500'
                                                    : 'bg-gray-200 dark:bg-gray-700',
                                            ].join(' ')}
                                        />
                                    )}
                                </React.Fragment>
                            ))}
                        </div>
                    )}

                    {/* ── STEP 1 : Email ──────────────────────────────────────────── */}
                    {step === 1 && (
                        <form onSubmit={handleSendCode} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                    Adresse email
                                </label>
                                <div className="relative">
                                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        placeholder="votre@email.com"
                                        required
                                        autoFocus
                                        className={`${inputCls} pl-10`}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !email}
                                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-xl transition-colors text-sm"
                            >
                                {loading
                                    ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    : 'Envoyer le code'
                                }
                            </button>

                            <div className="text-center">
                                <Link
                                    to="/login"
                                    className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                                >
                                    <ArrowLeft size={14} />
                                    Retour a la connexion
                                </Link>
                            </div>
                        </form>
                    )}

                    {/* ── STEP 2 : OTP + new password ─────────────────────────────── */}
                    {step === 2 && (
                        <form onSubmit={handleReset} className="space-y-5">

                            {/* OTP inputs */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 text-center">
                                    Code de verification (6 chiffres)
                                </label>
                                <div className="flex justify-center gap-2" onPaste={handleCodePaste}>
                                    {code.map((digit, idx) => (
                                        <input
                                            key={idx}
                                            ref={el => { codeRefs.current[idx] = el; }}
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={1}
                                            value={digit}
                                            onChange={e => handleCodeChange(idx, e.target.value)}
                                            onKeyDown={e => handleCodeKeyDown(idx, e)}
                                            className={[
                                                'w-11 h-12 text-center text-lg font-bold rounded-xl border-2',
                                                'bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white',
                                                'focus:outline-none transition-all',
                                                digit
                                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30'
                                                    : 'border-gray-200 dark:border-gray-700 focus:border-blue-400',
                                            ].join(' ')}
                                        />
                                    ))}
                                </div>
                                <p className="text-xs text-gray-400 text-center mt-2">
                                    Verifiez vos spams si vous ne recevez pas le code.{' '}
                                    <button
                                        type="button"
                                        onClick={goBackToEmail}
                                        className="text-blue-500 hover:underline"
                                    >
                                        Renvoyer
                                    </button>
                                </p>
                            </div>

                            {/* New password */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                    Nouveau mot de passe <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPw ? 'text' : 'password'}
                                        value={newPassword}
                                        onChange={e => setNewPassword(e.target.value)}
                                        required
                                        placeholder="••••••••"
                                        className={`${inputCls} pr-12`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPw(v => !v)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                {newPassword && (
                                    <div className="mt-2 space-y-1">
                                        <div className="flex gap-1">
                                            {[1, 2, 3, 4].map(i => (
                                                <div
                                                    key={i}
                                                    className={`h-1.5 flex-1 rounded-full transition-colors ${
                                                        i <= strength.score ? strength.color : 'bg-gray-200 dark:bg-gray-700'
                                                    }`}
                                                />
                                            ))}
                                        </div>
                                        {strength.label && (
                                            <p className="text-xs text-gray-400">
                                                Force : <span className="font-medium">{strength.label}</span>
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Confirm password */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                    Confirmer le mot de passe <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type={showCf ? 'text' : 'password'}
                                        value={confirm}
                                        onChange={e => setConfirm(e.target.value)}
                                        required
                                        placeholder="••••••••"
                                        className={`${inputCls} pr-12`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowCf(v => !v)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showCf ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                {confirm && (
                                    <p className={`text-xs mt-1 ${newPassword === confirm ? 'text-green-500' : 'text-red-400'}`}>
                                        {newPassword === confirm
                                            ? '✓ Les mots de passe correspondent'
                                            : '✗ Ne correspondent pas'
                                        }
                                    </p>
                                )}
                            </div>

                            {/* Security rules */}
                            <div className="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl space-y-1">
                                {[
                                    { ok: newPassword.length >= 8,          label: 'Au moins 8 caracteres' },
                                    { ok: /[A-Z]/.test(newPassword),        label: 'Une majuscule' },
                                    { ok: /[0-9]/.test(newPassword),        label: 'Un chiffre' },
                                    { ok: /[^A-Za-z0-9]/.test(newPassword), label: 'Un caractere special' },
                                ].map(({ ok, label }) => (
                                    <p
                                        key={label}
                                        className={`text-xs flex items-center gap-1.5 transition-colors ${ok ? 'text-green-500' : 'text-gray-400'}`}
                                    >
                                        <span>{ok ? '✓' : '○'}</span>
                                        {label}
                                    </p>
                                ))}
                            </div>

                            <button
                                type="submit"
                                disabled={loading || code.join('').length < 6 || newPassword.length < 8}
                                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-xl transition-colors text-sm"
                            >
                                {loading
                                    ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    : <><Lock size={16} /> Reinitialiser le mot de passe</>
                                }
                            </button>

                        </form>
                    )}

                    {/* ── SUCCESS ─────────────────────────────────────────────────── */}
                    {step === 'done' && (
                        <div className="text-center space-y-5">
                            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
                                <CheckCircle size={32} className="text-green-600 dark:text-green-400" />
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.
                            </p>
                            <button
                                type="button"
                                onClick={() => navigate('/login')}
                                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors text-sm"
                            >
                                Aller a la connexion
                            </button>
                        </div>
                    )}

                </div>

                <p className="text-center text-xs text-gray-400 dark:text-gray-600 mt-4">
                    Votre compte est gere par l&apos;administrateur
                </p>

            </div>
        </div>
    );
};

export default ForgotPasswordPage;