import { createServerSupabase } from '@/lib/supabase/server';
import { defaultGroupedSiteSettings, groupSiteSettings } from '@/lib/cms';
import { findPageNavigationItem, resolvePagePublicPath } from '@/lib/page-public-path';
export { getPostCategoryLabel } from '@/lib/public-content-shared';
import type { RichTextDocument } from '@/types';
import type {
  NavigationItem,
  Page,
  PageSection,
  Post,
  SiteSetting,
  Service,
} from '@/types';

export interface PublicNavItem extends NavigationItem {
  children: PublicNavItem[];
}

export interface NormalizedServiceContent {
  text: RichTextDocument | string;
  features: RichTextDocument | string[];
  ctaLabel: string;
  ctaHref: string;
}

export interface NormalizedPostContent {
  text: RichTextDocument | string;
}

const FALLBACK_SITE_SETTINGS = {
  brand: {
    site_name: 'Bison Denim',
    logo: '/icon.png',
  },
  company: {
    site_description: 'Bison Denim is an Indonesian fashion brand offering denim, shirts, hoodies, and everyday wardrobe essentials.',
    footer_description: 'Quality denim, shirts, hoodies, and fashion essentials for everyday wear.',
  },
  contact: {
    contact_email: 'hello@bison-denim.com',
    contact_phone: '+62-22-4234-567',
    contact_address: 'Jl. Braga No. 88\nBandung 40111\nIndonesia',
  },
} as const;

const FALLBACK_NAV_ITEMS: NavigationItem[] = [
  {
    id: 'fallback-nav-home',
    location: 'header',
    label: 'Beranda',
    href: '/',
    parent_id: null,
    sort_order: 1,
    is_visible: true,
    open_new_tab: false,
    locale: 'id',
  },
  {
    id: 'fallback-nav-about',
    location: 'header',
    label: 'Tentang',
    href: '/about/company-information',
    parent_id: null,
    sort_order: 2,
    is_visible: true,
    open_new_tab: false,
    locale: 'id',
  },
  {
    id: 'fallback-nav-services',
    location: 'header',
    label: 'Produk',
    href: '/services',
    parent_id: null,
    sort_order: 3,
    is_visible: true,
    open_new_tab: false,
    locale: 'id',
  },
  {
    id: 'fallback-nav-news',
    location: 'header',
    label: 'Berita',
    href: '/news',
    parent_id: null,
    sort_order: 4,
    is_visible: true,
    open_new_tab: false,
    locale: 'id',
  },
  {
    id: 'fallback-nav-contact',
    location: 'header',
    label: 'Kontak',
    href: '/contact-us',
    parent_id: null,
    sort_order: 5,
    is_visible: true,
    open_new_tab: false,
    locale: 'id',
  },
];

export const FALLBACK_HOMEPAGE_SECTIONS: PageSection[] = [
  {
    id: 'fallback-home-intro',
    page_id: 'fallback-home',
    section_type: 'intro',
    internal_name: 'About Us',
    content: {
      title: 'About Us',
      body: 'Bison Denim is an Indonesian fashion brand focused on denim, shirts, hoodies, and other wardrobe essentials. We are committed to delivering quality products at accessible prices.\n\nWith a broad distribution network and years of experience, Bison Denim continues to be a trusted choice for customers looking for reliable fashion pieces across Indonesia.',
      image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80',
      link_label: 'Learn More',
      link_href: '/about/company-information',
    },
    settings: {},
    sort_order: 1,
    is_visible: true,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'fallback-home-services',
    page_id: 'fallback-home',
    section_type: 'services',
    internal_name: 'Our Products',
    content: {
      title: 'Our Products',
      description: 'A versatile range of fashion products tailored to your everyday needs.',
      limit: 5,
    },
    settings: {},
    sort_order: 2,
    is_visible: true,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'fallback-home-news',
    page_id: 'fallback-home',
    section_type: 'news',
    internal_name: 'Latest News',
    content: {
      title: 'Latest News',
      description: 'Fresh updates on products, campaigns, and the latest Bison Denim activities.',
      limit: 4,
    },
    settings: {},
    sort_order: 3,
    is_visible: true,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'fallback-home-cta',
    page_id: 'fallback-home',
    section_type: 'cta',
    internal_name: 'Contact Us',
    content: {
      title: 'Contact Us',
      description: 'Interested in our products? Reach out to the Bison Denim team for more information.',
      button_label: 'Contact Us',
      button_href: '/contact-us',
    },
    settings: {},
    sort_order: 4,
    is_visible: true,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  },
];

// Legacy demo data kept here intentionally for reference while the public service flow now reads from Supabase content.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const FALLBACK_SERVICES: Service[] = [
  {
    id: 'fallback-service-denim',
    title: 'Denim Collection',
    slug: 'denim-collection',
    excerpt: 'Koleksi celana dan jaket denim berkualitas tinggi untuk gaya kasual hingga formal.',
    content: {
      text: 'Denim Collection kami menghadirkan berbagai pilihan celana, jaket, dan outer denim dengan material pilihan yang nyaman dipakai setiap hari.\n\nSetiap produk dibuat dengan perhatian pada detail, potongan modern, dan daya tahan yang sesuai untuk penggunaan aktif.',
      features: ['Material denim berkualitas tinggi', 'Potongan modern untuk gaya kasual dan formal', 'Nyaman dipakai untuk aktivitas harian'],
      cta_label: 'Belanja Sekarang',
      cta_href: '/contact-us',
    },
    icon: null,
    cover_image_url: 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=1200&q=80',
    sort_order: 1,
    is_featured: true,
    status: 'published',
    published_at: '2026-01-20T08:00:00.000Z',
    created_at: '2026-01-20T08:00:00.000Z',
    updated_at: '2026-01-20T08:00:00.000Z',
  },
  {
    id: 'fallback-service-shirts',
    title: 'Kemeja',
    slug: 'custom-tailoring',
    excerpt: 'Kemeja pria dan wanita dari bahan premium dengan potongan modern dan klasik.',
    content: {
      text: 'Koleksi kemeja Bison Denim dirancang untuk kebutuhan formal maupun santai, menggunakan bahan premium yang ringan dan nyaman.\n\nTersedia pilihan gaya modern dan klasik yang mudah dipadukan untuk berbagai kesempatan.',
      features: ['Bahan premium yang nyaman dipakai', 'Cocok untuk formal maupun santai', 'Pilihan potongan modern dan klasik'],
      cta_label: 'Belanja Sekarang',
      cta_href: '/contact-us',
    },
    icon: null,
    cover_image_url: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=1200&q=80',
    sort_order: 2,
    is_featured: true,
    status: 'published',
    published_at: '2026-01-18T08:00:00.000Z',
    created_at: '2026-01-18T08:00:00.000Z',
    updated_at: '2026-01-18T08:00:00.000Z',
  },
  {
    id: 'fallback-service-hoodie',
    title: 'Hoodie & Sweater',
    slug: 'wholesale-supply',
    excerpt: 'Hoodie dan sweater nyaman dengan desain kekinian untuk gaya santai sehari-hari.',
    content: {
      text: 'Hoodie dan sweater Bison Denim dibuat untuk gaya santai sehari-hari dengan bahan lembut dan desain kekinian.\n\nPilihan warna dan potongan yang versatile membuat koleksi ini cocok dipakai di berbagai musim.',
      features: ['Bahan lembut dan nyaman', 'Desain kekinian untuk gaya santai', 'Cocok dipakai sepanjang musim'],
      cta_label: 'Belanja Sekarang',
      cta_href: '/contact-us',
    },
    icon: null,
    cover_image_url: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=1200&q=80',
    sort_order: 3,
    is_featured: true,
    status: 'published',
    published_at: '2026-01-16T08:00:00.000Z',
    created_at: '2026-01-16T08:00:00.000Z',
    updated_at: '2026-01-16T08:00:00.000Z',
  },
  {
    id: 'fallback-service-accessories',
    title: 'Aksesori Fashion',
    slug: 'sustainable-fashion',
    excerpt: 'Topi, tas, dan aksesori denim pelengkap gaya Anda.',
    content: {
      text: 'Aksesori fashion Bison Denim melengkapi penampilan dengan pilihan topi, tas, dan item denim lainnya yang fungsional dan stylish.\n\nDirancang untuk menyatu dengan koleksi utama kami, aksesori ini cocok sebagai pelengkap gaya harian.',
      features: ['Pilihan topi, tas, dan aksesori denim', 'Mudah dipadukan dengan outfit harian', 'Desain fungsional dan stylish'],
      cta_label: 'Belanja Sekarang',
      cta_href: '/contact-us',
    },
    icon: null,
    cover_image_url: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=1200&q=80',
    sort_order: 4,
    is_featured: true,
    status: 'published',
    published_at: '2026-01-14T08:00:00.000Z',
    created_at: '2026-01-14T08:00:00.000Z',
    updated_at: '2026-01-14T08:00:00.000Z',
  },
  {
    id: 'fallback-service-other',
    title: 'Produk Lainnya',
    slug: 'brand-collaboration',
    excerpt: 'Berbagai produk fashion berkualitas untuk kebutuhan Anda.',
    content: {
      text: 'Selain koleksi utama, Bison Denim juga menghadirkan berbagai produk fashion lainnya untuk menjawab kebutuhan pasar yang beragam.\n\nKategori ini menjadi ruang fleksibel untuk item khusus, kolaborasi, dan rilisan baru yang terus berkembang.',
      features: ['Pilihan produk fashion tambahan', 'Cocok untuk rilisan khusus dan kolaborasi', 'Melengkapi kebutuhan koleksi yang lebih luas'],
      cta_label: 'Hubungi Kami',
      cta_href: '/contact-us',
    },
    icon: null,
    cover_image_url: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=80',
    sort_order: 5,
    is_featured: false,
    status: 'published',
    published_at: '2026-01-12T08:00:00.000Z',
    created_at: '2026-01-12T08:00:00.000Z',
    updated_at: '2026-01-12T08:00:00.000Z',
  },
];

const FALLBACK_POSTS: Post[] = [
  {
    id: 'fallback-post-1',
    title: 'Koleksi Denim Terbaru Telah Hadir',
    slug: 'koleksi-denim-terbaru',
    excerpt: 'Koleksi denim terbaru Bison Denim hadir dengan material premium dan desain yang semakin relevan untuk gaya modern.',
    content: {
      text: 'Koleksi denim terbaru Bison Denim kini hadir dengan pilihan model yang lebih segar, potongan yang nyaman, dan material premium untuk penggunaan harian.\n\nKami menghadirkan berbagai variasi celana dan jaket denim yang dirancang agar mudah dipadukan untuk tampilan santai maupun semi formal.',
    },
    cover_image_url: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=1200&q=80',
    category_id: null,
    author_id: null,
    status: 'published',
    seo_title: null,
    seo_description: null,
    is_featured: true,
    published_at: '2026-02-01T09:00:00.000Z',
    created_at: '2026-02-01T09:00:00.000Z',
    updated_at: '2026-02-01T09:00:00.000Z',
  },
  {
    id: 'fallback-post-2',
    title: 'Kemeja Premium Bahan Katun Pilihan',
    slug: 'kemeja-premium-katun',
    excerpt: 'Koleksi kemeja terbaru kami menggunakan bahan katun pilihan dengan kenyamanan maksimal untuk aktivitas sehari-hari.',
    content: {
      text: 'Bison Denim menghadirkan kemeja premium berbahan katun pilihan yang nyaman dipakai dalam berbagai situasi.\n\nTekstur bahan yang lembut dan potongan yang rapi membuat koleksi ini cocok untuk gaya kerja maupun santai.',
    },
    cover_image_url: 'https://images.unsplash.com/photo-1603252109303-2751441dd157?auto=format&fit=crop&w=1200&q=80',
    category_id: null,
    author_id: null,
    status: 'published',
    seo_title: null,
    seo_description: null,
    is_featured: true,
    published_at: '2026-01-28T09:00:00.000Z',
    created_at: '2026-01-28T09:00:00.000Z',
    updated_at: '2026-01-28T09:00:00.000Z',
  },
  {
    id: 'fallback-post-3',
    title: 'Hoodie Edisi Terbatas Musim Ini',
    slug: 'hoodie-edisi-terbatas',
    excerpt: 'Hoodie edisi terbatas dengan desain eksklusif dan bahan nyaman kini tersedia untuk musim ini.',
    content: {
      text: 'Hoodie edisi terbatas musim ini dirancang dengan gaya yang lebih eksklusif untuk pelanggan yang ingin tampil berbeda.\n\nKami menggunakan bahan yang nyaman, hangat, dan tetap ringan untuk aktivitas harian.',
    },
    cover_image_url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=80',
    category_id: null,
    author_id: null,
    status: 'published',
    seo_title: null,
    seo_description: null,
    is_featured: true,
    published_at: '2026-01-24T09:00:00.000Z',
    created_at: '2026-01-24T09:00:00.000Z',
    updated_at: '2026-01-24T09:00:00.000Z',
  },
  {
    id: 'fallback-post-4',
    title: 'Bison Denim di Pameran Fashion 2026',
    slug: 'bison-denim-pameran-fashion-2026',
    excerpt: 'Bison Denim turut hadir dalam pameran fashion 2026 dengan membawa koleksi unggulan dan rilisan terbaru.',
    content: {
      text: 'Partisipasi Bison Denim di pameran fashion 2026 menjadi momen penting untuk memperkenalkan koleksi terbaru kepada pasar yang lebih luas.\n\nAcara ini juga menjadi kesempatan untuk memperkuat relasi dengan mitra, distributor, dan pelanggan setia kami.',
    },
    cover_image_url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=80',
    category_id: null,
    author_id: null,
    status: 'published',
    seo_title: null,
    seo_description: null,
    is_featured: true,
    published_at: '2026-01-20T09:00:00.000Z',
    created_at: '2026-01-20T09:00:00.000Z',
    updated_at: '2026-01-20T09:00:00.000Z',
  },
  {
    id: 'fallback-post-5',
    title: 'Tips Merawat Jaket Denim Agar Tetap Awet',
    slug: 'tips-merawat-jaket-denim',
    excerpt: 'Beberapa langkah sederhana untuk menjaga jaket denim tetap nyaman dipakai dan tahan lama.',
    content: {
      text: 'Merawat jaket denim tidak harus rumit. Dengan pencucian yang tepat dan penyimpanan yang baik, jaket favorit Anda bisa bertahan lebih lama.\n\nHindari pencucian berlebihan dan gunakan deterjen yang lembut agar warna dan bentuk bahan tetap terjaga.',
    },
    cover_image_url: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=1200&q=80',
    category_id: null,
    author_id: null,
    status: 'published',
    seo_title: null,
    seo_description: null,
    is_featured: false,
    published_at: '2026-01-15T09:00:00.000Z',
    created_at: '2026-01-15T09:00:00.000Z',
    updated_at: '2026-01-15T09:00:00.000Z',
  },
  {
    id: 'fallback-post-6',
    title: 'Rekomendasi Gaya Kemeja Untuk Aktivitas Harian',
    slug: 'rekomendasi-gaya-kemeja-harian',
    excerpt: 'Inspirasi memadukan kemeja untuk tampilan rapi, santai, dan tetap nyaman sepanjang hari.',
    content: {
      text: 'Kemeja bisa menjadi pilihan utama untuk berbagai aktivitas harian jika dipadukan dengan potongan dan bahan yang tepat.\n\nMulai dari gaya semi formal hingga smart casual, koleksi Bison Denim memberi banyak opsi yang fleksibel.',
    },
    cover_image_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1200&q=80',
    category_id: null,
    author_id: null,
    status: 'published',
    seo_title: null,
    seo_description: null,
    is_featured: false,
    published_at: '2026-01-10T09:00:00.000Z',
    created_at: '2026-01-10T09:00:00.000Z',
    updated_at: '2026-01-10T09:00:00.000Z',
  },
  {
    id: 'fallback-post-7',
    title: 'Aksesori Denim Untuk Melengkapi Penampilan',
    slug: 'aksesori-denim-melengkapi-penampilan',
    excerpt: 'Pilihan aksesori sederhana yang bisa membuat tampilan denim Anda terasa lebih lengkap dan personal.',
    content: {
      text: 'Topi, tas, dan aksesori kecil lain bisa menjadi elemen penting untuk memperkuat tampilan denim sehari-hari.\n\nDengan pilihan yang tepat, aksesori tidak hanya menambah gaya tetapi juga fungsi.',
    },
    cover_image_url: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1200&q=80',
    category_id: null,
    author_id: null,
    status: 'published',
    seo_title: null,
    seo_description: null,
    is_featured: false,
    published_at: '2026-01-05T09:00:00.000Z',
    created_at: '2026-01-05T09:00:00.000Z',
    updated_at: '2026-01-05T09:00:00.000Z',
  },
  {
    id: 'fallback-post-8',
    title: 'Persiapan Koleksi Baru Menyambut Musim Ini',
    slug: 'persiapan-koleksi-baru-musim-ini',
    excerpt: 'Tim Bison Denim menyiapkan koleksi baru dengan fokus pada kenyamanan, warna netral, dan siluet modern.',
    content: {
      text: 'Menjelang musim ini, tim desain Bison Denim mempersiapkan koleksi baru yang mengedepankan kenyamanan dan fleksibilitas.\n\nPilihan warna netral dan siluet modern diharapkan semakin relevan dengan kebutuhan pelanggan saat ini.',
    },
    cover_image_url: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=1200&q=80',
    category_id: null,
    author_id: null,
    status: 'published',
    seo_title: null,
    seo_description: null,
    is_featured: false,
    published_at: '2026-01-01T09:00:00.000Z',
    created_at: '2026-01-01T09:00:00.000Z',
    updated_at: '2026-01-01T09:00:00.000Z',
  },
];

const FALLBACK_PAGES: Record<string, { page: Page; sections: PageSection[] }> = {
  'about/company-information': {
    page: {
      id: 'fallback-page-company-information',
      page_key: null,
      title: 'Company Information',
      slug: 'about/company-information',
      description: 'Informasi perusahaan Bison Denim.',
      status: 'published',
      locale: 'id',
      seo_title: 'Company Information - Bison Denim',
      seo_description: 'Informasi perusahaan Bison Denim.',
      og_image_url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80',
      is_indexed: true,
      published_at: '2026-01-01T00:00:00.000Z',
      created_by: null,
      updated_by: null,
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
    },
    sections: [
      {
        id: 'fallback-company-hero',
        page_id: 'fallback-page-company-information',
        section_type: 'hero',
        internal_name: 'company-hero',
        content: {
          title: 'Tentang Bison Denim',
          image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1400&q=80',
        },
        settings: {},
        sort_order: 1,
        is_visible: true,
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      },
      {
        id: 'fallback-company-profile',
        page_id: 'fallback-page-company-information',
        section_type: 'rich_text',
        internal_name: 'company-profile',
        content: {
          title: 'Profil Perusahaan',
          paragraphs: [
            'Bison Denim adalah perusahaan fashion Indonesia yang bergerak di bidang penjualan pakaian denim, kemeja, hoodie, dan berbagai produk fashion lainnya. Kami berkomitmen menghadirkan produk berkualitas dengan harga terjangkau untuk semua kalangan.',
            'Dengan jaringan distribusi yang luas dan pengalaman lebih dari dua dekade, Bison Denim telah menjadi pilihan utama bagi konsumen yang mencari produk fashion denim dan non-denim yang terpercaya di Indonesia.',
          ],
          image: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=1200&q=80',
          image_alt: 'Display produk Bison Denim',
        },
        settings: {},
        sort_order: 2,
        is_visible: true,
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      },
      {
        id: 'fallback-company-stats',
        page_id: 'fallback-page-company-information',
        section_type: 'stats',
        internal_name: 'company-stats',
        content: {
          items: [
            { value: '25+', label: 'Tahun Pengalaman' },
            { value: 'Nasional', label: 'Jaringan Distribusi' },
          ],
        },
        settings: {},
        sort_order: 3,
        is_visible: true,
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      },
      {
        id: 'fallback-company-values',
        page_id: 'fallback-page-company-information',
        section_type: 'rich_text',
        internal_name: 'company-values',
        content: {
          title: 'Nilai Kami',
          items: [
            { title: 'Kualitas', description: 'Kami mengutamakan bahan dan pengerjaan terbaik untuk setiap produk.' },
            { title: 'Terjangkau', description: 'Kami menjaga agar produk fashion berkualitas tetap bisa diakses lebih banyak orang.' },
            { title: 'Kepercayaan', description: 'Kami membangun hubungan jangka panjang dengan pelanggan melalui konsistensi layanan.' },
          ],
        },
        settings: {},
        sort_order: 4,
        is_visible: true,
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      },
      {
        id: 'fallback-company-cta',
        page_id: 'fallback-page-company-information',
        section_type: 'cta',
        internal_name: 'company-cta',
        content: {
          title: 'Hubungi Kami',
          description: 'Tertarik dengan produk kami? Hubungi tim Bison Denim untuk informasi lebih lanjut.',
          button_label: 'Hubungi Kami',
          button_href: '/contact-us',
        },
        settings: {},
        sort_order: 5,
        is_visible: true,
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      },
    ],
  },
  'site-policy': {
    page: {
      id: 'fallback-page-site-policy',
      page_key: null,
      title: 'Kebijakan Situs',
      slug: 'site-policy',
      description: 'Kebijakan penggunaan situs Bison Denim.',
      status: 'published',
      locale: 'id',
      seo_title: 'Kebijakan Situs - Bison Denim',
      seo_description: 'Kebijakan penggunaan situs Bison Denim.',
      og_image_url: null,
      is_indexed: true,
      published_at: '2026-01-01T00:00:00.000Z',
      created_by: null,
      updated_by: null,
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
    },
    sections: [
      {
        id: 'fallback-site-policy-1',
        page_id: 'fallback-page-site-policy',
        section_type: 'rich_text',
        internal_name: 'Penggunaan Situs',
        content: {
          body: 'Situs Bison Denim disediakan untuk memberikan informasi produk, berita perusahaan, dan saluran komunikasi dengan pelanggan. Dengan mengakses situs ini, Anda setuju menggunakan layanan kami secara wajar dan sesuai hukum yang berlaku.',
        },
        settings: {},
        sort_order: 1,
        is_visible: true,
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      },
      {
        id: 'fallback-site-policy-2',
        page_id: 'fallback-page-site-policy',
        section_type: 'rich_text',
        internal_name: 'Konten dan Hak Cipta',
        content: {
          body: 'Seluruh materi yang tersedia di situs ini, termasuk teks, gambar, dan identitas merek, dimiliki atau digunakan secara sah oleh Bison Denim. Penggunaan ulang tanpa izin tertulis tidak diperkenankan.',
        },
        settings: {},
        sort_order: 2,
        is_visible: true,
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      },
    ],
  },
  'privacy-policy': {
    page: {
      id: 'fallback-page-privacy-policy',
      page_key: null,
      title: 'Kebijakan Privasi',
      slug: 'privacy-policy',
      description: 'Kebijakan privasi Bison Denim.',
      status: 'published',
      locale: 'id',
      seo_title: 'Kebijakan Privasi - Bison Denim',
      seo_description: 'Kebijakan privasi Bison Denim.',
      og_image_url: null,
      is_indexed: true,
      published_at: '2026-01-01T00:00:00.000Z',
      created_by: null,
      updated_by: null,
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
    },
    sections: [
      {
        id: 'fallback-privacy-policy-1',
        page_id: 'fallback-page-privacy-policy',
        section_type: 'rich_text',
        internal_name: 'Informasi yang Dikumpulkan',
        content: {
          body: 'Kami dapat mengumpulkan informasi yang Anda kirimkan melalui formulir kontak, seperti nama, email, nomor telepon, dan pesan, untuk menindaklanjuti kebutuhan Anda terkait produk atau layanan Bison Denim.',
        },
        settings: {},
        sort_order: 1,
        is_visible: true,
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      },
      {
        id: 'fallback-privacy-policy-2',
        page_id: 'fallback-page-privacy-policy',
        section_type: 'rich_text',
        internal_name: 'Penggunaan Data',
        content: {
          body: 'Data yang Anda berikan digunakan untuk kebutuhan komunikasi, pelayanan pelanggan, dan peningkatan kualitas layanan kami. Kami tidak menjual data pribadi Anda kepada pihak lain.',
        },
        settings: {},
        sort_order: 2,
        is_visible: true,
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      },
    ],
  },
};

const PUBLIC_HEADER_NAV: Array<Pick<NavigationItem, 'href' | 'label' | 'sort_order'>> = [
  { href: '/', label: 'Beranda', sort_order: 1 },
  { href: '/about/company-information', label: 'Tentang', sort_order: 2 },
  { href: '/services', label: 'Produk', sort_order: 3 },
  { href: '/news', label: 'Berita', sort_order: 4 },
  { href: '/contact-us', label: 'Kontak', sort_order: 5 },
];

function withFallbackSiteSettings(grouped: ReturnType<typeof defaultGroupedSiteSettings>) {
  return {
    brand: {
      site_name: grouped.brand.site_name || FALLBACK_SITE_SETTINGS.brand.site_name,
      logo: grouped.brand.logo || FALLBACK_SITE_SETTINGS.brand.logo,
    },
    company: {
      site_description: grouped.company.site_description || FALLBACK_SITE_SETTINGS.company.site_description,
      footer_description: grouped.company.footer_description || FALLBACK_SITE_SETTINGS.company.footer_description,
    },
    contact: {
      contact_email: grouped.contact.contact_email || FALLBACK_SITE_SETTINGS.contact.contact_email,
      contact_phone: grouped.contact.contact_phone || FALLBACK_SITE_SETTINGS.contact.contact_phone,
      contact_address: grouped.contact.contact_address || FALLBACK_SITE_SETTINGS.contact.contact_address,
    },
  };
}

export function normalizeServiceContent(content: Record<string, unknown> | null | undefined): NormalizedServiceContent {
  return {
    text:
      typeof content?.text === 'string' || (content?.text && typeof content.text === 'object')
        ? (content.text as RichTextDocument | string)
        : '',
    features:
      Array.isArray(content?.features) || (content?.features && typeof content.features === 'object')
        ? (content.features as RichTextDocument | string[])
        : [],
    ctaLabel: typeof content?.cta_label === 'string' ? content.cta_label : '',
    ctaHref: typeof content?.cta_href === 'string' ? content.cta_href : '',
  };
}

export function normalizePostContent(content: Record<string, unknown> | null | undefined): NormalizedPostContent {
  return {
    text:
      typeof content?.text === 'string' || (content?.text && typeof content.text === 'object')
        ? (content.text as RichTextDocument | string)
        : '',
  };
}

function buildNavigationTree(items: NavigationItem[]): PublicNavItem[] {
  const map = new Map<string, PublicNavItem>();

  for (const item of items) {
    map.set(item.id, { ...item, children: [] });
  }

  const roots: PublicNavItem[] = [];

  for (const item of map.values()) {
    if (item.parent_id) {
      const parent = map.get(item.parent_id);
      if (parent) {
        parent.children.push(item);
        continue;
      }
    }

    roots.push(item);
  }

  const sortItems = (entries: PublicNavItem[]) => {
    entries.sort((left, right) => left.sort_order - right.sort_order || left.label.localeCompare(right.label));
    for (const entry of entries) {
      sortItems(entry.children);
    }
  };

  sortItems(roots);
  return roots;
}

export async function getNavigationTree(location: NavigationItem['location'] = 'header') {
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from('navigation_items')
    .select('*')
    .eq('location', location)
    .eq('is_visible', true)
    .order('sort_order', { ascending: true });

  const items = ((data ?? []) as NavigationItem[]);

  const pageCandidates = items
    .filter((item) => item.href.startsWith('/') && item.href !== '/')
    .flatMap((item) => {
      const normalizedHref = item.href.replace(/^\/+|\/+$/g, '');
      const slugTail = normalizedHref.split('/').pop() ?? normalizedHref;

      return Array.from(new Set([normalizedHref, slugTail])).filter(Boolean);
    })
    .filter((slug): slug is string => Boolean(slug));

  const { data: pages } = pageCandidates.length > 0
    ? await supabase.from('pages').select('slug, status').in('slug', Array.from(new Set(pageCandidates)))
    : { data: [] };

  const publishedSlugs = new Set(
    ((pages ?? []) as Array<{ slug: string; status: Page['status'] }>)
      .filter((page) => page.status === 'published')
      .map((page) => page.slug)
  );

  const isPubliclyVisibleItem = (item: NavigationItem) => {
    if (location === 'header' && PUBLIC_HEADER_NAV.some((navItem) => navItem.href === item.href)) {
      return true;
    }

    if (!item.href.startsWith('/') || item.href === '/') {
      return true;
    }

    const normalizedHref = item.href.replace(/^\/+|\/+$/g, '');
    const slugTail = normalizedHref.split('/').pop();

    return publishedSlugs.has(normalizedHref) || (!!slugTail && publishedSlugs.has(slugTail));
  };

  if (location === 'header') {
    const baseItems = items.length > 0
      ? items.filter((item) => item.parent_id === null && item.is_visible)
      : FALLBACK_NAV_ITEMS;

    const rootByHref = new Map(baseItems.map((item) => [item.href, item]));
    const childItems = items.filter((item) => item.parent_id !== null && item.is_visible && isPubliclyVisibleItem(item));

    const normalizedRoots = PUBLIC_HEADER_NAV
      .map((item) => {
        const existingRoot = rootByHref.get(item.href);
        if (!existingRoot && items.length > 0) {
          return null;
        }

        return {
          id: existingRoot?.id ?? `public-header-${item.sort_order}`,
          location: 'header' as const,
          label: item.label,
          href: item.href,
          parent_id: null,
          sort_order: item.sort_order,
          is_visible: true,
          open_new_tab: false,
          locale: existingRoot?.locale ?? 'id',
        } satisfies NavigationItem;
      })
      .filter((item): item is NavigationItem => item !== null);

    const normalizedChildren = childItems
      .filter((item) => normalizedRoots.some((root) => root.id === item.parent_id))
      .map((item) => ({
        ...item,
        label: item.label.trim(),
      }));

    return buildNavigationTree([...normalizedRoots, ...normalizedChildren]);
  }

  if (items.length > 0) {
    const visibleItems = items.filter((item) => isPubliclyVisibleItem(item));

    return buildNavigationTree(visibleItems);
  }

  return buildNavigationTree(FALLBACK_NAV_ITEMS.filter((item) => item.location === location && item.is_visible));
}

export async function getDashboardNavigationItems(location: NavigationItem['location'] = 'header') {
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from('navigation_items')
    .select('*')
    .eq('location', location)
    .order('sort_order', { ascending: true });

  return (data ?? []) as NavigationItem[];
}

export async function getPublicSiteSettings() {
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from('site_settings')
    .select('*')
    .order('key', { ascending: true });

  const publicKeys = new Set(
    (data ?? []).filter((s) => s.is_public).map((s) => s.key)
  );

  const publicData = (data ?? []).filter((s) => s.is_public);
  const grouped = groupSiteSettings(publicData as SiteSetting[]);

  // Only apply fallback for public settings with empty value
  const settings = {
    brand: {
      site_name: publicKeys.has('site_name') ? (grouped.brand.site_name || FALLBACK_SITE_SETTINGS.brand.site_name) : '',
      logo: publicKeys.has('logo') ? (grouped.brand.logo || FALLBACK_SITE_SETTINGS.brand.logo) : '',
    },
    company: {
      site_description: publicKeys.has('site_description') ? (grouped.company.site_description || FALLBACK_SITE_SETTINGS.company.site_description) : '',
      footer_description: publicKeys.has('footer_description') ? (grouped.company.footer_description || FALLBACK_SITE_SETTINGS.company.footer_description) : '',
    },
    contact: {
      contact_email: publicKeys.has('contact_email') ? (grouped.contact.contact_email || FALLBACK_SITE_SETTINGS.contact.contact_email) : '',
      contact_phone: publicKeys.has('contact_phone') ? (grouped.contact.contact_phone || FALLBACK_SITE_SETTINGS.contact.contact_phone) : '',
      contact_address: publicKeys.has('contact_address') ? (grouped.contact.contact_address || FALLBACK_SITE_SETTINGS.contact.contact_address) : '',
    },
  };

  const byKey = new Map<string, unknown>();
  for (const item of data ?? []) {
    byKey.set(item.key, item.value);
  }

  return { grouped: settings, byKey };
}

export async function getHomepageSections() {
  const supabase = await createServerSupabase();
  const { data: pages } = await supabase
    .from('pages')
    .select('*')
    .eq('status', 'published')
    .or('page_key.eq.home,slug.eq.home')
    .limit(1);

  const page = ((pages ?? [])[0] ?? null) as (Page & { page_key?: string | null }) | null;

  if (!page) {
    return {
      page: null,
      sections: [] as PageSection[],
    };
  }

  const { data: sections } = await supabase
    .from('page_sections')
    .select('*')
    .eq('page_id', page.id)
    .eq('is_visible', true)
    .order('sort_order', { ascending: true });

  return {
    page,
    sections: ((sections ?? []) as PageSection[]),
  };
}

export async function getPublishedPageBySlug(slug: string) {
  const supabase = await createServerSupabase();
  const { data: page } = await supabase
    .from('pages')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();

  if (!page) {
    const fallback = FALLBACK_PAGES[slug];

    return fallback
      ? {
          page: fallback.page,
          sections: fallback.sections,
        }
      : {
          page: null,
          sections: [] as PageSection[],
        };
  }

  const { data: sections } = await supabase
    .from('page_sections')
    .select('*')
    .eq('page_id', page.id)
    .eq('is_visible', true)
    .order('sort_order', { ascending: true });

  return {
    page: page as Page,
    sections: (sections ?? []) as PageSection[],
  };
}

export async function getPublishedPageByPath(path: string) {
  const supabase = await createServerSupabase();
  const normalizedPath = path.replace(/^\/+|\/+$/g, '');
  const slugTail = normalizedPath.split('/').pop() ?? normalizedPath;

  const [{ data: pages }, { data: navItems }] = await Promise.all([
    supabase
      .from('pages')
      .select('*')
      .eq('status', 'published')
      .in('slug', Array.from(new Set([normalizedPath, slugTail]))),
    supabase.from('navigation_items').select('*').eq('location', 'header'),
  ]);

  const resolvedNavItems = (navItems ?? []) as NavigationItem[];
  const targetHref = `/${normalizedPath}`;
  const page =
    ((pages ?? []) as Page[]).find((candidate) => resolvePagePublicPath(candidate, resolvedNavItems) === targetHref) ??
    ((pages ?? []) as Page[]).find((candidate) => candidate.slug === normalizedPath) ??
    null;

  if (!page) {
    return {
      page: null,
      sections: [] as PageSection[],
    };
  }

  const navigationItem = findPageNavigationItem(page, resolvedNavItems);
  if (navigationItem && navigationItem.href !== targetHref) {
    return {
      page: null,
      sections: [] as PageSection[],
    };
  }

  const { data: sections } = await supabase
    .from('page_sections')
    .select('*')
    .eq('page_id', page.id)
    .eq('is_visible', true)
    .order('sort_order', { ascending: true });

  return {
    page,
    sections: (sections ?? []) as PageSection[],
  };
}

export async function getHeroSlides() {
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from('homepage_sections')
    .select('settings, is_visible')
    .eq('section_key', 'hero_slider')
    .eq('is_visible', true)
    .order('sort_order', { ascending: true });

  return (data ?? []).map((item) => {
    const settings = item.settings as Record<string, string>;
    return {
      image: settings.image || '',
      alt: settings.alt || settings.title || '',
      eyebrow: settings.eyebrow || undefined,
      title: settings.title || '',
      description: settings.description || '',
      cta: settings.cta_label ? { label: settings.cta_label, href: settings.cta_href || '/services' } : undefined,
    };
  });
}

function getPageSectionContent(section: PageSection) {
  return (section.content ?? {}) as Record<string, unknown>;
}

function getPageImageCandidate(page: Page, sections: PageSection[]) {
  for (const section of sections) {
    const content = getPageSectionContent(section);
    const image =
      (typeof content.image === 'string' && content.image.trim()) ||
      (typeof content.secondary_image === 'string' && content.secondary_image.trim()) ||
      '';

    if (image) {
      return image;
    }
  }

  return null;
}

function getPageExcerpt(page: Page, sections: PageSection[]) {
  if (page.description?.trim()) {
    return page.description.trim();
  }

  for (const section of sections) {
    const content = getPageSectionContent(section);
    const candidates = [content.description, content.body];

    for (const candidate of candidates) {
      if (typeof candidate === 'string' && candidate.trim()) {
        return candidate.trim();
      }
    }
  }

  return null;
}

export async function getPublishedServices(limit?: number) {
  const supabase = await createServerSupabase();
  const [{ data: pages }, { data: navItems }] = await Promise.all([
    supabase.from('pages').select('*').eq('status', 'published'),
    supabase.from('navigation_items').select('*').eq('location', 'header'),
  ]);

  const headerNavItems = (navItems ?? []) as NavigationItem[];
  const pageServices = ((pages ?? []) as Page[])
    .map((page) => ({
      page,
      publicPath: resolvePagePublicPath(page, headerNavItems),
      navItem: findPageNavigationItem(page, headerNavItems),
    }))
    .filter(({ publicPath }) => publicPath.startsWith('/services/') && publicPath !== '/services');

  if (pageServices.length > 0) {
    const { data: sections } = await supabase
      .from('page_sections')
      .select('*')
      .in('page_id', pageServices.map(({ page }) => page.id))
      .eq('is_visible', true)
      .order('sort_order', { ascending: true });

    const sectionsByPageId = new Map<string, PageSection[]>();
    for (const section of (sections ?? []) as PageSection[]) {
      const pageSections = sectionsByPageId.get(section.page_id) ?? [];
      pageSections.push(section);
      sectionsByPageId.set(section.page_id, pageSections);
    }

    const resolved = pageServices
      .sort((left, right) => {
        const leftOrder = left.navItem?.sort_order ?? Number.MAX_SAFE_INTEGER;
        const rightOrder = right.navItem?.sort_order ?? Number.MAX_SAFE_INTEGER;

        if (leftOrder !== rightOrder) {
          return leftOrder - rightOrder;
        }

        const leftDate = new Date(left.page.published_at ?? left.page.created_at).getTime();
        const rightDate = new Date(right.page.published_at ?? right.page.created_at).getTime();
        return rightDate - leftDate;
      })
      .map(({ page }) => {
        const pageSections = sectionsByPageId.get(page.id) ?? [];

        return {
          id: page.id,
          title: page.title,
          slug: page.slug,
          excerpt: getPageExcerpt(page, pageSections),
          content: null,
          icon: null,
          cover_image_url: getPageImageCandidate(page, pageSections),
          sort_order: 0,
          is_featured: false,
          status: page.status,
          published_at: page.published_at,
          created_at: page.created_at,
          updated_at: page.updated_at,
        } satisfies Service;
      });

    return typeof limit === 'number' ? resolved.slice(0, limit) : resolved;
  }

  let legacyQuery = supabase
    .from('services')
    .select('*')
    .eq('status', 'published')
    .order('is_featured', { ascending: false })
    .order('sort_order', { ascending: true })
    .order('published_at', { ascending: false });

  if (typeof limit === 'number') {
    legacyQuery = legacyQuery.limit(limit);
  }

  const { data } = await legacyQuery;
  const services = ((data ?? []) as Service[]);
  return typeof limit === 'number' ? services.slice(0, limit) : services;
}

export async function getPublishedServiceBySlug(slug: string) {
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from('services')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();

  return data as Service | null;
}

export async function getPublishedPosts(limit?: number) {
  const supabase = await createServerSupabase();
  let query = supabase
    .from('posts')
    .select('*')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .order('created_at', { ascending: false });

  if (typeof limit === 'number') {
    query = query.limit(limit);
  }

  const { data } = await query;
  const posts = ((data ?? []) as Post[]);
  const resolved = posts.length > 0 ? posts : FALLBACK_POSTS;

  return typeof limit === 'number' ? resolved.slice(0, limit) : resolved;
}

export async function getPublishedPostBySlug(slug: string) {
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from('posts')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();

  const post = data as Post | null;
  return post ?? FALLBACK_POSTS.find((item) => item.slug === slug) ?? null;
}

export function getSettingTextValue(value: unknown) {
  if (typeof value === 'string') {
    return value;
  }

  if (value && typeof value === 'object' && 'value' in value && typeof value.value === 'string') {
    return value.value;
  }

  return '';
}

export function getPublicMetaDefaults() {
  return {
    grouped: withFallbackSiteSettings(defaultGroupedSiteSettings()),
    byKey: new Map<string, unknown>(),
  };
}
