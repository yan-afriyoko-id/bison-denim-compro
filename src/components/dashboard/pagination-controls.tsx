'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getPaginationWindow } from '@/lib/pagination';

type SharedProps = {
  page: number;
  perPage: number;
  totalItems: number;
  totalPages: number;
  perPageOptions?: number[];
};

type LinkModeProps = SharedProps & {
  mode: 'link';
  pathname: string;
  query?: Record<string, string>;
};

type ClientModeProps = SharedProps & {
  mode: 'client';
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
};

type PaginationControlsProps = LinkModeProps | ClientModeProps;

export function PaginationControls(props: PaginationControlsProps) {
  const router = useRouter();
  const perPageOptions = props.perPageOptions ?? [10, 50, 100];
  const pageItems = getPaginationWindow(props.page, props.totalPages);

  function buildHref(page: number, perPage = props.perPage) {
    if (props.mode !== 'link') return '#';

    const params = new URLSearchParams(props.query);

    if (page <= 1) {
      params.delete('page');
    } else {
      params.set('page', String(page));
    }

    if (perPage === 10) {
      params.delete('perPage');
    } else {
      params.set('perPage', String(perPage));
    }

    const queryString = params.toString();

    return queryString ? `${props.pathname}?${queryString}` : props.pathname;
  }

  function handlePerPageChange(nextPerPage: number) {
    if (props.mode === 'client') {
      props.onPerPageChange(nextPerPage);
      return;
    }

    router.push(buildHref(1, nextPerPage));
  }

  function renderPageButton(item: number | 'ellipsis', index: number) {
    if (item === 'ellipsis') {
      return (
        <span
          key={`ellipsis-${index}`}
          className="inline-flex h-9 min-w-9 items-center justify-center px-2 text-sm text-gray-400"
        >
          ...
        </span>
      );
    }

    const isActive = item === props.page;
    const className = `inline-flex h-9 min-w-9 items-center justify-center rounded-sm border px-3 text-sm transition-colors ${
      isActive
        ? 'border-gray-900 bg-gray-900 text-white'
        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-900 hover:text-gray-900'
    }`;

    if (props.mode === 'client') {
      return (
        <button
          key={item}
          type="button"
          onClick={() => props.onPageChange(item)}
          className={className}
        >
          {item}
        </button>
      );
    }

    return (
      <Link key={item} href={buildHref(item)} className={className}>
        {item}
      </Link>
    );
  }

  const previousDisabled = props.page <= 1;
  const nextDisabled = props.page >= props.totalPages;

  return (
    <div className="flex flex-col gap-4 border-t border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
        <span>{props.totalItems} total item</span>
        <label className="flex items-center gap-2">
          <select
            value={props.perPage}
            onChange={(event) => handlePerPageChange(Number.parseInt(event.target.value, 10))}
            className="rounded-sm border border-gray-200 bg-white px-2 py-1 text-sm text-gray-900 outline-none focus:border-gray-900"
          >
            {perPageOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <span>
          Halaman {props.page} dari {props.totalPages}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {props.mode === 'client' ? (
          <button
            type="button"
            onClick={() => props.onPageChange(props.page - 1)}
            disabled={previousDisabled}
            className="inline-flex h-9 min-w-9 items-center justify-center rounded-sm border border-gray-200 bg-white px-3 text-sm text-gray-600 transition-colors hover:border-gray-900 hover:text-gray-900 disabled:pointer-events-none disabled:opacity-50"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        ) : (
          <Link
            href={buildHref(props.page - 1)}
            aria-disabled={previousDisabled}
            className={`inline-flex h-9 min-w-9 items-center justify-center rounded-sm border border-gray-200 bg-white px-3 text-sm text-gray-600 transition-colors ${
              previousDisabled ? 'pointer-events-none opacity-50' : 'hover:border-gray-900 hover:text-gray-900'
            }`}
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
        )}

        {pageItems.map(renderPageButton)}

        {props.mode === 'client' ? (
          <button
            type="button"
            onClick={() => props.onPageChange(props.page + 1)}
            disabled={nextDisabled}
            className="inline-flex h-9 min-w-9 items-center justify-center rounded-sm border border-gray-200 bg-white px-3 text-sm text-gray-600 transition-colors hover:border-gray-900 hover:text-gray-900 disabled:pointer-events-none disabled:opacity-50"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <Link
            href={buildHref(props.page + 1)}
            aria-disabled={nextDisabled}
            className={`inline-flex h-9 min-w-9 items-center justify-center rounded-sm border border-gray-200 bg-white px-3 text-sm text-gray-600 transition-colors ${
              nextDisabled ? 'pointer-events-none opacity-50' : 'hover:border-gray-900 hover:text-gray-900'
            }`}
          >
            <ChevronRight className="h-4 w-4" />
          </Link>
        )}
      </div>
    </div>
  );
}
