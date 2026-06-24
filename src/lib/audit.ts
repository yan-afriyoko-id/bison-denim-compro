import { headers } from 'next/headers';
import type { Profile } from '@/types';
import { createAdminClient } from '@/lib/supabase/admin';

interface AuditLogInput {
  profile: Pick<Profile, 'id'> | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown> | null;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
}

export async function createAuditLog({
  profile,
  action,
  entityType,
  entityId = null,
  metadata = null,
  before = null,
  after = null,
}: AuditLogInput) {
  try {
    const headersList = await headers();
    const forwardedFor = headersList.get('x-forwarded-for');
    const ipAddress = forwardedFor?.split(',')[0]?.trim() ?? null;
    const supabase = createAdminClient();

    await supabase.from('audit_logs').insert({
      user_id: profile?.id ?? null,
      action,
      entity_type: entityType,
      entity_id: entityId,
      metadata,
      before_json: before,
      after_json: after,
      ip_address: ipAddress,
    });
  } catch {
    // Best-effort only; audit failures should not block primary mutations.
  }
}

