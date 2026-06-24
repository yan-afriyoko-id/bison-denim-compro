import type { GroupedSiteSettings, SiteSetting } from '@/types';

export function normalizeDbText(value: FormDataEntryValue | null): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function friendlyDbError(message: string): string {
  if (/duplicate key value/i.test(message) || /unique constraint/i.test(message)) {
    return 'Data dengan slug atau kunci yang sama sudah ada.';
  }

  return message;
}

export function parseJsonContent<T>(value: FormDataEntryValue | null, fallback: T): T {
  if (typeof value !== 'string' || !value.trim()) return fallback;

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function getLeadCompany(lead: {
  company?: string | null;
  company_name?: string | null;
  company_name_old?: string | null;
}) {
  return lead.company_name ?? lead.company_name_old ?? lead.company ?? null;
}

export function getMediaPublicUrl(bucket: string, path: string): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
}

export function defaultGroupedSiteSettings(): GroupedSiteSettings {
  return {
    brand: {
      site_name: '',
      logo: '',
    },
    company: {
      site_description: '',
      footer_description: '',
    },
    contact: {
      contact_email: '',
      contact_phone: '',
      contact_address: '',
    },
  };
}

export function groupSiteSettings(settings: SiteSetting[]): GroupedSiteSettings {
  const grouped = defaultGroupedSiteSettings();

  for (const setting of settings) {
    const rawValue =
      typeof setting.value === 'string'
        ? setting.value
        : Array.isArray(setting.value)
          ? ''
          : (setting.value as Record<string, unknown>);

    const textValue =
      typeof rawValue === 'string'
        ? rawValue
        : typeof rawValue?.value === 'string'
          ? rawValue.value
          : '';

    switch (setting.key) {
      case 'site_name':
      case 'logo':
        grouped.brand[setting.key] = textValue;
        break;
      case 'site_description':
      case 'footer_description':
        grouped.company[setting.key] = textValue;
        break;
      case 'contact_email':
      case 'contact_phone':
      case 'contact_address':
        grouped.contact[setting.key] = textValue;
        break;
      default:
        break;
    }
  }

  return grouped;
}
