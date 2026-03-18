import api from './client';

/* ── Admin — Companies ───────────────────────────────────────────────────────
   Tous les appels passent par /admin/companies, PAS par /users
   ─────────────────────────────────────────────────────────────────────────── */
export const adminCompaniesApi = {
    /** Lister toutes les companies (avec filtres optionnels) */
    getAll: (params?: { search?: string; status?: string; plan?: string; page?: number; limit?: number }) =>
        api.get('/admin/companies', { params }).then(r => r.data),

    /** Détail d'une company + ses utilisateurs */
    getOne: (id: string) =>
        api.get(`/admin/companies/${id}`).then(r => r.data),

    /** Créer une company + son admin (payload: { company: {...}, admin: {...} }) */
    create: (dto: { company: Record<string, any>; admin: Record<string, any> }) =>
        api.post('/admin/companies', dto).then(r => r.data),

    /** Modifier les infos d'une company */
    update: (id: string, data: Record<string, any>) =>
        api.patch(`/admin/companies/${id}`, data).then(r => r.data),

    /** Supprimer une company (désactive ses users) */
    remove: (id: string) =>
        api.delete(`/admin/companies/${id}`).then(r => r.data),

    /** Suspendre */
    suspend: (id: string, reason: string) =>
        api.post(`/admin/companies/${id}/suspend`, { reason }).then(r => r.data),

    /** Réactiver */
    reactivate: (id: string) =>
        api.post(`/admin/companies/${id}/reactivate`).then(r => r.data),

    /** Mettre à jour l'abonnement */
    updateSubscription: (
        id: string,
        data: { plan: string; status: string; expiresAt: string; amountPaid?: number; notes?: string },
    ) => api.post(`/admin/companies/${id}/subscription`, data).then(r => r.data),

    /** Réinitialiser le quota OCR */
    resetOcr: (id: string) =>
        api.post(`/admin/companies/${id}/ocr/reset`).then(r => r.data),

    /** Modifier la limite OCR mensuelle */
    updateOcrLimit: (id: string, limit: number) =>
        api.patch(`/admin/companies/${id}/ocr/limit`, { limit }).then(r => r.data),
};

/* ── Admin — Users ───────────────────────────────────────────────────────────*/
export const adminUsersApi = {
    /** Tous les utilisateurs de toutes les companies */
    getAll: (params?: { companyId?: string; search?: string }) =>
        api.get('/admin/users', { params }).then(r => r.data),

    /** Activer / Désactiver un utilisateur */
    toggle: (id: string) =>
        api.patch(`/admin/users/${id}/toggle`).then(r => r.data),

    /** Réinitialiser le mot de passe (envoi email) */
    resetPassword: (id: string) =>
        api.post(`/admin/users/${id}/reset-password`).then(r => r.data),
};

/* ── Admin — Dashboard ───────────────────────────────────────────────────────*/
export const adminDashboardApi = {
    get: () => api.get('/admin/dashboard').then(r => r.data),
};