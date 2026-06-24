import { createServerSupabase } from '@/lib/supabase/server';
import type { UserRole, Profile } from '@/types';

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
  if (!profile || !profile.is_active) return false;

  const hierarchy: Record<UserRole, number> = {
    super_admin: 4,
    admin: 3,
    editor: 2,
    viewer: 1,
  };

  return hierarchy[profile.role] >= hierarchy[requiredRole];
}
