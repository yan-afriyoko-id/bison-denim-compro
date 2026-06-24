import { createAdminClient } from '@/lib/supabase/admin';
import type { HeroSlideData } from '@/actions/homepage.actions';

const HERO_SECTION_KEY = 'hero_slider';

export interface HeroSlideRecord extends HeroSlideData {
  id: string;
  sort_order: number;
  is_visible: boolean;
}

export async function fetchHeroSlides() {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('homepage_sections')
    .select('id, settings, sort_order, is_visible')
    .eq('section_key', HERO_SECTION_KEY)
    .order('sort_order', { ascending: true });

  if (error) {
    return { slides: [] as HeroSlideRecord[], error: error.message };
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
