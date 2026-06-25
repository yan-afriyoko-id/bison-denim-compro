import { redirect } from 'next/navigation';
import { requireDashboardModuleAccess } from '@/lib/auth/helpers';
import { syncLegacyServicesToPages } from '@/lib/service-pages';

export default async function NewServiceRedirectPage() {
  await requireDashboardModuleAccess('pages');
  await syncLegacyServicesToPages();
  redirect('/dashboard/pages/builder?navMode=child_navbar&parentHref=%2Fservices');
}
