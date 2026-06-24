const DEFAULT_PAGE = 1;
const DEFAULT_PER_PAGE = 10;
const ALLOWED_PER_PAGE = [10, 50, 100] as const;

export function parsePageValue(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number.parseInt(raw ?? '', 10);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_PAGE;
}

export function parsePerPageValue(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number.parseInt(raw ?? '', 10);

  return ALLOWED_PER_PAGE.includes(parsed as (typeof ALLOWED_PER_PAGE)[number])
    ? parsed
    : DEFAULT_PER_PAGE;
}

export function clampPage(page: number, totalPages: number): number {
  if (totalPages <= 0) return DEFAULT_PAGE;
  return Math.min(Math.max(page, DEFAULT_PAGE), totalPages);
}

export function paginateArray<T>(items: T[], page: number, perPage: number) {
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage));
  const safePage = clampPage(page, totalPages);
  const start = (safePage - 1) * perPage;

  return {
    items: items.slice(start, start + perPage),
    page: safePage,
    perPage,
    totalItems,
    totalPages,
  };
}

export function getPaginationWindow(page: number, totalPages: number): Array<number | 'ellipsis'> {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (page <= 3) {
    return [1, 2, 3, 4, 'ellipsis', totalPages];
  }

  if (page >= totalPages - 2) {
    return [1, 'ellipsis', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }

  return [1, 'ellipsis', page - 1, page, page + 1, 'ellipsis', totalPages];
}
