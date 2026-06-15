'use client';
import { useState } from 'react';
import Link from 'next/link';
import Script from 'next/script';
import styles from './page.module.css';
import { resizeImage } from '@/utils/image';

export default function SubmitPage() {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    try {
      const fd = new FormData(e.currentTarget);
      const file = fd.get('file') as File;
      if (!file || file.size === 0) throw new Error('Vui lòng chọn logo');
      if (file.size > 2 * 1024 * 1024) throw new Error('Logo không được vượt quá 2MB');

      // Xử lý ảnh ở phía Client để tránh Vercel timeout và lỗi thư viện sharp
      const [blob64, blob128, blob256] = await Promise.all([
        resizeImage(file, 64),
        resizeImage(file, 128),
        resizeImage(file, 256)
      ]);

      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fd.get('name'), province: fd.get('province'), industry: fd.get('industry'),
          description: fd.get('description'), website: fd.get('website'),
          fanpage: fd.get('fanpage'), phone: fd.get('phone'), google_maps_url: fd.get('google_maps_url'),
          turnstileToken: fd.get('cf-turnstile-response')
        }),
      });
      
      let submitData;
      const submitText = await res.text();
      try {
        submitData = JSON.parse(submitText);
      } catch {
        throw new Error(`Lỗi hệ thống (Submit ${res.status}): Không thể xử lý phản hồi từ server.`);
      }

      if (!res.ok) throw new Error(submitData.error || 'Lỗi không xác định khi đăng ký');

      const uploadFd = new FormData();
      uploadFd.append('brandId', submitData.brand.id);
      uploadFd.append('file_64', blob64, '64.webp');
      uploadFd.append('file_128', blob128, '128.webp');
      uploadFd.append('file_256', blob256, '256.webp');
      
      const uploadRes = await fetch('/api/upload', { method: 'POST', body: uploadFd });
      let uploadData;
      const uploadText = await uploadRes.text();
      try {
        uploadData = JSON.parse(uploadText);
      } catch {
        throw new Error(`Lỗi hệ thống (Upload ${uploadRes.status}): Không thể xử lý phản hồi từ server.`);
      }

      if (!uploadRes.ok) throw new Error(uploadData.error || 'Lỗi không xác định khi tải ảnh');

      setMsg({ type: 'success', text: 'Đăng ký thành công! Thương hiệu đang chờ duyệt.' });
      (e.target as HTMLFormElement).reset();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Đăng ký Thương Hiệu</h1>
        <p className={styles.subtitle}>Thêm thương hiệu của bạn vào Brand Wall Vietnam</p>
      </div>
      <form className={styles.form} onSubmit={handleSubmit}>
        {msg && <div className={`${styles.message} ${styles[msg.type]}`}>{msg.text}</div>}
        <div className={styles.field}><label className={styles.label}>Tên thương hiệu *</label>
          <input name="name" required className={styles.input} placeholder="VD: QLady Spa" /></div>
        <div className={styles.field}><label className={styles.label}>Logo (PNG/JPG/WEBP, tỷ lệ vuông, max 2MB) *</label>
          <input name="file" type="file" accept="image/*" required className={styles.fileInput} /></div>
        <div className={styles.field}><label className={styles.label}>Tỉnh / Thành phố *</label>
          <input name="province" required className={styles.input} placeholder="VD: Nha Trang" /></div>
        <div className={styles.field}><label className={styles.label}>Ngành nghề</label>
          <input name="industry" className={styles.input} placeholder="VD: Spa, Nail, Nhà hàng..." /></div>
        <div className={styles.field}><label className={styles.label}>Mô tả ngắn</label>
          <textarea name="description" className={styles.textarea} placeholder="Giới thiệu về thương hiệu..." /></div>
        <div className={styles.field}><label className={styles.label}>Website</label>
          <input name="website" type="url" className={styles.input} placeholder="https://..." /></div>
        <div className={styles.field}><label className={styles.label}>Fanpage</label>
          <input name="fanpage" type="url" className={styles.input} placeholder="https://facebook.com/..." /></div>
        <div className={styles.field}><label className={styles.label}>Số điện thoại</label>
          <input name="phone" type="tel" className={styles.input} placeholder="090..." /></div>
        <div className={styles.field}><label className={styles.label}>Google Maps URL</label>
          <input name="google_maps_url" type="url" className={styles.input} placeholder="https://maps.app.goo.gl/..." /></div>
        
        <div style={{ margin: '15px 0' }}>
          <div className="cf-turnstile" data-sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'} />
        </div>

        <button type="submit" disabled={loading} className={styles.button}>
          {loading ? 'Đang xử lý...' : 'Gửi Yêu Cầu'}
        </button>
        <div style={{ textAlign: 'center' }}>
          <Link href="/" style={{ color: '#666' }}>← Quay lại trang chủ</Link>
        </div>
      </form>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />
    </div>
  );
}
