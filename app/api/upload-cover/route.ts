import { NextRequest, NextResponse } from 'next/server';
import { adminAuthClient } from '@/utils/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const brandId = formData.get('brandId') as string | null;
    const file = formData.get('cover') as File | null;

    if (!brandId || !file) return NextResponse.json({ error: 'Thiếu brandId hoặc file' }, { status: 400 });

    const { data: brand } = await adminAuthClient.from('brands').select('owner_id').eq('id', brandId).single();
    if (!brand) return NextResponse.json({ error: 'Thương hiệu không tồn tại' }, { status: 404 });
    
    const ownerFolder = brand.owner_id || 'anonymous';
    const v = Date.now();

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = `${ownerFolder}/${brandId}/cover.webp`;
    
    const { error: uploadError } = await adminAuthClient.storage.from('logos').upload(fileName, buffer, { contentType: 'image/webp', upsert: true });
    if (uploadError) throw new Error(`Lỗi tải ảnh cover: ${uploadError.message}`);
    
    const { data } = adminAuthClient.storage.from('logos').getPublicUrl(fileName);
    const coverUrl = `${data.publicUrl}?v=${v}`;

    const { error: updateError } = await adminAuthClient.from('brands').update({ cover_url: coverUrl }).eq('id', brandId);
    if (updateError) throw new Error('Lỗi cập nhật CSDL');

    return NextResponse.json({ success: true, coverUrl });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
