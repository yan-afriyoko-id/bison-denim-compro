'use client';

import { useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import { Upload, Link2, X, Loader2, ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { uploadMediaFile } from '@/actions/media.actions';

interface ImageInputProps {
  /** Name of the hidden input that carries the final URL value into the form submission. */
  name: string;
  /** Initial value (existing URL). */
  defaultValue?: string;
  /** Field label. */
  label?: string;
  /** Whether a value is required. */
  required?: boolean;
  /** Preview aspect ratio class, e.g. "aspect-[4/3]" or "aspect-video". */
  aspectClass?: string;
  /** Help text shown under the field. */
  hint?: string;
}

type Mode = 'file' | 'link';

export function ImageInput({
  name,
  defaultValue = '',
  label,
  required = false,
  aspectClass = 'aspect-[4/3]',
  hint,
}: ImageInputProps) {
  const [value, setValue] = useState(defaultValue);
  const [mode, setMode] = useState<Mode>('file');
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Keep hidden field synced
  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);

  async function handleFile(file: File) {
    if (!file.type.startsWith('image/')) {
      toast.error('File harus berupa gambar');
      return;
    }
    setUploading(true);
    const result = await uploadMediaFile(file);
    setUploading(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    if (result.url) {
      setValue(result.url);
      toast.success('Gambar diunggah');
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  return (
    <div>
      {label && (
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      {/* Mode switch */}
      <div className="mb-2 inline-flex rounded-sm border border-gray-200 bg-gray-50 p-0.5">
        <button
          type="button"
          onClick={() => setMode('file')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-sm transition-colors ${
            mode === 'file'
              ? 'bg-gray-900 text-white'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <Upload className="h-3 w-3" />
          Upload File
        </button>
        <button
          type="button"
          onClick={() => setMode('link')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-sm transition-colors ${
            mode === 'link'
              ? 'bg-gray-900 text-white'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <Link2 className="h-3 w-3" />
          Link URL
        </button>
      </div>

      {/* Hidden value carrier */}
      <input type="hidden" name={name} value={value} />

      {/* Preview */}
      <div
        className={`relative ${aspectClass} w-full overflow-hidden rounded-sm border border-gray-200 bg-gray-50 ${
          dragOver ? 'ring-2 ring-gray-900' : ''
        }`}
      >
        {value ? (
          <>
            <Image
              src={value}
              alt="Preview"
              fill
              className="object-cover"
              sizes="400px"
            />
            <button
              type="button"
              onClick={() => setValue('')}
              className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow-sm hover:bg-white hover:text-red-600 transition-colors"
              title="Hapus gambar"
            >
              <X className="h-4 w-4" />
            </button>
          </>
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="text-center text-gray-400">
              <ImageIcon className="h-8 w-8 mx-auto mb-1.5 opacity-50" />
              <p className="text-[11px]">No image</p>
            </div>
          </div>
        )}
      </div>

      {/* Inputs */}
      {mode === 'file' ? (
        <div className="mt-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            disabled={uploading}
            className="flex w-full items-center justify-center gap-2 rounded-sm border border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-xs font-semibold text-gray-500 hover:border-gray-900 hover:text-gray-900 transition-colors disabled:opacity-50"
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Mengunggah...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                {value ? 'Ganti gambar' : 'Klik atau drag file ke sini'}
              </>
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
              e.target.value = '';
            }}
          />
        </div>
      ) : (
        <input
          type="url"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="https://images.unsplash.com/..."
          className="mt-2 w-full border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-900 transition-colors rounded-sm"
        />
      )}

      {hint && <p className="text-[11px] text-gray-400 mt-1.5">{hint}</p>}
    </div>
  );
}
