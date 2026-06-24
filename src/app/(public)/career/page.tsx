'use client';

import { useState, useMemo } from 'react';
import { Search, MapPin, Building2, Briefcase, X } from 'lucide-react';
import { FadeIn } from '@/components/public/fade-in';

const JOBS = [
  { title: 'Fashion Designer', department: 'Desain', location: 'Bandung', type: 'Full-time' },
  { title: 'Pattern Maker', department: 'Desain', location: 'Bandung', type: 'Full-time' },
  { title: 'Sewing Operator', department: 'Produksi', location: 'Bandung', type: 'Full-time' },
  { title: 'Quality Control', department: 'Produksi', location: 'Bandung', type: 'Full-time' },
  { title: 'Brand Marketing', department: 'Marketing', location: 'Jakarta', type: 'Full-time' },
  { title: 'Store Manager', department: 'Retail', location: 'Jakarta', type: 'Full-time' },
  { title: 'E-commerce Specialist', department: 'Digital', location: 'Jakarta', type: 'Full-time' },
  { title: 'Content Creator', department: 'Marketing', location: 'Bandung', type: 'Contract' },
];

const DEPARTMENTS = ['Desain', 'Produksi', 'Marketing', 'Retail', 'Digital'];
const LOCATIONS = ['Bandung', 'Jakarta', 'Yogyakarta'];

export default function CareerPage() {
  const [search, setSearch] = useState('');
  const [dept, setDept] = useState('');
  const [loc, setLoc] = useState('');

  const filtered = useMemo(() => {
    return JOBS.filter((j) => {
      if (search && !j.title.toLowerCase().includes(search.toLowerCase())) return false;
      if (dept && j.department !== dept) return false;
      if (loc && j.location !== loc) return false;
      return true;
    });
  }, [search, dept, loc]);

  const hasFilters = search || dept || loc;

  function clearFilters() {
    setSearch('');
    setDept('');
    setLoc('');
  }

  return (
    <>
      <section className="py-20 px-6 bg-white border-b border-[#d4d4d4]">
        <div className="mx-auto max-w-7xl text-center">
          <FadeIn>
            <h1 className="text-4xl sm:text-5xl font-bold text-[#111111]">Karir</h1>
            <p className="mt-4 text-lg text-[#555555] max-w-xl mx-auto">
              Bergabunglah dengan tim Bison Denim
            </p>
          </FadeIn>
        </div>
      </section>

      <section className="py-16 px-6 bg-white">
        <div className="mx-auto max-w-5xl">
          <FadeIn>
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555555]" />
                <input
                  type="text"
                  placeholder="Cari berdasarkan posisi..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full h-12 pl-11 pr-4 border border-[#d4d4d4] bg-white text-sm text-[#111111] placeholder:text-[#555555] focus:outline-none focus:ring-2 focus:ring-[#1B2A3F]"
                />
              </div>
              <select
                value={dept}
                onChange={(e) => setDept(e.target.value)}
                className="h-12 px-4 border border-[#d4d4d4] bg-white text-sm text-[#111111] focus:outline-none focus:ring-2 focus:ring-[#1B2A3F]"
              >
                <option value="">Semua Departemen</option>
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <select
                value={loc}
                onChange={(e) => setLoc(e.target.value)}
                className="h-12 px-4 border border-[#d4d4d4] bg-white text-sm text-[#111111] focus:outline-none focus:ring-2 focus:ring-[#1B2A3F]"
              >
                <option value="">Semua Lokasi</option>
                {LOCATIONS.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
          </FadeIn>

          {hasFilters && (
            <div className="flex items-center gap-2 mb-6">
              <span className="text-xs text-[#555555]">Filter:</span>
              {search && (
                <span className="inline-flex items-center gap-1 px-3 py-1 border border-[#d4d4d4] text-[#111111] text-xs font-medium bg-white">
                  {search}
                  <button onClick={() => setSearch('')}><X className="w-3 h-3" /></button>
                </span>
              )}
              {dept && (
                <span className="inline-flex items-center gap-1 px-3 py-1 border border-[#d4d4d4] text-[#111111] text-xs font-medium bg-white">
                  {dept}
                  <button onClick={() => setDept('')}><X className="w-3 h-3" /></button>
                </span>
              )}
              {loc && (
                <span className="inline-flex items-center gap-1 px-3 py-1 border border-[#d4d4d4] text-[#111111] text-xs font-medium bg-white">
                  {loc}
                  <button onClick={() => setLoc('')}><X className="w-3 h-3" /></button>
                </span>
              )}
              <button onClick={clearFilters} className="text-xs text-[#555555] hover:text-[#111111] ml-2">
                Hapus semua
              </button>
            </div>
          )}

          <p className="text-sm text-[#555555] mb-6">
            {filtered.length} posisi ditemukan
          </p>

          {filtered.length === 0 ? (
            <div className="text-center py-20 text-[#555555]">
              <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="font-bold text-[#111111]">Tidak ada posisi ditemukan</p>
              <p className="text-sm mt-1">Coba sesuaikan pencarian atau filter Anda</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map((job, i) => (
                <FadeIn key={i} delay={i * 50}>
                  <div className="border border-[#d4d4d4] bg-white p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <h3 className="text-[#111111] font-bold text-base">{job.title}</h3>
                        <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-[#555555]">
                          <span className="flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5" />
                            {job.department}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5" />
                            {job.location}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Briefcase className="w-3.5 h-3.5" />
                            {job.type}
                          </span>
                        </div>
                      </div>
                      <button className="shrink-0 px-5 py-2.5 bg-[#1B2A3F] text-white text-sm font-bold hover:bg-[#1B2A3F]/90">
                        Lamar Sekarang
                      </button>
                    </div>
                  </div>
                </FadeIn>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
