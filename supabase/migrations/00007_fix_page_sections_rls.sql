-- Allow admin/editor staff to create, update, and delete page sections from dashboard builder.

DROP POLICY IF EXISTS "Dashboard users can read sections" ON page_sections;
DROP POLICY IF EXISTS "Admin and editor manage page sections" ON page_sections;
DROP POLICY IF EXISTS "Admin and editor insert page sections" ON page_sections;

CREATE POLICY "Dashboard users can read sections"
  ON page_sections FOR SELECT
  USING (public.is_staff('viewer'));

CREATE POLICY "Admin and editor manage page sections"
  ON page_sections FOR UPDATE
  USING (public.is_staff('editor'))
  WITH CHECK (public.is_staff('editor'));

CREATE POLICY "Admin and editor delete page sections"
  ON page_sections FOR DELETE
  USING (public.is_staff('editor'));

CREATE POLICY "Admin and editor insert page sections"
  ON page_sections FOR INSERT
  WITH CHECK (public.is_staff('editor'));
