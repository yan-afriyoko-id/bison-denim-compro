import { redirect } from 'next/navigation';
import { requireDashboardModuleAccess } from '@/lib/auth/helpers';
import { findPageIdForLegacyService, syncLegacyServicesToPages } from '@/lib/service-pages';

export default async function ServiceDetailRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireDashboardModuleAccess('pages');
  await syncLegacyServicesToPages();

  const { id } = await params;
  const pageId = await findPageIdForLegacyService(id);

  redirect(pageId ? `/dashboard/pages/builder?id=${pageId}` : '/dashboard/pages');
}
