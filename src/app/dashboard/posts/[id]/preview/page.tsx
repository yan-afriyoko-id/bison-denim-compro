'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Calendar, Clock, Eye } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { RichTextRenderer, normalizeRichTextValue } from '@/lib/rich-text';
import type { Post, RichTextDocument } from '@/types';

export default function PreviewPostPage() {
  const params = useParams();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPost() {
      try {
        const res = await fetch(`/api/posts/${params.id}`);
        if (res.ok) {
          const data = await res.json();
          setPost(data);
        }
      } catch {
        // ignore
      }
      setLoading(false);
    }
    fetchPost();
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-sm text-gray-500">Post tidak ditemukan</p>
        <Link
          href="/dashboard/posts"
          className="mt-3 text-xs font-semibold text-gray-400 hover:text-gray-900 transition-colors"
        >
          Kembali ke Posts
        </Link>
      </div>
    );
  }

  const content: RichTextDocument = normalizeRichTextValue(post.content?.text as string | undefined);

  return (
    <div className="min-h-screen bg-white">
      {/* Preview banner */}
      <div className="sticky top-0 z-50 bg-amber-50 border-b border-amber-200 px-6 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-amber-800">
            <Eye className="h-4 w-4" />
            <span className="font-semibold">Preview Mode</span>
            {post.status !== 'published' && (
              <span className="text-amber-600">— Post ini belum dipublikasikan</span>
            )}
          </div>
          <Link
            href="/dashboard/posts"
            className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 hover:text-amber-900 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Kembali
          </Link>
        </div>
      </div>

      {/* Post content */}
      <article className="max-w-4xl mx-auto px-6 py-12">
        {/* Cover image */}
        {post.cover_image_url && (
          <div className="relative aspect-[4/3] md:aspect-[2/1] rounded-sm overflow-hidden bg-gray-50 border border-gray-200 mb-10">
            <Image
              src={post.cover_image_url}
              alt={post.title}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 768px) 100vw, 896px"
            />
          </div>
        )}

        {/* Category badge */}
        {post.category_id && (
          <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-3">
            {post.category_id}
          </span>
        )}

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight mb-4">
          {post.title}
        </h1>

        {/* Meta */}
        <div className="flex items-center gap-4 text-sm text-gray-400 mb-8">
          {post.published_at && (
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {formatDate(post.published_at)}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            {post.status === 'published' ? 'Published' : post.status === 'draft' ? 'Draft' : 'Archived'}
          </span>
        </div>

        {/* Excerpt */}
        {post.excerpt && (
          <p className="text-lg text-gray-500 leading-relaxed mb-8 border-l-4 border-gray-200 pl-4">
            {post.excerpt}
          </p>
        )}

        {/* Content */}
        <div className="prose prose-gray max-w-none">
          <RichTextRenderer content={content} />
        </div>
      </article>
    </div>
  );
}
