import { createServerSupabase } from '@/lib/supabase/server';
import { SettingsForm } from '@/components/dashboard/settings-form';
import { groupSiteSettings } from '@/lib/cms';
import { requireDashboardModuleAccess } from '@/lib/auth/helpers';

export default async function SettingsPage() {
  await requireDashboardModuleAccess('settings');
  const supabase = await createServerSupabase();
  const { data } = await supabase.from('site_settings').select('*').order('key', { ascending: true });
  const settings = data ?? [];
  const visibility = settings.reduce<Record<string, boolean>>((acc, item) => {
    acc[item.key] = item.is_public;
    return acc;
  }, {});

  return <SettingsForm initialSettings={groupSiteSettings(settings)} initialVisibility={visibility} />;
}
