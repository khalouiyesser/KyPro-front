import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '../../api';
import { useI18n } from '../../context/I18nContext';
import { Bell, CheckCheck, Package, AlertTriangle, Info, X } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';

const typeConfig: Record<string, { icon: React.ReactNode; bg: string; border: string }> = {
  low_stock: {
    icon: <Package size={16} className="text-amber-600" />,
    bg: 'bg-amber-50 dark:bg-amber-900/10',
    border: 'border-amber-200 dark:border-amber-800',
  },
  payment_due: {
    icon: <AlertTriangle size={16} className="text-red-600" />,
    bg: 'bg-red-50 dark:bg-red-900/10',
    border: 'border-red-200 dark:border-red-800',
  },
  system: {
    icon: <Info size={16} className="text-blue-600" />,
    bg: 'bg-blue-50 dark:bg-blue-900/10',
    border: 'border-blue-200 dark:border-blue-800',
  },
};

const NotificationsPage: React.FC = () => {
  const { t } = useI18n();
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.getAll(),
    refetchInterval: 30_000,
  });

  const markReadMut = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notif-count'] });
    },
  });

  const markAllMut = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notif-count'] });
      toast.success('Toutes les notifications marquées comme lues');
    },
  });

  const unread = (notifications as any[]).filter((n) => !n.isRead).length;

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Bell size={22} />
            {t('notifications.title')}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {unread > 0 ? (
              <span className="text-blue-600 font-medium">{unread} non lue{unread > 1 ? 's' : ''}</span>
            ) : (
              'Tout est à jour'
            )}
          </p>
        </div>
        {unread > 0 && (
          <button
            onClick={() => markAllMut.mutate()}
            disabled={markAllMut.isPending}
            className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl text-sm font-medium hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors disabled:opacity-60"
          >
            <CheckCheck size={15} />
            {t('notifications.markAll')}
          </button>
        )}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (notifications as any[]).length === 0 ? (
        <div className="text-center py-16 bg-gray-50 dark:bg-gray-800/50 rounded-2xl">
          <Bell size={36} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-gray-400">{t('notifications.noNotif')}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {(notifications as any[]).map((notif: any) => {
            const cfg = typeConfig[notif.type] || typeConfig['system'];
            return (
              <div
                key={notif._id}
                className={`relative flex items-start gap-4 p-4 rounded-2xl border transition-all ${
                  notif.isRead
                    ? 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 opacity-70'
                    : `${cfg.bg} ${cfg.border} border`
                }`}
              >
                {/* Indicator */}
                {!notif.isRead && (
                  <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-blue-500" />
                )}

                {/* Icon */}
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${cfg.bg}`}>
                  {cfg.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold text-gray-900 dark:text-white ${notif.isRead ? 'font-medium' : 'font-bold'}`}>
                    {notif.title}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">{notif.message}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {notif.createdAt ? format(new Date(notif.createdAt), "dd MMM yyyy 'à' HH:mm", { locale: fr }) : '—'}
                  </p>
                  {notif.link && (
                    <a
                      href={notif.link}
                      className="text-xs text-blue-600 hover:underline mt-1 inline-block"
                    >
                      Voir →
                    </a>
                  )}
                </div>

                {/* Mark read button */}
                {!notif.isRead && (
                  <button
                    onClick={() => markReadMut.mutate(notif._id)}
                    className="shrink-0 p-1.5 hover:bg-white/80 dark:hover:bg-gray-700 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
                    title="Marquer comme lu"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
