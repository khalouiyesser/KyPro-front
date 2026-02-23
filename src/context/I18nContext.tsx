import React, { createContext, useContext, useState, useEffect } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────
export type Lang = 'fr' | 'ar' | 'en';

interface I18nContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
  dir: 'ltr' | 'rtl';
}

// ─── Traductions ──────────────────────────────────────────────────────────────
const translations: Record<Lang, Record<string, string>> = {
  fr: {
    // Navigation
    'nav.dashboard': 'Tableau de bord',
    'nav.clients': 'Clients',
    'nav.suppliers': 'Fournisseurs',
    'nav.products': 'Produits',
    'nav.sales': 'Ventes',
    'nav.purchases': 'Achats',
    'nav.stock': 'Stock',
    'nav.quotes': 'Devis',
    'nav.charges': 'Charges',
    'nav.employees': 'Employés',
    'nav.accounting': 'Comptabilité',
    'nav.reports': 'Rapports',
    'nav.settings': 'Paramètres',
    'nav.notifications': 'Notifications',
    'nav.logout': 'Déconnexion',

    // Common
    'common.save': 'Enregistrer',
    'common.cancel': 'Annuler',
    'common.delete': 'Supprimer',
    'common.edit': 'Modifier',
    'common.create': 'Créer',
    'common.search': 'Rechercher...',
    'common.loading': 'Chargement...',
    'common.noData': 'Aucune donnée',
    'common.actions': 'Actions',
    'common.confirm': 'Confirmer',
    'common.back': 'Retour',
    'common.export': 'Exporter',
    'common.download': 'Télécharger',
    'common.total': 'Total',
    'common.status': 'Statut',
    'common.date': 'Date',
    'common.name': 'Nom',
    'common.phone': 'Téléphone',
    'common.email': 'Email',
    'common.notes': 'Notes',
    'common.required': 'Requis',
    'common.optional': 'Optionnel',
    'common.active': 'Actif',
    'common.inactive': 'Inactif',
    'common.yes': 'Oui',
    'common.no': 'Non',
    'common.filter': 'Filtrer',
    'common.reset': 'Réinitialiser',
    'common.period': 'Période',

    // Dashboard
    'dashboard.title': 'Tableau de bord',
    'dashboard.totalRevenue': 'CA Total',
    'dashboard.monthRevenue': 'CA Ce mois',
    'dashboard.totalPurchases': 'Achats Total',
    'dashboard.monthPurchases': 'Achats Ce mois',
    'dashboard.totalClients': 'Clients',
    'dashboard.activeClients': 'Clients Actifs',
    'dashboard.totalProducts': 'Produits',
    'dashboard.lowStock': 'Stocks Faibles',
    'dashboard.topClients': 'Top Clients',
    'dashboard.recentSales': 'Ventes Récentes',
    'dashboard.revenue': 'Chiffre d\'affaires',
    'dashboard.collected': 'Encaissé',
    'dashboard.outstanding': 'En attente',
    'dashboard.netProfit': 'Bénéfice net',

    // Clients
    'clients.title': 'Clients',
    'clients.new': 'Nouveau client',
    'clients.edit': 'Modifier le client',
    'clients.firstName': 'Prénom',
    'clients.sector': 'Secteur',
    'clients.creditLimit': 'Crédit max (TND)',
    'clients.creditUsed': 'Crédit utilisé',
    'clients.creditAvailable': 'Crédit disponible',
    'clients.stats': 'Statistiques',
    'clients.bilan': 'Bilan client',
    'clients.noSales': 'Aucun achat enregistré',

    // Products
    'products.title': 'Produits',
    'products.new': 'Nouveau produit',
    'products.unit': 'Unité',
    'products.purchasePrice': 'Prix d\'achat (TND)',
    'products.salePrice': 'Prix de vente (TND)',
    'products.stock': 'Stock',
    'products.threshold': 'Seuil d\'alerte',
    'products.lowStock': 'Stock faible',
    'products.outOfStock': 'Rupture de stock',
    'products.tva': 'TVA (%)',
    'products.supplier': 'Fournisseur',

    // Sales
    'sales.title': 'Ventes',
    'sales.new': 'Nouvelle vente',
    'sales.client': 'Client',
    'sales.items': 'Articles',
    'sales.unitPrice': 'Prix unitaire',
    'sales.quantity': 'Quantité',
    'sales.totalHT': 'Total HT',
    'sales.totalTTC': 'Total TTC',
    'sales.paid': 'Payé',
    'sales.remaining': 'Reste',
    'sales.initialPayment': 'Paiement initial',
    'sales.paymentMethod': 'Mode de paiement',
    'sales.addPayment': 'Ajouter un paiement',
    'sales.invoice': 'Facture',
    'sales.status.paid': 'Payé',
    'sales.status.partial': 'Partiel',
    'sales.status.pending': 'En attente',
    'sales.addProduct': '+ Ajouter ligne',
    'sales.newClient': 'Nouveau client',

    // Payments
    'payment.cash': 'Espèces',
    'payment.virement': 'Virement',
    'payment.cheque': 'Chèque',
    'payment.online': 'En ligne',

    // Stock
    'stock.title': 'Stock',
    'stock.movements': 'Mouvements',
    'stock.alerts': 'Alertes',
    'stock.adjust': 'Ajuster le stock',
    'stock.in': 'Entrée',
    'stock.out': 'Sortie',
    'stock.adjustment': 'Ajustement',

    // Notifications
    'notifications.title': 'Notifications',
    'notifications.markAll': 'Tout marquer comme lu',
    'notifications.noNotif': 'Aucune notification',
    'notifications.lowStock': 'Stock faible',
    'notifications.rupture': 'Rupture de stock',

    // Reports
    'reports.title': 'Rapports',
    'reports.sales': 'Rapport Ventes',
    'reports.purchases': 'Rapport Achats',
    'reports.stock': 'Rapport Stock',
    'reports.charges': 'Rapport Charges',
    'reports.exportPdf': 'Exporter PDF',
    'reports.exportExcel': 'Exporter Excel',

    // Auth
    'auth.login': 'Connexion',
    'auth.logout': 'Déconnexion',
    'auth.email': 'Email',
    'auth.password': 'Mot de passe',
    'auth.loginBtn': 'Se connecter',

    // Errors
    'error.stockInsuffisant': 'Stock insuffisant',
    'error.required': 'Ce champ est requis',
    'error.generic': 'Une erreur est survenue',
  },

  en: {
    'nav.dashboard': 'Dashboard',
    'nav.clients': 'Clients',
    'nav.suppliers': 'Suppliers',
    'nav.products': 'Products',
    'nav.sales': 'Sales',
    'nav.purchases': 'Purchases',
    'nav.stock': 'Stock',
    'nav.quotes': 'Quotes',
    'nav.charges': 'Expenses',
    'nav.employees': 'Employees',
    'nav.accounting': 'Accounting',
    'nav.reports': 'Reports',
    'nav.settings': 'Settings',
    'nav.notifications': 'Notifications',
    'nav.logout': 'Logout',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.create': 'Create',
    'common.search': 'Search...',
    'common.loading': 'Loading...',
    'common.noData': 'No data',
    'common.actions': 'Actions',
    'common.confirm': 'Confirm',
    'common.back': 'Back',
    'common.export': 'Export',
    'common.download': 'Download',
    'common.total': 'Total',
    'common.status': 'Status',
    'common.date': 'Date',
    'common.name': 'Name',
    'common.phone': 'Phone',
    'common.email': 'Email',
    'common.notes': 'Notes',
    'common.required': 'Required',
    'common.optional': 'Optional',
    'common.active': 'Active',
    'common.inactive': 'Inactive',
    'common.yes': 'Yes',
    'common.no': 'No',
    'common.filter': 'Filter',
    'common.reset': 'Reset',
    'common.period': 'Period',
    'dashboard.title': 'Dashboard',
    'dashboard.totalRevenue': 'Total Revenue',
    'dashboard.monthRevenue': 'This Month Revenue',
    'dashboard.totalPurchases': 'Total Purchases',
    'dashboard.monthPurchases': 'This Month Purchases',
    'dashboard.totalClients': 'Clients',
    'dashboard.activeClients': 'Active Clients',
    'dashboard.totalProducts': 'Products',
    'dashboard.lowStock': 'Low Stock',
    'dashboard.topClients': 'Top Clients',
    'dashboard.recentSales': 'Recent Sales',
    'dashboard.revenue': 'Revenue',
    'dashboard.collected': 'Collected',
    'dashboard.outstanding': 'Outstanding',
    'dashboard.netProfit': 'Net Profit',
    'clients.title': 'Clients',
    'clients.new': 'New Client',
    'clients.edit': 'Edit Client',
    'clients.firstName': 'First Name',
    'clients.sector': 'Sector',
    'clients.creditLimit': 'Credit Limit (TND)',
    'clients.creditUsed': 'Credit Used',
    'clients.creditAvailable': 'Credit Available',
    'clients.stats': 'Statistics',
    'clients.bilan': 'Client Report',
    'clients.noSales': 'No sales recorded',
    'products.title': 'Products',
    'products.new': 'New Product',
    'products.unit': 'Unit',
    'products.purchasePrice': 'Purchase Price (TND)',
    'products.salePrice': 'Sale Price (TND)',
    'products.stock': 'Stock',
    'products.threshold': 'Alert Threshold',
    'products.lowStock': 'Low Stock',
    'products.outOfStock': 'Out of Stock',
    'products.tva': 'VAT (%)',
    'products.supplier': 'Supplier',
    'sales.title': 'Sales',
    'sales.new': 'New Sale',
    'sales.client': 'Client',
    'sales.items': 'Items',
    'sales.unitPrice': 'Unit Price',
    'sales.quantity': 'Quantity',
    'sales.totalHT': 'Total (excl. VAT)',
    'sales.totalTTC': 'Total (incl. VAT)',
    'sales.paid': 'Paid',
    'sales.remaining': 'Remaining',
    'sales.initialPayment': 'Initial Payment',
    'sales.paymentMethod': 'Payment Method',
    'sales.addPayment': 'Add Payment',
    'sales.invoice': 'Invoice',
    'sales.status.paid': 'Paid',
    'sales.status.partial': 'Partial',
    'sales.status.pending': 'Pending',
    'sales.addProduct': '+ Add line',
    'sales.newClient': 'New client',
    'payment.cash': 'Cash',
    'payment.virement': 'Wire Transfer',
    'payment.cheque': 'Cheque',
    'payment.online': 'Online',
    'stock.title': 'Stock',
    'stock.movements': 'Movements',
    'stock.alerts': 'Alerts',
    'stock.adjust': 'Adjust Stock',
    'stock.in': 'In',
    'stock.out': 'Out',
    'stock.adjustment': 'Adjustment',
    'notifications.title': 'Notifications',
    'notifications.markAll': 'Mark all as read',
    'notifications.noNotif': 'No notifications',
    'notifications.lowStock': 'Low stock',
    'notifications.rupture': 'Out of stock',
    'reports.title': 'Reports',
    'reports.sales': 'Sales Report',
    'reports.purchases': 'Purchases Report',
    'reports.stock': 'Stock Report',
    'reports.charges': 'Expenses Report',
    'reports.exportPdf': 'Export PDF',
    'reports.exportExcel': 'Export Excel',
    'auth.login': 'Login',
    'auth.logout': 'Logout',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.loginBtn': 'Sign In',
    'error.stockInsuffisant': 'Insufficient stock',
    'error.required': 'This field is required',
    'error.generic': 'An error occurred',
  },

  ar: {
    'nav.dashboard': 'لوحة التحكم',
    'nav.clients': 'العملاء',
    'nav.suppliers': 'الموردون',
    'nav.products': 'المنتجات',
    'nav.sales': 'المبيعات',
    'nav.purchases': 'المشتريات',
    'nav.stock': 'المخزون',
    'nav.quotes': 'عروض الأسعار',
    'nav.charges': 'المصاريف',
    'nav.employees': 'الموظفون',
    'nav.accounting': 'المحاسبة',
    'nav.reports': 'التقارير',
    'nav.settings': 'الإعدادات',
    'nav.notifications': 'الإشعارات',
    'nav.logout': 'تسجيل الخروج',
    'common.save': 'حفظ',
    'common.cancel': 'إلغاء',
    'common.delete': 'حذف',
    'common.edit': 'تعديل',
    'common.create': 'إنشاء',
    'common.search': 'بحث...',
    'common.loading': 'جار التحميل...',
    'common.noData': 'لا توجد بيانات',
    'common.actions': 'إجراءات',
    'common.confirm': 'تأكيد',
    'common.back': 'رجوع',
    'common.export': 'تصدير',
    'common.download': 'تنزيل',
    'common.total': 'المجموع',
    'common.status': 'الحالة',
    'common.date': 'التاريخ',
    'common.name': 'الاسم',
    'common.phone': 'الهاتف',
    'common.email': 'البريد الإلكتروني',
    'common.notes': 'ملاحظات',
    'common.required': 'مطلوب',
    'common.optional': 'اختياري',
    'common.active': 'نشط',
    'common.inactive': 'غير نشط',
    'common.yes': 'نعم',
    'common.no': 'لا',
    'common.filter': 'تصفية',
    'common.reset': 'إعادة تعيين',
    'common.period': 'الفترة',
    'dashboard.title': 'لوحة التحكم',
    'dashboard.totalRevenue': 'إجمالي الإيرادات',
    'dashboard.monthRevenue': 'إيرادات هذا الشهر',
    'dashboard.totalPurchases': 'إجمالي المشتريات',
    'dashboard.monthPurchases': 'مشتريات هذا الشهر',
    'dashboard.totalClients': 'العملاء',
    'dashboard.activeClients': 'العملاء النشطون',
    'dashboard.totalProducts': 'المنتجات',
    'dashboard.lowStock': 'المخزون المنخفض',
    'dashboard.topClients': 'أفضل العملاء',
    'dashboard.recentSales': 'آخر المبيعات',
    'dashboard.revenue': 'الإيرادات',
    'dashboard.collected': 'المحصل',
    'dashboard.outstanding': 'المستحق',
    'dashboard.netProfit': 'صافي الربح',
    'clients.title': 'العملاء',
    'clients.new': 'عميل جديد',
    'clients.edit': 'تعديل العميل',
    'clients.firstName': 'الاسم الأول',
    'clients.sector': 'القطاع',
    'clients.creditLimit': 'حد الائتمان (دينار)',
    'clients.creditUsed': 'الائتمان المستخدم',
    'clients.creditAvailable': 'الائتمان المتاح',
    'clients.stats': 'الإحصائيات',
    'clients.bilan': 'بيان العميل',
    'clients.noSales': 'لا توجد مبيعات مسجلة',
    'products.title': 'المنتجات',
    'products.new': 'منتج جديد',
    'products.unit': 'الوحدة',
    'products.purchasePrice': 'سعر الشراء (دينار)',
    'products.salePrice': 'سعر البيع (دينار)',
    'products.stock': 'المخزون',
    'products.threshold': 'حد التنبيه',
    'products.lowStock': 'مخزون منخفض',
    'products.outOfStock': 'نفاد المخزون',
    'products.tva': 'ضريبة القيمة المضافة (%)',
    'products.supplier': 'المورد',
    'sales.title': 'المبيعات',
    'sales.new': 'بيع جديد',
    'sales.client': 'العميل',
    'sales.items': 'العناصر',
    'sales.unitPrice': 'سعر الوحدة',
    'sales.quantity': 'الكمية',
    'sales.totalHT': 'المجموع (بدون ضريبة)',
    'sales.totalTTC': 'المجموع (شامل الضريبة)',
    'sales.paid': 'المدفوع',
    'sales.remaining': 'المتبقي',
    'sales.initialPayment': 'الدفعة الأولى',
    'sales.paymentMethod': 'طريقة الدفع',
    'sales.addPayment': 'إضافة دفعة',
    'sales.invoice': 'فاتورة',
    'sales.status.paid': 'مدفوع',
    'sales.status.partial': 'جزئي',
    'sales.status.pending': 'في الانتظار',
    'sales.addProduct': '+ إضافة سطر',
    'sales.newClient': 'عميل جديد',
    'payment.cash': 'نقداً',
    'payment.virement': 'تحويل بنكي',
    'payment.cheque': 'شيك',
    'payment.online': 'عبر الإنترنت',
    'stock.title': 'المخزون',
    'stock.movements': 'الحركات',
    'stock.alerts': 'التنبيهات',
    'stock.adjust': 'تعديل المخزون',
    'stock.in': 'وارد',
    'stock.out': 'صادر',
    'stock.adjustment': 'تسوية',
    'notifications.title': 'الإشعارات',
    'notifications.markAll': 'تعليم الكل كمقروء',
    'notifications.noNotif': 'لا توجد إشعارات',
    'notifications.lowStock': 'مخزون منخفض',
    'notifications.rupture': 'نفاد المخزون',
    'reports.title': 'التقارير',
    'reports.sales': 'تقرير المبيعات',
    'reports.purchases': 'تقرير المشتريات',
    'reports.stock': 'تقرير المخزون',
    'reports.charges': 'تقرير المصاريف',
    'reports.exportPdf': 'تصدير PDF',
    'reports.exportExcel': 'تصدير Excel',
    'auth.login': 'تسجيل الدخول',
    'auth.logout': 'تسجيل الخروج',
    'auth.email': 'البريد الإلكتروني',
    'auth.password': 'كلمة المرور',
    'auth.loginBtn': 'دخول',
    'error.stockInsuffisant': 'المخزون غير كافٍ',
    'error.required': 'هذا الحقل مطلوب',
    'error.generic': 'حدث خطأ',
  },
};

// ─── Context ──────────────────────────────────────────────────────────────────
const I18nContext = createContext<I18nContextValue>({
  lang: 'fr',
  setLang: () => {},
  t: (key) => key,
  dir: 'ltr',
});

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Lang>(() => {
    return (localStorage.getItem('erp_lang') as Lang) || 'fr';
  });

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem('erp_lang', l);
    document.documentElement.dir = l === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = l;
  };

  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  const t = (key: string): string => {
    return translations[lang]?.[key] ?? translations['fr']?.[key] ?? key;
  };

  return (
    <I18nContext.Provider value={{ lang, setLang, t, dir: lang === 'ar' ? 'rtl' : 'ltr' }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => useContext(I18nContext);

// Helper : sélecteur de langue pour la Sidebar/Header
export const LangSelector: React.FC = () => {
  const { lang, setLang } = useI18n();
  const langs: { code: Lang; flag: string; label: string }[] = [
    { code: 'fr', flag: '🇫🇷', label: 'FR' },
    { code: 'ar', flag: '🇹🇳', label: 'AR' },
    { code: 'en', flag: '🇬🇧', label: 'EN' },
  ];
  return (
    <div className="flex gap-1">
      {langs.map((l) => (
        <button
          key={l.code}
          onClick={() => setLang(l.code)}
          className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
            lang === l.code
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          {l.flag} {l.label}
        </button>
      ))}
    </div>
  );
};
