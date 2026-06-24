import { createServerSupabase } from '@/lib/supabase/server';
import { Card, CardContent, Badge, Button } from '@/components/ui';
import { Plus, FolderKanban, Star } from 'lucide-react';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';

async function getProjects() {
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });
  return data ?? [];
}

const statusVariants: Record<string, 'accent' | 'success' | 'default' | 'warning'> = {
  published: 'success',
  draft: 'warning',
  archived: 'default',
};

export default async function ProjectsPage() {
  const projects = await getProjects();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Projects</h1>
          <p className="text-sm text-text-secondary mt-1">
            Kelola portofolio proyek
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/projects/new">
            <Plus className="h-4 w-4" />
            Proyek Baru
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-text-secondary">
              <FolderKanban className="h-12 w-12 mb-4 opacity-50" />
              <p>Belum ada proyek</p>
              <p className="text-sm mt-1">Buat proyek pertama Anda</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="flex items-center justify-between px-6 py-4"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/dashboard/projects/${project.id}`}
                        className="text-sm font-medium text-text-primary hover:text-accent transition-colors"
                      >
                        {project.title}
                      </Link>
                      <Badge variant={statusVariants[project.status] ?? 'default'}>
                        {project.status}
                      </Badge>
                      {project.is_featured && (
                        <Badge variant="accent">
                          <Star className="h-3 w-3 mr-1" />
                          featured
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-text-muted mt-0.5">
                      {project.client_name ? project.client_name : <span className="italic">/{project.slug}</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-text-muted">
                    <span>{formatDate(project.created_at)}</span>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/dashboard/projects/${project.id}`}>
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
