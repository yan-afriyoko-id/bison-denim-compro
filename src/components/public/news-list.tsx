'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import { getPostCategoryLabel } from '@/lib/public-content-shared';
import type { Post } from '@/types';

const ITEMS_PER_PAGE = 6;

export function NewsList({ posts }: { posts: Post[] }) {
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const displayedNews = posts.slice(0, visibleCount);

  return (
    <>
      <div className="mb-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {displayedNews.map((item) => (
          <Link
            key={item.id}
            href={`/news/${item.slug}`}
            className="card-interactive block border border-[#d4d4d4] bg-white transition-colors duration-200 hover:border-[#1E1E1E]"
          >
            <div className="relative aspect-[4/3] bg-[#f5f5f5]">
              {item.cover_image_url ? (
                <Image src={item.cover_image_url} alt={item.title} fill className="object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-[#777]">No image</div>
              )}
            </div>
            <div className="p-5">
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#555]">
                  {getPostCategoryLabel(item)}
                </span>
                <span className="text-[11px] text-[#555]">
                  {item.published_at ? formatDate(item.published_at, 'dd MMM yyyy') : '-'}
                </span>
              </div>
              <h3 className="text-sm font-bold leading-snug text-[#1E1E1E]">{item.title}</h3>
              {item.excerpt && (
                <p className="mt-2 text-xs leading-relaxed text-[#555]">{item.excerpt}</p>
              )}
            </div>
          </Link>
        ))}
      </div>

      {visibleCount < posts.length && (
        <div className="text-center">
          <button
            type="button"
            onClick={() => setVisibleCount((count) => count + 3)}
            className="border border-[#1E1E1E] bg-white px-8 py-3 text-sm font-bold text-[#1E1E1E] transition-colors duration-200 hover:bg-[#1E1E1E] hover:text-white"
          >
            Muat Lebih
          </button>
        </div>
      )}
    </>
  );
}
