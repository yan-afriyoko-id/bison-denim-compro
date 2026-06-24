import { ContactPageClient } from '@/components/public/contact-page-client';
import { getPublicSiteSettings } from '@/lib/public-content';

export default async function ContactPage() {
  const { grouped } = await getPublicSiteSettings();

  return (
    <ContactPageClient
      contactInfo={{
        siteName: grouped.brand.site_name || 'Bison Denim',
        logoUrl: grouped.brand.logo || '/icon.png',
        description: grouped.company.site_description,
        email: grouped.contact.contact_email || 'hello@bison-denim.com',
        phone: grouped.contact.contact_phone || '+62-22-4234-567',
        address: grouped.contact.contact_address || 'Jl. Braga No. 88\nBandung 40111\nIndonesia',
      }}
    />
  );
}
