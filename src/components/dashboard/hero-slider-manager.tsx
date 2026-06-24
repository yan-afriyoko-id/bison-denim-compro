'use client';

import { useState } from 'react';
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
  createHeroSlide,
  updateHeroSlide,
  deleteHeroSlide,
  toggleHeroSlideVisibility,
  reorderHeroSlides,
  getHeroSlides,
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
      className={`flex gap-4 rounded-sm border border-gray-200 bg-white p-4 ${
        isDragging ? 'opacity-80 shadow-lg' : ''
      } ${!slide.is_visible ? 'opacity-50' : ''}`}
    >
      <button
        {...attributes}
        {...listeners}
        className="flex shrink-0 cursor-grab items-center text-gray-300 hover:text-gray-900 active:cursor-grabbing"
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-5 w-5" />
      </button>

      <div className="relative h-20 w-32 shrink-0 overflow-hidden rounded-sm border border-gray-100 bg-gray-50">
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

      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-2">
          <span className="rounded-sm border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-[10px] font-bold text-gray-500">
            #{String(index + 1).padStart(2, '0')}
          </span>
          <span
            className={`rounded-sm border px-1.5 py-0.5 text-[10px] font-bold ${
              slide.is_visible
                ? 'border-green-200 bg-green-50 text-green-700'
                : 'border-gray-200 bg-gray-50 text-gray-500'
            }`}
          >
            {slide.is_visible ? 'Active' : 'Hidden'}
          </span>
        </div>
        {slide.eyebrow && (
          <p className="mb-0.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">
            {slide.eyebrow}
          </p>
        )}
        <h3 className="truncate text-sm font-bold text-gray-900">{slide.title || 'Untitled'}</h3>
        <p className="mt-0.5 truncate text-xs text-gray-500">{slide.description}</p>
        {slide.cta_label && (
          <p className="mt-1 text-[11px] text-gray-400">
            CTA: {slide.cta_label} -&gt; {slide.cta_href}
          </p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <button
          onClick={() => onToggleVisibility(slide.id, !slide.is_visible)}
          className="flex h-8 w-8 items-center justify-center rounded-sm border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700"
          title={slide.is_visible ? 'Hide' : 'Show'}
        >
          {slide.is_visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
        </button>
        <button
          onClick={() => onEdit(slide)}
          className="flex h-8 w-8 items-center justify-center rounded-sm border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700"
          title="Edit"
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          onClick={() => onDelete(slide.id)}
          className="flex h-8 w-8 items-center justify-center rounded-sm border border-gray-200 text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600"
          title="Delete"
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

    if (!title) nextErrors.title = 'Slide title is required.';
    if (!description) nextErrors.description = 'Slide description is required.';
    if (!image) nextErrors.image = 'Slide image is required.';
    if (Boolean(ctaLabel) !== Boolean(ctaHref)) {
      if (!ctaLabel) nextErrors.cta_label = 'CTA label is required when a CTA link is set.';
      if (!ctaHref) nextErrors.cta_href = 'CTA link is required when a CTA label is set.';
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
        toast.success('Slide created successfully');
        onClose();
      }
    } else if (mode === 'edit' && slideId) {
      const result = await updateHeroSlide(slideId, formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Slide updated successfully');
        onClose();
      }
    }
    setPending(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-sm border border-gray-200 bg-white shadow-xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-900">
            {mode === 'create' ? 'Add New Slide' : 'Edit Slide'}
          </h2>
          <button onClick={onClose} className="text-gray-400 transition-colors hover:text-gray-900">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-500">
              Eyebrow <span className="normal-case text-gray-400">(optional)</span>
            </label>
            <input
              type="text"
              name="eyebrow"
              defaultValue={initialData?.eyebrow ?? ''}
              placeholder="Bison Denim"
              className="w-full rounded-sm border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition-colors focus:border-gray-900"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-500">Title *</label>
            <input
              type="text"
              name="title"
              defaultValue={initialData?.title ?? ''}
              required
              placeholder="BISON DENIM"
              className="w-full rounded-sm border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition-colors focus:border-gray-900"
            />
            {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-500">Description *</label>
            <textarea
              name="description"
              defaultValue={initialData?.description ?? ''}
              required
              rows={2}
              placeholder="Quality denim, shirts, hoodies, and everyday fashion essentials."
              className="w-full resize-none rounded-sm border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition-colors focus:border-gray-900"
            />
            {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description}</p>}
          </div>

          <ImageInput
            name="image"
            label="Slide Image"
            required
            defaultValue={initialData?.image ?? ''}
            aspectClass="aspect-video"
            hint="Upload an image or paste an image URL. A 16:9 landscape image works best."
          />
          {errors.image && <p className="-mt-2 text-xs text-red-500">{errors.image}</p>}

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-500">Alt Text</label>
            <input
              type="text"
              name="alt"
              defaultValue={initialData?.alt ?? ''}
              placeholder="Describe the image for accessibility"
              className="w-full rounded-sm border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition-colors focus:border-gray-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-500">
                CTA Label <span className="normal-case text-gray-400">(optional)</span>
              </label>
              <input
                type="text"
                name="cta_label"
                defaultValue={initialData?.cta_label ?? ''}
                placeholder="Shop Now"
                className="w-full rounded-sm border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition-colors focus:border-gray-900"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-500">
                CTA Link <span className="normal-case text-gray-400">(optional)</span>
              </label>
              <input
                type="text"
                name="cta_href"
                defaultValue={initialData?.cta_href ?? ''}
                placeholder="/services"
                className="w-full rounded-sm border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition-colors focus:border-gray-900"
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
                Show this slide on the homepage
              </label>
            </div>
          )}

          {mode === 'create' && <input type="hidden" name="is_visible" value="true" />}

          <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-gray-500 transition-colors hover:text-gray-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending}
              className="rounded-sm bg-gray-900 px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-black disabled:opacity-50"
            >
              {pending ? 'Saving...' : mode === 'create' ? 'Add Slide' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function HeroSliderManager({ initialSlides }: { initialSlides: Slide[] }) {
  const [slides, setSlides] = useState(initialSlides);
  const [loading, setLoading] = useState(false);
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
    const result = await getHeroSlides();
    setSlides(result.slides);
    setLoading(false);
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setSlides((items) => {
      const oldIndex = items.findIndex((i) => i.id === active.id);
      const newIndex = items.findIndex((i) => i.id === over.id);
      const newOrder = arrayMove(items, oldIndex, newIndex);
      const reordered = newOrder.map((item, index) => ({
        ...item,
        sort_order: index,
      }));

      void reorderHeroSlides(
        reordered.map((item) => ({ id: item.id, sort_order: item.sort_order }))
      ).then((result) => {
        if (result.error) {
          toast.error(result.error);
          void loadSlides();
        } else {
          setSlides(reordered);
        }
      });

      return reordered;
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
    if (!confirm('Delete this slide?')) return;
    const result = await deleteHeroSlide(id);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Slide deleted successfully');
      void loadSlides();
    }
  }

  async function handleToggleVisibility(id: string, visible: boolean) {
    const result = await toggleHeroSlideVisibility(id, visible);
    if (result.error) {
      toast.error(result.error);
    } else {
      void loadSlides();
    }
  }

  function handleCloseForm() {
    setEditing(null);
    setEditingData(undefined);
    void loadSlides();
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Hero Slider</h1>
          <p className="mt-1 text-sm text-gray-400">Manage the main homepage banner and slide order.</p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-sm border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600 transition-colors hover:border-gray-900 hover:text-gray-900"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Preview
          </a>
          <button
            onClick={handleCreate}
            className="flex items-center gap-1.5 rounded-sm bg-gray-900 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-black"
          >
            <Plus className="h-4 w-4" />
            Add Slide
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <p className="text-sm text-gray-400">Loading...</p>
        </div>
      ) : slides.length === 0 ? (
        <div className="rounded-sm border border-dashed border-gray-300 bg-white py-24 text-center">
          <p className="mb-4 text-sm text-gray-500">No slides yet</p>
          <button
            onClick={handleCreate}
            className="inline-flex items-center gap-1.5 rounded-sm bg-gray-900 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-black"
          >
            <Plus className="h-4 w-4" />
            Add First Slide
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="mb-2 flex items-center gap-2 text-xs text-gray-400">
            <GripVertical className="h-3.5 w-3.5" />
            <span className="uppercase tracking-wider">Drag to reorder slides</span>
          </div>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={slides.map((slide) => slide.id)} strategy={verticalListSortingStrategy}>
              {slides.map((slide, index) => (
                <SortableSlide
                  key={slide.id}
                  slide={slide}
                  index={index}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onToggleVisibility={handleToggleVisibility}
                />
              ))}
            </SortableContext>
          </DndContext>
          <div className="rounded-sm border border-gray-200 bg-gray-50 px-4 py-3 text-xs text-gray-500">
            {slides.filter((slide) => slide.is_visible).length} active slides out of {slides.length} total
          </div>
        </div>
      )}

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
