'use server';

import { revalidatePath } from 'next/cache';
import { createServerSupabase } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/auth/helpers';

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

  if (!profile) {
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

  const slideData: HeroSlideData = {
    eyebrow: (formData.get('eyebrow') as string) || undefined,
    title: (formData.get('title') as string) || '',
    description: (formData.get('description') as string) || '',
    image: (formData.get('image') as string) || '',
    alt: (formData.get('alt') as string) || (formData.get('title') as string) || '',
    cta_label: (formData.get('cta_label') as string) || undefined,
    cta_href: (formData.get('cta_href') as string) || undefined,
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
    return { error: error.message };
  }

  revalidatePath('/');
  return { data, success: 'Slide berhasil ditambahkan' };
}

export async function updateHeroSlide(slideId: string, formData: FormData) {
  const supabase = await createServerSupabase();
  const profile = await getCurrentProfile();

  if (!profile) {
    return { error: 'Unauthorized' };
  }

  const slideData: HeroSlideData = {
    eyebrow: (formData.get('eyebrow') as string) || undefined,
    title: (formData.get('title') as string) || '',
    description: (formData.get('description') as string) || '',
    image: (formData.get('image') as string) || '',
    alt: (formData.get('alt') as string) || (formData.get('title') as string) || '',
    cta_label: (formData.get('cta_label') as string) || undefined,
    cta_href: (formData.get('cta_href') as string) || undefined,
  };

  const isVisible = formData.get('is_visible') === 'true';

  const { error } = await supabase
    .from('homepage_sections')
    .update({ settings: slideData, is_visible: isVisible })
    .eq('id', slideId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/');
  return { success: 'Slide berhasil diperbarui' };
}

export async function deleteHeroSlide(slideId: string) {
  const supabase = await createServerSupabase();
  const profile = await getCurrentProfile();

  if (!profile) {
    return { error: 'Unauthorized' };
  }

  const { error } = await supabase
    .from('homepage_sections')
    .delete()
    .eq('id', slideId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/');
  return { success: 'Slide berhasil dihapus' };
}

export async function toggleHeroSlideVisibility(slideId: string, isVisible: boolean) {
  const supabase = await createServerSupabase();

  const { error } = await supabase
    .from('homepage_sections')
    .update({ is_visible: isVisible })
    .eq('id', slideId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/');
  return { success: 'Visibilitas berhasil diperbarui' };
}

export async function reorderHeroSlides(items: { id: string; sort_order: number }[]) {
  const supabase = await createServerSupabase();

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

  revalidatePath('/');
  return { success: 'Urutan berhasil diperbarui' };
}
