import Image from 'next/image';
import Link from 'next/link';
import { HeroSlider, type HeroSlide } from '@/components/public/hero-slider';
import { hasRichTextContent, RichTextRenderer } from '@/lib/rich-text';
import {
  FALLBACK_HOMEPAGE_SECTIONS,
  getPostCategoryLabel,
  getHeroSlides,
  getHomepageSections,
  getPublishedPosts,
  getPublishedServices,
} from '@/lib/public-content';
import type { PageSection } from '@/types';

const FALLBACK_HERO_SLIDES: HeroSlide[] = [
  {
    image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=1920&q=80',
    alt: 'Display koleksi denim Bison Denim',
    eyebrow: 'Bison Denim',
    title: 'BISON DENIM',
    description: 'Penyedia pakaian denim, kemeja, hoodie, dan produk fashion berkualitas untuk Indonesia.',
    cta: { label: 'Lihat Produk', href: '/services' },
  },
  {
    image: 'https://images.unsplash.com/photo-1603252109303-2751441dd157?auto=format&fit=crop&w=1920&q=80',
    alt: 'Model mengenakan kemeja premium Bison Denim',
    eyebrow: 'Koleksi Favorit',
    title: 'KEMEJA PREMIUM',
    description: 'Potongan modern dan bahan nyaman untuk tampilan rapi setiap hari.',
    cta: { label: 'Lihat Produk', href: '/services/custom-tailoring' },
  },
  {
    image: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=1920&q=80',
    alt: 'Koleksi hoodie dan sweater Bison Denim',
    eyebrow: 'Edisi Terbatas',
    title: 'HOODIE & SWEATER',
    description: 'Nyaman dan kekinian untuk gaya santai sehari-hari musim ini.',
    cta: { label: 'Belanja Sekarang', href: '/services' },
  },
];

function getSectionContent(section: PageSection) {
  return (section.content ?? {}) as Record<string, unknown>;
}

function getText(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

function getNumber(value: unknown, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function renderSection(
  section: PageSection,
  context: {
    services: Awaited<ReturnType<typeof getPublishedServices>>;
    posts: Awaited<ReturnType<typeof getPublishedPosts>>;
  }
) {
  const content = getSectionContent(section);

  switch (section.section_type) {
    case 'intro':
      return (
        <section key={section.id} className="px-6 py-24">
          <div className="mx-auto grid max-w-7xl items-center gap-16 md:grid-cols-2">
            <div>
              <h2 className="mb-6 text-3xl font-bold leading-tight text-black sm:text-4xl">
                {getText(content.title, 'Tentang Kami')}
              </h2>
              <RichTextRenderer
                content={hasRichTextContent(content.body) ? content.body : ''}
                className="text-base leading-relaxed text-[#555]"
              />
              {getText(content.link_label) && getText(content.link_href) && (
                <Link
                  href={getText(content.link_href)}
                  className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-black transition-colors duration-200 hover:opacity-60"
                >
                  {getText(content.link_label)} &rarr;
                </Link>
              )}
            </div>
            <div>
              <div className="relative aspect-[4/3] border border-[#d4d4d4] bg-[#f5f5f5]">
                {getText(content.image) ? (
                  <Image
                    src={getText(content.image)}
                    alt={getText(content.title, 'Section image')}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-[#777]">
                    Tambahkan gambar section dari page builder
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      );
    case 'services': {
      const limit = getNumber(content.limit, 5);
      const services = context.services.slice(0, limit);

      return (
        <section key={section.id} className="bg-[#f5f5f5] px-6 py-24">
          <div className="mx-auto max-w-7xl">
            <div className="mb-14">
              <h2 className="text-3xl font-bold text-black sm:text-4xl">
                {getText(content.title, 'Produk Kami')}
              </h2>
              <RichTextRenderer
                content={hasRichTextContent(content.description) ? content.description : ''}
                className="mt-3 max-w-xl text-base leading-relaxed text-[#555]"
              />
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {services.map((item) => (
                <Link
                  key={item.id}
                  href={`/services/${item.slug}`}
                  className="card-interactive block border border-[#d4d4d4] bg-white transition-colors duration-200 hover:border-black"
                >
                  <div className="relative aspect-[4/3] bg-[#f5f5f5]">
                    {item.cover_image_url ? (
                      <Image src={item.cover_image_url} alt={item.title} fill className="object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-[#777]">No image</div>
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="mb-1.5 text-sm font-bold text-black">{item.title}</h3>
                    <p className="text-xs leading-relaxed text-[#555]">{item.excerpt ?? ''}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      );
    }
    case 'news': {
      const limit = getNumber(content.limit, 4);
      const posts = context.posts.slice(0, limit);

      return (
        <section key={section.id} className="border-t border-[#d4d4d4] bg-[#f5f5f5] px-6 py-24">
          <div className="mx-auto max-w-7xl">
            <div className="mb-12 flex items-end justify-between gap-6">
              <div>
                <h2 className="text-3xl font-bold text-black sm:text-4xl">
                  {getText(content.title, 'Berita Terbaru')}
                </h2>
                <RichTextRenderer
                  content={hasRichTextContent(content.description) ? content.description : ''}
                  className="mt-3 text-base leading-relaxed text-[#555]"
                />
              </div>
              <Link href="/news" className="text-sm font-bold text-black transition-colors duration-200 hover:opacity-60">
                Lihat Semua &rarr;
              </Link>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {posts.map((item) => (
                <Link
                  key={item.id}
                  href={`/news/${item.slug}`}
                  className="card-interactive block border border-[#d4d4d4] bg-white transition-colors duration-200 hover:border-black"
                >
                  <div className="relative aspect-[4/3] bg-[#f5f5f5]">
                    {item.cover_image_url ? (
                      <Image src={item.cover_image_url} alt={item.title} fill className="object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-[#777]">No image</div>
                    )}
                  </div>
                  <div className="p-5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#555]">
                      {getPostCategoryLabel(item)}
                    </span>
                    <h3 className="mt-1 text-sm font-bold leading-snug text-black">{item.title}</h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      );
    }
    case 'cta':
      return (
        <section key={section.id} className="bg-black px-6 py-24">
          <div className="mx-auto max-w-7xl text-center">
            <h2 className="mb-4 text-3xl font-bold text-white">
              {getText(content.title, 'Hubungi Kami')}
            </h2>
            <RichTextRenderer
              content={hasRichTextContent(content.description) ? content.description : ''}
              className="mx-auto mb-8 max-w-xl text-base leading-relaxed text-white/70 [&_h2]:text-white [&_h3]:text-white [&_h4]:text-white [&_a]:text-white"
            />
            <Link
              href={getText(content.button_href, '/contact-us')}
              className="inline-flex items-center gap-2 bg-white px-6 py-3 text-sm font-bold text-black transition-colors duration-200 hover:bg-gray-100"
            >
              {getText(content.button_label, 'Hubungi Kami')} &rarr;
            </Link>
          </div>
        </section>
      );
    default:
      return null;
  }
}

export default async function HomePage() {
  const [heroSlides, homepage, services, posts] = await Promise.all([
    getHeroSlides(),
    getHomepageSections(),
    getPublishedServices(10),
    getPublishedPosts(10),
  ]);

  const sections = homepage.sections.length > 0 ? homepage.sections : FALLBACK_HOMEPAGE_SECTIONS;

  const renderedSections = sections
    .map((section) => renderSection(section, { services, posts }))
    .filter(Boolean);

  return (
    <>
      <HeroSlider slides={heroSlides.length > 0 ? heroSlides : FALLBACK_HERO_SLIDES} />

      {renderedSections}
    </>
  );
}
