export type ContentStatus = 'draft' | 'published' | 'archived';
export type UserRole = 'super_admin' | 'admin' | 'editor' | 'viewer';
export type LeadStatus = 'new' | 'contacted' | 'resolved' | 'spam';
export type NavLocation = 'header' | 'footer' | 'mobile';
export type DashboardRole = UserRole;
export type DashboardModuleKey =
  | 'overview'
  | 'hero'
  | 'pages'
  | 'posts'
  | 'media'
  | 'users'
  | 'settings'
  | 'audit_logs';
export type DashboardModuleAction = 'create' | 'edit' | 'publish' | 'delete' | 'manage' | 'view';

export interface DashboardPermissionSet {
  modules: Record<DashboardModuleKey, boolean>;
  module_actions: Record<DashboardModuleKey, Partial<Record<DashboardModuleAction, boolean>>>;
}

export interface RichTextMark {
  type: string;
  attrs?: Record<string, unknown>;
}

export interface RichTextNode {
  type: string;
  attrs?: Record<string, unknown>;
  text?: string;
  marks?: RichTextMark[];
  content?: RichTextNode[];
}

export interface RichTextDocument {
  type: 'doc';
  content: RichTextNode[];
}

export type SectionType =
  | 'hero'
  | 'intro'
  | 'services'
  | 'stats'
  | 'projects'
  | 'process'
  | 'news'
  | 'partners'
  | 'testimonials'
  | 'gallery'
  | 'rich_text'
  | 'cta'
  | 'contact';

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  is_active: boolean;
  dashboard_permissions?: DashboardPermissionSet | null;
  created_at: string;
  updated_at: string;
}

export interface Page {
  id: string;
  page_key?: string | null;
  title: string;
  slug: string;
  description: string | null;
  status: ContentStatus;
  locale: string;
  seo_title: string | null;
  seo_description: string | null;
  og_image_url: string | null;
  is_indexed: boolean;
  published_at: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface PageSection {
  id: string;
  page_id: string;
  section_type: SectionType;
  internal_name: string;
  content: Record<string, unknown>;
  settings: Record<string, unknown>;
  sort_order: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface Service {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: Record<string, unknown> | null;
  icon: string | null;
  cover_image_url: string | null;
  sort_order: number;
  is_featured: boolean;
  status: ContentStatus;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  title: string;
  slug: string;
  client_name: string | null;
  category_id: string | null;
  location: string | null;
  project_year: number | null;
  excerpt: string | null;
  content: Record<string, unknown> | null;
  cover_image_url: string | null;
  gallery: unknown[] | Record<string, unknown> | null;
  is_featured: boolean;
  status: ContentStatus;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: Record<string, unknown> | null;
  cover_image_url: string | null;
  category_id: string | null;
  author_id: string | null;
  status: ContentStatus;
  seo_title: string | null;
  seo_description: string | null;
  is_featured?: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Media {
  id: string;
  bucket: string;
  path: string;
  filename: string;
  mime_type: string;
  size_bytes: number;
  width: number | null;
  height: number | null;
  alt_text: string | null;
  uploaded_by: string | null;
  created_at: string;
}

export interface NavigationItem {
  id: string;
  location: NavLocation;
  label: string;
  href: string;
  parent_id: string | null;
  sort_order: number;
  is_visible: boolean;
  open_new_tab: boolean;
  locale: string;
}

export interface SiteSetting {
  key: string;
  value: Record<string, unknown>;
  is_public: boolean;
  updated_by: string | null;
  updated_at: string;
}

export interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  company_name?: string | null;
  company_name_old?: string | null;
  country?: string | null;
  locale?: string | null;
  subject: string | null;
  message: string;
  status: LeadStatus;
  assigned_to: string | null;
  internal_note: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContentRevision {
  id: string;
  entity_type: string;
  entity_id: string;
  snapshot: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, unknown> | null;
  before_json?: Record<string, unknown> | null;
  after_json?: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  type: 'service' | 'project' | 'post';
  created_at: string;
  updated_at: string;
}

export interface GroupedSiteSettings {
  brand: {
    site_name: string;
    logo: string;
  };
  company: {
    site_description: string;
    footer_description: string;
  };
  contact: {
    contact_email: string;
    contact_phone: string;
    contact_address: string;
  };
}
