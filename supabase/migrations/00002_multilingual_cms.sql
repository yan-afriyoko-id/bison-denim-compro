-- Migration 00002: Multilingual CMS, Jobs, Redirects

-- Note: translator role is added in 00002a_add_translator_role.sql (separate transaction,
-- because Postgres disallows using a new enum value within the same transaction that added it)

CREATE TYPE job_type AS ENUM ('full-time', 'part-time', 'contract', 'internship');
CREATE TYPE submission_status AS ENUM ('new', 'read', 'replied', 'spam');

-- Locales
CREATE TABLE locales (
  code TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0
);

INSERT INTO locales (code, label, is_default, is_active, sort_order) VALUES
  ('en', 'English', true, true, 0),
  ('id', 'Indonesia', false, true, 1),
  ('jp', 'Japanese', false, true, 2),
  ('cn', 'Chinese', false, true, 3);

-- Page translations
CREATE TABLE page_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  locale TEXT NOT NULL REFERENCES locales(code),
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  excerpt TEXT,
  content JSONB,
  seo_title TEXT,
  seo_description TEXT,
  og_image_url TEXT,
  UNIQUE(page_id, locale),
  UNIQUE(locale, slug)
);

ALTER TABLE pages ADD COLUMN IF NOT EXISTS page_key TEXT UNIQUE;

-- Homepage sections
CREATE TABLE homepage_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key TEXT UNIQUE NOT NULL,
  component_type TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  settings JSONB NOT NULL DEFAULT '{}'
);

CREATE TABLE homepage_section_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL REFERENCES homepage_sections(id) ON DELETE CASCADE,
  locale TEXT NOT NULL REFERENCES locales(code),
  content JSONB NOT NULL DEFAULT '{}',
  UNIQUE(section_id, locale)
);

-- Services refactored
ALTER TABLE services ADD COLUMN IF NOT EXISTS service_key TEXT UNIQUE;
ALTER TABLE services ADD COLUMN IF NOT EXISTS pdf_media_id UUID;

CREATE TABLE service_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  locale TEXT NOT NULL REFERENCES locales(code),
  slug TEXT NOT NULL,
  legacy_slug TEXT,
  title TEXT NOT NULL,
  excerpt TEXT,
  content JSONB,
  seo_title TEXT,
  seo_description TEXT,
  UNIQUE(service_id, locale),
  UNIQUE(locale, slug)
);

-- News refactored
ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE news_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  news_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  locale TEXT NOT NULL REFERENCES locales(code),
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  excerpt TEXT,
  content JSONB,
  seo_title TEXT,
  seo_description TEXT,
  UNIQUE(news_id, locale),
  UNIQUE(locale, slug)
);

ALTER TABLE posts RENAME TO news_posts;
ALTER INDEX posts_pkey RENAME TO news_posts_pkey;

-- Departments
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE department_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  locale TEXT NOT NULL REFERENCES locales(code),
  name TEXT NOT NULL,
  UNIQUE(department_id, locale)
);

-- Locations
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  country_code TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE location_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  locale TEXT NOT NULL REFERENCES locales(code),
  name TEXT NOT NULL,
  UNIQUE(location_id, locale)
);

-- Jobs
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id UUID REFERENCES departments(id),
  location_id UUID REFERENCES locations(id),
  employment_type job_type NOT NULL DEFAULT 'full-time',
  apply_url TEXT,
  apply_email TEXT,
  closing_at TIMESTAMPTZ,
  status content_status NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE job_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  locale TEXT NOT NULL REFERENCES locales(code),
  slug TEXT,
  title TEXT NOT NULL,
  description JSONB,
  requirements JSONB,
  UNIQUE(job_id, locale)
);

-- Contact submissions refactored
ALTER TABLE contact_submissions ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE contact_submissions ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE contact_submissions ADD COLUMN IF NOT EXISTS locale TEXT;
ALTER TABLE contact_submissions ADD COLUMN IF NOT EXISTS ip_hash TEXT;
ALTER TABLE contact_submissions RENAME COLUMN company TO company_name_old;

-- Redirects
CREATE TABLE redirects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_path TEXT NOT NULL,
  destination_path TEXT NOT NULL,
  status_code INTEGER NOT NULL DEFAULT 301,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX redirects_source_idx ON redirects(source_path) WHERE is_active = true;

-- Audit logs drop/recreate for before/after
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS before_json JSONB;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS after_json JSONB;

-- Update RLS for new tables
ALTER TABLE locales ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE homepage_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE homepage_section_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE department_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE redirects ENABLE ROW LEVEL SECURITY;

-- Public read policies for translations
CREATE POLICY "Public read active locales" ON locales FOR SELECT USING (is_active = true);
CREATE POLICY "Public read published page translations" ON page_translations FOR SELECT USING (EXISTS (SELECT 1 FROM pages WHERE pages.id = page_id AND pages.status = 'published'));
CREATE POLICY "Public read visible homepage sections" ON homepage_sections FOR SELECT USING (is_visible = true);
CREATE POLICY "Public read homepage translations" ON homepage_section_translations FOR SELECT USING (EXISTS (SELECT 1 FROM homepage_sections WHERE homepage_sections.id = section_id AND is_visible = true));
CREATE POLICY "Public read published service translations" ON service_translations FOR SELECT USING (EXISTS (SELECT 1 FROM services WHERE services.id = service_id AND services.status = 'published'));
CREATE POLICY "Public read published news translations" ON news_translations FOR SELECT USING (EXISTS (SELECT 1 FROM news_posts WHERE news_posts.id = news_id AND news_posts.status = 'published'));
CREATE POLICY "Public read active jobs" ON jobs FOR SELECT USING (status = 'published' AND (closing_at IS NULL OR closing_at > now()));
CREATE POLICY "Public read department translations" ON department_translations FOR SELECT USING (true);
CREATE POLICY "Public read location translations" ON location_translations FOR SELECT USING (true);
CREATE POLICY "Public read active redirects" ON redirects FOR SELECT USING (is_active = true);

-- Authenticated user policies
CREATE POLICY "Staff read all locales" ON locales FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'editor', 'translator', 'viewer')));
CREATE POLICY "Staff manage pages" ON pages FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'editor', 'translator')));
CREATE POLICY "Staff manage translations" ON page_translations FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'editor', 'translator')));
CREATE POLICY "Staff manage homepage" ON homepage_sections FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'editor')));
CREATE POLICY "Staff manage service translations" ON service_translations FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'editor')));
CREATE POLICY "Staff manage news translations" ON news_translations FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'editor')));
CREATE POLICY "Staff manage jobs" ON jobs FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'editor')));
CREATE POLICY "Admin manage redirects" ON redirects FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin')));
CREATE POLICY "Staff read jobs" ON jobs FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'editor', 'viewer')));
CREATE POLICY "Staff read departments" ON departments FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'editor')));
CREATE POLICY "Staff read locations" ON locations FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'editor')));

-- Seed default homepage sections
INSERT INTO homepage_sections (section_key, component_type, sort_order, is_visible) VALUES
  ('hero', 'hero', 0, true),
  ('intro', 'intro', 1, true),
  ('services', 'services', 2, true),
  ('featured', 'featured', 3, true),
  ('news', 'news', 4, true),
  ('cta', 'cta', 5, true);

-- Seed company info into pages
INSERT INTO pages (page_key, title, slug, status, locale) VALUES
  ('company-information', 'Company Information', 'about/company-information', 'published', 'en'),
  ('site-policy', 'Site Policy', 'site-policy', 'published', 'en'),
  ('privacy-policy', 'Privacy Policy', 'privacy-policy', 'published', 'en');

-- Seed departments
INSERT INTO departments (key, sort_order) VALUES
  ('logistics', 0),
  ('engineering', 1),
  ('trading', 2),
  ('administration', 3),
  ('it', 4);

-- Seed locations
INSERT INTO locations (key, country_code, sort_order) VALUES
  ('jakarta', 'ID', 0),
  ('cikarang', 'ID', 1),
  ('surabaya', 'ID', 2),
  ('batam', 'ID', 3);
