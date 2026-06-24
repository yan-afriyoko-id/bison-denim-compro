'use server';

import { revalidatePath } from 'next/cache';
import { createServerSupabase } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/auth/helpers';
import { hasDashboardModuleActionAccess, hasMinimumRole } from '@/lib/permissions';
import { createAuditLog } from '@/lib/audit';
import { friendlyDbError, normalizeDbText } from '@/lib/cms';
import type { NavLocation } from '@/types';

type NavigationPayload = {
  location: NavLocation;
  label: string;
  href: string;
  parent_id: string | null;
  sort_order: number;
  is_visible: boolean;
  open_new_tab: boolean;
};

function normalizePayload(input: NavigationPayload) {
  return {
    location: input.location,
    label: normalizeDbText(input.label) ?? '',
    href: normalizeDbText(input.href) ?? '',
    parent_id: normalizeDbText(input.parent_id) ?? null,
    sort_order: Number.isFinite(input.sort_order) ? input.sort_order : 0,
    is_visible: input.is_visible,
    open_new_tab: input.open_new_tab,
  };
}

function revalidateNavigationPaths() {
  revalidatePath('/dashboard/navigation');
  revalidatePath('/', 'layout');
}

export async function createNavigationItem(input: NavigationPayload) {
  const supabase = await createServerSupabase();
  const profile = await getCurrentProfile();

  if (!hasMinimumRole(profile, 'editor') || !hasDashboardModuleActionAccess(profile, 'navigation', 'manage')) {
    return { error: 'Unauthorized' };
  }

  const payload = normalizePayload(input);
  const { data, error } = await supabase.from('navigation_items').insert(payload).select('*').single();

  if (error) {
    return { error: friendlyDbError(error.message) };
  }

  await createAuditLog({
    profile,
    action: 'create',
    entityType: 'navigation_item',
    entityId: data.id,
    after: data,
  });

  revalidateNavigationPaths();
  return { data, success: 'Item navigasi berhasil dibuat' };
}

export async function updateNavigationItem(itemId: string, input: NavigationPayload) {
  const supabase = await createServerSupabase();
  const profile = await getCurrentProfile();

  if (!hasMinimumRole(profile, 'editor') || !hasDashboardModuleActionAccess(profile, 'navigation', 'manage')) {
    return { error: 'Unauthorized' };
  }

  const payload = normalizePayload(input);
  const { data: before } = await supabase.from('navigation_items').select('*').eq('id', itemId).single();
  const { error } = await supabase.from('navigation_items').update(payload).eq('id', itemId);

  if (error) {
    return { error: friendlyDbError(error.message) };
  }

  await createAuditLog({
    profile,
    action: 'update',
    entityType: 'navigation_item',
    entityId: itemId,
    before,
    after: payload,
  });

  revalidateNavigationPaths();
  return { success: 'Item navigasi berhasil diperbarui' };
}

export async function deleteNavigationItem(itemId: string) {
  const supabase = await createServerSupabase();
  const profile = await getCurrentProfile();

  if (!hasMinimumRole(profile, 'editor') || !hasDashboardModuleActionAccess(profile, 'navigation', 'manage')) {
    return { error: 'Unauthorized' };
  }

  const { data: before } = await supabase.from('navigation_items').select('*').eq('id', itemId).single();
  const { error } = await supabase.from('navigation_items').delete().eq('id', itemId);

  if (error) {
    return { error: friendlyDbError(error.message) };
  }

  await createAuditLog({
    profile,
    action: 'delete',
    entityType: 'navigation_item',
    entityId: itemId,
    before,
  });

  revalidateNavigationPaths();
  return { success: 'Item navigasi berhasil dihapus' };
}
