'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import styles from './InfoPanel.module.css';

export default function InfoPanel({ brand, onClose }: { brand: any; onClose: () => void }) {
  const logoUrl = brand.logo_uploads?.[0]?.url_128 || brand.logo_uploads?.[0]?.url_64 || '';
  const brandUrl = typeof window !== 'undefined' ? `${window.location.origin}/brand/${brand.slug}` : '';

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    fetch(`/api/track?brandId=${brand.id}`).catch(() => {});
    return () => { document.body.style.overflow = ''; };
  }, [brand.id]);

  const handleCopy = () => {
    navigator.clipboard.writeText(brandUrl);
    alert('Đã copy link!');
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.panel} onClick={e => e.stopPropagation()}>
        <div className={styles.handle} />

        <div className={styles.logoWrap}>
          {logoUrl
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={logoUrl} alt={brand.name} />
            : <div className={styles.placeholder}>{brand.name?.charAt(0)?.toUpperCase()}</div>
          }
        </div>

        <div className={styles.name}>{brand.name}</div>
        <div className={styles.meta}>
          {brand.province && <span>📍 {brand.province}</span>}
          {brand.industry && <span>🏷️ {brand.industry}</span>}
        </div>

        {brand.description && <p className={styles.desc}>{brand.description}</p>}

        <div className={styles.grid2}>
          {brand.phone && (
            <a href={`tel:${brand.phone}`} className={styles.btn}>📞 Gọi điện</a>
          )}
          {brand.google_maps_url && (
            <a href={brand.google_maps_url} target="_blank" rel="noopener noreferrer" className={styles.btn}>🗺️ Bản đồ</a>
          )}
          {brand.website && (
            <a href={brand.website} target="_blank" rel="noopener noreferrer" className={styles.btn}>🌐 Website</a>
          )}
          {brand.fanpage && (
            <a href={brand.fanpage} target="_blank" rel="noopener noreferrer" className={styles.btn}>👍 Fanpage</a>
          )}
        </div>

        <div className={styles.grid3}>
          <button onClick={handleCopy} className={`${styles.btn} ${styles.shareBtn}`}>🔗 Copy</button>
          <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(brandUrl)}`}
            target="_blank" rel="noopener noreferrer"
            className={`${styles.btn} ${styles.shareBtn} ${styles.fbBtn}`}>Facebook</a>
          <a href={`https://zalo.me/share?url=${encodeURIComponent(brandUrl)}`}
            target="_blank" rel="noopener noreferrer"
            className={`${styles.btn} ${styles.shareBtn} ${styles.zaloBtn}`}>Zalo</a>
        </div>

        <Link href={`/brand/${brand.slug}`} className={styles.primaryBtn}>
          Xem chi tiết & Claim Brand
        </Link>
      </div>
    </div>
  );
}
