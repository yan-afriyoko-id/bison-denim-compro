UPDATE homepage_sections
SET settings = jsonb_set(settings, '{eyebrow}', '"Bison Denim"'::jsonb, true)
WHERE section_key = 'hero_slider'
  AND settings->>'eyebrow' IN ('Sejak xxxxx', 'Since xxxxx');

UPDATE page_sections
SET content = replace(
  replace(
    replace(content::text, 'Berdiri sejak xxxxx di Bandung, kami berkomitmen menghadirkan produk berkualitas dengan harga terjangkau untuk semua kalangan.', 'Kami berkomitmen menghadirkan produk berkualitas dengan harga terjangkau untuk semua kalangan.'),
    '"xxxxx","label":"Tahun Berdiri"},',
    ''
  ),
  'Sejak xxxxx',
  'Bison Denim'
)::jsonb
WHERE content::text LIKE '%xxxxx%';
