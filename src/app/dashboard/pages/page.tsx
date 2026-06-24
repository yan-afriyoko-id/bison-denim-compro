import { createServerSupabase } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle, Badge, Button } from '@/components/ui';
import { Plus, FileText, ExternalLink } from 'lucide-react';
import Link from 'next/link';

async function getPages() {
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from('pages')
    .select('*')
    .order('updated_at', { ascending: false });
  return data ?? [];
}

const statusVariants: Record<string, 'accent' | 'success' | 'default' | 'warning'> = {
  published: 'success',
  draft: 'warning',
  archived: 'default',
};

export default async function PagesPage() {
  const pages = await getPages();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Pages</h1>
          <p className="text-sm text-text-secondary mt-1">
            Kelola halaman landing page
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/pages/builder">
            <Plus className="h-4 w-4" />
            Halaman Baru
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {pages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-text-secondary">
              <FileText className="h-12 w-12 mb-4 opacity-50" />
              <p>Belum ada halaman</p>
              <p className="text-sm mt-1">Buat halaman pertama Anda</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {pages.map((page) => (
                <div
                  key={page.id}
                  className="flex items-center justify-between px-6 py-4"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/dashboard/pages/builder?id=${page.id}`}
                        className="text-sm font-medium text-text-primary hover:text-accent transition-colors"
                      >
                        {page.title}
                      </Link>
                      <Badge variant={statusVariants[page.status] ?? 'default'}>
                        {page.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-text-muted mt-0.5">
                      /{page.slug}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {page.status === 'published' && (
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/${page.slug}`} target="_blank">
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/dashboard/pages/builder?id=${page.id}`}>
                        Edit
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
