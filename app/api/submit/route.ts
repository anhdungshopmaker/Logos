import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { adminAuthClient } from '@/utils/supabase/admin';
import { generateSlug } from '@/utils/slugify';

async function verifyTurnstile(token: string) {
  const secret = process.env.TURNSTILE_SECRET_KEY || '1x0000000000000000000000000000000AA';
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `secret=${encodeURIComponent(secret)}&response=${encodeURIComponent(token)}`
  });
  const data = await res.json();
  return data.success;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, province, industry, description, website, fanpage, phone, google_maps_url, turnstileToken } = body;
    if (!name) return NextResponse.json({ error: 'Tên thương hiệu là bắt buộc' }, { status: 400 });

    const isValid = await verifyTurnstile(turnstileToken || '');
    if (!isValid) return NextResponse.json({ error: 'Xác thực Captcha thất bại. Vui lòng thử lại.' }, { status: 400 });

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    let baseSlug = generateSlug(name);
    let finalSlug = baseSlug;
    let counter = 1;

    while (true) {
      const { data } = await adminAuthClient.from('brands').select('id').eq('slug', finalSlug).maybeSingle();
      if (!data) break;
      finalSlug = `${baseSlug}-${++counter}`;
    }

    const { data: brand, error } = await adminAuthClient
      .from('brands')
      .insert({ 
        owner_id: user?.id || null,
        slug: finalSlug, 
        name, province, industry, description, website, fanpage, phone, google_maps_url, 
        status: 'pending', priority: 1, package_type: 'free' 
      })
      .select().single();

    if (error) throw error;
    return NextResponse.json({ success: true, brand });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
