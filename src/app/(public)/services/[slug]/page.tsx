'use client';

import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

const PRODUCTS: Record<string, { title: string; desc: string; features: string[]; image: string; content: string }> = {
  'denim-collection': {
    title: 'Denim Collection',
    desc: 'Koleksi celana dan jaket denim berkualitas tinggi.',
    image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=1600&q=80',
    features: [
      'Bahan denim premium',
      'Berbagai ukuran dan potongan',
      'Warna klasik dan modern',
      'Tersedia untuk pria dan wanita',
      'Harga terjangkau',
    ],
    content: 'Koleksi denim Bison Denim menghadirkan celana dan jaket denim berkualitas tinggi dengan berbagai pilihan potongan dan warna. Dari model slim fit hingga regular fit, setiap produk dibuat dari bahan denim pilihan yang nyaman dipakai sehari-hari. Cocok untuk gaya kasual maupun semi-formal, koleksi denim kami adalah pilihan tepat untuk melengkapi wardrobe Anda.',
  },
  'custom-tailoring': {
    title: 'Kemeja',
    desc: 'Kemeja pria dan wanita dari bahan premium.',
    image: 'https://images.unsplash.com/photo-1603252109303-2751441dd157?auto=format&fit=crop&w=1600&q=80',
    features: [
      'Bahan katun premium',
      'Potongan modern dan klasik',
      'Tersedia berbagai ukuran',
      'Warna dan motif beragam',
      'Nyaman dipakai seharian',
    ],
    content: 'Koleksi kemeja Bison Denim menawarkan berbagai pilihan kemeja pria dan wanita dengan bahan katun premium yang nyaman. Tersedia dalam potongan slim fit, regular fit, dan oversized, kemeja kami cocok untuk berbagai kesempatan dari kerja formal hingga santai. Dengan warna dan motif yang beragam, Anda dapat menemukan kemeja yang sesuai dengan gaya Anda.',
  },
  'wholesale-supply': {
    title: 'Hoodie & Sweater',
    desc: 'Hoodie dan sweater nyaman untuk gaya sehari-hari.',
    image: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=1600&q=80',
    features: [
      'Bahan fleece premium',
      'Desain kekinian',
      'Tersedia berbagai ukuran',
      'Sablon berkualitas',
      'Harga bersahabat',
    ],
    content: 'Hoodie dan sweater Bison Denim hadir dengan desain kekinian dan bahan premium yang nyaman dipakai. Cocok untuk gaya santai sehari-hari, koleksi hoodie dan sweater kami menawarkan berbagai pilihan warna dan desain. Dengan bahan fleece yang hangat dan lembut, produk ini cocok untuk segala cuaca.',
  },
  'sustainable-fashion': {
    title: 'Aksesori Fashion',
    desc: 'Topi, tas, dan aksesoris pelengkap gaya.',
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1600&q=80',
    features: [
      'Desain stylish',
      'Bahan berkualitas',
      'Fungsional dan stylish',
      'Harga terjangkau',
      'Pelengkap gaya sempurna',
    ],
    content: 'Lenkapi gaya Anda dengan koleksi aksesoris fashion Bison Denim. Dari topi denim, tas selempang, ikat pinggang, hingga berbagai aksesoris lainnya, setiap produk dirancang untuk melengkapi penampilan Anda. Dengan desain yang stylish dan bahan berkualitas, aksesoris kami adalah pilihan tepat untuk tampil lebih percaya diri.',
  },
  'brand-collaboration': {
    title: 'Produk Lainnya',
    desc: 'Berbagai produk fashion berkualitas lainnya.',
    image: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=1600&q=80',
    features: [
      'Produk fashion terbaru',
      'Kualitas terjamin',
      'Harga kompetitif',
      'Pengiriman ke seluruh Indonesia',
      'Garansi kepuasan',
    ],
    content: 'Selain denim, kemeja, hoodie, dan aksesoris, Bison Denim juga menghadirkan berbagai produk fashion lainnya. Kami terus memperbarui koleksi kami dengan produk-produk terbaru yang mengikuti tren fashion terkini. Kunjungi toko kami untuk menemukan produk fashion favorit Anda.',
  },
};

export default function ProductDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const product = PRODUCTS[slug];

  if (!product) {
    return (
      <section className="py-24 px-6 text-center">
        <h1 className="text-3xl font-bold text-black mb-4">Produk Tidak Ditemukan</h1>
        <Link href="/services" className="text-black font-bold text-sm underline transition-colors duration-200">&larr; Kembali ke Produk</Link>
      </section>
    );
  }

  return (
    <>
      <section className="relative h-[300px] bg-black">
        <Image src={product.image} alt={product.title} fill className="object-cover opacity-60" priority />
        <div className="absolute inset-0 flex items-center">
          <div className="mx-auto max-w-7xl px-6 w-full">
            <h1 className="text-white text-4xl sm:text-5xl font-bold">{product.title}</h1>
            <p className="text-white/70 text-base mt-3 max-w-xl leading-relaxed">{product.desc}</p>
          </div>
        </div>
      </section>

      <section className="py-24 px-6">
        <div className="mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-3 gap-16">
            <div className="lg:col-span-2">
              <h2 className="text-2xl font-bold text-black mb-5">Tentang Produk Ini</h2>
              <p className="text-[#555] text-base leading-relaxed">{product.content}</p>
            </div>
            <div>
              <div className="border border-[#d4d4d4] p-6">
                <h3 className="text-sm font-bold text-black mb-4">Keunggulan</h3>
                <ul className="space-y-3">
                  {product.features.map((f) => (
                    <li key={f} className="text-sm text-[#555] flex items-start gap-3">
                      <span>&rarr;</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-6">
                <Link
                  href="/contact-us"
                  className="block w-full bg-black text-white text-center font-bold text-sm py-3 hover:bg-[#333] transition-colors duration-200"
                >
                  Beli Sekarang
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 px-6 border-t border-[#d4d4d4]">
        <div className="mx-auto max-w-7xl">
          <Link href="/services" className="text-sm text-[#555] transition-colors duration-200">&larr; Kembali ke Produk</Link>
        </div>
      </section>
    </>
  );
}
