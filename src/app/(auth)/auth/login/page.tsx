'use client';

import { useEffect, useState } from 'react';
import { useActionState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { login } from '@/actions/auth.actions';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(login, undefined);
  const [siteName, setSiteName] = useState('Bison Denim');
  const [logoUrl, setLogoUrl] = useState('/icon.png');

  useEffect(() => {
    const el = document.querySelector('[data-site-name]') as HTMLElement | null;
    if (el?.dataset.siteName) setSiteName(el.dataset.siteName);
    if (el?.dataset.logoUrl) setLogoUrl(el.dataset.logoUrl);
  }, []);

  useEffect(() => {
    createClient().auth.getSession().then(({ data }) => {
      if (data.session) {
        router.push('/dashboard');
      }
    });
  }, [router]);

  return (
    <section className="relative grid min-h-screen lg:grid-cols-2">
      {/* Visual side — mirrors landing hero style */}
      <div className="relative hidden lg:block">
        <Image
          src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1400&q=80"
          alt={siteName}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/55" />
        <div className="absolute inset-0 flex flex-col justify-between p-12">
          <span className="text-white/70 text-xs font-bold uppercase tracking-[0.2em]">
            Admin Dashboard
          </span>
          <div>
            <h2 className="text-white text-5xl xl:text-6xl font-bold tracking-tight leading-none">
              {siteName.toUpperCase()}
            </h2>
            <p className="text-white/80 text-base mt-4 max-w-md leading-relaxed">
              Sistem manajemen konten untuk tim {siteName}.
            </p>
          </div>
        </div>
      </div>

      {/* Form side */}
      <div className="flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <Link href="/" className="flex items-center gap-3 mb-12">
            <div className="relative h-10 w-10 overflow-hidden">
              <Image
                src={logoUrl}
                alt={`${siteName} logo`}
                fill
                className="object-contain"
              />
            </div>
            <div>
              <div className="text-sm font-bold text-black tracking-tight uppercase">
                {siteName}
              </div>
            </div>
          </Link>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-black tracking-tight">Masuk</h1>
            <p className="text-[#555] text-sm mt-2 leading-relaxed">
              Masuk ke dashboard admin untuk mengelola konten.
            </p>
          </div>

          <form action={formAction} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-bold text-black mb-1.5">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="admin@bison.com"
                className="w-full border border-[#d4d4d4] px-4 py-2.5 text-sm text-black outline-none focus:border-black transition-colors duration-200"
                required
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-sm font-bold text-black">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-[#555] hover:text-black transition-colors duration-200"
                >
                  Lupa password?
                </Link>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                className="w-full border border-[#d4d4d4] px-4 py-2.5 text-sm text-black outline-none focus:border-black transition-colors duration-200"
                required
              />
            </div>

            {state?.error && (
              <p className="text-sm text-red-600">{state.error}</p>
            )}

            <button
              type="submit"
              disabled={pending}
              className="w-full bg-black text-white font-bold text-sm px-8 py-3 hover:bg-[#333] transition-colors duration-200 disabled:opacity-50"
            >
              {pending ? 'Memproses...' : 'Masuk'}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
