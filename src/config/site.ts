export const siteConfig = {
  name: 'Bison Denim',
  description: 'Penyedia pakaian denim, kemeja, hoodie, dan produk fashion berkualitas.',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
  ogImage: '/icon.png',
  locale: 'id',
  defaultTitle: 'Bison Denim — Fashion Berkualitas',
  titleTemplate: '%s | Bison Denim',
  links: {},
};

export const sectionTypeLabels: Record<string, string> = {
  hero: 'Hero',
  intro: 'Company Introduction',
  services: 'Services',
  stats: 'Key Metrics',
  projects: 'Projects',
  process: 'Workflow',
  news: 'News & Insights',
  partners: 'Clients & Partners',
  testimonials: 'Testimonials',
  gallery: 'Gallery',
  rich_text: 'Rich Text',
  cta: 'CTA Banner',
  contact: 'Contact',
};

export const contentStatusLabels: Record<string, string> = {
  draft: 'Draft',
  published: 'Published',
  archived: 'Archived',
};
