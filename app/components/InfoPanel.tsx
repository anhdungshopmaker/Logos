import Image from 'next/image';
import Link from 'next/link';
import { useEffect } from 'react';
import styles from './InfoPanel.module.css';

interface BrandInfo {
  id: string;
  slug: string;
  name: string;
  logoUrl: string;
  province: string;
  description: string;
  website: string;
  phone?: string;
  google_maps_url?: string;
  fanpage?: string;
}

interface InfoPanelProps {
  brand: BrandInfo;
  onClose: () => void;
}

export default function InfoPanel({ brand, onClose }: InfoPanelProps) {
  // Prevent body scroll when panel is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    
    // Tracking API Call (Fire and forget)
    fetch(`/api/track?brandId=${brand.id}`).catch(() => {});

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [brand.id]);

  const brandUrl = typeof window !== 'undefined' ? `${window.location.origin}/brand/${brand.slug}` : '';

  const handleCopy = () => {
    navigator.clipboard.writeText(brandUrl);
    alert('Đã copy link!');
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose} aria-label="Close">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
          </svg>
        </button>

        <div className={styles.header}>
          <div className={styles.logoWrapper}>
            {brand.logoUrl ? (
              <Image 
                src={brand.logoUrl} 
                alt={brand.name} 
                width={128} 
                height={128} 
                className={styles.logo}
                unoptimized
              />
            ) : (
              <div style={{width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5', color: '#888', fontSize: '24px'}}>
                {brand.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className={styles.info}>
            <h2 className={styles.title}>{brand.name}</h2>
            <p className={styles.province}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
              </svg>
              {brand.province}
            </p>
          </div>
        </div>

        <p className={styles.description}>
          {brand.description || "Chưa có mô tả chi tiết cho thương hiệu này."}
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
          {brand.phone && (
            <a href={`tel:${brand.phone}`} className={styles.claimButton} style={{ margin: 0 }}>
              📞 Gọi điện
            </a>
          )}
          {brand.google_maps_url && (
            <a href={brand.google_maps_url} target="_blank" rel="noopener noreferrer" className={styles.claimButton} style={{ margin: 0 }}>
              📍 Bản đồ
            </a>
          )}
          {brand.fanpage && (
            <a href={brand.fanpage} target="_blank" rel="noopener noreferrer" className={styles.claimButton} style={{ margin: 0 }}>
              👍 Fanpage
            </a>
          )}
          {brand.website && (
            <a href={brand.website} target="_blank" rel="noopener noreferrer" className={styles.claimButton} style={{ margin: 0 }}>
              🌐 Website
            </a>
          )}
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          <button onClick={handleCopy} className={styles.claimButton} style={{ flex: 1, margin: 0 }}>
            🔗 Copy
          </button>
          <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(brandUrl)}`} target="_blank" rel="noopener noreferrer" className={styles.claimButton} style={{ flex: 1, margin: 0, background: '#1877F2', color: '#fff', border: 'none' }}>
            Facebook
          </a>
          <a href={`https://zalo.me/share?url=${encodeURIComponent(brandUrl)}`} target="_blank" rel="noopener noreferrer" className={styles.claimButton} style={{ flex: 1, margin: 0, background: '#0068FF', color: '#fff', border: 'none' }}>
            Zalo
          </a>
        </div>

        <Link href={`/brand/${brand.slug}`} className={styles.button}>
          Xem chi tiết & Claim Brand
        </Link>
      </div>
    </div>
  );
}
