'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import styles from './page.module.css';

const PACKAGE_OPTIONS = [
  { value: 'free', label: 'Free', priority: 1 },
  { value: 'standard', label: 'Standard', priority: 5 },
  { value: 'premium', label: 'Premium', priority: 20 },
  { value: 'diamond', label: 'Diamond', priority: 50 },
];

export default function AdminDashboard() {
  const [tab, setTab] = useState<'pending' | 'all' | 'rejected' | 'stats'>('pending');
  const [brands, setBrands] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, topClicked: [] as any[] });
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState('');
  const supabase = createClient();
  const router = useRouter();

  const loadData = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('brands')
      .select('*, logo_uploads(url_64)')
      .order('created_at', { ascending: false });
      
    if (tab === 'pending') query = query.eq('status', 'pending');
    else if (tab === 'rejected') query = query.eq('status', 'rejected');
    else if (tab === 'all') query = query.neq('status', 'rejected');
    
    const { data } = await query;
    setBrands(data || []);
    setLoading(false);
  }, [tab, supabase]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUserEmail(data.user.email || '');
    });
  }, [supabase]);

  useEffect(() => {
    if (tab === 'stats') {
      Promise.all([
        supabase.from('brands').select('id', { count: 'exact', head: true }).neq('status', 'rejected'),
        supabase.from('brands').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('brands').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
        supabase.from('brands').select('id, name, click_count').eq('status', 'approved').order('click_count', { ascending: false }).limit(10),
      ]).then(([all, pend, appr, top]) => {
        setStats({
          total: all.count || 0,
          pending: pend.count || 0,
          approved: appr.count || 0,
          topClicked: (top.data || []),
        });
        setLoading(false);
      });
    } else {
      loadData();
    }
  }, [tab, loadData, supabase]);

  const handleStatus = async (brandId: string, status: 'approved' | 'rejected') => {
    await fetch('/api/admin/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brandId, status }),
    });
    setBrands(prev => prev.filter(b => tab === 'pending' ? b.id !== brandId : true).map(b => b.id === brandId ? { ...b, status } : b));
  };

  const handleDelete = async (brandId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa vĩnh viễn thương hiệu này khỏi hệ thống? Hành động này không thể hoàn tác.')) return;
    await fetch('/api/admin/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brandId }),
    });
    setBrands(prev => prev.filter(b => b.id !== brandId));
  };

  const handlePriority = async (brandId: string, packageType: string) => {
    const pkg = PACKAGE_OPTIONS.find(p => p.value === packageType);
    await fetch('/api/admin/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brandId, package_type: packageType, priority: pkg?.priority }),
    });
    setBrands(prev => prev.map(b => b.id === brandId ? { ...b, package_type: packageType } : b));
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/admin/login');
  };

  return (
    <div className={styles.layout}>
      {/* Sidebar */}
      <div className={styles.sidebar}>
        <div className={styles.sidebarLogo}>🛡️ Admin Panel</div>
        <button className={`${styles.navItem} ${tab === 'pending' ? styles.active : ''}`} onClick={() => setTab('pending')}>
          🕐 Chờ duyệt
        </button>
        <button className={`${styles.navItem} ${tab === 'all' ? styles.active : ''}`} onClick={() => setTab('all')}>
          📋 Tất cả thương hiệu
        </button>
        <button className={`${styles.navItem} ${tab === 'rejected' ? styles.active : ''}`} onClick={() => setTab('rejected')}>
          🗑️ Đã từ chối
        </button>
        <button className={`${styles.navItem} ${tab === 'stats' ? styles.active : ''}`} onClick={() => setTab('stats')}>
          📊 Thống kê
        </button>
        <Link href="/" className={styles.navItem} style={{ marginTop: 8 }}>
          🌐 Xem trang chủ
        </Link>
        <div className={styles.spacer} />
        <div style={{ fontSize: '0.8rem', color: '#555', padding: '8px 12px' }}>{userEmail}</div>
        <button className={`${styles.navItem} ${styles.logoutBtn}`} onClick={handleLogout}>
          🚪 Đăng xuất
        </button>
      </div>

      {/* Main */}
      <div className={styles.main}>
        {tab === 'pending' && (
          <>
            <h1 className={styles.pageTitle}>Chờ Duyệt</h1>
            {loading ? <div className={styles.empty}>Đang tải...</div> :
              brands.length === 0 ? <div className={styles.empty}>✅ Không có thương hiệu nào đang chờ duyệt!</div> :
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Logo</th>
                    <th>Thương hiệu</th>
                    <th>Tỉnh</th>
                    <th>Ngành</th>
                    <th>Ngày đăng</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {brands.map(b => (
                    <tr key={b.id}>
                      <td>
                        {b.logo_uploads?.[0]?.url_64
                          // eslint-disable-next-line @next/next/no-img-element
                          ? <img src={`${b.logo_uploads[0].url_64}${b.logo_uploads[0].url_64.includes('?') ? '&' : '?'}t=${Date.now()}`} alt="" className={styles.logoThumb} />
                          : <div className={styles.logoPlaceholder}>{b.name?.charAt(0)}</div>}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#111' }}>{b.name}</div>
                        <div style={{ fontSize: '0.8rem', color: '#666' }}>{b.slug}</div>
                      </td>
                      <td>{b.province || '—'}</td>
                      <td>{b.industry || '—'}</td>
                      <td style={{ color: '#666', fontSize: '0.82rem' }}>{new Date(b.created_at).toLocaleDateString('vi-VN')}</td>
                      <td>
                        <div className={styles.actions}>
                          <button className={styles.approveBtn} onClick={() => handleStatus(b.id, 'approved')}>✅ Duyệt</button>
                          <button className={styles.rejectBtn} onClick={() => handleStatus(b.id, 'rejected')}>❌ Từ chối</button>
                          <Link href={`/admin/brands/${b.id}`} className={styles.editBtn}>✏️ Sửa</Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            }
          </>
        )}

        {(tab === 'all' || tab === 'rejected') && (
          <>
            <h1 className={styles.pageTitle}>{tab === 'all' ? 'Tất cả Thương Hiệu' : 'Đã từ chối'}</h1>
            {loading ? <div className={styles.empty}>Đang tải...</div> :
              brands.length === 0 ? <div className={styles.empty}>Không có dữ liệu</div> :
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Logo</th>
                    <th>Tên</th>
                    <th>Tỉnh</th>
                    <th>Trạng thái</th>
                    <th>Gói</th>
                    <th>Clicks</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {brands.map(b => (
                    <tr key={b.id}>
                      <td>
                        {b.logo_uploads?.[0]?.url_64
                          // eslint-disable-next-line @next/next/no-img-element
                          ? <img src={`${b.logo_uploads[0].url_64}${b.logo_uploads[0].url_64.includes('?') ? '&' : '?'}t=${Date.now()}`} alt="" className={styles.logoThumb} />
                          : <div className={styles.logoPlaceholder}>{b.name?.charAt(0)}</div>}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#111' }}>{b.name}</div>
                        <div style={{ fontSize: '0.8rem', color: '#666' }}>{b.slug}</div>
                      </td>
                      <td>{b.province || '—'}</td>
                      <td>
                        <span className={`${styles.badge} ${styles[b.status as keyof typeof styles] || ''}`}>
                          {b.status === 'approved' ? '✅ Đã duyệt' : b.status === 'pending' ? '🕐 Chờ duyệt' : '❌ Từ chối'}
                        </span>
                      </td>
                      <td>
                        <select
                          className={styles.prioritySelect}
                          value={b.package_type || 'free'}
                          onChange={e => handlePriority(b.id, e.target.value)}
                        >
                          {PACKAGE_OPTIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                        </select>
                      </td>
                      <td style={{ color: '#888' }}>{b.click_count || 0}</td>
                      <td>
                        <div className={styles.actions}>
                          {b.status !== 'approved' && <button className={styles.approveBtn} onClick={() => handleStatus(b.id, 'approved')}>✅ Duyệt</button>}
                          {b.status !== 'rejected' && <button className={styles.rejectBtn} onClick={() => handleStatus(b.id, 'rejected')}>❌ Từ chối</button>}
                          {tab === 'rejected' && <button className={styles.deleteBtn} onClick={() => handleDelete(b.id)}>🗑️ Xóa vĩnh viễn</button>}
                          <Link href={`/admin/brands/${b.id}`} className={styles.editBtn}>✏️ Sửa</Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            }
          </>
        )}

        {tab === 'stats' && (
          <>
            <h1 className={styles.pageTitle}>Thống kê</h1>
            <div className={styles.statsRow}>
              <div className={styles.statCard}>
                <div className={styles.statValue}>{stats.total}</div>
                <div className={styles.statLabel}>Tổng thương hiệu</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue} style={{ color: '#f59e0b' }}>{stats.pending}</div>
                <div className={styles.statLabel}>Đang chờ duyệt</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue} style={{ color: '#10b981' }}>{stats.approved}</div>
                <div className={styles.statLabel}>Đã được duyệt</div>
              </div>
            </div>

            <h2 style={{ color: '#0ea5e9', fontSize: '1.1rem', marginBottom: 16, fontWeight: 700 }}>Top 10 Thương hiệu được click nhiều nhất</h2>
            <div className={styles.topList}>
              {stats.topClicked.map((b, i) => (
                <div key={b.id} className={styles.topItem}>
                  <div className={styles.topRank}>#{i + 1}</div>
                  <div className={styles.topName}>{b.name}</div>
                  <div className={styles.topCount}>{b.click_count} clicks</div>
                </div>
              ))}
              {stats.topClicked.length === 0 && <div className={styles.empty} style={{ color: '#0ea5e9' }}>Chưa có dữ liệu</div>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
