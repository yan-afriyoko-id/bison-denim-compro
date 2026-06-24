UPDATE homepage_sections
SET settings = jsonb_set(settings, '{eyebrow}', '"Bison Denim"'::jsonb, true)
WHERE section_key = 'hero_slider'
  AND settings->>'eyebrow' IN ('Sejak 1998', 'Since 1998');

UPDATE page_sections
SET content = replace(
  replace(
    replace(content::text, 'Berdiri sejak 1998 di Bandung, kami berkomitmen menghadirkan produk berkualitas dengan harga terjangkau untuk semua kalangan.', 'Kami berkomitmen menghadirkan produk berkualitas dengan harga terjangkau untuk semua kalangan.'),
    '"1998","label":"Tahun Berdiri"},',
    ''
  ),
  'Sejak 1998',
  'Bison Denim'
)::jsonb
WHERE content::text LIKE '%1998%';
