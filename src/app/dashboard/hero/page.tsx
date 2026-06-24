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

function SortableSlide({
  slide,
  onEdit,
  onDelete,
  onToggleVisibility,
}: {
  slide: Slide;
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
      className={`flex gap-4 border border-[#2a2a2a] bg-[#141414] rounded-sm p-4 ${
        isDragging ? 'opacity-80' : ''
      } ${!slide.is_visible ? 'opacity-50' : ''}`}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="flex items-center text-[#666] hover:text-[#f5f5f5] cursor-grab active:cursor-grabbing shrink-0"
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-5 w-5" />
      </button>

      {/* Image preview */}
      <div className="relative h-20 w-32 shrink-0 overflow-hidden rounded-sm bg-[#1c1c1c]">
        {slide.image ? (
          <Image
            src={slide.image}
            alt={slide.alt || slide.title}
            fill
            className="object-cover"
            sizes="128px"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-[#666]">No image</div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {slide.eyebrow && (
          <p className="text-[10px] font-bold text-[#666] uppercase tracking-wider mb-0.5">
            {slide.eyebrow}
          </p>
        )}
        <h3 className="text-sm font-bold text-[#f5f5f5] truncate">{slide.title || 'Untitled'}</h3>
        <p className="text-xs text-[#a3a3a3] truncate mt-0.5">{slide.description}</p>
        {slide.cta_label && (
          <p className="text-[11px] text-[#666] mt-1">
            CTA: {slide.cta_label} → {slide.cta_href}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => onToggleVisibility(slide.id, !slide.is_visible)}
          className="flex h-8 w-8 items-center justify-center rounded-sm text-[#666] hover:text-[#f5f5f5] hover:bg-[#1c1c1c] transition-colors"
          title={slide.is_visible ? 'Sembunyikan' : 'Tampilkan'}
        >
          {slide.is_visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
        </button>
        <button
          onClick={() => onEdit(slide)}
          className="flex h-8 w-8 items-center justify-center rounded-sm text-[#666] hover:text-[#f5f5f5] hover:bg-[#1c1c1c] transition-colors"
          title="Edit"
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          onClick={() => onDelete(slide.id)}
          className="flex h-8 w-8 items-center justify-center rounded-sm text-[#666] hover:text-[#ef4444] hover:bg-[#1c1c1c] transition-colors"
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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    const formData = new FormData(e.currentTarget);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-[#2a2a2a] bg-[#0a0a0a] rounded-sm">
        <div className="flex items-center justify-between border-b border-[#2a2a2a] px-6 py-4 sticky top-0 bg-[#0a0a0a]">
          <h2 className="text-sm font-bold text-[#f5f5f5] uppercase tracking-wider">
            {mode === 'create' ? 'Tambah Slide Baru' : 'Edit Slide'}
          </h2>
          <button
            onClick={onClose}
            className="text-[#666] hover:text-[#f5f5f5] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div>
            <label className="block text-xs font-bold text-[#a3a3a3] uppercase tracking-wider mb-1.5">
              Eyebrow <span className="text-[#666] normal-case">(opsional)</span>
            </label>
            <input
              type="text"
              name="eyebrow"
              defaultValue={initialData?.eyebrow ?? ''}
              placeholder="Sejak 1998"
              className="w-full bg-[#141414] border border-[#2a2a2a] px-3 py-2 text-sm text-[#f5f5f5] outline-none focus:border-[#f5f5f5] transition-colors rounded-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#a3a3a3] uppercase tracking-wider mb-1.5">
              Judul *
            </label>
            <input
              type="text"
              name="title"
              defaultValue={initialData?.title ?? ''}
              required
              placeholder="BISON DENIM"
              className="w-full bg-[#141414] border border-[#2a2a2a] px-3 py-2 text-sm text-[#f5f5f5] outline-none focus:border-[#f5f5f5] transition-colors rounded-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#a3a3a3] uppercase tracking-wider mb-1.5">
              Deskripsi *
            </label>
            <textarea
              name="description"
              defaultValue={initialData?.description ?? ''}
              required
              rows={2}
              placeholder="Penyedia pakaian denim, kemeja, hoodie, dan produk fashion berkualitas."
              className="w-full bg-[#141414] border border-[#2a2a2a] px-3 py-2 text-sm text-[#f5f5f5] outline-none focus:border-[#f5f5f5] transition-colors resize-none rounded-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#a3a3a3] uppercase tracking-wider mb-1.5">
              URL Gambar *
            </label>
            <input
              type="url"
              name="image"
              defaultValue={initialData?.image ?? ''}
              required
              placeholder="https://images.unsplash.com/..."
              className="w-full bg-[#141414] border border-[#2a2a2a] px-3 py-2 text-sm text-[#f5f5f5] outline-none focus:border-[#f5f5f5] transition-colors rounded-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#a3a3a3] uppercase tracking-wider mb-1.5">
              Alt Text
            </label>
            <input
              type="text"
              name="alt"
              defaultValue={initialData?.alt ?? ''}
              placeholder="Deskripsi gambar untuk aksesibilitas"
              className="w-full bg-[#141414] border border-[#2a2a2a] px-3 py-2 text-sm text-[#f5f5f5] outline-none focus:border-[#f5f5f5] transition-colors rounded-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#a3a3a3] uppercase tracking-wider mb-1.5">
                CTA Label <span className="text-[#666] normal-case">(opsional)</span>
              </label>
              <input
                type="text"
                name="cta_label"
                defaultValue={initialData?.cta_label ?? ''}
                placeholder="Lihat Produk"
                className="w-full bg-[#141414] border border-[#2a2a2a] px-3 py-2 text-sm text-[#f5f5f5] outline-none focus:border-[#f5f5f5] transition-colors rounded-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#a3a3a3] uppercase tracking-wider mb-1.5">
                CTA Link <span className="text-[#666] normal-case">(opsional)</span>
              </label>
              <input
                type="text"
                name="cta_href"
                defaultValue={initialData?.cta_href ?? ''}
                placeholder="/services"
                className="w-full bg-[#141414] border border-[#2a2a2a] px-3 py-2 text-sm text-[#f5f5f5] outline-none focus:border-[#f5f5f5] transition-colors rounded-sm"
              />
            </div>
          </div>

          {mode === 'edit' && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                name="is_visible"
                id="is_visible"
                value="true"
                defaultChecked={initialData?.is_visible ?? true}
                className="h-4 w-4 accent-white"
              />
              <label htmlFor="is_visible" className="text-sm text-[#a3a3a3]">
                Tampilkan slide ini di landing page
              </label>
            </div>
          )}

          {/* Note: checkbox unchecked sends no value, so default to visible on create */}
          {mode === 'create' && (
            <input type="hidden" name="is_visible" value="true" />
          )}

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#2a2a2a]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-[#a3a3a3] hover:text-[#f5f5f5] transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={pending}
              className="bg-[#f5f5f5] text-[#0a0a0a] px-5 py-2 text-sm font-bold rounded-sm hover:bg-white transition-colors disabled:opacity-50"
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
    loadSlides();
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
          <h1 className="text-2xl font-bold text-[#f5f5f5] tracking-tight">Hero Slider</h1>
          <p className="text-sm text-[#666] mt-1">
            Kelola banner utama di landing page
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 border border-[#2a2a2a] bg-[#141414] px-3 py-2 text-xs font-semibold text-[#a3a3a3] hover:text-[#f5f5f5] hover:border-[#f5f5f5] transition-colors rounded-sm"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Preview
          </a>
          <button
            onClick={handleCreate}
            className="flex items-center gap-1.5 bg-[#f5f5f5] text-[#0a0a0a] px-4 py-2 text-xs font-bold rounded-sm hover:bg-white transition-colors"
          >
            <Plus className="h-4 w-4" />
            Tambah Slide
          </button>
        </div>
      </div>

      {/* Slides list */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <p className="text-sm text-[#666]">Memuat...</p>
        </div>
      ) : slides.length === 0 ? (
        <div className="border border-dashed border-[#2a2a2a] bg-[#141414] rounded-sm py-24 text-center">
          <p className="text-sm text-[#a3a3a3] mb-4">Belum ada slide</p>
          <button
            onClick={handleCreate}
            className="inline-flex items-center gap-1.5 bg-[#f5f5f5] text-[#0a0a0a] px-4 py-2 text-xs font-bold rounded-sm hover:bg-white transition-colors"
          >
            <Plus className="h-4 w-4" />
            Tambah Slide Pertama
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs text-[#666] mb-2">
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
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onToggleVisibility={handleToggleVisibility}
                />
              ))}
            </SortableContext>
          </DndContext>
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
