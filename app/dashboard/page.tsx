'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';
import styles from '../admin/page.module.css';

export default function UserDashboard() {
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login?redirect=/dashboard');
        return;
      }
      setUser(user);

      const { data } = await supabase
        .from('brands')
        .select('*, logo_uploads(url_64)')
        .eq('owner_id', user.id)
        .neq('status', 'archived')
        .order('created_at', { ascending: false });
        
      setBrands(data || []);
      setLoading(false);
    }
    load();
  }, [router, supabase]);

  const handleArchive = async (brandId: string) => {
    if (!window.confirm('Bạn có chắc muốn lưu trữ thương hiệu này? Nó sẽ không còn hiển thị trên trang chủ nữa.')) return;
    
    // RLS allows Owner update brand
    const { error } = await supabase.from('brands').update({ status: 'archived', archived_at: new Date().toISOString() }).eq('id', brandId);
    if (error) {
      alert('Lỗi: ' + error.message);
    } else {
      setBrands(prev => prev.filter(b => b.id !== brandId));
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Đang tải...</div>;
  if (!user) return null;

  return (
    <div className={styles.layout}>
      {/* Sidebar */}
      <div className={styles.sidebar}>
        <div className={styles.sidebarLogo}>🏢 My Workspace</div>
        <button className={`${styles.navItem} ${styles.active}`}>
          📋 Quản lý thương hiệu
        </button>
        <Link href="/submit" className={styles.navItem}>
          ➕ Thêm thương hiệu
        </Link>
        <Link href="/" className={styles.navItem} style={{ marginTop: 8 }}>
          🌐 Xem trang chủ
        </Link>
        <div className={styles.spacer} />
        <div style={{ fontSize: '0.8rem', color: '#555', padding: '8px 12px' }}>{user.email}</div>
        <button className={`${styles.navItem} ${styles.logoutBtn}`} onClick={handleLogout}>
          🚪 Đăng xuất
        </button>
      </div>

      {/* Main */}
      <div className={styles.main}>
        <h1 className={styles.pageTitle}>Thương hiệu của tôi</h1>
        
        {brands.length === 0 ? (
          <div className={styles.empty}>
            <p>Bạn chưa sở hữu thương hiệu nào.</p>
            <Link href="/submit" style={{ display: 'inline-block', marginTop: 16, padding: '10px 20px', background: '#0ea5e9', color: '#fff', borderRadius: 8, textDecoration: 'none' }}>Thêm thương hiệu ngay</Link>
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Logo</th>
                <th>Tên</th>
                <th>Tỉnh</th>
                <th>Trạng thái</th>
                <th>Clicks</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {brands.map(b => {
                const uploads = b.logo_uploads || [];
                const latestLogo = uploads[uploads.length - 1];
                const logoUrl = latestLogo?.url_64 ? `${latestLogo.url_64}${latestLogo.url_64.includes('?') ? '&' : '?'}t=${Date.now()}` : '';
                return (
                <tr key={b.id}>
                  <td>
                    {logoUrl
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={logoUrl} alt="" className={styles.logoThumb} />
                      : <div className={styles.logoPlaceholder}>{b.name?.charAt(0)}</div>}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#111' }}>{b.name}</div>
                    <div style={{ fontSize: '0.8rem', color: '#666' }}>{b.slug}</div>
                  </td>
                  <td>{b.province || '—'}</td>
                  <td>
                    <span className={`${styles.badge} ${styles[b.status as keyof typeof styles] || ''}`}>
                      {b.status === 'approved' ? '✅ Đang hiển thị' : b.status === 'pending' ? '🕐 Chờ duyệt' : '❌ Từ chối'}
                    </span>
                  </td>
                  <td style={{ color: '#888' }}>{b.click_count || 0}</td>
                  <td>
                    <div className={styles.actions}>
                      {/* We use the same EditBrandPage logic, but maybe we need a user-facing edit page? 
                          Wait, /admin/brands/[id] might work if we restrict it, but it's under /admin.
                          Let's create a specific /dashboard/brands/[id] for users to edit!
                      */}
                      <Link href={`/dashboard/brands/${b.id}`} className={styles.editBtn}>✏️ Sửa</Link>
                      <button className={styles.rejectBtn} onClick={() => handleArchive(b.id)}>🗑️ Lưu trữ</button>
                    </div>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
