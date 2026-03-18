// import React, { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import {
//     Building2, Mail, Phone, MapPin, Globe, FileText,
//     CreditCard, ChevronRight, ChevronLeft, Check, Upload,
//     Briefcase, Hash, Calendar, DollarSign, AlertCircle, Info,
// } from 'lucide-react';
// import toast from 'react-hot-toast';
// import { usersApi } from '../../api';
// import api from "../../api/client";
//
// // ── Types ─────────────────────────────────────────────────────────────────────
// interface CompanyForm {
//     name: string;
//     formeJuridique: string;
//     matriculeFiscal: string;
//     rne: string;
//     email: string;
//     phone: string;
//     fax: string;
//     address: string;
//     city: string;
//     codePostal: string;
//     gouvernorat: string;
//     country: string;
//     fiscalRegime: string;
//     assujettTVA: boolean;
//     activityType: string;
//     categorieEntreprise: string;
//     primaryColor: string;
//     logoUrl: string;
//     plan: 'trial' | 'starter' | 'professional' | 'enterprise';
//     subscriptionStatus: 'active' | 'trial' | 'suspended' | 'expired' | 'cancelled';
//     subscriptionStartAt: string;
//     subscriptionExpiresAt: string;
//     amountPaid: number;
//     ocrLimitPerMonth: number;
//     adminName: string;
//     adminEmail: string;
//     adminPhone: string;
//     notes: string;
// }
//
// // ── Données tunisiennes ───────────────────────────────────────────────────────
// const FORMES_JURIDIQUES = [
//     'SARL', 'SA', 'SUARL', 'SNC', 'SCS', 'GIE',
//     'Association', 'Coopérative', 'Entreprise individuelle', 'Autre',
// ];
//
// const GOUVERNORATS = [
//     'Ariana', 'Béja', 'Ben Arous', 'Bizerte', 'Gabès', 'Gafsa',
//     'Jendouba', 'Kairouan', 'Kasserine', 'Kébili', 'Kef', 'Mahdia',
//     'Manouba', 'Médenine', 'Monastir', 'Nabeul', 'Sfax', 'Sidi Bouzid',
//     'Siliana', 'Sousse', 'Tataouine', 'Tozeur', 'Tunis', 'Zaghouan',
// ];
//
// const FISCAL_REGIMES = [
//     { value: 'reel',       label: 'Régime réel',             desc: 'Comptabilité complète obligatoire' },
//     { value: 'forfait',    label: 'Régime forfaitaire',       desc: 'CA < 100 000 TND/an' },
//     { value: 'simplifie',  label: 'Régime simplifié',         desc: 'PME éligibles' },
//     { value: 'exonere',    label: 'Exonéré (zones franches)', desc: 'Avantages fiscaux spéciaux' },
// ];
//
// const ACTIVITY_TYPES = [
//     'Commerce de détail', 'Commerce de gros', 'Services informatiques',
//     'Services financiers', 'Industrie manufacturière', 'Agro-alimentaire',
//     'BTP / Construction', 'Transport et logistique', 'Agriculture',
//     'Tourisme et hôtellerie', 'Santé', 'Éducation et formation',
//     'Artisanat', 'Exportation', 'Autre',
// ];
//
// const CATEGORIES = [
//     { value: 'tpe', label: 'TPE', desc: '< 10 employés' },
//     { value: 'pme', label: 'PME', desc: '10 – 200' },
//     { value: 'ge',  label: 'GE',  desc: '> 200' },
// ];
//
// const PLANS = [
//     { value: 'trial',        label: 'Trial',        color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',            desc: 'Gratuit 14 jours' },
//     { value: 'starter',      label: 'Starter',      color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',         desc: '49 TND / mois' },
//     { value: 'professional', label: 'Professional', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400', desc: '99 TND / mois' },
//     { value: 'enterprise',   label: 'Enterprise',   color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',     desc: 'Sur devis' },
// ];
//
// const STATUSES = [
//     { value: 'trial',     label: 'Trial',    dot: 'bg-gray-400' },
//     { value: 'active',    label: 'Actif',    dot: 'bg-green-500' },
//     { value: 'suspended', label: 'Suspendu', dot: 'bg-orange-500' },
//     { value: 'expired',   label: 'Expiré',   dot: 'bg-red-500' },
//     { value: 'cancelled', label: 'Annulé',   dot: 'bg-red-800' },
// ];
//
// const STEPS = [
//     { id: 1, label: 'Identification', icon: Building2 },
//     { id: 2, label: 'Fiscal',         icon: FileText },
//     { id: 3, label: 'Abonnement',     icon: CreditCard },
//     { id: 4, label: 'Administrateur', icon: Briefcase },
// ];
//
// const INITIAL: CompanyForm = {
//     name: '', formeJuridique: '', matriculeFiscal: '', rne: '',
//     email: '', phone: '', fax: '', address: '',
//     city: '', codePostal: '', gouvernorat: '', country: 'Tunisie',
//     fiscalRegime: '', assujettTVA: true, activityType: '', categorieEntreprise: '',
//     primaryColor: '#2563EB', logoUrl: '',
//     plan: 'trial', subscriptionStatus: 'trial',
//     subscriptionStartAt: new Date().toISOString().slice(0, 10),
//     subscriptionExpiresAt: '',
//     amountPaid: 0, ocrLimitPerMonth: 400,
//     adminName: '', adminEmail: '', adminPhone: '',
//     notes: '',
// };
//
// // ── Validators tunisiens ──────────────────────────────────────────────────────
// const validateMatricule = (v: string) =>
//     !v || /^\d{7}[A-Z]\/[PNMCB]\/[AN]\/\d{3}$/.test(v) ? '' : 'Format: 1234567A/P/A/000';
//
// const validatePhone = (v: string) =>
//     !v || /^[24579]\d{7}$/.test(v.replace(/\s/g, '')) ? '' : 'Numéro invalide (8 chiffres, débute par 2/4/5/7/9)';
//
// const validateCP = (v: string) =>
//     !v || /^\d{4}$/.test(v) ? '' : '4 chiffres requis';
//
// const validateRne = (v: string) =>
//     !v || /^[A-Z]\d{7}$/.test(v) ? '' : 'Format: J1234567';
//
// // ── Field component — OUTSIDE AddCompanyPage to keep a stable reference ───────
// // ⚠️ Si Field était défini à l'intérieur de AddCompanyPage, React le recrée
// //    à chaque re-render, ce qui démonte/remonte l'input et fait perdre le focus
// //    après chaque frappe.
// const Field = ({
//                    label,
//                    error,
//                    hint,
//                    children,
//                }: {
//     label: string;
//     error?: string;
//     hint?: string;
//     children: React.ReactNode;
// }) => (
//     <div>
//         <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
//             {label}
//         </label>
//         {children}
//         {hint && !error && (
//             <p className="mt-1 text-[11px] text-gray-400 flex items-center gap-1">
//                 <Info size={10} />{hint}
//             </p>
//         )}
//         {error && (
//             <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
//                 <AlertCircle size={11} />{error}
//             </p>
//         )}
//     </div>
// );
//
// // ── Component ─────────────────────────────────────────────────────────────────
// const AddCompanyPage: React.FC = () => {
//     const navigate = useNavigate();
//     const [step, setStep]       = useState(1);
//     const [form, setForm]       = useState<CompanyForm>(INITIAL);
//     const [errors, setErrors]   = useState<Partial<Record<keyof CompanyForm, string>>>({});
//     const [loading, setLoading] = useState(false);
//
//     const set = (field: keyof CompanyForm, value: any) => {
//         setForm(p => ({ ...p, [field]: value }));
//         setErrors(p => ({ ...p, [field]: undefined }));
//     };
//
//     const inputCls = (field: keyof CompanyForm) =>
//         `w-full px-4 py-2.5 rounded-xl border text-sm bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all ${
//             errors[field]
//                 ? 'border-red-400 focus:ring-red-500/20'
//                 : 'border-gray-200 dark:border-gray-700 focus:ring-blue-500/20 focus:border-blue-500'
//         }`;
//
//     const validate = (s: number): boolean => {
//         const e: Partial<Record<keyof CompanyForm, string>> = {};
//
//         if (s === 1) {
//             if (!form.name.trim())    e.name           = 'Raison sociale requise';
//             if (!form.formeJuridique) e.formeJuridique = 'Forme juridique requise';
//             if (!form.email.trim())   e.email          = 'Email requis';
//             else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Email invalide';
//             if (!form.phone.trim())   e.phone = 'Téléphone requis';
//             else { const err = validatePhone(form.phone); if (err) e.phone = err; }
//             if (form.fax)  { const err = validatePhone(form.fax);  if (err) e.fax = err; }
//             if (!form.gouvernorat) e.gouvernorat = 'Gouvernorat requis';
//             if (form.codePostal) { const err = validateCP(form.codePostal); if (err) e.codePostal = err; }
//         }
//
//         if (s === 2) {
//             if (form.matriculeFiscal) { const err = validateMatricule(form.matriculeFiscal); if (err) e.matriculeFiscal = err; }
//             if (form.rne)             { const err = validateRne(form.rne);             if (err) e.rne = err; }
//             if (!form.fiscalRegime)   e.fiscalRegime = 'Régime fiscal requis';
//             if (!form.activityType)   e.activityType = "Type d'activité requis";
//         }
//
//         if (s === 4) {
//             if (!form.adminName.trim())  e.adminName  = "Nom de l'admin requis";
//             if (!form.adminEmail.trim()) e.adminEmail = "Email requis";
//             else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.adminEmail)) e.adminEmail = 'Email invalide';
//             if (form.adminPhone) { const err = validatePhone(form.adminPhone); if (err) e.adminPhone = err; }
//         }
//
//         setErrors(e);
//         return Object.keys(e).length === 0;
//     };
//
//     const next = () => { if (validate(step)) setStep(s => Math.min(s + 1, 4)); };
//     const prev = () => setStep(s => Math.max(s - 1, 1));
//
//     const handleSubmit = async () => {
//         if (!validate(4)) return;
//         setLoading(true);
//         try {
//             const payload = {
//                 company: {
//                     name: form.name,
//                     formeJuridique: form.formeJuridique,
//                     matriculeFiscal: form.matriculeFiscal?.toUpperCase() || undefined,
//                     rne: form.rne?.toUpperCase() || undefined,
//                     email: form.email,
//                     phone: form.phone,
//                     fax: form.fax || undefined,
//                     address: form.address,
//                     city: form.city,
//                     codePostal: form.codePostal,
//                     gouvernorat: form.gouvernorat,
//                     country: form.country,
//                     fiscalRegime: form.fiscalRegime,
//                     assujettTVA: form.assujettTVA,
//                     activityType: form.activityType,
//                     categorieEntreprise: form.categorieEntreprise || undefined,
//                     primaryColor: form.primaryColor,
//                     logoUrl: form.logoUrl || undefined,
//                     plan: form.plan,
//                     subscriptionStatus: form.subscriptionStatus,
//                     subscriptionStartAt: form.subscriptionStartAt || undefined,
//                     subscriptionExpiresAt: form.subscriptionExpiresAt || undefined,
//                     amountPaid: form.amountPaid,
//                     ocrLimitPerMonth: form.ocrLimitPerMonth,
//                     notes: form.notes || undefined,
//                 },
//                 admin: {
//                     name: form.adminName,
//                     email: form.adminEmail,
//                     phone: form.adminPhone || undefined,
//                 },
//             };
//
//             // ✅ Appel vers le bon endpoint /admin/companies
//             await api.post('/admin/companies', payload);
//
//             toast.success(`Entreprise "${form.name}" créée avec succès !`);
//             navigate('/admin/companies');
//         } catch {
//             // handled by axios interceptor
//         } finally {
//             setLoading(false);
//         }
//     };
//
//     const renderStep = () => {
//         switch (step) {
//
//             // ── Step 1 : Identification légale ─────────────────────────────────
//             case 1: return (
//                 <div className="space-y-4">
//                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//                         <Field label="Raison sociale *" error={errors.name}>
//                             <div className="relative">
//                                 <Building2 size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
//                                 <input
//                                     className={`${inputCls('name')} pl-9`}
//                                     placeholder="SARL Exemple"
//                                     value={form.name}
//                                     onChange={e => set('name', e.target.value)}
//                                 />
//                             </div>
//                         </Field>
//                         <Field label="Forme juridique *" error={errors.formeJuridique}>
//                             <select
//                                 className={inputCls('formeJuridique')}
//                                 value={form.formeJuridique}
//                                 onChange={e => set('formeJuridique', e.target.value)}
//                             >
//                                 <option value="">Sélectionner...</option>
//                                 {FORMES_JURIDIQUES.map(f => <option key={f} value={f}>{f}</option>)}
//                             </select>
//                         </Field>
//                         <Field label="Email professionnel *" error={errors.email}>
//                             <div className="relative">
//                                 <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
//                                 <input
//                                     className={`${inputCls('email')} pl-9`}
//                                     type="email"
//                                     placeholder="contact@entreprise.tn"
//                                     value={form.email}
//                                     onChange={e => set('email', e.target.value)}
//                                 />
//                             </div>
//                         </Field>
//                         <Field label="Téléphone * (8 chiffres)" error={errors.phone} hint="Ex: 71234567 — débute par 2/4/5/7/9">
//                             <div className="relative">
//                                 <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
//                                 <input
//                                     className={`${inputCls('phone')} pl-9`}
//                                     placeholder="71234567"
//                                     maxLength={8}
//                                     value={form.phone}
//                                     onChange={e => set('phone', e.target.value.replace(/\D/g, ''))}
//                                 />
//                             </div>
//                         </Field>
//                         <Field label="Fax (optionnel)" error={errors.fax}>
//                             <div className="relative">
//                                 <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
//                                 <input
//                                     className={`${inputCls('fax')} pl-9`}
//                                     placeholder="71234567"
//                                     maxLength={8}
//                                     value={form.fax}
//                                     onChange={e => set('fax', e.target.value.replace(/\D/g, ''))}
//                                 />
//                             </div>
//                         </Field>
//                         <Field label="Gouvernorat *" error={errors.gouvernorat}>
//                             <div className="relative">
//                                 <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
//                                 <select
//                                     className={`${inputCls('gouvernorat')} pl-9`}
//                                     value={form.gouvernorat}
//                                     onChange={e => set('gouvernorat', e.target.value)}
//                                 >
//                                     <option value="">Sélectionner...</option>
//                                     {GOUVERNORATS.map(g => <option key={g} value={g}>{g}</option>)}
//                                 </select>
//                             </div>
//                         </Field>
//                     </div>
//                     <Field label="Adresse">
//                         <input
//                             className={inputCls('address')}
//                             placeholder="12 rue de la République"
//                             value={form.address}
//                             onChange={e => set('address', e.target.value)}
//                         />
//                     </Field>
//                     <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
//                         <Field label="Ville">
//                             <input
//                                 className={inputCls('city')}
//                                 placeholder="Tunis"
//                                 value={form.city}
//                                 onChange={e => set('city', e.target.value)}
//                             />
//                         </Field>
//                         <Field label="Code postal" error={errors.codePostal} hint="4 chiffres">
//                             <input
//                                 className={inputCls('codePostal')}
//                                 placeholder="1000"
//                                 maxLength={4}
//                                 value={form.codePostal}
//                                 onChange={e => set('codePostal', e.target.value.replace(/\D/g, ''))}
//                             />
//                         </Field>
//                         <Field label="Pays">
//                             <div className="relative">
//                                 <Globe size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
//                                 <input
//                                     className={`${inputCls('country')} pl-9`}
//                                     value={form.country}
//                                     onChange={e => set('country', e.target.value)}
//                                 />
//                             </div>
//                         </Field>
//                     </div>
//                     <div className="grid grid-cols-2 gap-4">
//                         <Field label="Couleur principale">
//                             <div className="flex items-center gap-3">
//                                 <input
//                                     type="color"
//                                     value={form.primaryColor}
//                                     onChange={e => set('primaryColor', e.target.value)}
//                                     className="w-10 h-10 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer p-0.5 bg-transparent flex-shrink-0"
//                                 />
//                                 <input
//                                     className={inputCls('primaryColor')}
//                                     value={form.primaryColor}
//                                     onChange={e => set('primaryColor', e.target.value)}
//                                     placeholder="#2563EB"
//                                 />
//                             </div>
//                         </Field>
//                         <Field label="URL du logo">
//                             <div className="relative">
//                                 <Upload size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
//                                 <input
//                                     className={`${inputCls('logoUrl')} pl-9`}
//                                     placeholder="https://..."
//                                     value={form.logoUrl}
//                                     onChange={e => set('logoUrl', e.target.value)}
//                                 />
//                             </div>
//                         </Field>
//                     </div>
//                 </div>
//             );
//
//             // ── Step 2 : Fiscal (loi tunisienne) ──────────────────────────────
//             case 2: return (
//                 <div className="space-y-4">
//                     <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 rounded-xl flex items-start gap-2.5">
//                         <Info size={15} className="text-blue-500 flex-shrink-0 mt-0.5"/>
//                         <p className="text-xs text-blue-700 dark:text-blue-300">
//                             Conformément au <strong>Code de la TVA</strong> et au <strong>Code de l'IRPP et IS</strong> (loi tunisienne).
//                             Le matricule fiscal est délivré par la <strong>DGI — Ministère des Finances</strong>.
//                         </p>
//                     </div>
//                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//                         <Field label="Matricule fiscal" error={errors.matriculeFiscal} hint="7 chiffres + lettre + /P|N|M|C|B + /A|N + /000-999">
//                             <div className="relative">
//                                 <Hash size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
//                                 <input
//                                     className={`${inputCls('matriculeFiscal')} pl-9 uppercase`}
//                                     placeholder="1234567A/P/A/000"
//                                     value={form.matriculeFiscal}
//                                     onChange={e => set('matriculeFiscal', e.target.value.toUpperCase())}
//                                 />
//                             </div>
//                         </Field>
//                         <Field label="N° RNE (Registre National des Entreprises)" error={errors.rne} hint="Lettre + 7 chiffres — ex: J1234567">
//                             <div className="relative">
//                                 <FileText size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
//                                 <input
//                                     className={`${inputCls('rne')} pl-9 uppercase`}
//                                     placeholder="J1234567"
//                                     value={form.rne}
//                                     onChange={e => set('rne', e.target.value.toUpperCase())}
//                                 />
//                             </div>
//                         </Field>
//                         <Field label="Régime fiscal *" error={errors.fiscalRegime}>
//                             <select
//                                 className={inputCls('fiscalRegime')}
//                                 value={form.fiscalRegime}
//                                 onChange={e => set('fiscalRegime', e.target.value)}
//                             >
//                                 <option value="">Sélectionner...</option>
//                                 {FISCAL_REGIMES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
//                             </select>
//                             {form.fiscalRegime && (
//                                 <p className="mt-1 text-[11px] text-gray-400">
//                                     {FISCAL_REGIMES.find(r => r.value === form.fiscalRegime)?.desc}
//                                 </p>
//                             )}
//                         </Field>
//                         <Field label="Type d'activité *" error={errors.activityType}>
//                             <select
//                                 className={inputCls('activityType')}
//                                 value={form.activityType}
//                                 onChange={e => set('activityType', e.target.value)}
//                             >
//                                 <option value="">Sélectionner...</option>
//                                 {ACTIVITY_TYPES.map(a => <option key={a} value={a}>{a}</option>)}
//                             </select>
//                         </Field>
//                         <Field label="Catégorie d'entreprise">
//                             <div className="flex gap-2">
//                                 {CATEGORIES.map(c => (
//                                     <button
//                                         key={c.value}
//                                         type="button"
//                                         onClick={() => set('categorieEntreprise', c.value)}
//                                         className={`flex-1 py-2.5 rounded-xl border text-xs font-medium transition-all ${
//                                             form.categorieEntreprise === c.value
//                                                 ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-600'
//                                                 : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400'
//                                         }`}
//                                     >
//                                         <span className="block font-bold">{c.label}</span>
//                                         <span className="text-[10px] opacity-70">{c.desc}</span>
//                                     </button>
//                                 ))}
//                             </div>
//                         </Field>
//                         <Field label="Assujetti à la TVA" hint="Taux standard : 19% — taux réduits : 7% et 13%">
//                             <button
//                                 type="button"
//                                 onClick={() => set('assujettTVA', !form.assujettTVA)}
//                                 className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-xl border transition-all ${
//                                     form.assujettTVA
//                                         ? 'border-green-500 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400'
//                                         : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400'
//                                 }`}
//                             >
//                                 <div className={`w-9 h-5 rounded-full transition-colors relative flex-shrink-0 ${form.assujettTVA ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
//                                     <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.assujettTVA ? 'translate-x-4' : 'translate-x-0.5'}`}/>
//                                 </div>
//                                 <span className="text-sm font-medium">
//                                     {form.assujettTVA ? 'Oui — assujetti TVA' : 'Non — non assujetti'}
//                                 </span>
//                             </button>
//                         </Field>
//                     </div>
//                     <Field label="Notes internes">
//                         <textarea
//                             className={`${inputCls('notes')} resize-none`}
//                             rows={3}
//                             placeholder="Notes visibles uniquement par les administrateurs système..."
//                             value={form.notes}
//                             onChange={e => set('notes', e.target.value)}
//                         />
//                     </Field>
//                 </div>
//             );
//
//             // ── Step 3 : Abonnement ────────────────────────────────────────────
//             case 3: return (
//                 <div className="space-y-5">
//                     <Field label="Plan d'abonnement">
//                         <div className="grid grid-cols-2 gap-3 mt-1">
//                             {PLANS.map(p => (
//                                 <button
//                                     key={p.value}
//                                     type="button"
//                                     onClick={() => set('plan', p.value as any)}
//                                     className={`relative flex flex-col items-start p-4 rounded-xl border-2 text-left transition-all ${
//                                         form.plan === p.value
//                                             ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40'
//                                             : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
//                                     }`}
//                                 >
//                                     {form.plan === p.value && (
//                                         <span className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
//                                             <Check size={11} className="text-white"/>
//                                         </span>
//                                     )}
//                                     <span className={`px-2 py-0.5 rounded-md text-xs font-semibold mb-1 ${p.color}`}>{p.label}</span>
//                                     <span className="text-xs text-gray-500 dark:text-gray-400">{p.desc}</span>
//                                 </button>
//                             ))}
//                         </div>
//                     </Field>
//                     <Field label="Statut de l'abonnement">
//                         <div className="flex flex-wrap gap-2">
//                             {STATUSES.map(s => (
//                                 <button
//                                     key={s.value}
//                                     type="button"
//                                     onClick={() => set('subscriptionStatus', s.value as any)}
//                                     className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${
//                                         form.subscriptionStatus === s.value
//                                             ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-600'
//                                             : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
//                                     }`}
//                                 >
//                                     <span className={`w-2 h-2 rounded-full ${s.dot}`}/>{s.label}
//                                 </button>
//                             ))}
//                         </div>
//                     </Field>
//                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//                         <Field label="Date de début">
//                             <div className="relative">
//                                 <Calendar size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
//                                 <input
//                                     type="date"
//                                     className={`${inputCls('subscriptionStartAt')} pl-9`}
//                                     value={form.subscriptionStartAt}
//                                     onChange={e => set('subscriptionStartAt', e.target.value)}
//                                 />
//                             </div>
//                         </Field>
//                         <Field label="Date d'expiration">
//                             <div className="relative">
//                                 <Calendar size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
//                                 <input
//                                     type="date"
//                                     className={`${inputCls('subscriptionExpiresAt')} pl-9`}
//                                     value={form.subscriptionExpiresAt}
//                                     onChange={e => set('subscriptionExpiresAt', e.target.value)}
//                                 />
//                             </div>
//                         </Field>
//                         <Field label="Montant payé (TND)" hint="Dinars Tunisiens — 3 décimales">
//                             <div className="relative">
//                                 <DollarSign size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
//                                 <input
//                                     type="number"
//                                     min={0}
//                                     step={0.001}
//                                     className={`${inputCls('amountPaid')} pl-9`}
//                                     value={form.amountPaid}
//                                     onChange={e => set('amountPaid', Number(e.target.value))}
//                                 />
//                             </div>
//                         </Field>
//                         <Field label="Limite OCR / mois">
//                             <input
//                                 type="number"
//                                 min={0}
//                                 className={inputCls('ocrLimitPerMonth')}
//                                 value={form.ocrLimitPerMonth}
//                                 onChange={e => set('ocrLimitPerMonth', Number(e.target.value))}
//                             />
//                         </Field>
//                     </div>
//                 </div>
//             );
//
//             // ── Step 4 : Administrateur ────────────────────────────────────────
//             case 4: return (
//                 <div className="space-y-4">
//                     <div className="p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl text-sm text-blue-700 dark:text-blue-300">
//                         Un compte <strong>admin_company</strong> sera créé automatiquement. Un email avec le mot de passe temporaire sera envoyé.
//                     </div>
//                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//                         <Field label="Nom complet *" error={errors.adminName}>
//                             <input
//                                 className={inputCls('adminName')}
//                                 placeholder="Ahmed Ben Ali"
//                                 value={form.adminName}
//                                 onChange={e => set('adminName', e.target.value)}
//                             />
//                         </Field>
//                         <Field label="Email *" error={errors.adminEmail}>
//                             <div className="relative">
//                                 <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
//                                 <input
//                                     className={`${inputCls('adminEmail')} pl-9`}
//                                     type="email"
//                                     placeholder="admin@entreprise.tn"
//                                     value={form.adminEmail}
//                                     onChange={e => set('adminEmail', e.target.value)}
//                                 />
//                             </div>
//                         </Field>
//                         <Field label="Téléphone admin (optionnel)" error={errors.adminPhone}>
//                             <div className="relative">
//                                 <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
//                                 <input
//                                     className={`${inputCls('adminPhone')} pl-9`}
//                                     placeholder="71234567"
//                                     maxLength={8}
//                                     value={form.adminPhone}
//                                     onChange={e => set('adminPhone', e.target.value.replace(/\D/g, ''))}
//                                 />
//                             </div>
//                         </Field>
//                     </div>
//                     <div className="p-4 bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl">
//                         <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Récapitulatif</p>
//                         <div className="space-y-2">
//                             {[
//                                 { label: 'Raison sociale',   value: form.name || '—' },
//                                 { label: 'Forme juridique',  value: form.formeJuridique || '—' },
//                                 { label: 'Gouvernorat',      value: form.gouvernorat || '—' },
//                                 { label: 'Matricule fiscal', value: form.matriculeFiscal || '—' },
//                                 { label: 'Régime fiscal',    value: FISCAL_REGIMES.find(r => r.value === form.fiscalRegime)?.label || '—' },
//                                 { label: 'Assujetti TVA',    value: form.assujettTVA ? 'Oui (19%)' : 'Non' },
//                                 { label: 'Plan',             value: PLANS.find(p => p.value === form.plan)?.label || '—' },
//                                 { label: 'Admin',            value: form.adminName || '—' },
//                                 { label: 'Email admin',      value: form.adminEmail || '—' },
//                             ].map(({ label, value }) => (
//                                 <div key={label} className="flex items-center justify-between text-sm">
//                                     <span className="text-gray-500 dark:text-gray-400">{label}</span>
//                                     <span className="font-medium text-gray-900 dark:text-white truncate max-w-[200px]">{value}</span>
//                                 </div>
//                             ))}
//                         </div>
//                     </div>
//                 </div>
//             );
//         }
//     };
//
//     return (
//         <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 sm:p-6 lg:p-8">
//             <div className="max-w-2xl mx-auto">
//
//                 {/* Header */}
//                 <div className="flex items-center gap-4 mb-6">
//                     <button
//                         onClick={() => navigate('/admin/companies')}
//                         className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
//                     >
//                         <ChevronLeft size={18} className="text-gray-600 dark:text-gray-400"/>
//                     </button>
//                     <div>
//                         <h1 className="text-xl font-bold text-gray-900 dark:text-white">Nouvelle entreprise</h1>
//                         <p className="text-sm text-gray-500 dark:text-gray-400">Créer un compte entreprise et son administrateur</p>
//                     </div>
//                 </div>
//
//                 {/* Stepper */}
//                 <div className="flex items-center mb-8">
//                     {STEPS.map((s, idx) => {
//                         const Icon = s.icon;
//                         const done   = step > s.id;
//                         const active = step === s.id;
//                         return (
//                             <React.Fragment key={s.id}>
//                                 <div className="flex flex-col items-center gap-1.5">
//                                     <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all ${
//                                         done   ? 'bg-blue-600 border-blue-600'
//                                             : active ? 'bg-white dark:bg-gray-900 border-blue-500'
//                                                 : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700'
//                                     }`}>
//                                         {done
//                                             ? <Check size={15} className="text-white"/>
//                                             : <Icon size={15} className={active ? 'text-blue-500' : 'text-gray-400'}/>
//                                         }
//                                     </div>
//                                     <span className={`text-[10px] font-medium hidden sm:block ${active ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`}>
//                                         {s.label}
//                                     </span>
//                                 </div>
//                                 {idx < STEPS.length - 1 && (
//                                     <div className={`flex-1 h-0.5 mx-2 mb-4 transition-colors ${step > s.id ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-700'}`}/>
//                                 )}
//                             </React.Fragment>
//                         );
//                     })}
//                 </div>
//
//                 {/* Card */}
//                 <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6">
//                     <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-5">
//                         {STEPS[step - 1].label}
//                     </h2>
//                     {renderStep()}
//                 </div>
//
//                 {/* Navigation */}
//                 <div className="flex items-center justify-between mt-4">
//                     <button
//                         onClick={prev}
//                         disabled={step === 1}
//                         className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
//                     >
//                         <ChevronLeft size={16}/> Précédent
//                     </button>
//                     {step < 4 ? (
//                         <button
//                             onClick={next}
//                             className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors"
//                         >
//                             Suivant <ChevronRight size={16}/>
//                         </button>
//                     ) : (
//                         <button
//                             onClick={handleSubmit}
//                             disabled={loading}
//                             className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-semibold transition-colors"
//                         >
//                             {loading
//                                 ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
//                                 : <Check size={16}/>
//                             }
//                             Créer l'entreprise
//                         </button>
//                     )}
//                 </div>
//
//             </div>
//         </div>
//     );
// };
//
// export default AddCompanyPage;

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Building2, Mail, Phone, MapPin, Globe, FileText,
    CreditCard, ChevronRight, ChevronLeft, Check, Upload,
    Briefcase, Hash, Calendar, DollarSign, AlertCircle, Info,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {adminCompaniesApi} from "../../api/adminCompaniesApi";

// ── Types ─────────────────────────────────────────────────────────────────────
interface CompanyForm {
    name: string; formeJuridique: string; matriculeFiscal: string; rne: string;
    email: string; phone: string; fax: string; address: string;
    city: string; codePostal: string; gouvernorat: string; country: string;
    fiscalRegime: string; assujettTVA: boolean; activityType: string; categorieEntreprise: string;
    primaryColor: string; logoUrl: string;
    plan: 'trial' | 'starter' | 'professional' | 'enterprise';
    subscriptionStatus: 'active' | 'trial' | 'suspended' | 'expired' | 'cancelled';
    subscriptionStartAt: string; subscriptionExpiresAt: string;
    amountPaid: number; ocrLimitPerMonth: number;
    adminName: string; adminEmail: string; adminPhone: string;
    notes: string;
}

const FORMES_JURIDIQUES = ['SARL', 'SA', 'SUARL', 'SNC', 'SCS', 'GIE', 'Association', 'Coopérative', 'Entreprise individuelle', 'Autre'];
const GOUVERNORATS = ['Ariana','Béja','Ben Arous','Bizerte','Gabès','Gafsa','Jendouba','Kairouan','Kasserine','Kébili','Kef','Mahdia','Manouba','Médenine','Monastir','Nabeul','Sfax','Sidi Bouzid','Siliana','Sousse','Tataouine','Tozeur','Tunis','Zaghouan'];
const FISCAL_REGIMES = [
    { value: 'reel',      label: 'Régime réel',             desc: 'Comptabilité complète obligatoire' },
    { value: 'forfait',   label: 'Régime forfaitaire',       desc: 'CA < 100 000 TND/an' },
    { value: 'simplifie', label: 'Régime simplifié',         desc: 'PME éligibles' },
    { value: 'exonere',   label: 'Exonéré (zones franches)', desc: 'Avantages fiscaux spéciaux' },
];
const ACTIVITY_TYPES = ['Commerce de détail','Commerce de gros','Services informatiques','Services financiers','Industrie manufacturière','Agro-alimentaire','BTP / Construction','Transport et logistique','Agriculture','Tourisme et hôtellerie','Santé','Éducation et formation','Artisanat','Exportation','Autre'];
const CATEGORIES = [
    { value: 'tpe', label: 'TPE', desc: '< 10 employés' },
    { value: 'pme', label: 'PME', desc: '10 – 200' },
    { value: 'ge',  label: 'GE',  desc: '> 200' },
];
const PLANS = [
    { value: 'trial',        label: 'Trial',        color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',            desc: 'Gratuit 14 jours' },
    { value: 'starter',      label: 'Starter',      color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',         desc: '49 TND / mois' },
    { value: 'professional', label: 'Professional', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400', desc: '99 TND / mois' },
    { value: 'enterprise',   label: 'Enterprise',   color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',     desc: 'Sur devis' },
];
const STATUSES = [
    { value: 'trial',     label: 'Trial',    dot: 'bg-gray-400' },
    { value: 'active',    label: 'Actif',    dot: 'bg-green-500' },
    { value: 'suspended', label: 'Suspendu', dot: 'bg-orange-500' },
    { value: 'expired',   label: 'Expiré',   dot: 'bg-red-500' },
    { value: 'cancelled', label: 'Annulé',   dot: 'bg-red-800' },
];
const STEPS = [
    { id: 1, label: 'Identification', icon: Building2 },
    { id: 2, label: 'Fiscal',         icon: FileText },
    { id: 3, label: 'Abonnement',     icon: CreditCard },
    { id: 4, label: 'Administrateur', icon: Briefcase },
];
const INITIAL: CompanyForm = {
    name: '', formeJuridique: '', matriculeFiscal: '', rne: '',
    email: '', phone: '', fax: '', address: '',
    city: '', codePostal: '', gouvernorat: '', country: 'Tunisie',
    fiscalRegime: '', assujettTVA: true, activityType: '', categorieEntreprise: '',
    primaryColor: '#2563EB', logoUrl: '',
    plan: 'trial', subscriptionStatus: 'trial',
    subscriptionStartAt: new Date().toISOString().slice(0, 10),
    subscriptionExpiresAt: '',
    amountPaid: 0, ocrLimitPerMonth: 400,
    adminName: '', adminEmail: '', adminPhone: '',
    notes: '',
};

// Validators
const validateMatricule = (v: string) => !v || /^\d{7}[A-Z]\/[PNMCB]\/[AN]\/\d{3}$/.test(v) ? '' : 'Format: 1234567A/P/A/000';
const validatePhone     = (v: string) => !v || /^[24579]\d{7}$/.test(v.replace(/\s/g, '')) ? '' : 'Numéro invalide (8 chiffres, débute par 2/4/5/7/9)';
const validateCP        = (v: string) => !v || /^\d{4}$/.test(v) ? '' : '4 chiffres requis';
const validateRne       = (v: string) => !v || /^[A-Z]\d{7}$/.test(v) ? '' : 'Format: J1234567';

// Field component — défini HORS du composant principal pour éviter le re-mount à chaque render
const Field = ({ label, error, hint, children }: { label: string; error?: string; hint?: string; children: React.ReactNode }) => (
    <div>
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">{label}</label>
        {children}
        {hint && !error && <p className="mt-1 text-[11px] text-gray-400 flex items-center gap-1"><Info size={10} />{hint}</p>}
        {error && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><AlertCircle size={11} />{error}</p>}
    </div>
);

// ── Component ─────────────────────────────────────────────────────────────────
const AddCompanyPage: React.FC = () => {
    const navigate = useNavigate();
    const [step, setStep]       = useState(1);
    const [form, setForm]       = useState<CompanyForm>(INITIAL);
    const [errors, setErrors]   = useState<Partial<Record<keyof CompanyForm, string>>>({});
    const [loading, setLoading] = useState(false);

    const set = (field: keyof CompanyForm, value: any) => {
        setForm(p => ({ ...p, [field]: value }));
        setErrors(p => ({ ...p, [field]: undefined }));
    };

    const inputCls = (field: keyof CompanyForm) =>
        `w-full px-4 py-2.5 rounded-xl border text-sm bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all ${
            errors[field]
                ? 'border-red-400 focus:ring-red-500/20'
                : 'border-gray-200 dark:border-gray-700 focus:ring-blue-500/20 focus:border-blue-500'
        }`;

    const validate = (s: number): boolean => {
        const e: Partial<Record<keyof CompanyForm, string>> = {};
        if (s === 1) {
            if (!form.name.trim())    e.name           = 'Raison sociale requise';
            if (!form.formeJuridique) e.formeJuridique = 'Forme juridique requise';
            if (!form.email.trim())   e.email          = 'Email requis';
            else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Email invalide';
            if (!form.phone.trim())   e.phone = 'Téléphone requis';
            else { const err = validatePhone(form.phone); if (err) e.phone = err; }
            if (form.fax) { const err = validatePhone(form.fax); if (err) e.fax = err; }
            if (!form.gouvernorat) e.gouvernorat = 'Gouvernorat requis';
            if (form.codePostal) { const err = validateCP(form.codePostal); if (err) e.codePostal = err; }
        }
        if (s === 2) {
            if (form.matriculeFiscal) { const err = validateMatricule(form.matriculeFiscal); if (err) e.matriculeFiscal = err; }
            if (form.rne)             { const err = validateRne(form.rne);             if (err) e.rne = err; }
            if (!form.fiscalRegime)   e.fiscalRegime = 'Régime fiscal requis';
            if (!form.activityType)   e.activityType = "Type d'activité requis";
        }
        if (s === 4) {
            if (!form.adminName.trim())  e.adminName  = "Nom de l'admin requis";
            if (!form.adminEmail.trim()) e.adminEmail = "Email requis";
            else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.adminEmail)) e.adminEmail = 'Email invalide';
            if (form.adminPhone) { const err = validatePhone(form.adminPhone); if (err) e.adminPhone = err; }
        }
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const next = () => { if (validate(step)) setStep(s => Math.min(s + 1, 4)); };
    const prev = () => setStep(s => Math.max(s - 1, 1));

    const handleSubmit = async () => {
        if (!validate(4)) return;
        setLoading(true);
        try {
            // Payload structuré exactement comme attendu par CreateCompanyWithAdminDto
            const payload = {
                company: {
                    name:                form.name,
                    formeJuridique:      form.formeJuridique,
                    email:               form.email,
                    phone:               form.phone,
                    gouvernorat:         form.gouvernorat,
                    fiscalRegime:        form.fiscalRegime,
                    activityType:        form.activityType,
                    ...(form.matriculeFiscal && { matriculeFiscal: form.matriculeFiscal.toUpperCase() }),
                    ...(form.rne          && { rne:          form.rne.toUpperCase() }),
                    ...(form.fax          && { fax:          form.fax }),
                    ...(form.address      && { address:      form.address }),
                    ...(form.city         && { city:         form.city }),
                    ...(form.codePostal   && { codePostal:   form.codePostal }),
                    country:             form.country,
                    assujettTVA:         form.assujettTVA,
                    ...(form.categorieEntreprise && { categorieEntreprise: form.categorieEntreprise }),
                    primaryColor:        form.primaryColor,
                    ...(form.logoUrl     && { logoUrl:       form.logoUrl }),
                    plan:                form.plan,
                    subscriptionStatus:  form.subscriptionStatus,
                    ...(form.subscriptionStartAt  && { subscriptionStartAt:  form.subscriptionStartAt }),
                    ...(form.subscriptionExpiresAt && { subscriptionExpiresAt: form.subscriptionExpiresAt }),
                    amountPaid:          form.amountPaid,
                    ocrLimitPerMonth:    form.ocrLimitPerMonth,
                    ...(form.notes       && { notes: form.notes }),
                },
                admin: {
                    name:  form.adminName,
                    email: form.adminEmail,
                    ...(form.adminPhone && { phone: form.adminPhone }),
                },
            };

            await adminCompaniesApi.create(payload); // ← POST /admin/companies

            toast.success(`Entreprise "${form.name}" créée avec succès !`);
            navigate('/admin/companies');
        } catch {
            // géré par l'intercepteur axios (toast d'erreur automatique)
        } finally {
            setLoading(false);
        }
    };

    const renderStep = () => {
        switch (step) {
            case 1: return (
                <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field label="Raison sociale *" error={errors.name}>
                            <div className="relative">
                                <Building2 size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                                <input className={`${inputCls('name')} pl-9`} placeholder="SARL Exemple" value={form.name} onChange={e => set('name', e.target.value)} />
                            </div>
                        </Field>
                        <Field label="Forme juridique *" error={errors.formeJuridique}>
                            <select className={inputCls('formeJuridique')} value={form.formeJuridique} onChange={e => set('formeJuridique', e.target.value)}>
                                <option value="">Sélectionner...</option>
                                {FORMES_JURIDIQUES.map(f => <option key={f} value={f}>{f}</option>)}
                            </select>
                        </Field>
                        <Field label="Email professionnel *" error={errors.email}>
                            <div className="relative">
                                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                                <input className={`${inputCls('email')} pl-9`} type="email" placeholder="contact@entreprise.tn" value={form.email} onChange={e => set('email', e.target.value)} />
                            </div>
                        </Field>
                        <Field label="Téléphone * (8 chiffres)" error={errors.phone} hint="Ex: 71234567">
                            <div className="relative">
                                <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                                <input className={`${inputCls('phone')} pl-9`} placeholder="71234567" maxLength={8} value={form.phone} onChange={e => set('phone', e.target.value.replace(/\D/g, ''))} />
                            </div>
                        </Field>
                        <Field label="Fax (optionnel)" error={errors.fax}>
                            <div className="relative">
                                <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                                <input className={`${inputCls('fax')} pl-9`} placeholder="71234567" maxLength={8} value={form.fax} onChange={e => set('fax', e.target.value.replace(/\D/g, ''))} />
                            </div>
                        </Field>
                        <Field label="Gouvernorat *" error={errors.gouvernorat}>
                            <div className="relative">
                                <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                                <select className={`${inputCls('gouvernorat')} pl-9`} value={form.gouvernorat} onChange={e => set('gouvernorat', e.target.value)}>
                                    <option value="">Sélectionner...</option>
                                    {GOUVERNORATS.map(g => <option key={g} value={g}>{g}</option>)}
                                </select>
                            </div>
                        </Field>
                    </div>
                    <Field label="Adresse">
                        <input className={inputCls('address')} placeholder="12 rue de la République" value={form.address} onChange={e => set('address', e.target.value)} />
                    </Field>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        <Field label="Ville">
                            <input className={inputCls('city')} placeholder="Tunis" value={form.city} onChange={e => set('city', e.target.value)} />
                        </Field>
                        <Field label="Code postal" error={errors.codePostal} hint="4 chiffres">
                            <input className={inputCls('codePostal')} placeholder="1000" maxLength={4} value={form.codePostal} onChange={e => set('codePostal', e.target.value.replace(/\D/g, ''))} />
                        </Field>
                        <Field label="Pays">
                            <div className="relative">
                                <Globe size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                                <input className={`${inputCls('country')} pl-9`} value={form.country} onChange={e => set('country', e.target.value)} />
                            </div>
                        </Field>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <Field label="Couleur principale">
                            <div className="flex items-center gap-3">
                                <input type="color" value={form.primaryColor} onChange={e => set('primaryColor', e.target.value)} className="w-10 h-10 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer p-0.5 bg-transparent flex-shrink-0" />
                                <input className={inputCls('primaryColor')} value={form.primaryColor} onChange={e => set('primaryColor', e.target.value)} placeholder="#2563EB" />
                            </div>
                        </Field>
                        <Field label="URL du logo">
                            <div className="relative">
                                <Upload size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                                <input className={`${inputCls('logoUrl')} pl-9`} placeholder="https://..." value={form.logoUrl} onChange={e => set('logoUrl', e.target.value)} />
                            </div>
                        </Field>
                    </div>
                </div>
            );

            case 2: return (
                <div className="space-y-4">
                    <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 rounded-xl flex items-start gap-2.5">
                        <Info size={15} className="text-blue-500 flex-shrink-0 mt-0.5"/>
                        <p className="text-xs text-blue-700 dark:text-blue-300">
                            Conformément au <strong>Code de la TVA</strong> et au <strong>Code de l'IRPP et IS</strong>. Le matricule fiscal est délivré par la <strong>DGI</strong>.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field label="Matricule fiscal" error={errors.matriculeFiscal} hint="7 chiffres + lettre + /P|N|M|C|B + /A|N + /000-999">
                            <div className="relative">
                                <Hash size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                                <input className={`${inputCls('matriculeFiscal')} pl-9 uppercase`} placeholder="1234567A/P/A/000" value={form.matriculeFiscal} onChange={e => set('matriculeFiscal', e.target.value.toUpperCase())} />
                            </div>
                        </Field>
                        <Field label="N° RNE" error={errors.rne} hint="Lettre + 7 chiffres — ex: J1234567">
                            <div className="relative">
                                <FileText size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                                <input className={`${inputCls('rne')} pl-9 uppercase`} placeholder="J1234567" value={form.rne} onChange={e => set('rne', e.target.value.toUpperCase())} />
                            </div>
                        </Field>
                        <Field label="Régime fiscal *" error={errors.fiscalRegime}>
                            <select className={inputCls('fiscalRegime')} value={form.fiscalRegime} onChange={e => set('fiscalRegime', e.target.value)}>
                                <option value="">Sélectionner...</option>
                                {FISCAL_REGIMES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                            </select>
                            {form.fiscalRegime && <p className="mt-1 text-[11px] text-gray-400">{FISCAL_REGIMES.find(r => r.value === form.fiscalRegime)?.desc}</p>}
                        </Field>
                        <Field label="Type d'activité *" error={errors.activityType}>
                            <select className={inputCls('activityType')} value={form.activityType} onChange={e => set('activityType', e.target.value)}>
                                <option value="">Sélectionner...</option>
                                {ACTIVITY_TYPES.map(a => <option key={a} value={a}>{a}</option>)}
                            </select>
                        </Field>
                        <Field label="Catégorie d'entreprise">
                            <div className="flex gap-2">
                                {CATEGORIES.map(c => (
                                    <button key={c.value} type="button" onClick={() => set('categorieEntreprise', c.value)}
                                            className={`flex-1 py-2.5 rounded-xl border text-xs font-medium transition-all ${form.categorieEntreprise === c.value ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-600' : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400'}`}>
                                        <span className="block font-bold">{c.label}</span>
                                        <span className="text-[10px] opacity-70">{c.desc}</span>
                                    </button>
                                ))}
                            </div>
                        </Field>
                        <Field label="Assujetti à la TVA" hint="Taux standard : 19%">
                            <button type="button" onClick={() => set('assujettTVA', !form.assujettTVA)}
                                    className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-xl border transition-all ${form.assujettTVA ? 'border-green-500 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400' : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400'}`}>
                                <div className={`w-9 h-5 rounded-full transition-colors relative flex-shrink-0 ${form.assujettTVA ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.assujettTVA ? 'translate-x-4' : 'translate-x-0.5'}`}/>
                                </div>
                                <span className="text-sm font-medium">{form.assujettTVA ? 'Oui — assujetti TVA' : 'Non — non assujetti'}</span>
                            </button>
                        </Field>
                    </div>
                    <Field label="Notes internes">
                        <textarea className={`${inputCls('notes')} resize-none`} rows={3} placeholder="Notes visibles uniquement par les administrateurs système..." value={form.notes} onChange={e => set('notes', e.target.value)} />
                    </Field>
                </div>
            );

            case 3: return (
                <div className="space-y-5">
                    <Field label="Plan d'abonnement">
                        <div className="grid grid-cols-2 gap-3 mt-1">
                            {PLANS.map(p => (
                                <button key={p.value} type="button" onClick={() => set('plan', p.value as any)}
                                        className={`relative flex flex-col items-start p-4 rounded-xl border-2 text-left transition-all ${form.plan === p.value ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'}`}>
                                    {form.plan === p.value && <span className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center"><Check size={11} className="text-white"/></span>}
                                    <span className={`px-2 py-0.5 rounded-md text-xs font-semibold mb-1 ${p.color}`}>{p.label}</span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">{p.desc}</span>
                                </button>
                            ))}
                        </div>
                    </Field>
                    <Field label="Statut de l'abonnement">
                        <div className="flex flex-wrap gap-2">
                            {STATUSES.map(s => (
                                <button key={s.value} type="button" onClick={() => set('subscriptionStatus', s.value as any)}
                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${form.subscriptionStatus === s.value ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-600' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'}`}>
                                    <span className={`w-2 h-2 rounded-full ${s.dot}`}/>{s.label}
                                </button>
                            ))}
                        </div>
                    </Field>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field label="Date de début">
                            <div className="relative"><Calendar size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                                <input type="date" className={`${inputCls('subscriptionStartAt')} pl-9`} value={form.subscriptionStartAt} onChange={e => set('subscriptionStartAt', e.target.value)} />
                            </div>
                        </Field>
                        <Field label="Date d'expiration">
                            <div className="relative"><Calendar size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                                <input type="date" className={`${inputCls('subscriptionExpiresAt')} pl-9`} value={form.subscriptionExpiresAt} onChange={e => set('subscriptionExpiresAt', e.target.value)} />
                            </div>
                        </Field>
                        <Field label="Montant payé (TND)" hint="Dinars Tunisiens">
                            <div className="relative"><DollarSign size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                                <input type="number" min={0} step={0.001} className={`${inputCls('amountPaid')} pl-9`} value={form.amountPaid} onChange={e => set('amountPaid', Number(e.target.value))} />
                            </div>
                        </Field>
                        <Field label="Limite OCR / mois">
                            <input type="number" min={0} className={inputCls('ocrLimitPerMonth')} value={form.ocrLimitPerMonth} onChange={e => set('ocrLimitPerMonth', Number(e.target.value))} />
                        </Field>
                    </div>
                </div>
            );

            case 4: return (
                <div className="space-y-4">
                    <div className="p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl text-sm text-blue-700 dark:text-blue-300">
                        Un compte <strong>admin_company</strong> sera créé automatiquement. Un email avec le mot de passe temporaire sera envoyé.
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field label="Nom complet *" error={errors.adminName}>
                            <input className={inputCls('adminName')} placeholder="Ahmed Ben Ali" value={form.adminName} onChange={e => set('adminName', e.target.value)} />
                        </Field>
                        <Field label="Email *" error={errors.adminEmail}>
                            <div className="relative"><Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                                <input className={`${inputCls('adminEmail')} pl-9`} type="email" placeholder="admin@entreprise.tn" value={form.adminEmail} onChange={e => set('adminEmail', e.target.value)} />
                            </div>
                        </Field>
                        <Field label="Téléphone admin (optionnel)" error={errors.adminPhone}>
                            <div className="relative"><Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                                <input className={`${inputCls('adminPhone')} pl-9`} placeholder="71234567" maxLength={8} value={form.adminPhone} onChange={e => set('adminPhone', e.target.value.replace(/\D/g, ''))} />
                            </div>
                        </Field>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Récapitulatif</p>
                        <div className="space-y-2">
                            {[
                                { label: 'Raison sociale',   value: form.name || '—' },
                                { label: 'Forme juridique',  value: form.formeJuridique || '—' },
                                { label: 'Gouvernorat',      value: form.gouvernorat || '—' },
                                { label: 'Matricule fiscal', value: form.matriculeFiscal || '—' },
                                { label: 'Régime fiscal',    value: FISCAL_REGIMES.find(r => r.value === form.fiscalRegime)?.label || '—' },
                                { label: 'Assujetti TVA',    value: form.assujettTVA ? 'Oui (19%)' : 'Non' },
                                { label: 'Plan',             value: PLANS.find(p => p.value === form.plan)?.label || '—' },
                                { label: 'Admin',            value: form.adminName || '—' },
                                { label: 'Email admin',      value: form.adminEmail || '—' },
                            ].map(({ label, value }) => (
                                <div key={label} className="flex items-center justify-between text-sm">
                                    <span className="text-gray-500 dark:text-gray-400">{label}</span>
                                    <span className="font-medium text-gray-900 dark:text-white truncate max-w-[200px]">{value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            );
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 sm:p-6 lg:p-8">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                    <button onClick={() => navigate('/admin/companies')} className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                        <ChevronLeft size={18} className="text-gray-600 dark:text-gray-400"/>
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Nouvelle entreprise</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Créer un compte entreprise et son administrateur</p>
                    </div>
                </div>

                {/* Stepper */}
                <div className="flex items-center mb-8">
                    {STEPS.map((s, idx) => {
                        const Icon = s.icon;
                        const done = step > s.id; const active = step === s.id;
                        return (
                            <React.Fragment key={s.id}>
                                <div className="flex flex-col items-center gap-1.5">
                                    <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all ${done ? 'bg-blue-600 border-blue-600' : active ? 'bg-white dark:bg-gray-900 border-blue-500' : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700'}`}>
                                        {done ? <Check size={15} className="text-white"/> : <Icon size={15} className={active ? 'text-blue-500' : 'text-gray-400'}/>}
                                    </div>
                                    <span className={`text-[10px] font-medium hidden sm:block ${active ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`}>{s.label}</span>
                                </div>
                                {idx < STEPS.length - 1 && <div className={`flex-1 h-0.5 mx-2 mb-4 transition-colors ${step > s.id ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-700'}`}/>}
                            </React.Fragment>
                        );
                    })}
                </div>

                {/* Card */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6">
                    <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-5">{STEPS[step - 1].label}</h2>
                    {renderStep()}
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between mt-4">
                    <button onClick={prev} disabled={step === 1} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                        <ChevronLeft size={16}/> Précédent
                    </button>
                    {step < 4 ? (
                        <button onClick={next} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors">
                            Suivant <ChevronRight size={16}/>
                        </button>
                    ) : (
                        <button onClick={handleSubmit} disabled={loading} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-semibold transition-colors">
                            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <Check size={16}/>}
                            Créer l'entreprise
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AddCompanyPage;