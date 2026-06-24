import { NavigationManager } from '@/components/dashboard/navigation-manager';
import { getDashboardNavigationItems } from '@/lib/public-content';
import { requireDashboardModuleAccess } from '@/lib/auth/helpers';

export default async function NavigationPage() {
  await requireDashboardModuleAccess('navigation');
  const items = await getDashboardNavigationItems('header');

  return <NavigationManager initialItems={items} location="header" />;
}
