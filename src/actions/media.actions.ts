'use server';

import { revalidatePath } from 'next/cache';
import { createServerSupabase } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/auth/helpers';

const MEDIA_BUCKET = 'media';
const MAX_BYTES = 8 * 1024 * 1024; // 8 MB per file

function extFromMime(mime: string): string {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'image/svg+xml': 'svg',
    'image/avif': 'avif',
  };
  return map[mime] ?? 'bin';
}

export async function uploadMediaFile(file: File) {
  const supabase = await createServerSupabase();
  const profile = await getCurrentProfile();

  if (!profile) {
    return { error: 'Unauthorized' };
  }

  if (file.size > MAX_BYTES) {
    return { error: 'Ukuran file melebihi 8MB' };
  }

  const ext = extFromMime(file.type);
  const safeName = (file.name || 'file')
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/\.([a-z0-9]+)$/i, '');

  const path = `${profile.id}/${Date.now()}-${safeName}.${ext}`;

  const { error: upErr } = await supabase.storage
    .from(MEDIA_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });

  if (upErr) {
    return { error: upErr.message };
  }

  const { data: pub } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path);

  const { data: row, error: dbErr } = await supabase
    .from('media')
    .insert({
      bucket: MEDIA_BUCKET,
      path,
      filename: file.name || path,
      mime_type: file.type,
      size_bytes: file.size,
      uploaded_by: profile.id,
    })
    .select('id, path')
    .single();

  if (dbErr) {
    return { error: dbErr.message };
  }

  revalidatePath('/dashboard/media');
  return { url: pub.publicUrl, id: row.id, path: row.path };
}

export async function deleteMediaItem(mediaId: string, path: string) {
  const supabase = await createServerSupabase();
  const profile = await getCurrentProfile();

  if (!profile) {
    return { error: 'Unauthorized' };
  }

  const { error: stErr } = await supabase.storage.from(MEDIA_BUCKET).remove([path]);
  if (stErr) {
    return { error: stErr.message };
  }

  const { error: dbErr } = await supabase.from('media').delete().eq('id', mediaId);
  if (dbErr) {
    return { error: dbErr.message };
  }

  revalidatePath('/dashboard/media');
  return { success: 'Media dihapus' };
}
