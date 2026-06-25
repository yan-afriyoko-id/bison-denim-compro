import { redirect } from 'next/navigation';
import { requireDashboardModuleAccess } from '@/lib/auth/helpers';
import { findPageIdForLegacyService, syncLegacyServicesToPages } from '@/lib/service-pages';

export default async function ServicePreviewRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireDashboardModuleAccess('pages');
  await syncLegacyServicesToPages();

  const { id } = await params;
  const pageId = await findPageIdForLegacyService(id);

  redirect(pageId ? `/preview/pages?id=${pageId}` : '/dashboard/pages');
}
