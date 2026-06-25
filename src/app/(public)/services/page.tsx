import Link from 'next/link';
import Image from 'next/image';
import { getPublishedServices, getPublicSiteSettings } from '@/lib/public-content';

export default async function ServicesPage() {
  const [services, { grouped }] = await Promise.all([
    getPublishedServices(),
    getPublicSiteSettings(),
  ]);

  return (
    <>
      <section className="border-b border-[#d4d4d4] px-6 py-24">
        <div className="mx-auto max-w-7xl text-center">
          <h1 className="mb-4 text-4xl font-bold text-[#1E1E1E] sm:text-5xl">Produk Kami</h1>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-[#555]">
            Berbagai pilihan produk fashion berkualitas untuk memenuhi kebutuhan Anda.
          </p>
        </div>
      </section>

      <section className="px-6 py-24">
        <div className="mx-auto max-w-7xl">
          {services.length === 0 ? (
            <div className="border border-dashed border-[#d4d4d4] px-6 py-20 text-center">
              <p className="text-sm text-[#555]">Belum ada layanan yang dipublikasikan.</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
          )}
        </div>
      </section>

      <section className="bg-[#1E1E1E] px-6 py-24">
        <div className="mx-auto max-w-7xl text-center">
          <h2 className="mb-4 text-3xl font-bold text-white">Hubungi Kami</h2>
          <p className="mx-auto mb-8 max-w-xl text-base leading-relaxed text-white">
            Tertarik dengan produk kami? Hubungi tim {grouped.brand.site_name || 'kami'} untuk informasi lebih lanjut.
          </p>
          <Link
            href="/contact-us"
            className="inline-block bg-white px-8 py-3 text-sm font-bold text-[#1E1E1E] transition-colors duration-200 hover:bg-gray-100"
          >
            {grouped.contact.contact_email ? 'Hubungi Tim Kami' : 'Hubungi Kami'}
          </Link>
        </div>
      </section>
    </>
  );
}
