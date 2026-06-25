-- Align schema with current app expectations and seed public content that used to be hardcoded.

-- 1. Keep the app-compatible posts table name on fresh databases
DO $$
BEGIN
  IF to_regclass('public.news_posts') IS NOT NULL AND to_regclass('public.posts') IS NULL THEN
    EXECUTE 'ALTER TABLE public.news_posts RENAME TO posts';
  END IF;
END $$;

-- 2. Hero slider stores multiple rows under the same section_key
ALTER TABLE homepage_sections
  DROP CONSTRAINT IF EXISTS homepage_sections_section_key_key;

CREATE INDEX IF NOT EXISTS homepage_sections_section_key_idx
  ON homepage_sections(section_key, sort_order);

-- 3. Ensure page_key exists for homepage lookup
ALTER TABLE pages
  ADD COLUMN IF NOT EXISTS page_key TEXT UNIQUE;

-- 4. Seed editable site settings matching the previous hardcoded public site
INSERT INTO site_settings (key, value, is_public)
VALUES
  ('site_name', '"Bison Denim"', true),
  ('site_description', '"Penyedia pakaian denim, kemeja, hoodie, dan produk fashion berkualitas."', true),
  ('navbar_logo_light', '"/icon.png"', true),
  ('footer_logo', '"/icon.png"', true),
  ('footer_description', '"Penyedia pakaian denim, kemeja, hoodie, dan produk fashion berkualitas untuk Indonesia."', true),
  ('contact_email', '"hello@bison-denim.com"', true),
  ('contact_phone', '"+62-22-4234-567"', true),
  ('contact_address', '"Jl. Braga No. 88\nBandung 40111\nIndonesia"', true)
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value,
    is_public = EXCLUDED.is_public;

-- 5. Seed homepage page + sections
DO $$
DECLARE
  home_page_id UUID;
BEGIN
  INSERT INTO pages (page_key, title, slug, description, status, locale, published_at, is_indexed)
  VALUES (
    'home',
    'Homepage',
    'home',
    'Landing page utama Bison Denim',
    'published',
    'id',
    now(),
    true
  )
  ON CONFLICT (page_key) DO UPDATE
  SET title = EXCLUDED.title,
      slug = EXCLUDED.slug,
      description = EXCLUDED.description,
      status = EXCLUDED.status,
      locale = EXCLUDED.locale,
      published_at = COALESCE(pages.published_at, EXCLUDED.published_at),
      is_indexed = EXCLUDED.is_indexed
  RETURNING id INTO home_page_id;

  DELETE FROM page_sections WHERE page_id = home_page_id;

  INSERT INTO page_sections (page_id, section_type, internal_name, content, settings, sort_order, is_visible)
  VALUES
    (
      home_page_id,
      'intro',
      'Tentang Kami',
      jsonb_build_object(
        'title', 'Tentang Kami',
        'body', E'Bison Denim adalah perusahaan fashion Indonesia yang bergerak di bidang penjualan pakaian denim, kemeja, hoodie, dan berbagai produk fashion lainnya. Berdiri sejak xxxxx di Bandung, kami berkomitmen menghadirkan produk berkualitas dengan harga terjangkau untuk semua kalangan.\n\nDengan jaringan distribusi yang luas dan pengalaman lebih dari dua dekade, Bison Denim telah menjadi pilihan utama bagi konsumen yang mencari produk fashion denim dan non-denim yang terpercaya di Indonesia.',
        'image', 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80',
        'link_label', 'Pelajari Selengkapnya',
        'link_href', '/about/company-information'
      ),
      '{}'::jsonb,
      0,
      true
    ),
    (
      home_page_id,
      'services',
      'Produk Kami',
      jsonb_build_object(
        'title', 'Produk Kami',
        'description', 'Berbagai pilihan produk fashion untuk memenuhi kebutuhan Anda.',
        'limit', 5
      ),
      '{}'::jsonb,
      1,
      true
    ),
    (
      home_page_id,
      'news',
      'Berita Terbaru',
      jsonb_build_object(
        'title', 'Berita Terbaru',
        'description', 'Informasi terbaru seputar produk dan kegiatan Bison Denim.',
        'limit', 4
      ),
      '{}'::jsonb,
      2,
      true
    ),
    (
      home_page_id,
      'cta',
      'Hubungi Kami',
      jsonb_build_object(
        'title', 'Hubungi Kami',
        'description', 'Tertarik dengan produk kami? Hubungi tim Bison Denim untuk informasi lebih lanjut.',
        'button_label', 'Hubungi Kami',
        'button_href', '/contact-us'
      ),
      '{}'::jsonb,
      3,
      true
    );
END $$;

-- 5b. Seed informational pages and policy content used by existing public routes
DO $$
DECLARE
  company_page_id UUID;
  site_policy_page_id UUID;
  privacy_policy_page_id UUID;
BEGIN
  INSERT INTO pages (page_key, title, slug, description, status, locale, published_at, is_indexed)
  VALUES ('company-information', 'Tentang Bison Denim', 'about/company-information', 'Profil perusahaan Bison Denim', 'published', 'id', now(), true)
  ON CONFLICT (page_key) DO UPDATE
  SET title = EXCLUDED.title,
      slug = EXCLUDED.slug,
      description = EXCLUDED.description,
      status = EXCLUDED.status,
      locale = EXCLUDED.locale,
      published_at = COALESCE(pages.published_at, EXCLUDED.published_at)
  RETURNING id INTO company_page_id;

  DELETE FROM page_sections WHERE page_id = company_page_id;
  INSERT INTO page_sections (page_id, section_type, internal_name, content, settings, sort_order, is_visible)
  VALUES
    (company_page_id, 'hero', 'company-hero', jsonb_build_object('title', 'Tentang Bison Denim', 'image', 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1600&q=80'), '{}'::jsonb, 0, true),
    (company_page_id, 'rich_text', 'company-profile', jsonb_build_object('title', 'Profil Perusahaan', 'paragraphs', jsonb_build_array(
      'Bison Denim adalah perusahaan fashion Indonesia yang bergerak di bidang penjualan pakaian denim, kemeja, hoodie, sweater, dan berbagai produk fashion lainnya. Didirikan pada tahun xxxxx di Bandung, Jawa Barat, kami telah melayani kebutuhan fashion masyarakat Indonesia selama lebih dari dua dekade.',
      'Sebagai perusahaan yang berfokus pada kualitas dan kepuasan pelanggan, Bison Denim terus berinovasi dalam menghadirkan produk-produk fashion terbaru yang mengikuti tren global namun tetap terjangkau bagi semua kalangan.',
      'Dengan jaringan distribusi yang luas, produk Bison Denim tersedia di berbagai kota di Indonesia. Kami berkomitmen untuk terus menjadi pilihan utama masyarakat dalam memenuhi kebutuhan fashion sehari-hari.'
    ), 'image', 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=1200&q=80', 'image_alt', 'Toko dan display produk Bison Denim'), '{}'::jsonb, 1, true),
    (company_page_id, 'stats', 'company-stats', jsonb_build_object('items', jsonb_build_array(
      jsonb_build_object('value', 'xxxxx', 'label', 'Tahun Berdiri'),
      jsonb_build_object('value', '50+', 'label', 'Kota Tersebar'),
      jsonb_build_object('value', '100+', 'label', 'Produk Tersedia')
    )), '{}'::jsonb, 2, true),
    (company_page_id, 'rich_text', 'company-values', jsonb_build_object('title', 'Nilai Kami', 'items', jsonb_build_array(
      jsonb_build_object('title', 'Kualitas', 'description', 'Produk berkualitas tinggi dengan bahan terbaik untuk kepuasan pelanggan.'),
      jsonb_build_object('title', 'Kepercayaan', 'description', 'Melayani dengan jujur dan transparan sejak xxxxx.'),
      jsonb_build_object('title', 'Inovasi', 'description', 'Terus berinovasi mengikuti tren fashion terkini.')
    )), '{}'::jsonb, 3, true),
    (company_page_id, 'cta', 'company-cta', jsonb_build_object('title', 'Hubungi Kami', 'description', 'Untuk informasi lebih lanjut tentang produk Bison Denim, jangan ragu untuk menghubungi kami.', 'button_label', 'Hubungi Kami', 'button_href', '/contact-us'), '{}'::jsonb, 4, true);

  INSERT INTO pages (page_key, title, slug, description, status, locale, published_at, is_indexed)
  VALUES ('site-policy', 'Kebijakan Situs', 'site-policy', 'Kebijakan situs Bison Denim', 'published', 'id', now(), true)
  ON CONFLICT (page_key) DO UPDATE
  SET title = EXCLUDED.title,
      slug = EXCLUDED.slug,
      description = EXCLUDED.description,
      status = EXCLUDED.status,
      locale = EXCLUDED.locale,
      published_at = COALESCE(pages.published_at, EXCLUDED.published_at)
  RETURNING id INTO site_policy_page_id;

  DELETE FROM page_sections WHERE page_id = site_policy_page_id;
  INSERT INTO page_sections (page_id, section_type, internal_name, content, settings, sort_order, is_visible)
  VALUES
    (site_policy_page_id, 'rich_text', 'Pendahuluan', jsonb_build_object('body', 'Selamat datang di situs web Bison Denim. Dengan mengakses dan menggunakan situs ini, Anda setuju untuk mematuhi dan terikat oleh ketentuan dan kebijakan berikut.'), '{}'::jsonb, 0, true),
    (site_policy_page_id, 'rich_text', 'Penggunaan Situs', jsonb_build_object('body', 'Konten di situs ini disediakan untuk informasi umum dan penggunaan pribadi. Konten dapat berubah tanpa pemberitahuan sebelumnya. Penggunaan informasi atau materi di situs ini sepenuhnya atas risiko Anda sendiri.'), '{}'::jsonb, 1, true),
    (site_policy_page_id, 'rich_text', 'Kekayaan Intelektual', jsonb_build_object('body', 'Seluruh konten, logo, gambar, dan materi di situs ini adalah milik Bison Denim dan dilindungi oleh undang-undang hak cipta. Dilarang memperbanyak atau mendistribusikan konten tanpa izin tertulis dari Bison Denim.'), '{}'::jsonb, 2, true),
    (site_policy_page_id, 'rich_text', 'Tautan Eksternal', jsonb_build_object('body', 'Situs ini mungkin berisi tautan ke situs web pihak ketiga. Bison Denim tidak bertanggung jawab atas konten atau praktik privasi dari situs-situs tersebut.'), '{}'::jsonb, 3, true),
    (site_policy_page_id, 'rich_text', 'Perubahan Kebijakan', jsonb_build_object('body', 'Bison Denim berhak memperbarui kebijakan situs ini kapan saja. Perubahan akan diumumkan melalui halaman ini.'), '{}'::jsonb, 4, true),
    (site_policy_page_id, 'rich_text', 'Kontak', jsonb_build_object('body', 'Jika Anda memiliki pertanyaan tentang kebijakan situs ini, silakan hubungi kami melalui halaman Kontak.'), '{}'::jsonb, 5, true);

  INSERT INTO pages (page_key, title, slug, description, status, locale, published_at, is_indexed)
  VALUES ('privacy-policy', 'Kebijakan Privasi', 'privacy-policy', 'Kebijakan privasi Bison Denim', 'published', 'id', now(), true)
  ON CONFLICT (page_key) DO UPDATE
  SET title = EXCLUDED.title,
      slug = EXCLUDED.slug,
      description = EXCLUDED.description,
      status = EXCLUDED.status,
      locale = EXCLUDED.locale,
      published_at = COALESCE(pages.published_at, EXCLUDED.published_at)
  RETURNING id INTO privacy_policy_page_id;

  DELETE FROM page_sections WHERE page_id = privacy_policy_page_id;
  INSERT INTO page_sections (page_id, section_type, internal_name, content, settings, sort_order, is_visible)
  VALUES
    (privacy_policy_page_id, 'rich_text', 'Informasi yang Kami Kumpulkan', jsonb_build_object('body', 'Bison Denim mengumpulkan informasi pribadi yang Anda berikan secara sukarela melalui form kontak, termasuk nama, alamat email, nomor telepon, dan pesan yang Anda kirimkan.'), '{}'::jsonb, 0, true),
    (privacy_policy_page_id, 'rich_text', 'Penggunaan Informasi', jsonb_build_object('body', 'Informasi yang kami kumpulkan digunakan untuk merespon pertanyaan Anda, memproses pesanan, dan meningkatkan layanan kami. Kami tidak akan menjual atau menyewakan informasi pribadi Anda kepada pihak ketiga.'), '{}'::jsonb, 1, true),
    (privacy_policy_page_id, 'rich_text', 'Keamanan Data', jsonb_build_object('body', 'Kami menerapkan langkah-langkah keamanan yang wajar untuk melindungi informasi pribadi Anda dari akses tidak sah, perubahan, pengungkapan, atau penghancuran.'), '{}'::jsonb, 2, true),
    (privacy_policy_page_id, 'rich_text', 'Cookie', jsonb_build_object('body', 'Situs kami menggunakan cookie untuk meningkatkan pengalaman browsing. Anda dapat mengatur preferensi cookie melalui pengaturan browser Anda.'), '{}'::jsonb, 3, true),
    (privacy_policy_page_id, 'rich_text', 'Kontak', jsonb_build_object('body', 'Jika Anda memiliki pertanyaan tentang kebijakan privasi ini, silakan hubungi kami melalui halaman Kontak.'), '{}'::jsonb, 4, true);
END $$;

-- 6. Seed hero slides if not present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM homepage_sections WHERE section_key = 'hero_slider'
  ) THEN
    INSERT INTO homepage_sections (section_key, component_type, sort_order, is_visible, settings)
    VALUES
      (
        'hero_slider',
        'hero',
        0,
        true,
        jsonb_build_object(
          'eyebrow', 'Sejak xxxxx',
          'title', 'BISON DENIM',
          'description', 'Penyedia pakaian denim, kemeja, hoodie, dan produk fashion berkualitas.',
          'image', 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=1920&q=80',
          'alt', 'Display koleksi denim Bison Denim',
          'cta_label', 'Lihat Produk',
          'cta_href', '/services'
        )
      ),
      (
        'hero_slider',
        'hero',
        1,
        true,
        jsonb_build_object(
          'eyebrow', 'Premium Quality',
          'title', 'KEMEJA PREMIUM',
          'description', 'Bahan katun pilihan dengan potongan modern dan klasik untuk gaya setiap hari.',
          'image', 'https://images.unsplash.com/photo-1603252109303-2751441dd157?auto=format&fit=crop&w=1920&q=80',
          'alt', 'Display kemeja premium Bison Denim',
          'cta_label', 'Jelajahi Kemeja',
          'cta_href', '/services'
        )
      ),
      (
        'hero_slider',
        'hero',
        2,
        true,
        jsonb_build_object(
          'eyebrow', 'Edisi Terbatas',
          'title', 'HOODIE & SWEATER',
          'description', 'Nyaman dan kekinian untuk gaya santai sehari-hari musim ini.',
          'image', 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=1920&q=80',
          'alt', 'Display hoodie edisi terbatas Bison Denim',
          'cta_label', 'Belanja Sekarang',
          'cta_href', '/services'
        )
      );
  END IF;
END $$;

-- 7. Seed services to preserve previous public cards and details
INSERT INTO services (title, slug, excerpt, content, cover_image_url, sort_order, is_featured, status, published_at)
VALUES
  (
    'Denim Collection',
    'denim-collection',
    'Koleksi celana dan jaket denim berkualitas tinggi untuk gaya kasual hingga formal.',
    jsonb_build_object(
      'text', 'Koleksi denim Bison Denim menghadirkan celana dan jaket denim berkualitas tinggi dengan berbagai pilihan potongan dan warna. Dari model slim fit hingga regular fit, setiap produk dibuat dari bahan denim pilihan yang nyaman dipakai sehari-hari. Cocok untuk gaya kasual maupun semi-formal, koleksi denim kami adalah pilihan tepat untuk melengkapi wardrobe Anda.',
      'features', jsonb_build_array('Bahan denim premium', 'Berbagai ukuran dan potongan', 'Warna klasik dan modern', 'Tersedia untuk pria dan wanita', 'Harga terjangkau'),
      'cta_label', 'Beli Sekarang',
      'cta_href', '/contact-us'
    ),
    'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=1200&q=80',
    0,
    true,
    'published',
    now()
  ),
  (
    'Kemeja',
    'custom-tailoring',
    'Kemeja pria dan wanita dari bahan katun premium dengan potongan modern dan klasik.',
    jsonb_build_object(
      'text', 'Koleksi kemeja Bison Denim menawarkan berbagai pilihan kemeja pria dan wanita dengan bahan katun premium yang nyaman. Tersedia dalam potongan slim fit, regular fit, dan oversized, kemeja kami cocok untuk berbagai kesempatan dari kerja formal hingga santai. Dengan warna dan motif yang beragam, Anda dapat menemukan kemeja yang sesuai dengan gaya Anda.',
      'features', jsonb_build_array('Bahan katun premium', 'Potongan modern dan klasik', 'Tersedia berbagai ukuran', 'Warna dan motif beragam', 'Nyaman dipakai seharian'),
      'cta_label', 'Beli Sekarang',
      'cta_href', '/contact-us'
    ),
    'https://images.unsplash.com/photo-1603252109303-2751441dd157?auto=format&fit=crop&w=1200&q=80',
    1,
    true,
    'published',
    now()
  ),
  (
    'Hoodie & Sweater',
    'wholesale-supply',
    'Hoodie dan sweater nyaman dengan desain kekinian untuk gaya santai sehari-hari.',
    jsonb_build_object(
      'text', 'Hoodie dan sweater Bison Denim hadir dengan desain kekinian dan bahan premium yang nyaman dipakai. Cocok untuk gaya santai sehari-hari, koleksi hoodie dan sweater kami menawarkan berbagai pilihan warna dan desain. Dengan bahan fleece yang hangat dan lembut, produk ini cocok untuk segala cuaca.',
      'features', jsonb_build_array('Bahan fleece premium', 'Desain kekinian', 'Tersedia berbagai ukuran', 'Sablon berkualitas', 'Harga bersahabat'),
      'cta_label', 'Beli Sekarang',
      'cta_href', '/contact-us'
    ),
    'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=1200&q=80',
    2,
    true,
    'published',
    now()
  ),
  (
    'Aksesori Fashion',
    'sustainable-fashion',
    'Topi, tas, ikat pinggang, dan aksesori denim pelengkap gaya Anda.',
    jsonb_build_object(
      'text', 'Lengkapi gaya Anda dengan koleksi aksesoris fashion Bison Denim. Dari topi denim, tas selempang, ikat pinggang, hingga berbagai aksesoris lainnya, setiap produk dirancang untuk melengkapi penampilan Anda. Dengan desain yang stylish dan bahan berkualitas, aksesoris kami adalah pilihan tepat untuk tampil lebih percaya diri.',
      'features', jsonb_build_array('Desain stylish', 'Bahan berkualitas', 'Fungsional dan stylish', 'Harga terjangkau', 'Pelengkap gaya sempurna'),
      'cta_label', 'Beli Sekarang',
      'cta_href', '/contact-us'
    ),
    'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=80',
    3,
    false,
    'published',
    now()
  ),
  (
    'Produk Lainnya',
    'brand-collaboration',
    'Berbagai produk fashion berkualitas lainnya untuk kebutuhan Anda.',
    jsonb_build_object(
      'text', 'Selain denim, kemeja, hoodie, dan aksesoris, Bison Denim juga menghadirkan berbagai produk fashion lainnya. Kami terus memperbarui koleksi kami dengan produk-produk terbaru yang mengikuti tren fashion terkini. Kunjungi toko kami untuk menemukan produk fashion favorit Anda.',
      'features', jsonb_build_array('Produk fashion terbaru', 'Kualitas terjamin', 'Harga kompetitif', 'Pengiriman ke seluruh Indonesia', 'Garansi kepuasan'),
      'cta_label', 'Beli Sekarang',
      'cta_href', '/contact-us'
    ),
    'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=1200&q=80',
    4,
    false,
    'published',
    now()
  )
ON CONFLICT (slug) DO UPDATE
SET title = EXCLUDED.title,
    excerpt = EXCLUDED.excerpt,
    content = EXCLUDED.content,
    cover_image_url = EXCLUDED.cover_image_url,
    sort_order = EXCLUDED.sort_order,
    is_featured = EXCLUDED.is_featured,
    status = EXCLUDED.status,
    published_at = COALESCE(services.published_at, EXCLUDED.published_at);

-- 8. Seed posts to preserve previous news list/detail
INSERT INTO posts (title, slug, excerpt, content, cover_image_url, status, seo_title, seo_description, is_featured, published_at)
VALUES
  (
    'Koleksi Denim Terbaru Telah Hadir',
    'koleksi-denim-terbaru',
    'Bison Denim menghadirkan koleksi denim terbaru untuk musim ini.',
    jsonb_build_object(
      'text', 'Bison Denim dengan bangga menghadirkan koleksi denim terbaru untuk musim ini. Tersedia dalam berbagai model celana dan jaket denim dengan bahan premium yang nyaman dipakai. Koleksi terbaru ini hadir dengan warna-warna klasik seperti indigo blue dan black, serta potongan yang mengikuti tren terkini. Kunjungi toko kami untuk melihat koleksi lengkapnya.'
    ),
    'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=1200&q=80',
    'published',
    'Koleksi Denim Terbaru Telah Hadir',
    'Informasi terbaru koleksi denim Bison Denim.',
    true,
    '2026-06-15T00:00:00+07'
  ),
  (
    'Kemeja Premium Bahan Katun Pilihan',
    'kemeja-premium-katun',
    'Kemeja premium Bison Denim dibuat dari bahan katun pilihan.',
    jsonb_build_object(
      'text', 'Kemeja premium Bison Denim dibuat dari bahan katun pilihan yang nyaman dipakai seharian. Tersedia dalam berbagai warna dan motif, kemeja kami cocok untuk acara formal maupun kasual. Dengan potongan yang rapi dan jahitan berkualitas, setiap kemeja Bison Denim memberikan kesan profesional dan stylish.'
    ),
    'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=1200&q=80',
    'published',
    'Kemeja Premium Bahan Katun Pilihan',
    'Artikel tentang kemeja premium Bison Denim.',
    true,
    '2026-06-08T00:00:00+07'
  ),
  (
    'Hoodie Edisi Terbatas Musim Ini',
    'hoodie-edisi-terbatas',
    'Hoodie edisi terbatas dengan desain eksklusif musim ini.',
    jsonb_build_object(
      'text', 'Hoodie edisi terbatas Bison Denim hadir dengan desain eksklusif yang hanya tersedia dalam jumlah terbatas. Dibuat dari bahan fleece premium yang hangat dan nyaman, hoodie ini cocok untuk gaya santai sehari-hari. Jangan lewatkan kesempatan untuk memiliki hoodie edisi terbatas ini sebelum kehabisan.'
    ),
    'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=1200&q=80',
    'published',
    'Hoodie Edisi Terbatas Musim Ini',
    'Artikel tentang hoodie edisi terbatas Bison Denim.',
    false,
    '2026-06-01T00:00:00+07'
  ),
  (
    'Bison Denim di Pameran Fashion 2026',
    'bison-denim-pameran-fashion-2026',
    'Bison Denim berpartisipasi dalam pameran fashion 2026 di Jakarta.',
    jsonb_build_object(
      'text', 'Bison Denim berpartisipasi dalam pameran fashion 2026 yang diselenggarakan di Jakarta. Dalam acara ini, kami memamerkan koleksi terbaru denim, kemeja, hoodie, dan aksesoris fashion. Pengunjung dapat melihat langsung kualitas produk dan mendapatkan penawaran khusus selama pameran berlangsung.'
    ),
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80',
    'published',
    'Bison Denim di Pameran Fashion 2026',
    'Kegiatan Bison Denim di pameran fashion 2026.',
    false,
    '2026-05-25T00:00:00+07'
  ),
  (
    'Tips Memilih Bahan Kemeja yang Tepat',
    'tips-memilih-bahan-kemeja',
    'Panduan memilih bahan kemeja yang nyaman dan tepat.',
    jsonb_build_object(
      'text', 'Memilih bahan kemeja yang tepat sangat penting untuk kenyamanan dan penampilan. Kemeja katun adalah pilihan terbaik untuk iklim tropis karena menyerap keringat dan nyaman dipakai. Bison Denim menyediakan berbagai pilihan kemeja katun premium dengan berbagai warna dan motif yang bisa disesuaikan dengan kebutuhan Anda.'
    ),
    'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=1200&q=80',
    'published',
    'Tips Memilih Bahan Kemeja yang Tepat',
    'Tips memilih bahan kemeja dari Bison Denim.',
    false,
    '2026-05-18T00:00:00+07'
  ),
  (
    'Cara Merawat Celana Denim Agar Awet',
    'cara-merawat-celana-denim-awet',
    'Tips merawat celana denim agar tetap awet dan nyaman dipakai.',
    jsonb_build_object(
      'text', 'Celana denim yang dirawat dengan baik dapat bertahan bertahun-tahun. Cuci celana denim dengan air dingin dan balikkan bagian dalamnya sebelum dicuci. Hindari penggunaan pemutih dan pengering mesin berlebihan. Dengan perawatan yang tepat, celana denim Bison Denim Anda akan tetap terlihat seperti baru.'
    ),
    'https://images.unsplash.com/photo-1548883354-94bcfe321cbb?auto=format&fit=crop&w=1200&q=80',
    'published',
    'Cara Merawat Celana Denim Agar Awet',
    'Panduan merawat celana denim dari Bison Denim.',
    false,
    '2026-05-10T00:00:00+07'
  ),
  (
    'Diskon Akhir Tahun Bison Denim',
    'diskon-akhir-tahun-bison-denim',
    'Promo diskon akhir tahun untuk berbagai produk pilihan.',
    jsonb_build_object(
      'text', 'Bison Denim mengadakan diskon akhir tahun dengan potongan harga hingga 50% untuk berbagai produk pilihan. Nikmati promo spesial untuk koleksi denim, kemeja, hoodie, dan aksesoris fashion. Promo berlaku untuk pembelian di toko maupun online. Segera dapatkan produk favorit Anda sebelum kehabisan.'
    ),
    'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=80',
    'published',
    'Diskon Akhir Tahun Bison Denim',
    'Promo diskon akhir tahun Bison Denim.',
    false,
    '2026-05-03T00:00:00+07'
  ),
  (
    'Padu Padan Hoodie untuk Tampil Stylish',
    'padu-padan-hoodie-stylish',
    'Inspirasi memadukan hoodie untuk tampilan stylish.',
    jsonb_build_object(
      'text', 'Hoodie bukan hanya untuk gaya santai, tetapi juga bisa dipadukan untuk tampilan yang lebih stylish. Padukan hoodie dengan jaket denim dan celana chino untuk tampilan kasual yang keren. Atau kenakan hoodie dengan celana jeans favorit Anda untuk tampilan sehari-hari yang nyaman namun tetap modis.'
    ),
    'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=1200&q=80',
    'published',
    'Padu Padan Hoodie untuk Tampil Stylish',
    'Inspirasi gaya hoodie dari Bison Denim.',
    false,
    '2026-04-26T00:00:00+07'
  )
ON CONFLICT (slug) DO UPDATE
SET title = EXCLUDED.title,
    excerpt = EXCLUDED.excerpt,
    content = EXCLUDED.content,
    cover_image_url = EXCLUDED.cover_image_url,
    status = EXCLUDED.status,
    seo_title = EXCLUDED.seo_title,
    seo_description = EXCLUDED.seo_description,
    is_featured = EXCLUDED.is_featured,
    published_at = COALESCE(posts.published_at, EXCLUDED.published_at);

-- 9. Seed header navigation if it is still empty
DO $$
DECLARE
  about_id UUID;
  products_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM navigation_items WHERE location = 'header') THEN
    INSERT INTO navigation_items (location, label, href, sort_order, is_visible, open_new_tab, locale)
    VALUES ('header', 'Beranda', '/', 0, true, false, 'id');

    INSERT INTO navigation_items (location, label, href, sort_order, is_visible, open_new_tab, locale)
    VALUES ('header', 'Tentang', '/about/company-information', 1, true, false, 'id')
    RETURNING id INTO about_id;

    INSERT INTO navigation_items (location, label, href, sort_order, is_visible, open_new_tab, locale)
    VALUES ('header', 'Produk', '/services', 2, true, false, 'id')
    RETURNING id INTO products_id;

    INSERT INTO navigation_items (location, label, href, sort_order, is_visible, open_new_tab, locale)
    VALUES
      ('header', 'Berita', '/news', 3, true, false, 'id'),
      ('header', 'Kontak', '/contact-us', 4, true, false, 'id');

    INSERT INTO navigation_items (location, label, href, parent_id, sort_order, is_visible, open_new_tab, locale)
    VALUES
      ('header', 'Informasi Perusahaan', '/about/company-information', about_id, 0, true, false, 'id'),
      ('header', 'Denim Collection', '/services/denim-collection', products_id, 0, true, false, 'id'),
      ('header', 'Kemeja', '/services/custom-tailoring', products_id, 1, true, false, 'id'),
      ('header', 'Hoodie & Sweater', '/services/wholesale-supply', products_id, 2, true, false, 'id'),
      ('header', 'Aksesori Fashion', '/services/sustainable-fashion', products_id, 3, true, false, 'id'),
      ('header', 'Produk Lainnya', '/services/brand-collaboration', products_id, 4, true, false, 'id');
  END IF;
END $$;
