import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { generateSlug } from '@/utils/slugify';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, province, industry, description, website, fanpage, phone, google_maps_url } = body;
    if (!name) return NextResponse.json({ error: 'Tên thương hiệu là bắt buộc' }, { status: 400 });

    const supabase = await createClient();
    let baseSlug = generateSlug(name);
    let finalSlug = baseSlug;
    let counter = 1;

    while (true) {
      const { data } = await supabase.from('brands').select('id').eq('slug', finalSlug).maybeSingle();
      if (!data) break;
      finalSlug = `${baseSlug}-${++counter}`;
    }

    const { data: brand, error } = await supabase
      .from('brands')
      .insert({ slug: finalSlug, name, province, industry, description, website, fanpage, phone, google_maps_url, status: 'pending', priority: 1 })
      .select().single();

    if (error) throw error;
    return NextResponse.json({ success: true, brand });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
