import { notFound } from 'next/navigation';
import { PublicPageSections } from '@/components/public/page-sections';
import { getPublishedPageByPath, getPublishedPosts, getPublishedServices } from '@/lib/public-content';

export default async function DynamicPublicPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const path = slug.join('/');
  const [{ page, sections }, services, posts] = await Promise.all([
    getPublishedPageByPath(path),
    getPublishedServices(10),
    getPublishedPosts(10),
  ]);

  if (!page) {
    notFound();
  }

  return <PublicPageSections sections={sections} services={services} posts={posts} />;
}
