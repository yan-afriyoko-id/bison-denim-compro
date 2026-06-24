'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { slugify } from '@/lib/utils';
import { updatePost, deletePost } from '@/actions/posts.actions';
import { ArrowLeft, Trash2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import type { Post, RichTextDocument } from '@/types';
import { toast } from 'sonner';
import { ImageInput } from '@/components/dashboard/image-input';
import { RichTextEditor } from '@/components/dashboard/rich-text-editor';
import { RichTextRenderer, normalizeRichTextValue } from '@/lib/rich-text';

export default function EditPostPage() {
  const router = useRouter();
  const params = useParams();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState('');
  const [slugVal, setSlugVal] = useState('');
  const [slugEdited, setSlugEdited] = useState(false);
  const [excerpt, setExcerpt] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [content, setContent] = useState<RichTextDocument>(normalizeRichTextValue(''));
  const [seoDescription, setSeoDescription] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);

  useEffect(() => {
    async function fetchPost() {
      try {
        const res = await fetch(`/api/posts/${params.id}`);
        if (res.ok) {
          const data = await res.json();
          setPost(data);
          setTitle(data.title);
          setSlugVal(data.slug);
          setExcerpt(data.excerpt ?? '');
          setCoverImage(data.cover_image_url ?? '');
          setContent(normalizeRichTextValue(data.content?.text));
          setSeoDescription(data.seo_description ?? '');
          setIsFeatured(data.is_featured ?? false);
        }
      } catch {
        // ignore
      }
      setLoading(false);
    }
    fetchPost();
  }, [params.id]);

  function handleTitleChange(value: string) {
    setTitle(value);
    if (!slugEdited) setSlugVal(slugify(value));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!post) return;
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    formData.set('content', JSON.stringify({ text: content }));

    const result = await updatePost(post.id, formData);

    if (result.error) {
      toast.error(result.error);
      setIsSubmitting(false);
      return;
    }

    toast.success('Post updated successfully');
    router.push('/dashboard/posts');
    router.refresh();
  }

  async function handleDelete() {
    if (!post) return;
    if (!confirm('Delete this post?')) return;

    const result = await deletePost(post.id);
    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success('Post deleted successfully');
    router.push('/dashboard/posts');
    router.refresh();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <p className="text-sm text-gray-500">Post not found</p>
        <Link
          href="/dashboard/posts"
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
          href="/dashboard/posts"
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-900 transition-colors mb-3"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Posts
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Edit Post</h1>
        <p className="text-sm text-gray-400 mt-1">Update the article or news post.</p>
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
                value={slugVal}
                onChange={(e) => {
                  setSlugEdited(true);
                  setSlugVal(e.target.value);
                }}
                className="w-full bg-white border border-gray-200 px-3 py-2 text-sm text-gray-500 outline-none focus:border-gray-900 transition-colors rounded-sm"
              />
              <p className="mt-1 text-[11px] text-gray-400">Preview URL: `/news/{slugVal || 'slug-post'}`</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                Excerpt
              </label>
              <textarea
                name="excerpt"
                rows={2}
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="Short post summary"
                className="w-full bg-white border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-900 transition-colors resize-none rounded-sm"
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
                placeholder="Write the post content here..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Status
                </label>
                <select
                  name="status"
                  defaultValue={post.status}
                  className="w-full bg-white border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-900 transition-colors rounded-sm"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  SEO Title <span className="text-gray-400 normal-case">(optional)</span>
                </label>
                <input
                  type="text"
                  name="seo_title"
                  defaultValue={post.seo_title ?? ''}
                  placeholder="SEO title"
                  className="w-full bg-white border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-900 transition-colors rounded-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  SEO Description
                </label>
                <textarea
                  name="seo_description"
                  rows={3}
                  value={seoDescription}
                  onChange={(e) => setSeoDescription(e.target.value)}
                  placeholder="SEO description"
                  className="w-full bg-white border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-900 transition-colors resize-none rounded-sm"
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
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleDelete}
              className="flex items-center gap-1.5 text-xs font-semibold text-red-400 hover:text-red-600 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete Post
            </button>
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard/posts"
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
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  NEWS
                </span>
                <h3 className="text-gray-900 font-bold text-sm leading-snug mt-1">
                  {title || 'Post Title'}
                </h3>
                {excerpt && (
                  <p className="text-gray-500 text-xs leading-relaxed mt-2">{excerpt}</p>
                )}
                <div className="mt-3 border-t border-gray-100 pt-3">
                  <RichTextRenderer content={content} className="text-[11px] leading-relaxed text-gray-400" />
                </div>
              </div>
            </div>
            <p className="text-[11px] text-gray-400 mt-2 leading-relaxed">
              This is how the post will appear on the homepage and news page.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
