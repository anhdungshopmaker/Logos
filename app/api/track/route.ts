import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const brandId = req.nextUrl.searchParams.get('brandId');
    
    if (!brandId) {
      return NextResponse.json({ error: 'Missing brandId' }, { status: 400 });
    }

    const ip = req.headers.get('x-forwarded-for') || req.ip || '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    const supabase = await createClient();

    // Fire the RPC to increment count and log
    const { error } = await supabase.rpc('increment_click_count', {
      p_brand_id: brandId,
      p_ip: ip,
      p_user_agent: userAgent
    });

    if (error) {
      console.error('Track error:', error);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: false });
  }
}
