import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { adminAuthClient } from '@/utils/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { brandId, ...updates } = data;
    
    if (!brandId) return NextResponse.json({ error: 'Missing brandId' }, { status: 400 });

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden: Admin only' }, { status: 403 });

    const { error } = await adminAuthClient
      .from('brands')
      .update(updates)
      .eq('id', brandId);

    if (error) throw error;
    
    await adminAuthClient.from('admin_logs').insert({
      admin_id: user.id,
      action: 'admin_edit_brand',
      target_id: brandId,
      details: updates
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
