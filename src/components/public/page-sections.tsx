import Image from 'next/image';
import Link from 'next/link';
import type { CSSProperties } from 'react';
import { hasRichTextContent, RichTextRenderer } from '@/lib/rich-text';
import type { PageSection, Post, Service } from '@/types';

function getSectionContent(section: PageSection) {
  return (section.content ?? {}) as Record<string, unknown>;
}

function getText(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

function getNumber(value: unknown, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function getObjectArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null) : [];
}

function renderSectionIntro(
  section: PageSection,
  title: unknown,
  description: unknown,
  fallbackTitle: string
) {
  const styles = getSectionColorStyles(section, {
    titleColor: '#1E1E1E',
    bodyColor: '#555555',
    linkColor: '#1E1E1E',
  });

  return {
    styles,
    node: (
      <div className="mb-12">
        <h2 className="text-3xl font-bold sm:text-4xl" style={styles.titleStyle}>
          {getText(title, fallbackTitle)}
        </h2>
        <RichTextRenderer
          content={hasRichTextContent(description) ? description : ''}
          className="mt-3 text-base leading-relaxed [&_a]:underline"
          style={styles.bodyStyle}
          linkColor={styles.linkColor}
        />
      </div>
    ),
  };
}

function getSectionSettings(section: PageSection) {
  return (section.settings ?? {}) as Record<string, unknown>;
}

function getOptionalColor(value: unknown) {
  if (typeof value !== 'string') {
    return undefined;
  }

  const color = value.trim();
  return color ? color : undefined;
}

function getSectionColorStyles(section: PageSection, fallback: {
  titleColor?: string;
  bodyColor?: string;
  linkColor?: string;
  buttonTextColor?: string;
  buttonBackgroundColor?: string;
} = {}) {
  const settings = getSectionSettings(section);
  const titleColor = getOptionalColor(settings.title_color) ?? fallback.titleColor;
  const bodyColor = getOptionalColor(settings.body_color) ?? fallback.bodyColor;
  const linkColor = getOptionalColor(settings.link_color) ?? fallback.linkColor ?? bodyColor;
  const buttonTextColor = getOptionalColor(settings.button_text_color) ?? fallback.buttonTextColor;
  const buttonBackgroundColor = getOptionalColor(settings.button_background_color) ?? fallback.buttonBackgroundColor;

  return {
    titleStyle: titleColor ? ({ color: titleColor } satisfies CSSProperties) : undefined,
    bodyStyle: bodyColor ? ({ color: bodyColor } satisfies CSSProperties) : undefined,
    linkColor,
    buttonStyle:
      buttonTextColor || buttonBackgroundColor
        ? ({
            ...(buttonTextColor ? { color: buttonTextColor } : {}),
            ...(buttonBackgroundColor ? { backgroundColor: buttonBackgroundColor } : {}),
          } satisfies CSSProperties)
        : undefined,
  };
}

function isRenderableImageSrc(value: unknown): value is string {
  if (typeof value !== 'string') {
    return false;
  }

  const src = value.trim();
  return src.startsWith('/') || src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:') || src.startsWith('blob:');
}

function getRenderableImageSrc(value: unknown) {
  return isRenderableImageSrc(value) ? value.trim() : '';
}

function isSafeHref(value: unknown): value is string {
  if (typeof value !== 'string') {
    return false;
  }

  const href = value.trim();
  return (
    href.startsWith('/') ||
    href.startsWith('#') ||
    href.startsWith('http://') ||
    href.startsWith('https://') ||
    href.startsWith('mailto:') ||
    href.startsWith('tel:')
  );
}

function renderHrefButton(
  href: unknown,
  label: unknown,
  className: string,
  style?: CSSProperties
) {
  const buttonLabel = getText(label);
  const buttonHref = isSafeHref(href) ? href.trim() : '';

  if (!buttonLabel || !buttonHref) {
    return null;
  }

  if (buttonHref.startsWith('http://') || buttonHref.startsWith('https://') || buttonHref.startsWith('mailto:') || buttonHref.startsWith('tel:')) {
    return (
      <a href={buttonHref} className={className} style={style}>
        {buttonLabel} &rarr;
      </a>
    );
  }

  return (
    <Link href={buttonHref} className={className} style={style}>
      {buttonLabel} &rarr;
    </Link>
  );
}

export function renderPublicPageSection(
  section: PageSection,
  context: {
    services: Service[];
    posts: Post[];
  }
) {
  const content = getSectionContent(section);

  switch (section.section_type) {
    case 'hero': {
      const heroImage = getRenderableImageSrc(content.image);
      const styles = getSectionColorStyles(section, {
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        linkColor: '#ffffff',
        buttonTextColor: '#1E1E1E',
        buttonBackgroundColor: '#ffffff',
      });

      return (
        <section key={section.id} className="relative min-h-[420px] bg-[#1E1E1E]">
          {heroImage ? <Image src={heroImage} alt={getText(content.title, 'Hero')} fill className="object-cover opacity-60" /> : null}
          <div className="relative mx-auto flex min-h-[420px] max-w-7xl items-center px-6 py-20">
            <div className="max-w-3xl">
              <h1 className="text-4xl font-bold sm:text-5xl" style={styles.titleStyle}>{getText(content.title, 'Page')}</h1>
              <RichTextRenderer
                content={hasRichTextContent(content.description) ? content.description : ''}
                className="mt-4 text-base leading-relaxed [&_h2]:font-semibold [&_h3]:font-semibold [&_h4]:font-semibold [&_a]:underline"
                style={styles.bodyStyle}
                linkColor={styles.linkColor}
              />
              {renderHrefButton(content.cta_href, content.cta_label, 'mt-6 inline-flex items-center gap-2 px-6 py-3 text-sm font-bold transition-colors duration-200 hover:opacity-90', styles.buttonStyle)}
            </div>
          </div>
        </section>
      );
    }
    case 'intro': {
      const primaryImage = getRenderableImageSrc(content.image);
      const secondaryImage = getRenderableImageSrc(content.secondary_image);
      const styles = getSectionColorStyles(section, {
        titleColor: '#1E1E1E',
        bodyColor: '#555555',
        linkColor: '#1E1E1E',
      });

      return (
        <section key={section.id} className="px-6 py-24">
          <div className="mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <h2 className="mb-6 text-3xl font-bold leading-tight sm:text-4xl" style={styles.titleStyle}>
                {getText(content.title, 'About Us')}
              </h2>
              <RichTextRenderer
                content={hasRichTextContent(content.body) ? content.body : ''}
                className="max-w-xl text-base leading-relaxed [&_a]:underline"
                style={styles.bodyStyle}
                linkColor={styles.linkColor}
              />
              {renderHrefButton(content.link_href, content.link_label, 'mt-6 inline-flex items-center gap-2 text-sm font-bold transition-colors duration-200 hover:opacity-60', styles.titleStyle)}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="relative aspect-[3/4] overflow-hidden border border-[#d4d4d4] bg-[#f5f5f5]">
                {primaryImage ? <Image src={primaryImage} alt={getText(content.title, 'About image')} fill className="object-cover" /> : null}
              </div>
              <div className="relative aspect-[3/4] overflow-hidden border border-[#d4d4d4] bg-[#f5f5f5]">
                {secondaryImage ? <Image src={secondaryImage} alt={`${getText(content.title, 'About Us')} secondary`} fill className="object-cover" /> : null}
              </div>
            </div>
          </div>
        </section>
      );
    }
    case 'services': {
      const services = context.services.slice(0, getNumber(content.limit, 5));
      const styles = getSectionColorStyles(section, {
        titleColor: '#1E1E1E',
        bodyColor: '#555555',
        linkColor: '#1E1E1E',
      });
      return (
        <section key={section.id} className="bg-[#f5f5f5] px-6 py-24">
          <div className="mx-auto max-w-7xl">
            <div className="mb-14">
              <h2 className="text-3xl font-bold sm:text-4xl" style={styles.titleStyle}>{getText(content.title, 'Our Products')}</h2>
              <RichTextRenderer
                content={hasRichTextContent(content.description) ? content.description : ''}
                className="mt-3 max-w-xl text-base leading-relaxed [&_a]:underline"
                style={styles.bodyStyle}
                linkColor={styles.linkColor}
              />
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {services.map((item) => (
                <Link key={item.id} href={`/services/${item.slug}`} className="block border border-[#d4d4d4] bg-white transition-colors duration-200 hover:border-[#1E1E1E]">
                  <div className="relative aspect-[4/3] bg-[#f5f5f5]">
                    {item.cover_image_url ? <Image src={item.cover_image_url} alt={item.title} fill className="object-cover" /> : null}
                  </div>
                  <div className="p-5">
                    <h3 className="mb-1.5 text-sm font-bold" style={styles.titleStyle}>{item.title}</h3>
                    <p className="text-xs leading-relaxed" style={styles.bodyStyle}>{item.excerpt ?? ''}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      );
    }
    case 'news': {
      const posts = context.posts.slice(0, getNumber(content.limit, 4));
      const styles = getSectionColorStyles(section, {
        titleColor: '#1E1E1E',
        bodyColor: '#555555',
        linkColor: '#1E1E1E',
      });
      return (
        <section key={section.id} className="border-t border-[#d4d4d4] bg-[#f5f5f5] px-6 py-24">
          <div className="mx-auto max-w-7xl">
            <div className="mb-12">
              <h2 className="text-3xl font-bold sm:text-4xl" style={styles.titleStyle}>{getText(content.title, 'Latest News')}</h2>
              <RichTextRenderer
                content={hasRichTextContent(content.description) ? content.description : ''}
                className="mt-3 text-base leading-relaxed [&_a]:underline"
                style={styles.bodyStyle}
                linkColor={styles.linkColor}
              />
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {posts.map((item) => (
                <Link key={item.id} href={`/news/${item.slug}`} className="block border border-[#d4d4d4] bg-white transition-colors duration-200 hover:border-[#1E1E1E]">
                  <div className="relative aspect-[4/3] bg-[#f5f5f5]">
                    {item.cover_image_url ? <Image src={item.cover_image_url} alt={item.title} fill className="object-cover" /> : null}
                  </div>
                  <div className="p-5">
                    <h3 className="mt-1 text-sm font-bold leading-snug" style={styles.titleStyle}>{item.title}</h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      );
    }
    case 'rich_text': {
      const richTextStyles = getSectionColorStyles(section, {
        titleColor: '#1E1E1E',
        bodyColor: '#555555',
        linkColor: '#1E1E1E',
      });
      return (
        <section key={section.id} className="px-6 py-24">
          <div className="mx-auto max-w-4xl">
            {getText(content.title) ? <h2 className="mb-6 text-3xl font-bold" style={richTextStyles.titleStyle}>{getText(content.title)}</h2> : null}
            <RichTextRenderer
              content={hasRichTextContent(content.body) ? content.body : ''}
              className="text-base leading-relaxed [&_a]:underline"
              style={richTextStyles.bodyStyle}
              linkColor={richTextStyles.linkColor}
            />
          </div>
        </section>
      );
    }
    case 'cta': {
      const styles = getSectionColorStyles(section, {
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        linkColor: '#ffffff',
        buttonTextColor: '#1E1E1E',
        buttonBackgroundColor: '#ffffff',
      });
      return (
        <section key={section.id} className="bg-[#1E1E1E] px-6 py-24">
          <div className="mx-auto max-w-7xl text-center">
            <h2 className="mb-4 text-3xl font-bold" style={styles.titleStyle}>{getText(content.title, 'Contact Us')}</h2>
            <RichTextRenderer
              content={hasRichTextContent(content.description) ? content.description : ''}
              className="mx-auto mb-8 max-w-xl text-base leading-relaxed [&_h2]:font-semibold [&_h3]:font-semibold [&_h4]:font-semibold [&_a]:underline"
              style={styles.bodyStyle}
              linkColor={styles.linkColor}
            />
            {renderHrefButton(content.button_href, content.button_label, 'inline-flex items-center gap-2 px-6 py-3 text-sm font-bold transition-colors duration-200 hover:opacity-90', styles.buttonStyle)}
          </div>
        </section>
      );
    }
    case 'contact': {
      const styles = getSectionColorStyles(section, {
        titleColor: '#1E1E1E',
        bodyColor: '#555555',
        linkColor: '#1E1E1E',
      });
      return (
        <section key={section.id} className="px-6 py-24">
          <div className="mx-auto max-w-4xl">
            {getText(content.title) ? <h2 className="mb-6 text-3xl font-bold" style={styles.titleStyle}>{getText(content.title)}</h2> : null}
            <RichTextRenderer
              content={hasRichTextContent(content.description) ? content.description : ''}
              className="text-base leading-relaxed [&_a]:underline"
              style={styles.bodyStyle}
              linkColor={styles.linkColor}
            />
            {(getText(content.email) || getText(content.phone)) ? (
              <div className="mt-8 grid gap-4 md:grid-cols-2">
                {getText(content.email) ? (
                  <a href={`mailto:${getText(content.email)}`} className="rounded-sm border border-[#d4d4d4] p-5 text-sm transition-colors hover:border-[#1E1E1E] hover:text-[#1E1E1E]" style={styles.bodyStyle}>
                    {getText(content.email)}
                  </a>
                ) : null}
                {getText(content.phone) ? (
                  <a href={`tel:${getText(content.phone)}`} className="rounded-sm border border-[#d4d4d4] p-5 text-sm transition-colors hover:border-[#1E1E1E] hover:text-[#1E1E1E]" style={styles.bodyStyle}>
                    {getText(content.phone)}
                  </a>
                ) : null}
              </div>
            ) : null}
          </div>
        </section>
      );
    }
    case 'stats': {
      const items = getObjectArray(content.items);
      const styles = getSectionColorStyles(section, {
        titleColor: '#1E1E1E',
        bodyColor: '#555555',
      });
      return (
        <section key={section.id} className="bg-[#f5f5f5] px-6 py-24">
          <div className="mx-auto max-w-7xl">
            {getText(content.title) ? (
              <h2 className="mb-10 text-center text-3xl font-bold sm:text-4xl" style={styles.titleStyle}>
                {getText(content.title)}
              </h2>
            ) : null}
            <div className="grid gap-12 text-center sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item, index) => (
                <div key={`${section.id}-stat-${index}`}>
                  <div className="mb-2 text-4xl font-bold" style={styles.titleStyle}>{getText(item.value)}</div>
                  <p className="text-sm" style={styles.bodyStyle}>{getText(item.label)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      );
    }
    case 'projects': {
      const items = getObjectArray(content.items);
      const { node, styles } = renderSectionIntro(section, content.title, content.description, 'Projects');

      return (
        <section key={section.id} className="px-6 py-24">
          <div className="mx-auto max-w-7xl">
            {node}
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {items.map((item, index) => {
                const imageSrc = getRenderableImageSrc(item.image);

                return (
                  <article key={`${section.id}-project-${index}`} className="overflow-hidden border border-[#d4d4d4] bg-white">
                    <div className="relative aspect-[4/3] bg-[#f5f5f5]">
                      {imageSrc ? <Image src={imageSrc} alt={getText(item.title, 'Project image')} fill className="object-cover" /> : null}
                    </div>
                    <div className="p-5">
                      <h3 className="text-lg font-bold" style={styles.titleStyle}>{getText(item.title)}</h3>
                      <RichTextRenderer
                        content={hasRichTextContent(item.description) ? item.description : ''}
                        className="mt-3 text-sm leading-relaxed [&_a]:underline"
                        style={styles.bodyStyle}
                        linkColor={styles.linkColor}
                      />
                      {renderHrefButton(item.link_href, item.link_label, 'mt-4 inline-flex items-center gap-2 text-sm font-bold transition-colors duration-200 hover:opacity-70', styles.titleStyle)}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      );
    }
    case 'process': {
      const steps = getObjectArray(content.steps);
      const { node, styles } = renderSectionIntro(section, content.title, content.description, 'Process');

      return (
        <section key={section.id} className="bg-[#f5f5f5] px-6 py-24">
          <div className="mx-auto max-w-7xl">
            {node}
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {steps.map((step, index) => (
                <article key={`${section.id}-step-${index}`} className="border border-[#d4d4d4] bg-white p-5">
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400">Step {index + 1}</p>
                  <h3 className="mt-3 text-lg font-bold" style={styles.titleStyle}>{getText(step.title)}</h3>
                  <RichTextRenderer
                    content={hasRichTextContent(step.description) ? step.description : ''}
                    className="mt-3 text-sm leading-relaxed [&_a]:underline"
                    style={styles.bodyStyle}
                    linkColor={styles.linkColor}
                  />
                </article>
              ))}
            </div>
          </div>
        </section>
      );
    }
    case 'partners': {
      const items = getObjectArray(content.items);
      const { node, styles } = renderSectionIntro(section, content.title, content.description, 'Partners');

      return (
        <section key={section.id} className="px-6 py-24">
          <div className="mx-auto max-w-7xl">
            {node}
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {items.map((item, index) => {
                const logoSrc = getRenderableImageSrc(item.logo);
                const href = isSafeHref(item.url) ? item.url.trim() : '';
                const card = (
                  <div className="flex h-full flex-col items-center justify-center border border-[#d4d4d4] bg-white p-6 text-center">
                    <div className="relative mb-4 h-16 w-full max-w-[160px]">
                      {logoSrc ? <Image src={logoSrc} alt={getText(item.name, 'Partner logo')} fill className="object-contain" /> : null}
                    </div>
                    <p className="text-sm font-bold" style={styles.titleStyle}>{getText(item.name)}</p>
                  </div>
                );

                if (!href) {
                  return <div key={`${section.id}-partner-${index}`}>{card}</div>;
                }

                return href.startsWith('/')
                  ? <Link key={`${section.id}-partner-${index}`} href={href}>{card}</Link>
                  : <a key={`${section.id}-partner-${index}`} href={href} target="_blank" rel="noopener noreferrer">{card}</a>;
              })}
            </div>
          </div>
        </section>
      );
    }
    case 'testimonials': {
      const items = getObjectArray(content.items);
      const { node, styles } = renderSectionIntro(section, content.title, content.description, 'Testimonials');

      return (
        <section key={section.id} className="bg-[#1E1E1E] px-6 py-24">
          <div className="mx-auto max-w-7xl">
            <div className="[&_h2]:text-white [&_p]:text-white/75">{node}</div>
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {items.map((item, index) => {
                const avatarSrc = getRenderableImageSrc(item.avatar);

                return (
                  <article key={`${section.id}-testimonial-${index}`} className="border border-white/15 bg-white/5 p-6 backdrop-blur-sm">
                    <RichTextRenderer
                      content={hasRichTextContent(item.quote) ? item.quote : ''}
                      className="text-sm leading-relaxed [&_a]:underline"
                      style={styles.bodyStyle ?? { color: '#d4d4d4' }}
                      linkColor={styles.linkColor ?? '#ffffff'}
                    />
                    <div className="mt-5 flex items-center gap-3">
                      <div className="relative h-12 w-12 overflow-hidden rounded-full border border-white/10 bg-white/10">
                        {avatarSrc ? <Image src={avatarSrc} alt={getText(item.author, 'Avatar')} fill className="object-cover" /> : null}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{getText(item.author)}</p>
                        <p className="text-xs text-white/65">{getText(item.role)}</p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      );
    }
    case 'gallery': {
      const items = getObjectArray(content.items);
      const { node, styles } = renderSectionIntro(section, content.title, content.description, 'Gallery');

      return (
        <section key={section.id} className="px-6 py-24">
          <div className="mx-auto max-w-7xl">
            {node}
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((item, index) => {
                const imageSrc = getRenderableImageSrc(item.image);
                return (
                  <figure key={`${section.id}-gallery-${index}`} className="overflow-hidden border border-[#d4d4d4] bg-white">
                    <div className="relative aspect-[4/3] bg-[#f5f5f5]">
                      {imageSrc ? <Image src={imageSrc} alt={getText(item.alt, 'Gallery image')} fill className="object-cover" /> : null}
                    </div>
                    {(getText(item.caption) || getText(item.alt)) ? (
                      <figcaption className="p-4">
                        {getText(item.caption) ? <p className="text-sm font-bold" style={styles.titleStyle}>{getText(item.caption)}</p> : null}
                        {getText(item.alt) ? <p className="mt-1 text-xs" style={styles.bodyStyle}>{getText(item.alt)}</p> : null}
                      </figcaption>
                    ) : null}
                  </figure>
                );
              })}
            </div>
          </div>
        </section>
      );
    }
    default:
      return null;
  }
}

export function PublicPageSections({
  sections,
  services,
  posts,
}: {
  sections: PageSection[];
  services: Service[];
  posts: Post[];
}) {
  return <>{sections.map((section) => renderPublicPageSection(section, { services, posts }))}</>;
}
