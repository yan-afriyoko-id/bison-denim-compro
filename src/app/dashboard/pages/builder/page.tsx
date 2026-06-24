'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { sectionTypeLabels } from '@/config/site';
import {
  Plus,
  Eye,
  EyeOff,
  Trash2,
  GripVertical,
  Save,
  Send,
  ArrowLeft,
  Copy,
} from 'lucide-react';
import type { Page, PageSection, SectionType } from '@/types';
import { toast } from 'sonner';
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { createPage, duplicatePage, setPageStatus, updatePage } from '@/actions/pages.actions';
import { createSection, deleteSection, reorderSections, toggleSectionVisibility, updateSection } from '@/actions/sections.actions';
import { slugify } from '@/lib/utils';
import { ImageInput } from '@/components/dashboard/image-input';
import { RichTextEditor } from '@/components/dashboard/rich-text-editor';
import { EMPTY_RICH_TEXT_DOCUMENT, RichTextRenderer } from '@/lib/rich-text';

type EditablePageSection = PageSection & {
  contentText: string;
  settingsText: string;
};

const sectionTemplates: Partial<Record<SectionType, { content: Record<string, unknown>; settings?: Record<string, unknown> }>> = {
  hero: { content: { title: '', description: EMPTY_RICH_TEXT_DOCUMENT, cta_label: '', cta_href: '', image: '' } },
  intro: { content: { title: '', body: EMPTY_RICH_TEXT_DOCUMENT, image: '', secondary_image: '', link_label: '', link_href: '' } },
  services: { content: { title: '', description: EMPTY_RICH_TEXT_DOCUMENT, limit: 5 } },
  projects: { content: { title: '', description: '', items: [] } },
  news: { content: { title: '', description: EMPTY_RICH_TEXT_DOCUMENT, limit: 4 } },
  rich_text: { content: { title: '', body: EMPTY_RICH_TEXT_DOCUMENT } },
  cta: { content: { title: '', description: EMPTY_RICH_TEXT_DOCUMENT, button_label: '', button_href: '' } },
  contact: { content: { title: '', description: EMPTY_RICH_TEXT_DOCUMENT, email: '', phone: '' } },
};

const supportedSectionTypes = new Set<SectionType>([
  'hero',
  'intro',
  'services',
  'news',
  'rich_text',
  'cta',
  'contact',
]);

function toEditableSection(section: PageSection): EditablePageSection {
  return {
    ...section,
    contentText: JSON.stringify(section.content ?? {}, null, 2),
    settingsText: JSON.stringify(section.settings ?? {}, null, 2),
  };
}

function getSectionContent(section: EditablePageSection | PageSection) {
  return (section.content ?? {}) as Record<string, unknown>;
}

function canUseStructuredEditor(section: EditablePageSection) {
  if (!supportedSectionTypes.has(section.section_type)) {
    return false;
  }

  const content = getSectionContent(section);

  if (section.section_type === 'rich_text') {
    if (Array.isArray(content.paragraphs) || Array.isArray(content.items) || typeof content.image === 'string') {
      return false;
    }
  }

  return true;
}

function SortableSectionCard({
  section,
  index,
  activeSectionId,
  onSelect,
  onToggleVisibility,
  onDelete,
}: {
  section: EditablePageSection;
  index: number;
  activeSectionId: string | null;
  onSelect: (sectionId: string) => void;
  onToggleVisibility: (sectionId: string, visible: boolean) => void;
  onDelete: (sectionId: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: section.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`rounded-sm border bg-white ${activeSectionId === section.id ? 'border-gray-900' : 'border-gray-200'}`}
    >
      <div className="flex items-center gap-3 p-4">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="cursor-grab text-gray-300 hover:text-gray-900"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => onSelect(section.id)} className="flex-1 text-left">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 font-mono">{String(index + 1).padStart(2, '0')}</span>
            <span className="text-sm font-bold text-gray-900">
              {section.internal_name || sectionTypeLabels[section.section_type] || section.section_type}
            </span>
            <span className="inline-block rounded-sm border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] font-medium text-gray-500">
              {sectionTypeLabels[section.section_type] ?? section.section_type}
            </span>
            {!supportedSectionTypes.has(section.section_type) && (
              <span className="inline-block rounded-sm border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">
                coming soon
              </span>
            )}
          </div>
        </button>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onToggleVisibility(section.id, !section.is_visible)}
            className="flex h-8 w-8 items-center justify-center rounded-sm text-gray-400 hover:text-gray-900 hover:bg-gray-50 transition-colors"
          >
            {section.is_visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={() => onDelete(section.id)}
            className="flex h-8 w-8 items-center justify-center rounded-sm text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PageBuilderPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pageId = searchParams.get('id');
  const [isPending, startTransition] = useTransition();

  const [page, setPage] = useState<Page | null>(null);
  const [sections, setSections] = useState<EditablePageSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [ogImageUrl, setOgImageUrl] = useState('');
  const [isIndexed, setIsIndexed] = useState(true);
  const [status, setStatus] = useState<'draft' | 'published' | 'archived'>('draft');
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const activeSection = useMemo(
    () => sections.find((section) => section.id === activeSectionId) ?? null,
    [sections, activeSectionId]
  );

  function updateSectionDraft(sectionId: string, updater: (section: EditablePageSection) => EditablePageSection) {
    setSections((prev) => prev.map((section) => (section.id === sectionId ? updater(section) : section)));
  }

  function updateStructuredSectionContent(sectionId: string, key: string, value: unknown) {
    updateSectionDraft(sectionId, (section) => {
      const nextContent = {
        ...getSectionContent(section),
        [key]: value,
      };

      return {
        ...section,
        content: nextContent,
        contentText: JSON.stringify(nextContent, null, 2),
      };
    });
  }

  useEffect(() => {
    async function load() {
      if (!pageId) {
        setLoading(false);
        return;
      }

      const [pageRes, sectionsRes] = await Promise.all([
        fetch(`/api/pages/${pageId}`),
        fetch(`/api/pages/${pageId}/sections`),
      ]);

      if (pageRes.ok) {
        const pageData = await pageRes.json();
        setPage(pageData);
        setTitle(pageData.title);
        setSlug(pageData.slug);
        setDescription(pageData.description ?? '');
        setSeoTitle(pageData.seo_title ?? '');
        setSeoDescription(pageData.seo_description ?? '');
        setOgImageUrl(pageData.og_image_url ?? '');
        setIsIndexed(pageData.is_indexed ?? true);
        setStatus(pageData.status ?? 'draft');
      }

      if (sectionsRes.ok) {
        const sectionsData = await sectionsRes.json();
        const editableSections = sectionsData
          .sort((a: PageSection, b: PageSection) => a.sort_order - b.sort_order)
          .map(toEditableSection);
        setSections(editableSections);
        setActiveSectionId(editableSections[0]?.id ?? null);
      }

      setLoading(false);
    }

    load();
  }, [pageId]);

  async function persistPage(nextStatus: 'draft' | 'published' | 'archived') {
    if (!pageId) return;

    const formData = new FormData();
    formData.set('title', title);
    formData.set('slug', slug || slugify(title));
    formData.set('description', description);
    formData.set('status', nextStatus);
    formData.set('seo_title', seoTitle);
    formData.set('seo_description', seoDescription);
    formData.set('og_image_url', ogImageUrl);
    formData.set('is_indexed', String(isIndexed));

    const result = await updatePage(pageId, formData);
    if (result.error) {
      toast.error(result.error);
      return;
    }

    setStatus(nextStatus);
    toast.success(nextStatus === 'published' ? 'Page published successfully' : 'Draft saved successfully');
  }

  async function handleAddSection(type: SectionType) {
    if (!pageId) return;

    const template = sectionTemplates[type];
    const result = await createSection(pageId, type);
    if (result.error || !result.data) {
      toast.error(result.error ?? 'Failed to add section');
      return;
    }

    const nextSection = toEditableSection({
      ...result.data,
      content: template?.content ?? result.data.content,
      settings: {
        ...(result.data.settings ?? {}),
        ...(template?.settings ?? {}),
      },
    } as PageSection);

    setSections((prev) => [...prev, nextSection]);
    setActiveSectionId(nextSection.id);
  }

  async function handleDeleteSection(sectionId: string) {
    if (!pageId) return;
    if (!confirm('Delete this section?')) return;

    const result = await deleteSection(sectionId, pageId);
    if (result.error) {
      toast.error(result.error);
      return;
    }

    const nextSections = sections.filter((section) => section.id !== sectionId);
    setSections(nextSections);
    setActiveSectionId(nextSections[0]?.id ?? null);
    toast.success('Section deleted');
  }

  async function handleToggleVisibility(sectionId: string, visible: boolean) {
    const result = await toggleSectionVisibility(sectionId, visible);
    if (result.error) {
      toast.error(result.error);
      return;
    }

    setSections((prev) => prev.map((section) => (section.id === sectionId ? { ...section, is_visible: visible } : section)));
  }

  async function handleSaveSection() {
    if (!activeSection || !pageId) return;

    try {
      const content = canUseStructuredEditor(activeSection)
        ? activeSection.content
        : JSON.parse(activeSection.contentText);
      const settings = JSON.parse(activeSection.settingsText);
      const result = await updateSection(activeSection.id, {
        internal_name: activeSection.internal_name,
        content,
        settings,
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      setSections((prev) =>
        prev.map((section) =>
          section.id === activeSection.id ? { ...section, content, settings } : section
        )
      );
      toast.success('Section saved successfully');
    } catch {
      toast.error('Invalid content/settings JSON');
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = sections.findIndex((section) => section.id === active.id);
    const newIndex = sections.findIndex((section) => section.id === over.id);
    const reordered = arrayMove(sections, oldIndex, newIndex).map((section, index) => ({
      ...section,
      sort_order: index,
    }));

    setSections(reordered);
    const result = await reorderSections(reordered.map((section) => ({ id: section.id, sort_order: section.sort_order })));
    if (result.error) {
      toast.error(result.error);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
      </div>
    );
  }

  if (!pageId) {
    return <CreatePageForm />;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/dashboard/pages')}
            className="flex h-8 w-8 items-center justify-center rounded-sm text-gray-400 hover:text-gray-900 hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{page?.title ?? 'Page Builder'}</h1>
            <p className="text-sm text-gray-400">/{slug || 'slug-halaman'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => startTransition(() => void persistPage('draft'))}
            disabled={isPending}
            className="flex items-center gap-1.5 border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600 hover:border-gray-900 hover:text-gray-900 transition-colors rounded-sm disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5" />
            Save Draft
          </button>
          <button
            onClick={() => startTransition(() => void persistPage('published'))}
            disabled={isPending}
            className="flex items-center gap-1.5 bg-gray-900 text-white px-3 py-2 text-xs font-bold rounded-sm hover:bg-black transition-colors disabled:opacity-50"
          >
            <Send className="h-3.5 w-3.5" />
            Publish
          </button>
          <button
            onClick={() =>
              startTransition(async () => {
                const result = await duplicatePage(pageId);
                if (result.error) toast.error(result.error);
                else toast.success('Page duplicated successfully');
              })
            }
            className="flex items-center gap-1.5 border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600 hover:border-gray-900 hover:text-gray-900 transition-colors rounded-sm"
          >
            <Copy className="h-3.5 w-3.5" />
            Duplicate
          </button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <div className="rounded-sm border border-gray-200 bg-white p-5 space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Title</label>
                <input
                  value={title}
                  onChange={(event) => {
                    const nextTitle = event.target.value;
                    setTitle(nextTitle);
                    if (!slug || slug === slugify(title)) {
                      setSlug(slugify(nextTitle));
                    }
                  }}
                  className="w-full rounded-sm border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-900"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Slug</label>
                <input
                  value={slug}
                  onChange={(event) => setSlug(event.target.value)}
                  className="w-full rounded-sm border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Description</label>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={3}
                className="w-full rounded-sm border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-900"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">SEO Title</label>
                <input
                  value={seoTitle}
                  onChange={(event) => setSeoTitle(event.target.value)}
                  className="w-full rounded-sm border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-900"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Status</label>
                <select
                  value={status}
                  onChange={(event) => setStatus(event.target.value as 'draft' | 'published' | 'archived')}
                  className="w-full rounded-sm border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-900"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">SEO Description</label>
              <textarea
                value={seoDescription}
                onChange={(event) => setSeoDescription(event.target.value)}
                rows={3}
                className="w-full rounded-sm border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-900"
              />
            </div>

            <ImageInput
              name="og_image_url"
              label="OG Image"
              defaultValue={ogImageUrl}
              onChange={setOgImageUrl}
              aspectClass="aspect-[21/9]"
              hint="Used for link preview when this page is shared"
            />

            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={isIndexed}
                onChange={(event) => setIsIndexed(event.target.checked)}
                className="h-4 w-4 accent-gray-900"
              />
              Allow search engines to index this page
            </label>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-gray-900">Sections</h2>
                <p className="text-xs text-gray-400">Drag to reorder, click to edit</p>
              </div>
            </div>

            {sections.length === 0 ? (
              <div className="border border-dashed border-gray-300 bg-white rounded-sm py-24 flex flex-col items-center justify-center">
                <p className="text-sm text-gray-500">No sections yet</p>
                <p className="text-xs text-gray-400 mt-1">Add your first section to get started.</p>
              </div>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={sections.map((section) => section.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-3">
                    {sections.map((section, index) => (
                      <SortableSectionCard
                        key={section.id}
                        section={section}
                        index={index}
                        activeSectionId={activeSectionId}
                        onSelect={setActiveSectionId}
                        onToggleVisibility={handleToggleVisibility}
                        onDelete={handleDeleteSection}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-sm border border-gray-200 bg-white p-4">
            <h3 className="text-sm font-bold text-gray-900 mb-3">Add Section</h3>
            <div className="space-y-1">
              {Object.entries(sectionTypeLabels).map(([type, label]) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => void handleAddSection(type as SectionType)}
                  className="w-full rounded-sm px-3 py-2 text-left text-xs text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors font-medium"
                >
                  <Plus className="mr-1 inline h-3.5 w-3.5" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-sm border border-gray-200 bg-white p-4 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Section Editor</h3>
              <p className="text-xs text-gray-400 mt-1">
                Supported sections use a structured form and rich text editor. Raw JSON remains available as a fallback for complex sections.
              </p>
            </div>

            {activeSection ? (
              <>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Internal Name</label>
                  <input
                    value={activeSection.internal_name ?? ''}
                    onChange={(event) =>
                      setSections((prev) =>
                        prev.map((section) =>
                          section.id === activeSection.id ? { ...section, internal_name: event.target.value } : section
                        )
                      )
                    }
                    className="w-full rounded-sm border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-900"
                  />
                </div>

                {canUseStructuredEditor(activeSection) ? (
                  <StructuredSectionEditor
                    section={activeSection}
                    onContentChange={(key, value) => updateStructuredSectionContent(activeSection.id, key, value)}
                  />
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Content JSON</label>
                    <textarea
                      rows={12}
                      value={activeSection.contentText}
                      onChange={(event) =>
                        setSections((prev) =>
                          prev.map((section) =>
                            section.id === activeSection.id ? { ...section, contentText: event.target.value } : section
                          )
                        )
                      }
                      className="w-full rounded-sm border border-gray-200 px-3 py-2 font-mono text-xs text-gray-900 outline-none focus:border-gray-900"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Settings JSON</label>
                  <textarea
                    rows={10}
                    value={activeSection.settingsText}
                    onChange={(event) =>
                      setSections((prev) =>
                        prev.map((section) =>
                          section.id === activeSection.id ? { ...section, settingsText: event.target.value } : section
                        )
                      )
                    }
                    className="w-full rounded-sm border border-gray-200 px-3 py-2 font-mono text-xs text-gray-900 outline-none focus:border-gray-900"
                  />
                </div>

                {canUseStructuredEditor(activeSection) && (
                  <div className="rounded-sm border border-gray-200 bg-gray-50 p-4">
                    <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-500">Preview</h4>
                    <SectionContentPreview section={activeSection} />
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => void handleSaveSection()}
                  className="w-full rounded-sm bg-gray-900 px-4 py-2 text-xs font-bold text-white hover:bg-black"
                >
                  Save Section
                </button>
              </>
            ) : (
              <p className="text-sm text-gray-400">Select a section to start editing.</p>
            )}
          </div>

          {page && (
            <button
              type="button"
              onClick={() =>
                startTransition(async () => {
                  const result = await setPageStatus(page.id, 'archived');
                  if (result.error) toast.error(result.error);
                  else {
                    setStatus('archived');
                    toast.success('Page archived successfully');
                  }
                })
              }
              className="w-full rounded-sm border border-red-200 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
            >
              Archive Page
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function StructuredSectionEditor({
  section,
  onContentChange,
}: {
  section: EditablePageSection;
  onContentChange: (key: string, value: unknown) => void;
}) {
  const content = getSectionContent(section);

  switch (section.section_type) {
    case 'hero':
      return (
        <div className="space-y-4">
          <TextField label="Title" value={typeof content.title === 'string' ? content.title : ''} onChange={(value) => onContentChange('title', value)} />
          <RichTextEditor label="Description" value={content.description} onChange={(value) => onContentChange('description', value)} placeholder="Write the hero description..." />
          <TextField label="Image URL" value={typeof content.image === 'string' ? content.image : ''} onChange={(value) => onContentChange('image', value)} />
          <div className="grid gap-4 md:grid-cols-2">
            <TextField label="CTA Label" value={typeof content.cta_label === 'string' ? content.cta_label : ''} onChange={(value) => onContentChange('cta_label', value)} />
            <TextField label="CTA Href" value={typeof content.cta_href === 'string' ? content.cta_href : ''} onChange={(value) => onContentChange('cta_href', value)} />
          </div>
        </div>
      );
    case 'intro':
      return (
        <div className="space-y-4">
          <TextField label="Title" value={typeof content.title === 'string' ? content.title : ''} onChange={(value) => onContentChange('title', value)} />
          <RichTextEditor label="Body" value={content.body} onChange={(value) => onContentChange('body', value)} placeholder="Write the intro body..." />
          <div className="grid gap-4 md:grid-cols-2">
            <TextField label="Primary Image URL" value={typeof content.image === 'string' ? content.image : ''} onChange={(value) => onContentChange('image', value)} />
            <TextField label="Secondary Image URL" value={typeof content.secondary_image === 'string' ? content.secondary_image : ''} onChange={(value) => onContentChange('secondary_image', value)} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <TextField label="Link Label" value={typeof content.link_label === 'string' ? content.link_label : ''} onChange={(value) => onContentChange('link_label', value)} />
            <TextField label="Link Href" value={typeof content.link_href === 'string' ? content.link_href : ''} onChange={(value) => onContentChange('link_href', value)} />
          </div>
        </div>
      );
    case 'services':
    case 'news':
      return (
        <div className="space-y-4">
          <TextField label="Title" value={typeof content.title === 'string' ? content.title : ''} onChange={(value) => onContentChange('title', value)} />
          <RichTextEditor
            label="Description"
            value={content.description}
            onChange={(value) => onContentChange('description', value)}
            placeholder={`Write the ${section.section_type} description...`}
          />
          <NumberField
            label="Limit"
            value={typeof content.limit === 'number' ? content.limit : 0}
            onChange={(value) => onContentChange('limit', value)}
          />
        </div>
      );
    case 'rich_text':
      return (
        <div className="space-y-4">
          <TextField label="Title" value={typeof content.title === 'string' ? content.title : ''} onChange={(value) => onContentChange('title', value)} />
          <RichTextEditor label="Body" value={content.body} onChange={(value) => onContentChange('body', value)} placeholder="Write the content..." />
        </div>
      );
    case 'cta':
      return (
        <div className="space-y-4">
          <TextField label="Title" value={typeof content.title === 'string' ? content.title : ''} onChange={(value) => onContentChange('title', value)} />
          <RichTextEditor label="Description" value={content.description} onChange={(value) => onContentChange('description', value)} placeholder="Write the CTA description..." />
          <div className="grid gap-4 md:grid-cols-2">
            <TextField label="Button Label" value={typeof content.button_label === 'string' ? content.button_label : ''} onChange={(value) => onContentChange('button_label', value)} />
            <TextField label="Button Href" value={typeof content.button_href === 'string' ? content.button_href : ''} onChange={(value) => onContentChange('button_href', value)} />
          </div>
        </div>
      );
    case 'contact':
      return (
        <div className="space-y-4">
          <TextField label="Title" value={typeof content.title === 'string' ? content.title : ''} onChange={(value) => onContentChange('title', value)} />
          <RichTextEditor label="Description" value={content.description} onChange={(value) => onContentChange('description', value)} placeholder="Write the contact description..." />
          <div className="grid gap-4 md:grid-cols-2">
            <TextField label="Email" value={typeof content.email === 'string' ? content.email : ''} onChange={(value) => onContentChange('email', value)} />
            <TextField label="Phone" value={typeof content.phone === 'string' ? content.phone : ''} onChange={(value) => onContentChange('phone', value)} />
          </div>
        </div>
      );
    default:
      return null;
  }
}

function SectionContentPreview({ section }: { section: EditablePageSection }) {
  const content = getSectionContent(section);

  if (section.section_type === 'hero') {
    return (
      <div className="space-y-3 text-sm text-gray-600">
        <h5 className="text-lg font-bold text-gray-900">{typeof content.title === 'string' ? content.title : 'Hero title'}</h5>
        <RichTextRenderer content={content.description} className="text-sm leading-relaxed text-gray-600" />
      </div>
    );
  }

  if (section.section_type === 'intro' || section.section_type === 'rich_text') {
    return (
      <div className="space-y-3 text-sm text-gray-600">
        {typeof content.title === 'string' && content.title ? <h5 className="text-lg font-bold text-gray-900">{content.title}</h5> : null}
        <RichTextRenderer content={content.body} className="text-sm leading-relaxed text-gray-600" />
      </div>
    );
  }

  if (section.section_type === 'services' || section.section_type === 'news' || section.section_type === 'cta' || section.section_type === 'contact') {
    return (
      <div className="space-y-3 text-sm text-gray-600">
        {typeof content.title === 'string' && content.title ? <h5 className="text-lg font-bold text-gray-900">{content.title}</h5> : null}
        <RichTextRenderer
          content={section.section_type === 'contact' || section.section_type === 'cta' || section.section_type === 'services' || section.section_type === 'news' ? content.description : ''}
          className="text-sm leading-relaxed text-gray-600"
        />
      </div>
    );
  }

  return <p className="text-sm text-gray-400">Preview is not available for this section yet.</p>;
}

function TextField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-500">{label}</label>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-sm border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-900"
      />
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-500">{label}</label>
      <input
        type="number"
        value={value}
        onChange={(event) => onChange(parseInt(event.target.value, 10) || 0)}
        className="w-full rounded-sm border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-900"
      />
    </div>
  );
}

function CreatePageForm() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setPending(true);

    const formData = new FormData();
    formData.set('title', title);
    formData.set('description', description);

    const result = await createPage(formData);
    if (result.error || !result.data) {
      setError(result.error ?? 'Failed to create page');
      setPending(false);
      return;
    }

    toast.success('Page created successfully');
    router.push(`/dashboard/pages/builder?id=${result.data.id}`);
  }

  return (
    <div className="max-w-md mx-auto pt-20">
      <div className="border border-gray-200 bg-white rounded-sm p-6 space-y-5">
        <h1 className="text-xl font-bold text-gray-900">Create New Page</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Page Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter page title"
              required
              className="w-full bg-white border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-900 transition-colors rounded-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full bg-white border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-900 transition-colors rounded-sm"
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={pending}
            className="w-full bg-gray-900 text-white py-2 text-sm font-bold rounded-sm hover:bg-black transition-colors disabled:opacity-50"
          >
            {pending ? 'Creating...' : 'Create Page'}
          </button>
        </form>
      </div>
    </div>
  );
}
