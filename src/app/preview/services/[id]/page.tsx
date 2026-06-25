import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase/server';
import { getPublicSiteSettings, normalizeServiceContent } from '@/lib/public-content';
import { hasRichTextContent, RichTextRenderer } from '@/lib/rich-text';

export default async function PreviewServicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerSupabase();
  const [{ data: service }, { grouped }] = await Promise.all([
    supabase.from('services').select('*').eq('id', id).maybeSingle(),
    getPublicSiteSettings(),
  ]);

  if (!service) {
    notFound();
  }

  const content = normalizeServiceContent(service.content);
  const ctaHref = content.ctaHref || '/contact-us';
  const ctaLabel = content.ctaLabel || 'Hubungi Kami';
  const bodyContent = hasRichTextContent(content.text) ? content.text : service.excerpt || '';
  const hasFeatures = hasRichTextContent(content.features, 'list');

  return (
    <>
      <section className="relative h-[300px] bg-[#1E1E1E]">
        {service.cover_image_url ? (
          <Image src={service.cover_image_url} alt={service.title} fill className="object-cover opacity-60" priority />
        ) : null}
        <div className="absolute inset-0 flex items-center">
          <div className="mx-auto w-full max-w-7xl px-6">
            <h1 className="text-4xl font-bold text-white sm:text-5xl">{service.title}</h1>
            <p className="mt-3 max-w-xl text-base leading-relaxed text-white/70">{service.excerpt}</p>
          </div>
        </div>
      </section>

      <section className="px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-16 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <h2 className="mb-5 text-2xl font-bold text-[#1E1E1E]">Tentang Produk Ini</h2>
              <RichTextRenderer content={bodyContent} className="text-base leading-relaxed text-[#555]" />
            </div>
            <div>
              <div className="border border-[#d4d4d4] p-6">
                <h3 className="mb-4 text-sm font-bold text-[#1E1E1E]">Keunggulan</h3>
                {hasFeatures ? (
                  <RichTextRenderer content={content.features} mode="list" className="text-sm text-[#555]" />
                ) : (
                  <p className="text-sm leading-relaxed text-[#555]">Detail keunggulan produk bisa ditambahkan dari dashboard service editor.</p>
                )}
              </div>
              <div className="mt-6">
                <Link
                  href={ctaHref}
                  className="block w-full bg-[#1E1E1E] py-3 text-center text-sm font-bold text-white transition-colors duration-200 hover:bg-[#333]"
                >
                  {ctaLabel}
                </Link>
                {grouped.contact.contact_phone ? (
                  <p className="mt-3 text-center text-xs text-[#777]">Atau hubungi {grouped.contact.contact_phone}</p>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
