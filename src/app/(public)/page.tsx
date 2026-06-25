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
    description: 'Quality denim, shirts, hoodies, and fashion essentials for everyday wear.',
    cta: { label: 'Shop Now', href: '/services' },
  },
  {
    image: 'https://images.unsplash.com/photo-1603252109303-2751441dd157?auto=format&fit=crop&w=1920&q=80',
    alt: 'Model mengenakan kemeja premium Bison Denim',
    eyebrow: 'Featured Collection',
    title: 'PREMIUM SHIRTS',
    description: 'Modern cuts and comfortable fabrics for a sharp everyday look.',
    cta: { label: 'Explore Shirts', href: '/services/custom-tailoring' },
  },
  {
    image: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=1920&q=80',
    alt: 'Koleksi hoodie dan sweater Bison Denim',
    eyebrow: 'Limited Edition',
    title: 'HOODIE & SWEATER',
    description: 'Comfortable and current pieces made for easy everyday style.',
    cta: { label: 'Shop Now', href: '/services' },
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
      const primaryImage = getText(content.image);
      const secondaryImage =
        getText(content.secondary_image) ||
        'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1200&q=80';

      return (
        <section key={section.id} className="px-6 py-24">
          <div className="mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <h2 className="mb-6 text-3xl font-bold leading-tight text-[#1E1E1E] sm:text-4xl">
                {getText(content.title, 'About Us')}
              </h2>
              <RichTextRenderer
                content={hasRichTextContent(content.body) ? content.body : ''}
                className="max-w-xl text-base leading-relaxed text-[#555]"
              />
              {getText(content.link_label) && getText(content.link_href) && (
                <Link
                  href={getText(content.link_href)}
                  className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-[#1E1E1E] transition-colors duration-200 hover:opacity-60"
                >
                  {getText(content.link_label)} &rarr;
                </Link>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="relative aspect-[3/4] overflow-hidden border border-[#d4d4d4] bg-[#f5f5f5]">
                {primaryImage ? (
                  <Image
                    src={primaryImage}
                    alt={getText(content.title, 'About image')}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-[#777]">
                    Add image from page builder
                  </div>
                )}
              </div>
              <div className="relative aspect-[3/4] overflow-hidden border border-[#d4d4d4] bg-[#f5f5f5]">
                <Image
                  src={secondaryImage}
                  alt={`${getText(content.title, 'About Us')} secondary`}
                  fill
                  className="object-cover"
                />
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
              <h2 className="text-3xl font-bold text-[#1E1E1E] sm:text-4xl">
                {getText(content.title, 'Our Products')}
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
                  className="card-interactive block border border-[#d4d4d4] bg-white transition-colors duration-200 hover:border-[#1E1E1E]"
                >
                  <div className="relative aspect-[4/3] bg-[#f5f5f5]">
                    {item.cover_image_url ? (
                      <Image src={item.cover_image_url} alt={item.title} fill className="object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-[#777]">No image</div>
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="mb-1.5 text-sm font-bold text-[#1E1E1E]">{item.title}</h3>
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
                <h2 className="text-3xl font-bold text-[#1E1E1E] sm:text-4xl">
                  {getText(content.title, 'Latest News')}
                </h2>
                <RichTextRenderer
                  content={hasRichTextContent(content.description) ? content.description : ''}
                  className="mt-3 text-base leading-relaxed text-[#555]"
                />
              </div>
              <Link href="/news" className="text-sm font-bold text-[#1E1E1E] transition-colors duration-200 hover:opacity-60">
                View All &rarr;
              </Link>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {posts.map((item) => (
                <Link
                  key={item.id}
                  href={`/news/${item.slug}`}
                  className="card-interactive block border border-[#d4d4d4] bg-white transition-colors duration-200 hover:border-[#1E1E1E]"
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
                    <h3 className="mt-1 text-sm font-bold leading-snug text-[#1E1E1E]">{item.title}</h3>
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
        <section key={section.id} className="bg-[#1E1E1E] px-6 py-24">
          <div className="mx-auto max-w-7xl text-center">
            <h2 className="mb-4 text-3xl font-bold text-white">
              {getText(content.title, 'Contact Us')}
            </h2>
            <RichTextRenderer
              content={hasRichTextContent(content.description) ? content.description : ''}
              className="mx-auto mb-8 max-w-xl text-base leading-relaxed text-white [&_h2]:text-white [&_h3]:text-white [&_h4]:text-white [&_a]:text-white"
            />
            <Link
              href={getText(content.button_href, '/contact-us')}
              className="inline-flex items-center gap-2 bg-white px-6 py-3 text-sm font-bold text-[#1E1E1E] transition-colors duration-200 hover:bg-gray-100"
            >
              {getText(content.button_label, 'Contact Us')} &rarr;
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
