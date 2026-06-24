'use client';

import Image from 'next/image';
import Link from 'next/link';

export default function CompanyInformationPage() {
  return (
    <>
      <section className="relative h-[300px] bg-black">
        <Image
          src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1600&q=80"
          alt="Display produk Bison Denim"
          fill
          className="object-cover opacity-60"
          priority
        />
        <div className="absolute inset-0 flex items-center">
          <div className="mx-auto max-w-7xl px-6 w-full">
            <h1 className="text-white text-4xl sm:text-5xl font-bold">Tentang Bison Denim</h1>
          </div>
        </div>
      </section>

      <section className="py-24 px-6">
        <div className="mx-auto max-w-7xl">
          <div className="grid md:grid-cols-2 gap-16 items-start">
            <div>
              <h2 className="text-2xl font-bold text-black mb-6">Profil Perusahaan</h2>
              <p className="text-[#555] text-base leading-relaxed mb-5">
                Bison Denim adalah perusahaan fashion Indonesia yang bergerak di bidang penjualan
                pakaian denim, kemeja, hoodie, sweater, dan berbagai produk fashion lainnya.
                Didirikan pada tahun 1998 di Bandung, Jawa Barat, kami telah melayani kebutuhan
                fashion masyarakat Indonesia selama lebih dari dua dekade.
              </p>
              <p className="text-[#555] text-base leading-relaxed mb-5">
                Sebagai perusahaan yang berfokus pada kualitas dan kepuasan pelanggan, Bison Denim
                terus berinovasi dalam menghadirkan produk-produk fashion terbaru yang mengikuti
                tren global namun tetap terjangkau bagi semua kalangan.
              </p>
              <p className="text-[#555] text-base leading-relaxed mb-5">
                Dengan jaringan distribusi yang luas, produk Bison Denim tersedia di berbagai kota
                di Indonesia. Kami berkomitmen untuk terus menjadi pilihan utama masyarakat dalam
                memenuhi kebutuhan fashion sehari-hari.
              </p>
            </div>
            <div>
              <div className="relative aspect-[4/3] border border-[#d4d4d4]">
                <Image
                  src="https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=1200&q=80"
                  alt="Toko dan display produk Bison Denim"
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
          <div className="grid sm:grid-cols-3 gap-12 text-center">
            <div>
              <div className="text-4xl font-bold text-black mb-2">1998</div>
              <p className="text-sm text-[#555]">Tahun Berdiri</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-black mb-2">50+</div>
              <p className="text-sm text-[#555]">Kota Tersebar</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-black mb-2">100+</div>
              <p className="text-sm text-[#555]">Produk Tersedia</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 px-6 border-t border-[#d4d4d4]">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-2xl font-bold text-black mb-10">Nilai Kami</h2>
          <div className="grid sm:grid-cols-3 gap-8">
            <div>
              <h3 className="text-sm font-bold text-black mb-3">Kualitas</h3>
              <p className="text-sm text-[#555] leading-relaxed">Produk berkualitas tinggi dengan bahan terbaik untuk kepuasan pelanggan.</p>
            </div>
            <div>
              <h3 className="text-sm font-bold text-black mb-3">Kepercayaan</h3>
              <p className="text-sm text-[#555] leading-relaxed">Melayani dengan jujur dan transparan sejak 1998.</p>
            </div>
            <div>
              <h3 className="text-sm font-bold text-black mb-3">Inovasi</h3>
              <p className="text-sm text-[#555] leading-relaxed">Terus berinovasi mengikuti tren fashion terkini.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 px-6 bg-black">
        <div className="mx-auto max-w-7xl text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Hubungi Kami</h2>
          <p className="text-white/70 text-sm max-w-xl mx-auto leading-relaxed mb-6">
            Untuk informasi lebih lanjut tentang produk Bison Denim, jangan ragu untuk menghubungi kami.
          </p>
          <Link href="/contact-us" className="inline-block bg-white text-black font-bold text-sm px-8 py-3 hover:bg-gray-100 transition-colors duration-200">
            Hubungi Kami
          </Link>
        </div>
      </section>
    </>
  );
}
