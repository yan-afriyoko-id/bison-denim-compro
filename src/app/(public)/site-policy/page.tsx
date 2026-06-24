'use client';

export default function SitePolicyPage() {
  return (
    <>
      <section className="py-24 px-6 border-b border-[#d4d4d4]">
        <div className="mx-auto max-w-7xl text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-black mb-4">Kebijakan Situs</h1>
          <p className="text-[#555] text-base">Terakhir diperbarui: 1 Januari 2026</p>
        </div>
      </section>

      <section className="py-24 px-6">
        <div className="mx-auto max-w-3xl">
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-bold text-black mb-3">Pendahuluan</h2>
              <p className="text-[#555] text-base leading-relaxed">
                Selamat datang di situs web Bison Denim. Dengan mengakses dan menggunakan situs ini,
                Anda setuju untuk mematuhi dan terikat oleh ketentuan dan kebijakan berikut.
              </p>
            </div>
            <div>
              <h2 className="text-xl font-bold text-black mb-3">Penggunaan Situs</h2>
              <p className="text-[#555] text-base leading-relaxed">
                Konten di situs ini disediakan untuk informasi umum dan penggunaan pribadi. Konten
                dapat berubah tanpa pemberitahuan sebelumnya. Penggunaan informasi atau materi di
                situs ini sepenuhnya atas risiko Anda sendiri.
              </p>
            </div>
            <div>
              <h2 className="text-xl font-bold text-black mb-3">Kekayaan Intelektual</h2>
              <p className="text-[#555] text-base leading-relaxed">
                Seluruh konten, logo, gambar, dan materi di situs ini adalah milik Bison Denim dan
                dilindungi oleh undang-undang hak cipta. Dilarang memperbanyak atau mendistribusikan
                konten tanpa izin tertulis dari Bison Denim.
              </p>
            </div>
            <div>
              <h2 className="text-xl font-bold text-black mb-3">Tautan Eksternal</h2>
              <p className="text-[#555] text-base leading-relaxed">
                Situs ini mungkin berisi tautan ke situs web pihak ketiga. Bison Denim tidak
                bertanggung jawab atas konten atau praktik privasi dari situs-situs tersebut.
              </p>
            </div>
            <div>
              <h2 className="text-xl font-bold text-black mb-3">Perubahan Kebijakan</h2>
              <p className="text-[#555] text-base leading-relaxed">
                Bison Denim berhak memperbarui kebijakan situs ini kapan saja. Perubahan akan
                diumumkan melalui halaman ini.
              </p>
            </div>
            <div>
              <h2 className="text-xl font-bold text-black mb-3">Kontak</h2>
              <p className="text-[#555] text-base leading-relaxed">
                Jika Anda memiliki pertanyaan tentang kebijakan situs ini, silakan hubungi kami
                melalui halaman Kontak.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
