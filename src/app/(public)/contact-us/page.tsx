import { ContactPageClient } from '@/components/public/contact-page-client';
import { getPublicSiteSettings } from '@/lib/public-content';

export default async function ContactPage() {
  const { grouped } = await getPublicSiteSettings();

  return (
    <ContactPageClient
      contactInfo={{
        siteName: grouped.brand.site_name,
        description: grouped.company.site_description,
        email: grouped.contact.contact_email,
        phone: grouped.contact.contact_phone,
        address: grouped.contact.contact_address,
      }}
    />
  );
}
