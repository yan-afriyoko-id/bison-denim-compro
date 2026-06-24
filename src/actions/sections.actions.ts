'use server';

import { revalidatePath } from 'next/cache';
import { createServerSupabase } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/auth/helpers';
import { createAuditLog } from '@/lib/audit';
import { friendlyDbError } from '@/lib/cms';
import { hasDashboardModuleActionAccess } from '@/lib/permissions';

async function revalidateSectionPage(pageId: string) {
  const supabase = await createServerSupabase();
  const { data: page } = await supabase.from('pages').select('slug, page_key').eq('id', pageId).maybeSingle();

  if (page?.slug) {
    revalidatePath(`/${page.slug}`);
  }
  if (page?.page_key === 'home' || page?.slug === 'home') {
    revalidatePath('/');
  }
}

export async function createSection(pageId: string, sectionType: string) {
  const supabase = await createServerSupabase();
  const profile = await getCurrentProfile();

  if (!profile || !hasDashboardModuleActionAccess(profile, 'pages', 'create')) {
    return { error: 'Unauthorized' };
  }

  // Get max sort_order
  const { data: maxOrder } = await supabase
    .from('page_sections')
    .select('sort_order')
    .eq('page_id', pageId)
    .order('sort_order', { ascending: false })
    .limit(1);

  const nextOrder = (maxOrder?.[0]?.sort_order ?? -1) + 1;

  const { data, error } = await supabase
    .from('page_sections')
    .insert({
      page_id: pageId,
      section_type: sectionType,
      internal_name: sectionType.charAt(0).toUpperCase() + sectionType.slice(1),
      content: {},
      settings: {
        is_visible: true,
        theme_variant: 'default',
        container_width: 'full',
        padding_top: 'normal',
        padding_bottom: 'normal',
      },
      sort_order: nextOrder,
      is_visible: true,
    })
    .select()
    .single();

  if (error) {
    return { error: friendlyDbError(error.message) };
  }

  await createAuditLog({
    profile,
    action: 'create',
    entityType: 'page_section',
    entityId: data.id,
    metadata: { page_id: pageId, section_type: sectionType },
    after: data,
  });

  revalidatePath(`/dashboard/pages/builder?id=${pageId}`);
  await revalidateSectionPage(pageId);
  return { data, success: 'Section berhasil ditambahkan' };
}

export async function updateSection(sectionId: string, data: Record<string, unknown>) {
  const supabase = await createServerSupabase();
  const profile = await getCurrentProfile();
  if (!profile || !hasDashboardModuleActionAccess(profile, 'pages', 'edit')) {
    return { error: 'Unauthorized' };
  }

  const { data: before } = await supabase.from('page_sections').select('*').eq('id', sectionId).single();

  const { error } = await supabase
    .from('page_sections')
    .update(data)
    .eq('id', sectionId);

  if (error) {
    return { error: friendlyDbError(error.message) };
  }

  await createAuditLog({
    profile,
    action: 'update',
    entityType: 'page_section',
    entityId: sectionId,
    before,
    after: data,
  });

  if (before?.page_id) {
    await revalidateSectionPage(before.page_id);
  }

  return { success: 'Section berhasil diperbarui' };
}

export async function reorderSections(items: { id: string; sort_order: number }[]) {
  const supabase = await createServerSupabase();
  const profile = await getCurrentProfile();
  if (!profile || !hasDashboardModuleActionAccess(profile, 'pages', 'edit')) {
    return { error: 'Unauthorized' };
  }
  const { data: sections } = await supabase.from('page_sections').select('id, page_id').in('id', items.map((item) => item.id));

  const promises = items.map((item) =>
    supabase
      .from('page_sections')
      .update({ sort_order: item.sort_order })
      .eq('id', item.id)
  );

  const results = await Promise.all(promises);
  const failed = results.find((r) => r.error);

  if (failed?.error) {
    return { error: String(failed.error) };
  }

  await createAuditLog({
    profile,
    action: 'reorder',
    entityType: 'page_section',
    metadata: { items },
  });

  const pageId = sections?.[0]?.page_id;
  if (pageId) {
    await revalidateSectionPage(pageId);
  }

  return { success: 'Urutan berhasil diperbarui' };
}

export async function deleteSection(sectionId: string, pageId: string) {
  const supabase = await createServerSupabase();
  const profile = await getCurrentProfile();
  if (!profile || !hasDashboardModuleActionAccess(profile, 'pages', 'delete')) {
    return { error: 'Unauthorized' };
  }
  const { data: before } = await supabase.from('page_sections').select('*').eq('id', sectionId).single();

  const { error } = await supabase
    .from('page_sections')
    .delete()
    .eq('id', sectionId);

  if (error) {
    return { error: friendlyDbError(error.message) };
  }

  await createAuditLog({
    profile,
    action: 'delete',
    entityType: 'page_section',
    entityId: sectionId,
    before,
  });

  revalidatePath(`/dashboard/pages/builder?id=${pageId}`);
  await revalidateSectionPage(pageId);
  return { success: 'Section berhasil dihapus' };
}

export async function toggleSectionVisibility(sectionId: string, isVisible: boolean) {
  const supabase = await createServerSupabase();
  const profile = await getCurrentProfile();
  if (!profile || !hasDashboardModuleActionAccess(profile, 'pages', 'publish')) {
    return { error: 'Unauthorized' };
  }
  const { data: before } = await supabase.from('page_sections').select('page_id').eq('id', sectionId).maybeSingle();

  const { error } = await supabase
    .from('page_sections')
    .update({ is_visible: isVisible })
    .eq('id', sectionId);

  if (error) {
    return { error: friendlyDbError(error.message) };
  }

  await createAuditLog({
    profile,
    action: 'toggle_visibility',
    entityType: 'page_section',
    entityId: sectionId,
    after: { is_visible: isVisible },
  });

  if (before?.page_id) {
    await revalidateSectionPage(before.page_id);
  }

  return { success: 'Visibilitas berhasil diperbarui' };
}
