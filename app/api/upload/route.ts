import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const brandId = formData.get('brandId') as string | null;

    if (!file || !brandId) {
      return NextResponse.json({ error: 'Thiếu file hoặc brandId' }, { status: 400 });
    }

    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: 'Kích thước file vượt quá 2MB' }, { status: 400 });
    }

    // Verify it's an image
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File không đúng định dạng ảnh' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Anti-spam: Aspect ratio check
    const metadata = await sharp(buffer).metadata();
    if (metadata.width && metadata.height) {
      const ratio = metadata.width / metadata.height;
      if (ratio > 1.8 || ratio < 0.55) {
        return NextResponse.json({ error: 'Vui lòng upload Logo có tỷ lệ gần vuông (không hỗ trợ ảnh quá ngang hoặc quá dọc)' }, { status: 400 });
      }
    }

    const supabase = await createClient();

    const sizes = [64, 128, 256];
    const urls: Record<string, string> = {};

    for (const size of sizes) {
      // Create white canvas and fit image into it without distortion
      const resizedBuffer = await sharp(buffer)
        .resize({
          width: size,
          height: size,
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 1 } // White background
        })
        .webp({ quality: 90 }) // Optimize format
        .toBuffer();

      const fileName = `${brandId}/${size}.webp`;
      
      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(fileName, resizedBuffer, {
          contentType: 'image/webp',
          upsert: true
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage.from('logos').getPublicUrl(fileName);
      urls[`url_${size}`] = data.publicUrl;
    }

    // Save to logo_uploads table
    const { error: dbError } = await supabase
      .from('logo_uploads')
      .insert({
        brand_id: brandId,
        url_64: urls['url_64'],
        url_128: urls['url_128'],
        url_256: urls['url_256'],
      });

    if (dbError) throw dbError;

    return NextResponse.json({ success: true, urls });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: error.message || 'Lỗi hệ thống' }, { status: 500 });
  }
}
