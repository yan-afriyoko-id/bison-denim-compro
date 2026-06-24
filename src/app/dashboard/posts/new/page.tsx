'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { slugify } from '@/lib/utils';
import { createPost } from '@/actions/posts.actions';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function NewPostPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState('');
  const [autoSlug, setAutoSlug] = useState('');
  const [slugEdited, setSlugEdited] = useState(false);
  const [excerpt, setExcerpt] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState('draft');

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
    // Wrap content as JSON
    if (content) {
      formData.set('content', JSON.stringify({ text: content }));
    }

    const result = await createPost(formData);

    if (result.error) {
      toast.error(result.error);
      setIsSubmitting(false);
      return;
    }

    toast.success('Post berhasil dibuat');
    router.push('/dashboard/posts');
    router.refresh();
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <Link
          href="/dashboard/posts"
          className="flex items-center gap-1.5 text-xs text-[#666] hover:text-[#f5f5f5] transition-colors mb-3"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Kembali ke Posts
        </Link>
        <h1 className="text-2xl font-bold text-[#f5f5f5] tracking-tight">Post Baru</h1>
        <p className="text-sm text-[#666] mt-1">Buat artikel / berita baru</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Form */}
        <form onSubmit={handleSubmit} className="lg:col-span-3 space-y-5">
          <div className="border border-[#2a2a2a] bg-[#141414] rounded-sm p-5 space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#a3a3a3] uppercase tracking-wider mb-1.5">
                Judul *
              </label>
              <input
                type="text"
                name="title"
                placeholder="Masukkan judul post"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                required
                className="w-full bg-[#0a0a0a] border border-[#2a2a2a] px-3 py-2 text-sm text-[#f5f5f5] outline-none focus:border-[#f5f5f5] transition-colors rounded-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#a3a3a3] uppercase tracking-wider mb-1.5">
                Slug
              </label>
              <input
                type="text"
                name="slug"
                placeholder="auto-generated"
                value={autoSlug}
                onChange={(e) => handleSlugChange(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-[#2a2a2a] px-3 py-2 text-sm text-[#a3a3a3] outline-none focus:border-[#f5f5f5] transition-colors rounded-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#a3a3a3] uppercase tracking-wider mb-1.5">
                Excerpt
              </label>
              <textarea
                name="excerpt"
                rows={2}
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="Ringkasan singkat post"
                className="w-full bg-[#0a0a0a] border border-[#2a2a2a] px-3 py-2 text-sm text-[#f5f5f5] outline-none focus:border-[#f5f5f5] transition-colors resize-none rounded-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#a3a3a3] uppercase tracking-wider mb-1.5">
                Cover Image URL
              </label>
              <input
                type="url"
                name="cover_image_url"
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                placeholder="https://..."
                className="w-full bg-[#0a0a0a] border border-[#2a2a2a] px-3 py-2 text-sm text-[#f5f5f5] outline-none focus:border-[#f5f5f5] transition-colors rounded-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#a3a3a3] uppercase tracking-wider mb-1.5">
                Konten
              </label>
              <textarea
                rows={8}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Tulis isi post di sini..."
                className="w-full bg-[#0a0a0a] border border-[#2a2a2a] px-3 py-2 text-sm text-[#f5f5f5] outline-none focus:border-[#f5f5f5] transition-colors resize-y rounded-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#a3a3a3] uppercase tracking-wider mb-1.5">
                  Status
                </label>
                <select
                  name="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-[#2a2a2a] px-3 py-2 text-sm text-[#f5f5f5] outline-none focus:border-[#f5f5f5] transition-colors rounded-sm"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#a3a3a3] uppercase tracking-wider mb-1.5">
                  SEO Title <span className="text-[#666] normal-case">(opsional)</span>
                </label>
                <input
                  type="text"
                  name="seo_title"
                  placeholder="Judul SEO"
                  className="w-full bg-[#0a0a0a] border border-[#2a2a2a] px-3 py-2 text-sm text-[#f5f5f5] outline-none focus:border-[#f5f5f5] transition-colors rounded-sm"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            <Link
              href="/dashboard/posts"
              className="px-4 py-2 text-sm font-semibold text-[#a3a3a3] hover:text-[#f5f5f5] transition-colors"
            >
              Batal
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#f5f5f5] text-[#0a0a0a] px-5 py-2 text-sm font-bold rounded-sm hover:bg-white transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>

        {/* Live Preview */}
        <div className="lg:col-span-2">
          <div className="sticky top-0">
            <p className="text-xs font-bold text-[#666] uppercase tracking-wider mb-3">
              Preview Tampilan
            </p>
            <div className="border border-[#d4d4d4] bg-white rounded-sm overflow-hidden">
              <div className="relative aspect-[4/3] bg-gray-100">
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
                    <span className="text-xs text-gray-400">No image</span>
                  </div>
                )}
              </div>
              <div className="p-5">
                <span className="text-[11px] font-bold text-[#555] uppercase tracking-wider">
                  BERITA
                </span>
                <h3 className="text-black font-bold text-sm leading-snug mt-1">
                  {title || 'Judul Post'}
                </h3>
                {excerpt && (
                  <p className="text-[#555] text-xs leading-relaxed mt-2">{excerpt}</p>
                )}
              </div>
            </div>
            <p className="text-[11px] text-[#666] mt-2 leading-relaxed">
              Beginilah tampilan post di landing page &amp; news page.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
