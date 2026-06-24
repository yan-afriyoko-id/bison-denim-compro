'use client';

import { useTransition, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export function ActionButton({
  action,
  children,
  title,
  className,
}: {
  action: () => Promise<unknown>;
  children: ReactNode;
  title: string;
  className: string;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => {
        startTransition(async () => {
          await action();
          router.refresh();
        });
      }}
      disabled={isPending}
      title={title}
      className={className}
    >
      {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : children}
    </button>
  );
}
