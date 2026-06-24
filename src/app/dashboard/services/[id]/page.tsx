'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { slugify } from '@/lib/utils';
import { updateService, deleteService } from '@/actions/services.actions';
import { ArrowLeft, Trash2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import type { RichTextDocument, Service } from '@/types';
import { toast } from 'sonner';
import { ImageInput } from '@/components/dashboard/image-input';
import { RichTextEditor } from '@/components/dashboard/rich-text-editor';
import { RichTextRenderer, normalizeRichTextValue } from '@/lib/rich-text';

export default function EditServicePage() {
  const router = useRouter();
  const params = useParams();
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState('');
  const [slugVal, setSlugVal] = useState('');
  const [slugEdited, setSlugEdited] = useState(false);
  const [coverImage, setCoverImage] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState<RichTextDocument>(normalizeRichTextValue(''));
  const [features, setFeatures] = useState<RichTextDocument>(normalizeRichTextValue([], 'list'));
  const [ctaLabel, setCtaLabel] = useState('');
  const [ctaHref, setCtaHref] = useState('');

  useEffect(() => {
    async function fetchService() {
      try {
        const res = await fetch(`/api/services/${params.id}`);
        if (res.ok) {
          const data = await res.json();
          setService(data);
          setTitle(data.title);
          setSlugVal(data.slug);
          setExcerpt(data.excerpt ?? '');
          setCoverImage(data.cover_image_url ?? '');
          setContent(normalizeRichTextValue(data.content?.text));
          setFeatures(normalizeRichTextValue(data.content?.features, 'list'));
          setCtaLabel(typeof data.content?.cta_label === 'string' ? data.content.cta_label : '');
          setCtaHref(typeof data.content?.cta_href === 'string' ? data.content.cta_href : '');
        }
      } catch {
        // ignore
      }
      setLoading(false);
    }
    fetchService();
  }, [params.id]);

  function handleTitleChange(value: string) {
    setTitle(value);
    if (!slugEdited) {
      setSlugVal(slugify(value));
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!service) return;
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    formData.set(
      'content',
      JSON.stringify({
        text: content,
        features,
        cta_label: ctaLabel.trim(),
        cta_href: ctaHref.trim(),
      })
    );
    const result = await updateService(service.id, formData);

    if (result.error) {
      toast.error(result.error);
      setIsSubmitting(false);
      return;
    }

    toast.success('Service updated successfully');
    router.push('/dashboard/services');
    router.refresh();
  }

  async function handleDelete() {
    if (!service) return;
    if (!confirm('Delete this service?')) return;

    const result = await deleteService(service.id);
    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success('Service deleted successfully');
    router.push('/dashboard/services');
    router.refresh();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <p className="text-sm text-gray-500">Service not found</p>
        <Link
          href="/dashboard/services"
          className="mt-3 text-xs font-semibold text-gray-400 hover:text-gray-900 transition-colors"
        >
          Go back
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <Link
          href="/dashboard/services"
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-900 transition-colors mb-3"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Services
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Edit Service</h1>
        <p className="text-sm text-gray-400 mt-1">Update the service details.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Form */}
        <form onSubmit={handleSubmit} className="lg:col-span-3 space-y-5">
          <div className="border border-gray-200 bg-white rounded-sm p-5 space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                Title *
              </label>
              <input
                type="text"
                name="title"
                placeholder="Enter a service title"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                required
                className="w-full bg-white border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-900 transition-colors rounded-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                Slug
              </label>
              <input
                type="text"
                name="slug"
                placeholder="auto-generated"
                value={slugVal}
                onChange={(e) => {
                  setSlugEdited(true);
                  setSlugVal(e.target.value);
                }}
                className="w-full bg-white border border-gray-200 px-3 py-2 text-sm text-gray-500 outline-none focus:border-gray-900 transition-colors rounded-sm"
              />
              <p className="mt-1 text-[11px] text-gray-400">Preview URL: `/services/{slugVal || 'slug-service'}`</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                Excerpt
              </label>
              <textarea
                name="excerpt"
                rows={3}
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                className="w-full bg-white border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-900 transition-colors resize-none rounded-sm"
                placeholder="Short summary"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                Icon <span className="text-gray-400 normal-case">(optional)</span>
              </label>
              <input
                type="text"
                name="icon"
                placeholder="Icon name"
                defaultValue={service.icon ?? ''}
                className="w-full bg-white border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-900 transition-colors rounded-sm"
              />
            </div>

            <ImageInput
              name="cover_image_url"
              label="Cover Image"
              defaultValue={coverImage}
              onChange={setCoverImage}
              aspectClass="aspect-[4/3]"
              hint="Upload a file or paste a cover image URL"
            />

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                Content
              </label>
              <RichTextEditor
                value={content}
                onChange={setContent}
                placeholder="Write the service details here..."
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                Features <span className="text-gray-400 normal-case">(use a list for key benefits)</span>
              </label>
              <RichTextEditor
                value={features}
                onChange={setFeatures}
                mode="list"
                placeholder="Write the key benefits here..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  CTA Label
                </label>
                <input
                  type="text"
                  value={ctaLabel}
                  onChange={(e) => setCtaLabel(e.target.value)}
                  placeholder="Shop Now"
                  className="w-full bg-white border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-900 transition-colors rounded-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  CTA Link
                </label>
                <input
                  type="text"
                  value={ctaHref}
                  onChange={(e) => setCtaHref(e.target.value)}
                  placeholder="/contact-us"
                  className="w-full bg-white border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-900 transition-colors rounded-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Status
                </label>
                <select
                  name="status"
                  defaultValue={service.status}
                  className="w-full bg-white border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-900 transition-colors rounded-sm"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Sort Order
                </label>
                <input
                  type="number"
                  name="sort_order"
                  defaultValue={service.sort_order}
                  className="w-full bg-white border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-900 transition-colors rounded-sm"
                />
              </div>
              <div className="flex items-end pb-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_featured"
                    value="true"
                    defaultChecked={service.is_featured}
                    className="h-4 w-4 accent-gray-900"
                  />
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Featured
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleDelete}
              className="flex items-center gap-1.5 text-xs font-semibold text-red-400 hover:text-red-600 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete Service
            </button>
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard/services"
                className="px-4 py-2 text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-gray-900 text-white px-5 py-2 text-sm font-bold rounded-sm hover:bg-black transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>

        {/* Live Preview */}
        <div className="lg:col-span-2">
          <div className="sticky top-0">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
              Live Preview
            </p>
            <div className="border border-gray-200 bg-white rounded-sm overflow-hidden">
              <div className="relative aspect-[4/3] bg-gray-50">
                {coverImage ? (
                  <Image
                    src={coverImage}
                    alt={title || 'Preview'}
                    fill
                    className="object-cover"
                    sizes="300px"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <span className="text-xs text-gray-300">No image</span>
                  </div>
                )}
              </div>
              <div className="p-5">
                <h3 className="text-sm font-bold text-gray-900 mb-1.5">
                  {title || 'Service Title'}
                </h3>
                <p className="text-gray-500 text-xs leading-relaxed">
                  {excerpt || 'The short service summary will appear here...'}
                </p>
                <div className="mt-3 border-t border-gray-100 pt-3">
                  <RichTextRenderer content={content} className="text-[11px] leading-relaxed text-gray-400" />
                </div>
                <div className="mt-3 border-t border-gray-100 pt-3">
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-gray-400">Features</p>
                  <RichTextRenderer content={features} mode="list" className="text-[11px] leading-relaxed text-gray-400" />
                </div>
              </div>
            </div>
            <p className="text-[11px] text-gray-400 mt-2 leading-relaxed">
              This is how the service will appear on the public website.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
