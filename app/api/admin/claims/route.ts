import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { adminAuthClient } from '@/utils/supabase/admin';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { data, error } = await adminAuthClient
      .from('brand_claims')
      .select('*, brand:brands(id, name, slug, logo_uploads(url_64))')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { claimId, brandId, userId, action } = await req.json();
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    if (action === 'approve') {
      // Approve claim: update claim status, then update brand owner_id
      await adminAuthClient.from('brand_claims').update({ status: 'approved' }).eq('id', claimId);
      await adminAuthClient.from('brands').update({ owner_id: userId }).eq('id', brandId);
      await adminAuthClient.from('admin_logs').insert({ admin_id: user.id, action: 'approve_claim', target_id: brandId });
    } else if (action === 'reject') {
      // Reject claim
      await adminAuthClient.from('brand_claims').update({ status: 'rejected' }).eq('id', claimId);
      await adminAuthClient.from('admin_logs').insert({ admin_id: user.id, action: 'reject_claim', target_id: brandId });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
