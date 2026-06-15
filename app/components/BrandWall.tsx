'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { createClient } from '@/utils/supabase/client';
import LogoCard from './LogoCard';
import InfoPanel from './InfoPanel';
import styles from './BrandWall.module.css';
import Link from 'next/link';

const PAGE_SIZE = 100;
const GAP = 10;

function useCols(hasSidePanel: boolean) {
  const [cols, setCols] = useState(4);
  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      // If side panel is open, grid width is ~70% (e.g. 1280 * 0.7 = ~900px)
      // We want logos to be ~130-150px
      const isDesktop = w >= 1025;
      const effectiveW = (isDesktop && hasSidePanel) ? w - 380 : w;
      
      if (effectiveW >= 1200) setCols(10);
      else if (effectiveW >= 1024) setCols(8);
      else if (effectiveW >= 768) setCols(6);
      else if (effectiveW >= 480) setCols(5);
      else setCols(4);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [hasSidePanel]);
  return cols;
}

export default function BrandWall({
  initialProvince,
  initialIndustry,
}: { initialProvince?: string; initialIndustry?: string } = {}) {
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const supabase = createClient();
  const parentRef = useRef<HTMLDivElement>(null);
  const cols = useCols(!!selected);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: authListener } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user || null);
    });
    return () => authListener.subscription.unsubscribe();
  }, [supabase]);

  const fetchBrands = useCallback(async (p: number, q: string) => {
    let query = supabase
      .from('brands')
      .select('*, logo_uploads(url_128, url_256)')
      .eq('status', 'approved')
      .order('priority', { ascending: false })
      .order('click_count', { ascending: false })
      .range(p * PAGE_SIZE, (p + 1) * PAGE_SIZE - 1);

    if (initialProvince) query = query.ilike('province', `%${initialProvince}%`);
    if (initialIndustry) query = query.ilike('industry', `%${initialIndustry}%`);
    if (q) query = query.ilike('name', `%${q}%`);

    const { data } = await query;
    return data || [];
  }, [supabase, initialProvince, initialIndustry]);

  useEffect(() => {
    setLoading(true);
    setBrands([]);
    setPage(0);
    setHasMore(true);
    fetchBrands(0, search).then(data => {
      setBrands(data);
      setHasMore(data.length === PAGE_SIZE);
      setLoading(false);
    });
  }, [search, fetchBrands]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return;
    const next = page + 1;
    const data = await fetchBrands(next, search);
    setBrands(prev => [...prev, ...data]);
    setPage(next);
    setHasMore(data.length === PAGE_SIZE);
  }, [hasMore, loading, page, search, fetchBrands]);

  const rows = Math.ceil(brands.length / cols);
  const rowVirtualizer = useVirtualizer({
    count: rows + (hasMore ? 1 : 0),
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80,
    overscan: 5,
  });

  useEffect(() => {
    const items = rowVirtualizer.getVirtualItems();
    if (!items.length) return;
    const last = items[items.length - 1];
    if (last.index >= rows - 2 && hasMore && !loading) loadMore();
  }, [rowVirtualizer.getVirtualItems(), rows, hasMore, loading, loadMore]);

  return (
    <div className={styles.wrapper}>
      <div className={styles.toolbar}>
        <Link href="/" className={styles.logo} style={{ textDecoration: 'none' }}>
          <span>🇻🇳</span> Brand Wall
        </Link>
        <div style={{ flex: 1 }} />
        <Link href="/submit" className={styles.submitBtn} style={{ background: '#fff', color: 'var(--primary)', border: '1px solid rgba(11, 46, 107, 0.15)' }}>+ Logo</Link>
        {user ? (
          <Link href="/dashboard" className={styles.submitBtn} style={{ background: 'var(--primary)', color: '#fff' }}>Workspace</Link>
        ) : (
          <Link href="/login" className={styles.submitBtn} style={{ background: 'var(--primary)', color: '#fff' }}>Đăng nhập</Link>
        )}
      </div>

      <div className={styles.mainArea}>
        <div className={styles.gridWrapper}>
          {!initialIndustry && !initialProvince && (
            <div className={styles.hero}>
              <h1 className={styles.heroTitle}><span>🇻🇳</span> Brand Wall</h1>
              <p className={styles.heroSubtitle}>Khám phá 50.000+ thương hiệu, doanh nghiệp và dịch vụ hàng đầu Việt Nam.</p>
              
              <div className={styles.searchWrap}>
                <input
                  className={styles.heroSearch}
                  placeholder="🔍 Tìm spa, nail, khách sạn, nhà hàng..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <div className={styles.categories}>
                {[
                  { id: 'Spa', label: '💅 Spa' },
                  { id: 'Nail', label: '💅 Nail' },
                  { id: 'Barber', label: '✂️ Barber' },
                  { id: 'Khách sạn', label: '🏨 Khách sạn' },
                  { id: 'Nhà hàng', label: '🍽️ Nhà hàng' },
                  { id: 'Công nghệ', label: '💻 Công nghệ' },
                  { id: 'Giáo dục', label: '📚 Giáo dục' },
                  { id: 'Thời trang', label: '👗 Thời trang' },
                ].map(cat => (
                  <button 
                    key={cat.id} 
                    className={`${styles.categoryTag} ${search === cat.id ? styles.active : ''}`} 
                    onClick={() => setSearch(cat.id)}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div ref={parentRef} className={styles.grid}>
            {loading && brands.length === 0 && (
              <div className={styles.loading}>Đang tải...</div>
            )}
            {!loading && brands.length === 0 && (
              <div className={styles.empty}>Không tìm thấy thương hiệu nào</div>
            )}
            <div style={{ height: rowVirtualizer.getTotalSize(), position: 'relative' }}>
              {rowVirtualizer.getVirtualItems().map(vRow => {
                const startIdx = vRow.index * cols;
                const rowBrands = brands.slice(startIdx, startIdx + cols);
                return (
                  <div
                    key={vRow.index}
                    className={styles.row}
                    style={{ position: 'absolute', top: vRow.start, left: 0, right: 0 }}
                  >
                    {rowBrands.map(brand => (
                      <div key={brand.id} style={{ flex: `0 0 calc(${100 / cols}% - ${16 * (cols - 1) / cols}px)` }}>
                        <LogoCard brand={brand} onClick={() => setSelected(brand)} />
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {selected && (
          <div className={styles.sidePanel}>
            <InfoPanel brand={selected} onClose={() => setSelected(null)} mode="desktop" />
          </div>
        )}
      </div>

      {selected && <InfoPanel brand={selected} onClose={() => setSelected(null)} mode="mobile" />}
    </div>
  );
}
