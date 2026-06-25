import { createServerSupabase } from '@/lib/supabase/server';
import { Plus, FileText, ExternalLink, Copy, Trash2, Send, Archive, Pencil } from 'lucide-react';
import Link from 'next/link';
import { deletePage, duplicatePage, setPageStatus } from '@/actions/pages.actions';
import { formatDate } from '@/lib/utils';
import { PaginationControls } from '@/components/dashboard/pagination-controls';
import { clampPage, parsePageValue, parsePerPageValue } from '@/lib/pagination';
import { requireDashboardModuleAccess } from '@/lib/auth/helpers';
import { ToolbarFilters } from '@/components/dashboard/toolbar-filters';
import { ActionButton } from '@/components/dashboard/action-button';
import { resolvePagePublicPath } from '@/lib/page-public-path';
import type { NavigationItem } from '@/types';
import { ConfirmButton } from '@/components/ui/confirm-button';

async function getPages(searchParams?: Record<string, string | string[] | undefined>) {
  const supabase = await createServerSupabase();
  let query = supabase.from('pages').select('*', { count: 'exact' }).order('updated_at', { ascending: false });

  const search = typeof searchParams?.q === 'string' ? searchParams.q.trim() : '';
  const status = typeof searchParams?.status === 'string' ? searchParams.status : '';
  const requestedPage = parsePageValue(searchParams?.page);
  const perPage = parsePerPageValue(searchParams?.perPage);

  if (search) {
    query = query.or(`title.ilike.%${search}%,slug.ilike.%${search}%`);
  }
  if (status) {
    query = query.eq('status', status);
  }

  const { count } = await query;
  const totalItems = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage));
  const page = clampPage(requestedPage, totalPages);
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;
  const [{ data }, { data: navItems }] = await Promise.all([
    query.range(from, to),
    supabase.from('navigation_items').select('*').eq('location', 'header'),
  ]);

  const items = (data ?? []).map((page) => ({
    ...page,
    public_href: resolvePagePublicPath(page, (navItems ?? []) as NavigationItem[]),
  }));

  return {
    items,
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

export default async function PagesPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireDashboardModuleAccess('pages');
  const resolvedSearchParams = (await searchParams) ?? {};
  const pages = await getPages(resolvedSearchParams);
  const search = typeof resolvedSearchParams.q === 'string' ? resolvedSearchParams.q : '';
  const selectedStatus = typeof resolvedSearchParams.status === 'string' ? resolvedSearchParams.status : '';
  const query: Record<string, string> = {};

  if (search) query.q = search;
  if (selectedStatus) query.status = selectedStatus;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="rounded-sm border border-gray-200 bg-white p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Pages</h1>
            <p className="mt-1 text-sm text-gray-400">Manage static pages for the public website.</p>
          </div>
          <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center md:justify-end">
            <ToolbarFilters
              searchValue={search}
              searchPlaceholder="Search title or slug"
              filters={[
                {
                  name: 'status',
                  value: selectedStatus,
                  options: [
                    { label: 'All statuses', value: '' },
                    { label: 'Draft', value: 'draft' },
                    { label: 'Published', value: 'published' },
                    { label: 'Archived', value: 'archived' },
                  ],
                },
              ]}
            />
            <Link
              href="/dashboard/pages/builder"
              className="inline-flex items-center justify-center gap-1.5 rounded-sm bg-gray-900 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-[#1E1E1E]"
            >
              <Plus className="h-4 w-4" />
              New Page
            </Link>
          </div>
        </div>
      </div>

      {pages.items.length === 0 ? (
        <div className="border border-dashed border-gray-300 bg-white rounded-sm py-24 flex flex-col items-center justify-center">
          <FileText className="h-10 w-10 text-gray-300 mb-4" />
          <p className="text-sm text-gray-500">No pages yet</p>
          <p className="text-xs text-gray-400 mt-1">Create your first page to get started.</p>
        </div>
      ) : (
        <div className="rounded-sm border border-gray-200 bg-white">
          <div className="divide-y divide-gray-100">
            {pages.items.map((page) => (
              <PageRow key={page.id} page={page} />
            ))}
          </div>
          <PaginationControls
            mode="link"
            pathname="/dashboard/pages"
            query={query}
            page={pages.page}
            perPage={pages.perPage}
            totalItems={pages.totalItems}
            totalPages={pages.totalPages}
          />
        </div>
      )}
    </div>
  );
}

function PageRow({ page }: { page: Awaited<ReturnType<typeof getPages>>['items'][number] }) {
  const publicHref = page.public_href;
  const publicLabel = page.public_href;

  return (
    <div className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <Link href={`/dashboard/pages/builder?id=${page.id}`} className="text-sm font-bold text-gray-900 hover:text-[#1E1E1E] transition-colors">
            {page.title}
          </Link>
          <span className={`inline-block rounded-sm border px-2 py-0.5 text-[11px] font-medium ${statusStyles[page.status] ?? statusStyles.draft}`}>
            {page.status}
          </span>
        </div>
        <p className="text-xs text-gray-400 mt-1">{publicLabel}</p>
        <p className="text-[11px] text-gray-400 mt-1">Updated {formatDate(page.updated_at, 'dd MMM yyyy HH:mm')}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0 ml-4">
        <Link
          href={`/dashboard/pages/builder?id=${page.id}`}
          className="flex h-8 w-8 items-center justify-center rounded-sm border border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors"
          title="Edit"
        >
          <Pencil className="h-4 w-4" />
        </Link>
        <ActionButton
          action={duplicatePage.bind(null, page.id)}
          title="Duplicate"
          className="flex h-8 w-8 items-center justify-center rounded-sm border border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <Copy className="h-4 w-4" />
        </ActionButton>
        {page.status !== 'published' ? (
          <ActionButton
            action={setPageStatus.bind(null, page.id, 'published')}
            title="Publish"
            className="flex h-8 w-8 items-center justify-center rounded-sm border border-gray-200 text-gray-500 hover:text-green-600 hover:bg-green-50 transition-colors disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </ActionButton>
        ) : (
          <Link href={publicHref} target="_blank" className="flex h-8 w-8 items-center justify-center rounded-sm border border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors" title="View page">
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        )}
        <ConfirmButton
          title="Archive Page"
          description="This page will be hidden from public navigation and public routes."
          confirmLabel="Archive Page"
          variant="destructive"
          className="flex h-8 w-8 items-center justify-center rounded-sm border border-gray-200 bg-gray-50 text-gray-500 hover:bg-gray-100 hover:border-gray-300 hover:text-gray-700 transition-colors disabled:opacity-50"
          buttonTitle="Archive"
          refreshOnConfirm
          onConfirm={setPageStatus.bind(null, page.id, 'archived')}
        >
          <Archive className="h-4 w-4" />
        </ConfirmButton>
        <ConfirmButton
          title="Delete Page"
          description="This page and its sections will be deleted permanently."
          confirmLabel="Delete Page"
          variant="destructive"
          className="flex h-8 w-8 items-center justify-center rounded-sm border border-gray-200 text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
          buttonTitle="Delete"
          refreshOnConfirm
          onConfirm={deletePage.bind(null, page.id)}
        >
          <Trash2 className="h-4 w-4" />
        </ConfirmButton>
      </div>
    </div>
  );
}
