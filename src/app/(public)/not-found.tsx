import Link from 'next/link';

export default function NotFound() {
  return (
    <section className="py-32 px-6 text-center">
      <div className="mx-auto max-w-xl">
        <h1 className="text-6xl font-bold text-black mb-4">404</h1>
        <p className="text-lg text-[#555] mb-8">Halaman tidak ditemukan</p>
        <Link href="/" className="inline-block bg-black text-white font-bold text-sm px-8 py-3 hover:bg-[#333] transition-colors duration-200">
          Kembali ke Beranda
        </Link>
      </div>
    </section>
  );
}
