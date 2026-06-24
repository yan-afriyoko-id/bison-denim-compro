'use client';

import { useEffect, useState } from 'react';
import { GripVertical, Plus, Trash2 } from 'lucide-react';
import { ImageInput } from '@/components/dashboard/image-input';

interface GalleryInputProps {
  value: string[];
  onChange: (next: string[]) => void;
}

export function GalleryInput({ value, onChange }: GalleryInputProps) {
  const [drafts, setDrafts] = useState<string[]>(value.length > 0 ? value : ['']);

  useEffect(() => {
    queueMicrotask(() => {
      setDrafts(value.length > 0 ? value : ['']);
    });
  }, [value]);

  function sync(nextDrafts: string[]) {
    setDrafts(nextDrafts);
    onChange(nextDrafts.filter(Boolean));
  }

  function updateAt(index: number, nextValue: string) {
    const nextDrafts = drafts.map((item, itemIndex) => (itemIndex === index ? nextValue : item));
    sync(nextDrafts);
  }

  function addItem() {
    sync([...drafts, '']);
  }

  function removeAt(index: number) {
    const nextDrafts = drafts.filter((_, itemIndex) => itemIndex !== index);
    sync(nextDrafts.length > 0 ? nextDrafts : ['']);
  }

  function move(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= drafts.length) return;
    const nextDrafts = [...drafts];
    const [item] = nextDrafts.splice(index, 1);
    nextDrafts.splice(nextIndex, 0, item);
    sync(nextDrafts);
  }

  return (
    <div className="space-y-3">
      {drafts.map((item, index) => (
        <div key={`${index}-${item}`} className="rounded-sm border border-gray-200 p-3">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-500">
              <GripVertical className="h-3.5 w-3.5" />
              Gallery Image #{index + 1}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => move(index, -1)}
                disabled={index === 0}
                className="rounded-sm border border-gray-200 px-2 py-1 text-[11px] font-semibold text-gray-500 disabled:opacity-40"
              >
                Up
              </button>
              <button
                type="button"
                onClick={() => move(index, 1)}
                disabled={index === drafts.length - 1}
                className="rounded-sm border border-gray-200 px-2 py-1 text-[11px] font-semibold text-gray-500 disabled:opacity-40"
              >
                Down
              </button>
              <button
                type="button"
                onClick={() => removeAt(index)}
                className="flex h-8 w-8 items-center justify-center rounded-sm text-red-500 transition-colors hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
          <ImageInput
            name={`gallery_image_${index}`}
            defaultValue={item}
            onChange={(nextValue) => updateAt(index, nextValue)}
            aspectClass="aspect-[4/3]"
            hint="Upload gambar gallery atau tempel URL"
          />
        </div>
      ))}

      <button
        type="button"
        onClick={addItem}
        className="inline-flex items-center gap-1.5 rounded-sm border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600 transition-colors hover:border-gray-900 hover:text-gray-900"
      >
        <Plus className="h-3.5 w-3.5" />
        Tambah Gambar
      </button>
    </div>
  );
}
