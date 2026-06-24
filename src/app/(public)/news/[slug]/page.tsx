'use client';

import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

const ARTICLES: Record<string, { title: string; category: string; date: string; image: string; content: string }> = {
  'koleksi-denim-terbaru': {
    title: 'Koleksi Denim Terbaru Telah Hadir',
    category: 'PRODUK',
    date: '15 Juni 2026',
    image: 'https://picsum.photos/seed/clothing-denim-3/1200/600',
    content: 'Bison Denim dengan bangga menghadirkan koleksi denim terbaru untuk musim ini. Tersedia dalam berbagai model celana dan jaket denim dengan bahan premium yang nyaman dipakai. Koleksi terbaru ini hadir dengan warna-warna klasik seperti indigo blue dan black, serta potongan yang mengikuti tren terkini. Kunjungi toko kami untuk melihat koleksi lengkapnya.',
  },
  'kemeja-premium-katun': {
    title: 'Kemeja Premium Bahan Katun Pilihan',
    category: 'PRODUK',
    date: '8 Juni 2026',
    image: 'https://picsum.photos/seed/clothing-shirt-5/1200/600',
    content: 'Kemeja premium Bison Denim dibuat dari bahan katun pilihan yang nyaman dipakai seharian. Tersedia dalam berbagai warna dan motif, kemeja kami cocok untuk acara formal maupun kasual. Dengan potongan yang rapi dan jahitan berkualitas, setiap kemeja Bison Denim memberikan kesan profesional dan stylish.',
  },
  'hoodie-edisi-terbatas': {
    title: 'Hoodie Edisi Terbatas Musim Ini',
    category: 'PRODUK',
    date: '1 Juni 2026',
    image: 'https://picsum.photos/seed/clothing-hoodie-5/1200/600',
    content: 'Hoodie edisi terbatas Bison Denim hadir dengan desain eksklusif yang hanya tersedia dalam jumlah terbatas. Dibuat dari bahan fleece premium yang hangat dan nyaman, hoodie ini cocok untuk gaya santai sehari-hari. Jangan lewatkan kesempatan untuk memiliki hoodie edisi terbatas ini sebelum kehabisan.',
  },
  'bison-denim-pameran-fashion-2026': {
    title: 'Bison Denim di Pameran Fashion 2026',
    category: 'KEGIATAN',
    date: '25 Mei 2026',
    image: 'https://picsum.photos/seed/clothing-15/1200/600',
    content: 'Bison Denim berpartisipasi dalam pameran fashion 2026 yang diselenggarakan di Jakarta. Dalam acara ini, kami memamerkan koleksi terbaru denim, kemeja, hoodie, dan aksesoris fashion. Pengunjung dapat melihat langsung kualitas produk dan mendapatkan penawaran khusus selama pameran berlangsung.',
  },
  'tips-memilih-bahan-kemeja': {
    title: 'Tips Memilih Bahan Kemeja yang Tepat',
    category: 'PRODUK',
    date: '18 Mei 2026',
    image: 'https://picsum.photos/seed/clothing-shirt-6/1200/600',
    content: 'Memilih bahan kemeja yang tepat sangat penting untuk kenyamanan dan penampilan. Kemeja katun adalah pilihan terbaik untuk iklim tropis karena menyerap keringat dan nyaman dipakai. Bison Denim menyediakan berbagai pilihan kemeja katun premium dengan berbagai warna dan motif yang bisa disesuaikan dengan kebutuhan Anda.',
  },
  'cara-merawat-celana-denim-awet': {
    title: 'Cara Merawat Celana Denim Agar Awet',
    category: 'PRODUK',
    date: '10 Mei 2026',
    image: 'https://picsum.photos/seed/clothing-denim-4/1200/600',
    content: 'Celana denim yang dirawat dengan baik dapat bertahan bertahun-tahun. Cuci celana denim dengan air dingin dan balikkan bagian dalamnya sebelum dicuci. Hindari penggunaan pemutih dan pengering mesin berlebihan. Dengan perawatan yang tepat, celana denim Bison Denim Anda akan tetap terlihat seperti baru.',
  },
  'diskon-akhir-tahun-bison-denim': {
    title: 'Diskon Akhir Tahun Bison Denim',
    category: 'KEGIATAN',
    date: '3 Mei 2026',
    image: 'https://picsum.photos/seed/clothing-accessories-3/1200/600',
    content: 'Bison Denim mengadakan diskon akhir tahun dengan potongan harga hingga 50% untuk berbagai produk pilihan. Nikmati promo spesial untuk koleksi denim, kemeja, hoodie, dan aksesoris fashion. Promo berlaku untuk pembelian di toko maupun online. Segera dapatkan produk favorit Anda sebelum kehabisan.',
  },
  'padu-padan-hoodie-stylish': {
    title: 'Padu Padan Hoodie untuk Tampil Stylish',
    category: 'PRODUK',
    date: '26 April 2026',
    image: 'https://picsum.photos/seed/clothing-hoodie-6/1200/600',
    content: 'Hoodie bukan hanya untuk gaya santai, tetapi juga bisa dipadukan untuk tampilan yang lebih stylish. Padukan hoodie dengan jaket denim dan celana chino untuk tampilan kasual yang keren. Atau kenakan hoodie dengan celana jeans favorit Anda untuk tampilan sehari-hari yang nyaman namun tetap modis.',
  },
};

export default function NewsDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const article = ARTICLES[slug];

  if (!article) {
    return (
      <section className="py-24 px-6 text-center">
        <h1 className="text-3xl font-bold text-black mb-4">Artikel Tidak Ditemukan</h1>
        <Link href="/news" className="text-black font-bold text-sm underline transition-colors duration-200">&larr; Kembali ke Berita</Link>
      </section>
    );
  }

  return (
    <>
      <section className="relative h-[340px] bg-black">
        <Image src={article.image} alt={article.title} fill className="object-cover opacity-60" priority />
        <div className="absolute inset-0 flex items-center">
          <div className="mx-auto max-w-7xl px-6 w-full">
            <span className="text-sm font-bold text-white/80 uppercase tracking-wider">{article.category}</span>
            <h1 className="text-white text-3xl sm:text-4xl font-bold mt-2 max-w-3xl">{article.title}</h1>
            <p className="text-white/60 text-sm mt-3">{article.date}</p>
          </div>
        </div>
      </section>

      <section className="py-24 px-6">
        <div className="mx-auto max-w-3xl">
          <article className="text-[#555] text-base leading-relaxed">
            {article.content.split('\n').map((p, i) => (
              <p key={i} className="mb-5">{p}</p>
            ))}
          </article>
          <div className="mt-12 pt-8 border-t border-[#d4d4d4]">
            <Link href="/news" className="text-sm text-[#555] transition-colors duration-200">&larr; Kembali ke Berita</Link>
          </div>
        </div>
      </section>
    </>
  );
}
