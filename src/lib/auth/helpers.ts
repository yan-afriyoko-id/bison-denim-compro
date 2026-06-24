import { createServerSupabase } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import type { DashboardModuleKey, UserRole, Profile } from '@/types';
import { hasDashboardModuleAccess, hasMinimumRole } from '@/lib/permissions';

export async function getCurrentUser() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return data;
}

export async function checkPermission(requiredRole: UserRole): Promise<boolean> {
  const profile = await getCurrentProfile();
  return hasMinimumRole(profile, requiredRole);
}

export async function requireDashboardModuleAccess(moduleKey: DashboardModuleKey): Promise<Profile> {
  const profile = await getCurrentProfile();

  if (!hasDashboardModuleAccess(profile, moduleKey)) {
    redirect('/dashboard');
  }

  return profile!;
}
