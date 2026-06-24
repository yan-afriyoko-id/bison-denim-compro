'use server';

import { revalidatePath } from 'next/cache';
import { createServerSupabase } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/auth/helpers';
import { pageSchema } from '@/lib/validations/content';
import { slugify } from '@/lib/utils';

export async function createPage(formData: FormData) {
  const supabase = await createServerSupabase();
  const profile = await getCurrentProfile();

  if (!profile) {
    return { error: 'Unauthorized' };
  }

  const title = formData.get('title') as string;
  const slug = slugify(title);

  const { data, error } = await supabase
    .from('pages')
    .insert({
      title,
      slug,
      description: formData.get('description') as string | null,
      status: 'draft',
      created_by: profile.id,
      updated_by: profile.id,
    })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/dashboard/pages');
  return { data, success: 'Halaman berhasil dibuat' };
}

export async function updatePage(pageId: string, formData: FormData) {
  const supabase = await createServerSupabase();
  const profile = await getCurrentProfile();

  if (!profile) {
    return { error: 'Unauthorized' };
  }

  const parsed = pageSchema.safeParse({
    title: formData.get('title'),
    slug: formData.get('slug'),
    description: formData.get('description'),
    status: formData.get('status'),
    seo_title: formData.get('seo_title'),
    seo_description: formData.get('seo_description'),
    og_image_url: formData.get('og_image_url'),
    is_indexed: formData.get('is_indexed') === 'true',
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Data tidak valid' };
  }

  const updateData: Record<string, unknown> = {
    ...parsed.data,
    updated_by: profile.id,
    published_at: parsed.data.status === 'published' ? new Date().toISOString() : undefined,
  };

  const { error } = await supabase
    .from('pages')
    .update(updateData)
    .eq('id', pageId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/dashboard/pages');
  revalidatePath(`/dashboard/pages/builder?id=${pageId}`);
  revalidatePath(`/${formData.get('slug') as string}`);
  return { success: 'Halaman berhasil diperbarui' };
}

export async function deletePage(pageId: string) {
  const supabase = await createServerSupabase();

  const { error } = await supabase
    .from('pages')
    .delete()
    .eq('id', pageId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/dashboard/pages');
  return { success: 'Halaman berhasil dihapus' };
}

export async function publishPage(pageId: string) {
  const supabase = await createServerSupabase();
  const profile = await getCurrentProfile();

  if (!profile) {
    return { error: 'Unauthorized' };
  }

  const { error } = await supabase
    .from('pages')
    .update({
      status: 'published',
      published_at: new Date().toISOString(),
      updated_by: profile.id,
    })
    .eq('id', pageId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/dashboard/pages');
  revalidatePath('/', 'layout');
  return { success: 'Halaman berhasil dipublikasikan' };
}
