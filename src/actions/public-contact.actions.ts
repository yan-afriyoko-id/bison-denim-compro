'use server';

import { revalidatePath } from 'next/cache';
import { createServerSupabase } from '@/lib/supabase/server';
import { contactSchema } from '@/lib/validations/content';
import { normalizeDbText, friendlyDbError } from '@/lib/cms';

export async function submitContactForm(input: {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  subject?: string;
  country?: string;
  message: string;
}) {
  const supabase = await createServerSupabase();

  const parsed = contactSchema.safeParse({
    name: normalizeDbText(input.name),
    email: normalizeDbText(input.email),
    phone: normalizeDbText(input.phone ?? null),
    company: normalizeDbText(input.company ?? null),
    subject: normalizeDbText(input.subject ?? null),
    message: normalizeDbText(input.message),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Data kontak tidak valid' };
  }

  const { error } = await supabase.from('contact_submissions').insert({
    name: parsed.data.name,
    email: parsed.data.email,
    phone: parsed.data.phone,
    company: parsed.data.company,
    subject: parsed.data.subject,
    message: parsed.data.message,
    country: normalizeDbText(input.country ?? null),
    status: 'new',
  });

  if (error) {
    return { error: friendlyDbError(error.message) };
  }

  revalidatePath('/dashboard/leads');
  revalidatePath('/dashboard');
  return { success: 'Pesan berhasil dikirim' };
}
