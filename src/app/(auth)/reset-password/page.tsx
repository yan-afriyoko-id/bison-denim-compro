'use client';

import { useActionState } from 'react';
import { resetPassword } from '@/actions/auth.actions';
import { Button, Input } from '@/components/ui';

export default function ResetPasswordPage() {
  const [state, formAction, pending] = useActionState(resetPassword, undefined);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold text-text-primary">Reset Password</h1>
          <p className="text-sm text-text-secondary">
            Masukkan password baru Anda
          </p>
        </div>

        <form action={formAction} className="space-y-4">
          <Input
            id="password"
            name="password"
            type="password"
            label="Password Baru"
            placeholder="Minimal 8 karakter"
          />
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            label="Konfirmasi Password"
            placeholder="Ulangi password baru"
          />
          <Button
            type="submit"
            disabled={pending}
            className="w-full"
          >
            {pending ? 'Memproses...' : 'Reset Password'}
          </Button>
        </form>

        {state?.error && (
          <p className="text-center text-sm text-danger">{state.error}</p>
        )}
      </div>
    </div>
  );
}
