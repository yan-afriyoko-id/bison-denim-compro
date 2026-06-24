'use client';

import { useState } from 'react';

interface FormData {
  nama: string;
  perusahaan: string;
  email: string;
  telepon: string;
  subjek: string;
  negara: string;
  pesan: string;
  setuju: boolean;
}

export default function ContactPage() {
  const [form, setForm] = useState<FormData>({
    nama: '',
    perusahaan: '',
    email: '',
    telepon: '',
    subjek: '',
    negara: 'Indonesia',
    pesan: '',
    setuju: false,
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <section className="py-24 px-6 text-center">
        <div className="mx-auto max-w-xl">
          <h1 className="text-3xl font-bold text-black mb-4">Pesan Terkirim</h1>
          <p className="text-[#555] text-base leading-relaxed mb-8">
            Terima kasih telah menghubungi Bison Denim. Tim kami akan merespon pesan Anda dalam 1x24 jam.
          </p>
          <button
            onClick={() => { setSubmitted(false); setForm({ nama: '', perusahaan: '', email: '', telepon: '', subjek: '', negara: 'Indonesia', pesan: '', setuju: false }); }}
            className="bg-black text-white font-bold text-sm px-8 py-3 hover:bg-[#333] transition-colors duration-200"
          >
            Kirim Pesan Lagi
          </button>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="py-24 px-6 border-b border-[#d4d4d4]">
        <div className="mx-auto max-w-7xl text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-black mb-4">Hubungi Kami</h1>
          <p className="text-[#555] text-lg max-w-2xl mx-auto leading-relaxed">
            Silakan hubungi tim Bison Denim untuk informasi lebih lanjut.
          </p>
        </div>
      </section>

      <section className="py-24 px-6">
        <div className="mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-3 gap-16">
            <div className="lg:col-span-2">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-bold text-black mb-1.5">Nama</label>
                    <input
                      type="text"
                      value={form.nama}
                      onChange={(e) => setForm({ ...form, nama: e.target.value })}
                      className="w-full border border-[#d4d4d4] px-4 py-2.5 text-sm text-black outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-black mb-1.5">Email</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full border border-[#d4d4d4] px-4 py-2.5 text-sm text-black outline-none"
                      required
                    />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-bold text-black mb-1.5">Perusahaan</label>
                    <input
                      type="text"
                      value={form.perusahaan}
                      onChange={(e) => setForm({ ...form, perusahaan: e.target.value })}
                      className="w-full border border-[#d4d4d4] px-4 py-2.5 text-sm text-black outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-black mb-1.5">Telepon</label>
                    <input
                      type="tel"
                      value={form.telepon}
                      onChange={(e) => setForm({ ...form, telepon: e.target.value })}
                      className="w-full border border-[#d4d4d4] px-4 py-2.5 text-sm text-black outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-black mb-1.5">Subjek</label>
                  <select
                    value={form.subjek}
                    onChange={(e) => setForm({ ...form, subjek: e.target.value })}
                    className="w-full border border-[#d4d4d4] px-4 py-2.5 text-sm text-black outline-none bg-white"
                    required
                  >
                    <option value="">Pilih subjek</option>
                    <option value="Informasi Produk">Informasi Produk</option>
                    <option value="Pemesanan">Pemesanan</option>
                    <option value="Kerja Sama">Kerja Sama</option>
                    <option value="Keluhan">Keluhan</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-black mb-1.5">Negara</label>
                  <select
                    value={form.negara}
                    onChange={(e) => setForm({ ...form, negara: e.target.value })}
                    className="w-full border border-[#d4d4d4] px-4 py-2.5 text-sm text-black outline-none bg-white"
                  >
                    <option>Indonesia</option>
                    <option>Malaysia</option>
                    <option>Singapura</option>
                    <option>Jepang</option>
                    <option>Lainnya</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-black mb-1.5">Pesan</label>
                  <textarea
                    rows={5}
                    value={form.pesan}
                    onChange={(e) => setForm({ ...form, pesan: e.target.value })}
                    className="w-full border border-[#d4d4d4] px-4 py-2.5 text-sm text-black outline-none resize-none"
                    required
                  />
                </div>
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={form.setuju}
                    onChange={(e) => setForm({ ...form, setuju: e.target.checked })}
                    className="mt-1"
                    required
                  />
                  <label className="text-sm text-[#555]">
                    Saya setuju dengan kebijakan privasi Bison Denim.
                  </label>
                </div>
                <button
                  type="submit"
                  className="bg-black text-white font-bold text-sm px-8 py-3 hover:bg-[#333] transition-colors duration-200"
                >
                  Kirim Pesan
                </button>
              </form>
            </div>

            <div>
              <div className="border border-[#d4d4d4] p-6 space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-black mb-2">Kantor Pusat</h3>
                  <p className="text-sm text-[#555] leading-relaxed">
                    Jl. Braga No. 88<br />
                    Bandung 40111<br />
                    Indonesia
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-black mb-2">Telepon</h3>
                  <a href="tel:+62224234567" className="text-sm text-[#555] hover:text-black">+62-22-4234-567</a>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-black mb-2">Email</h3>
                  <a href="mailto:hello@bison-denim.com" className="text-sm text-[#555] hover:text-black">hello@bison-denim.com</a>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-black mb-2">Jam Operasional</h3>
                  <p className="text-sm text-[#555] leading-relaxed">
                    Senin - Jumat: 08.00 - 17.00<br />
                    Sabtu: 08.00 - 14.00
                  </p>
                </div>
              </div>
              <div className="mt-6 border border-[#d4d4d4] overflow-hidden">
                <svg
                  viewBox="0 0 400 200"
                  className="block w-full h-[200px]"
                  preserveAspectRatio="xMidYMid slice"
                  role="img"
                  aria-label="Peta lokasi kantor Bison Denim"
                >
                  <rect width="400" height="200" fill="#e8eaed" />
                  {/* Blok / area */}
                  <rect x="10" y="10" width="90" height="60" fill="#dfe6e9" />
                  <rect x="20" y="90" width="70" height="50" fill="#dfe6e9" />
                  <rect x="160" y="20" width="80" height="55" fill="#dfe6e9" />
                  <rect x="300" y="30" width="85" height="70" fill="#dfe6e9" />
                  <rect x="160" y="110" width="100" height="70" fill="#dfe6e9" />
                  <rect x="300" y="120" width="85" height="65" fill="#dfe6e9" />
                  {/* Taman */}
                  <circle cx="115" cy="135" r="22" fill="#c8e6c9" />
                  {/* Air */}
                  <path d="M0 180 Q 60 165 120 185 T 240 180 T 400 185 L 400 200 L 0 200 Z" fill="#bbdefb" />
                  {/* Jalan utama */}
                  <line x1="0" y1="85" x2="400" y2="85" stroke="#ffffff" strokeWidth="8" />
                  <line x1="145" y1="0" x2="145" y2="200" stroke="#ffffff" strokeWidth="8" />
                  <line x1="285" y1="0" x2="285" y2="200" stroke="#ffffff" strokeWidth="8" />
                  {/* Jalan sekunder */}
                  <line x1="0" y1="45" x2="400" y2="45" stroke="#ffffff" strokeWidth="3" />
                  <line x1="0" y1="185" x2="400" y2="185" stroke="#ffffff" strokeWidth="3" />
                  <line x1="75" y1="0" x2="75" y2="200" stroke="#ffffff" strokeWidth="3" />
                  <line x1="225" y1="0" x2="225" y2="200" stroke="#ffffff" strokeWidth="3" />
                  <line x1="345" y1="0" x2="345" y2="200" stroke="#ffffff" strokeWidth="3" />
                  {/* Pin lokasi */}
                  <g transform="translate(200 95)">
                    <path
                      d="M0 0 C -12 -12 -12 -28 0 -28 C 12 -28 12 -12 0 0 Z"
                      fill="#e63946"
                      stroke="#ffffff"
                      strokeWidth="2"
                    />
                    <circle cx="0" cy="-20" r="6" fill="#ffffff" />
                  </g>
                </svg>
                <div className="bg-white px-4 py-3 border-t border-[#d4d4d4]">
                  <p className="text-sm font-bold text-black">Bison Denim</p>
                  <p className="text-xs text-[#555] leading-relaxed">
                    Jl. Braga No. 88, Bandung 40111, Indonesia
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
