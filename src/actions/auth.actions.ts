'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase/server';
import { loginSchema, forgotPasswordSchema, resetPasswordSchema } from '@/lib/validations/auth';
import type { UserRole } from '@/types';

export async function login(_prevState: unknown, formData: FormData) {
  const supabase = await createServerSupabase();

  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Data tidak valid' };
  }

  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { error: error.message === 'Invalid login credentials'
      ? 'Email atau password salah'
      : error.message };
  }

  // Verify session is readable and profile exists before redirecting
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Sesi gagal dibuat, coba lagi' };
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, is_active')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    console.error('[login] Profile fetch failed:', profileError?.message);
    return { error: 'Profil tidak ditemukan, hubungi administrator' };
  }
  if (!profile.is_active) {
    return { error: 'Akun Anda tidak aktif' };
  }

  revalidatePath('/', 'layout');
  redirect('/dashboard');
}

export async function signOut() {
  const supabase = await createServerSupabase();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/auth/login');
}

export async function forgotPassword(_prevState: unknown, formData: FormData) {
  const supabase = await createServerSupabase();

  const parsed = forgotPasswordSchema.safeParse({
    email: formData.get('email'),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Email tidak valid' };
  }

  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: 'Email reset password telah dikirim' };
}

export async function resetPassword(_prevState: unknown, formData: FormData) {
  const supabase = await createServerSupabase();

  const parsed = resetPasswordSchema.safeParse({
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Data tidak valid' };
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/', 'layout');
  redirect('/dashboard');
}

export async function inviteUser(email: string, role: UserRole) {
  const supabase = await createServerSupabase();

  const { data, error } = await supabase.auth.admin.inviteUserByEmail(email);

  if (error) {
    return { error: error.message };
  }

  if (data.user) {
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', data.user.id);

    if (profileError) {
      return { error: profileError.message };
    }
  }

  revalidatePath('/dashboard/users');
  return { success: 'Undangan berhasil dikirim' };
}
