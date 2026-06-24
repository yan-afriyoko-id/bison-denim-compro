ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS dashboard_permissions JSONB NOT NULL DEFAULT '{}'::jsonb;
