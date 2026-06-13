import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const brandId = formData.get('brandId') as string | null;

    if (!file || !brandId) return NextResponse.json({ error: 'Thiếu file hoặc brandId' }, { status: 400 });
    if (file.size > 2 * 1024 * 1024) return NextResponse.json({ error: 'File vượt quá 2MB' }, { status: 400 });
    if (!file.type.startsWith('image/')) return NextResponse.json({ error: 'File phải là ảnh' }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());

    // Anti-spam: check aspect ratio
    const meta = await sharp(buffer).metadata();
    if (meta.width && meta.height) {
      const ratio = meta.width / meta.height;
      if (ratio > 1.8 || ratio < 0.55) {
        return NextResponse.json({ error: 'Logo phải có tỷ lệ gần vuông (không chấp nhận ảnh ngang/dọc quá mức)' }, { status: 400 });
      }
    }

    const supabase = await createClient();
    const urls: Record<string, string> = {};

    for (const size of [64, 128, 256]) {
      const resized = await sharp(buffer)
        .resize({ width: size, height: size, fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
        .webp({ quality: 90 })
        .toBuffer();

      const fileName = `${brandId}/${size}.webp`;
      await supabase.storage.from('logos').upload(fileName, resized, { contentType: 'image/webp', upsert: true });
      const { data } = supabase.storage.from('logos').getPublicUrl(fileName);
      urls[`url_${size}`] = data.publicUrl;
    }

    await supabase.from('logo_uploads').insert({
      brand_id: brandId,
      url_64: urls['url_64'],
      url_128: urls['url_128'],
      url_256: urls['url_256'],
    });

    return NextResponse.json({ success: true, urls });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
