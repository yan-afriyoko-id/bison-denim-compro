import { createServerSupabase } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle, Badge } from '@/components/ui';
import { ImageIcon, Upload } from 'lucide-react';
import { formatBytes } from '@/lib/utils';

async function getMedia() {
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from('media')
    .select('*')
    .order('created_at', { ascending: false });
  return data ?? [];
}

export default async function MediaPage() {
  const mediaItems = await getMedia();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Media Library</h1>
        <p className="text-sm text-text-secondary mt-1">
          Kelola file media
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-text-primary">
            <Upload className="h-4 w-4" />
            Upload
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-surface-elevated px-6 py-10 text-text-secondary">
            <Upload className="h-8 w-8 mb-3 opacity-50" />
            <p className="text-sm font-medium">Upload file ke sini</p>
            <p className="text-xs mt-1">File akan diupload langsung ke Supabase Storage</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {mediaItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-text-secondary">
              <ImageIcon className="h-12 w-12 mb-4 opacity-50" />
              <p>Belum ada media</p>
              <p className="text-sm mt-1">Upload media pertama Anda</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-6">
              {mediaItems.map((item) => (
                <div
                  key={item.id}
                  className="group rounded-lg border border-border bg-surface-elevated p-4 hover:border-accent/50 transition-colors"
                >
                  <div className="aspect-video rounded-md bg-surface-muted flex items-center justify-center mb-3">
                    {item.mime_type?.startsWith('image/') ? (
                      <img
                        src={`/api/media/${item.id}`}
                        alt={item.alt_text ?? item.filename}
                        className="w-full h-full object-cover rounded-md"
                      />
                    ) : (
                      <ImageIcon className="h-8 w-8 text-text-muted" />
                    )}
                  </div>
                  <p className="text-sm font-medium text-text-primary truncate">
                    {item.filename}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="default">{item.mime_type}</Badge>
                    <span className="text-xs text-text-muted">
                      {formatBytes(item.size_bytes)}
                    </span>
                  </div>
                  {item.alt_text && (
                    <p className="text-xs text-text-muted mt-2 truncate">
                      {item.alt_text}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
