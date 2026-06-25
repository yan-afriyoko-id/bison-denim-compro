import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getSectionColorStyles } from '@/lib/page-section-styles';
import { getPublishedPageBySlug } from '@/lib/public-content';
import { hasRichTextContent, RichTextRenderer } from '@/lib/rich-text';

function getContentValue(content: Record<string, unknown>, key: string, fallback = '') {
  const value = content[key];
  return typeof value === 'string' ? value : fallback;
}

function getContentArray(content: Record<string, unknown>, key: string) {
  const value = content[key];
  return Array.isArray(value) ? value : [];
}

export default async function CompanyInformationPage() {
  const { page, sections } = await getPublishedPageBySlug('about/company-information');

  if (!page) {
    notFound();
  }

  const heroSection = sections.find((section) => section.internal_name === 'company-hero' || section.section_type === 'hero');
  const profileSection = sections.find((section) => section.internal_name === 'company-profile' || section.section_type === 'rich_text');
  const statsSection = sections.find((section) => section.internal_name === 'company-stats' || section.section_type === 'stats');
  const valuesSection = sections.find((section) => section.internal_name === 'company-values');
  const ctaSection = sections.find((section) => section.internal_name === 'company-cta' || section.section_type === 'cta');

  const heroContent = (heroSection?.content ?? {}) as Record<string, unknown>;
  const profileContent = (profileSection?.content ?? {}) as Record<string, unknown>;
  const statsContent = (statsSection?.content ?? {}) as Record<string, unknown>;
  const valuesContent = (valuesSection?.content ?? {}) as Record<string, unknown>;
  const ctaContent = (ctaSection?.content ?? {}) as Record<string, unknown>;

  const profileParagraphs = getContentArray(profileContent, 'paragraphs').filter((item): item is string => typeof item === 'string');
  const statItems = getContentArray(statsContent, 'items').filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null);
  const valueItems = getContentArray(valuesContent, 'items').filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null);
  const heroStyles = heroSection
    ? getSectionColorStyles(heroSection, { titleColor: '#ffffff' })
    : { titleStyle: undefined };
  const profileStyles = profileSection
    ? getSectionColorStyles(profileSection, { titleColor: '#1E1E1E', bodyColor: '#555555', linkColor: '#1E1E1E' })
    : { titleStyle: undefined, bodyStyle: undefined, linkColor: undefined };
  const statsStyles = statsSection
    ? getSectionColorStyles(statsSection, { titleColor: '#1E1E1E', bodyColor: '#555555' })
    : { titleStyle: undefined, bodyStyle: undefined };
  const valuesStyles = valuesSection
    ? getSectionColorStyles(valuesSection, { titleColor: '#1E1E1E', bodyColor: '#555555' })
    : { titleStyle: undefined, bodyStyle: undefined };
  const ctaStyles = ctaSection
    ? getSectionColorStyles(ctaSection, {
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        linkColor: '#ffffff',
        buttonTextColor: '#1E1E1E',
        buttonBackgroundColor: '#ffffff',
      })
    : { titleStyle: undefined, bodyStyle: undefined, linkColor: undefined, buttonStyle: undefined };

  return (
    <>
      <section className="relative h-[300px] bg-[#1E1E1E]">
        {getContentValue(heroContent, 'image') && (
          <Image
            src={getContentValue(heroContent, 'image')}
            alt={getContentValue(heroContent, 'title', page.title)}
            fill
            className="object-cover opacity-60"
            priority
          />
        )}
        <div className="absolute inset-0 flex items-center">
          <div className="mx-auto max-w-7xl px-6 w-full">
            <h1 className="text-4xl font-bold sm:text-5xl" style={heroStyles.titleStyle}>
              {getContentValue(heroContent, 'title', page.title)}
            </h1>
          </div>
        </div>
      </section>

      <section className="py-24 px-6">
        <div className="mx-auto max-w-7xl">
          <div className="grid md:grid-cols-2 gap-16 items-start">
            <div>
              <h2 className="mb-6 text-2xl font-bold" style={profileStyles.titleStyle}>
                {getContentValue(profileContent, 'title', 'Profil Perusahaan')}
              </h2>
              {profileParagraphs.length > 0 ? (
                profileParagraphs.map((paragraph, index) => (
                  <p key={`${page.id}-profile-${index}`} className="mb-5 text-base leading-relaxed" style={profileStyles.bodyStyle}>
                    {paragraph}
                  </p>
                ))
              ) : hasRichTextContent(profileContent.body) ? (
                <RichTextRenderer
                  content={profileContent.body}
                  className="text-base leading-relaxed [&_a]:underline"
                  style={profileStyles.bodyStyle}
                  linkColor={profileStyles.linkColor}
                />
              ) : null}
            </div>
            <div>
              <div className="relative aspect-[4/3] border border-[#d4d4d4]">
                {getContentValue(profileContent, 'image') && (
                  <Image
                    src={getContentValue(profileContent, 'image')}
                    alt={getContentValue(profileContent, 'image_alt', getContentValue(profileContent, 'title', page.title))}
                    fill
                    className="object-cover"
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 px-6 bg-[#f5f5f5]">
        <div className="mx-auto max-w-7xl">
          <div className="grid sm:grid-cols-3 gap-12 text-center">
            {statItems.map((item, index) => (
              <div key={`${page.id}-stat-${index}`}>
                <div className="mb-2 text-4xl font-bold" style={statsStyles.titleStyle}>{typeof item.value === 'string' ? item.value : ''}</div>
                <p className="text-sm" style={statsStyles.bodyStyle}>{typeof item.label === 'string' ? item.label : ''}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-6 border-t border-[#d4d4d4]">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-10 text-2xl font-bold" style={valuesStyles.titleStyle}>
            {getContentValue(valuesContent, 'title', 'Nilai Kami')}
          </h2>
          <div className="grid sm:grid-cols-3 gap-8">
            {valueItems.map((item, index) => (
              <div key={`${page.id}-value-${index}`}>
                <h3 className="mb-3 text-sm font-bold" style={valuesStyles.titleStyle}>{typeof item.title === 'string' ? item.title : ''}</h3>
                <p className="text-sm leading-relaxed" style={valuesStyles.bodyStyle}>{typeof item.description === 'string' ? item.description : ''}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-6 bg-[#1E1E1E]">
        <div className="mx-auto max-w-7xl text-center">
          <h2 className="mb-4 text-2xl font-bold" style={ctaStyles.titleStyle}>{getContentValue(ctaContent, 'title', 'Hubungi Kami')}</h2>
          {hasRichTextContent(ctaContent.description) ? (
            <RichTextRenderer
              content={ctaContent.description}
              className="mx-auto mb-6 max-w-xl text-sm leading-relaxed [&_h2]:font-semibold [&_h3]:font-semibold [&_h4]:font-semibold [&_a]:underline"
              style={ctaStyles.bodyStyle}
              linkColor={ctaStyles.linkColor}
            />
          ) : (
            <p className="mx-auto mb-6 max-w-xl text-sm leading-relaxed" style={ctaStyles.bodyStyle}>
              {getContentValue(ctaContent, 'description')}
            </p>
          )}
          <Link
            href={getContentValue(ctaContent, 'button_href', '/contact-us')}
            className="inline-block px-8 py-3 text-sm font-bold transition-colors duration-200 hover:opacity-90"
            style={ctaStyles.buttonStyle}
          >
            {getContentValue(ctaContent, 'button_label', 'Hubungi Kami')}
          </Link>
        </div>
      </section>
    </>
  );
}
