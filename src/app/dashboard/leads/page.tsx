import { createServerSupabase } from '@/lib/supabase/server';
import { Card, CardContent, Badge } from '@/components/ui';
import { Mail, MessageCircle } from 'lucide-react';
import { timeAgo } from '@/lib/utils';

async function getLeads() {
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from('contact_submissions')
    .select('*')
    .order('created_at', { ascending: false });
  return data ?? [];
}

const statusVariants: Record<string, 'accent' | 'success' | 'danger' | 'warning' | 'info' | 'default'> = {
  new: 'warning',
  contacted: 'info',
  resolved: 'success',
  spam: 'danger',
};

export default async function LeadsPage() {
  const leads = await getLeads();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Leads</h1>
        <p className="text-sm text-text-secondary mt-1">
          Kelola kontak masuk
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          {leads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-text-secondary">
              <MessageCircle className="h-12 w-12 mb-4 opacity-50" />
              <p>Belum ada lead</p>
              <p className="text-sm mt-1">Lead akan muncul ketika ada pengunjung yang mengirim pesan</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {leads.map((lead) => (
                <div
                  key={lead.id}
                  className="flex items-center justify-between px-6 py-4"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-text-primary">
                        {lead.name}
                      </span>
                      <Badge variant={statusVariants[lead.status] ?? 'default'}>
                        {lead.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-text-muted mt-0.5">
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {lead.email}
                      </span>
                      {lead.subject && (
                        <span className="truncate max-w-[200px]">
                          {lead.subject}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-text-muted">
                    <span>{timeAgo(lead.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
