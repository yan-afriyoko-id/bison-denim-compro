import { createServerSupabase } from '@/lib/supabase/server';
import type { NavigationItem, Service } from '@/types';

type ServicePageRow = {
  id: string;
  title: string;
  slug: string;
  status: Service['status'];
  published_at: string | null;
};

function getServiceContent(service: Service) {
  return (service.content ?? {}) as Record<string, unknown>;
}

function getServiceText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function getServiceFeatures(value: unknown) {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
  }

  if (value && typeof value === 'object') {
    return value;
  }

  return getServiceText(value);
}

function buildLegacyServiceSections(service: Service, pageId: string) {
  const content = getServiceContent(service);
  const detailBody = content.text ?? service.excerpt ?? '';
  const features = getServiceFeatures(content.features);
  const ctaLabel = getServiceText(content.cta_label);
  const ctaHref = getServiceText(content.cta_href);

  const sections: Array<{
    page_id: string;
    section_type: 'hero' | 'rich_text' | 'cta';
    internal_name: string;
    content: Record<string, unknown>;
    settings: Record<string, unknown>;
    sort_order: number;
    is_visible: boolean;
  }> = [
    {
      page_id: pageId,
      section_type: 'hero',
      internal_name: 'Hero',
      content: {
        title: service.title,
        description: service.excerpt ?? '',
        image: service.cover_image_url ?? '',
        cta_label: ctaLabel,
        cta_href: ctaHref,
      },
      settings: {},
      sort_order: 0,
      is_visible: true,
    },
    {
      page_id: pageId,
      section_type: 'rich_text',
      internal_name: 'Details',
      content: {
        title: 'About This Product',
        body: detailBody,
      },
      settings: {},
      sort_order: 1,
      is_visible: true,
    },
  ];

  if ((Array.isArray(features) && features.length > 0) || (features && typeof features === 'object') || (typeof features === 'string' && features.length > 0)) {
    sections.push({
      page_id: pageId,
      section_type: 'rich_text',
      internal_name: 'Features',
      content: {
        title: 'Features',
        body: features,
      },
      settings: {},
      sort_order: 2,
      is_visible: true,
    });
  }

  if (ctaLabel || ctaHref) {
    sections.push({
      page_id: pageId,
      section_type: 'cta',
      internal_name: 'CTA',
      content: {
        title: service.title,
        description: service.excerpt ?? '',
        button_label: ctaLabel || 'Contact Us',
        button_href: ctaHref || '/contact-us',
      },
      settings: {},
      sort_order: 3,
      is_visible: true,
    });
  }

  return sections;
}

async function ensureServicesNavigationRoot(navItems: NavigationItem[]) {
  const supabase = await createServerSupabase();
  const existing = navItems.find((item) => item.location === 'header' && item.parent_id === null && item.href === '/services');

  if (existing) {
    return existing;
  }

  const { data } = await supabase
    .from('navigation_items')
    .insert({
      location: 'header',
      label: 'Services',
      href: '/services',
      sort_order: 2,
      is_visible: true,
      open_new_tab: false,
      locale: 'id',
    })
    .select('*')
    .single();

  return data as NavigationItem;
}

export async function syncLegacyServicesToPages() {
  const supabase = await createServerSupabase();
  const [{ data: services }, { data: pages }, { data: navItems }] = await Promise.all([
    supabase.from('services').select('*').order('sort_order', { ascending: true }),
    supabase.from('pages').select('id, title, slug, status, published_at'),
    supabase.from('navigation_items').select('*').eq('location', 'header'),
  ]);

  const legacyServices = (services ?? []) as Service[];
  if (legacyServices.length === 0) {
    return { createdPages: 0, syncedItems: 0 };
  }

  const pageBySlug = new Map<string, ServicePageRow>(
    ((pages ?? []) as ServicePageRow[]).map((page) => [page.slug, page])
  );
  const headerItems = (navItems ?? []) as NavigationItem[];
  const servicesRoot = await ensureServicesNavigationRoot(headerItems);
  const nextNavItems = [...headerItems, ...(headerItems.some((item) => item.id === servicesRoot.id) ? [] : [servicesRoot])];

  let createdPages = 0;
  let syncedItems = 0;

  for (const service of legacyServices) {
    let page: ServicePageRow | undefined = pageBySlug.get(service.slug);

    if (!page) {
      const { data: createdPage, error: pageError } = await supabase
        .from('pages')
        .insert({
          title: service.title,
          slug: service.slug,
          description: service.excerpt,
          status: service.status,
          seo_title: service.title,
          seo_description: service.excerpt,
          is_indexed: true,
          locale: 'id',
          published_at: service.status === 'published' ? (service.published_at ?? new Date().toISOString()) : null,
        })
        .select('id, title, slug, status, published_at')
        .single();

      if (pageError || !createdPage) {
        continue;
      }

      const { error: sectionsError } = await supabase
        .from('page_sections')
        .insert(buildLegacyServiceSections(service, createdPage.id));

      if (sectionsError) {
        await supabase.from('pages').delete().eq('id', createdPage.id);
        continue;
      }

      page = createdPage as ServicePageRow;
      pageBySlug.set(service.slug, page);
      createdPages += 1;
    }

    if (!page) {
      continue;
    }

    const href = `/services/${service.slug}`;
    const existingNavItem =
      nextNavItems.find((item) => item.parent_id === servicesRoot.id && item.href === href) ??
      nextNavItems.find((item) => item.href === href);

    if (!existingNavItem) {
      const { data: createdNavItem } = await supabase
        .from('navigation_items')
        .insert({
          location: 'header',
          label: page.title,
          href,
          parent_id: servicesRoot.id,
          sort_order: service.sort_order,
          is_visible: true,
          open_new_tab: false,
          locale: 'id',
        })
        .select('*')
        .single();

      if (createdNavItem) {
        nextNavItems.push(createdNavItem as NavigationItem);
        syncedItems += 1;
      }

      continue;
    }

    const needsUpdate =
      existingNavItem.label !== page.title ||
      existingNavItem.parent_id !== servicesRoot.id ||
      existingNavItem.href !== href ||
      existingNavItem.sort_order !== service.sort_order;

    if (!needsUpdate) {
      continue;
    }

    const { data: updatedNavItem } = await supabase
      .from('navigation_items')
      .update({
        label: page.title,
        href,
        parent_id: servicesRoot.id,
        sort_order: service.sort_order,
      })
      .eq('id', existingNavItem.id)
      .select('*')
      .single();

    if (updatedNavItem) {
      const index = nextNavItems.findIndex((item) => item.id === existingNavItem.id);
      if (index >= 0) {
        nextNavItems[index] = updatedNavItem as NavigationItem;
      }
      syncedItems += 1;
    }
  }

  return { createdPages, syncedItems };
}

export async function findPageIdForLegacyService(serviceId: string) {
  const supabase = await createServerSupabase();
  const { data: service } = await supabase.from('services').select('slug').eq('id', serviceId).maybeSingle();

  if (!service?.slug) {
    return null;
  }

  const { data: page } = await supabase
    .from('pages')
    .select('id')
    .eq('slug', service.slug)
    .maybeSingle();

  return page?.id ?? null;
}
