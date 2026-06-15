'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';

function ClaimForm() {
  const [brand, setBrand] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [proofUrl, setProofUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState('');
  
  const searchParams = useSearchParams();
  const brandId = searchParams.get('id');
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function init() {
      if (!brandId) {
        setLoading(false);
        return;
      }
      
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (!user) {
        // Redirect to login if not logged in
        router.push(`/login?redirect=/claim?id=${brandId}`);
        return;
      }

      const { data } = await supabase.from('brands').select('id, name, owner_id').eq('id', brandId).single();
      if (data) setBrand(data);
      setLoading(false);
    }
    init();
  }, [brandId, router, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMsg('');

    try {
      const res = await fetch('/api/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandId, proofUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi gửi yêu cầu');
      setMsg('✅ Đã gửi yêu cầu thành công. Quản trị viên sẽ xem xét sớm nhất!');
    } catch (err: any) {
      setMsg('❌ ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Đang tải...</div>;
  if (!user) return null; // Redirecting to login
  if (!brandId || !brand) return <div style={{ padding: 40, textAlign: 'center' }}>Không tìm thấy thương hiệu</div>;
  
  if (brand.owner_id) {
    return (
      <div style={{ padding: 40, textAlign: 'center', maxWidth: 600, margin: '0 auto' }}>
        <h2>Thương hiệu này đã có chủ sở hữu.</h2>
        <Link href="/" style={{ color: '#0ea5e9', textDecoration: 'underline' }}>Quay lại trang chủ</Link>
      </div>
    );
  }

  return (
    <div style={{ padding: 40, maxWidth: 500, margin: '0 auto', fontFamily: 'var(--font, system-ui)' }}>
      <h1 style={{ fontSize: '1.5rem', marginBottom: 16 }}>Xác nhận sở hữu thương hiệu</h1>
      <p style={{ marginBottom: 24, color: '#4b5563' }}>Bạn đang yêu cầu quyền quản lý cho thương hiệu: <strong style={{ color: '#111' }}>{brand.name}</strong></p>

      {msg ? (
        <div style={{ background: msg.startsWith('✅') ? '#d1fae5' : '#fee2e2', color: msg.startsWith('✅') ? '#065f46' : '#b91c1c', padding: 16, borderRadius: 8, marginBottom: 24 }}>
          {msg}
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Link chứng minh sở hữu (Fanpage / Website có chứa thông tin của bạn)</label>
            <input 
              type="url" required 
              value={proofUrl} onChange={e => setProofUrl(e.target.value)}
              placeholder="https://facebook.com/your-page"
              style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #d1d5db' }}
            />
          </div>
          <button 
            type="submit" disabled={submitting}
            style={{ padding: 12, background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer' }}
          >
            {submitting ? 'Đang gửi...' : 'Gửi yêu cầu xác nhận'}
          </button>
        </form>
      )}

      <div style={{ marginTop: 24, textAlign: 'center' }}>
        <Link href="/" style={{ color: '#6b7280' }}>← Quay lại trang chủ</Link>
      </div>
    </div>
  );
}

export default function ClaimPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: 'center' }}>Đang tải...</div>}>
      <ClaimForm />
    </Suspense>
  );
}
