'use client';

import { useEffect, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const placeholderRef = useRef<HTMLSpanElement>(null);
  const hintRef = useRef<HTMLSpanElement>(null);
  const [placeholder, setPlaceholder] = useState('Cari...');
  const [hint, setHint] = useState('Tekan');

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
    }
    sync();
    const interval = setInterval(sync, 700);
    return () => clearInterval(interval);
  }, [isOpen]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  return (
    <div className={cn('fixed inset-0 z-[60] transition-opacity duration-200', isOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0')}>
      {/* Source strings for the translator. Visually hidden but parsed by Google Translate. */}
      <span aria-hidden="true" className="sr-only">
        <span ref={placeholderRef} translate="yes">Cari...</span>
        <span ref={hintRef} translate="yes">Tekan</span>
      </span>
      <div className="absolute inset-0 bg-[#1E1E1E]/50" onClick={onClose} />
      <div className="relative flex items-start justify-center pt-[25vh] px-6">
        <div className={cn('w-full max-w-2xl transition-all duration-200', isOpen ? 'opacity-100' : 'opacity-0')}>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999999]" />
            <input
              ref={inputRef}
              type="text"
              placeholder={placeholder}
              className="w-full h-12 pl-10 pr-10 border border-[#d4d4d4] bg-white text-[#1E1E1E] text-sm outline-none"
            />
            <button onClick={onClose} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555555] hover:text-[#1E1E1E]">
              <X size={16} />
            </button>
          </div>
          <div className="mt-4 text-center text-xs text-[#999999]">
            {hint} <kbd className="px-1.5 py-0.5 border border-[#d4d4d4] text-xs">ESC</kbd> untuk tutup
          </div>
        </div>
      </div>
    </div>
  );
}
