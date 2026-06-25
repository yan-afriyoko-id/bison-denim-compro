import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPostCategoryLabel } from '@/lib/public-content-shared';
import { hasRichTextContent, RichTextRenderer } from '@/lib/rich-text';
import { formatDate } from '@/lib/utils';
import { getPublishedPageByPath, getPublishedPostBySlug, getPublishedPosts, getPublishedServices, normalizePostContent } from '@/lib/public-content';
import { PublicPageSections } from '@/components/public/page-sections';
import type { PageSection } from '@/types';

export default async function NewsDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPublishedPostBySlug(slug);

  if (!post) {
    const [pageResult, services, posts] = await Promise.all([
      getPublishedPageByPath(`news/${slug}`),
      getPublishedServices(10),
      getPublishedPosts(10),
    ]);

    if (!pageResult.page) {
      notFound();
    }

    return <PublicPageSections sections={pageResult.sections as PageSection[]} services={services} posts={posts} />;
  }

  const content = normalizePostContent(post.content);
  const bodyContent = hasRichTextContent(content.text) ? content.text : post.excerpt || '';

  return (
    <>
      <section className="relative h-[340px] bg-[#1E1E1E]">
        {post.cover_image_url && (
          <Image src={post.cover_image_url} alt={post.title} fill className="object-cover opacity-60" priority />
        )}
        <div className="absolute inset-0 flex items-center">
          <div className="mx-auto w-full max-w-7xl px-6">
            <span className="text-sm font-bold uppercase tracking-wider text-white/80">{getPostCategoryLabel(post)}</span>
            <h1 className="mt-2 max-w-3xl text-3xl font-bold text-white sm:text-4xl">{post.title}</h1>
            <p className="mt-3 text-sm text-white/60">
              {post.published_at ? formatDate(post.published_at, 'dd MMM yyyy') : '-'}
            </p>
          </div>
        </div>
      </section>

      <section className="px-6 py-24">
        <div className="mx-auto max-w-3xl">
          <RichTextRenderer
            content={bodyContent}
            className="text-base leading-relaxed text-[#555]"
          />
          <div className="mt-12 border-t border-[#d4d4d4] pt-8">
            <Link href="/news" className="text-sm text-[#555] transition-colors duration-200">
              &larr; Kembali ke Berita
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
