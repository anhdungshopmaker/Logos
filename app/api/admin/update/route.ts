import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const { brandId, package_type, priority, expires_at } = await req.json();
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const updates: any = {};
    if (package_type !== undefined) updates.package_type = package_type;
    if (priority !== undefined) updates.priority = priority;
    if (expires_at !== undefined) updates.expires_at = expires_at;

    const { error } = await supabase.from('brands').update(updates).eq('id', brandId);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
