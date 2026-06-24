'use server';

import { revalidatePath } from 'next/cache';
import { createServerSupabase } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/auth/helpers';
import { hasDashboardModuleActionAccess, hasMinimumRole } from '@/lib/permissions';
import { createAuditLog } from '@/lib/audit';
import { friendlyDbError, normalizeDbText } from '@/lib/cms';

export async function updateSetting(
  key: string,
  value: Record<string, unknown> | string,
  isPublic?: boolean
) {
  const supabase = await createServerSupabase();
  const profile = await getCurrentProfile();
  if (!hasMinimumRole(profile, 'admin') || !hasDashboardModuleActionAccess(profile, 'settings', 'manage')) {
    return { error: 'Unauthorized' };
  }

  const payload = {
    key,
    value: typeof value === 'string' ? value : value,
    updated_by: profile!.id,
    ...(isPublic !== undefined ? { is_public: isPublic } : {}),
  };

  const { error } = await supabase.from('site_settings').upsert(payload, { onConflict: 'key' });
  if (error) {
    return { error: friendlyDbError(error.message) };
  }

  await createAuditLog({
    profile,
    action: 'update',
    entityType: 'setting',
    entityId: key,
    after: payload as Record<string, unknown>,
  });

  revalidatePath('/dashboard/settings');
  revalidatePath('/', 'layout');
  return { success: 'Pengaturan berhasil diperbarui' };
}

export async function updateSettingsBatch(input: {
  brand: Record<string, string>;
  company: Record<string, string>;
  contact: Record<string, string>;
  visibility?: Record<string, boolean>;
}) {
  const supabase = await createServerSupabase();
  const profile = await getCurrentProfile();
  if (!hasMinimumRole(profile, 'admin') || !hasDashboardModuleActionAccess(profile, 'settings', 'manage')) {
    return { error: 'Unauthorized' };
  }

  const rows = [
    { key: 'site_name', value: normalizeDbText(input.brand.site_name) ?? '', is_public: input.visibility?.site_name ?? true },
    { key: 'logo', value: normalizeDbText(input.brand.logo) ?? '', is_public: input.visibility?.logo ?? true },
    { key: 'site_description', value: normalizeDbText(input.company.site_description) ?? '', is_public: input.visibility?.site_description ?? true },
    { key: 'footer_description', value: normalizeDbText(input.company.footer_description) ?? '', is_public: input.visibility?.footer_description ?? true },
    { key: 'contact_email', value: normalizeDbText(input.contact.contact_email) ?? '', is_public: input.visibility?.contact_email ?? true },
    { key: 'contact_phone', value: normalizeDbText(input.contact.contact_phone) ?? '', is_public: input.visibility?.contact_phone ?? true },
    { key: 'contact_address', value: normalizeDbText(input.contact.contact_address) ?? '', is_public: input.visibility?.contact_address ?? true },
  ].map((row) => ({
    ...row,
    updated_by: profile!.id,
  }));

  const { error } = await supabase.from('site_settings').upsert(rows, { onConflict: 'key' });
  if (error) {
    return { error: friendlyDbError(error.message) };
  }

  await createAuditLog({
    profile,
    action: 'update_batch',
    entityType: 'setting',
    metadata: { keys: rows.map((row) => row.key) },
  });

  revalidatePath('/dashboard/settings');
  revalidatePath('/', 'layout');
  return { success: 'Pengaturan berhasil disimpan' };
}

export async function updateSettingsSection(input: {
  section: 'brand' | 'company' | 'contact';
  values: Record<string, string>;
  visibility?: Record<string, boolean>;
}) {
  const supabase = await createServerSupabase();
  const profile = await getCurrentProfile();
  if (!hasMinimumRole(profile, 'admin') || !hasDashboardModuleActionAccess(profile, 'settings', 'manage')) {
    return { error: 'Unauthorized' };
  }

  const sectionRows: Record<string, Array<{ key: string; value: Record<string, unknown> | string; is_public: boolean }>> = {
    brand: [
      { key: 'site_name', value: normalizeDbText(input.values.site_name) ?? '', is_public: input.visibility?.site_name ?? true },
      { key: 'logo', value: normalizeDbText(input.values.logo) ?? '', is_public: input.visibility?.logo ?? true },
    ],
    company: [
      { key: 'site_description', value: normalizeDbText(input.values.site_description) ?? '', is_public: input.visibility?.site_description ?? true },
      { key: 'footer_description', value: normalizeDbText(input.values.footer_description) ?? '', is_public: input.visibility?.footer_description ?? true },
    ],
    contact: [
      { key: 'contact_email', value: normalizeDbText(input.values.contact_email) ?? '', is_public: input.visibility?.contact_email ?? true },
      { key: 'contact_phone', value: normalizeDbText(input.values.contact_phone) ?? '', is_public: input.visibility?.contact_phone ?? true },
      { key: 'contact_address', value: normalizeDbText(input.values.contact_address) ?? '', is_public: input.visibility?.contact_address ?? true },
    ],
  };

  const rows = sectionRows[input.section].map((row) => ({
    ...row,
    updated_by: profile!.id,
  }));

  const { error } = await supabase.from('site_settings').upsert(rows, { onConflict: 'key' });
  if (error) {
    return { error: friendlyDbError(error.message) };
  }

  await createAuditLog({
    profile,
    action: 'update_section',
    entityType: 'setting',
    metadata: { section: input.section, keys: rows.map((row) => row.key) },
  });

  revalidatePath('/dashboard/settings');
  revalidatePath('/', 'layout');
  return { success: 'Pengaturan berhasil disimpan' };
}
