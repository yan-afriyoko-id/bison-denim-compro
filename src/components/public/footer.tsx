import Link from 'next/link';
import Image from 'next/image';
import { getPublishedServices, getPublicSiteSettings } from '@/lib/public-content';

export async function Footer() {
  const [{ grouped }, services] = await Promise.all([
    getPublicSiteSettings(),
    getPublishedServices(5),
  ]);

  const productLinks = services.map((service) => ({
    href: `/services/${service.slug}`,
    label: service.title,
  }));

  return (
    <footer className="border-t border-[#d4d4d4] bg-white">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          <div>
            <Link href="/" className="flex items-center gap-3 mb-4">
              <div className="relative h-10 w-10 overflow-hidden">
                <Image
                  src={grouped.brand.logo || '/icon.png'}
                  alt={`${grouped.brand.site_name || 'Bison Denim'} logo`}

                  fill
                  className="object-contain"
                />
              </div>
              <div>
                <div className="text-sm font-bold text-black tracking-tight uppercase">{grouped.brand.site_name || 'Bison Denim'}</div>
              </div>
            </Link>
            <p className="text-sm text-[#555] leading-relaxed">
              {grouped.company.footer_description || grouped.company.site_description || 'Konten deskripsi footer bisa diatur dari dashboard settings.'}
            </p>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#999] mb-4">About</h4>
            <ul className="space-y-2.5">
              <li>
                <Link href="/about/company-information" className="text-sm text-[#555] hover:text-black">
                  Company Information
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#999] mb-4">Products</h4>
            <ul className="space-y-2.5">
              {productLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-[#555] hover:text-black">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#999] mb-4">Contact</h4>
            <ul className="space-y-2.5 text-sm text-[#555]">
              <li className="leading-relaxed">
                {grouped.contact.contact_address || 'Alamat perusahaan dapat diatur dari dashboard settings.'}
              </li>
              {grouped.contact.contact_phone && (
                <li>
                  <a href={`tel:${grouped.contact.contact_phone}`} className="hover:text-black">{grouped.contact.contact_phone}</a>
                </li>
              )}
              {grouped.contact.contact_email && (
                <li>
                  <a href={`mailto:${grouped.contact.contact_email}`} className="hover:text-black">{grouped.contact.contact_email}</a>
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-[#d4d4d4] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[#999]">&copy; {new Date().getFullYear()} {grouped.brand.site_name || 'Bison Denim'}. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/site-policy" className="text-xs text-[#999] hover:text-[#555]">Site Policy</Link>
            <Link href="/privacy-policy" className="text-xs text-[#999] hover:text-[#555]">Privacy Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
