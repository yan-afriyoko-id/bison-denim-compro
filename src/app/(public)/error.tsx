'use client';

import Link from 'next/link';

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="py-32 px-6 text-center">
      <div className="mx-auto max-w-xl">
        <h1 className="text-5xl font-bold text-black mb-4">Terjadi Kesalahan</h1>
        <p className="text-lg text-[#555] mb-8">Maaf, terjadi kesalahan. Silakan coba lagi.</p>
        <div className="flex items-center justify-center gap-4">
          <button onClick={reset} className="bg-black text-white font-bold text-sm px-8 py-3 hover:bg-[#333] transition-colors duration-200">Coba Lagi</button>
          <Link href="/" className="border border-black text-black font-bold text-sm px-8 py-3 hover:bg-black hover:text-white transition-colors duration-200">Kembali ke Beranda</Link>
        </div>
      </div>
    </section>
  );
}
