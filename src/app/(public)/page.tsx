import Image from 'next/image';
import Link from 'next/link';
import { createServerSupabase } from '@/lib/supabase/server';
import { HeroSlider, type HeroSlide } from '@/components/public/hero-slider';

// Fallback data (used when DB is empty)
const FALLBACK_HERO_SLIDES: HeroSlide[] = [
  {
    image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=1920&q=80',
    alt: 'Display koleksi denim Bison Denim',
    eyebrow: 'Sejak 1998',
    title: 'BISON DENIM',
    description: 'Penyedia pakaian denim, kemeja, hoodie, dan produk fashion berkualitas.',
    cta: { label: 'Lihat Produk', href: '/services' },
  },
  {
    image: 'https://images.unsplash.com/photo-1603252109303-2751441dd157?auto=format&fit=crop&w=1920&q=80',
    alt: 'Display kemeja premium Bison Denim',
    eyebrow: 'Premium Quality',
    title: 'KEMEJA PREMIUM',
    description: 'Bahan katun pilihan dengan potongan modern dan klasik untuk gaya setiap hari.',
    cta: { label: 'Jelajahi Kemeja', href: '/services' },
  },
  {
    image: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=1920&q=80',
    alt: 'Display hoodie edisi terbatas Bison Denim',
    eyebrow: 'Edisi Terbatas',
    title: 'HOODIE & SWEATER',
    description: 'Nyaman dan kekinian untuk gaya santai sehari-hari musim ini.',
    cta: { label: 'Belanja Sekarang', href: '/services' },
  },
];

const FALLBACK_SERVICES = [
  {
    title: 'Denim Collection',
    description: 'Koleksi celana dan jaket denim berkualitas tinggi untuk gaya kasual hingga formal.',
    image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=1200&q=80',
    slug: 'denim-collection',
  },
  {
    title: 'Kemeja',
    description: 'Kemeja pria dan wanita dari bahan premium dengan potongan modern dan klasik.',
    image: 'https://images.unsplash.com/photo-1603252109303-2751441dd157?auto=format&fit=crop&w=1200&q=80',
    slug: 'custom-tailoring',
  },
  {
    title: 'Hoodie & Sweater',
    description: 'Hoodie dan sweater nyaman dengan desain kekinian untuk gaya santai sehari-hari.',
    image: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=1200&q=80',
    slug: 'wholesale-supply',
  },
  {
    title: 'Aksesori Fashion',
    description: 'Topi, tas, dan aksesori denim pelengkap gaya Anda.',
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=80',
    slug: 'sustainable-fashion',
  },
  {
    title: 'Produk Lainnya',
    description: 'Berbagai produk fashion berkualitas untuk kebutuhan Anda.',
    image: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=1200&q=80',
    slug: 'brand-collaboration',
  },
];

const FALLBACK_NEWS = [
  {
    image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=1200&q=80',
    category: 'PRODUK',
    title: 'Koleksi Denim Terbaru Telah Hadir',
    slug: 'koleksi-denim-terbaru',
  },
  {
    image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=1200&q=80',
    category: 'PRODUK',
    title: 'Kemeja Premium Bahan Katun Pilihan',
    slug: 'kemeja-premium-katun',
  },
  {
    image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=1200&q=80',
    category: 'PRODUK',
    title: 'Hoodie Edisi Terbatas Musim Ini',
    slug: 'hoodie-edisi-terbatas',
  },
  {
    image: 'https://images.unsplash.com/photo-1523398002811-999ca8dec234?auto=format&fit=crop&w=1200&q=80',
    category: 'KEGIATAN',
    title: 'Bison Denim di Pameran Fashion 2026',
    slug: 'bison-denim-pameran-fashion-2026',
  },
];

async function getLandingData() {
  const supabase = await createServerSupabase();

  // Fetch hero slides
  const { data: heroData } = await supabase
    .from('homepage_sections')
    .select('settings, is_visible')
    .eq('section_key', 'hero_slider')
    .eq('is_visible', true)
    .order('sort_order', { ascending: true });

  const heroSlides: HeroSlide[] = (heroData ?? []).map((item) => {
    const s = item.settings as Record<string, string>;
    return {
      image: s.image || '',
      alt: s.alt || s.title || '',
      eyebrow: s.eyebrow || undefined,
      title: s.title || '',
      description: s.description || '',
      cta: s.cta_label ? { label: s.cta_label, href: s.cta_href || '/services' } : undefined,
    };
  });

  // Fetch published services
  const { data: servicesData } = await supabase
    .from('services')
    .select('title, slug, excerpt, cover_image_url')
    .eq('status', 'published')
    .order('sort_order', { ascending: true })
    .limit(5);

  const services = (servicesData ?? []).map((s) => ({
    title: s.title,
    description: s.excerpt || '',
    image: s.cover_image_url || '',
    slug: s.slug,
  }));

  // Fetch published posts
  const { data: postsData } = await supabase
    .from('posts')
    .select('title, slug, excerpt, cover_image_url')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(4);

  const news = (postsData ?? []).map((p) => ({
    title: p.title,
    description: p.excerpt || '',
    image: p.cover_image_url || '',
    slug: p.slug,
    category: 'BERITA',
  }));

  return {
    heroSlides: heroSlides.length > 0 ? heroSlides : FALLBACK_HERO_SLIDES,
    services: services.length > 0 ? services : FALLBACK_SERVICES,
    news: news.length > 0 ? news : FALLBACK_NEWS,
  };
}

export default async function HomePage() {
  const { heroSlides, services, news } = await getLandingData();

  return (
    <>
      <HeroSlider slides={heroSlides} />

      <section className="py-24 px-6">
        <div className="mx-auto max-w-7xl">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-black leading-tight mb-6">
                Tentang Kami
              </h2>
              <p className="text-[#555] text-base leading-relaxed mb-5">
                Bison Denim adalah perusahaan fashion Indonesia yang bergerak di bidang penjualan
                pakaian denim, kemeja, hoodie, dan berbagai produk fashion lainnya. Berdiri
                sejak 1998 di Bandung, kami berkomitmen menghadirkan produk berkualitas dengan
                harga terjangkau untuk semua kalangan.
              </p>
              <p className="text-[#555] text-base leading-relaxed mb-5">
                Dengan jaringan distribusi yang luas dan pengalaman lebih dari dua dekade,
                Bison Denim telah menjadi pilihan utama bagi konsumen yang mencari produk
                fashion denim dan non-denim yang terpercaya di Indonesia.
              </p>
              <Link
                href="/about/company-information"
                className="inline-flex items-center gap-2 text-black font-bold text-sm hover:opacity-60 transition-colors duration-200"
              >
                Pelajari Selengkapnya &rarr;
              </Link>
            </div>
            <div>
              <div className="relative aspect-[4/3] border border-[#d4d4d4]">
                <Image
                  src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80"
                  alt="Display produk Bison Denim"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 px-6 bg-[#f5f5f5]">
        <div className="mx-auto max-w-7xl">
          <div className="mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-black">
              Produk Kami
            </h2>
            <p className="text-[#555] text-base mt-3 max-w-xl leading-relaxed">
              Berbagai pilihan produk fashion untuk memenuhi kebutuhan Anda.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
            {services.map((item) => (
              <Link
                key={item.slug}
                href={`/services/${item.slug}`}
                className="card-interactive block border border-[#d4d4d4] bg-white transition-colors duration-200 hover:border-black"
              >
                <div className="relative aspect-[4/3]">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-5">
                  <h3 className="text-sm font-bold text-black mb-1.5">{item.title}</h3>
                  <p className="text-[#555] text-xs leading-relaxed">{item.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-6 bg-[#f5f5f5] border-t border-[#d4d4d4]">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-black">
                Berita Terbaru
              </h2>
              <p className="text-[#555] text-base mt-3 leading-relaxed">
                Informasi terbaru seputar produk dan kegiatan Bison Denim.
              </p>
            </div>
            <Link
              href="/news"
              className="text-black font-bold text-sm hover:opacity-60 transition-colors duration-200"
            >
              Lihat Semua &rarr;
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {news.map((item) => (
              <Link
                key={item.slug}
                href={`/news/${item.slug}`}
                className="card-interactive block border border-[#d4d4d4] bg-white transition-colors duration-200 hover:border-black"
              >
                <div className="relative aspect-[4/3]">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-5">
                  <span className="text-[11px] font-bold text-[#555] uppercase tracking-wider">
                    {item.category}
                  </span>
                  <h3 className="text-black font-bold text-sm leading-snug mt-1">
                    {item.title}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-6 bg-black">
        <div className="mx-auto max-w-7xl text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Hubungi Kami
          </h2>
          <p className="text-white/70 text-base max-w-xl mx-auto leading-relaxed mb-8">
            Tertarik dengan produk kami? Hubungi tim Bison Denim untuk informasi lebih lanjut.
          </p>
          <Link
            href="/contact-us"
            className="inline-flex items-center gap-2 bg-white text-black font-bold text-sm px-6 py-3 hover:bg-gray-100 transition-colors duration-200"
          >
            Hubungi Kami &rarr;
          </Link>
        </div>
      </section>
    </>
  );
}
