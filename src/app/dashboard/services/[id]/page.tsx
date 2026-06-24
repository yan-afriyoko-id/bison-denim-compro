'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Button,
  Input,
} from '@/components/ui';
import { slugify } from '@/lib/utils';
import { updateService, deleteService } from '@/actions/services.actions';
import { ArrowLeft, Trash2 } from 'lucide-react';
import Link from 'next/link';
import type { Service } from '@/types';

export default function EditServicePage() {
  const router = useRouter();
  const params = useParams();
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState('');
  const [slugVal, setSlugVal] = useState('');
  const [slugEdited, setSlugEdited] = useState(false);

  useEffect(() => {
    async function fetchService() {
      try {
        const res = await fetch(`/api/services/${params.id}`);
        if (res.ok) {
          const data = await res.json();
          setService(data);
          setTitle(data.title);
          setSlugVal(data.slug);
        }
      } catch {
        // ignore
      }
      setLoading(false);
    }
    fetchService();
  }, [params.id]);

  function handleTitleChange(value: string) {
    setTitle(value);
    if (!slugEdited) {
      setSlugVal(slugify(value));
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!service) return;
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const result = await updateService(service.id, formData);

    if (result.error) {
      alert(result.error);
      setIsSubmitting(false);
      return;
    }

    router.push('/dashboard/services');
    router.refresh();
  }

  async function handleDelete() {
    if (!service) return;
    if (!confirm('Hapus layanan ini?')) return;

    const result = await deleteService(service.id);
    if (result.error) {
      alert(result.error);
      return;
    }

    router.push('/dashboard/services');
    router.refresh();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-text-secondary">
        Memuat...
      </div>
    );
  }

  if (!service) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-text-secondary">
        <p>Layanan tidak ditemukan</p>
        <Button variant="secondary" className="mt-4" asChild>
          <Link href="/dashboard/services">Kembali</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/services">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-text-primary">Edit Layanan</h1>
          <p className="text-sm text-text-secondary mt-1">
            Perbarui detail layanan
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Informasi Layanan</CardTitle>
            <CardDescription>
              Ubah detail layanan yang akan ditampilkan
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              id="title"
              name="title"
              label="Judul"
              placeholder="Masukkan judul layanan"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              required
            />
            <Input
              id="slug"
              name="slug"
              label="Slug"
              placeholder="auto-generated"
              value={slugVal}
              onChange={(e) => {
                setSlugEdited(true);
                setSlugVal(e.target.value);
              }}
            />
            <div className="space-y-1.5">
              <label
                htmlFor="excerpt"
                className="block text-sm font-medium text-text-secondary"
              >
                Excerpt
              </label>
              <textarea
                id="excerpt"
                name="excerpt"
                rows={3}
                defaultValue={service.excerpt ?? ''}
                className="flex w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Deskripsi singkat layanan"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                id="icon"
                name="icon"
                label="Icon"
                placeholder="Nama icon (opsional)"
                defaultValue={service.icon ?? ''}
              />
              <Input
                id="cover_image_url"
                name="cover_image_url"
                label="Cover Image URL"
                placeholder="https://..."
                defaultValue={service.cover_image_url ?? ''}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="status"
                  className="block text-sm font-medium text-text-secondary"
                >
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  defaultValue={service.status}
                  className="flex h-10 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <Input
                id="sort_order"
                name="sort_order"
                label="Sort Order"
                type="number"
                defaultValue={service.sort_order}
              />
              <div className="flex items-end pb-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_featured"
                    value="true"
                    defaultChecked={service.is_featured}
                    className="h-4 w-4 rounded border-border bg-surface text-accent focus:ring-accent"
                  />
                  <span className="text-sm font-medium text-text-secondary">
                    Featured
                  </span>
                </label>
              </div>
            </div>
          </CardContent>
          <CardFooter className="justify-between border-t border-border">
            <Button
              type="button"
              variant="danger"
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4" />
              Hapus
            </Button>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.back()}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </div>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
