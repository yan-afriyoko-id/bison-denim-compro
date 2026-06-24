'use server';

import { revalidatePath } from 'next/cache';
import { createServerSupabase } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/auth/helpers';
import { slugify } from '@/lib/utils';

export async function createPost(formData: FormData) {
  const supabase = await createServerSupabase();
  const profile = await getCurrentProfile();

  if (!profile) {
    return { error: 'Unauthorized' };
  }

  const title = formData.get('title') as string;
  const slug = (formData.get('slug') as string) || slugify(title);

  const { data, error } = await supabase
    .from('posts')
    .insert({
      title,
      slug,
      excerpt: (formData.get('excerpt') as string) || null,
      content: formData.get('content') ? JSON.parse(formData.get('content') as string) : null,
      cover_image_url: (formData.get('cover_image_url') as string) || null,
      author_id: profile.id,
      status: (formData.get('status') as string) || 'draft',
      seo_title: (formData.get('seo_title') as string) || null,
      seo_description: (formData.get('seo_description') as string) || null,
      published_at: formData.get('status') === 'published' ? new Date().toISOString() : null,
    })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/dashboard/posts');
  return { data, success: 'Post berhasil dibuat' };
}

export async function updatePost(postId: string, formData: FormData) {
  const supabase = await createServerSupabase();
  const profile = await getCurrentProfile();

  if (!profile) {
    return { error: 'Unauthorized' };
  }

  const title = formData.get('title') as string;
  const slug = (formData.get('slug') as string) || slugify(title);
  const status = formData.get('status') as string;

  const { error } = await supabase
    .from('posts')
    .update({
      title,
      slug,
      excerpt: (formData.get('excerpt') as string) || null,
      content: formData.get('content') ? JSON.parse(formData.get('content') as string) : null,
      cover_image_url: (formData.get('cover_image_url') as string) || null,
      status,
      seo_title: (formData.get('seo_title') as string) || null,
      seo_description: (formData.get('seo_description') as string) || null,
      published_at: status === 'published' ? new Date().toISOString() : null,
    })
    .eq('id', postId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/dashboard/posts');
  return { success: 'Post berhasil diperbarui' };
}

export async function deletePost(postId: string) {
  const supabase = await createServerSupabase();

  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', postId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/dashboard/posts');
  return { success: 'Post berhasil dihapus' };
}
