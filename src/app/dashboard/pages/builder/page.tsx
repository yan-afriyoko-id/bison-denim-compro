'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState, useTransition, type ReactNode } from 'react';
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
  MenuSquare,
} from 'lucide-react';
import type { NavigationItem, Page, PageSection, SectionType } from '@/types';
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
import { createPage, duplicatePage, getHeaderNavItems, getPageNavigationInfo, setPageStatus, updatePage, upsertPageNavigation } from '@/actions/pages.actions';
import { createSection, deleteSection, reorderSections, toggleSectionVisibility, updateSection } from '@/actions/sections.actions';
import { buildChildPagePath } from '@/lib/page-public-path';
import { slugify } from '@/lib/utils';
import { ImageInput } from '@/components/dashboard/image-input';
import { RichTextEditor } from '@/components/dashboard/rich-text-editor';
import { EMPTY_RICH_TEXT_DOCUMENT, RichTextRenderer } from '@/lib/rich-text';
import { ConfirmButton } from '@/components/ui/confirm-button';
import type { Post, Service } from '@/types';

type EditablePageSection = PageSection & {
  contentText: string;
  settingsText: string;
};

const sectionTemplates: Partial<Record<SectionType, { content: Record<string, unknown>; settings?: Record<string, unknown> }>> = {
  hero: { content: { title: '', description: EMPTY_RICH_TEXT_DOCUMENT, cta_label: '', cta_href: '', image: '' } },
  intro: { content: { title: '', body: EMPTY_RICH_TEXT_DOCUMENT, image: '', secondary_image: '', link_label: '', link_href: '' } },
  services: { content: { title: '', description: EMPTY_RICH_TEXT_DOCUMENT, limit: 5 } },
  stats: { content: { title: '', items: [{ value: '', label: '' }] } },
  projects: { content: { title: '', description: EMPTY_RICH_TEXT_DOCUMENT, items: [{ title: '', description: EMPTY_RICH_TEXT_DOCUMENT, image: '', link_label: '', link_href: '' }] } },
  process: { content: { title: '', description: EMPTY_RICH_TEXT_DOCUMENT, steps: [{ title: '', description: EMPTY_RICH_TEXT_DOCUMENT }] } },
  news: { content: { title: '', description: EMPTY_RICH_TEXT_DOCUMENT, limit: 4 } },
  partners: { content: { title: '', description: EMPTY_RICH_TEXT_DOCUMENT, items: [{ name: '', logo: '', url: '' }] } },
  testimonials: { content: { title: '', description: EMPTY_RICH_TEXT_DOCUMENT, items: [{ quote: EMPTY_RICH_TEXT_DOCUMENT, author: '', role: '', avatar: '' }] } },
  gallery: { content: { title: '', description: EMPTY_RICH_TEXT_DOCUMENT, items: [{ image: '', alt: '', caption: '' }] } },
  rich_text: { content: { title: '', body: EMPTY_RICH_TEXT_DOCUMENT } },
  cta: { content: { title: '', description: EMPTY_RICH_TEXT_DOCUMENT, button_label: '', button_href: '' } },
  contact: { content: { title: '', description: EMPTY_RICH_TEXT_DOCUMENT, email: '', phone: '' } },
};

const supportedSectionTypes = new Set<SectionType>([
  'hero',
  'intro',
  'services',
  'stats',
  'projects',
  'process',
  'news',
  'partners',
  'testimonials',
  'gallery',
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
          <ConfirmButton
            title="Delete Section"
            description="This section will be removed from the page permanently."
            confirmLabel="Delete Section"
            variant="destructive"
            className="flex h-8 w-8 items-center justify-center rounded-sm text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            onConfirm={() => onDelete(section.id)}
          >
            <Trash2 className="h-4 w-4" />
          </ConfirmButton>
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
  const [isIndexed, setIsIndexed] = useState(true);
  const [status, setStatus] = useState<'draft' | 'published' | 'archived'>('draft');
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [navMode, setNavMode] = useState<'none' | 'navbar' | 'child_navbar'>('none');
  const [navParentId, setNavParentId] = useState('');
  const [navItems, setNavItems] = useState<NavigationItem[]>([]);
  const [navItemId, setNavItemId] = useState<string | null>(null);
  const [publicHref, setPublicHref] = useState('');
  const [previewServices, setPreviewServices] = useState<Service[]>([]);
  const [previewPosts, setPreviewPosts] = useState<Post[]>([]);

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

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const [servicesRes, postsRes] = await Promise.all([fetch('/api/services'), fetch('/api/posts')]);
        const [servicesData, postsData] = await Promise.all([
          servicesRes.ok ? servicesRes.json() : [],
          postsRes.ok ? postsRes.json() : [],
        ]);

        if (!cancelled) {
          setPreviewServices(
            ((servicesData ?? []) as Service[]).filter((item) => item.status === 'published')
          );
          setPreviewPosts(
            ((postsData ?? []) as Post[]).filter((item) => item.status === 'published')
          );
        }
      } catch {
        if (!cancelled) {
          setPreviewServices([]);
          setPreviewPosts([]);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!pageId) return;
    getPageNavigationInfo(pageId).then((info) => {
      if (info.navItem) {
        setNavMode(info.navItem.parent_id ? 'child_navbar' : 'navbar');
        setNavParentId(info.navItem.parent_id ?? '');
        setNavItemId(info.navItem.id);
      } else {
        setNavMode('none');
        setNavParentId('');
        setNavItemId(null);
      }
      setNavItems(info.navItems);
      setPublicHref(info.publicHref);
    });
  }, [pageId]);

  const navigationPreviewHref = useMemo(() => {
    const normalizedSlug = slug.trim().replace(/^\/+|\/+$/g, '');
    if (!normalizedSlug && page?.slug !== 'home') {
      return '/slug';
    }

    if (navMode === 'child_navbar') {
      const parentHref = navItems.find((item) => item.id === navParentId)?.href ?? '/';
      return buildChildPagePath(parentHref, normalizedSlug || 'slug');
    }

    return normalizedSlug === 'home' || page?.slug === 'home' ? '/' : `/${normalizedSlug || 'slug'}`;
  }, [navItems, navParentId, navMode, page?.slug, slug]);

  async function persistAllSections() {
    if (!pageId || sections.length === 0) {
      return { success: true as const };
    }

    try {
      for (const section of sections) {
        const content = canUseStructuredEditor(section)
          ? section.content
          : JSON.parse(section.contentText);
        const settings = JSON.parse(section.settingsText);

        const result = await updateSection(section.id, {
          internal_name: section.internal_name,
          content,
          settings,
        });

        if (result.error) {
          return { success: false as const, error: result.error };
        }
      }

      return { success: true as const };
    } catch {
      return { success: false as const, error: 'Invalid content/settings JSON' };
    }
  }

  async function persistPage(nextStatus: 'draft' | 'published' | 'archived') {
    if (!pageId) return;

    const sectionsResult = await persistAllSections();
    if (!sectionsResult.success) {
      toast.error(sectionsResult.error);
      return;
    }

    const formData = new FormData();
    formData.set('title', title);
    formData.set('slug', slug || slugify(title));
    formData.set('description', description);
    formData.set('status', nextStatus);
    formData.set('seo_title', seoTitle);
    formData.set('seo_description', seoDescription);
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
            className="flex items-center gap-1.5 bg-gray-900 text-white px-3 py-2 text-xs font-bold rounded-sm hover:bg-[#1E1E1E] transition-colors disabled:opacity-50"
          >
            <Send className="h-3.5 w-3.5" />
            Publish
          </button>
          <button
            type="button"
            onClick={() =>
              startTransition(async () => {
                const sectionsResult = await persistAllSections();
                if (!sectionsResult.success) {
                  toast.error(sectionsResult.error);
                  return;
                }

                window.open(`/preview/pages?id=${pageId}`, '_blank', 'noopener,noreferrer');
              })
            }
            disabled={!pageId}
            className="flex items-center gap-1.5 border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600 hover:border-gray-900 hover:text-gray-900 transition-colors rounded-sm disabled:opacity-50"
          >
            <Eye className="h-3.5 w-3.5" />
            Preview
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

          <div className="mx-auto w-full max-w-4xl rounded-sm border border-gray-200 bg-white p-4 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Section Editor</h3>
              <p className="text-xs text-gray-400 mt-1">
                Supported sections use a structured form and shared renderer, so preview and public output stay aligned.
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
                  <>
                    <StructuredSectionEditor
                      section={activeSection}
                      services={previewServices}
                      posts={previewPosts}
                      onContentChange={(key, value) => updateStructuredSectionContent(activeSection.id, key, value)}
                    />
                    <SectionStyleEditor
                      section={activeSection}
                      onSettingsChange={(key, value) =>
                        updateSectionDraft(activeSection.id, (section) => {
                          const nextSettings = {
                            ...(section.settings ?? {}),
                            [key]: value,
                          };

                          return {
                            ...section,
                            settings: nextSettings,
                            settingsText: JSON.stringify(nextSettings, null, 2),
                          };
                        })
                      }
                    />
                  </>
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
                    <SectionContentPreview section={activeSection} services={previewServices} posts={previewPosts} />
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => void handleSaveSection()}
                  className="w-full rounded-sm bg-gray-900 px-4 py-2 text-xs font-bold text-white hover:bg-[#1E1E1E]"
                >
                  Save Section
                </button>
              </>
            ) : (
              <p className="text-sm text-gray-400">Select a section to start editing.</p>
            )}
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
            <div className="flex items-center gap-2">
              <MenuSquare className="h-4 w-4 text-gray-500" />
              <h3 className="text-sm font-bold text-gray-900">Navigation</h3>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                Show in navbar
              </label>
              <select
                value={navMode}
                onChange={(e) => setNavMode(e.target.value as 'none' | 'navbar' | 'child_navbar')}
                className="w-full rounded-sm border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-900"
              >
                <option value="none">Standalone page</option>
                <option value="navbar">Navbar link</option>
                <option value="child_navbar">Child navbar link</option>
              </select>
            </div>
            {navMode === 'child_navbar' && (
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Parent item
                </label>
                <select
                  value={navParentId}
                  onChange={(e) => setNavParentId(e.target.value)}
                  className="w-full rounded-sm border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-900"
                >
                  <option value="">Select parent</option>
                  {navItems
                    .filter((i) => i.id !== navItemId)
                    .map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.label}
                      </option>
                    ))}
                </select>
              </div>
            )}
            <button
              type="button"
              onClick={() =>
                startTransition(async () => {
                  if (!pageId) return;
                  if (navMode === 'child_navbar' && !navParentId) {
                    toast.error('Select a parent item');
                    return;
                  }
                  const result = await upsertPageNavigation(pageId, navMode, navMode === 'child_navbar' ? navParentId : null);
                  if (result.error) toast.error(result.error);
                  else {
                    toast.success('Navigation updated');
                    const info = await getPageNavigationInfo(pageId);
                    setNavItems(info.navItems);
                    setPublicHref(info.publicHref);
                    if (info.navItem) setNavItemId(info.navItem.id);
                    else setNavItemId(null);
                  }
                })
              }
              disabled={isPending}
              className="w-full rounded-sm bg-gray-900 px-4 py-2 text-xs font-bold text-white hover:bg-[#1E1E1E] disabled:opacity-50"
            >
              <Save className="mr-1 inline h-3.5 w-3.5" />
              Save Navigation
            </button>
            {navMode !== 'none' && (
              <p className="text-[11px] text-gray-400">
                Link: {publicHref || navigationPreviewHref}
              </p>
            )}
          </div>

          {page ? (
            <ConfirmButton
              title="Archive Page"
              description="This page will disappear from public navigation and direct public routes until it is published again."
              confirmLabel="Archive Page"
              variant="destructive"
              className="w-full rounded-sm border border-red-200 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
              onConfirm={async () => {
                const result = await setPageStatus(page.id, 'archived');
                if (result.error) {
                  toast.error(result.error);
                  return;
                }

                setStatus('archived');
                toast.success('Page archived successfully');
              }}
            >
              Archive Page
            </ConfirmButton>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function StructuredSectionEditor({
  section,
  services,
  posts,
  onContentChange,
}: {
  section: EditablePageSection;
  services: Service[];
  posts: Post[];
  onContentChange: (key: string, value: unknown) => void;
}) {
  const content = getSectionContent(section);
  const updateArray = (key: string, updater: (items: Record<string, unknown>[]) => Record<string, unknown>[]) => {
    onContentChange(key, updater(getObjectList(content[key])));
  };

  switch (section.section_type) {
    case 'hero':
      return (
        <div className="space-y-4">
          <TextField label="Title" value={typeof content.title === 'string' ? content.title : ''} onChange={(value) => onContentChange('title', value)} />
          <RichTextEditor key={`${section.id}-hero-description`} label="Description" value={content.description} onChange={(value) => onContentChange('description', value)} placeholder="Write the hero description..." />
          <ImageInput
            name={`${section.id}-image`}
            label="Hero Image"
            defaultValue={typeof content.image === 'string' ? content.image : ''}
            onChange={(value) => onContentChange('image', value)}
            aspectClass="aspect-[21/9]"
            hint="Upload or choose the main hero image."
          />
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
          <RichTextEditor key={`${section.id}-intro-body`} label="Body" value={content.body} onChange={(value) => onContentChange('body', value)} placeholder="Write the intro body..." />
          <div className="grid gap-4 md:grid-cols-2">
            <ImageInput
              name={`${section.id}-primary-image`}
              label="Primary Image"
              defaultValue={typeof content.image === 'string' ? content.image : ''}
              onChange={(value) => onContentChange('image', value)}
              hint="Main image shown in the intro section."
            />
            <ImageInput
              name={`${section.id}-secondary-image`}
              label="Secondary Image"
              defaultValue={typeof content.secondary_image === 'string' ? content.secondary_image : ''}
              onChange={(value) => onContentChange('secondary_image', value)}
              hint="Optional secondary image for the staggered layout."
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <TextField label="Link Label" value={typeof content.link_label === 'string' ? content.link_label : ''} onChange={(value) => onContentChange('link_label', value)} />
            <TextField label="Link Href" value={typeof content.link_href === 'string' ? content.link_href : ''} onChange={(value) => onContentChange('link_href', value)} />
          </div>
        </div>
      );
    case 'stats':
      return (
        <div className="space-y-4">
          <TextField
            label="Title"
            value={typeof content.title === 'string' ? content.title : ''}
            onChange={(value) => onContentChange('title', value)}
          />
          <RepeatableHeader
            label="Stats Items"
            onAdd={() =>
              updateArray('items', (items) => [...items, { value: '', label: '' }])
            }
          />
          <div className="space-y-3">
            {getObjectList(content.items).map((item, index, items) => (
              <RepeatableCard
                key={`${section.id}-stats-${index}`}
                index={index}
                total={items.length}
                label="Stat"
                onMoveUp={() => updateArray('items', (current) => moveArrayItem(current, index, index - 1))}
                onMoveDown={() => updateArray('items', (current) => moveArrayItem(current, index, index + 1))}
                onRemove={() => updateArray('items', (current) => current.filter((_, itemIndex) => itemIndex !== index))}
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <TextField label="Value" value={getString(item.value)} onChange={(value) => updateArray('items', (current) => updateArrayItem(current, index, { ...item, value }))} />
                  <TextField label="Label" value={getString(item.label)} onChange={(value) => updateArray('items', (current) => updateArrayItem(current, index, { ...item, label: value }))} />
                </div>
              </RepeatableCard>
            ))}
          </div>
        </div>
      );
    case 'services':
      return (
        <div className="space-y-4">
          <TextField label="Title" value={typeof content.title === 'string' ? content.title : ''} onChange={(value) => onContentChange('title', value)} />
          <RichTextEditor
            key={`${section.id}-services-description`}
            label="Description"
            value={content.description}
            onChange={(value) => onContentChange('description', value)}
            placeholder="Write the services description..."
          />
          <NumberField
            label="Limit"
            value={typeof content.limit === 'number' ? content.limit : 0}
            onChange={(value) => onContentChange('limit', value)}
          />
          <SourceCardsEditor
            title="Service Cards"
            description="Edit image, text, and route from the linked service source."
            items={services.slice(0, typeof content.limit === 'number' ? content.limit : 5).map((item) => ({
              id: item.id,
              title: item.title,
              description: item.excerpt ?? '',
              image: item.cover_image_url ?? '',
              route: `/services/${item.slug}`,
              editHref: `/dashboard/services/${item.id}`,
            }))}
          />
        </div>
      );
    case 'news':
      return (
        <div className="space-y-4">
          <TextField label="Title" value={typeof content.title === 'string' ? content.title : ''} onChange={(value) => onContentChange('title', value)} />
          <RichTextEditor
            key={`${section.id}-news-description`}
            label="Description"
            value={content.description}
            onChange={(value) => onContentChange('description', value)}
            placeholder="Write the news description..."
          />
          <NumberField
            label="Limit"
            value={typeof content.limit === 'number' ? content.limit : 0}
            onChange={(value) => onContentChange('limit', value)}
          />
          <SourceCardsEditor
            title="News Cards"
            description="Edit image, text, and route from the linked post source."
            items={posts.slice(0, typeof content.limit === 'number' ? content.limit : 4).map((item) => ({
              id: item.id,
              title: item.title,
              description: item.excerpt ?? '',
              image: item.cover_image_url ?? '',
              route: `/news/${item.slug}`,
              editHref: `/dashboard/posts/${item.id}`,
            }))}
          />
        </div>
      );
    case 'projects':
      return (
        <div className="space-y-4">
          <TextField label="Title" value={getString(content.title)} onChange={(value) => onContentChange('title', value)} />
          <RichTextEditor
            key={`${section.id}-projects-description`}
            label="Description"
            value={content.description}
            onChange={(value) => onContentChange('description', value)}
            placeholder="Write the projects intro..."
          />
          <RepeatableHeader
            label="Project Cards"
            onAdd={() =>
              updateArray('items', (items) => [
                ...items,
                { title: '', description: EMPTY_RICH_TEXT_DOCUMENT, image: '', link_label: '', link_href: '' },
              ])
            }
          />
          <div className="space-y-4">
            {getObjectList(content.items).map((item, index, items) => (
              <RepeatableCard
                key={`${section.id}-project-${index}`}
                index={index}
                total={items.length}
                label="Project"
                onMoveUp={() => updateArray('items', (current) => moveArrayItem(current, index, index - 1))}
                onMoveDown={() => updateArray('items', (current) => moveArrayItem(current, index, index + 1))}
                onRemove={() => updateArray('items', (current) => current.filter((_, itemIndex) => itemIndex !== index))}
              >
                <div className="space-y-4">
                  <TextField label="Title" value={getString(item.title)} onChange={(value) => updateArray('items', (current) => updateArrayItem(current, index, { ...item, title: value }))} />
                  <RichTextEditor
                    key={`${section.id}-project-description-${index}`}
                    label="Description"
                    value={item.description}
                    onChange={(value) => updateArray('items', (current) => updateArrayItem(current, index, { ...item, description: value }))}
                    placeholder="Describe this project..."
                  />
                  <ImageInput
                    name={`${section.id}-project-image-${index}`}
                    label="Project Image"
                    defaultValue={getString(item.image)}
                    onChange={(value) => updateArray('items', (current) => updateArrayItem(current, index, { ...item, image: value }))}
                    aspectClass="aspect-[4/3]"
                  />
                  <div className="grid gap-4 md:grid-cols-2">
                    <TextField label="Link Label" value={getString(item.link_label)} onChange={(value) => updateArray('items', (current) => updateArrayItem(current, index, { ...item, link_label: value }))} />
                    <TextField label="Link Href" value={getString(item.link_href)} onChange={(value) => updateArray('items', (current) => updateArrayItem(current, index, { ...item, link_href: value }))} />
                  </div>
                </div>
              </RepeatableCard>
            ))}
          </div>
        </div>
      );
    case 'process':
      return (
        <div className="space-y-4">
          <TextField label="Title" value={getString(content.title)} onChange={(value) => onContentChange('title', value)} />
          <RichTextEditor
            key={`${section.id}-process-description`}
            label="Description"
            value={content.description}
            onChange={(value) => onContentChange('description', value)}
            placeholder="Write the process intro..."
          />
          <RepeatableHeader
            label="Process Steps"
            onAdd={() =>
              updateArray('steps', (steps) => [...steps, { title: '', description: EMPTY_RICH_TEXT_DOCUMENT }])
            }
          />
          <div className="space-y-4">
            {getObjectList(content.steps).map((step, index, steps) => (
              <RepeatableCard
                key={`${section.id}-process-${index}`}
                index={index}
                total={steps.length}
                label="Step"
                onMoveUp={() => updateArray('steps', (current) => moveArrayItem(current, index, index - 1))}
                onMoveDown={() => updateArray('steps', (current) => moveArrayItem(current, index, index + 1))}
                onRemove={() => updateArray('steps', (current) => current.filter((_, itemIndex) => itemIndex !== index))}
              >
                <div className="space-y-4">
                  <TextField label="Title" value={getString(step.title)} onChange={(value) => updateArray('steps', (current) => updateArrayItem(current, index, { ...step, title: value }))} />
                  <RichTextEditor
                    key={`${section.id}-process-step-${index}`}
                    label="Description"
                    value={step.description}
                    onChange={(value) => updateArray('steps', (current) => updateArrayItem(current, index, { ...step, description: value }))}
                    placeholder="Describe this step..."
                  />
                </div>
              </RepeatableCard>
            ))}
          </div>
        </div>
      );
    case 'partners':
      return (
        <div className="space-y-4">
          <TextField label="Title" value={getString(content.title)} onChange={(value) => onContentChange('title', value)} />
          <RichTextEditor
            key={`${section.id}-partners-description`}
            label="Description"
            value={content.description}
            onChange={(value) => onContentChange('description', value)}
            placeholder="Write the partners intro..."
          />
          <RepeatableHeader
            label="Partners"
            onAdd={() => updateArray('items', (items) => [...items, { name: '', logo: '', url: '' }])}
          />
          <div className="space-y-4">
            {getObjectList(content.items).map((item, index, items) => (
              <RepeatableCard
                key={`${section.id}-partner-${index}`}
                index={index}
                total={items.length}
                label="Partner"
                onMoveUp={() => updateArray('items', (current) => moveArrayItem(current, index, index - 1))}
                onMoveDown={() => updateArray('items', (current) => moveArrayItem(current, index, index + 1))}
                onRemove={() => updateArray('items', (current) => current.filter((_, itemIndex) => itemIndex !== index))}
              >
                <div className="space-y-4">
                  <TextField label="Name" value={getString(item.name)} onChange={(value) => updateArray('items', (current) => updateArrayItem(current, index, { ...item, name: value }))} />
                  <ImageInput
                    name={`${section.id}-partner-logo-${index}`}
                    label="Logo"
                    defaultValue={getString(item.logo)}
                    onChange={(value) => updateArray('items', (current) => updateArrayItem(current, index, { ...item, logo: value }))}
                    aspectClass="aspect-[3/2]"
                  />
                  <TextField label="URL" value={getString(item.url)} onChange={(value) => updateArray('items', (current) => updateArrayItem(current, index, { ...item, url: value }))} />
                </div>
              </RepeatableCard>
            ))}
          </div>
        </div>
      );
    case 'testimonials':
      return (
        <div className="space-y-4">
          <TextField label="Title" value={getString(content.title)} onChange={(value) => onContentChange('title', value)} />
          <RichTextEditor
            key={`${section.id}-testimonials-description`}
            label="Description"
            value={content.description}
            onChange={(value) => onContentChange('description', value)}
            placeholder="Write the testimonials intro..."
          />
          <RepeatableHeader
            label="Testimonials"
            onAdd={() =>
              updateArray('items', (items) => [
                ...items,
                { quote: EMPTY_RICH_TEXT_DOCUMENT, author: '', role: '', avatar: '' },
              ])
            }
          />
          <div className="space-y-4">
            {getObjectList(content.items).map((item, index, items) => (
              <RepeatableCard
                key={`${section.id}-testimonial-${index}`}
                index={index}
                total={items.length}
                label="Testimonial"
                onMoveUp={() => updateArray('items', (current) => moveArrayItem(current, index, index - 1))}
                onMoveDown={() => updateArray('items', (current) => moveArrayItem(current, index, index + 1))}
                onRemove={() => updateArray('items', (current) => current.filter((_, itemIndex) => itemIndex !== index))}
              >
                <div className="space-y-4">
                  <RichTextEditor
                    key={`${section.id}-testimonial-quote-${index}`}
                    label="Quote"
                    value={item.quote}
                    onChange={(value) => updateArray('items', (current) => updateArrayItem(current, index, { ...item, quote: value }))}
                    placeholder="Write the testimonial quote..."
                  />
                  <div className="grid gap-4 md:grid-cols-2">
                    <TextField label="Author" value={getString(item.author)} onChange={(value) => updateArray('items', (current) => updateArrayItem(current, index, { ...item, author: value }))} />
                    <TextField label="Role" value={getString(item.role)} onChange={(value) => updateArray('items', (current) => updateArrayItem(current, index, { ...item, role: value }))} />
                  </div>
                  <ImageInput
                    name={`${section.id}-testimonial-avatar-${index}`}
                    label="Avatar"
                    defaultValue={getString(item.avatar)}
                    onChange={(value) => updateArray('items', (current) => updateArrayItem(current, index, { ...item, avatar: value }))}
                    aspectClass="aspect-square"
                  />
                </div>
              </RepeatableCard>
            ))}
          </div>
        </div>
      );
    case 'gallery':
      return (
        <div className="space-y-4">
          <TextField label="Title" value={getString(content.title)} onChange={(value) => onContentChange('title', value)} />
          <RichTextEditor
            key={`${section.id}-gallery-description`}
            label="Description"
            value={content.description}
            onChange={(value) => onContentChange('description', value)}
            placeholder="Write the gallery intro..."
          />
          <RepeatableHeader
            label="Gallery Items"
            onAdd={() =>
              updateArray('items', (items) => [...items, { image: '', alt: '', caption: '' }])
            }
          />
          <div className="space-y-4">
            {getObjectList(content.items).map((item, index, items) => (
              <RepeatableCard
                key={`${section.id}-gallery-${index}`}
                index={index}
                total={items.length}
                label="Gallery Item"
                onMoveUp={() => updateArray('items', (current) => moveArrayItem(current, index, index - 1))}
                onMoveDown={() => updateArray('items', (current) => moveArrayItem(current, index, index + 1))}
                onRemove={() => updateArray('items', (current) => current.filter((_, itemIndex) => itemIndex !== index))}
              >
                <div className="space-y-4">
                  <ImageInput
                    name={`${section.id}-gallery-image-${index}`}
                    label="Image"
                    defaultValue={getString(item.image)}
                    onChange={(value) => updateArray('items', (current) => updateArrayItem(current, index, { ...item, image: value }))}
                    aspectClass="aspect-[4/3]"
                  />
                  <div className="grid gap-4 md:grid-cols-2">
                    <TextField label="Alt Text" value={getString(item.alt)} onChange={(value) => updateArray('items', (current) => updateArrayItem(current, index, { ...item, alt: value }))} />
                    <TextField label="Caption" value={getString(item.caption)} onChange={(value) => updateArray('items', (current) => updateArrayItem(current, index, { ...item, caption: value }))} />
                  </div>
                </div>
              </RepeatableCard>
            ))}
          </div>
        </div>
      );
    case 'rich_text':
      return (
        <div className="space-y-4">
          <TextField label="Title" value={typeof content.title === 'string' ? content.title : ''} onChange={(value) => onContentChange('title', value)} />
          <RichTextEditor key={`${section.id}-rich-text-body`} label="Body" value={content.body} onChange={(value) => onContentChange('body', value)} placeholder="Write the content..." />
        </div>
      );
    case 'cta':
      return (
        <div className="space-y-4">
          <TextField label="Title" value={typeof content.title === 'string' ? content.title : ''} onChange={(value) => onContentChange('title', value)} />
          <RichTextEditor key={`${section.id}-cta-description`} label="Description" value={content.description} onChange={(value) => onContentChange('description', value)} placeholder="Write the CTA description..." />
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
          <RichTextEditor key={`${section.id}-contact-description`} label="Description" value={content.description} onChange={(value) => onContentChange('description', value)} placeholder="Write the contact description..." />
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

function SectionContentPreview({
  section,
  services,
  posts,
}: {
  section: EditablePageSection;
  services: Service[];
  posts: Post[];
}) {
  const content = getSectionContent(section);
  const items = getObjectList(content.items);

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

  if (section.section_type === 'stats') {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((item, index) => (
          <div key={`${section.id}-preview-stat-${index}`} className="rounded-sm border border-gray-200 bg-white p-4">
            <p className="text-xl font-bold text-gray-900">{getString(item.value) || 'Value'}</p>
            <p className="mt-1 text-xs text-gray-500">{getString(item.label) || 'Label'}</p>
          </div>
        ))}
      </div>
    );
  }

  if (section.section_type === 'projects') {
    return (
      <div className="space-y-3">
        <div className="space-y-2">
          {getString(content.title) ? <h5 className="text-lg font-bold text-gray-900">{getString(content.title)}</h5> : null}
          <RichTextRenderer content={content.description} className="text-sm leading-relaxed text-gray-600" />
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {items.map((item, index) => (
            <div key={`${section.id}-preview-project-${index}`} className="rounded-sm border border-gray-200 bg-white p-4">
              <PreviewImage value={getString(item.image)} alt={getString(item.title) || 'Project image'} />
              <p className="text-sm font-bold text-gray-900">{getString(item.title) || 'Project title'}</p>
              <RichTextRenderer content={item.description} className="mt-2 text-xs leading-relaxed text-gray-500" />
              {getString(item.link_label) ? <p className="mt-2 text-[11px] font-semibold text-gray-700">{getString(item.link_label)} -&gt; {getString(item.link_href)}</p> : null}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (section.section_type === 'process') {
    return (
      <div className="space-y-3">
        {getString(content.title) ? <h5 className="text-lg font-bold text-gray-900">{getString(content.title)}</h5> : null}
        <div className="space-y-3">
          {getObjectList(content.steps).map((step, index) => (
            <div key={`${section.id}-preview-step-${index}`} className="rounded-sm border border-gray-200 bg-white p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Step {index + 1}</p>
              <p className="mt-1 text-sm font-bold text-gray-900">{getString(step.title) || 'Step title'}</p>
              <RichTextRenderer content={step.description} className="mt-2 text-xs leading-relaxed text-gray-500" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (section.section_type === 'partners') {
    return (
      <div className="space-y-3">
        {getString(content.title) ? <h5 className="text-lg font-bold text-gray-900">{getString(content.title)}</h5> : null}
        <div className="grid gap-3 sm:grid-cols-2">
          {items.map((item, index) => (
            <div key={`${section.id}-preview-partner-${index}`} className="rounded-sm border border-gray-200 bg-white p-4">
              <PreviewImage value={getString(item.logo)} alt={getString(item.name) || 'Partner logo'} aspectClass="aspect-[3/2]" contain />
              <p className="text-sm font-bold text-gray-900">{getString(item.name) || 'Partner name'}</p>
              <p className="mt-1 text-xs text-gray-500">{getString(item.url) || 'https://example.com'}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (section.section_type === 'testimonials') {
    return (
      <div className="space-y-3">
        {getString(content.title) ? <h5 className="text-lg font-bold text-gray-900">{getString(content.title)}</h5> : null}
        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={`${section.id}-preview-testimonial-${index}`} className="rounded-sm border border-gray-200 bg-white p-4">
              <PreviewImage value={getString(item.avatar)} alt={getString(item.author) || 'Avatar'} aspectClass="aspect-square" square />
              <RichTextRenderer content={item.quote} className="text-sm leading-relaxed text-gray-600" />
              <p className="mt-3 text-xs font-bold text-gray-900">{getString(item.author) || 'Author'}</p>
              <p className="text-[11px] text-gray-500">{getString(item.role) || 'Role'}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (section.section_type === 'gallery') {
    return (
      <div className="space-y-3">
        {getString(content.title) ? <h5 className="text-lg font-bold text-gray-900">{getString(content.title)}</h5> : null}
        <div className="grid gap-3 sm:grid-cols-2">
          {items.map((item, index) => (
            <div key={`${section.id}-preview-gallery-${index}`} className="rounded-sm border border-gray-200 bg-white p-4">
              <PreviewImage value={getString(item.image)} alt={getString(item.alt) || 'Gallery image'} />
              <p className="text-sm font-bold text-gray-900">{getString(item.caption) || 'Gallery item'}</p>
              <p className="mt-1 text-xs text-gray-500">{getString(item.alt) || 'Alt text'}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (section.section_type === 'services') {
    const limitedServices = services.slice(0, typeof content.limit === 'number' ? content.limit : 5);

    return (
      <div className="space-y-3">
        {getString(content.title) ? <h5 className="text-lg font-bold text-gray-900">{getString(content.title)}</h5> : null}
        <RichTextRenderer content={content.description} className="text-sm leading-relaxed text-gray-600" />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {limitedServices.map((item) => (
            <div key={`${section.id}-service-${item.id}`} className="rounded-sm border border-gray-200 bg-white p-3">
              <PreviewImage value={item.cover_image_url ?? ''} alt={item.title} />
              <p className="text-sm font-bold text-gray-900">{item.title}</p>
              {item.excerpt ? <p className="mt-1 text-xs leading-relaxed text-gray-500">{item.excerpt}</p> : null}
              <p className="mt-2 text-[11px] font-semibold text-gray-700">/services/{item.slug}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (section.section_type === 'news') {
    const limitedPosts = posts.slice(0, typeof content.limit === 'number' ? content.limit : 4);

    return (
      <div className="space-y-3">
        {getString(content.title) ? <h5 className="text-lg font-bold text-gray-900">{getString(content.title)}</h5> : null}
        <RichTextRenderer content={content.description} className="text-sm leading-relaxed text-gray-600" />
        <div className="grid gap-3 sm:grid-cols-2">
          {limitedPosts.map((item) => (
            <div key={`${section.id}-post-${item.id}`} className="rounded-sm border border-gray-200 bg-white p-3">
              <PreviewImage value={item.cover_image_url ?? ''} alt={item.title} />
              <p className="text-sm font-bold text-gray-900">{item.title}</p>
              {item.excerpt ? <p className="mt-1 text-xs leading-relaxed text-gray-500">{item.excerpt}</p> : null}
              <p className="mt-2 text-[11px] font-semibold text-gray-700">/news/{item.slug}</p>
            </div>
          ))}
        </div>
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

function getString(value: unknown) {
  return typeof value === 'string' ? value : '';
}

function getObjectList(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
    : [];
}

function moveArrayItem<T>(items: T[], fromIndex: number, toIndex: number) {
  if (toIndex < 0 || toIndex >= items.length) {
    return items;
  }

  return arrayMove(items, fromIndex, toIndex);
}

function updateArrayItem<T>(items: T[], index: number, nextItem: T) {
  return items.map((item, itemIndex) => (itemIndex === index ? nextItem : item));
}

function RepeatableHeader({
  label,
  onAdd,
}: {
  label: string;
  onAdd: () => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <p className="text-xs font-bold uppercase tracking-wider text-gray-500">{label}</p>
      <button
        type="button"
        onClick={onAdd}
        className="inline-flex items-center gap-1 rounded-sm border border-gray-200 bg-white px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-600 transition-colors hover:border-gray-900 hover:text-gray-900"
      >
        <Plus className="h-3 w-3" />
        Add Item
      </button>
    </div>
  );
}

function RepeatableCard({
  index,
  total,
  label,
  onMoveUp,
  onMoveDown,
  onRemove,
  children,
}: {
  index: number;
  total: number;
  label: string;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
  children: ReactNode;
}) {
  return (
    <div className="rounded-sm border border-gray-200 bg-gray-50 p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
            {label} {index + 1}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={index === 0}
            className="rounded-sm border border-gray-200 bg-white px-2 py-1 text-[11px] font-semibold text-gray-600 transition-colors hover:border-gray-900 hover:text-gray-900 disabled:opacity-40"
          >
            Up
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={index === total - 1}
            className="rounded-sm border border-gray-200 bg-white px-2 py-1 text-[11px] font-semibold text-gray-600 transition-colors hover:border-gray-900 hover:text-gray-900 disabled:opacity-40"
          >
            Down
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="rounded-sm border border-red-200 bg-white px-2 py-1 text-[11px] font-semibold text-red-600 transition-colors hover:bg-red-50"
          >
            Remove
          </button>
        </div>
      </div>
      {children}
    </div>
  );
}

function SourceCardsEditor({
  title,
  description,
  items,
}: {
  title: string;
  description: string;
  items: Array<{
    id: string;
    title: string;
    description: string;
    image: string;
    route: string;
    editHref: string;
  }>;
}) {
  return (
    <div className="rounded-sm border border-gray-200 bg-gray-50 p-4">
      <div className="mb-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">{title}</h4>
        <p className="mt-1 text-xs text-gray-400">{description}</p>
      </div>
      <div className="space-y-3">
        {items.length === 0 ? (
          <p className="text-xs text-gray-400">No published cards available yet.</p>
        ) : (
          items.map((item) => (
            <div key={item.id} className="rounded-sm border border-gray-200 bg-white p-4">
              <div className="grid gap-4 lg:grid-cols-[160px_minmax(0,1fr)]">
                <PreviewImage value={item.image} alt={item.title} />
                <div className="space-y-3">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Title</p>
                    <p className="mt-1 text-sm font-bold text-gray-900">{item.title}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Text</p>
                    <p className="mt-1 text-xs leading-relaxed text-gray-500">{item.description || '-'}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Route</p>
                    <p className="mt-1 text-xs font-semibold text-gray-700">{item.route}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={item.editHref}
                      className="inline-flex items-center justify-center rounded-sm bg-gray-900 px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-white transition-colors hover:bg-[#1E1E1E]"
                    >
                      Edit Image, Text, Link
                    </a>
                    <a
                      href={item.route}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center rounded-sm border border-gray-200 bg-white px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-gray-600 transition-colors hover:border-gray-900 hover:text-gray-900"
                    >
                      Open Route
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function PreviewImage({
  value,
  alt,
  aspectClass = 'aspect-[4/3]',
  square = false,
  contain = false,
}: {
  value: string;
  alt: string;
  aspectClass?: string;
  square?: boolean;
  contain?: boolean;
}) {
  const wrapperClassName = square ? 'mb-3 w-16' : 'mb-3';

  return (
    <div className={wrapperClassName}>
      <div className={`relative overflow-hidden rounded-sm border border-gray-200 bg-gray-50 ${square ? 'aspect-square' : aspectClass}`}>
        {value ? (
          <Image
            src={value}
            alt={alt}
            fill
            className={contain ? 'object-contain' : 'object-cover'}
            sizes="240px"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-[11px] text-gray-400">No image</div>
        )}
      </div>
    </div>
  );
}

function SectionStyleEditor({
  section,
  onSettingsChange,
}: {
  section: EditablePageSection;
  onSettingsChange: (key: string, value: string) => void;
}) {
  const settings = (section.settings ?? {}) as Record<string, unknown>;

  return (
    <div className="rounded-sm border border-gray-200 bg-gray-50 p-4 space-y-4">
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">Text Colors</h4>
        <p className="mt-1 text-xs text-gray-400">Use hex, rgb, or CSS color names. These styles are shared by preview and public pages.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <ColorField label="Title Color" value={typeof settings.title_color === 'string' ? settings.title_color : ''} onChange={(value) => onSettingsChange('title_color', value)} />
        <ColorField label="Body Color" value={typeof settings.body_color === 'string' ? settings.body_color : ''} onChange={(value) => onSettingsChange('body_color', value)} />
        <ColorField label="Link Color" value={typeof settings.link_color === 'string' ? settings.link_color : ''} onChange={(value) => onSettingsChange('link_color', value)} />
        {(section.section_type === 'cta' || section.section_type === 'hero') ? (
          <ColorField label="Button Text Color" value={typeof settings.button_text_color === 'string' ? settings.button_text_color : ''} onChange={(value) => onSettingsChange('button_text_color', value)} />
        ) : null}
        {(section.section_type === 'cta' || section.section_type === 'hero') ? (
          <ColorField label="Button Background" value={typeof settings.button_background_color === 'string' ? settings.button_background_color : ''} onChange={(value) => onSettingsChange('button_background_color', value)} />
        ) : null}
      </div>
    </div>
  );
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

function ColorField({
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
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value || '#1E1E1E'}
          onChange={(event) => onChange(event.target.value)}
          className="h-9 w-9 cursor-pointer rounded-sm border border-gray-200 bg-white p-0.5"
        />
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="#1E1E1E"
          className="flex-1 rounded-sm border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-900 font-mono"
        />
      </div>
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
  const searchParams = useSearchParams();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const [navMode, setNavMode] = useState<'none' | 'navbar' | 'child_navbar'>('none');
  const [navParentId, setNavParentId] = useState('');
  const [navItems, setNavItems] = useState<NavigationItem[]>([]);
  const router = useRouter();

  useEffect(() => {
    const requestedParentHref = searchParams.get('parentHref');
    const requestedNavMode = searchParams.get('navMode');

    getHeaderNavItems().then((items) => {
      setNavItems(items);

      if (!requestedParentHref) {
        return;
      }

      const parentItem = items.find((item) => item.href === requestedParentHref);
      if (!parentItem) {
        return;
      }

      setNavMode(requestedNavMode === 'navbar' ? 'navbar' : 'child_navbar');
      setNavParentId(parentItem.id);
    });
  }, [searchParams]);

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

    if (navMode !== 'none') {
      const navResult = await upsertPageNavigation(
        result.data.id,
        navMode,
        navMode === 'child_navbar' ? navParentId : null
      );
      if (navResult.error) {
        toast.error(navResult.error);
        setPending(false);
        return;
      }
    }

    toast.success('Page created successfully');
    router.push(`/dashboard/pages/builder?id=${result.data.id}`);
  }

  return (
    <div className="max-w-lg mx-auto pt-16">
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
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
              Navigation <span className="text-gray-400 normal-case">(optional)</span>
            </label>
            <select
              value={navMode}
              onChange={(e) => setNavMode(e.target.value as 'none' | 'navbar' | 'child_navbar')}
              className="w-full rounded-sm border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-900"
            >
              <option value="none">Standalone page</option>
              <option value="navbar">Add to navbar</option>
              <option value="child_navbar">Add as child navbar</option>
            </select>
          </div>
          {navMode === 'child_navbar' && (
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                Parent item
              </label>
              <select
                value={navParentId}
                onChange={(e) => setNavParentId(e.target.value)}
                className="w-full rounded-sm border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-900"
              >
                <option value="">Select parent</option>
                {navItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
          )}
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={pending || (navMode === 'child_navbar' && !navParentId)}
            className="w-full bg-gray-900 text-white py-2 text-sm font-bold rounded-sm hover:bg-[#1E1E1E] transition-colors disabled:opacity-50"
          >
            {pending ? 'Creating...' : 'Create Page'}
          </button>
        </form>
      </div>
    </div>
  );
}
