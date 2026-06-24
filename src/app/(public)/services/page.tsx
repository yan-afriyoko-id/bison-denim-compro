'use client';

import Link from 'next/link';
import Image from 'next/image';

const PRODUCTS = [
  {
    title: 'Denim Collection',
    desc: 'Koleksi celana dan jaket denim berkualitas tinggi untuk gaya kasual hingga formal.',
    image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=1200&q=80',
    slug: 'denim-collection',
  },
  {
    title: 'Kemeja',
    desc: 'Kemeja pria dan wanita dari bahan katun premium dengan potongan modern dan klasik.',
    image: 'https://images.unsplash.com/photo-1603252109303-2751441dd157?auto=format&fit=crop&w=1200&q=80',
    slug: 'custom-tailoring',
  },
  {
    title: 'Hoodie & Sweater',
    desc: 'Hoodie dan sweater nyaman dengan desain kekinian untuk gaya santai sehari-hari.',
    image: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=1200&q=80',
    slug: 'wholesale-supply',
  },
  {
    title: 'Aksesori Fashion',
    desc: 'Topi, tas, ikat pinggang, dan aksesori denim pelengkap gaya Anda.',
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=80',
    slug: 'sustainable-fashion',
  },
  {
    title: 'Produk Lainnya',
    desc: 'Berbagai produk fashion berkualitas lainnya untuk kebutuhan Anda.',
    image: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=1200&q=80',
    slug: 'brand-collaboration',
  },
];

export default function ServicesPage() {
  return (
    <>
      <section className="py-24 px-6 border-b border-[#d4d4d4]">
        <div className="mx-auto max-w-7xl text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-black mb-4">
            Produk Kami
          </h1>
          <p className="text-[#555] text-lg max-w-2xl mx-auto leading-relaxed">
            Berbagai pilihan produk fashion berkualitas untuk memenuhi kebutuhan Anda.
          </p>
        </div>
      </section>

      <section className="py-24 px-6">
        <div className="mx-auto max-w-7xl">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {PRODUCTS.map((item) => (
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
                  <p className="text-[#555] text-xs leading-relaxed">{item.desc}</p>
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
            className="inline-block bg-white text-black font-bold text-sm px-8 py-3 hover:bg-gray-100 transition-colors duration-200"
          >
            Hubungi Kami
          </Link>
        </div>
      </section>
    </>
  );
}
