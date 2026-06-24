'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { ImageIcon, Upload, Trash2, X, Loader2, Copy, ExternalLink, Search, Save } from 'lucide-react';
import { toast } from 'sonner';
import { uploadMediaFile, deleteMediaItem, updateMediaAltText } from '@/actions/media.actions';
import type { Media } from '@/types';
import { formatBytes } from '@/lib/utils';
import { paginateArray } from '@/lib/pagination';
import { PaginationControls } from '@/components/dashboard/pagination-controls';

async function fetchMedia(): Promise<Media[]> {
  try {
    const res = await fetch('/api/media');
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // ignore
  }
  return [];
}

function getPublicUrl(item: Media): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${item.bucket}/${item.path}`;
}

export default function MediaPage() {
  const [media, setMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [altTextDraft, setAltTextDraft] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadMedia = useCallback(async () => {
    setLoading(true);
    const data = await fetchMedia();
    setMedia(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      setLoading(true);
      const data = await fetchMedia();
      if (!cancelled) {
        setMedia(data);
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [loadMedia]);

  async function handleMultipleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    for (const file of Array.from(files)) {
      if (file.type.startsWith('image/')) {
        const result = await uploadMediaFile(file);
        if (result.error) toast.error(`${file.name}: ${result.error}`);
      }
    }
    setUploading(false);
    toast.success('Upload completed');
    loadMedia();
  }

  async function handleDelete(item: Media) {
    if (!confirm(`Delete "${item.filename}"?`)) return;
    const result = await deleteMediaItem(item.id, item.path);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Media deleted');
      setSelected(null);
      loadMedia();
    }
  }

  function copyValue(value: string, label: string) {
    navigator.clipboard.writeText(value).then(() => {
      toast.success(`${label} copied`);
    });
  }

  const filteredMedia = media.filter((item) =>
    item.filename.toLowerCase().includes(search.toLowerCase())
  );
  const paginatedMedia = paginateArray(filteredMedia, page, perPage);
  const selectedItem = selected ? media.find((m) => m.id === selected) : null;
  const selectedPublicUrl = selectedItem ? getPublicUrl(selectedItem) : '';

  useEffect(() => {
    queueMicrotask(() => {
      setAltTextDraft(selectedItem?.alt_text ?? '');
    });
  }, [selectedItem]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="rounded-sm border border-gray-200 bg-white p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Media Library</h1>
            <p className="mt-1 text-sm text-gray-400">Manage media files</p>
          </div>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-end">
            <label className="relative md:min-w-[260px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search media files"
                className="w-full rounded-sm border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 outline-none transition-colors focus:border-gray-900"
              />
            </label>
            <div className="text-right text-xs text-gray-400">{media.length} files</div>
          </div>
        </div>
      </div>

      <div
        className={`relative border-2 border-dashed rounded-sm p-8 text-center transition-colors ${
          dragOver ? 'border-gray-900 bg-gray-50' : 'border-gray-300 bg-white hover:border-gray-400'
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleMultipleFiles(e.dataTransfer.files);
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleMultipleFiles(e.target.files)}
        />
        {uploading ? (
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400 mb-3" />
            <p className="text-sm text-gray-500">Uploading...</p>
          </div>
        ) : (
          <>
            <Upload className="h-8 w-8 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-gray-700 mb-1">Drag and drop images here</p>
            <p className="text-xs text-gray-400 mb-4">or click to choose files (max 8MB per file)</p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 bg-gray-900 text-white px-4 py-2 text-xs font-bold rounded-sm hover:bg-black transition-colors"
            >
              <Upload className="h-3.5 w-3.5" />
              Choose Files
            </button>
          </>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
        </div>
      ) : filteredMedia.length === 0 ? (
        <div className="border border-dashed border-gray-300 bg-white rounded-sm py-24 flex flex-col items-center justify-center">
          <ImageIcon className="h-10 w-10 text-gray-300 mb-4" />
          <p className="text-sm text-gray-500">{media.length === 0 ? 'No media yet' : 'No search results'}</p>
          <p className="text-xs text-gray-400 mt-1">{media.length === 0 ? 'Upload your first media file' : 'Try a different keyword'}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {paginatedMedia.items.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelected(item.id)}
                className={`group relative border rounded-sm overflow-hidden cursor-pointer transition-colors ${
                  selected === item.id ? 'border-gray-900 ring-2 ring-gray-900 ring-offset-1' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="aspect-square bg-gray-50">
                  {item.mime_type?.startsWith('image/') ? (
                    <Image src={getPublicUrl(item)} alt={item.alt_text ?? item.filename} fill className="object-cover" sizes="200px" />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <ImageIcon className="h-6 w-6 text-gray-300" />
                    </div>
                  )}
                </div>
                <div className="p-2">
                  <p className="text-[11px] font-medium text-gray-900 truncate">{item.filename}</p>
                  <p className="text-[10px] text-gray-400">{formatBytes(item.size_bytes)}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="rounded-sm border border-gray-200 bg-white">
            <PaginationControls
              mode="client"
              page={paginatedMedia.page}
              perPage={paginatedMedia.perPage}
              totalItems={paginatedMedia.totalItems}
              totalPages={paginatedMedia.totalPages}
              onPageChange={setPage}
              onPerPageChange={(nextPerPage) => {
                setPerPage(nextPerPage);
                setPage(1);
              }}
            />
          </div>

          {selectedItem && (
            <div className="border border-gray-200 bg-white rounded-sm p-5 space-y-4">
              <div className="flex items-start justify-between">
                <h3 className="text-sm font-bold text-gray-900">Media Details</h3>
                <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-900 transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex gap-5">
                <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-sm border border-gray-100 bg-gray-50">
                  {selectedItem.mime_type?.startsWith('image/') && (
                    <Image src={selectedPublicUrl} alt={selectedItem.filename} fill className="object-cover" sizes="128px" />
                  )}
                </div>
                <div className="flex-1 min-w-0 grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Filename</p>
                    <p className="text-sm text-gray-900 truncate">{selectedItem.filename}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Type</p>
                    <p className="text-sm text-gray-600">{selectedItem.mime_type}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Size</p>
                    <p className="text-sm text-gray-600">{formatBytes(selectedItem.size_bytes)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Dimensions</p>
                    <p className="text-sm text-gray-600">
                      {selectedItem.width && selectedItem.height ? `${selectedItem.width} x ${selectedItem.height}` : 'Unknown'}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Alt Text</p>
                <div className="flex gap-2">
                  <input
                    value={altTextDraft}
                    onChange={(e) => setAltTextDraft(e.target.value)}
                    className="flex-1 rounded-sm border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-900"
                    placeholder="Enter image alt text"
                  />
                  <button
                    onClick={async () => {
                      const result = await updateMediaAltText(selectedItem.id, altTextDraft);
                      if (result.error) toast.error(result.error);
                      else {
                        toast.success('Alt text saved');
                        loadMedia();
                      }
                    }}
                    className="flex items-center gap-1.5 rounded-sm bg-gray-900 px-3 py-2 text-xs font-bold text-white hover:bg-black"
                  >
                    <Save className="h-3.5 w-3.5" />
                    Save
                  </button>
                </div>
              </div>

              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Public URL</p>
                <code className="block rounded-sm border border-gray-100 bg-gray-50 px-3 py-2 text-xs text-gray-600 truncate">{selectedPublicUrl}</code>
              </div>

              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Storage Path</p>
                <code className="block rounded-sm border border-gray-100 bg-gray-50 px-3 py-2 text-xs text-gray-600 truncate">{selectedItem.path}</code>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => copyValue(selectedPublicUrl, 'URL')}
                  className="flex items-center gap-1.5 border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600 hover:border-gray-900 hover:text-gray-900 transition-colors rounded-sm"
                >
                  <Copy className="h-3.5 w-3.5" />
                  Copy URL
                </button>
                <button
                  onClick={() => copyValue(selectedItem.path, 'Path')}
                  className="flex items-center gap-1.5 border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600 hover:border-gray-900 hover:text-gray-900 transition-colors rounded-sm"
                >
                  <Copy className="h-3.5 w-3.5" />
                  Copy Path
                </button>
                <a
                  href={selectedPublicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600 hover:border-gray-900 hover:text-gray-900 transition-colors rounded-sm"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Open
                </a>
                <button
                  onClick={() => handleDelete(selectedItem)}
                  className="ml-auto flex items-center gap-1.5 rounded-sm border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-500 transition-colors hover:bg-red-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
