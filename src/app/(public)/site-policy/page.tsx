import { notFound } from 'next/navigation';
import { getPublishedPageBySlug } from '@/lib/public-content';
import { isRichTextDocument, RichTextRenderer } from '@/lib/rich-text';

function sectionParagraphs(sections: Awaited<ReturnType<typeof getPublishedPageBySlug>>['sections']) {
  return sections.flatMap((section) => {
    const content = (section.content ?? {}) as Record<string, unknown>;
    const body = content.body;
    return [
      {
        title: section.internal_name || (typeof content.title === 'string' ? content.title : ''),
        body,
      },
    ];
  });
}

export default async function SitePolicyPage() {
  const { page, sections } = await getPublishedPageBySlug('site-policy');

  if (!page) {
    notFound();
  }

  const contentBlocks = sectionParagraphs(sections);

  return (
    <>
      <section className="py-24 px-6 border-b border-[#d4d4d4]">
        <div className="mx-auto max-w-7xl text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-[#1E1E1E] mb-4">{page.title}</h1>
          <p className="text-[#555] text-base">Terakhir diperbarui: 1 Januari 2026</p>
        </div>
      </section>

      <section className="py-24 px-6">
        <div className="mx-auto max-w-3xl">
          <div className="space-y-8">
            {contentBlocks.map((block, index) => (
              <div key={`${page.id}-policy-${index}`}>
                <h2 className="text-xl font-bold text-[#1E1E1E] mb-3">{block.title}</h2>
                {isRichTextDocument(block.body) ? (
                  <RichTextRenderer content={block.body} className="text-[#555] text-base leading-relaxed" />
                ) : (
                  <RichTextRenderer content={typeof block.body === 'string' ? block.body : ''} className="text-[#555] text-base leading-relaxed" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
