'use client';

export default function PrivacyPolicyPage() {
  return (
    <>
      <section className="py-24 px-6 border-b border-[#d4d4d4]">
        <div className="mx-auto max-w-7xl text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-black mb-4">Kebijakan Privasi</h1>
          <p className="text-[#555] text-base">Terakhir diperbarui: 1 Januari 2026</p>
        </div>
      </section>

      <section className="py-24 px-6">
        <div className="mx-auto max-w-3xl">
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-bold text-black mb-3">Informasi yang Kami Kumpulkan</h2>
              <p className="text-[#555] text-base leading-relaxed">
                Bison Denim mengumpulkan informasi pribadi yang Anda berikan secara sukarela melalui
                form kontak, termasuk nama, alamat email, nomor telepon, dan pesan yang Anda kirimkan.
              </p>
            </div>
            <div>
              <h2 className="text-xl font-bold text-black mb-3">Penggunaan Informasi</h2>
              <p className="text-[#555] text-base leading-relaxed">
                Informasi yang kami kumpulkan digunakan untuk merespon pertanyaan Anda, memproses
                pesanan, dan meningkatkan layanan kami. Kami tidak akan menjual atau menyewakan
                informasi pribadi Anda kepada pihak ketiga.
              </p>
            </div>
            <div>
              <h2 className="text-xl font-bold text-black mb-3">Keamanan Data</h2>
              <p className="text-[#555] text-base leading-relaxed">
                Kami menerapkan langkah-langkah keamanan yang wajar untuk melindungi informasi
                pribadi Anda dari akses tidak sah, perubahan, pengungkapan, atau penghancuran.
              </p>
            </div>
            <div>
              <h2 className="text-xl font-bold text-black mb-3">Cookie</h2>
              <p className="text-[#555] text-base leading-relaxed">
                Situs kami menggunakan cookie untuk meningkatkan pengalaman browsing. Anda dapat
                mengatur preferensi cookie melalui pengaturan browser Anda.
              </p>
            </div>
            <div>
              <h2 className="text-xl font-bold text-black mb-3">Kontak</h2>
              <p className="text-[#555] text-base leading-relaxed">
                Jika Anda memiliki pertanyaan tentang kebijakan privasi ini, silakan hubungi kami
                melalui halaman Kontak.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
