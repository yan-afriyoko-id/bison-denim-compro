'use server';

import { revalidatePath } from 'next/cache';
import { createServerSupabase } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/auth/helpers';
import { hasMinimumRole } from '@/lib/permissions';
import { createAuditLog } from '@/lib/audit';
import { friendlyDbError, normalizeDbText } from '@/lib/cms';
import type { LeadStatus } from '@/types';

function assertAdmin(profile: Awaited<ReturnType<typeof getCurrentProfile>>) {
  return hasMinimumRole(profile, 'admin');
}

export async function updateLead(id: string, data: { status?: LeadStatus; assigned_to?: string | null; internal_note?: string | null }) {
  const supabase = await createServerSupabase();
  const profile = await getCurrentProfile();

  if (!assertAdmin(profile)) {
    return { error: 'Unauthorized' };
  }

  const payload = {
    ...(data.status ? { status: data.status } : {}),
    ...(data.assigned_to !== undefined ? { assigned_to: data.assigned_to || null } : {}),
    ...(data.internal_note !== undefined ? { internal_note: normalizeDbText(data.internal_note) } : {}),
  };

  const { data: before } = await supabase.from('contact_submissions').select('*').eq('id', id).single();
  const { error } = await supabase.from('contact_submissions').update(payload).eq('id', id);

  if (error) {
    return { error: friendlyDbError(error.message) };
  }

  await createAuditLog({
    profile,
    action: 'update',
    entityType: 'lead',
    entityId: id,
    before,
    after: payload,
  });

  revalidatePath('/dashboard/leads');
  revalidatePath('/dashboard');
  return { success: 'Lead berhasil diperbarui' };
}

export async function bulkUpdateLeadStatus(ids: string[], status: LeadStatus) {
  const supabase = await createServerSupabase();
  const profile = await getCurrentProfile();

  if (!assertAdmin(profile)) {
    return { error: 'Unauthorized' };
  }

  const { error } = await supabase.from('contact_submissions').update({ status }).in('id', ids);
  if (error) {
    return { error: friendlyDbError(error.message) };
  }

  await createAuditLog({
    profile,
    action: 'bulk_update_status',
    entityType: 'lead',
    metadata: { ids, status },
  });

  revalidatePath('/dashboard/leads');
  revalidatePath('/dashboard');
  return { success: 'Status lead berhasil diperbarui' };
}
