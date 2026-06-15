import { NextRequest, NextResponse } from 'next/server';
import { adminAuthClient } from '@/utils/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const brandId = formData.get('brandId') as string | null;

    if (!brandId) return NextResponse.json({ error: 'Thiếu brandId' }, { status: 400 });

    const { data: brand } = await adminAuthClient.from('brands').select('owner_id').eq('id', brandId).single();
    if (!brand) return NextResponse.json({ error: 'Thương hiệu không tồn tại' }, { status: 404 });
    
    const ownerFolder = brand.owner_id || 'anonymous';
    const urls: Record<string, string> = {};
    const v = Date.now();

    await Promise.all([64, 128, 256].map(async (size) => {
      const file = formData.get(`file_${size}`) as File | null;
      if (!file) throw new Error(`Thiếu file kích thước ${size}`);

      const buffer = Buffer.from(await file.arrayBuffer());
      const fileName = `${ownerFolder}/${brandId}/${size}.webp`;
      
      const { error: uploadError } = await adminAuthClient.storage.from('logos').upload(fileName, buffer, { contentType: 'image/webp', upsert: true });
      if (uploadError) throw new Error(`Lỗi tải ảnh ${size}: ${uploadError.message}`);
      
      const { data } = adminAuthClient.storage.from('logos').getPublicUrl(fileName);
      urls[`url_${size}`] = `${data.publicUrl}?v=${v}`;
    }));

    await adminAuthClient.from('logo_uploads').delete().eq('brand_id', brandId);
    
    await adminAuthClient.from('logo_uploads').insert({
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
