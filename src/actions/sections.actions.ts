'use server';

import { revalidatePath } from 'next/cache';
import { createServerSupabase } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/auth/helpers';

export async function createSection(pageId: string, sectionType: string) {
  const supabase = await createServerSupabase();
  const profile = await getCurrentProfile();

  if (!profile) {
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
    return { error: error.message };
  }

  revalidatePath(`/dashboard/pages/builder?id=${pageId}`);
  return { data, success: 'Section berhasil ditambahkan' };
}

export async function updateSection(sectionId: string, data: Record<string, unknown>) {
  const supabase = await createServerSupabase();

  const { error } = await supabase
    .from('page_sections')
    .update(data)
    .eq('id', sectionId);

  if (error) {
    return { error: error.message };
  }

  return { success: 'Section berhasil diperbarui' };
}

export async function reorderSections(items: { id: string; sort_order: number }[]) {
  const supabase = await createServerSupabase();

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

  return { success: 'Urutan berhasil diperbarui' };
}

export async function deleteSection(sectionId: string, pageId: string) {
  const supabase = await createServerSupabase();

  const { error } = await supabase
    .from('page_sections')
    .delete()
    .eq('id', sectionId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/dashboard/pages/builder?id=${pageId}`);
  return { success: 'Section berhasil dihapus' };
}

export async function toggleSectionVisibility(sectionId: string, isVisible: boolean) {
  const supabase = await createServerSupabase();

  const { error } = await supabase
    .from('page_sections')
    .update({ is_visible: isVisible })
    .eq('id', sectionId);

  if (error) {
    return { error: error.message };
  }

  return { success: 'Visibilitas berhasil diperbarui' };
}
