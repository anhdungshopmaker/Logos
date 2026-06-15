import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { adminAuthClient } from '@/utils/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const { brandId, proofUrl } = await req.json();
    if (!brandId || !proofUrl) return NextResponse.json({ error: 'Thiếu thông tin yêu cầu' }, { status: 400 });

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Insert claim - Since the client has 'User insert claim' RLS, they could insert directly,
    // but going through API is cleaner and lets us add server-side validation later.
    // Actually, let's use the normal client for insertion since RLS allows it (with check auth.uid() = user_id).
    const { error } = await supabase.from('brand_claims').insert({
      brand_id: brandId,
      user_id: user.id,
      proof_url: proofUrl,
      status: 'pending'
    });

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        return NextResponse.json({ error: 'Bạn đã gửi yêu cầu cho thương hiệu này rồi. Vui lòng chờ.' }, { status: 400 });
      }
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
