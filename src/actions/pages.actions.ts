'use server';

import { revalidatePath } from 'next/cache';
import { createServerSupabase } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/auth/helpers';
import { pageSchema } from '@/lib/validations/content';
import { slugify } from '@/lib/utils';
import { createAuditLog } from '@/lib/audit';
import { friendlyDbError, normalizeDbText } from '@/lib/cms';
import { hasDashboardModuleActionAccess } from '@/lib/permissions';
import { buildChildPagePath, buildDefaultPagePath, findPageNavigationItem, resolvePagePublicPath } from '@/lib/page-public-path';
import type { NavigationItem } from '@/types';

async function syncPageNavigationVisibility(
  supabase: Awaited<ReturnType<typeof createServerSupabase>>,
  page: { id: string; slug: string; title: string; page_key?: string | null; status: 'draft' | 'published' | 'archived' }
) {
  const { data: navItems } = await supabase
    .from('navigation_items')
    .select('*')
    .eq('location', 'header')
    .order('sort_order', { ascending: true });

  const existing = findPageNavigationItem(page, (navItems ?? []) as NavigationItem[]);
  if (!existing) {
    return;
  }

  const nextVisible = page.status === 'published';
  if (existing.is_visible === nextVisible) {
    return;
  }

  await supabase
    .from('navigation_items')
    .update({ is_visible: nextVisible })
    .eq('id', existing.id);
}

async function revalidatePagePaths(
  supabase: Awaited<ReturnType<typeof createServerSupabase>>,
  pageId: string,
  extraPaths: string[] = []
) {
  const [{ data: page }, { data: navItems }] = await Promise.all([
    supabase.from('pages').select('slug, page_key, title').eq('id', pageId).maybeSingle(),
    supabase.from('navigation_items').select('*').eq('location', 'header'),
  ]);

  if (!page) {
    return;
  }

  const paths = new Set<string>(extraPaths.filter(Boolean));
  paths.add(buildDefaultPagePath(page));
  paths.add(resolvePagePublicPath(page, (navItems ?? []) as NavigationItem[]));

  for (const path of paths) {
    revalidatePath(path);

    if (path.startsWith('/services/')) {
      revalidatePath('/services');
    }
  }

  if (page.page_key === 'home' || page.slug === 'home') {
    revalidatePath('/');
  }
}

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

  await syncPageNavigationVisibility(supabase, {
    id: pageId,
    slug: parsed.data.slug,
    title: parsed.data.title,
    page_key: before?.page_key ?? null,
    status: parsed.data.status,
  });

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
  await revalidatePagePaths(supabase, pageId, [
    before?.slug ? `/${before.slug}` : '',
    parsed.data.slug ? `/${parsed.data.slug}` : '',
  ]);
  return { success: 'Halaman berhasil diperbarui' };
}

export async function deletePage(pageId: string) {
  const supabase = await createServerSupabase();
  const profile = await getCurrentProfile();

  const [{ data: before }, { data: navItems }] = await Promise.all([
    supabase.from('pages').select('*').eq('id', pageId).single(),
    supabase.from('navigation_items').select('*').eq('location', 'header'),
  ]);

  if (before) {
    const navItem = findPageNavigationItem(before, (navItems ?? []) as NavigationItem[]);
    if (navItem) {
      await supabase.from('navigation_items').delete().eq('id', navItem.id);
    }
  }

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
  if (before?.slug) {
    revalidatePath(`/${before.slug}`);
    if (`/${before.slug}`.startsWith('/services/')) {
      revalidatePath('/services');
    }
  }
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
  await revalidatePagePaths(supabase, pageId);
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

  const { error } = await supabase.from('pages').update(payload).eq('id', pageId);

  if (error) {
    return { error: friendlyDbError(error.message) };
  }

  const { data: page } = await supabase.from('pages').select('id, slug, title, page_key, status').eq('id', pageId).single();
  if (page) {
    await syncPageNavigationVisibility(supabase, page);
  }

  await createAuditLog({
    profile,
    action: 'set_status',
    entityType: 'page',
    entityId: pageId,
    after: payload,
  });

  revalidatePath('/dashboard/pages');
  await revalidatePagePaths(supabase, pageId);
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
    const duplicatedSections = sections.map((section) => ({
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

export async function getHeaderNavItems() {
  const supabase = await createServerSupabase();
  const { data } = await supabase.from('navigation_items').select('*').eq('location', 'header').order('sort_order', { ascending: true });
  return (data ?? []) as NavigationItem[];
}

export async function getPageNavigationInfo(pageId: string) {
  const supabase = await createServerSupabase();
  const { data: page } = await supabase.from('pages').select('slug, title, page_key').eq('id', pageId).single();
  if (!page) return { navItem: null, navItems: [], publicHref: '' };

  const { data: navItems } = await supabase
    .from('navigation_items')
    .select('*')
    .eq('location', 'header')
    .order('sort_order', { ascending: true });

  const resolvedNavItems = (navItems ?? []) as NavigationItem[];
  const navItem = findPageNavigationItem(page, resolvedNavItems) ?? null;

  return {
    navItem,
    navItems: resolvedNavItems,
    publicHref: resolvePagePublicPath(page, resolvedNavItems),
  };
}

export async function upsertPageNavigation(
  pageId: string,
  navMode: 'none' | 'navbar' | 'child_navbar',
  parentId?: string | null
) {
  const supabase = await createServerSupabase();
  const profile = await getCurrentProfile();

  if (!profile || !hasDashboardModuleActionAccess(profile, 'navigation', 'manage')) {
    return { error: 'Unauthorized' };
  }

  const { data: page } = await supabase.from('pages').select('slug, title, status, page_key').eq('id', pageId).single();
  if (!page) return { error: 'Page not found' };

  const { data: navItems } = await supabase
    .from('navigation_items')
    .select('*')
    .eq('location', 'header')
    .order('sort_order', { ascending: true });

  const existingItems = (navItems ?? []) as NavigationItem[];
  const existing = findPageNavigationItem(page, existingItems) ?? null;

  if (navMode === 'none') {
    if (existing) {
      const { data: before } = await supabase.from('navigation_items').select('*').eq('id', existing.id).single();
      const { error } = await supabase.from('navigation_items').delete().eq('id', existing.id);
      if (error) return { error: friendlyDbError(error.message) };
      await createAuditLog({ profile, action: 'delete', entityType: 'navigation_item', entityId: existing.id, before });
    }
    revalidatePath('/dashboard/pages');
    revalidatePath('/', 'layout');
    await revalidatePagePaths(supabase, pageId);
    return { success: 'Removed from navigation' };
  }

  const href =
    navMode === 'child_navbar' && parentId
      ? buildChildPagePath(existingItems.find((item) => item.id === parentId)?.href ?? '/', page.slug)
      : buildDefaultPagePath(page);

  const payload = {
    location: 'header' as const,
    label: page.title,
    href,
    parent_id: navMode === 'child_navbar' ? (parentId || null) : null,
    sort_order: 0,
    is_visible: page.status === 'published',
    open_new_tab: false,
  };

  if (existing) {
    const { error } = await supabase.from('navigation_items').update(payload).eq('id', existing.id);
    if (error) return { error: friendlyDbError(error.message) };
  } else {
    const { data: created, error } = await supabase.from('navigation_items').insert(payload).select('*').single();
    if (error) return { error: friendlyDbError(error.message) };
    await createAuditLog({
      profile,
      action: 'create',
      entityType: 'navigation_item',
      entityId: created.id,
      after: created,
    });
  }

  revalidatePath('/dashboard/pages');
  revalidatePath('/', 'layout');
  await revalidatePagePaths(supabase, pageId);
  return { success: 'Navigation updated' };
}
