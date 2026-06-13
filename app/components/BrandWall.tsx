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

function useCols() {
  const [cols, setCols] = useState(4);
  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      if (w >= 1280) setCols(10);
      else if (w >= 1024) setCols(8);
      else if (w >= 768) setCols(6);
      else if (w >= 480) setCols(5);
      else setCols(4);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
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
  const supabase = createClient();
  const parentRef = useRef<HTMLDivElement>(null);
  const cols = useCols();

  const fetchBrands = useCallback(async (p: number, q: string) => {
    let query = supabase
      .from('brands')
      .select('*, logo_uploads(url_64, url_128)')
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
        <span className={styles.logo}>🇻🇳 Brand Wall</span>
        <input
          className={styles.search}
          placeholder="Tìm thương hiệu..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <Link href="/submit" className={styles.submitBtn}>+ Đăng ký</Link>
      </div>

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
                  <div key={brand.id} style={{ flex: `0 0 calc(${100 / cols}% - ${GAP * (cols - 1) / cols}px)` }}>
                    <LogoCard brand={brand} onClick={() => setSelected(brand)} />
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {selected && <InfoPanel brand={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
