import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/auth/helpers';
import { slugify } from '@/lib/utils';

export async function POST(request: Request) {
  const supabase = await createServerSupabase();
  const profile = await getCurrentProfile();

  if (!profile) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let title: string;
  let description: string | null = null;

  const contentType = request.headers.get('content-type') ?? '';

  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData();
    title = formData.get('title') as string;
    description = formData.get('description') as string | null;
  } else {
    const body = await request.json();
    title = body.title;
    description = body.description ?? null;
  }

  const slug = slugify(title);

  const { data, error } = await supabase
    .from('pages')
    .insert({
      title,
      slug,
      description,
      created_by: profile.id,
      updated_by: profile.id,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
