'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import LogoCard from './LogoCard';
import InfoPanel from './InfoPanel';
import styles from './BrandWall.module.css';
import { createClient } from '@/utils/supabase/client';

const GAP = 12;

export default function BrandWall({ 
  initialProvince, 
  initialIndustry 
}: { 
  initialProvince?: string, 
  initialIndustry?: string 
} = {}) {
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [columns, setColumns] = useState(4);
  const [selectedBrand, setSelectedBrand] = useState<any | null>(null);

  const parentRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  const loadMore = useCallback(async (isReset = false) => {
    if (!hasMore && !isReset) return;
    setLoading(true);

    const currentPage = isReset ? 0 : page;
    
    // For MVP infinite scroll, fetch by ordered index to avoid duplicate problems
    let query = supabase
      .from('brands')
      .select('*, logo_uploads(url_64, url_128, url_256)')
      .eq('status', 'approved')
      .order('priority', { ascending: false }) // Sort by priority first
      .order('featured', { ascending: false })
      .order('click_count', { ascending: false })
      .order('id', { ascending: true })
      .range(currentPage * 100, (currentPage + 1) * 100 - 1);

    if (initialProvince) {
      // Using ilike for flexible matching
      query = query.ilike('province', `%${initialProvince}%`);
    }

    if (initialIndustry) {
      query = query.ilike('industry', `%${initialIndustry}%`);
    }

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    const { data, error } = await query;
    
    if (data && data.length > 0) {
      setBrands(prev => isReset ? data : [...prev, ...data]);
      setPage(currentPage + 1);
      setHasMore(data.length === 100);
    } else {
      if (isReset) setBrands([]);
      setHasMore(false);
    }
    setLoading(false);
  }, [page, hasMore, search, supabase]);

  useEffect(() => {
    // Debounce search
    const handler = setTimeout(() => {
      setPage(0);
      setHasMore(true);
      loadMore(true);
    }, 300);

    return () => clearTimeout(handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  useEffect(() => {
    const updateColumns = () => {
      if (parentRef.current) {
        const width = parentRef.current.clientWidth - 32;
        const cardSize = window.innerWidth >= 1024 ? 64 : window.innerWidth >= 768 ? 56 : 48;
        const cols = Math.floor(width / (cardSize + GAP));
        setColumns(Math.max(2, cols));
      }
    };
    
    updateColumns();
    window.addEventListener('resize', updateColumns);
    return () => window.removeEventListener('resize', updateColumns);
  }, []);

  const rows = Math.ceil(brands.length / columns);
  const cardSize = typeof window !== 'undefined' && window.innerWidth >= 1024 ? 64 : typeof window !== 'undefined' && window.innerWidth >= 768 ? 56 : 48;

  const rowVirtualizer = useVirtualizer({
    count: rows,
    getScrollElement: () => parentRef.current,
    estimateSize: () => cardSize + GAP,
    overscan: 5,
  });

  useEffect(() => {
    const [lastItem] = rowVirtualizer.getVirtualItems().slice(-1);
    if (!lastItem) return;
    if (lastItem.index >= rows - 1 && hasMore && !loading) {
      loadMore();
    }
  }, [rowVirtualizer.getVirtualItems(), hasMore, loading, loadMore, rows]);

  return (
    <div className={styles.container} ref={parentRef}>
      <div className={styles.searchBar}>
        <input 
          type="text" 
          placeholder="Tìm kiếm thương hiệu..." 
          className={styles.searchInput}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className={styles.grid} style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const startIndex = virtualRow.index * columns;
          const rowBrands = brands.slice(startIndex, startIndex + columns);

          return (
            <div
              key={virtualRow.index}
              className={styles.virtualRow}
              style={{
                height: `${cardSize}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              {rowBrands.map((brand) => {
                const logoUrl = brand.logo_uploads?.[0]?.url_256 || '';
                return (
                  <div key={brand.id} className={styles.cell} style={{ width: cardSize }}>
                    <LogoCard 
                      name={brand.name} 
                      logoUrl={logoUrl} 
                      onClick={() => setSelectedBrand(brand)} 
                    />
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {loading && <div className={styles.loading}>Đang tải...</div>}

      {selectedBrand && (
        <InfoPanel 
          brand={{
            id: selectedBrand.id,
            slug: selectedBrand.slug,
            name: selectedBrand.name,
            logoUrl: selectedBrand.logo_uploads?.[0]?.url_256 || '',
            province: selectedBrand.province,
            description: selectedBrand.description,
            website: selectedBrand.website,
          }} 
          onClose={() => setSelectedBrand(null)} 
        />
      )}
    </div>
  );
}
