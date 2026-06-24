'use client';

import { useMemo, useState, useTransition } from 'react';
import { Plus, Save, Search, Trash2, X, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import type { NavLocation, NavigationItem } from '@/types';
import {
  createNavigationItem,
  deleteNavigationItem,
  updateNavigationItem,
} from '@/actions/navigation.actions';
import { paginateArray } from '@/lib/pagination';
import { PaginationControls } from '@/components/dashboard/pagination-controls';

type NavigationDraft = {
  id: string | null;
  label: string;
  href: string;
  parent_id: string;
  is_visible: boolean;
  open_new_tab: boolean;
};

const emptyDraft: NavigationDraft = {
  id: null,
  label: '',
  href: '',
  parent_id: '',
  is_visible: true,
  open_new_tab: false,
};

export function NavigationManager({
  initialItems,
  location = 'header',
}: {
  initialItems: NavigationItem[];
  location?: NavLocation;
}) {
  const [items, setItems] = useState(initialItems);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [showModal, setShowModal] = useState(false);
  const [draft, setDraft] = useState<NavigationDraft>(emptyDraft);
  const [isPending, startTransition] = useTransition();

  const filteredItems = useMemo(() => {
    return items.filter((item) =>
      `${item.label} ${item.href}`.toLowerCase().includes(search.toLowerCase())
    );
  }, [items, search]);
  const paginatedItems = useMemo(
    () => paginateArray(filteredItems, page, perPage),
    [filteredItems, page, perPage]
  );

  const parentOptions = items.filter((item) => item.id !== draft.id);

  function openCreateForm() {
    setDraft({ ...emptyDraft });
    setShowModal(true);
  }

  function openEditForm(item: NavigationItem) {
    setDraft({
      id: item.id,
      label: item.label,
      href: item.href,
      parent_id: item.parent_id ?? '',
      is_visible: item.is_visible,
      open_new_tab: item.open_new_tab,
    });
    setShowModal(true);
  }

  function closeEditor() {
    setShowModal(false);
    setDraft(emptyDraft);
  }

  function patchDraft<Key extends keyof NavigationDraft>(key: Key, value: NavigationDraft[Key]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    if (!draft.label.trim() || !draft.href.trim()) {
      toast.error('Label and link are required.');
      return;
    }

    const payload = {
      location,
      label: draft.label,
      href: draft.href,
      parent_id: draft.parent_id || null,
      sort_order: 0,
      is_visible: draft.is_visible,
      open_new_tab: draft.open_new_tab,
    };

    if (draft.id) {
      const result = await updateNavigationItem(draft.id, payload);
      if (result.error) {
        toast.error(result.error);
        return;
      }

      setItems((prev) =>
        prev.map((item) => (item.id === draft.id ? { ...item, ...payload } : item))
      );
      toast.success('Navigation updated');
      closeEditor();
      return;
    }

    const result = await createNavigationItem(payload);
    if (result.error || !result.data) {
      toast.error(result.error ?? 'Failed to create navigation item');
      return;
    }

    setItems((prev) => [...prev, result.data as NavigationItem]);
    toast.success('Navigation created');
    closeEditor();
  }

  async function handleDelete(itemId: string) {
    if (!confirm('Delete this navigation item?')) {
      return;
    }

    const result = await deleteNavigationItem(itemId);
    if (result.error) {
      toast.error(result.error);
      return;
    }

    setItems((prev) => prev.filter((item) => item.id !== itemId && item.parent_id !== itemId));
    toast.success('Navigation deleted');
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="rounded-sm border border-gray-200 bg-white p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Header Navigation</h1>
            <p className="mt-1 text-sm text-gray-400">Manage desktop and mobile menus from one source.</p>
          </div>
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <label className="relative min-w-[260px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="Search label or href"
                className="w-full rounded-sm border border-gray-200 py-2 pl-9 pr-3 text-sm text-gray-900 outline-none focus:border-gray-900"
              />
            </label>
            <button
              type="button"
              onClick={openCreateForm}
              className="inline-flex items-center justify-center gap-1.5 rounded-sm bg-gray-900 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-black"
            >
              <Plus className="h-4 w-4" />
              New Item
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-sm border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Label</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Link</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="text-right px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-20 text-center">
                    <p className="text-sm text-gray-500">No navigation items yet</p>
                    <p className="mt-1 text-xs text-gray-400">Add the first item for the header</p>
                  </td>
                </tr>
              ) : (
                paginatedItems.items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-900">{item.label}</span>
                        {item.parent_id && (
                          <span className="rounded-sm border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] font-medium text-gray-500">
                            child
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-xs text-gray-400 font-mono">{item.href}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {!item.is_visible && (
                          <span className="rounded-sm border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                            hidden
                          </span>
                        )}
                        {item.open_new_tab && (
                          <span className="rounded-sm border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">
                            new tab
                          </span>
                        )}
                        {item.is_visible && !item.open_new_tab && (
                          <span className="rounded-sm border border-green-200 bg-green-50 px-2 py-0.5 text-[11px] font-medium text-green-700">
                            active
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openEditForm(item)}
                          className="flex h-8 w-8 items-center justify-center rounded-sm border border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors"
                          title="Edit item"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => startTransition(() => void handleDelete(item.id))}
                          disabled={isPending}
                          className="flex h-8 w-8 items-center justify-center rounded-sm border border-gray-200 text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {filteredItems.length > 0 && (
          <PaginationControls
            mode="client"
            page={paginatedItems.page}
            perPage={paginatedItems.perPage}
            totalItems={paginatedItems.totalItems}
            totalPages={paginatedItems.totalPages}
            onPageChange={setPage}
            onPerPageChange={(nextPerPage) => {
              setPerPage(nextPerPage);
              setPage(1);
            }}
          />
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg border border-gray-200 bg-white rounded-sm shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                {draft.id ? 'Edit Navigation Item' : 'New Navigation Item'}
              </h2>
              <button
                type="button"
                onClick={closeEditor}
                className="text-gray-400 hover:text-gray-900 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-400">Label</label>
                <input
                  value={draft.label}
                  onChange={(event) => patchDraft('label', event.target.value)}
                  placeholder="Home"
                  className="w-full rounded-sm border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-900"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-400">Href</label>
                <input
                  value={draft.href}
                  onChange={(event) => patchDraft('href', event.target.value)}
                  placeholder="/services atau https://..."
                  className="w-full rounded-sm border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-900"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-400">Parent</label>
                <select
                  value={draft.parent_id}
                  onChange={(event) => patchDraft('parent_id', event.target.value)}
                  className="w-full rounded-sm border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-900"
                >
                  <option value="">No parent</option>
                  {parentOptions.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={draft.is_visible}
                  onChange={(event) => patchDraft('is_visible', event.target.checked)}
                  className="h-4 w-4 accent-gray-900"
                />
                Show this item
              </label>

              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={draft.open_new_tab}
                  onChange={(event) => patchDraft('open_new_tab', event.target.checked)}
                  className="h-4 w-4 accent-gray-900"
                />
                Open in a new tab
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-4">
              <button
                type="button"
                onClick={closeEditor}
                className="px-4 py-2 text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => startTransition(() => void handleSave())}
                disabled={isPending}
                className="inline-flex items-center gap-1.5 rounded-sm bg-gray-900 px-5 py-2 text-xs font-bold text-white transition-colors hover:bg-black disabled:opacity-50"
              >
                <Save className="h-3.5 w-3.5" />
                {isPending ? 'Saving...' : 'Save Item'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
