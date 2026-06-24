import type { Post } from '@/types';

export function getPostCategoryLabel(post: Post) {
  const content = (post.content ?? {}) as Record<string, unknown>;
  const contentLabel = typeof content.category_label === 'string' ? content.category_label : '';

  if (contentLabel.trim()) {
    return contentLabel.trim().toUpperCase();
  }

  return /pameran|kegiatan|event/i.test(post.slug) ? 'KEGIATAN' : 'PRODUK';
}
