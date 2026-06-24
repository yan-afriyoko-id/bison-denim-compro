'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Search } from 'lucide-react';

type FilterOption = {
  label: string;
  value: string;
};

type FilterField = {
  name: string;
  value: string;
  options: FilterOption[];
  placeholder?: string;
};

export function ToolbarFilters({
  searchValue,
  searchPlaceholder,
  filters = [],
}: {
  searchValue: string;
  searchPlaceholder: string;
  filters?: FilterField[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [search, setSearch] = useState(searchValue);
  const [filterState, setFilterState] = useState<Record<string, string>>(
    filters.reduce<Record<string, string>>((acc, filter) => {
      acc[filter.name] = filter.value;
      return acc;
    }, {})
  );

  const queryKey = useMemo(
    () => JSON.stringify({ searchValue, filters: filters.map((filter) => [filter.name, filter.value]) }),
    [filters, searchValue]
  );

  useEffect(() => {
    setSearch(searchValue);
    setFilterState(
      filters.reduce<Record<string, string>>((acc, filter) => {
        acc[filter.name] = filter.value;
        return acc;
      }, {})
    );
  }, [filters, queryKey, searchValue]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const params = new URLSearchParams();

      if (search.trim()) {
        params.set('q', search.trim());
      }

      for (const [name, value] of Object.entries(filterState)) {
        if (value) {
          params.set(name, value);
        }
      }

      const href = params.toString() ? `${pathname}?${params.toString()}` : pathname;
      const currentHref = window.location.pathname + window.location.search;

      if (href !== currentHref) {
        router.replace(href);
      }
    }, 400);

    return () => window.clearTimeout(timeoutId);
  }, [filterState, search, pathname, router]);

  return (
    <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center md:justify-end">
      <label className="relative md:min-w-[260px]">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={searchPlaceholder}
          className="w-full rounded-sm border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 outline-none transition-colors focus:border-gray-900"
        />
      </label>

      {filters.map((filter) => (
        <select
          key={filter.name}
          value={filterState[filter.name] ?? ''}
          onChange={(event) =>
            setFilterState((prev) => ({
              ...prev,
              [filter.name]: event.target.value,
            }))
          }
          className="rounded-sm border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-900 md:min-w-[180px]"
        >
          {filter.options.map((option) => (
            <option key={option.value || option.label} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ))}
    </div>
  );
}
