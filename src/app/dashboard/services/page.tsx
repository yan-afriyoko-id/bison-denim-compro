import { createServerSupabase } from '@/lib/supabase/server';
import { Plus, Wrench, Copy, Eye, Archive, Send, Pencil } from 'lucide-react';
import Link from 'next/link';
import { duplicateService, setServiceStatus } from '@/actions/services.actions';
import { formatDate } from '@/lib/utils';
import { PaginationControls } from '@/components/dashboard/pagination-controls';
import { clampPage, parsePageValue, parsePerPageValue } from '@/lib/pagination';
import { requireDashboardModuleAccess } from '@/lib/auth/helpers';
import { ToolbarFilters } from '@/components/dashboard/toolbar-filters';
import { ActionButton } from '@/components/dashboard/action-button';

async function getServices(searchParams?: Record<string, string | string[] | undefined>) {
  const supabase = await createServerSupabase();
  let query = supabase
    .from('services')
    .select('*', { count: 'exact' })
    .order('sort_order', { ascending: true });

  const search = typeof searchParams?.q === 'string' ? searchParams.q.trim() : '';
  const status = typeof searchParams?.status === 'string' ? searchParams.status : '';
  const featured = typeof searchParams?.featured === 'string' ? searchParams.featured : '';
  const requestedPage = parsePageValue(searchParams?.page);
  const perPage = parsePerPageValue(searchParams?.perPage);

  if (search) {
    query = query.or(`title.ilike.%${search}%,slug.ilike.%${search}%`);
  }
  if (status) {
    query = query.eq('status', status);
  }
  if (featured === 'featured') {
    query = query.eq('is_featured', true);
  }
  if (featured === 'regular') {
    query = query.eq('is_featured', false);
  }

  const { count } = await query;
  const totalItems = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage));
  const page = clampPage(requestedPage, totalPages);
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;
  const { data } = await query.range(from, to);

  return {
    items: data ?? [],
    page,
    perPage,
    totalItems,
    totalPages,
  };
}

const statusStyles: Record<string, string> = {
  published: 'bg-green-50 text-green-700 border-green-200',
  draft: 'bg-amber-50 text-amber-700 border-amber-200',
  archived: 'bg-gray-50 text-gray-500 border-gray-200',
};

export default async function ServicesPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireDashboardModuleAccess('services');
  const resolvedSearchParams = (await searchParams) ?? {};
  const services = await getServices(resolvedSearchParams);
  const search = typeof resolvedSearchParams.q === 'string' ? resolvedSearchParams.q : '';
  const selectedStatus = typeof resolvedSearchParams.status === 'string' ? resolvedSearchParams.status : '';
  const selectedFeatured = typeof resolvedSearchParams.featured === 'string' ? resolvedSearchParams.featured : '';
  const query: Record<string, string> = {};

  if (search) query.q = search;
  if (selectedStatus) query.status = selectedStatus;
  if (selectedFeatured) query.featured = selectedFeatured;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="rounded-sm border border-gray-200 bg-white p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Services</h1>
            <p className="mt-1 text-sm text-gray-400">Kelola produk & layanan yang ditampilkan</p>
          </div>
          <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center md:justify-end">
            <ToolbarFilters
              searchValue={search}
              searchPlaceholder="Cari judul atau slug"
              filters={[
                {
                  name: 'status',
                  value: selectedStatus,
                  options: [
                    { label: 'Semua status', value: '' },
                    { label: 'Draft', value: 'draft' },
                    { label: 'Published', value: 'published' },
                    { label: 'Archived', value: 'archived' },
                  ],
                },
                {
                  name: 'featured',
                  value: selectedFeatured,
                  options: [
                    { label: 'Semua tipe', value: '' },
                    { label: 'Featured', value: 'featured' },
                    { label: 'Regular', value: 'regular' },
                  ],
                },
              ]}
            />
            <Link
              href="/dashboard/services/new"
              className="inline-flex items-center justify-center gap-1.5 rounded-sm bg-gray-900 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-black"
            >
              <Plus className="h-4 w-4" />
              Service Baru
            </Link>
          </div>
        </div>
      </div>

      {services.items.length === 0 ? (
        <div className="border border-dashed border-gray-300 bg-white rounded-sm py-24 flex flex-col items-center justify-center">
          <Wrench className="h-10 w-10 text-gray-300 mb-4" />
          <p className="text-sm text-gray-500">Belum ada service</p>
          <p className="text-xs text-gray-400 mt-1">Buat service pertama Anda</p>
        </div>
      ) : (
        <div className="rounded-sm border border-gray-200 bg-white">
          <div className="divide-y divide-gray-100">
            {services.items.map((service) => (
              <ServiceRow key={service.id} service={service} />
            ))}
          </div>
          <PaginationControls
            mode="link"
            pathname="/dashboard/services"
            query={query}
            page={services.page}
            perPage={services.perPage}
            totalItems={services.totalItems}
            totalPages={services.totalPages}
          />
        </div>
      )}
    </div>
  );
}

function ServiceRow({ service }: { service: Awaited<ReturnType<typeof getServices>>['items'][number] }) {
  return (
    <div className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors group">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href={`/dashboard/services/${service.id}`}
            className="text-sm font-bold text-gray-900 hover:text-black transition-colors"
          >
            {service.title}
          </Link>
          <span className={`inline-block rounded-sm border px-2 py-0.5 text-[11px] font-medium ${statusStyles[service.status] ?? statusStyles.draft}`}>
            {service.status}
          </span>
          {service.is_featured && (
            <span className="inline-block rounded-sm bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 text-[11px] font-medium">
              featured
            </span>
          )}
        </div>
        <p className="text-xs text-gray-400 mt-1 truncate">
          {service.excerpt || `/${service.slug}`}
        </p>
      </div>
      <div className="flex items-center gap-3 shrink-0 ml-4">
        <div className="hidden text-right sm:block">
          <span className="block text-xs text-gray-400">Urutan: {service.sort_order}</span>
          {service.published_at && (
            <span className="block text-[11px] text-gray-400">{formatDate(service.published_at)}</span>
          )}
        </div>
        <Link
          href={`/dashboard/services/${service.id}`}
          className="flex h-8 w-8 items-center justify-center rounded-sm border border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors"
          title="Edit"
        >
          <Pencil className="h-4 w-4" />
        </Link>
        <ActionButton
          action={duplicateService.bind(null, service.id)}
          title="Duplicate"
          className="flex h-8 w-8 items-center justify-center rounded-sm border border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <Copy className="h-4 w-4" />
        </ActionButton>
        {service.status !== 'published' ? (
          <ActionButton
            action={setServiceStatus.bind(null, service.id, 'published')}
            title="Publish"
            className="flex h-8 w-8 items-center justify-center rounded-sm border border-gray-200 text-gray-500 hover:text-green-600 hover:bg-green-50 transition-colors disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </ActionButton>
        ) : (
          <Link href={`/services/${service.slug}`} target="_blank" className="flex h-8 w-8 items-center justify-center rounded-sm border border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors" title="Preview">
            <Eye className="h-4 w-4" />
          </Link>
        )}
        <ActionButton
          action={setServiceStatus.bind(null, service.id, 'archived')}
          title="Archive"
          className="flex h-8 w-8 items-center justify-center rounded-sm border border-gray-200 bg-gray-50 text-gray-500 hover:bg-gray-100 hover:border-gray-300 hover:text-gray-700 transition-colors disabled:opacity-50"
        >
          <Archive className="h-4 w-4" />
        </ActionButton>
      </div>
    </div>
  );
}
