'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { slugify } from '@/lib/utils';
import { createService } from '@/actions/services.actions';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { ImageInput } from '@/components/dashboard/image-input';
import { RichTextEditor } from '@/components/dashboard/rich-text-editor';
import { RichTextRenderer, normalizeRichTextValue } from '@/lib/rich-text';
import type { RichTextDocument } from '@/types';

export default function NewServicePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState('');
  const [autoSlug, setAutoSlug] = useState('');
  const [slugEdited, setSlugEdited] = useState(false);
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState<RichTextDocument>(normalizeRichTextValue(''));
  const [features, setFeatures] = useState<RichTextDocument>(normalizeRichTextValue([], 'list'));
  const [ctaLabel, setCtaLabel] = useState('');
  const [ctaHref, setCtaHref] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [status, setStatus] = useState('draft');
  const [sortOrder, setSortOrder] = useState(0);
  const [isFeatured, setIsFeatured] = useState(false);

  function handleTitleChange(value: string) {
    setTitle(value);
    if (!slugEdited) setAutoSlug(slugify(value));
  }

  function handleSlugChange(value: string) {
    setSlugEdited(true);
    setAutoSlug(value);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
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
    const result = await createService(formData);

    if (result.error) {
      toast.error(result.error);
      setIsSubmitting(false);
      return;
    }

    toast.success('Service created successfully');
    router.push('/dashboard/services');
    router.refresh();
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
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">New Service</h1>
        <p className="text-sm text-gray-400 mt-1">Create a new product or service entry.</p>
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
                placeholder="Enter a title"
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
                value={autoSlug}
                onChange={(e) => handleSlugChange(e.target.value)}
                className="w-full bg-white border border-gray-200 px-3 py-2 text-sm text-gray-500 outline-none focus:border-gray-900 transition-colors rounded-sm"
              />
              <p className="mt-1 text-[11px] text-gray-400">Preview URL: `/services/{autoSlug || 'slug-service'}`</p>
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
                placeholder="Short summary"
                className="w-full bg-white border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-900 transition-colors resize-none rounded-sm"
              />
            </div>

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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Icon <span className="text-gray-400 normal-case">(optional)</span>
                </label>
                <input
                  type="text"
                  name="icon"
                  placeholder="Icon name"
                  className="w-full bg-white border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-900 transition-colors rounded-sm"
                />
              </div>
            </div>

            <ImageInput
              name="cover_image_url"
              label="Cover Image"
              defaultValue={coverImage}
              onChange={setCoverImage}
              aspectClass="aspect-[4/3]"
              hint="Upload a file or paste a cover image URL"
            />

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Status
                </label>
                <select
                  name="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
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
                  value={sortOrder}
                  onChange={(e) => setSortOrder(parseInt(e.target.value, 10) || 0)}
                  className="w-full bg-white border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-900 transition-colors rounded-sm"
                />
              </div>
              <div className="flex items-end pb-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_featured"
                    value="true"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
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
          <div className="flex items-center justify-end gap-3">
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
              {isSubmitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>

        {/* Live Preview */}
        <div className="lg:col-span-2">
          <div className="sticky top-0">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
              Live Preview
            </p>
            {/* Mirror ImageInput value into preview state */}
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
