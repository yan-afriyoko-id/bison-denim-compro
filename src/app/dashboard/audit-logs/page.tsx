import { createServerSupabase } from '@/lib/supabase/server';
import { Card, CardContent } from '@/components/ui';
import { ClipboardList } from 'lucide-react';
import { timeAgo } from '@/lib/utils';

async function getAuditLogs() {
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false });
  return data ?? [];
}

export default async function AuditLogsPage() {
  const logs = await getAuditLogs();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Audit Logs</h1>
        <p className="text-sm text-text-secondary mt-1">
          Log aktivitas sistem
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          {logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-text-secondary">
              <ClipboardList className="h-12 w-12 mb-4 opacity-50" />
              <p>Belum ada audit log</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-6 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">
                      User
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">
                      Action
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">
                      Entity
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">
                      Entity ID
                    </th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">
                      Time
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-surface-elevated/50 transition-colors">
                      <td className="px-6 py-3 text-text-primary font-mono text-xs">
                        {log.user_id ?? <span className="text-text-muted italic">system</span>}
                      </td>
                      <td className="px-6 py-3">
                        <span className="text-text-primary">{log.action}</span>
                      </td>
                      <td className="px-6 py-3 text-text-secondary">
                        {log.entity_type}
                      </td>
                      <td className="px-6 py-3 text-text-muted font-mono text-xs">
                        {log.entity_id ?? '-'}
                      </td>
                      <td className="px-6 py-3 text-right text-text-muted text-xs whitespace-nowrap">
                        {timeAgo(log.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
