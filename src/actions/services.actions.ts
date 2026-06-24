'use server';

import { revalidatePath } from 'next/cache';
import { createServerSupabase } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/auth/helpers';
import { slugify } from '@/lib/utils';

export async function createService(formData: FormData) {
  const supabase = await createServerSupabase();
  const profile = await getCurrentProfile();

  if (!profile) {
    return { error: 'Unauthorized' };
  }

  const title = formData.get('title') as string;
  const slug = (formData.get('slug') as string) || slugify(title);

  const { data, error } = await supabase
    .from('services')
    .insert({
      title,
      slug,
      excerpt: formData.get('excerpt') as string | null,
      icon: formData.get('icon') as string | null,
      cover_image_url: formData.get('cover_image_url') as string | null,
      status: formData.get('status') as string,
      is_featured: formData.get('is_featured') === 'true',
      sort_order: parseInt(formData.get('sort_order') as string, 10) || 0,
    })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/dashboard/services');
  return { data, success: 'Layanan berhasil dibuat' };
}

export async function updateService(serviceId: string, formData: FormData) {
  const supabase = await createServerSupabase();
  const profile = await getCurrentProfile();

  if (!profile) {
    return { error: 'Unauthorized' };
  }

  const title = formData.get('title') as string;
  const slug = (formData.get('slug') as string) || slugify(title);

  const updateData: Record<string, unknown> = {
    title,
    slug,
    excerpt: formData.get('excerpt') as string | null,
    icon: formData.get('icon') as string | null,
    cover_image_url: formData.get('cover_image_url') as string | null,
    status: formData.get('status') as string,
    is_featured: formData.get('is_featured') === 'true',
    sort_order: parseInt(formData.get('sort_order') as string, 10) || 0,
    published_at:
      formData.get('status') === 'published'
        ? new Date().toISOString()
        : undefined,
  };

  const { error } = await supabase
    .from('services')
    .update(updateData)
    .eq('id', serviceId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/dashboard/services');
  revalidatePath(`/dashboard/services/${serviceId}`);
  return { success: 'Layanan berhasil diperbarui' };
}

export async function deleteService(serviceId: string) {
  const supabase = await createServerSupabase();

  const { error } = await supabase
    .from('services')
    .delete()
    .eq('id', serviceId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/dashboard/services');
  return { success: 'Layanan berhasil dihapus' };
}
