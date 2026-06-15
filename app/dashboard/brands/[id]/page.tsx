'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { resizeImage, resizeCoverImage } from '@/utils/image';

export default function UserEditBrandPage({ params }: { params: Promise<{ id: string }> }) {
  const [brand, setBrand] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [newLogo, setNewLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [newCover, setNewCover] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    params.then(async ({ id }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data } = await supabase.from('brands').select('*, logo_uploads(url_128)').eq('id', id).eq('owner_id', user.id).single();
      if (!data) {
        router.push('/dashboard');
        return;
      }
      setBrand(data);
      setLoading(false);
    });
  }, [params, router, supabase]);

  const handleSave = async () => {
    setSaving(true);
    setMsg('');
    try {
      if (newLogo) {
        if (newLogo.size > 2 * 1024 * 1024) throw new Error('Logo không được vượt quá 2MB');
        const [blob64, blob128, blob256] = await Promise.all([
          resizeImage(newLogo, 64), resizeImage(newLogo, 128), resizeImage(newLogo, 256)
        ]);

        const uploadFd = new FormData();
        uploadFd.append('brandId', brand.id);
        uploadFd.append('file_64', blob64, '64.webp');
        uploadFd.append('file_128', blob128, '128.webp');
        uploadFd.append('file_256', blob256, '256.webp');

        const uploadRes = await fetch('/api/upload', { method: 'POST', body: uploadFd });
        if (!uploadRes.ok) {
          const text = await uploadRes.text();
          let errData;
          try { errData = JSON.parse(text); } catch { throw new Error('Lỗi server khi upload ảnh'); }
          throw new Error(errData.error || 'Lỗi upload ảnh');
        }
      }

      if (newCover) {
        if (newCover.size > 5 * 1024 * 1024) throw new Error('Ảnh bìa không được vượt quá 5MB');
        const coverBlob = await resizeCoverImage(newCover, 1200, 400);
        const coverFd = new FormData();
        coverFd.append('brandId', brand.id);
        coverFd.append('cover', coverBlob, 'cover.webp');

        const coverRes = await fetch('/api/upload-cover', { method: 'POST', body: coverFd });
        if (!coverRes.ok) {
          throw new Error('Lỗi upload ảnh bìa');
        }
      }

      // Update directly via Supabase client as per RLS Owner update policy
      const { error } = await supabase.from('brands').update({
        name: brand.name,
        province: brand.province,
        industry: brand.industry,
        description: brand.description,
        website: brand.website,
        fanpage: brand.fanpage,
        phone: brand.phone,
        google_maps_url: brand.google_maps_url,
      }).eq('id', brand.id);

      if (error) throw error;
      
      setMsg('✅ Lưu thành công!');
    } catch (error: any) {
      setMsg('❌ ' + error.message);
    }
    setSaving(false);
    setTimeout(() => setMsg(''), 3000);
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px', background: '#fff',
    border: '1.5px solid #e5e7eb', borderRadius: 8, color: '#111',
    fontSize: '0.95rem', fontFamily: 'inherit', outline: 'none',
  };
  const labelStyle: React.CSSProperties = { display: 'block', fontSize: '0.85rem', color: '#374151', marginBottom: 6, fontWeight: 600 };
  const fieldStyle: React.CSSProperties = { marginBottom: 16 };

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Đang tải...</div>;
  if (!brand) return null;

  const uploads = brand.logo_uploads || [];
  const latestLogo = uploads[uploads.length - 1];
  const logoUrl = latestLogo?.url_128;

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fb', padding: 32, fontFamily: 'var(--font, system-ui)' }}>
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        <Link href="/dashboard" style={{ color: '#6b7280', marginBottom: 24, display: 'inline-block', textDecoration: 'none' }}>← Quay lại Workspace</Link>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#111', marginBottom: 24 }}>Cập nhật thông tin: {brand.name}</h1>

        {msg && <div style={{ padding: 16, background: msg.startsWith('✅') ? '#d1fae5' : '#fee2e2', borderRadius: 8, marginBottom: 24, color: msg.startsWith('✅') ? '#065f46' : '#b91c1c', fontWeight: 500 }}>{msg}</div>}

        <div style={{ background: '#fff', padding: 24, borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid #f3f4f6' }}>
              {(logoPreview || logoUrl)
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={logoPreview || logoUrl} alt="" style={{ width: 72, height: 72, borderRadius: 12, objectFit: 'contain', border: '1px solid #e5e7eb' }} />
                : <div style={{ width: 72, height: 72, borderRadius: 12, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', color: '#9ca3af', fontWeight: 700 }}>{brand.name?.charAt(0)}</div>}
              <div>
                <div style={{ color: '#111', fontWeight: 700, fontSize: '1.1rem' }}>Logo Thương Hiệu</div>
                <div style={{ color: '#6b7280', fontSize: '0.85rem', marginBottom: 8 }}>Kích thước chuẩn (Tỉ lệ 1:1, Tối đa 2MB)</div>
                <label style={{ fontSize: '0.85rem', cursor: 'pointer', background: '#f3f4f6', padding: '6px 12px', borderRadius: 6, fontWeight: 600, color: '#374151', display: 'inline-block' }}>
                  Tải ảnh mới
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => {
                    if (e.target.files && e.target.files[0]) {
                      setNewLogo(e.target.files[0]);
                      setLogoPreview(URL.createObjectURL(e.target.files[0]));
                    }
                  }} />
                </label>
              </div>
            </div>

            <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid #f3f4f6' }}>
              {(coverPreview || brand.cover_url)
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={coverPreview || brand.cover_url} alt="Cover" style={{ width: 160, height: 60, borderRadius: 8, objectFit: 'cover', border: '1px solid #e5e7eb' }} />
                : <div style={{ width: 160, height: 60, borderRadius: 8, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', color: '#9ca3af' }}>Chưa có ảnh bìa</div>}
              <div>
                <div style={{ color: '#111', fontWeight: 700, fontSize: '1.1rem' }}>Ảnh Bìa (Cover Image)</div>
                <div style={{ color: '#6b7280', fontSize: '0.85rem', marginBottom: 8 }}>Kích thước chuẩn (Tỉ lệ 3:1, Tối đa 5MB)</div>
                <label style={{ fontSize: '0.85rem', cursor: 'pointer', background: '#f3f4f6', padding: '6px 12px', borderRadius: 6, fontWeight: 600, color: '#374151', display: 'inline-block' }}>
                  Tải ảnh bìa mới
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => {
                    if (e.target.files && e.target.files[0]) {
                      setNewCover(e.target.files[0]);
                      setCoverPreview(URL.createObjectURL(e.target.files[0]));
                    }
                  }} />
                </label>
              </div>
            </div>

            {[
              ['name', 'Tên thương hiệu *'], ['province', 'Tỉnh / Thành phố *'],
              ['industry', 'Ngành nghề'], ['phone', 'Số điện thoại'],
              ['website', 'Website'], ['fanpage', 'Fanpage'],
              ['google_maps_url', 'Google Maps URL'],
            ].map(([field, label]) => (
              <div key={field} style={field === 'website' || field === 'fanpage' || field === 'google_maps_url' ? { ...fieldStyle, gridColumn: '1 / -1' } : fieldStyle}>
                <label style={labelStyle}>{label}</label>
                <input style={inputStyle} value={brand[field] || ''} onChange={e => setBrand({ ...brand, [field]: e.target.value })} required={field === 'name' || field === 'province'} />
              </div>
            ))}

            <div style={{ ...fieldStyle, gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Mô tả</label>
              <textarea style={{ ...inputStyle, minHeight: 100, resize: 'vertical' }} value={brand.description || ''} onChange={e => setBrand({ ...brand, description: e.target.value })} />
            </div>
          </div>

          <button
            onClick={handleSave} disabled={saving}
            style={{ width: '100%', marginTop: 16, padding: '14px', background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: '1.05rem', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Đang lưu...' : '💾 Lưu thay đổi'}
          </button>
        </div>
      </div>
    </div>
  );
}
