import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { generateSlug } from '@/utils/slugify';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, province, industry, description, website, fanpage, phone, google_maps_url } = body;

    if (!name) {
      return NextResponse.json({ error: 'Tên thương hiệu là bắt buộc' }, { status: 400 });
    }

    const supabase = await createClient();
    let baseSlug = generateSlug(name);
    let finalSlug = baseSlug;
    
    // Check for collision
    let counter = 1;
    let isUnique = false;
    
    while (!isUnique) {
      const { data, error } = await supabase
        .from('brands')
        .select('id')
        .eq('slug', finalSlug)
        .maybeSingle();
        
      if (error) throw error;
      
      if (!data) {
        isUnique = true;
      } else {
        counter++;
        finalSlug = `${baseSlug}-${counter}`;
      }
    }

    // Insert as pending
    const { data: brand, error: insertError } = await supabase
      .from('brands')
      .insert({
        slug: finalSlug,
        name,
        province,
        industry,
        description,
        website,
        fanpage,
        phone,
        google_maps_url,
        status: 'pending',
        priority: 1
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return NextResponse.json({ success: true, brand });
  } catch (error: any) {
    console.error('Submit error:', error);
    return NextResponse.json({ error: error.message || 'Lỗi hệ thống' }, { status: 500 });
  }
}
