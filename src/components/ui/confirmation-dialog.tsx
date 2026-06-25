'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { Loader2, X } from 'lucide-react';
import type { ReactNode } from 'react';

type ConfirmationDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'neutral' | 'destructive';
  isPending?: boolean;
  onConfirm: () => void;
  children?: ReactNode;
};

export function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'neutral',
  isPending = false,
  onConfirm,
  children,
}: ConfirmationDialogProps) {
  const confirmClassName =
    variant === 'destructive'
      ? 'bg-red-600 text-white hover:bg-red-700'
      : 'bg-gray-900 text-white hover:bg-[#1E1E1E]';

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      {children ? <Dialog.Trigger asChild>{children}</Dialog.Trigger> : null}
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[90] bg-[#1E1E1E]/35" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-[100] w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-sm border border-gray-200 bg-white shadow-xl outline-none">
          <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4">
            <div>
              <Dialog.Title className="text-sm font-bold uppercase tracking-wider text-gray-900">
                {title}
              </Dialog.Title>
              {description ? (
                <Dialog.Description className="mt-1 text-sm leading-relaxed text-gray-500">
                  {description}
                </Dialog.Description>
              ) : null}
            </div>
            <Dialog.Close
              type="button"
              disabled={isPending}
              className="text-gray-400 transition-colors hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>

          <div className="flex items-center justify-end gap-3 px-5 py-4">
            <Dialog.Close
              type="button"
              disabled={isPending}
              className="px-4 py-2 text-sm font-semibold text-gray-500 transition-colors hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {cancelLabel}
            </Dialog.Close>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isPending}
              className={`inline-flex items-center gap-2 rounded-sm px-4 py-2 text-xs font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${confirmClassName}`}
            >
              {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              {confirmLabel}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
