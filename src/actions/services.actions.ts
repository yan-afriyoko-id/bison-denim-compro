'use server';

import { revalidatePath } from 'next/cache';
import { createServerSupabase } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/auth/helpers';
import { slugify } from '@/lib/utils';
import { serviceSchema } from '@/lib/validations/content';
import { createAuditLog } from '@/lib/audit';
import { friendlyDbError, normalizeDbText, parseJsonContent } from '@/lib/cms';
import { hasDashboardModuleActionAccess } from '@/lib/permissions';

export async function createService(formData: FormData) {
  const supabase = await createServerSupabase();
  const profile = await getCurrentProfile();

  if (!profile || !hasDashboardModuleActionAccess(profile, 'pages', 'create')) {
    return { error: 'Unauthorized' };
  }

  const parsed = serviceSchema.safeParse({
    title: normalizeDbText(formData.get('title')),
    slug: normalizeDbText(formData.get('slug')) ?? slugify((formData.get('title') as string) || ''),
    excerpt: normalizeDbText(formData.get('excerpt')),
    content: parseJsonContent(formData.get('content'), null),
    icon: normalizeDbText(formData.get('icon')),
    cover_image_url: normalizeDbText(formData.get('cover_image_url')),
    sort_order: parseInt((formData.get('sort_order') as string) || '0', 10) || 0,
    is_featured: formData.get('is_featured') === 'true',
    status: (formData.get('status') as string) || 'draft',
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Data layanan tidak valid' };
  }

  const { data, error } = await supabase
    .from('services')
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
    entityType: 'service',
    entityId: data.id,
    after: data,
  });

  revalidatePath('/dashboard/services');
  revalidatePath('/services');
  return { data, success: 'Layanan berhasil dibuat' };
}

export async function updateService(serviceId: string, formData: FormData) {
  const supabase = await createServerSupabase();
  const profile = await getCurrentProfile();

  if (!profile || !hasDashboardModuleActionAccess(profile, 'pages', 'edit')) {
    return { error: 'Unauthorized' };
  }

  const parsed = serviceSchema.safeParse({
    title: normalizeDbText(formData.get('title')),
    slug: normalizeDbText(formData.get('slug')) ?? slugify((formData.get('title') as string) || ''),
    excerpt: normalizeDbText(formData.get('excerpt')),
    content: parseJsonContent(formData.get('content'), null),
    icon: normalizeDbText(formData.get('icon')),
    cover_image_url: normalizeDbText(formData.get('cover_image_url')),
    sort_order: parseInt((formData.get('sort_order') as string) || '0', 10) || 0,
    is_featured: formData.get('is_featured') === 'true',
    status: (formData.get('status') as string) || 'draft',
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Data layanan tidak valid' };
  }

  const { data: before } = await supabase.from('services').select('*').eq('id', serviceId).single();

  const updateData: Record<string, unknown> = {
    ...parsed.data,
    published_at:
      parsed.data.status === 'published'
        ? new Date().toISOString()
        : null,
  };

  const { error } = await supabase
    .from('services')
    .update(updateData)
    .eq('id', serviceId);

  if (error) {
    return { error: friendlyDbError(error.message) };
  }

  await createAuditLog({
    profile,
    action: 'update',
    entityType: 'service',
    entityId: serviceId,
    before,
    after: updateData,
  });

  revalidatePath('/dashboard/services');
  revalidatePath(`/dashboard/services/${serviceId}`);
  revalidatePath('/services');
  revalidatePath(`/services/${parsed.data.slug}`);
  if (before?.slug && before.slug !== parsed.data.slug) {
    revalidatePath(`/services/${before.slug}`);
  }
  return { success: 'Layanan berhasil diperbarui' };
}

export async function deleteService(serviceId: string) {
  const supabase = await createServerSupabase();
  const profile = await getCurrentProfile();
  if (!profile || !hasDashboardModuleActionAccess(profile, 'pages', 'delete')) {
    return { error: 'Unauthorized' };
  }
  const { data: before } = await supabase.from('services').select('*').eq('id', serviceId).single();

  const { error } = await supabase
    .from('services')
    .delete()
    .eq('id', serviceId);

  if (error) {
    return { error: friendlyDbError(error.message) };
  }

  await createAuditLog({
    profile,
    action: 'delete',
    entityType: 'service',
    entityId: serviceId,
    before,
  });

  revalidatePath('/dashboard/services');
  revalidatePath('/services');
  if (before?.slug) {
    revalidatePath(`/services/${before.slug}`);
  }
  return { success: 'Layanan berhasil dihapus' };
}

export async function setServiceStatus(serviceId: string, status: 'draft' | 'published' | 'archived') {
  const supabase = await createServerSupabase();
  const profile = await getCurrentProfile();

  if (!profile || !hasDashboardModuleActionAccess(profile, 'pages', 'publish')) return { error: 'Unauthorized' };

  const payload = {
    status,
    published_at: status === 'published' ? new Date().toISOString() : null,
  };

  const { error } = await supabase.from('services').update(payload).eq('id', serviceId);
  if (error) return { error: friendlyDbError(error.message) };

  await createAuditLog({
    profile,
    action: 'set_status',
    entityType: 'service',
    entityId: serviceId,
    after: payload,
  });

  revalidatePath('/dashboard/services');
  revalidatePath('/services');
  return { success: 'Status layanan berhasil diperbarui' };
}

export async function duplicateService(serviceId: string) {
  const supabase = await createServerSupabase();
  const profile = await getCurrentProfile();
  if (!profile || !hasDashboardModuleActionAccess(profile, 'pages', 'create')) return { error: 'Unauthorized' };

  const { data: source, error } = await supabase.from('services').select('*').eq('id', serviceId).single();
  if (error || !source) return { error: 'Layanan tidak ditemukan' };

  const duplicateSlug = `${source.slug}-copy-${Date.now().toString().slice(-5)}`;
  const { data, error: insertError } = await supabase
    .from('services')
    .insert({
      title: `${source.title} Copy`,
      slug: duplicateSlug,
      excerpt: source.excerpt,
      content: source.content,
      icon: source.icon,
      cover_image_url: source.cover_image_url,
      sort_order: source.sort_order,
      is_featured: false,
      status: 'draft',
    })
    .select()
    .single();

  if (insertError || !data) {
    return { error: friendlyDbError(insertError?.message ?? 'Gagal menduplikasi layanan') };
  }

  await createAuditLog({
    profile,
    action: 'duplicate',
    entityType: 'service',
    entityId: data.id,
    metadata: { source_service_id: serviceId },
  });

  revalidatePath('/dashboard/services');
  revalidatePath('/services');
  return { data, success: 'Layanan berhasil diduplikasi' };
}
