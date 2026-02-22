import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '../../api';
import { Bell, BellOff, Check, CheckCheck, AlertTriangle, Info, TrendingDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

const NotificationsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { data: notifications = [], isLoading } = useQuery({ queryKey: ['notifications'], queryFn: notificationsApi.getAll });

  const markReadMut = useMutation({
    mutationFn: notificationsApi.markRead,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['notifications'] }); queryClient.invalidateQueries({ queryKey: ['notifications-unread'] }); },
  });
  const markAllMut = useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['notifications'] }); queryClient.invalidateQueries({ queryKey: ['notifications-unread'] }); toast.success('Toutes les notifications marquées comme lues'); },
  });

  const unread = (notifications as any[]).filter(n => !n.isRead).length;

  const getIcon = (type: string) => {
    if (type === 'low_stock') return <TrendingDown size={16} className="text-amber-600" />;
    if (type === 'payment') return <Check size={16} className="text-green-600" />;
    if (type === 'warning') return <AlertTriangle size={16} className="text-red-600" />;
    return <Info size={16} className="text-blue-600" />;
  };

  const getBg = (type: string) => {
    if (type === 'low_stock') return 'bg-amber-50 dark:bg-amber-900/20';
    if (type === 'payment') return 'bg-green-50 dark:bg-green-900/20';
    if (type === 'warning') return 'bg-red-50 dark:bg-red-900/20';
    return 'bg-blue-50 dark:bg-blue-900/20';
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notifications</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">{unread} non lue{unread !== 1 ? 's' : ''}</p>
        </div>
        {unread > 0 && (
          <button onClick={() => markAllMut.mutate()} disabled={markAllMut.isPending}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800">
            <CheckCheck size={15} /> Tout marquer lu
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-14 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />)}</div>
        ) : (notifications as any[]).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <BellOff size={48} className="text-gray-200 dark:text-gray-700 mb-4" />
            <p className="text-gray-500 dark:text-gray-400 font-medium">Aucune notification</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {(notifications as any[]).map((n: any) => (
              <div
                key={n._id}
                onClick={() => !n.isRead && markReadMut.mutate(n._id)}
                className={`flex items-start gap-4 p-4 transition-colors cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 ${!n.isRead ? 'bg-blue-50/30 dark:bg-blue-950/10' : ''}`}
              >
                <div className={`p-2 rounded-xl flex-shrink-0 mt-0.5 ${getBg(n.type)}`}>
                  {getIcon(n.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${!n.isRead ? 'font-semibold text-gray-900 dark:text-white' : 'font-medium text-gray-700 dark:text-gray-300'}`}>{n.title || n.message}</p>
                  {n.title && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{n.message}</p>}
                  <p className="text-xs text-gray-400 mt-1">{n.createdAt ? formatDistanceToNow(new Date(n.createdAt), { locale: fr, addSuffix: true }) : '—'}</p>
                </div>
                {!n.isRead && <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" />}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
