import { createServerSupabase } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle, Badge } from '@/components/ui';
import { Settings } from 'lucide-react';

async function getSettings() {
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from('site_settings')
    .select('*')
    .order('key', { ascending: true });
  return data ?? [];
}

export default async function SettingsPage() {
  const settings = await getSettings();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Settings</h1>
        <p className="text-sm text-text-secondary mt-1">
          Pengaturan situs
        </p>
      </div>

      {settings.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-text-secondary">
            <Settings className="h-12 w-12 mb-4 opacity-50" />
            <p>Belum ada pengaturan</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {settings.map((setting) => (
            <Card key={setting.key}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-text-primary">
                    {setting.key}
                  </CardTitle>
                  <Badge variant={setting.is_public ? 'success' : 'default'}>
                    {setting.is_public ? 'public' : 'private'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <pre className="text-xs text-text-muted whitespace-pre-wrap break-all font-mono bg-surface-elevated rounded-md p-3 max-h-32 overflow-y-auto">
                  {typeof setting.value === 'object'
                    ? JSON.stringify(setting.value, null, 2)
                    : String(setting.value)}
                </pre>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
