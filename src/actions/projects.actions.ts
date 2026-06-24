'use server';

import { revalidatePath } from 'next/cache';
import { createServerSupabase } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/auth/helpers';
import { slugify } from '@/lib/utils';
import { projectSchema } from '@/lib/validations/content';
import { createAuditLog } from '@/lib/audit';
import { friendlyDbError, normalizeDbText, parseJsonContent } from '@/lib/cms';

export async function createProject(formData: FormData) {
  const supabase = await createServerSupabase();
  const profile = await getCurrentProfile();

  if (!profile) {
    return { error: 'Unauthorized' };
  }

  const parsed = projectSchema.safeParse({
    title: normalizeDbText(formData.get('title')),
    slug: normalizeDbText(formData.get('slug')) ?? slugify((formData.get('title') as string) || ''),
    client_name: normalizeDbText(formData.get('client_name')),
    category_id: normalizeDbText(formData.get('category_id')),
    location: normalizeDbText(formData.get('location')),
    project_year: formData.get('project_year')
      ? parseInt(formData.get('project_year') as string, 10)
      : null,
    excerpt: normalizeDbText(formData.get('excerpt')),
    content: parseJsonContent(formData.get('content'), null),
    cover_image_url: normalizeDbText(formData.get('cover_image_url')),
    gallery: parseJsonContent(formData.get('gallery'), []),
    is_featured: formData.get('is_featured') === 'true',
    status: (formData.get('status') as string) || 'draft',
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Data proyek tidak valid' };
  }

  const { data, error } = await supabase
    .from('projects')
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
    entityType: 'project',
    entityId: data.id,
    after: data,
  });

  revalidatePath('/dashboard/projects');
  return { data, success: 'Proyek berhasil dibuat' };
}

export async function updateProject(projectId: string, formData: FormData) {
  const supabase = await createServerSupabase();
  const profile = await getCurrentProfile();

  if (!profile) {
    return { error: 'Unauthorized' };
  }

  const parsed = projectSchema.safeParse({
    title: normalizeDbText(formData.get('title')),
    slug: normalizeDbText(formData.get('slug')) ?? slugify((formData.get('title') as string) || ''),
    client_name: normalizeDbText(formData.get('client_name')),
    category_id: normalizeDbText(formData.get('category_id')),
    location: normalizeDbText(formData.get('location')),
    project_year: formData.get('project_year')
      ? parseInt(formData.get('project_year') as string, 10)
      : null,
    excerpt: normalizeDbText(formData.get('excerpt')),
    content: parseJsonContent(formData.get('content'), null),
    cover_image_url: normalizeDbText(formData.get('cover_image_url')),
    gallery: parseJsonContent(formData.get('gallery'), []),
    is_featured: formData.get('is_featured') === 'true',
    status: (formData.get('status') as string) || 'draft',
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Data proyek tidak valid' };
  }

  const status = parsed.data.status;
  const { data: before } = await supabase.from('projects').select('*').eq('id', projectId).single();

  const { error } = await supabase
    .from('projects')
    .update({
      ...parsed.data,
      published_at: status === 'published' ? new Date().toISOString() : undefined,
    })
    .eq('id', projectId);

  if (error) {
    return { error: friendlyDbError(error.message) };
  }

  await createAuditLog({
    profile,
    action: 'update',
    entityType: 'project',
    entityId: projectId,
    before,
    after: { ...parsed.data, published_at: status === 'published' ? new Date().toISOString() : null },
  });

  revalidatePath('/dashboard/projects');
  revalidatePath(`/dashboard/projects/${projectId}`);
  return { success: 'Proyek berhasil diperbarui' };
}

export async function deleteProject(projectId: string) {
  const supabase = await createServerSupabase();
  const profile = await getCurrentProfile();
  const { data: before } = await supabase.from('projects').select('*').eq('id', projectId).single();

  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId);

  if (error) {
    return { error: friendlyDbError(error.message) };
  }

  await createAuditLog({
    profile,
    action: 'delete',
    entityType: 'project',
    entityId: projectId,
    before,
  });

  revalidatePath('/dashboard/projects');
  return { success: 'Proyek berhasil dihapus' };
}

export async function setProjectStatus(projectId: string, status: 'draft' | 'published' | 'archived') {
  const supabase = await createServerSupabase();
  const profile = await getCurrentProfile();
  if (!profile) return { error: 'Unauthorized' };

  const payload = {
    status,
    published_at: status === 'published' ? new Date().toISOString() : null,
  };
  const { error } = await supabase.from('projects').update(payload).eq('id', projectId);
  if (error) return { error: friendlyDbError(error.message) };

  await createAuditLog({
    profile,
    action: 'set_status',
    entityType: 'project',
    entityId: projectId,
    after: payload,
  });

  revalidatePath('/dashboard/projects');
  return { success: 'Status proyek berhasil diperbarui' };
}

export async function duplicateProject(projectId: string) {
  const supabase = await createServerSupabase();
  const profile = await getCurrentProfile();
  if (!profile) return { error: 'Unauthorized' };

  const { data: source, error } = await supabase.from('projects').select('*').eq('id', projectId).single();
  if (error || !source) return { error: 'Proyek tidak ditemukan' };

  const duplicateSlug = `${source.slug}-copy-${Date.now().toString().slice(-5)}`;
  const { data, error: insertError } = await supabase
    .from('projects')
    .insert({
      title: `${source.title} Copy`,
      slug: duplicateSlug,
      client_name: source.client_name,
      category_id: source.category_id,
      location: source.location,
      project_year: source.project_year,
      excerpt: source.excerpt,
      content: source.content,
      cover_image_url: source.cover_image_url,
      gallery: source.gallery,
      is_featured: false,
      status: 'draft',
    })
    .select()
    .single();

  if (insertError || !data) {
    return { error: friendlyDbError(insertError?.message ?? 'Gagal menduplikasi proyek') };
  }

  await createAuditLog({
    profile,
    action: 'duplicate',
    entityType: 'project',
    entityId: data.id,
    metadata: { source_project_id: projectId },
  });

  revalidatePath('/dashboard/projects');
  return { data, success: 'Proyek berhasil diduplikasi' };
}
