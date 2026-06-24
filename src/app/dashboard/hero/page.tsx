import { requireDashboardModuleAccess } from '@/lib/auth/helpers';
import { HeroSliderManager } from '@/components/dashboard/hero-slider-manager';
import { fetchHeroSlides } from '@/lib/homepage';

export default async function HeroSliderPage() {
  await requireDashboardModuleAccess('hero');
  const result = await fetchHeroSlides();

  return <HeroSliderManager initialSlides={result.slides} />;
}
