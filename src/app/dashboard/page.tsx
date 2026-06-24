import { createServerSupabase } from '@/lib/supabase/server';
import { ContentGrowthChart } from '@/components/dashboard/stats/content-growth-chart';
import { StatusDistributionChart } from '@/components/dashboard/stats/status-distribution-chart';
import { LeadsStatusChart } from '@/components/dashboard/stats/leads-status-chart';
import Link from 'next/link';
import {
  FileText,
  Briefcase,
  Newspaper,
  MessageSquare,
  Image as ImageIcon,
  Users,
  ArrowRight,
  Activity,
} from 'lucide-react';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

function getMonthKey(date: string) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function buildMonthlyCounts(records: { created_at: string }[], monthsBack = 6): number[] {
  const now = new Date();
  const buckets: Record<string, number> = {};

  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets[`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`] = 0;
  }

  for (const r of records) {
    const mk = getMonthKey(r.created_at);
    if (mk in buckets) buckets[mk]++;
  }

  return Object.values(buckets);
}

async function getDashboardData() {
  const supabase = await createServerSupabase();

  const [pagesCount, servicesCount, postsCount, leadsCount, mediaCount, usersCount] = await Promise.all([
    supabase.from('pages').select('*', { count: 'exact', head: true }),
    supabase.from('services').select('*', { count: 'exact', head: true }),
    supabase.from('posts').select('*', { count: 'exact', head: true }),
    supabase.from('contact_submissions').select('*', { count: 'exact', head: true }).eq('status', 'new'),
    supabase.from('media').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
  ]);

  const sixMonthsAgo = new Date(new Date().setMonth(new Date().getMonth() - 5)).toISOString();
  const [pagesGrowth, postsGrowth] = await Promise.all([
    supabase.from('pages').select('created_at').gte('created_at', sixMonthsAgo),
    supabase.from('posts').select('created_at').gte('created_at', sixMonthsAgo),
  ]);

  const pagesCounts = buildMonthlyCounts(pagesGrowth.data ?? []);
  const postsCounts = buildMonthlyCounts(postsGrowth.data ?? []);

  // Build last 6 month labels
  const now = new Date();
  const monthLabels: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthLabels.push(MONTH_NAMES[d.getMonth()]);
  }

  const monthlyData = monthLabels.map((month, i) => ({
    month,
    pages: pagesCounts[i] ?? 0,
    posts: postsCounts[i] ?? 0,
    services: 0,
  }));

  const [pageStatuses, postStatuses, serviceStatuses] = await Promise.all([
    supabase.from('pages').select('status'),
    supabase.from('posts').select('status'),
    supabase.from('services').select('status'),
  ]);

  const allStatuses = [
    ...(pageStatuses.data ?? []),
    ...(postStatuses.data ?? []),
    ...(serviceStatuses.data ?? []),
  ].map((r) => r.status);

  const statusCounts = allStatuses.reduce<Record<string, number>>((acc, s) => {
    acc[s] = (acc[s] ?? 0) + 1;
    return acc;
  }, {});

  const statusData = [
    { name: 'Published', value: statusCounts.published ?? 0, color: '#22c55e' },
    { name: 'Draft', value: statusCounts.draft ?? 0, color: '#f59e0b' },
    { name: 'Archived', value: statusCounts.archived ?? 0, color: '#666666' },
  ];

  const { data: leads } = await supabase.from('contact_submissions').select('status');
  const leadsByStatus = (leads ?? []).reduce<Record<string, number>>((acc, s) => {
    acc[s.status] = (acc[s.status] ?? 0) + 1;
    return acc;
  }, {});

  const leadsData = [
    { status: 'new', label: 'Baru', count: leadsByStatus.new ?? 0, color: '#f59e0b' },
    { status: 'contacted', label: 'Dihubungi', count: leadsByStatus.contacted ?? 0, color: '#3b82f6' },
    { status: 'resolved', label: 'Selesai', count: leadsByStatus.resolved ?? 0, color: '#22c55e' },
    { status: 'spam', label: 'Spam', count: leadsByStatus.spam ?? 0, color: '#ef4444' },
  ];

  const { data: recentActivity } = await supabase
    .from('audit_logs')
    .select('id, action, entity_type, created_at, user_id')
    .order('created_at', { ascending: false })
    .limit(8);

  const { data: recentLeads } = await supabase
    .from('contact_submissions')
    .select('id, name, email, subject, status, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  return {
    stats: {
      pages: pagesCount.count ?? 0,
      services: servicesCount.count ?? 0,
      posts: postsCount.count ?? 0,
      leads: leadsCount.count ?? 0,
      media: mediaCount.count ?? 0,
      users: usersCount.count ?? 0,
    },
    monthlyData,
    statusData,
    leadsData,
    recentActivity: recentActivity ?? [],
    recentLeads: recentLeads ?? [],
  };
}

const statCards = [
  { key: 'pages', label: 'Pages', icon: FileText },
  { key: 'services', label: 'Services', icon: Briefcase },
  { key: 'posts', label: 'Posts', icon: Newspaper },
  { key: 'leads', label: 'New Leads', icon: MessageSquare },
  { key: 'media', label: 'Media', icon: ImageIcon },
  { key: 'users', label: 'Users', icon: Users },
] as const;

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Baru saja';
  if (mins < 60) return `${mins} menit lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} hari lalu`;
  return new Date(date).toLocaleDateString('id-ID');
}

const statusColors: Record<string, string> = {
  new: 'bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/30',
  contacted: 'bg-[#3b82f6]/10 text-[#3b82f6] border-[#3b82f6]/30',
  resolved: 'bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e]/30',
  spam: 'bg-[#ef4444]/10 text-[#ef4444] border-[#ef4444]/30',
};

const statusLabels: Record<string, string> = {
  new: 'Baru',
  contacted: 'Dihubungi',
  resolved: 'Selesai',
  spam: 'Spam',
};

export default async function DashboardPage() {
  const { stats, monthlyData, statusData, leadsData, recentActivity, recentLeads } = await getDashboardData();

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#f5f5f5] tracking-tight">Dashboard Overview</h1>
        <p className="text-sm text-[#666] mt-1">Ringkasan konten dan aktivitas website</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        {statCards.map(({ key, label, icon: Icon }) => (
          <div
            key={key}
            className="border border-[#2a2a2a] bg-[#141414] p-4 rounded-sm hover:border-[#3a3a3a] transition-colors duration-200"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex h-8 w-8 items-center justify-center bg-[#1c1c1c] rounded-sm">
                <Icon className="h-4 w-4 text-[#a3a3a3]" />
              </div>
            </div>
            <p className="text-2xl font-bold text-[#f5f5f5]">{stats[key]}</p>
            <p className="text-xs text-[#666] mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Charts row 1 */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 border border-[#2a2a2a] bg-[#141414] rounded-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-[#f5f5f5]">Pertumbuhan Konten</h2>
              <p className="text-xs text-[#666] mt-0.5">Pages &amp; posts 6 bulan terakhir</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5 text-[#a3a3a3]">
                <span className="h-2 w-2 rounded-full bg-[#f5f5f5]" /> Pages
              </span>
              <span className="flex items-center gap-1.5 text-[#a3a3a3]">
                <span className="h-2 w-2 rounded-full bg-[#a3a3a3]" /> Posts
              </span>
            </div>
          </div>
          <ContentGrowthChart data={monthlyData} />
        </div>

        <div className="border border-[#2a2a2a] bg-[#141414] rounded-sm p-5">
          <h2 className="text-sm font-bold text-[#f5f5f5] mb-1">Distribusi Status</h2>
          <p className="text-xs text-[#666] mb-4">Semua jenis konten</p>
          <StatusDistributionChart data={statusData} />
          <div className="mt-4 space-y-2">
            {statusData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-[#a3a3a3]">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                  {item.name}
                </span>
                <span className="font-bold text-[#f5f5f5]">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-1 border border-[#2a2a2a] bg-[#141414] rounded-sm p-5">
          <h2 className="text-sm font-bold text-[#f5f5f5] mb-1">Leads per Status</h2>
          <p className="text-xs text-[#666] mb-4">Distribusi contact submissions</p>
          <LeadsStatusChart data={leadsData} />
        </div>

        <div className="lg:col-span-2 border border-[#2a2a2a] bg-[#141414] rounded-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-[#f5f5f5] flex items-center gap-2">
              <Activity className="h-4 w-4 text-[#a3a3a3]" />
              Aktivitas Terbaru
            </h2>
            <Link href="/dashboard/audit-logs" className="text-xs text-[#666] hover:text-[#f5f5f5] transition-colors">
              Lihat semua
            </Link>
          </div>
          {recentActivity.length > 0 ? (
            <div className="space-y-3">
              {recentActivity.map((log) => (
                <div key={log.id} className="flex items-center gap-3 text-sm border-b border-[#2a2a2a] pb-3 last:border-0 last:pb-0">
                  <div className="h-7 w-7 shrink-0 rounded-full bg-[#1c1c1c] flex items-center justify-center">
                    <span className="text-[10px] font-bold text-[#666] uppercase">
                      {log.action.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[#a3a3a3] truncate">
                      <span className="text-[#f5f5f5] font-medium capitalize">{log.action}</span>{' '}
                      <span className="text-[#666]">{log.entity_type}</span>
                    </p>
                  </div>
                  <span className="text-xs text-[#666] shrink-0">{timeAgo(log.created_at)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center py-12">
              <p className="text-sm text-[#666]">Belum ada aktivitas</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent leads */}
      <div className="border border-[#2a2a2a] bg-[#141414] rounded-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-[#f5f5f5]">Leads Terbaru</h2>
          <Link href="/dashboard/leads" className="text-xs text-[#666] hover:text-[#f5f5f5] transition-colors">
            Lihat semua
          </Link>
        </div>
        {recentLeads.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-[#666] uppercase tracking-wider border-b border-[#2a2a2a]">
                  <th className="pb-3 pr-4 font-medium">Nama</th>
                  <th className="pb-3 pr-4 font-medium">Email</th>
                  <th className="pb-3 pr-4 font-medium">Subjek</th>
                  <th className="pb-3 pr-4 font-medium">Status</th>
                  <th className="pb-3 font-medium">Waktu</th>
                </tr>
              </thead>
              <tbody>
                {recentLeads.map((lead) => (
                  <tr key={lead.id} className="border-b border-[#2a2a2a] last:border-0">
                    <td className="py-3 pr-4 text-[#f5f5f5] font-medium">{lead.name}</td>
                    <td className="py-3 pr-4 text-[#a3a3a3]">{lead.email}</td>
                    <td className="py-3 pr-4 text-[#a3a3a3]">{lead.subject ?? '-'}</td>
                    <td className="py-3 pr-4">
                      <span className={`inline-block rounded-sm border px-2 py-0.5 text-[11px] font-medium ${statusColors[lead.status]}`}>
                        {statusLabels[lead.status]}
                      </span>
                    </td>
                    <td className="py-3 text-[#666] text-xs">{timeAgo(lead.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex items-center justify-center py-12">
            <p className="text-sm text-[#666]">Belum ada leads</p>
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-sm font-bold text-[#f5f5f5] mb-3">Aksi Cepat</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { href: '/dashboard/hero', label: 'Edit Hero Slider', desc: 'Kelola banner utama' },
            { href: '/dashboard/pages', label: 'Kelola Pages', desc: 'Buat & edit halaman' },
            { href: '/dashboard/services', label: 'Tambah Service', desc: 'Kelola produk' },
            { href: '/dashboard/posts', label: 'Tulis Post', desc: 'Buat artikel baru' },
          ].map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="group border border-[#2a2a2a] bg-[#141414] p-4 rounded-sm hover:border-[#f5f5f5] transition-colors duration-200"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-bold text-[#f5f5f5]">{action.label}</p>
                  <p className="text-xs text-[#666] mt-1">{action.desc}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-[#666] group-hover:text-[#f5f5f5] transition-colors shrink-0" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
