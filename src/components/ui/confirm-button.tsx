'use client';

import { useState, useTransition, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';

type ConfirmButtonProps = {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'neutral' | 'destructive';
  className: string;
  buttonTitle?: string;
  disabled?: boolean;
  refreshOnConfirm?: boolean;
  onConfirm: () => Promise<unknown> | unknown;
  onAfterConfirm?: (result: unknown) => void | Promise<void>;
  children: ReactNode;
};

export function ConfirmButton({
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'destructive',
  className,
  buttonTitle,
  disabled = false,
  refreshOnConfirm = false,
  onConfirm,
  onAfterConfirm,
  children,
}: ConfirmButtonProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <ConfirmationDialog
      open={open}
      onOpenChange={setOpen}
      title={title}
      description={description}
      confirmLabel={confirmLabel}
      cancelLabel={cancelLabel}
      variant={variant}
      isPending={isPending}
      onConfirm={() => {
        startTransition(async () => {
          const result = await onConfirm();
          await onAfterConfirm?.(result);
          setOpen(false);
          if (refreshOnConfirm) {
            router.refresh();
          }
        });
      }}
    >
      <button
        type="button"
        title={buttonTitle}
        disabled={disabled || isPending}
        className={className}
      >
        {children}
      </button>
    </ConfirmationDialog>
  );
}
