import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/auth/helpers';

export async function GET() {
  const supabase = await createServerSupabase();

  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const supabase = await createServerSupabase();
  const profile = await getCurrentProfile();

  if (!profile) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();

  const { data, error } = await supabase
    .from('projects')
    .insert({
      title: body.title,
      slug: body.slug,
      client_name: body.client_name ?? null,
      category_id: body.category_id ?? null,
      location: body.location ?? null,
      project_year: body.project_year ?? null,
      excerpt: body.excerpt ?? null,
      content: body.content ?? null,
      cover_image_url: body.cover_image_url ?? null,
      gallery: body.gallery ?? null,
      is_featured: body.is_featured ?? false,
      status: body.status ?? 'draft',
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
