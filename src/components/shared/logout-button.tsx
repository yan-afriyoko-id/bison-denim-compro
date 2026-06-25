'use client';

import { useRouter } from 'next/navigation';
import { useTransition, type ReactNode } from 'react';
import { signOut } from '@/actions/auth.actions';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { useState } from 'react';

export function LogoutButton({
  className,
  children,
  onBeforeLogout,
}: {
  className: string;
  children: ReactNode;
  onBeforeLogout?: () => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <ConfirmationDialog
      open={open}
      onOpenChange={setOpen}
      title="Sign Out"
      description="You will be signed out from the current session."
      confirmLabel="Sign Out"
      cancelLabel="Stay Here"
      variant="neutral"
      isPending={isPending}
      onConfirm={() => {
        startTransition(async () => {
          onBeforeLogout?.();
          await signOut();
          router.push('/auth/login');
        });
      }}
    >
      <button type="button" className={className}>
        {children}
      </button>
    </ConfirmationDialog>
  );
}
