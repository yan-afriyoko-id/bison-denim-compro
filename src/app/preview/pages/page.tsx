import { notFound } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase/server';
import { PublicPageSections } from '@/components/public/page-sections';
import { getPublishedPosts, getPublishedServices } from '@/lib/public-content';
import type { PageSection } from '@/types';

export default async function PreviewPageBuilderPage({
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
    notFound();
  }

  return <PublicPageSections sections={(sections ?? []) as PageSection[]} services={services} posts={posts} />;
}
