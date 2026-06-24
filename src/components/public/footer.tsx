import Link from 'next/link';
import Image from 'next/image';

const PRODUCT_LINKS = [
  { href: '/services/denim-collection', label: 'Denim Collection' },
  { href: '/services/custom-tailoring', label: 'Kemeja' },
  { href: '/services/wholesale-supply', label: 'Hoodie & Sweater' },
      { href: '/services/sustainable-fashion', label: 'Aksesori Fashion' },
  { href: '/services/brand-collaboration', label: 'Produk Lainnya' },
];

export function Footer() {
  return (
    <footer className="border-t border-[#d4d4d4] bg-white">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          <div>
            <Link href="/" className="flex items-center gap-3 mb-4">
              <div className="relative h-10 w-10 overflow-hidden">
                <Image
                  src="/icon.png"
                  alt="Bison Denim logo"
                  fill
                  className="object-contain"
                />
              </div>
              <div>
                <div className="text-sm font-bold text-black tracking-tight uppercase">Bison Denim</div>
                <div className="text-[10px] text-[#555] tracking-wider -mt-0.5 uppercase">Since 1998</div>
              </div>
            </Link>
            <p className="text-sm text-[#555] leading-relaxed">
              Penyedia pakaian denim, kemeja, hoodie, dan produk fashion berkualitas untuk Indonesia.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#999] mb-4">Tentang</h4>
            <ul className="space-y-2.5">
              <li>
                <Link href="/about/company-information" className="text-sm text-[#555] hover:text-black">
                  Company Information
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#999] mb-4">Produk</h4>
            <ul className="space-y-2.5">
              {PRODUCT_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-[#555] hover:text-black">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#999] mb-4">Kontak</h4>
            <ul className="space-y-2.5 text-sm text-[#555]">
              <li className="leading-relaxed">
                Jl. Braga No. 88
                <br />
                Bandung 40111
                <br />
                Indonesia
              </li>
              <li>
                <a href="tel:+62224234567" className="hover:text-black">+62-22-4234-567</a>
              </li>
              <li>
                <a href="mailto:hello@bison-denim.com" className="hover:text-black">hello@bison-denim.com</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-[#d4d4d4] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[#999]">&copy; {new Date().getFullYear()} Bison Denim. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/site-policy" className="text-xs text-[#999] hover:text-[#555]">Kebijakan Situs</Link>
            <Link href="/privacy-policy" className="text-xs text-[#999] hover:text-[#555]">Kebijakan Privasi</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
