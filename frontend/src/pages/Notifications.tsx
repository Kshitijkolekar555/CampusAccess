import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationApi } from '../api/notifications';
import { NotificationItem } from '../types';
import { DataTable, Column } from '../components/ui/DataTable';
import { Pagination } from '../components/ui/Pagination';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Bell, RefreshCw, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export const Notifications: React.FC = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);

  const { data: pageData, isLoading } = useQuery({
    queryKey: ['notifications', page],
    queryFn: () => notificationApi.getNotifications({ page, size: 10 }),
  });

  const resendMutation = useMutation({
    mutationFn: notificationApi.resend,
    onSuccess: () => {
      toast.success('Notification resend triggered!');
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: notificationApi.deleteNotification,
    onSuccess: () => {
      toast.success('Notification removed');
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const columns: Column<NotificationItem>[] = [
    {
      header: 'Recipient',
      accessor: 'recipient',
      render: (n) => <span className="font-semibold text-slate-800 dark:text-slate-200">{n.recipient}</span>,
    },
    {
      header: 'Event Type',
      render: (n) => <Badge variant="purple">{n.eventType}</Badge>,
    },
    {
      header: 'Message',
      accessor: 'message',
      render: (n) => <span className="text-xs text-slate-600 dark:text-slate-300 max-w-xs truncate block">{n.message}</span>,
    },
    {
      header: 'Status',
      render: (n) => (
        <Badge variant={n.status === 'SENT' ? 'success' : n.status === 'FAILED' ? 'danger' : 'warning'}>
          {n.status}
        </Badge>
      ),
    },
    {
      header: 'Actions',
      render: (n) => (
        <div className="flex items-center gap-2">
          {n.status === 'FAILED' && (
            <Button variant="outline" size="sm" onClick={() => resendMutation.mutate(n.id)} leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>
              Retry
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(n.id)} className="text-rose-500">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
          System Notifications & Audit Log
        </h2>
        <p className="text-sm text-slate-500">Audit trail of automated email, SMS, and push notifications sent across campus.</p>
      </div>

      <DataTable columns={columns} data={pageData?.content || []} isLoading={isLoading} />
      {pageData && (
        <Pagination
          currentPage={pageData.pageNumber}
          totalPages={pageData.totalPages}
          totalElements={pageData.totalElements}
          pageSize={pageData.pageSize}
          onPageChange={setPage}
        />
      )}
    </div>
  );
};
