DROP POLICY IF EXISTS "Public can view visible navigation items" ON navigation_items;

CREATE POLICY "Public can view visible navigation items"
  ON navigation_items FOR SELECT
  USING (is_visible = true);
