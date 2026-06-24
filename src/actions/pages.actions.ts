'use server';

import { revalidatePath } from 'next/cache';
import { createServerSupabase } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/auth/helpers';
import { pageSchema } from '@/lib/validations/content';
import { slugify } from '@/lib/utils';
import { createAuditLog } from '@/lib/audit';
import { friendlyDbError, normalizeDbText } from '@/lib/cms';
import { hasDashboardModuleActionAccess } from '@/lib/permissions';

export async function createPage(formData: FormData) {
  const supabase = await createServerSupabase();
  const profile = await getCurrentProfile();

  if (!profile || !hasDashboardModuleActionAccess(profile, 'pages', 'create')) {
    return { error: 'Unauthorized' };
  }

  const title = formData.get('title') as string;
  const slug = slugify(title);

  const { data, error } = await supabase
    .from('pages')
    .insert({
      title,
      slug,
      description: formData.get('description') as string | null,
      status: 'draft',
      created_by: profile.id,
      updated_by: profile.id,
    })
    .select()
    .single();

  if (error) {
    return { error: friendlyDbError(error.message) };
  }

  await createAuditLog({
    profile,
    action: 'create',
    entityType: 'page',
    entityId: data.id,
    after: data,
  });

  revalidatePath('/dashboard/pages');
  if (data.page_key === 'home' || data.slug === 'home') {
    revalidatePath('/');
  }
  return { data, success: 'Halaman berhasil dibuat' };
}

export async function updatePage(pageId: string, formData: FormData) {
  const supabase = await createServerSupabase();
  const profile = await getCurrentProfile();

  if (!profile || !hasDashboardModuleActionAccess(profile, 'pages', 'edit')) {
    return { error: 'Unauthorized' };
  }

  const parsed = pageSchema.safeParse({
    title: normalizeDbText(formData.get('title')),
    slug: normalizeDbText(formData.get('slug')),
    description: normalizeDbText(formData.get('description')),
    status: formData.get('status'),
    seo_title: normalizeDbText(formData.get('seo_title')),
    seo_description: normalizeDbText(formData.get('seo_description')),
    og_image_url: normalizeDbText(formData.get('og_image_url')),
    is_indexed: formData.get('is_indexed') === 'true',
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Data tidak valid' };
  }

  const updateData: Record<string, unknown> = {
    ...parsed.data,
    updated_by: profile.id,
    published_at: parsed.data.status === 'published' ? new Date().toISOString() : undefined,
  };

  if (!profile || !hasDashboardModuleActionAccess(profile, 'pages', 'delete')) {
    return { error: 'Unauthorized' };
  }

  const { data: before } = await supabase
    .from('pages')
    .select('*')
    .eq('id', pageId)
    .single();

  const { error } = await supabase
    .from('pages')
    .update(updateData)
    .eq('id', pageId);

  if (error) {
    return { error: friendlyDbError(error.message) };
  }

  await createAuditLog({
    profile,
    action: 'update',
    entityType: 'page',
    entityId: pageId,
    before,
    after: updateData as Record<string, unknown>,
  });

  revalidatePath('/dashboard/pages');
  revalidatePath(`/dashboard/pages/builder?id=${pageId}`);
  revalidatePath(`/${formData.get('slug') as string}`);
  if (before?.page_key === 'home' || before?.slug === 'home' || parsed.data.slug === 'home') {
    revalidatePath('/');
  }
  return { success: 'Halaman berhasil diperbarui' };
}

export async function deletePage(pageId: string) {
  const supabase = await createServerSupabase();
  const profile = await getCurrentProfile();

  const { data: before } = await supabase
    .from('pages')
    .select('*')
    .eq('id', pageId)
    .single();

  const { error } = await supabase
    .from('pages')
    .delete()
    .eq('id', pageId);

  if (error) {
    return { error: friendlyDbError(error.message) };
  }

  await createAuditLog({
    profile,
    action: 'delete',
    entityType: 'page',
    entityId: pageId,
    before,
  });

  revalidatePath('/dashboard/pages');
  if (before?.page_key === 'home' || before?.slug === 'home') {
    revalidatePath('/');
  }
  return { success: 'Halaman berhasil dihapus' };
}

export async function publishPage(pageId: string) {
  const supabase = await createServerSupabase();
  const profile = await getCurrentProfile();

  if (!profile || !hasDashboardModuleActionAccess(profile, 'pages', 'publish')) {
    return { error: 'Unauthorized' };
  }

  const { error } = await supabase
    .from('pages')
    .update({
      status: 'published',
      published_at: new Date().toISOString(),
      updated_by: profile.id,
    })
    .eq('id', pageId);

  if (error) {
    return { error: friendlyDbError(error.message) };
  }

  await createAuditLog({
    profile,
    action: 'publish',
    entityType: 'page',
    entityId: pageId,
    after: { status: 'published' },
  });

  revalidatePath('/dashboard/pages');
  revalidatePath('/', 'layout');
  const { data: page } = await supabase.from('pages').select('slug, page_key').eq('id', pageId).maybeSingle();
  if (page?.slug) {
    revalidatePath(`/${page.slug}`);
  }
  if (page?.page_key === 'home' || page?.slug === 'home') {
    revalidatePath('/');
  }
  return { success: 'Halaman berhasil dipublikasikan' };
}

export async function setPageStatus(pageId: string, status: 'draft' | 'published' | 'archived') {
  const supabase = await createServerSupabase();
  const profile = await getCurrentProfile();

  if (!profile || !hasDashboardModuleActionAccess(profile, 'pages', 'publish')) {
    return { error: 'Unauthorized' };
  }

  const payload = {
    status,
    updated_by: profile.id,
    published_at: status === 'published' ? new Date().toISOString() : null,
  };

  const { data: page } = await supabase.from('pages').select('slug, page_key').eq('id', pageId).maybeSingle();
  const { error } = await supabase.from('pages').update(payload).eq('id', pageId);

  if (error) {
    return { error: friendlyDbError(error.message) };
  }

  await createAuditLog({
    profile,
    action: 'set_status',
    entityType: 'page',
    entityId: pageId,
    after: payload,
  });

  revalidatePath('/dashboard/pages');
  if (page?.slug) {
    revalidatePath(`/${page.slug}`);
  }
  if (page?.page_key === 'home' || page?.slug === 'home') {
    revalidatePath('/');
  }
  return { success: 'Status halaman berhasil diperbarui' };
}

export async function duplicatePage(pageId: string) {
  const supabase = await createServerSupabase();
  const profile = await getCurrentProfile();

  if (!profile || !hasDashboardModuleActionAccess(profile, 'pages', 'create')) {
    return { error: 'Unauthorized' };
  }

  const [{ data: page, error: pageError }, { data: sections, error: sectionsError }] = await Promise.all([
    supabase.from('pages').select('*').eq('id', pageId).single(),
    supabase.from('page_sections').select('*').eq('page_id', pageId).order('sort_order'),
  ]);

  if (pageError || !page) {
    return { error: 'Halaman tidak ditemukan' };
  }

  if (sectionsError) {
    return { error: friendlyDbError(sectionsError.message) };
  }

  const duplicateSlug = `${page.slug}-copy-${Date.now().toString().slice(-5)}`;
  const { data: newPage, error: insertPageError } = await supabase
    .from('pages')
    .insert({
      title: `${page.title} Copy`,
      slug: duplicateSlug,
      description: page.description,
      status: 'draft',
      seo_title: page.seo_title,
      seo_description: page.seo_description,
      og_image_url: page.og_image_url,
      is_indexed: page.is_indexed,
      created_by: profile.id,
      updated_by: profile.id,
    })
    .select()
    .single();

  if (insertPageError || !newPage) {
    return { error: friendlyDbError(insertPageError?.message ?? 'Gagal menduplikasi halaman') };
  }

  if ((sections?.length ?? 0) > 0) {
    const duplicatedSections = sections!.map((section) => ({
      page_id: newPage.id,
      section_type: section.section_type,
      internal_name: section.internal_name,
      content: section.content,
      settings: section.settings,
      sort_order: section.sort_order,
      is_visible: section.is_visible,
    }));

    const { error: insertSectionsError } = await supabase.from('page_sections').insert(duplicatedSections);
    if (insertSectionsError) {
      return { error: friendlyDbError(insertSectionsError.message) };
    }
  }

  await createAuditLog({
    profile,
    action: 'duplicate',
    entityType: 'page',
    entityId: newPage.id,
    metadata: { source_page_id: pageId },
  });

  revalidatePath('/dashboard/pages');
  return { data: newPage, success: 'Halaman berhasil diduplikasi' };
}
