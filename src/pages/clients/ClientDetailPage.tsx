import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientsApi } from '../../api';
import { paymentVenteApi } from '../../api';
import {
  ArrowLeft, Phone, Mail, MapPin, TrendingUp, ShoppingCart, CreditCard, Download,
  Package, ChevronRight, ChevronLeft, Calendar, Filter, Pencil, Trash2, X, Save,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { useI18n } from "../../context/I18nContext";

const formatTND = (v: number) => `${(v || 0).toFixed(3)} TND`;
const todayStr = () => new Date().toISOString().split('T')[0];

const ClientDetailPage: React.FC = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const { t, dir } = useI18n();

  // ── Status config ─────────────────────────────────────────────────────────
  const statusConfig: Record<string, { label: string; cls: string }> = {
    paid:    { label: t('sales.status.paid'),    cls: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
    partial: { label: t('sales.status.partial'), cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
    pending: { label: t('sales.status.pending'), cls: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' },
  };

  // ── State ─────────────────────────────────────────────────────────────────
  const [selectedSale,    setSelectedSale]    = useState<any>(null);
  const [exportStartDate, setExportStartDate] = useState('');
  const [exportEndDate,   setExportEndDate]   = useState('');
  const [exportQuick,     setExportQuick]     = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate,   setFilterEndDate]   = useState('');
  const [filterQuick,     setFilterQuick]     = useState('');
  const [payFilterStart,  setPayFilterStart]  = useState('');
  const [payFilterEnd,    setPayFilterEnd]    = useState('');
  const [payFilterQuick,  setPayFilterQuick]  = useState('');
  const [editingPayment,  setEditingPayment]  = useState<any>(null);
  const [editAmount,      setEditAmount]      = useState('');
  const [editNote,        setEditNote]        = useState('');

  const queryClient = useQueryClient();

  const updatePaymentMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { amount?: number; note?: string } }) =>
        paymentVenteApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-stats', clientId] });
      setEditingPayment(null);
      toast.success('Paiement modifié');
    },
    onError: () => toast.error('Erreur lors de la modification'),
  });

  const deletePaymentMut = useMutation({
    mutationFn: (id: string) => paymentVenteApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-stats', clientId] });
      toast.success('Paiement supprimé');
    },
    onError: () => toast.error('Erreur lors de la suppression'),
  });

  // ── Queries ───────────────────────────────────────────────────────────────
  const { data: detailClient, isLoading: clientLoading } = useQuery({
    queryKey: ['client-detail', clientId],
    queryFn:  () => clientsApi.getOne(clientId!),
    enabled:  !!clientId,
  });

  const { data: clientStats, isLoading: statsLoading } = useQuery({
    queryKey: ['client-stats', clientId],
    queryFn:  () => clientsApi.getStats(clientId!),
    enabled:  !!clientId,
  });

  useEffect(() => {
    setSelectedSale(null);
    setExportStartDate('');
    setExportEndDate('');
    setExportQuick('');
    setFilterStartDate('');
    setFilterEndDate('');
    setFilterQuick('');
    setPayFilterStart('');
    setPayFilterEnd('');
    setPayFilterQuick('');
  }, [clientId]);

  // ── Filtrage ventes ───────────────────────────────────────────────────────
  const filteredSales = useMemo(() => {
    const sales: any[] = clientStats?.recentSales || [];
    if (!filterStartDate && !filterEndDate) return sales;
    return sales.filter((s) => {
      if (!s.createdAt) return false;
      const d = new Date(s.createdAt).toISOString().split('T')[0];
      if (filterStartDate && d < filterStartDate) return false;
      if (filterEndDate   && d > filterEndDate)   return false;
      return true;
    });
  }, [clientStats?.recentSales, filterStartDate, filterEndDate]);

  // ── Filtrage paiements ────────────────────────────────────────────────────
  const filteredPayments = useMemo(() => {
    const payments: any[] = clientStats?.payments || [];
    if (!payFilterStart && !payFilterEnd) return payments;
    return payments.filter((p) => {
      const d = p.createdAt ? new Date(p.createdAt).toISOString().split('T')[0] : null;
      if (!d) return false;
      if (payFilterStart && d < payFilterStart) return false;
      if (payFilterEnd   && d > payFilterEnd)   return false;
      return true;
    });
  }, [clientStats?.payments, payFilterStart, payFilterEnd]);

  const filterDiffDays = filterStartDate && filterEndDate
      ? Math.ceil((new Date(filterEndDate).getTime() - new Date(filterStartDate).getTime()) / 86_400_000) + 1
      : 0;

  const exportDiffDays = exportStartDate && exportEndDate
      ? Math.ceil((new Date(exportEndDate).getTime() - new Date(exportStartDate).getTime()) / 86_400_000) + 1
      : 0;

  // ── Helpers ───────────────────────────────────────────────────────────────
  const buildQuickDates = (period: string): { start: string; end: string } | null => {
    const end   = todayStr();
    const start = new Date();
    switch (period) {
      case '1d': start.setDate(start.getDate() - 1);         break;
      case '3d': start.setDate(start.getDate() - 3);         break;
      case '7d': start.setDate(start.getDate() - 7);         break;
      case '1m': start.setMonth(start.getMonth() - 1);       break;
      case '3m': start.setMonth(start.getMonth() - 3);       break;
      case '6m': start.setMonth(start.getMonth() - 6);       break;
      case '1y': start.setFullYear(start.getFullYear() - 1); break;
      default: return null;
    }
    return { start: start.toISOString().split('T')[0], end };
  };

  const applyExportQuick = (period: string) => {
    const dates = buildQuickDates(period);
    if (!dates) return;
    setExportStartDate(dates.start);
    setExportEndDate(dates.end);
    setExportQuick(period);
  };

  const applyFilterQuick = (period: string) => {
    const dates = buildQuickDates(period);
    if (!dates) return;
    setFilterStartDate(dates.start);
    setFilterEndDate(dates.end);
    setFilterQuick(period);
  };

  const applyPayFilterQuick = (period: string) => {
    const dates = buildQuickDates(period);
    if (!dates) return;
    setPayFilterStart(dates.start);
    setPayFilterEnd(dates.end);
    setPayFilterQuick(period);
  };

  const clearFilterDates = () => {
    setFilterStartDate('');
    setFilterEndDate('');
    setFilterQuick('');
  };

  const clearPayFilterDates = () => {
    setPayFilterStart('');
    setPayFilterEnd('');
    setPayFilterQuick('');
  };

  const handleExport = async (fmt: string) => {
    if (!exportStartDate || !exportEndDate) {
      toast.error(t('common.required'));
      return;
    }
    try {
      const blob = await clientsApi.exportBilan(clientId!, {
        startDate: exportStartDate,
        endDate:   exportEndDate,
        format:    fmt,
      });
      const url = URL.createObjectURL(blob);
      const a   = document.createElement('a');
      a.href     = url;
      a.download = `bilan-${detailClient?.name}-${exportStartDate}-${exportEndDate}.${fmt}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error(t('error.generic'));
    }
  };

  // ── Boutons période rapide ────────────────────────────────────────────────
  const quickPeriods = [
    { key: '1d', label: '1j' },
    { key: '3d', label: '3j' },
    { key: '7d', label: '7j' },
    { key: '1m', label: '1m' },
    { key: '3m', label: '3m' },
    { key: '6m', label: '6m' },
    { key: '1y', label: '1 an' },
  ];

  const QuickButtons = ({ active, onApply }: { active: string; onApply: (k: string) => void }) => (
      <div className="flex gap-1.5 flex-wrap">
        {quickPeriods.map(({ key, label }) => (
            <button
                key={key}
                onClick={() => onApply(key)}
                className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors border ${
                    active === key
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
                }`}
            >
              {label}
            </button>
        ))}
      </div>
  );

  const dateCls = 'w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500';

  // ── Loading ───────────────────────────────────────────────────────────────
  if (clientLoading) {
    return (
        <div className="h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-2" />
            <p className="text-gray-500">{t('common.loading')}</p>
          </div>
        </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
      <div className="space-y-4 sm:space-y-6 max-w-3xl mx-auto pb-16 sm:pb-12 px-0 sm:px-0" dir={dir}>

        {/* ── Page Header ── */}
        <div className="flex items-start gap-3 sm:gap-4">
          <button
              onClick={() => navigate('/clients')}
              className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shrink-0 mt-0.5"
          >
            <ArrowLeft size={16} className="text-gray-600 dark:text-gray-300" />
          </button>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white leading-tight truncate">
              {detailClient?.name}{detailClient?.firstName ? ` ${detailClient.firstName}` : ''}
            </h1>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
              <span className="flex items-center gap-1 text-xs text-gray-500"><Phone size={11} />{detailClient?.phone}</span>
              {detailClient?.email  && <span className="flex items-center gap-1 text-xs text-gray-500 hidden sm:flex"><Mail size={11} />{detailClient.email}</span>}
              {detailClient?.sector && <span className="flex items-center gap-1 text-xs text-gray-500"><MapPin size={11} />{detailClient.sector}</span>}
            </div>
            {detailClient?.email && (
                <span className="flex items-center gap-1 text-xs text-gray-500 mt-1 sm:hidden"><Mail size={11} />{detailClient.email}</span>
            )}
          </div>
        </div>

        {/* ── Stats Cards ── */}
        {statsLoading ? (
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {[1, 2, 3].map(i => <div key={i} className="bg-gray-100 dark:bg-gray-800 rounded-xl h-20 animate-pulse" />)}
            </div>
        ) : (
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {[
                { label: t('dashboard.totalRevenue'), value: formatTND(clientStats?.totalRevenue || 0), icon: TrendingUp,   color: 'text-blue-600  bg-blue-50  dark:bg-blue-900/20'  },
                { label: t('sales.paid'),              value: formatTND(clientStats?.totalPaid    || 0), icon: ShoppingCart, color: 'text-green-600 bg-green-50 dark:bg-green-900/20' },
                { label: t('clients.creditUsed'),      value: formatTND(clientStats?.totalCredit  || 0), icon: CreditCard,   color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20' },
              ].map(({ label, value, icon: Icon, color }) => (
                  <div key={label} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-2.5 sm:p-3 text-center">
                    <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center mx-auto mb-1.5 sm:mb-2 ${color}`}>
                      <Icon size={14} className="sm:size-4" />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight line-clamp-1">{label}</p>
                    <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white mt-0.5 truncate">{value}</p>
                  </div>
              ))}
            </div>
        )}

        {/* ── Credit Progress ── */}
        {clientStats?.client?.creditLimit > 0 && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 sm:p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">{t('clients.creditLimit')}</span>
                <span className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">{formatTND(clientStats.client.creditLimit)}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                    className="bg-amber-500 h-2 rounded-full transition-all"
                    style={{ width: `${Math.min(100, ((clientStats.client.creditUsed || 0) / clientStats.client.creditLimit) * 100)}%` }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-xs text-gray-400">{t('clients.creditUsed')} : {formatTND(clientStats.client.creditUsed || 0)}</span>
                <span className="text-xs text-gray-400">{t('clients.creditAvailable')} : {formatTND(clientStats.creditAvailable || 0)}</span>
              </div>
            </div>
        )}

        {/* ── Filtre date achats ── */}
        <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 rounded-xl p-3 sm:p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs sm:text-sm font-semibold text-blue-800 dark:text-blue-300 flex items-center gap-2">
              <Filter size={13} />
              {t('common.filter')}
            </h3>
            {(filterStartDate || filterEndDate) && (
                <button onClick={clearFilterDates} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
                  {t('common.reset')}
                </button>
            )}
          </div>
          <QuickButtons active={filterQuick} onApply={applyFilterQuick} />
          <div className="grid grid-cols-2 gap-2 sm:gap-3 mt-3">
            <div>
              <label className="block text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">Début</label>
              <input type="date" value={filterStartDate} max={filterEndDate || todayStr()} onChange={e => { setFilterStartDate(e.target.value); setFilterQuick(''); }} className={dateCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">Fin</label>
              <input type="date" value={filterEndDate} min={filterStartDate} max={todayStr()} onChange={e => { setFilterEndDate(e.target.value); setFilterQuick(''); }} className={dateCls} />
            </div>
          </div>
          {filterStartDate && filterEndDate && (
              <div className="mt-2 text-xs text-blue-700 dark:text-blue-300 text-center">
                {format(new Date(filterStartDate), 'dd/MM/yyyy')} → {format(new Date(filterEndDate), 'dd/MM/yyyy')}
                {' · '}<span className="font-semibold">{filterDiffDays}j</span>
                {' · '}<span className="font-semibold">{filteredSales.length} {t('nav.sales').toLowerCase()}</span>
              </div>
          )}
        </div>

        {/* ── Liste des achats ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              {t('nav.purchases')}
              {clientStats?.count > 0 && (
                  <span className="ms-2 text-xs font-normal text-gray-400">
                ({filteredSales.length}{filterStartDate || filterEndDate ? ` / ${clientStats.count}` : ''})
              </span>
              )}
            </h3>
          </div>
          {statsLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => <div key={i} className="h-14 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />)}
              </div>
          ) : filteredSales.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <Package size={32} className="mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                <p className="text-sm text-gray-400">
                  {filterStartDate || filterEndDate ? t('common.noData') : t('clients.noSales')}
                </p>
              </div>
          ) : (
              <div className="space-y-2">
                {filteredSales.map((s: any) => (
                    <button
                        key={s._id}
                        onClick={() => setSelectedSale(s)}
                        className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/10 border border-transparent hover:border-blue-200 dark:hover:border-blue-800 transition-all text-left active:scale-[0.99]"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">{formatTND(s.totalTTC)}</p>
                          {s.amountRemaining > 0 && (
                              <span className="text-xs text-red-500 hidden xs:inline">
                        {t('sales.remaining')}: {formatTND(s.amountRemaining)}
                      </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {s.createdAt ? format(new Date(s.createdAt), 'dd/MM/yyyy') : '—'}
                          {s.items?.length > 0 && ` · ${s.items.length} art.`}
                          {s.amountRemaining > 0 && (
                              <span className="text-red-500 xs:hidden"> · -{formatTND(s.amountRemaining)}</span>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2 ms-2 shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusConfig[s.status]?.cls || ''}`}>
                    {statusConfig[s.status]?.label || s.status}
                  </span>
                        <ChevronRight size={13} className="text-gray-400 rtl:rotate-180" />
                      </div>
                    </button>
                ))}
              </div>
          )}
        </div>

        {/* ── Liste des paiements ── */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 sm:p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <CreditCard size={14} className="text-gray-400" />
              {t('sales.addPayment')}
              {clientStats?.payments?.length > 0 && (
                  <span className="text-xs font-normal text-gray-400">
                ({filteredPayments.length}{payFilterStart || payFilterEnd ? ` / ${clientStats.payments.length}` : ''})
              </span>
              )}
            </h3>
            {(payFilterStart || payFilterEnd) && (
                <button onClick={clearPayFilterDates} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
                  {t('common.reset')}
                </button>
            )}
          </div>

          <QuickButtons active={payFilterQuick} onApply={applyPayFilterQuick} />

          <div className="grid grid-cols-2 gap-2 mt-3 mb-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Début</label>
              <input
                  type="date"
                  value={payFilterStart}
                  max={payFilterEnd || todayStr()}
                  onChange={e => { setPayFilterStart(e.target.value); setPayFilterQuick(''); }}
                  className={dateCls}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Fin</label>
              <input
                  type="date"
                  value={payFilterEnd}
                  min={payFilterStart}
                  max={todayStr()}
                  onChange={e => { setPayFilterEnd(e.target.value); setPayFilterQuick(''); }}
                  className={dateCls}
              />
            </div>
          </div>

          {payFilterStart && payFilterEnd && (
              <div className="mb-3 text-xs text-gray-500 dark:text-gray-400 text-center">
                {format(new Date(payFilterStart), 'dd/MM/yyyy')} → {format(new Date(payFilterEnd), 'dd/MM/yyyy')}
                {' · '}<span className="font-semibold">
              {Math.ceil((new Date(payFilterEnd).getTime() - new Date(payFilterStart).getTime()) / 86_400_000) + 1}j
            </span>
              </div>
          )}

          {statsLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => <div key={i} className="h-10 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse" />)}
              </div>
          ) : filteredPayments.length === 0 ? (
              <div className="text-center py-6 bg-white dark:bg-gray-900/30 rounded-xl">
                <CreditCard size={28} className="mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                <p className="text-sm text-gray-400">{t('common.noData')}</p>
              </div>
          ) : (
              <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
                <table className="w-full text-xs sm:text-sm">
                  <thead>
                  <tr className="bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                    <th className="text-left px-3 py-2 font-medium">{t('common.date')}</th>
                    <th className="text-right px-3 py-2 font-medium">{t('sales.totalTTC')}</th>
                    <th className="text-left px-3 py-2 font-medium hidden sm:table-cell">{t('common.notes')}</th>
                    <th className="px-2 py-2 w-16" />
                  </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {filteredPayments.map((p: any, idx: number) => (
                      <tr key={p._id || idx} className="bg-white dark:bg-gray-800 hover:bg-green-50 dark:hover:bg-green-900/10 transition-colors">
                        {editingPayment?._id === p._id ? (
                            <>
                              <td className="px-3 py-2 text-xs text-gray-400 whitespace-nowrap">
                                {p.createdAt ? format(new Date(p.createdAt), 'dd/MM/yyyy HH:mm') : '—'}
                              </td>
                              <td className="px-2 py-1.5">
                                <input
                                    type="number" step="0.001" min="0.001"
                                    value={editAmount}
                                    onChange={e => setEditAmount(e.target.value)}
                                    className="w-full px-2 py-1 rounded-lg border border-emerald-400 dark:border-emerald-600 bg-white dark:bg-gray-700 text-sm font-bold text-gray-900 dark:text-white focus:outline-none text-right"
                                />
                              </td>
                              <td className="px-2 py-1.5 hidden sm:table-cell">
                                <input
                                    type="text" value={editNote}
                                    onChange={e => setEditNote(e.target.value)}
                                    placeholder="Note..."
                                    className="w-full px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-xs text-gray-700 dark:text-white focus:outline-none"
                                />
                              </td>
                              <td className="px-2 py-1.5">
                                <div className="flex gap-1 justify-end">
                                  <button
                                      onClick={() => updatePaymentMut.mutate({ id: p._id, data: { amount: parseFloat(editAmount), note: editNote } })}
                                      disabled={updatePaymentMut.isPending || !editAmount || parseFloat(editAmount) <= 0}
                                      className="p-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white disabled:opacity-50 transition-colors"
                                  ><Save size={11} /></button>
                                  <button
                                      onClick={() => setEditingPayment(null)}
                                      className="p-1.5 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 transition-colors"
                                  ><X size={11} /></button>
                                </div>
                              </td>
                            </>
                        ) : (
                            <>
                              <td className="px-3 py-2.5 text-gray-600 dark:text-gray-300 whitespace-nowrap text-xs">
                                {p.createdAt ? format(new Date(p.createdAt), 'dd/MM/yyyy HH:mm') : '—'}
                              </td>
                              <td className="px-3 py-2.5 text-right font-bold text-green-600 dark:text-green-400 whitespace-nowrap">
                                +{formatTND(p.amount)}
                              </td>
                              <td className="px-3 py-2.5 text-gray-400 italic hidden sm:table-cell truncate max-w-[120px]">
                                {p.note || '—'}
                              </td>
                              <td className="px-2 py-2.5">
                                <div className="flex gap-1 justify-end">
                                  <button
                                      onClick={() => { setEditingPayment(p); setEditAmount(String(p.amount)); setEditNote(p.note || ''); }}
                                      className="p-1.5 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-500 transition-colors"
                                  ><Pencil size={11} /></button>
                                  <button
                                      onClick={() => { if (window.confirm('Supprimer ce paiement ?')) deletePaymentMut.mutate(p._id); }}
                                      disabled={deletePaymentMut.isPending}
                                      className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 disabled:opacity-50 transition-colors"
                                  ><Trash2 size={11} /></button>
                                </div>
                              </td>
                            </>
                        )}
                      </tr>
                  ))}
                  </tbody>
                  <tfoot>
                  <tr className="bg-gray-50 dark:bg-gray-700 border-t-2 border-gray-200 dark:border-gray-600">
                    <td className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400">Total</td>
                    <td className="px-3 py-2 text-right text-sm font-bold text-green-600 dark:text-green-400">
                      {formatTND(filteredPayments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0))}
                    </td>
                    <td className="hidden sm:table-cell" />
                  </tr>
                  </tfoot>
                </table>
              </div>
          )}
        </div>

        {/* ── Export bilan ── */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 sm:p-4">
          <h3 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <Calendar size={14} className="text-gray-400" />
            {t('common.export')}
          </h3>
          <QuickButtons active={exportQuick} onApply={applyExportQuick} />
          <div className="grid grid-cols-2 gap-2 sm:gap-3 mt-3 mb-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">{t('common.date')} début</label>
              <input type="date" value={exportStartDate} max={exportEndDate || todayStr()} onChange={e => { setExportStartDate(e.target.value); setExportQuick(''); }} className={dateCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">{t('common.date')} fin</label>
              <input type="date" value={exportEndDate} min={exportStartDate} max={todayStr()} onChange={e => { setExportEndDate(e.target.value); setExportQuick(''); }} className={dateCls} />
            </div>
          </div>
          {exportStartDate && exportEndDate && (
              <div className="mb-3 px-3 py-2 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                <p className="text-xs text-gray-600 dark:text-gray-300 text-center">
                  {format(new Date(exportStartDate), 'dd/MM/yyyy')} → {format(new Date(exportEndDate), 'dd/MM/yyyy')}
                  {' · '}<span className="font-semibold">{exportDiffDays} j</span>
                </p>
              </div>
          )}
          <div className="flex gap-2">
            <button
                onClick={() => handleExport('pdf')}
                disabled={!exportStartDate || !exportEndDate}
                className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 px-3 py-2.5 sm:py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-300 dark:disabled:bg-red-900/40 disabled:cursor-not-allowed text-white rounded-lg text-xs font-medium transition-colors"
            >
              <Download size={13} /> PDF
            </button>
            <button
                onClick={() => handleExport('xlsx')}
                disabled={!exportStartDate || !exportEndDate}
                className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 px-3 py-2.5 sm:py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-300 dark:disabled:bg-green-900/40 disabled:cursor-not-allowed text-white rounded-lg text-xs font-medium transition-colors"
            >
              <Download size={13} /> Excel
            </button>
          </div>
        </div>

        {/* ── Sale Detail Modal (bottom sheet mobile) ── */}
        {selectedSale && (
            <div className="fixed inset-0 z-50 flex items-end sm:justify-end" dir={dir}>
              <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedSale(null)} />
              <div className="relative w-full sm:w-auto sm:max-w-md sm:h-full bg-white dark:bg-gray-900 shadow-2xl overflow-y-auto rounded-t-2xl sm:rounded-none max-h-[92vh] sm:max-h-full">

                <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-4 sm:px-6 py-4 flex items-center justify-between z-10">
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 bg-gray-200 dark:bg-gray-700 rounded-full sm:hidden" />
                  <div className="flex items-center gap-2 sm:gap-3 mt-2 sm:mt-0">
                    <button onClick={() => setSelectedSale(null)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                      <ChevronLeft size={18} className="text-gray-500 rtl:rotate-180" />
                    </button>
                    <div>
                      <h2 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">{t('sales.invoice')}</h2>
                      <p className="text-xs text-gray-400">
                        {selectedSale.createdAt ? format(new Date(selectedSale.createdAt), "dd/MM/yyyy 'à' HH:mm") : '—'}
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusConfig[selectedSale.status]?.cls || ''}`}>
                {statusConfig[selectedSale.status]?.label || selectedSale.status}
              </span>
                </div>

                <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">

                  {/* Résumé financier */}
                  <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    {[
                      { label: t('sales.totalTTC'), value: formatTND(selectedSale.totalTTC),       cls: 'text-blue-600' },
                      { label: t('sales.paid'),      value: formatTND(selectedSale.amountPaid),      cls: 'text-green-600' },
                      { label: t('sales.remaining'), value: formatTND(selectedSale.amountRemaining), cls: selectedSale.amountRemaining > 0 ? 'text-red-500' : 'text-gray-400' },
                    ].map(({ label, value, cls }) => (
                        <div key={label} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-2.5 sm:p-3 text-center">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 line-clamp-1">{label}</p>
                          <p className={`text-xs sm:text-sm font-bold ${cls} truncate`}>{value}</p>
                        </div>
                    ))}
                  </div>

                  {/* Produits */}
                  <div>
                    <h3 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <Package size={14} className="text-gray-400" />
                      {t('products.title')}
                    </h3>
                    <div className="space-y-2">
                      {(selectedSale.items || []).map((item: any, idx: number) => (
                          <div key={idx} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white truncate">{item.productName}</p>
                                <div className="flex items-center gap-2 sm:gap-3 mt-1 flex-wrap">
                                  <span className="text-xs text-gray-500">{t('sales.quantity')}: <span className="font-medium text-gray-700 dark:text-gray-300">{item.quantity}</span></span>
                                  <span className="text-xs text-gray-500">{t('sales.unitPrice')}: <span className="font-medium text-gray-700 dark:text-gray-300">{formatTND(item.unitPrice)}</span></span>
                                  {item.tva > 0 && <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-1.5 py-0.5 rounded-md">{t('products.tva')} {item.tva}%</span>}
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">{formatTND(item.totalTTC)}</p>
                                {item.tva > 0 && <p className="text-xs text-gray-400">HT: {formatTND(item.totalHT)}</p>}
                              </div>
                            </div>
                          </div>
                      ))}
                    </div>
                  </div>

                  {/* Totaux */}
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 sm:p-4 space-y-2">
                    <div className="flex justify-between text-xs sm:text-sm text-gray-600 dark:text-gray-400"><span>{t('sales.totalHT')}</span><span>{formatTND(selectedSale.totalHT)}</span></div>
                    <div className="flex justify-between text-xs sm:text-sm text-gray-600 dark:text-gray-400"><span>TVA</span><span>{formatTND(selectedSale.totalTTC - selectedSale.totalHT)}</span></div>
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-2 flex justify-between text-sm sm:text-base font-bold text-gray-900 dark:text-white">
                      <span>{t('sales.totalTTC')}</span><span>{formatTND(selectedSale.totalTTC)}</span>
                    </div>
                  </div>

                  {/* Historique paiements */}
                  {(selectedSale.payments || []).length > 0 && (
                      <div>
                        <h3 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                          <CreditCard size={14} className="text-gray-400" />
                          {t('sales.addPayment')}
                        </h3>
                        <div className="space-y-2">
                          {selectedSale.payments.map((p: any, idx: number) => (
                              <div key={idx} className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/10 rounded-xl border border-green-100 dark:border-green-900/20">
                                <div>
                                  <p className="text-xs text-gray-500">{p.date ? format(new Date(p.date), "dd/MM/yyyy 'à' HH:mm") : '—'}</p>
                                  {p.note && <p className="text-xs text-gray-400 italic mt-0.5">{p.note}</p>}
                                </div>
                                <p className="text-xs sm:text-sm font-bold text-green-600 dark:text-green-400">+{formatTND(p.amount)}</p>
                              </div>
                          ))}
                        </div>
                      </div>
                  )}

                  {/* Notes */}
                  {selectedSale.notes && (
                      <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 rounded-xl p-3 sm:p-4">
                        <p className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-1">{t('common.notes')}</p>
                        <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">{selectedSale.notes}</p>
                      </div>
                  )}

                </div>
              </div>
            </div>
        )}
      </div>
  );
};

export default ClientDetailPage;