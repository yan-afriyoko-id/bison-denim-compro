'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export interface HeroSlide {
  image: string;
  alt: string;
  eyebrow?: string;
  title: string;
  description: string;
  cta?: { label: string; href: string };
}

interface HeroSliderProps {
  slides: HeroSlide[];
  interval?: number;
  className?: string;
}

export function HeroSlider({ slides, interval = 6000, className = '' }: HeroSliderProps) {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const count = slides.length;

  const goTo = useCallback(
    (index: number) => {
      setCurrent(((index % count) + count) % count);
    },
    [count]
  );

  const next = useCallback(() => goTo(current + 1), [current, goTo]);
  const prev = useCallback(() => goTo(current - 1), [current, goTo]);

  // Auto-slide, paused on hover/focus
  useEffect(() => {
    if (isPaused || count <= 1) return;
    timerRef.current = setInterval(() => {
      setCurrent((c) => (c + 1) % count);
    }, interval);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, interval, count]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') next();
    if (e.key === 'ArrowLeft') prev();
  };

  if (count === 0) return null;

  return (
    <section
      className={`relative h-[520px] bg-[#1E1E1E] overflow-hidden ${className}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
      onKeyDown={handleKeyDown}
      aria-roledescription="carousel"
      aria-label="Banner utama"
    >
      {/* Slides */}
      {slides.map((slide, i) => (
        <div
          key={i}
          className={`absolute inset-0 transition-opacity duration-700 ease-out ${
            i === current ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          aria-hidden={i !== current}
          role="group"
          aria-roledescription="slide"
          aria-label={`${i + 1} dari ${count}`}
        >
          <Image
            src={slide.image}
            alt={slide.alt}
            fill
            sizes="100vw"
            className="object-cover opacity-70"
            priority={i === 0}
          />
          <div className="absolute inset-0 flex items-center">
            <div className="mx-auto max-w-7xl px-6 w-full">
              {slide.eyebrow && (
                <span className="block text-white/70 text-xs sm:text-sm font-bold uppercase tracking-[0.2em] mb-3">
                  {slide.eyebrow}
                </span>
              )}
              <h1
                className={`text-white text-5xl sm:text-7xl font-bold tracking-tight leading-none transition-all duration-700 ease-out ${
                  i === current ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
                }`}
              >
                {slide.title}
              </h1>
              <p
                className={`text-white/80 text-base sm:text-lg mt-4 max-w-xl leading-relaxed transition-all duration-700 ease-out delay-100 ${
                  i === current ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
                }`}
              >
                {slide.description}
              </p>
              {slide.cta && (
                <Link
                  href={slide.cta.href}
                  className={`inline-flex items-center gap-2 mt-8 bg-white text-[#1E1E1E] font-bold text-sm px-6 py-3 hover:bg-gray-100 transition-all duration-300 ${
                    i === current ? 'translate-y-0 opacity-100 delay-200' : 'translate-y-4 opacity-0'
                  }`}
                >
                  <span>{slide.cta.label}</span>
                  <span aria-hidden="true">&rarr;</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      ))}

      {/* Prev / Next arrows */}
      {count > 1 && (
        <>
          <button
            type="button"
            onClick={prev}
            aria-label="Slide sebelumnya"
            className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 z-10 grid place-items-center w-10 h-10 sm:w-12 sm:h-12 bg-white/15 hover:bg-white/30 backdrop-blur-sm text-white hover:text-[#1E1E1E] border border-white/30 transition-colors duration-200 cursor-pointer"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Slide berikutnya"
            className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 z-10 grid place-items-center w-10 h-10 sm:w-12 sm:h-12 bg-white/15 hover:bg-white/30 backdrop-blur-sm text-white hover:text-[#1E1E1E] border border-white/30 transition-colors duration-200 cursor-pointer"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </>
      )}

      {/* Indicator dots */}
      {count > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Ke slide ${i + 1}`}
              aria-current={i === current}
              className={`h-2 transition-all duration-300 cursor-pointer ${
                i === current ? 'w-8 bg-white' : 'w-2 bg-white/50 hover:bg-white/75'
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
