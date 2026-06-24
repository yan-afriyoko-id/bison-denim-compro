import { cn } from '@/lib/utils';

interface PageHeroProps {
  title: string;
  subtitle?: string;
  backgroundImage?: string;
}

export function PageHero({ title, subtitle, backgroundImage }: PageHeroProps) {
  return (
    <section
      className={cn(
        'relative py-20 px-6',
        backgroundImage ? 'overflow-hidden' : 'bg-surface-elevated'
      )}
    >
      {backgroundImage && (
        <>
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${backgroundImage})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/30" />
        </>
      )}
      <div className="relative mx-auto max-w-7xl text-center">
        <h1
          className={cn(
            'text-4xl sm:text-5xl font-bold mb-4',
            backgroundImage ? 'text-white' : 'text-text-primary'
          )}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            className={cn(
              'text-lg max-w-2xl mx-auto leading-relaxed',
              backgroundImage ? 'text-white/80' : 'text-text-secondary'
            )}
          >
            {subtitle}
          </p>
        )}
      </div>
    </section>
  );
}
