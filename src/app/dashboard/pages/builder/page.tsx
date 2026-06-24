'use client';

import { useState, useCallback, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button, Input, Card, CardContent, Badge } from '@/components/ui';
import { sectionTypeLabels } from '@/config/site';
import {
  Plus,
  Eye,
  EyeOff,
  Trash2,
  GripVertical,
  Save,
  Send,
  ArrowLeft,
} from 'lucide-react';
import type { Page, PageSection, SectionType } from '@/types';

export default function PageBuilderPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pageId = searchParams.get('id');

  const [page, setPage] = useState<Page | null>(null);
  const [sections, setSections] = useState<PageSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');

  useEffect(() => {
    async function load() {
      if (!pageId) {
        setLoading(false);
        return;
      }

      const [pageRes, sectionsRes] = await Promise.all([
        fetch(`/api/pages/${pageId}`),
        fetch(`/api/pages/${pageId}/sections`),
      ]);

      if (pageRes.ok) {
        const pageData = await pageRes.json();
        setPage(pageData);
        setTitle(pageData.title);
        setSlug(pageData.slug);
      }

      if (sectionsRes.ok) {
        const sectionsData = await sectionsRes.json();
        setSections(sectionsData.sort((a: PageSection, b: PageSection) => a.sort_order - b.sort_order));
      }

      setLoading(false);
    }

    load();
  }, [pageId]);

  const addSection = useCallback(async (type: SectionType) => {
    if (!pageId) return;

    const res = await fetch(`/api/pages/${pageId}/sections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ section_type: type }),
    });

    if (res.ok) {
      const newSection = await res.json();
      setSections((prev) => [...prev, newSection]);
    }
  }, [pageId]);

  const removeSection = useCallback(async (sectionId: string) => {
    const res = await fetch(`/api/sections/${sectionId}`, {
      method: 'DELETE',
    });

    if (res.ok) {
      setSections((prev) => prev.filter((s) => s.id !== sectionId));
    }
  }, []);

  const toggleVisibility = useCallback(async (sectionId: string, current: boolean) => {
    const res = await fetch(`/api/sections/${sectionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_visible: !current }),
    });

    if (res.ok) {
      setSections((prev) =>
        prev.map((s) =>
          s.id === sectionId ? { ...s, is_visible: !current } : s
        )
      );
    }
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  if (!pageId) {
    return <CreatePageForm />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard/pages')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">{page?.title ?? 'Page Builder'}</h1>
            <p className="text-sm text-text-secondary">/{slug}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm">
            <Save className="h-4 w-4" />
            Save Draft
          </Button>
          <Button size="sm">
            <Send className="h-4 w-4" />
            Publish
          </Button>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="flex-1 space-y-3">
          {sections.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-text-secondary">
                <p>Belum ada section</p>
                <p className="text-sm mt-1">Tambahkan section pertama Anda</p>
              </CardContent>
            </Card>
          ) : (
            sections.map((section, index) => (
              <Card key={section.id} className="relative">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="cursor-grab text-text-muted hover:text-text-secondary">
                    <GripVertical className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-text-muted font-mono">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <span className="text-sm font-medium text-text-primary">
                        {section.internal_name || sectionTypeLabels[section.section_type] || section.section_type}
                      </span>
                      <Badge variant="default" className="text-xs">
                        {sectionTypeLabels[section.section_type] ?? section.section_type}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleVisibility(section.id, section.is_visible)}
                    >
                      {section.is_visible ? (
                        <Eye className="h-4 w-4" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-text-muted" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeSection(section.id)}
                      className="text-danger hover:text-danger"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <div className="w-64 shrink-0">
          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm font-medium text-text-primary mb-3">Add Section</h3>
              <div className="space-y-1">
                {Object.entries(sectionTypeLabels).map(([type, label]) => (
                  <button
                    key={type}
                    onClick={() => addSection(type as SectionType)}
                    className="w-full rounded-md px-3 py-2 text-left text-xs text-text-secondary hover:bg-surface-elevated hover:text-text-primary transition-colors"
                  >
                    + {label}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function CreatePageForm() {
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const formData = new FormData();
    formData.set('title', title);

    const res = await fetch('/api/pages', {
      method: 'POST',
      body: formData,
    });

    if (res.ok) {
      const data = await res.json();
      router.push(`/dashboard/pages/builder?id=${data.id}`);
    } else {
      const err = await res.json();
      setError(err.error ?? 'Gagal membuat halaman');
    }
  }

  return (
    <div className="max-w-md mx-auto pt-20">
      <Card>
        <CardContent className="p-6 space-y-4">
          <h1 className="text-xl font-bold text-text-primary">Buat Halaman Baru</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              id="title"
              label="Judul Halaman"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Masukkan judul halaman"
            />
            {error && <p className="text-sm text-danger">{error}</p>}
            <Button type="submit" className="w-full">Buat Halaman</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
