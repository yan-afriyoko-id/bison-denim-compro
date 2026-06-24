'use server';

import { revalidatePath } from 'next/cache';
import { createServerSupabase } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/auth/helpers';
import { heroSlideSchema } from '@/lib/validations/content';
import { createAuditLog } from '@/lib/audit';
import { friendlyDbError } from '@/lib/cms';
import { hasDashboardModuleActionAccess } from '@/lib/permissions';

export interface HeroSlideData {
  eyebrow?: string;
  title: string;
  description: string;
  image: string;
  alt: string;
  cta_label?: string;
  cta_href?: string;
}

const HERO_SECTION_KEY = 'hero_slider';

export async function getHeroSlides() {
  const supabase = await createServerSupabase();

  const { data, error } = await supabase
    .from('homepage_sections')
    .select('id, settings, sort_order, is_visible, created_at')
    .eq('section_key', HERO_SECTION_KEY)
    .order('sort_order', { ascending: true });

  if (error) {
    return { slides: [], error: error.message };
  }

  const slides = (data ?? []).map((item) => ({
    id: item.id,
    sort_order: item.sort_order,
    is_visible: item.is_visible,
    created_at: item.created_at,
    ...(item.settings as HeroSlideData),
  }));

  return { slides, error: null };
}

export async function createHeroSlide(formData: FormData) {
  const supabase = await createServerSupabase();
  const profile = await getCurrentProfile();

  if (!profile || !hasDashboardModuleActionAccess(profile, 'hero', 'create')) {
    return { error: 'Unauthorized' };
  }

  // Get max sort_order
  const { data: maxOrder } = await supabase
    .from('homepage_sections')
    .select('sort_order')
    .eq('section_key', HERO_SECTION_KEY)
    .order('sort_order', { ascending: false })
    .limit(1);

  const nextOrder = (maxOrder?.[0]?.sort_order ?? -1) + 1;

  const parsed = heroSlideSchema.safeParse({
    eyebrow: formData.get('eyebrow'),
    title: formData.get('title'),
    description: formData.get('description'),
    image: formData.get('image'),
    alt: formData.get('alt'),
    cta_label: formData.get('cta_label'),
    cta_href: formData.get('cta_href'),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Data slide tidak valid' };
  }

  const slideData: HeroSlideData = {
    eyebrow: parsed.data.eyebrow ?? undefined,
    title: parsed.data.title,
    description: parsed.data.description,
    image: parsed.data.image,
    alt: parsed.data.alt || parsed.data.title,
    cta_label: parsed.data.cta_label ?? undefined,
    cta_href: parsed.data.cta_href ?? undefined,
  };

  const { data, error } = await supabase
    .from('homepage_sections')
    .insert({
      section_key: HERO_SECTION_KEY,
      component_type: 'hero',
      sort_order: nextOrder,
      is_visible: true,
      settings: slideData,
    })
    .select()
    .single();

  if (error) {
    return { error: friendlyDbError(error.message) };
  }

  await createAuditLog({
    profile,
    action: 'create',
    entityType: 'hero_slide',
    entityId: data.id,
    after: { ...slideData, sort_order: nextOrder, is_visible: true },
  });

  revalidatePath('/');
  revalidatePath('/dashboard/hero');
  return { data, success: 'Slide berhasil ditambahkan' };
}

export async function updateHeroSlide(slideId: string, formData: FormData) {
  const supabase = await createServerSupabase();
  const profile = await getCurrentProfile();

  if (!profile || !hasDashboardModuleActionAccess(profile, 'hero', 'edit')) {
    return { error: 'Unauthorized' };
  }

  const parsed = heroSlideSchema.safeParse({
    eyebrow: formData.get('eyebrow'),
    title: formData.get('title'),
    description: formData.get('description'),
    image: formData.get('image'),
    alt: formData.get('alt'),
    cta_label: formData.get('cta_label'),
    cta_href: formData.get('cta_href'),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Data slide tidak valid' };
  }

  const slideData: HeroSlideData = {
    eyebrow: parsed.data.eyebrow ?? undefined,
    title: parsed.data.title,
    description: parsed.data.description,
    image: parsed.data.image,
    alt: parsed.data.alt || parsed.data.title,
    cta_label: parsed.data.cta_label ?? undefined,
    cta_href: parsed.data.cta_href ?? undefined,
  };

  const isVisible = formData.get('is_visible') === 'true';

  const { data: currentSlide } = await supabase
    .from('homepage_sections')
    .select('settings, is_visible')
    .eq('id', slideId)
    .single();

  const { error } = await supabase
    .from('homepage_sections')
    .update({ settings: slideData, is_visible: isVisible })
    .eq('id', slideId);

  if (error) {
    return { error: friendlyDbError(error.message) };
  }

  await createAuditLog({
    profile,
    action: 'update',
    entityType: 'hero_slide',
    entityId: slideId,
    before: currentSlide
      ? {
          ...(currentSlide.settings as Record<string, unknown>),
          is_visible: currentSlide.is_visible,
        }
      : null,
    after: { ...slideData, is_visible: isVisible },
  });

  revalidatePath('/');
  revalidatePath('/dashboard/hero');
  return { success: 'Slide berhasil diperbarui' };
}

export async function deleteHeroSlide(slideId: string) {
  const supabase = await createServerSupabase();
  const profile = await getCurrentProfile();

  if (!profile || !hasDashboardModuleActionAccess(profile, 'hero', 'delete')) {
    return { error: 'Unauthorized' };
  }

  const { data: currentSlide } = await supabase
    .from('homepage_sections')
    .select('settings, is_visible')
    .eq('id', slideId)
    .single();

  const { error } = await supabase
    .from('homepage_sections')
    .delete()
    .eq('id', slideId);

  if (error) {
    return { error: friendlyDbError(error.message) };
  }

  await createAuditLog({
    profile,
    action: 'delete',
    entityType: 'hero_slide',
    entityId: slideId,
    before: currentSlide
      ? {
          ...(currentSlide.settings as Record<string, unknown>),
          is_visible: currentSlide.is_visible,
        }
      : null,
  });

  revalidatePath('/');
  revalidatePath('/dashboard/hero');
  return { success: 'Slide berhasil dihapus' };
}

export async function toggleHeroSlideVisibility(slideId: string, isVisible: boolean) {
  const supabase = await createServerSupabase();
  const profile = await getCurrentProfile();
  if (!profile || !hasDashboardModuleActionAccess(profile, 'hero', 'publish')) {
    return { error: 'Unauthorized' };
  }

  const { data: visibleSlides } = await supabase
    .from('homepage_sections')
    .select('id')
    .eq('section_key', HERO_SECTION_KEY)
    .eq('is_visible', true);

  if (!isVisible && (visibleSlides?.length ?? 0) <= 1) {
    return { error: 'Minimal satu slide harus tetap aktif.' };
  }

  const { error } = await supabase
    .from('homepage_sections')
    .update({ is_visible: isVisible })
    .eq('id', slideId);

  if (error) {
    return { error: friendlyDbError(error.message) };
  }

  await createAuditLog({
    profile,
    action: 'toggle_visibility',
    entityType: 'hero_slide',
    entityId: slideId,
    after: { is_visible: isVisible },
  });

  revalidatePath('/');
  revalidatePath('/dashboard/hero');
  return { success: 'Visibilitas berhasil diperbarui' };
}

export async function reorderHeroSlides(items: { id: string; sort_order: number }[]) {
  const supabase = await createServerSupabase();
  const profile = await getCurrentProfile();
  if (!profile || !hasDashboardModuleActionAccess(profile, 'hero', 'edit')) {
    return { error: 'Unauthorized' };
  }

  const promises = items.map((item) =>
    supabase
      .from('homepage_sections')
      .update({ sort_order: item.sort_order })
      .eq('id', item.id)
  );

  const results = await Promise.all(promises);
  const failed = results.find((r) => r.error);

  if (failed?.error) {
    return { error: failed.error.message };
  }

  await createAuditLog({
    profile,
    action: 'reorder',
    entityType: 'hero_slide',
    metadata: { items },
  });

  revalidatePath('/');
  revalidatePath('/dashboard/hero');
  return { success: 'Urutan berhasil diperbarui' };
}
