import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { createServerSupabase } from '@/lib/supabase/server';
import { getPublishedPosts, getPublishedServices } from '@/lib/public-content';
import { PublicPageSections } from '@/components/public/page-sections';
import type { PageSection } from '@/types';

export default async function PageBuilderPreviewPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const pageId = typeof resolvedSearchParams.id === 'string' ? resolvedSearchParams.id : '';
  const supabase = await createServerSupabase();

  const [{ data: page }, { data: sections }, services, posts] = await Promise.all([
    supabase.from('pages').select('*').eq('id', pageId).maybeSingle(),
    supabase.from('page_sections').select('*').eq('page_id', pageId).eq('is_visible', true).order('sort_order', { ascending: true }),
    getPublishedServices(10),
    getPublishedPosts(10),
  ]);

  if (!page) {
    return <div className="py-24 text-center text-sm text-gray-500">Page not found</div>;
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="sticky top-0 z-50 border-b border-amber-200 bg-amber-50 px-6 py-3">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="text-sm font-semibold text-amber-800">Preview Mode - {page.title}</div>
          <Link href={`/dashboard/pages/builder?id=${page.id}`} className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 transition-colors hover:text-amber-900">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </Link>
        </div>
      </div>
      <PublicPageSections sections={(sections ?? []) as PageSection[]} services={services} posts={posts} />
    </div>
  );
}
