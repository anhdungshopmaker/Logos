'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { resizeImage } from '@/utils/image';

export default function EditBrandPage({ params }: { params: Promise<{ id: string }> }) {
  const [brand, setBrand] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [newLogo, setNewLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    params.then(async ({ id }) => {
      const { data } = await supabase.from('brands').select('*, logo_uploads(url_128)').eq('id', id).single();
      setBrand(data);
      setLoading(false);
    });
  }, [params, supabase]);

  const handleSave = async () => {
    setSaving(true);
    setMsg('');
    try {
      if (newLogo) {
        if (newLogo.size > 2 * 1024 * 1024) throw new Error('Logo không được vượt quá 2MB');
        const [blob64, blob128, blob256] = await Promise.all([
          resizeImage(newLogo, 64),
          resizeImage(newLogo, 128),
          resizeImage(newLogo, 256)
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

      const updatePayload = {
        brandId: brand.id,
        name: brand.name, province: brand.province, industry: brand.industry,
        description: brand.description, website: brand.website, fanpage: brand.fanpage,
        phone: brand.phone, zalo: brand.zalo, google_maps_url: brand.google_maps_url,
        priority: brand.priority, package_type: brand.package_type,
        status: brand.status, expires_at: brand.expires_at || null,
      };

      const updateRes = await fetch('/api/admin/update-brand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload),
      });

      if (!updateRes.ok) {
        const text = await updateRes.text();
        let errData;
        try { errData = JSON.parse(text); } catch { throw new Error('Lỗi server khi lưu thông tin'); }
        throw new Error(errData.error || 'Lỗi lưu thông tin');
      }
      
      setMsg('✅ Lưu thành công!');
    } catch (error: any) {
      setMsg('❌ ' + error.message);
    }
    setSaving(false);
    setTimeout(() => setMsg(''), 3000);
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px', background: '#f8f9fb',
    border: '1.5px solid #e5e7eb', borderRadius: 8, color: '#111',
    fontSize: '0.95rem', fontFamily: 'inherit', outline: 'none',
  };

  const labelStyle: React.CSSProperties = { display: 'block', fontSize: '0.82rem', color: '#555', marginBottom: 6, fontWeight: 600 };
  const fieldStyle: React.CSSProperties = { marginBottom: 16 };

  if (loading) return <div style={{ padding: 40, color: '#333', background: '#f0f2f5', minHeight: '100vh' }}>Đang tải...</div>;
  if (!brand) return <div style={{ padding: 40, color: '#333' }}>Không tìm thấy thương hiệu.</div>;

  const uploads = brand.logo_uploads || [];
  const latestLogo = uploads[uploads.length - 1];
  const logoUrl = latestLogo?.url_128;

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5', color: '#111', padding: 32, fontFamily: 'var(--font, system-ui)' }}>
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        <Link href="/admin" style={{ color: '#666', marginBottom: 24, display: 'inline-block' }}>← Quay lại Admin</Link>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#111', marginBottom: 24 }}>✏️ Chỉnh sửa: {brand.name}</h1>

        {msg && <div style={{ padding: 12, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, marginBottom: 16, color: msg.startsWith('✅') ? '#059669' : '#dc2626' }}>{msg}</div>}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
            {(logoPreview || logoUrl)
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={logoPreview || logoUrl} alt="" style={{ width: 64, height: 64, borderRadius: 12, objectFit: 'contain', background: '#fff', border: '1px solid #e5e7eb' }} />
              : <div style={{ width: 64, height: 64, borderRadius: 12, background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', color: '#666' }}>{brand.name?.charAt(0)}</div>}
            <div>
              <div style={{ color: '#111', fontWeight: 700 }}>{brand.name}</div>
              <div style={{ color: '#666', fontSize: '0.85rem' }}>/{brand.slug}</div>
              <div style={{ marginTop: 6 }}>
                <label style={{ fontSize: '0.8rem', cursor: 'pointer', background: '#e5e7eb', padding: '4px 10px', borderRadius: 6, fontWeight: 600, color: '#333' }}>
                  Thay đổi Logo
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => {
                    if (e.target.files && e.target.files[0]) {
                      setNewLogo(e.target.files[0]);
                      setLogoPreview(URL.createObjectURL(e.target.files[0]));
                    }
                  }} />
                </label>
              </div>
            </div>
          </div>

          {[
            ['name', 'Tên thương hiệu'], ['province', 'Tỉnh/Thành'], ['industry', 'Ngành nghề'],
            ['phone', 'Số điện thoại'], ['zalo', 'Zalo (Chat)'], ['website', 'Website'], ['fanpage', 'Fanpage'],
            ['google_maps_url', 'Google Maps URL']
          ].map(([field, label]) => (
            <div key={field} style={field === 'website' || field === 'fanpage' || field === 'google_maps_url' || field === 'zalo' ? { ...fieldStyle, gridColumn: '1 / -1' } : fieldStyle}>
              <label style={labelStyle}>{label}</label>
              <input style={inputStyle} value={brand[field] || ''} onChange={e => setBrand({ ...brand, [field]: e.target.value })} />
            </div>
          ))}

          <div style={{ ...fieldStyle, gridColumn: '1 / -1' }}>
            <label style={labelStyle}>Mô tả</label>
            <textarea style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} value={brand.description || ''} onChange={e => setBrand({ ...brand, description: e.target.value })} />
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Trạng thái</label>
            <select style={inputStyle} value={brand.status} onChange={e => setBrand({ ...brand, status: e.target.value })}>
              <option value="pending">Chờ duyệt</option>
              <option value="approved">Đã duyệt</option>
              <option value="rejected">Từ chối</option>
            </select>
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Gói dịch vụ</label>
            <select style={inputStyle} value={brand.package_type || 'free'}
              onChange={e => {
                const pkgMap: Record<string, number> = { free: 1, standard: 5, premium: 20, diamond: 50 };
                setBrand({ ...brand, package_type: e.target.value, priority: pkgMap[e.target.value] });
              }}>
              <option value="free">Free (Priority 1)</option>
              <option value="standard">Standard (Priority 5)</option>
              <option value="premium">Premium (Priority 20)</option>
              <option value="diamond">Diamond (Priority 50)</option>
            </select>
          </div>

          <div style={{ ...fieldStyle, gridColumn: '1 / -1' }}>
            <label style={labelStyle}>Ngày hết hạn gói (expires_at)</label>
            <input type="datetime-local" style={inputStyle}
              value={brand.expires_at ? brand.expires_at.slice(0, 16) : ''}
              onChange={e => setBrand({ ...brand, expires_at: e.target.value ? new Date(e.target.value).toISOString() : null })} />
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          style={{ marginTop: 8, padding: '14px 32px', background: '#fff', color: '#111', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: '1rem', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1 }}>
          {saving ? 'Đang lưu...' : '💾 Lưu thay đổi'}
        </button>
      </div>
    </div>
  );
}
