'use client';

import { useState } from 'react';
import styles from './page.module.css';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';

export default function SubmitPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const formData = new FormData(e.currentTarget);
      const file = formData.get('file') as File;
      const name = formData.get('name') as string;
      const province = formData.get('province') as string;
      const industry = formData.get('industry') as string;
      const description = formData.get('description') as string;
      const website = formData.get('website') as string;
      const fanpage = formData.get('fanpage') as string;
      const phone = formData.get('phone') as string;
      const google_maps_url = formData.get('google_maps_url') as string;

      if (!file || file.size === 0) {
        throw new Error('Vui lòng chọn logo');
      }

      if (file.size > 2 * 1024 * 1024) {
        throw new Error('Logo không được vượt quá 2MB');
      }

      // 1. Submit brand info
      const submitRes = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, province, industry, description, website, fanpage, phone, google_maps_url })
      });

      const submitData = await submitRes.json();
      if (!submitRes.ok) throw new Error(submitData.error || 'Lỗi gửi thông tin');

      const brand = submitData.brand;

      // 2. Upload file to our Next.js API
      const uploadData = new FormData();
      uploadData.append('file', file);
      uploadData.append('brandId', brand.id);

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: uploadData,
      });

      const uploadResult = await uploadRes.json();

      if (!uploadRes.ok) {
        throw new Error(uploadResult.error || 'Lỗi upload ảnh');
      }

      // 3. (Optional) Insert into brand_submissions if we had auth (User ID)
      // For MVP without forced auth, we can skip or log as anonymous if allowed by schema.

      setMessage({ type: 'success', text: 'Đăng ký thành công! Thương hiệu của bạn đang chờ duyệt.' });
      (e.target as HTMLFormElement).reset();

    } catch (err: any) {
      console.error(err);
      setMessage({ type: 'error', text: err.message || 'Có lỗi xảy ra, vui lòng thử lại sau.' });
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
        {message && (
          <div className={`${styles.message} ${styles[message.type]}`}>
            {message.text}
          </div>
        )}

        <div className={styles.field}>
          <label className={styles.label}>Tên thương hiệu *</label>
          <input name="name" type="text" required className={styles.input} placeholder="VD: QLady Spa" />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Logo (PNG, JPG, SVG - Max 2MB) *</label>
          <input name="file" type="file" accept="image/png, image/jpeg, image/webp, image/svg+xml" required className={styles.fileInput} />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Tỉnh / Thành phố *</label>
          <input name="province" type="text" required className={styles.input} placeholder="VD: Hà Nội" />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Ngành nghề</label>
          <input name="industry" type="text" className={styles.input} placeholder="VD: Làm đẹp" />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Mô tả ngắn</label>
          <textarea name="description" className={styles.textarea} placeholder="Giới thiệu ngắn gọn về thương hiệu..."></textarea>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Website</label>
          <input name="website" type="url" className={styles.input} placeholder="https://" />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Fanpage</label>
          <input name="fanpage" type="url" className={styles.input} placeholder="https://facebook.com/..." />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Số điện thoại</label>
          <input name="phone" type="tel" className={styles.input} placeholder="090..." />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Google Maps URL</label>
          <input name="google_maps_url" type="url" className={styles.input} placeholder="https://maps.app.goo.gl/..." />
        </div>

        <button type="submit" disabled={loading} className={styles.button}>
          {loading ? 'Đang xử lý...' : 'Gửi Yêu Cầu'}
        </button>

        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <Link href="/" style={{ color: '#666', textDecoration: 'none' }}>
            Quay lại trang chủ
          </Link>
        </div>
      </form>
    </div>
  );
}
