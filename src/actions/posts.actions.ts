'use server';

import { revalidatePath } from 'next/cache';
import { createServerSupabase } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/auth/helpers';
import { slugify } from '@/lib/utils';
import { postSchema } from '@/lib/validations/content';
import { createAuditLog } from '@/lib/audit';
import { friendlyDbError, normalizeDbText, parseJsonContent } from '@/lib/cms';
import { hasDashboardModuleActionAccess } from '@/lib/permissions';

export async function createPost(formData: FormData) {
  const supabase = await createServerSupabase();
  const profile = await getCurrentProfile();

  if (!profile || !hasDashboardModuleActionAccess(profile, 'posts', 'create')) {
    return { error: 'Unauthorized' };
  }

  const parsed = postSchema.safeParse({
    title: normalizeDbText(formData.get('title')),
    slug: normalizeDbText(formData.get('slug')) ?? slugify((formData.get('title') as string) || ''),
    excerpt: normalizeDbText(formData.get('excerpt')),
    content: parseJsonContent(formData.get('content'), null),
    cover_image_url: normalizeDbText(formData.get('cover_image_url')),
    category_id: normalizeDbText(formData.get('category_id')),
    author_id: profile.id,
    status: (formData.get('status') as string) || 'draft',
    seo_title: normalizeDbText(formData.get('seo_title')),
    seo_description: normalizeDbText(formData.get('seo_description')),
    is_featured: formData.get('is_featured') === 'true',
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Data post tidak valid' };
  }

  const { data, error } = await supabase
    .from('posts')
    .insert({
      ...parsed.data,
      published_at: parsed.data.status === 'published' ? new Date().toISOString() : null,
    })
    .select()
    .single();

  if (error) {
    return { error: friendlyDbError(error.message) };
  }

  await createAuditLog({
    profile,
    action: 'create',
    entityType: 'post',
    entityId: data.id,
    after: data,
  });

  revalidatePath('/dashboard/posts');
  revalidatePath('/news');
  return { data, success: 'Post berhasil dibuat' };
}

export async function updatePost(postId: string, formData: FormData) {
  const supabase = await createServerSupabase();
  const profile = await getCurrentProfile();

  if (!profile || !hasDashboardModuleActionAccess(profile, 'posts', 'edit')) {
    return { error: 'Unauthorized' };
  }

  const parsed = postSchema.safeParse({
    title: normalizeDbText(formData.get('title')),
    slug: normalizeDbText(formData.get('slug')) ?? slugify((formData.get('title') as string) || ''),
    excerpt: normalizeDbText(formData.get('excerpt')),
    content: parseJsonContent(formData.get('content'), null),
    cover_image_url: normalizeDbText(formData.get('cover_image_url')),
    category_id: normalizeDbText(formData.get('category_id')),
    author_id: profile.id,
    status: (formData.get('status') as string) || 'draft',
    seo_title: normalizeDbText(formData.get('seo_title')),
    seo_description: normalizeDbText(formData.get('seo_description')),
    is_featured: formData.get('is_featured') === 'true',
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Data post tidak valid' };
  }

  const status = parsed.data.status;
  const { data: before } = await supabase.from('posts').select('*').eq('id', postId).single();

  const { error } = await supabase
    .from('posts')
    .update({
      ...parsed.data,
      published_at: status === 'published' ? new Date().toISOString() : null,
    })
    .eq('id', postId);

  if (error) {
    return { error: friendlyDbError(error.message) };
  }

  await createAuditLog({
    profile,
    action: 'update',
    entityType: 'post',
    entityId: postId,
    before,
    after: { ...parsed.data, published_at: status === 'published' ? new Date().toISOString() : null },
  });

  revalidatePath('/dashboard/posts');
  revalidatePath('/news');
  revalidatePath(`/news/${parsed.data.slug}`);
  if (before?.slug && before.slug !== parsed.data.slug) {
    revalidatePath(`/news/${before.slug}`);
  }
  return { success: 'Post berhasil diperbarui' };
}

export async function deletePost(postId: string) {
  const supabase = await createServerSupabase();
  const profile = await getCurrentProfile();
  if (!profile || !hasDashboardModuleActionAccess(profile, 'posts', 'delete')) {
    return { error: 'Unauthorized' };
  }
  const { data: before } = await supabase.from('posts').select('*').eq('id', postId).single();

  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', postId);

  if (error) {
    return { error: friendlyDbError(error.message) };
  }

  await createAuditLog({
    profile,
    action: 'delete',
    entityType: 'post',
    entityId: postId,
    before,
  });

  revalidatePath('/dashboard/posts');
  revalidatePath('/news');
  if (before?.slug) {
    revalidatePath(`/news/${before.slug}`);
  }
  return { success: 'Post berhasil dihapus' };
}

export async function setPostStatus(postId: string, status: 'draft' | 'published' | 'archived') {
  const supabase = await createServerSupabase();
  const profile = await getCurrentProfile();
  if (!profile || !hasDashboardModuleActionAccess(profile, 'posts', 'publish')) return { error: 'Unauthorized' };

  const payload = {
    status,
    published_at: status === 'published' ? new Date().toISOString() : null,
  };
  const { error } = await supabase.from('posts').update(payload).eq('id', postId);
  if (error) return { error: friendlyDbError(error.message) };

  await createAuditLog({
    profile,
    action: 'set_status',
    entityType: 'post',
    entityId: postId,
    after: payload,
  });

  revalidatePath('/dashboard/posts');
  revalidatePath('/news');
  return { success: 'Status post berhasil diperbarui' };
}

export async function duplicatePost(postId: string) {
  const supabase = await createServerSupabase();
  const profile = await getCurrentProfile();
  if (!profile || !hasDashboardModuleActionAccess(profile, 'posts', 'create')) return { error: 'Unauthorized' };

  const { data: source, error } = await supabase.from('posts').select('*').eq('id', postId).single();
  if (error || !source) return { error: 'Post tidak ditemukan' };

  const duplicateSlug = `${source.slug}-copy-${Date.now().toString().slice(-5)}`;
  const { data, error: insertError } = await supabase
    .from('posts')
    .insert({
      title: `${source.title} Copy`,
      slug: duplicateSlug,
      excerpt: source.excerpt,
      content: source.content,
      cover_image_url: source.cover_image_url,
      category_id: source.category_id,
      author_id: profile.id,
      status: 'draft',
      seo_title: source.seo_title,
      seo_description: source.seo_description,
      is_featured: false,
    })
    .select()
    .single();

  if (insertError || !data) {
    return { error: friendlyDbError(insertError?.message ?? 'Gagal menduplikasi post') };
  }

  await createAuditLog({
    profile,
    action: 'duplicate',
    entityType: 'post',
    entityId: data.id,
    metadata: { source_post_id: postId },
  });

  revalidatePath('/dashboard/posts');
  revalidatePath('/news');
  return { data, success: 'Post berhasil diduplikasi' };
}
