import { createServerSupabase } from '@/lib/supabase/server';
import { ClipboardList } from 'lucide-react';
import { timeAgo } from '@/lib/utils';
import { PaginationControls } from '@/components/dashboard/pagination-controls';
import { clampPage, parsePageValue, parsePerPageValue } from '@/lib/pagination';
import { requireDashboardModuleAccess } from '@/lib/auth/helpers';

async function getAuditLogs(searchParams?: Record<string, string | string[] | undefined>) {
  const supabase = await createServerSupabase();
  const requestedPage = parsePageValue(searchParams?.page);
  const perPage = parsePerPageValue(searchParams?.perPage);
  const query = supabase
    .from('audit_logs')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });
  const { count } = await query;
  const totalItems = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage));
  const page = clampPage(requestedPage, totalPages);
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;
  const { data } = await query.range(from, to);

  const items = data ?? [];
  const userIds = [...new Set(items.map((l) => l.user_id).filter(Boolean))] as string[];
  let profileMap = new Map<string, string>();
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', userIds);
    for (const p of profiles ?? []) {
      if (p.full_name) profileMap.set(p.id, p.full_name);
    }
  }
  const itemsWithUser = items.map((log) => ({
    ...log,
    user_name: log.user_id ? (profileMap.get(log.user_id) ?? null) : null,
  }));

  return {
    items: itemsWithUser,
    page,
    perPage,
    totalItems,
    totalPages,
  };
}

export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireDashboardModuleAccess('audit_logs');
  const resolvedSearchParams = (await searchParams) ?? {};
  const logs = await getAuditLogs(resolvedSearchParams);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Audit Logs</h1>
        <p className="text-sm text-gray-400 mt-1">Track important dashboard and content changes.</p>
      </div>

      {logs.items.length === 0 ? (
        <div className="border border-dashed border-gray-300 bg-white rounded-sm py-24 flex flex-col items-center justify-center">
          <ClipboardList className="h-10 w-10 text-gray-300 mb-4" />
          <p className="text-sm text-gray-500">No audit logs yet</p>
        </div>
      ) : (
        <div className="rounded-sm border border-gray-200 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">
                    User
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Entity
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Entity ID
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Time
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.items.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3 text-gray-900 text-xs">
                      {log.user_name ? (
                        <span className="font-medium">{log.user_name}</span>
                      ) : log.user_id ? (
                        <span className="font-mono text-gray-400">{log.user_id.slice(0, 8)}...</span>
                      ) : (
                        <span className="text-gray-400 italic">system</span>
                      )}
                    </td>
                    <td className="px-6 py-3">
                      <span className="text-gray-900">{log.action}</span>
                    </td>
                    <td className="px-6 py-3 text-gray-500">{log.entity_type}</td>
                    <td className="px-6 py-3 text-gray-400 font-mono text-xs">
                      {log.entity_id ?? '-'}
                    </td>
                    <td className="px-6 py-3 text-right text-gray-400 text-xs whitespace-nowrap">
                      {timeAgo(log.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <PaginationControls
            mode="link"
            pathname="/dashboard/audit-logs"
            query={{}}
            page={logs.page}
            perPage={logs.perPage}
            totalItems={logs.totalItems}
            totalPages={logs.totalPages}
          />
        </div>
      )}
    </div>
  );
}
