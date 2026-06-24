import { createServerSupabase } from '@/lib/supabase/server';
import { Plus, Wrench } from 'lucide-react';
import Link from 'next/link';

async function getServices() {
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from('services')
    .select('*')
    .order('sort_order', { ascending: true });
  return data ?? [];
}

const statusStyles: Record<string, string> = {
  published: 'bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e]/30',
  draft: 'bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/30',
  archived: 'bg-[#666]/10 text-[#666] border-[#666]/30',
};

export default async function ServicesPage() {
  const services = await getServices();

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#f5f5f5] tracking-tight">Services</h1>
          <p className="text-sm text-[#666] mt-1">Kelola produk & layanan yang ditampilkan</p>
        </div>
        <Link
          href="/dashboard/services/new"
          className="flex items-center gap-1.5 bg-[#f5f5f5] text-[#0a0a0a] px-4 py-2 text-xs font-bold rounded-sm hover:bg-white transition-colors"
        >
          <Plus className="h-4 w-4" />
          Service Baru
        </Link>
      </div>

      {services.length === 0 ? (
        <div className="border border-dashed border-[#2a2a2a] bg-[#141414] rounded-sm py-24 flex flex-col items-center justify-center">
          <Wrench className="h-10 w-10 text-[#3a3a3a] mb-4" />
          <p className="text-sm text-[#a3a3a3]">Belum ada service</p>
          <p className="text-xs text-[#666] mt-1">Buat service pertama Anda</p>
        </div>
      ) : (
        <div className="border border-[#2a2a2a] bg-[#141414] rounded-sm divide-y divide-[#2a2a2a]">
          {services.map((service) => (
            <div
              key={service.id}
              className="flex items-center justify-between px-5 py-4 hover:bg-[#1c1c1c] transition-colors group"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Link
                    href={`/dashboard/services/${service.id}`}
                    className="text-sm font-bold text-[#f5f5f5] hover:text-white transition-colors"
                  >
                    {service.title}
                  </Link>
                  <span className={`inline-block rounded-sm border px-2 py-0.5 text-[11px] font-medium ${statusStyles[service.status] ?? statusStyles.draft}`}>
                    {service.status}
                  </span>
                  {service.is_featured && (
                    <span className="inline-block rounded-sm bg-[#3b82f6]/10 text-[#3b82f6] border border-[#3b82f6]/30 px-2 py-0.5 text-[11px] font-medium">
                      featured
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#666] mt-1 truncate">
                  {service.excerpt || `/${service.slug}`}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0 ml-4">
                <span className="text-xs text-[#666] hidden sm:inline">Urutan: {service.sort_order}</span>
                <Link
                  href={`/dashboard/services/${service.id}`}
                  className="text-xs font-semibold text-[#a3a3a3] hover:text-[#f5f5f5] transition-colors"
                >
                  Edit
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
