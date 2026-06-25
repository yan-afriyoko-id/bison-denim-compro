import { z } from 'zod';

export const pageSchema = z.object({
  title: z.string().min(1, 'Judul wajib diisi'),
  slug: z.string().min(1, 'Slug wajib diisi'),
  description: z.string().optional().nullable(),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  locale: z.string().default('id'),
  seo_title: z.string().optional().nullable(),
  seo_description: z.string().optional().nullable(),
  is_indexed: z.boolean().default(true),
});

export const serviceSchema = z.object({
  title: z.string().min(1, 'Judul wajib diisi'),
  slug: z.string().min(1, 'Slug wajib diisi'),
  excerpt: z.string().optional().nullable(),
  content: z.record(z.string(), z.unknown()).optional().nullable(),
  icon: z.string().optional().nullable(),
  cover_image_url: z.string().optional().nullable(),
  sort_order: z.number().default(0),
  is_featured: z.boolean().default(false),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
});

export const projectSchema = z.object({
  title: z.string().min(1, 'Judul wajib diisi'),
  slug: z.string().min(1, 'Slug wajib diisi'),
  client_name: z.string().optional().nullable(),
  category_id: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  project_year: z.number().int().optional().nullable(),
  excerpt: z.string().optional().nullable(),
  content: z.record(z.string(), z.unknown()).optional().nullable(),
  cover_image_url: z.string().optional().nullable(),
  gallery: z.array(z.string()).optional().nullable(),
  is_featured: z.boolean().default(false),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
});

export const postSchema = z.object({
  title: z.string().min(1, 'Judul wajib diisi'),
  slug: z.string().min(1, 'Slug wajib diisi'),
  excerpt: z.string().optional().nullable(),
  content: z.record(z.string(), z.unknown()).optional().nullable(),
  cover_image_url: z.string().optional().nullable(),
  category_id: z.string().optional().nullable(),
  author_id: z.string().optional().nullable(),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  seo_title: z.string().optional().nullable(),
  seo_description: z.string().optional().nullable(),
  is_featured: z.boolean().default(false),
});

export const contactSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi'),
  email: z.string().email('Email tidak valid'),
  phone: z.string().optional().nullable(),
  company: z.string().optional().nullable(),
  subject: z.string().optional().nullable(),
  message: z.string().min(1, 'Pesan wajib diisi'),
});

export const mediaSchema = z.object({
  alt_text: z.string().optional().nullable(),
});

export const heroSlideSchema = z
  .object({
    eyebrow: z.string().optional().nullable(),
    title: z.string().min(1, 'Judul slide wajib diisi'),
    description: z.string().min(1, 'Deskripsi slide wajib diisi'),
    image: z.string().min(1, 'Gambar slide wajib diisi'),
    alt: z.string().optional().nullable(),
    cta_label: z.string().optional().nullable(),
    cta_href: z.string().optional().nullable(),
  })
  .superRefine((value, ctx) => {
    const hasLabel = Boolean(value.cta_label?.trim());
    const hasHref = Boolean(value.cta_href?.trim());

    if (hasLabel !== hasHref) {
      if (!hasLabel) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['cta_label'],
          message: 'Label CTA wajib diisi jika link CTA diisi',
        });
      }

      if (!hasHref) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['cta_href'],
          message: 'Link CTA wajib diisi jika label CTA diisi',
        });
      }
    }
  });

export type PageInput = z.infer<typeof pageSchema>;
export type ServiceInput = z.infer<typeof serviceSchema>;
export type ProjectInput = z.infer<typeof projectSchema>;
export type PostInput = z.infer<typeof postSchema>;
export type ContactInput = z.infer<typeof contactSchema>;
