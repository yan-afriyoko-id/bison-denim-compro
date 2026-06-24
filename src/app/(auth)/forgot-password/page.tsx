'use client';

import { useActionState } from 'react';
import { forgotPassword } from '@/actions/auth.actions';
import { Button, Input } from '@/components/ui';

export default function ForgotPasswordPage() {
  const [state, formAction, pending] = useActionState(forgotPassword, undefined);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold text-text-primary">Lupa Password</h1>
          <p className="text-sm text-text-secondary">
            Masukkan email Anda untuk menerima tautan reset password
          </p>
        </div>

        <form action={formAction} className="space-y-4">
          <Input
            id="email"
            name="email"
            type="email"
            label="Email"
            placeholder="admin@bison.com"
          />
          <Button
            type="submit"
            disabled={pending}
            className="w-full"
          >
            {pending ? 'Mengirim...' : 'Kirim Tautan Reset'}
          </Button>
        </form>

        {state?.error && (
          <p className="text-center text-sm text-danger">{state.error}</p>
        )}
        {state?.success && (
          <p className="text-center text-sm text-success">{state.success}</p>
        )}

        <div className="text-center">
          <a
            href="/auth/login"
            className="text-sm text-text-secondary hover:text-accent transition-colors"
          >
            Kembali ke login
          </a>
        </div>
      </div>
    </div>
  );
}
