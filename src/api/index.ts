import api from './client';

/* ── Helper CRUD générique ──────────────────────────────────────────────────── */
const createCrudApi = (resource: string) => ({
  getAll:  (params?: any)          => api.get(`/${resource}`, { params }).then(r => r.data),
  getOne:  (id: string)            => api.get(`/${resource}/${id}`).then(r => r.data),
  create:  (data: any)             => api.post(`/${resource}`, data).then(r => r.data),
  update:  (id: string, data: any) => api.patch(`/${resource}/${id}`, data).then(r => r.data),
  remove:  (id: string)            => api.delete(`/${resource}/${id}`).then(r => r.data),
});

/* ── Clients ─────────────────────────────────────────────────────────────────*/
export const clientsApi = {
  ...createCrudApi('clients'),
  getOne:       (id: string)                                          => api.get(`/clients/${id}`).then(r => r.data),
  getStats:     (id: string)                                          => api.get(`/clients/${id}/stats`).then(r => r.data),
  addPayment:   (clientId: string, data: { amount: number; note?: string }) =>
      api.post(`/clients/payment/${clientId}`, data).then(r => r.data),
  getPurchases: (id: string, params?: any)                            => api.get(`/clients/${id}/purchases`, { params }).then(r => r.data),
  exportBilan:  (id: string, params?: any)                            => api.get(`/clients/${id}/export`, { params, responseType: 'blob' }).then(r => r.data),
};

/* ── Paiements ventes (PaymentVente) ─────────────────────────────────────────*/
export const paymentVenteApi = {
  getAll: () =>
      api.get('/payment-vente').then(r => r.data),
  update: (id: string, data: { amount?: number; note?: string }) =>
      api.patch(`/payment-vente/${id}`, data).then(r => r.data),
  remove: (id: string) =>
      api.delete(`/payment-vente/${id}`).then(r => r.data),
};

/* ── Paiements achats (PaymentAchat) ─────────────────────────────────────────*/
export const paymentAchatApi = {
  getAll: () =>
      api.get('/payment-achat').then(r => r.data),
  update: (id: string, data: { amount?: number; note?: string }) =>
      api.patch(`/payment-achat/${id}`, data).then(r => r.data),
  remove: (id: string) =>
      api.delete(`/payment-achat/${id}`).then(r => r.data),
};

/* ── Fournisseurs ────────────────────────────────────────────────────────────*/
export const suppliersApi = {
  ...createCrudApi('fournisseurs'),
  getProducts:      (id: string)                                          => api.get(`/fournisseurs/${id}/products`).then(r => r.data),
  addProduct:       (id: string, productId: string)                       => api.post(`/fournisseurs/${id}/products`, { productId }).then(r => r.data),
  getPurchases:     (fournisseurId: string, userId: string, params?: any) =>
      api.get(`/fournisseurs/userId/${userId}/fournisseurId/${fournisseurId}/purchases`, { params }).then(r => r.data),
  addDirectPayment: (id: string, data: { amount: number; note: string })  =>
      api.post(`/fournisseurs/${id}/payment`, data).then(r => r.data),
  exportBilan:      (id: string, params?: any)                            => api.get(`/fournisseurs/${id}/export`, { params, responseType: 'blob' }).then(r => r.data),
};

/* ── Produits ────────────────────────────────────────────────────────────────*/
export const productsApi = {
  ...createCrudApi('products'),
  getLowStock:   ()                   => api.get('/products/low-stock').then(r => r.data),
  getBySupplier: (supplierId: string) => api.get(`/products/by-supplier/${supplierId}`).then(r => r.data),
};

/* ── Ventes ──────────────────────────────────────────────────────────────────*/
export const VentesApi = {
  ...createCrudApi('ventes'),
  addPayment:    (id: string, data: any)         => api.post(`/ventes/${id}/payments`, data).then(r => r.data),
  removePayment: (id: string, paymentId: string) => api.delete(`/ventes/${id}/payments/${paymentId}`).then(r => r.data),
  getInvoice:    (id: string)                    => api.get(`/ventes/${id}/invoice`, { responseType: 'blob' }).then(r => r.data),
};

/* ── Achats ──────────────────────────────────────────────────────────────────*/
export const purchasesApi = {
  ...createCrudApi('purchases'),
  addPayment:    (id: string, data: { amount: number; note: string }) =>
      api.post(`/purchases/${id}/payment`, data).then(r => r.data),
  getInvoice:    (id: string)                    => api.get(`/purchases/${id}/export/pdf`, { responseType: 'blob' }).then(r => r.data),
  removePayment:    (purchaseId :string, paymentId: string)                    => api.get(`/purchases/${purchaseId}/export/pdf`, { responseType: 'blob' }).then(r => r.data),

};

/* ── Stock ───────────────────────────────────────────────────────────────────*/
export const stockApi = {
  getMovements:    (params?: any)                          => api.get('/stock', { params }).then(r => r.data),
  getAlerts:       ()                                      => api.get('/stock/alerts').then(r => r.data),
  adjust:          (data: any)                             => api.post('/stock/adjust', data).then(r => r.data),
  updateThreshold: (productId: string, threshold: number)  => api.patch(`/stock/threshold/${productId}`, { threshold }).then(r => r.data),
};

/* ── Devis ───────────────────────────────────────────────────────────────────*/
export const quotesApi = {
  ...createCrudApi('quotes'),
  getInvoice: (id: string) =>
      api.get(`/quotes/${id}/export/pdf`, { responseType: 'blob' }).then(r => r.data),
};

/* ── Charges ─────────────────────────────────────────────────────────────────*/
export const chargesApi = {
  ...createCrudApi('charges'),
  analyzeWithAI: (id: string) => api.post(`/charges/${id}/analyze`).then(r => r.data),
};

/* ── Employés ────────────────────────────────────────────────────────────────*/
export const employeesApi = {
  ...createCrudApi('employees'),
};

/* ── Dashboard ───────────────────────────────────────────────────────────────*/
export const dashboardApi = {
  get: () => api.get('/dashboard').then(r => r.data),
};

/* ── Comptabilité ────────────────────────────────────────────────────────────*/
export const accountingApi = {
  getSummary:    (params?: any) => api.get('/accounting/summary', { params }).then(r => r.data),
  getVatSummary: (params?: any) => api.get('/accounting/vat', { params }).then(r => r.data),
};

/* ── Rapports ────────────────────────────────────────────────────────────────*/
export const reportsApi = {
  getSales:     (params?: any)               => api.get('/reports/sales',     { params }).then(r => r.data),
  getPurchases: (params?: any)               => api.get('/reports/purchases', { params }).then(r => r.data),
  getCharges:   (params?: any)               => api.get('/reports/charges',   { params }).then(r => r.data),
  getStock:     ()                           => api.get('/reports/stock').then(r => r.data),
  export:       (type: string, params?: any) => api.get(`/reports/export/${type}`, { params, responseType: 'blob' }).then(r => r.data),
};

/* ── Notifications ───────────────────────────────────────────────────────────*/
export const notificationsApi = {
  getAll:         ()           => api.get('/notifications').then(r => r.data),
  getUnreadCount: ()           => api.get('/notifications/unread-count').then(r => r.data),
  markRead:       (id: string) => api.patch(`/notifications/${id}/read`).then(r => r.data),
  markAllRead:    ()           => api.patch('/notifications/read-all').then(r => r.data),
};

/* ── Users ───────────────────────────────────────────────────────────────────*/
export const usersApi = {
  ...createCrudApi('users'),
  getAll:  (params?: any)          => api.get('/users', { params }).then(r => r.data),
  getOne:  (id: string)            => api.get(`/users/${id}`).then(r => r.data),
  create:  (data: any)             => api.post('/users', data).then(r => r.data),
  update:  (id: string, data: any) => api.patch(`/users/${id}`, data).then(r => r.data),
  remove:  (id: string)            => api.delete(`/users/${id}`).then(r => r.data),

  addPayment: (userId: string, data: any) =>
      api.post(`/users/${userId}/subscription-payment`, data).then(r => r.data),

  getMe:            ()                    => api.get('/users/me').then(r => r.data),
  updateMe:         (data: any)           => api.patch('/users/me', data).then(r => r.data),
  changeMyPassword: (newPassword: string) => api.patch('/users/me/password', { newPassword }).then(r => r.data),
  decrementOcr:     (id: string)          => api.patch(`/users/${id}/ocr-decrement`).then(r => r.data),

  getSubscriptions:       ()                          => api.get('/users/subscriptions').then(r => r.data),
  addSubscriptionPayment: (userId: string, data: any) => api.post(`/users/${userId}/subscription-payment`, data).then(r => r.data),

  seedAdmin: (email: string, password: string) =>
      api.post('/users/seed-admin', { email, password }).then(r => r.data),
};

/* ── Profile ─────────────────────────────────────────────────────────────────*/
export const profileApi = {
  get:    ()           => usersApi.getMe(),
  update: (data: any)  => usersApi.updateMe(data),
};