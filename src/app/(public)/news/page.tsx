import { NewsList } from '@/components/public/news-list';
import { getPublishedPosts, getPublicSiteSettings } from '@/lib/public-content';

export default async function NewsPage() {
  const [posts, { grouped }] = await Promise.all([
    getPublishedPosts(),
    getPublicSiteSettings(),
  ]);

  return (
    <>
      <section className="border-b border-[#d4d4d4] px-6 py-24">
        <div className="mx-auto max-w-7xl text-center">
          <h1 className="mb-4 text-4xl font-bold text-black sm:text-5xl">Berita</h1>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-[#555]">
            Informasi terbaru seputar produk dan kegiatan {grouped.brand.site_name || 'Bison Denim'}.
          </p>
        </div>
      </section>

      <section className="px-6 py-24">
        <div className="mx-auto max-w-7xl">
          {posts.length === 0 ? (
            <div className="border border-dashed border-[#d4d4d4] px-6 py-20 text-center">
              <p className="text-sm text-[#555]">Belum ada berita yang dipublikasikan.</p>
            </div>
          ) : (
            <NewsList posts={posts} />
          )}
        </div>
      </section>
    </>
  );
}
