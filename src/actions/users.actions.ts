'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentProfile } from '@/lib/auth/helpers';
import {
  canAssignRole,
  hasDashboardModuleActionAccess,
  hasMinimumRole,
  normalizeDashboardPermissions,
} from '@/lib/permissions';
import { createAuditLog } from '@/lib/audit';
import { friendlyDbError, normalizeDbText } from '@/lib/cms';
import type { DashboardPermissionSet, DashboardRole } from '@/types';

type UserMutationInput = {
  full_name?: string | null;
  role?: DashboardRole;
  is_active?: boolean;
  dashboard_permissions?: DashboardPermissionSet;
};

export async function createDashboardUser(data: {
  email: string;
  password: string;
  password_confirmation: string;
  full_name?: string | null;
  role: DashboardRole;
  is_active: boolean;
  dashboard_permissions?: DashboardPermissionSet;
}) {
  const actor = await getCurrentProfile();
  if (!hasMinimumRole(actor, 'super_admin') || !hasDashboardModuleActionAccess(actor, 'users', 'manage')) {
    return { error: 'Unauthorized' };
  }

  if (!actor || !canAssignRole(actor.role, data.role)) {
    return { error: 'Anda hanya dapat membuat user dengan role di bawah akun Anda.' };
  }

  const email = data.email.trim().toLowerCase();
  const password = data.password.trim();
  const fullName = normalizeDbText(data.full_name ?? null);

  if (!email) {
    return { error: 'Email wajib diisi.' };
  }

  if (password.length < 8) {
    return { error: 'Password minimal 8 karakter.' };
  }

  if (password !== data.password_confirmation.trim()) {
    return { error: 'Konfirmasi password tidak sama.' };
  }

  const permissions = normalizeDashboardPermissions(data.role, data.dashboard_permissions);
  const supabase = createAdminClient();

  const { data: createdUser, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName ?? '',
    },
  });

  if (createError || !createdUser.user) {
    return { error: friendlyDbError(createError?.message ?? 'Gagal membuat user baru.') };
  }

  const profilePayload = {
    id: createdUser.user.id,
    full_name: fullName,
    role: data.role,
    is_active: data.is_active,
    dashboard_permissions: permissions,
  };

  const { error: profileError } = await supabase
    .from('profiles')
    .upsert(profilePayload, { onConflict: 'id' });

  if (profileError) {
    await supabase.auth.admin.deleteUser(createdUser.user.id);
    return { error: friendlyDbError(profileError.message) };
  }

  await createAuditLog({
    profile: actor,
    action: 'create',
    entityType: 'user',
    entityId: createdUser.user.id,
    after: {
      email,
      ...profilePayload,
    },
  });

  revalidatePath('/dashboard/users');
  return { success: 'User berhasil dibuat', userId: createdUser.user.id };
}

export async function updateUserProfile(
  userId: string,
  data: UserMutationInput
) {
  const actor = await getCurrentProfile();
  if (!hasMinimumRole(actor, 'admin')) {
    return { error: 'Unauthorized' };
  }

  if (actor?.id === userId && data.role && data.role !== actor.role) {
    return { error: 'Anda tidak dapat mengubah role akun sendiri.' };
  }

  if (actor?.id === userId && data.dashboard_permissions) {
    return { error: 'Anda tidak dapat mengubah permission akun sendiri.' };
  }

  if ((data.role || data.dashboard_permissions) && (!hasMinimumRole(actor, 'super_admin') || !hasDashboardModuleActionAccess(actor, 'users', 'manage'))) {
    return { error: 'Hanya super admin yang dapat mengubah role dan permission user.' };
  }

  if (data.role && !canAssignRole(actor!.role, data.role)) {
    return { error: 'Anda hanya dapat menetapkan role di bawah akun Anda.' };
  }

  const supabase = createAdminClient();
  const { data: before } = await supabase.from('profiles').select('*').eq('id', userId).single();

  if (data.role && before?.role && actor && !canAssignRole(actor.role, before.role)) {
    return { error: 'Anda tidak dapat mengubah user dengan role setara atau lebih tinggi.' };
  }

  const normalizedPermissions =
    data.dashboard_permissions && data.role
      ? normalizeDashboardPermissions(data.role, data.dashboard_permissions)
      : data.dashboard_permissions && before?.role
        ? normalizeDashboardPermissions(before.role as DashboardRole, data.dashboard_permissions)
        : undefined;

  const payload = {
    ...(data.full_name !== undefined ? { full_name: normalizeDbText(data.full_name) } : {}),
    ...(data.role ? { role: data.role } : {}),
    ...(data.is_active !== undefined ? { is_active: data.is_active } : {}),
    ...(normalizedPermissions ? { dashboard_permissions: normalizedPermissions } : {}),
  };

  const { error } = await supabase.from('profiles').update(payload).eq('id', userId);
  if (error) {
    return { error: friendlyDbError(error.message) };
  }

  await createAuditLog({
    profile: actor,
    action: 'update',
    entityType: 'user',
    entityId: userId,
    before,
    after: payload,
  });

  revalidatePath('/dashboard/users');
  return { success: 'Pengguna berhasil diperbarui' };
}

export async function deleteUser(userId: string) {
  const actor = await getCurrentProfile();
  if (!hasMinimumRole(actor, 'super_admin') || !hasDashboardModuleActionAccess(actor, 'users', 'manage')) {
    return { error: 'Unauthorized' };
  }

  if (actor?.id === userId) {
    return { error: 'Anda tidak dapat menghapus akun sendiri.' };
  }

  const supabase = createAdminClient();

  const { data: target, error: fetchError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (fetchError || !target) {
    return { error: 'User tidak ditemukan.' };
  }

  if (target.role === 'super_admin') {
    return { error: 'Tidak dapat menghapus super admin lain.' };
  }

  if (actor && !canAssignRole(actor.role, target.role)) {
    return { error: 'Anda hanya dapat menghapus user dengan role di bawah akun Anda.' };
  }

  const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(userId);
  if (deleteAuthError) {
    return { error: friendlyDbError(deleteAuthError.message) };
  }

  const { error: deleteProfileError } = await supabase.from('profiles').delete().eq('id', userId);
  if (deleteProfileError) {
    return { error: friendlyDbError(deleteProfileError.message) };
  }

  await createAuditLog({
    profile: actor,
    action: 'delete',
    entityType: 'user',
    entityId: userId,
    before: target,
  });

  revalidatePath('/dashboard/users');
  return { success: 'User berhasil dihapus' };
}
