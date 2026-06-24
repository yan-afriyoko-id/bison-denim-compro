'use server';

import { revalidatePath } from 'next/cache';
import { createServerSupabase } from '@/lib/supabase/server';
import { getCurrentProfile, getCurrentUser } from '@/lib/auth/helpers';
import { createAuditLog } from '@/lib/audit';
import { friendlyDbError, normalizeDbText } from '@/lib/cms';
import { hasDashboardModuleActionAccess } from '@/lib/permissions';

const MEDIA_BUCKET = 'media';
const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8MB

export async function uploadMediaFile(file: File) {
  const supabase = await createServerSupabase();
  const user = await getCurrentUser();
  const profile = await getCurrentProfile();

  if (!user || !hasDashboardModuleActionAccess(profile, 'media', 'manage')) {
    return { error: 'Unauthorized' };
  }

  if (!file.type.startsWith('image/')) {
    return { error: 'Hanya file gambar yang didukung' };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { error: 'Ukuran file maksimal 8MB' };
  }

  const timestamp = Date.now();
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storagePath = `uploads/${user.id}/${timestamp}_${sanitizedName}`;

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from(MEDIA_BUCKET)
    .upload(storagePath, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type,
    });

  if (uploadError) {
    return { error: uploadError.message };
  }

  // Insert record into media table
  const { data, error } = await supabase
    .from('media')
    .insert({
      bucket: MEDIA_BUCKET,
      path: uploadData.path,
      filename: file.name,
      mime_type: file.type,
      size_bytes: file.size,
      uploaded_by: user.id,
    })
    .select()
    .single();

  if (error) {
    // Cleanup uploaded file if DB insert fails
    await supabase.storage.from(MEDIA_BUCKET).remove([uploadData.path]);
    return { error: friendlyDbError(error.message) };
  }

  const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${MEDIA_BUCKET}/${uploadData.path}`;

  revalidatePath('/dashboard/media');
  return { data, url: publicUrl };
}

export async function deleteMediaItem(id: string, path: string) {
  const supabase = await createServerSupabase();
  const user = await getCurrentUser();
  const profile = await getCurrentProfile();

  if (!user || !hasDashboardModuleActionAccess(profile, 'media', 'manage')) {
    return { error: 'Unauthorized' };
  }

  // Delete from storage
  const { error: storageError } = await supabase.storage
    .from(MEDIA_BUCKET)
    .remove([path]);

  if (storageError) {
    return { error: friendlyDbError(storageError.message) };
  }

  // Delete record from media table
  const { error } = await supabase
    .from('media')
    .delete()
    .eq('id', id);

  if (error) {
    return { error: friendlyDbError(error.message) };
  }

  await createAuditLog({
    profile: { id: user.id } as { id: string },
    action: 'delete',
    entityType: 'media',
    entityId: id,
    metadata: { path },
  });

  revalidatePath('/dashboard/media');
  return { success: true };
}

export async function updateMediaAltText(id: string, altText: string) {
  const supabase = await createServerSupabase();
  const user = await getCurrentUser();
  const profile = await getCurrentProfile();

  if (!user || !hasDashboardModuleActionAccess(profile, 'media', 'manage')) {
    return { error: 'Unauthorized' };
  }

  const payload = {
    alt_text: normalizeDbText(altText),
  };

  const { error } = await supabase.from('media').update(payload).eq('id', id);
  if (error) {
    return { error: friendlyDbError(error.message) };
  }

  await createAuditLog({
    profile: { id: user.id } as { id: string },
    action: 'update',
    entityType: 'media',
    entityId: id,
    after: payload,
  });

  revalidatePath('/dashboard/media');
  return { success: true };
}
