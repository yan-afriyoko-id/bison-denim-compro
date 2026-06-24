'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

const ITEMS_PER_PAGE = 6;

const ALL_NEWS = [
  {
    image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=1200&q=80',
    category: 'PRODUK',
    title: 'Koleksi Denim Terbaru Telah Hadir',
    date: '15 Juni 2026',
    slug: 'koleksi-denim-terbaru',
  },
  {
    image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=1200&q=80',
    category: 'PRODUK',
    title: 'Kemeja Premium Bahan Katun Pilihan',
    date: '8 Juni 2026',
    slug: 'kemeja-premium-katun',
  },
  {
    image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=1200&q=80',
    category: 'PRODUK',
    title: 'Hoodie Edisi Terbatas Musim Ini',
    date: '1 Juni 2026',
    slug: 'hoodie-edisi-terbatas',
  },
  {
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80',
    category: 'KEGIATAN',
    title: 'Bison Denim di Pameran Fashion 2026',
    date: '25 Mei 2026',
    slug: 'bison-denim-pameran-fashion-2026',
  },
  {
    image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=1200&q=80',
    category: 'PRODUK',
    title: 'Tips Memilih Bahan Kemeja yang Tepat',
    date: '18 Mei 2026',
    slug: 'tips-memilih-bahan-kemeja',
  },
  {
    image: 'https://images.unsplash.com/photo-1548883354-94bcfe321cbb?auto=format&fit=crop&w=1200&q=80',
    category: 'PRODUK',
    title: 'Cara Merawat Celana Denim Agar Awet',
    date: '10 Mei 2026',
    slug: 'cara-merawat-celana-denim-awet',
  },
  {
    image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=80',
    category: 'KEGIATAN',
    title: 'Diskon Akhir Tahun Bison Denim',
    date: '3 Mei 2026',
    slug: 'diskon-akhir-tahun-bison-denim',
  },
  {
    image: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=1200&q=80',
    category: 'PRODUK',
    title: 'Padu Padan Hoodie untuk Tampil Stylish',
    date: '26 April 2026',
    slug: 'padu-padan-hoodie-stylish',
  },
];

export default function NewsPage() {
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const displayedNews = ALL_NEWS.slice(0, visibleCount);

  return (
    <>
      <section className="py-24 px-6 border-b border-[#d4d4d4]">
        <div className="mx-auto max-w-7xl text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-black mb-4">
            Berita
          </h1>
          <p className="text-[#555] text-lg max-w-2xl mx-auto leading-relaxed">
            Informasi terbaru seputar produk dan kegiatan Bison Denim.
          </p>
        </div>
      </section>

      <section className="py-24 px-6">
        <div className="mx-auto max-w-7xl">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {displayedNews.map((item) => (
              <Link
                key={item.slug}
                href={`/news/${item.slug}`}
                className="card-interactive block border border-[#d4d4d4] bg-white transition-colors duration-200 hover:border-black"
              >
                <div className="relative aspect-[4/3]">
                  <Image src={item.image} alt={item.title} fill className="object-cover" />
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-[#555] uppercase tracking-wider">{item.category}</span>
                    <span className="text-[11px] text-[#555]">{item.date}</span>
                  </div>
                  <h3 className="text-black font-bold text-sm leading-snug">{item.title}</h3>
                </div>
              </Link>
            ))}
          </div>

          {visibleCount < ALL_NEWS.length && (
            <div className="text-center">
              <button
                onClick={() => setVisibleCount((p) => p + 3)}
                className="border border-black text-black font-bold text-sm px-8 py-3 bg-white hover:bg-black hover:text-white transition-colors duration-200"
              >
                Muat Lebih
              </button>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
