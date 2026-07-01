'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ArrowRight, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PublicSearchItem } from '@/lib/public-content';

interface SearchOverlayProps {
  isOpen: boolean;
  items: PublicSearchItem[];
  onClose: () => void;
}

const TYPE_LABELS: Record<PublicSearchItem['type'], string> = {
  page: 'Halaman',
  service: 'Produk',
  post: 'Berita',
};

function normalizeSearchText(value: string) {
  return value.toLowerCase().replace(/\s+/g, ' ').trim();
}

function scoreSearchItem(item: PublicSearchItem, query: string) {
  const title = normalizeSearchText(item.title);
  const description = normalizeSearchText(item.description);

  if (!query) {
    return 0;
  }

  if (title === query) {
    return 100;
  }

  if (title.startsWith(query)) {
    return 80;
  }

  if (title.includes(query)) {
    return 60;
  }

  if (description.includes(query)) {
    return 30;
  }

  return 0;
}

function getDefaultRecommendations(items: PublicSearchItem[]) {
  return items.slice(0, 6);
}

export function SearchOverlay({ isOpen, items, onClose }: SearchOverlayProps) {
  const router = useRouter();
  const pathname = usePathname();
  const inputRef = useRef<HTMLInputElement>(null);
  const previousPathnameRef = useRef(pathname);
  const placeholderRef = useRef<HTMLSpanElement>(null);
  const hintRef = useRef<HTMLSpanElement>(null);
  const suggestionTitleRef = useRef<HTMLSpanElement>(null);
  const suggestionSubtitleRef = useRef<HTMLSpanElement>(null);
  const emptyStateRef = useRef<HTMLSpanElement>(null);
  const [placeholder, setPlaceholder] = useState('Cari...');
  const [hint, setHint] = useState('Tekan');
  const [suggestionTitle, setSuggestionTitle] = useState('Rekomendasi');
  const [suggestionSubtitle, setSuggestionSubtitle] = useState('Pilih halaman, produk, atau berita yang ingin dibuka.');
  const [emptyState, setEmptyState] = useState('Tidak ada hasil yang cocok.');
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  const normalizedQuery = normalizeSearchText(query);
  const filteredItems = useMemo(() => {
    if (!normalizedQuery) {
      return getDefaultRecommendations(items);
    }

    return items
      .map((item) => ({ item, score: scoreSearchItem(item, normalizedQuery) }))
      .filter((entry) => entry.score > 0)
      .sort((left, right) => {
        if (left.score !== right.score) {
          return right.score - left.score;
        }

        const leftDate = left.item.publishedAt ? new Date(left.item.publishedAt).getTime() : 0;
        const rightDate = right.item.publishedAt ? new Date(right.item.publishedAt).getTime() : 0;

        if (leftDate !== rightDate) {
          return rightDate - leftDate;
        }

        return left.item.title.localeCompare(right.item.title);
      })
      .slice(0, 8)
      .map((entry) => entry.item);
  }, [items, normalizedQuery]);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Google Translate ignores input `placeholder` attributes and skips <input>/<kbd>,
  // so we render the source strings as visible-but-hidden <span translate="yes"> nodes,
  // then sync the translated text back into the input placeholder + hint label.
  useEffect(() => {
    function sync() {
      if (placeholderRef.current?.textContent) {
        setPlaceholder(placeholderRef.current.textContent);
      }
      if (hintRef.current?.textContent) {
        setHint(hintRef.current.textContent);
      }
      if (suggestionTitleRef.current?.textContent) {
        setSuggestionTitle(suggestionTitleRef.current.textContent);
      }
      if (suggestionSubtitleRef.current?.textContent) {
        setSuggestionSubtitle(suggestionSubtitleRef.current.textContent);
      }
      if (emptyStateRef.current?.textContent) {
        setEmptyState(emptyStateRef.current.textContent);
      }
    }
    sync();
    const interval = setInterval(sync, 700);
    return () => clearInterval(interval);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setActiveIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (previousPathnameRef.current !== pathname) {
      previousPathnameRef.current = pathname;

      if (isOpen) {
        onClose();
      }
    }
  }, [isOpen, onClose, pathname]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (!filteredItems.length) {
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((current) => (current + 1) % filteredItems.length);
        return;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((current) => (current - 1 + filteredItems.length) % filteredItems.length);
        return;
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        const selectedItem = filteredItems[activeIndex] ?? filteredItems[0];
        if (selectedItem) {
          onClose();
          router.push(selectedItem.href);
        }
      }
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [activeIndex, filteredItems, isOpen, onClose, router]);

  const showRecommendations = normalizedQuery.length === 0;

  return (
    <div className={cn('fixed inset-0 z-[60] transition-opacity duration-200', isOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0')} onClick={onClose}>
      {/* Source strings for the translator. Visually hidden but parsed by Google Translate. */}
      <span aria-hidden="true" className="sr-only">
        <span ref={placeholderRef} translate="yes">Cari...</span>
        <span ref={hintRef} translate="yes">Tekan</span>
        <span ref={suggestionTitleRef} translate="yes">Rekomendasi</span>
        <span ref={suggestionSubtitleRef} translate="yes">Pilih halaman, produk, atau berita yang ingin dibuka.</span>
        <span ref={emptyStateRef} translate="yes">Tidak ada hasil yang cocok.</span>
      </span>
      <div className="absolute inset-0 bg-[#1E1E1E]/50 backdrop-blur-sm" />
      <div className="relative flex items-start justify-center pt-[12vh] px-6">
        <div className={cn('w-full max-w-2xl transition-all duration-200', isOpen ? 'opacity-100' : 'opacity-0')} onClick={(e) => e.stopPropagation()}>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999999]" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={placeholder}
              className="w-full h-12 pl-10 pr-10 border border-[#d4d4d4] bg-white text-[#1E1E1E] text-sm outline-none"
            />
            <button onClick={onClose} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555555] hover:text-[#1E1E1E]">
              <X size={16} />
            </button>
          </div>
          <div className="mt-4 border border-[#d4d4d4] bg-white">
            <div className="border-b border-[#d4d4d4] px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#777]">
                {showRecommendations ? suggestionTitle : `${filteredItems.length} hasil`}
              </p>
              <p className="mt-1 text-xs text-[#999]">
                {showRecommendations ? suggestionSubtitle : `Tekan Enter untuk membuka hasil teratas.`}
              </p>
            </div>

            {filteredItems.length === 0 ? (
              <div className="px-4 py-6 text-sm text-[#777]">{emptyState}</div>
            ) : (
              <div className="max-h-[360px] overflow-y-auto">
                {filteredItems.map((item, index) => (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      'flex items-center gap-3 border-b border-[#ececec] px-4 py-3 transition-colors duration-150 last:border-b-0',
                      activeIndex === index ? 'bg-[#f7f7f7]' : 'hover:bg-[#fafafa]'
                    )}
                    onMouseEnter={() => setActiveIndex(index)}
                  >
                    <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden bg-[#f3f3f3]">
                      {item.imageUrl ? (
                        <Image src={item.imageUrl} alt={item.title} fill className="object-cover" sizes="56px" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-[10px] font-semibold uppercase tracking-[0.2em] text-[#999]">
                          {TYPE_LABELS[item.type]}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="border border-[#dcdcdc] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#666]">
                          {TYPE_LABELS[item.type]}
                        </span>
                      </div>
                      <p className="mt-2 truncate text-sm font-semibold text-[#1E1E1E]">{item.title}</p>
                      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[#666]">
                        {item.description || item.href}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 flex-shrink-0 text-[#999]" />
                  </Link>
                ))}
              </div>
            )}
          </div>
          <div className="mt-4 text-center text-xs text-[#999999]">
            {hint} <kbd className="px-1.5 py-0.5 border border-[#d4d4d4] text-xs">ESC</kbd> untuk tutup
          </div>
        </div>
      </div>
    </div>
  );
}
