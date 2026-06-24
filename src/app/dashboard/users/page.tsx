import { createServerSupabase } from '@/lib/supabase/server';
import { UsersManager } from '@/components/dashboard/users-manager';
import { requireDashboardModuleAccess } from '@/lib/auth/helpers';

export default async function UsersPage() {
  const currentProfile = await requireDashboardModuleAccess('users');

  const supabase = await createServerSupabase();
  const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: true });
  return <UsersManager initialUsers={data ?? []} currentProfile={currentProfile!} />;
}
