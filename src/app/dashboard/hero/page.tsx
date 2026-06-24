'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  GripVertical,
  Eye,
  EyeOff,
  Pencil,
  Trash2,
  Plus,
  X,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  getHeroSlides,
  createHeroSlide,
  updateHeroSlide,
  deleteHeroSlide,
  toggleHeroSlideVisibility,
  reorderHeroSlides,
  type HeroSlideData,
} from '@/actions/homepage.actions';
import { ImageInput } from '@/components/dashboard/image-input';

interface Slide extends HeroSlideData {
  id: string;
  sort_order: number;
  is_visible: boolean;
  created_at: string;
}

interface EditingState {
  mode: 'create' | 'edit';
  slideId?: string;
}

interface FormErrors {
  title?: string;
  description?: string;
  image?: string;
  cta_label?: string;
  cta_href?: string;
}

function SortableSlide({
  slide,
  index,
  onEdit,
  onDelete,
  onToggleVisibility,
}: {
  slide: Slide;
  index: number;
  onEdit: (slide: Slide) => void;
  onDelete: (id: string) => void;
  onToggleVisibility: (id: string, visible: boolean) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: slide.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex gap-4 border border-gray-200 bg-white rounded-sm p-4 ${
        isDragging ? 'opacity-80 shadow-lg' : ''
      } ${!slide.is_visible ? 'opacity-50' : ''}`}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="flex items-center text-gray-300 hover:text-gray-900 cursor-grab active:cursor-grabbing shrink-0"
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-5 w-5" />
      </button>

      {/* Image preview */}
      <div className="relative h-20 w-32 shrink-0 overflow-hidden rounded-sm bg-gray-50 border border-gray-100">
        {slide.image ? (
          <Image
            src={slide.image}
            alt={slide.alt || slide.title}
            fill
            className="object-cover"
            sizes="128px"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-gray-400">No image</div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="mb-1 flex items-center gap-2">
          <span className="rounded-sm border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-[10px] font-bold text-gray-500">
            #{String(index + 1).padStart(2, '0')}
          </span>
          <span className={`rounded-sm border px-1.5 py-0.5 text-[10px] font-bold ${slide.is_visible ? 'border-green-200 bg-green-50 text-green-700' : 'border-gray-200 bg-gray-50 text-gray-500'}`}>
            {slide.is_visible ? 'active' : 'hidden'}
          </span>
        </div>
        {slide.eyebrow && (
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">
            {slide.eyebrow}
          </p>
        )}
        <h3 className="text-sm font-bold text-gray-900 truncate">{slide.title || 'Untitled'}</h3>
        <p className="text-xs text-gray-500 truncate mt-0.5">{slide.description}</p>
        {slide.cta_label && (
          <p className="text-[11px] text-gray-400 mt-1">
            CTA: {slide.cta_label} → {slide.cta_href}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => onToggleVisibility(slide.id, !slide.is_visible)}
          className="flex h-8 w-8 items-center justify-center rounded-sm border border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors"
          title={slide.is_visible ? 'Sembunyikan' : 'Tampilkan'}
        >
          {slide.is_visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
        </button>
        <button
          onClick={() => onEdit(slide)}
          className="flex h-8 w-8 items-center justify-center rounded-sm border border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors"
          title="Edit"
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          onClick={() => onDelete(slide.id)}
          className="flex h-8 w-8 items-center justify-center rounded-sm border border-gray-200 text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
          title="Hapus"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function SlideForm({
  mode,
  slideId,
  initialData,
  onClose,
}: {
  mode: 'create' | 'edit';
  slideId?: string;
  initialData?: Partial<Slide>;
  onClose: () => void;
}) {
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  function validateForm(formData: FormData): FormErrors {
    const nextErrors: FormErrors = {};
    const title = String(formData.get('title') ?? '').trim();
    const description = String(formData.get('description') ?? '').trim();
    const image = String(formData.get('image') ?? '').trim();
    const ctaLabel = String(formData.get('cta_label') ?? '').trim();
    const ctaHref = String(formData.get('cta_href') ?? '').trim();

    if (!title) nextErrors.title = 'Judul slide wajib diisi.';
    if (!description) nextErrors.description = 'Deskripsi slide wajib diisi.';
    if (!image) nextErrors.image = 'Gambar slide wajib diisi.';
    if (Boolean(ctaLabel) !== Boolean(ctaHref)) {
      if (!ctaLabel) nextErrors.cta_label = 'Label CTA wajib diisi jika link ada.';
      if (!ctaHref) nextErrors.cta_href = 'Link CTA wajib diisi jika label ada.';
    }

    return nextErrors;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    const formData = new FormData(e.currentTarget);
    const validationErrors = validateForm(formData);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      setPending(false);
      return;
    }

    if (mode === 'create') {
      const result = await createHeroSlide(formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Slide berhasil ditambahkan');
        onClose();
      }
    } else if (mode === 'edit' && slideId) {
      const result = await updateHeroSlide(slideId, formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Slide berhasil diperbarui');
        onClose();
      }
    }
    setPending(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-200 bg-white rounded-sm shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 sticky top-0 bg-white">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
            {mode === 'create' ? 'Tambah Slide Baru' : 'Edit Slide'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-900 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
              Eyebrow <span className="text-gray-400 normal-case">(opsional)</span>
            </label>
            <input
              type="text"
              name="eyebrow"
              defaultValue={initialData?.eyebrow ?? ''}
              placeholder="Bison Denim"
              className="w-full bg-white border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-900 transition-colors rounded-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
              Judul *
            </label>
            <input
              type="text"
              name="title"
              defaultValue={initialData?.title ?? ''}
              required
              placeholder="BISON DENIM"
              className="w-full bg-white border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-900 transition-colors rounded-sm"
            />
            {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
              Deskripsi *
            </label>
            <textarea
              name="description"
              defaultValue={initialData?.description ?? ''}
              required
              rows={2}
              placeholder="Penyedia pakaian denim, kemeja, hoodie, dan produk fashion berkualitas."
              className="w-full bg-white border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-900 transition-colors resize-none rounded-sm"
            />
            {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description}</p>}
          </div>

          <ImageInput
            name="image"
            label="Gambar Slide"
            required
            defaultValue={initialData?.image ?? ''}
            aspectClass="aspect-video"
            hint="Upload file gambar atau tempel URL gambar (disarankan landscape 16:9)"
          />
          {errors.image && <p className="-mt-2 text-xs text-red-500">{errors.image}</p>}

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
              Alt Text
            </label>
            <input
              type="text"
              name="alt"
              defaultValue={initialData?.alt ?? ''}
              placeholder="Deskripsi gambar untuk aksesibilitas"
              className="w-full bg-white border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-900 transition-colors rounded-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                CTA Label <span className="text-gray-400 normal-case">(opsional)</span>
              </label>
              <input
                type="text"
                name="cta_label"
                defaultValue={initialData?.cta_label ?? ''}
                placeholder="Lihat Produk"
                className="w-full bg-white border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-900 transition-colors rounded-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                CTA Link <span className="text-gray-400 normal-case">(opsional)</span>
              </label>
              <input
                type="text"
                name="cta_href"
                defaultValue={initialData?.cta_href ?? ''}
                placeholder="/services"
                className="w-full bg-white border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-900 transition-colors rounded-sm"
              />
              {errors.cta_href && <p className="mt-1 text-xs text-red-500">{errors.cta_href}</p>}
            </div>
          </div>
          {errors.cta_label && <p className="-mt-2 text-xs text-red-500">{errors.cta_label}</p>}

          {mode === 'edit' && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                name="is_visible"
                id="is_visible"
                value="true"
                defaultChecked={initialData?.is_visible ?? true}
                className="h-4 w-4 accent-gray-900"
              />
              <label htmlFor="is_visible" className="text-sm text-gray-500">
                Tampilkan slide ini di landing page
              </label>
            </div>
          )}

          {/* Note: checkbox unchecked sends no value, so default to visible on create */}
          {mode === 'create' && (
            <input type="hidden" name="is_visible" value="true" />
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={pending}
              className="bg-gray-900 text-white px-5 py-2 text-sm font-bold rounded-sm hover:bg-black transition-colors disabled:opacity-50"
            >
              {pending ? 'Menyimpan...' : mode === 'create' ? 'Tambah Slide' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function HeroSliderPage() {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<EditingState | null>(null);
  const [editingData, setEditingData] = useState<Partial<Slide> | undefined>(undefined);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  async function loadSlides() {
    setLoading(true);
    const { slides } = await getHeroSlides();
    setSlides(slides);
    setLoading(false);
  }

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      setLoading(true);
      const { slides } = await getHeroSlides();
      if (!cancelled) {
        setSlides(slides);
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setSlides((items) => {
      const oldIndex = items.findIndex((i) => i.id === active.id);
      const newIndex = items.findIndex((i) => i.id === over.id);
      const newOrder = arrayMove(items, oldIndex, newIndex);

      // Update sort_order locally
      const reordered = newOrder.map((item, index) => ({
        ...item,
        sort_order: index,
      }));
      setSlides(reordered);

      // Persist new order to server
      reorderHeroSlides(
        reordered.map((item) => ({ id: item.id, sort_order: item.sort_order }))
      ).then((result) => {
        if (result.error) {
          toast.error('Gagal menyimpan urutan');
          loadSlides();
        }
      });

      return newOrder;
    });
  }

  function handleEdit(slide: Slide) {
    setEditingData(slide);
    setEditing({ mode: 'edit', slideId: slide.id });
  }

  function handleCreate() {
    setEditingData(undefined);
    setEditing({ mode: 'create' });
  }

  async function handleDelete(id: string) {
    if (!confirm('Hapus slide ini?')) return;
    const result = await deleteHeroSlide(id);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Slide berhasil dihapus');
      loadSlides();
    }
  }

  async function handleToggleVisibility(id: string, visible: boolean) {
    const result = await toggleHeroSlideVisibility(id, visible);
    if (result.error) {
      toast.error(result.error);
    } else {
      loadSlides();
    }
  }

  function handleCloseForm() {
    setEditing(null);
    setEditingData(undefined);
    loadSlides();
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Hero Slider</h1>
          <p className="text-sm text-gray-400 mt-1">
            Kelola banner utama di landing page
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 hover:border-gray-900 transition-colors rounded-sm"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Preview
          </a>
          <button
            onClick={handleCreate}
            className="flex items-center gap-1.5 bg-gray-900 text-white px-4 py-2 text-xs font-bold rounded-sm hover:bg-black transition-colors"
          >
            <Plus className="h-4 w-4" />
            Tambah Slide
          </button>
        </div>
      </div>

      {/* Slides list */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <p className="text-sm text-gray-400">Memuat...</p>
        </div>
      ) : slides.length === 0 ? (
        <div className="border border-dashed border-gray-300 bg-white rounded-sm py-24 text-center">
          <p className="text-sm text-gray-500 mb-4">Belum ada slide</p>
          <button
            onClick={handleCreate}
            className="inline-flex items-center gap-1.5 bg-gray-900 text-white px-4 py-2 text-xs font-bold rounded-sm hover:bg-black transition-colors"
          >
            <Plus className="h-4 w-4" />
            Tambah Slide Pertama
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
            <GripVertical className="h-3.5 w-3.5" />
            <span className="uppercase tracking-wider">Drag untuk mengatur urutan</span>
          </div>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={slides.map((s) => s.id)}
              strategy={verticalListSortingStrategy}
            >
              {slides.map((slide) => (
                <SortableSlide
                  key={slide.id}
                  slide={slide}
                  index={slides.findIndex((item) => item.id === slide.id)}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onToggleVisibility={handleToggleVisibility}
                />
              ))}
            </SortableContext>
          </DndContext>
          <div className="rounded-sm border border-gray-200 bg-gray-50 px-4 py-3 text-xs text-gray-500">
            {slides.filter((slide) => slide.is_visible).length} slide aktif dari {slides.length} total slide
          </div>
        </div>
      )}

      {/* Edit/Create dialog */}
      {editing && (
        <SlideForm
          mode={editing.mode}
          slideId={editing.slideId}
          initialData={editingData}
          onClose={handleCloseForm}
        />
      )}
    </div>
  );
}
