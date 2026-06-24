import { createServerSupabase } from '@/lib/supabase/server';
import { Card, CardContent, Badge } from '@/components/ui';
import { Users, CheckCircle, XCircle } from 'lucide-react';

async function getUsers() {
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: true });
  return data ?? [];
}

const roleVariants: Record<string, 'accent' | 'success' | 'info' | 'default'> = {
  super_admin: 'accent',
  admin: 'info',
  editor: 'success',
  viewer: 'default',
};

function capitalizeRole(role: string): string {
  return role
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export default async function UsersPage() {
  const users = await getUsers();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Users</h1>
        <p className="text-sm text-text-secondary mt-1">
          Manajemen pengguna
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          {users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-text-secondary">
              <Users className="h-12 w-12 mb-4 opacity-50" />
              <p>Belum ada pengguna</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between px-6 py-4"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-text-primary">
                        {user.full_name ?? 'Unnamed'}
                      </span>
                      <Badge variant={roleVariants[user.role] ?? 'default'}>
                        {capitalizeRole(user.role)}
                      </Badge>
                      {user.is_active ? (
                        <CheckCircle className="h-3.5 w-3.5 text-success" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5 text-danger" />
                      )}
                    </div>
                    <p className="text-xs text-text-muted mt-0.5">
                      {user.id}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-text-muted">
                    <span className={user.is_active ? 'text-success' : 'text-danger'}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
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
