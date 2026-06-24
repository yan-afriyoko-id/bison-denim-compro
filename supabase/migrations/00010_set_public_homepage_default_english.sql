UPDATE site_settings
SET value = '"Bison Denim is an Indonesian fashion brand offering denim, shirts, hoodies, and everyday wardrobe essentials."'
WHERE key = 'site_description';

UPDATE site_settings
SET value = '"Quality denim, shirts, hoodies, and fashion essentials for everyday wear."'
WHERE key = 'footer_description';

UPDATE navigation_items
SET label = CASE
  WHEN href = '/' THEN 'Home'
  WHEN href = '/about/company-information' AND parent_id IS NULL THEN 'About'
  WHEN href = '/services' THEN 'Products'
  WHEN href = '/news' THEN 'News'
  WHEN href = '/contact-us' THEN 'Contact'
  WHEN href = '/services/custom-tailoring' THEN 'Shirts'
  WHEN href = '/services/sustainable-fashion' THEN 'Fashion Accessories'
  WHEN href = '/services/brand-collaboration' THEN 'More Products'
  ELSE label
END
WHERE location = 'header';

UPDATE homepage_sections
SET settings = jsonb_set(
  jsonb_set(
    jsonb_set(
      jsonb_set(settings, '{eyebrow}', '"Bison Denim"'::jsonb, true),
      '{description}',
      '"Quality denim, shirts, hoodies, and fashion essentials for everyday wear."'::jsonb,
      true
    ),
    '{cta_label}',
    '"Shop Now"'::jsonb,
    true
  ),
  '{title}',
  CASE
    WHEN settings->>'title' = 'KEMEJA PREMIUM' THEN '"PREMIUM SHIRTS"'::jsonb
    ELSE to_jsonb(settings->>'title')
  END,
  true
)
WHERE section_key = 'hero_slider'
  AND sort_order = 0;

UPDATE homepage_sections
SET settings = jsonb_set(
  jsonb_set(
    jsonb_set(settings, '{eyebrow}', '"Featured Collection"'::jsonb, true),
    '{description}',
    '"Modern cuts and comfortable fabrics for a sharp everyday look."'::jsonb,
    true
  ),
  '{cta_label}',
  '"Explore Shirts"'::jsonb,
  true
)
WHERE section_key = 'hero_slider'
  AND sort_order = 1;

UPDATE homepage_sections
SET settings = jsonb_set(
  jsonb_set(
    jsonb_set(settings, '{eyebrow}', '"Limited Edition"'::jsonb, true),
    '{description}',
    '"Comfortable and current pieces made for easy everyday style."'::jsonb,
    true
  ),
  '{cta_label}',
  '"Shop Now"'::jsonb,
  true
)
WHERE section_key = 'hero_slider'
  AND sort_order = 2;

UPDATE page_sections
SET content = content
  || jsonb_build_object(
    'title', 'About Us',
    'body', 'Bison Denim is an Indonesian fashion brand focused on denim, shirts, hoodies, and other wardrobe essentials. We are committed to delivering quality products at accessible prices.' ||
      E'\n\n' ||
      'With a broad distribution network and years of experience, Bison Denim continues to be a trusted choice for customers looking for reliable fashion pieces across Indonesia.',
    'link_label', 'Learn More',
    'secondary_image', 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1200&q=80'
  )
WHERE section_type = 'intro';

UPDATE page_sections
SET content = content || jsonb_build_object(
  'title', 'Our Products',
  'description', 'A versatile range of fashion products tailored to your everyday needs.'
)
WHERE section_type = 'services';

UPDATE page_sections
SET content = content || jsonb_build_object(
  'title', 'Latest News',
  'description', 'Fresh updates on products, campaigns, and the latest Bison Denim activities.'
)
WHERE section_type = 'news';

UPDATE page_sections
SET content = content || jsonb_build_object(
  'title', 'Contact Us',
  'description', 'Interested in our products? Reach out to the Bison Denim team for more information.',
  'button_label', 'Contact Us'
)
WHERE section_type = 'cta';
