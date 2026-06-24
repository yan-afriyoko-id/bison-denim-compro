import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/auth/helpers';

export async function GET() {
  const supabase = await createServerSupabase();

  const { data, error } = await supabase
    .from('posts')
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
    .from('posts')
    .insert({
      title: body.title,
      slug: body.slug,
      excerpt: body.excerpt ?? null,
      content: body.content ?? null,
      cover_image_url: body.cover_image_url ?? null,
      category_id: body.category_id ?? null,
      author_id: body.author_id ?? profile.id,
      status: body.status ?? 'draft',
      seo_title: body.seo_title ?? null,
      seo_description: body.seo_description ?? null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
