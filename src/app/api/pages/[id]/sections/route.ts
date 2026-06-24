import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabase();

  const { data, error } = await supabase
    .from('page_sections')
    .select('*')
    .eq('page_id', id)
    .order('sort_order');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabase();
  const body = await request.json();

  // Get max sort_order
  const { data: maxOrder } = await supabase
    .from('page_sections')
    .select('sort_order')
    .eq('page_id', id)
    .order('sort_order', { ascending: false })
    .limit(1);

  const nextOrder = (maxOrder?.[0]?.sort_order ?? -1) + 1;

  const { data, error } = await supabase
    .from('page_sections')
    .insert({
      page_id: id,
      section_type: body.section_type,
      internal_name: body.section_type.charAt(0).toUpperCase() + body.section_type.slice(1),
      content: {},
      settings: {
        is_visible: true,
        theme_variant: 'default',
        container_width: 'full',
        padding_top: 'normal',
        padding_bottom: 'normal',
      },
      sort_order: nextOrder,
      is_visible: true,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
