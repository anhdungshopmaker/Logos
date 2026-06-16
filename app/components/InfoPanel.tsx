'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from './InfoPanel.module.css';

interface Props {
  brand: any;
  onClose: () => void;
  mode?: 'desktop' | 'mobile';
}

function AnimatedCounter({ end, duration = 1500 }: { end: number, duration?: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number | null = null;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const percentage = Math.min(progress / duration, 1);
      
      const easeProgress = percentage === 1 ? 1 : 1 - Math.pow(2, -10 * percentage);
      
      setCount(Math.floor(end * easeProgress));

      if (progress < duration) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration]);

  return <>{count}</>;
}

const TwinklingStars = () => (
  <div className={styles.starsContainer}>
    <div className={`${styles.star} ${styles.star1}`}>✦</div>
    <div className={`${styles.star} ${styles.star2}`}>✦</div>
    <div className={`${styles.star} ${styles.star3}`}>✦</div>
    <div className={`${styles.star} ${styles.star4}`}>✦</div>
    <div className={`${styles.star} ${styles.star5}`}>✦</div>
    <div className={`${styles.star} ${styles.star6}`}>✦</div>
  </div>
);

export default function InfoPanel({ brand, onClose, mode = 'mobile' }: Props) {
  const uploads = brand.logo_uploads || [];
  const latestLogo = uploads[uploads.length - 1];
  const logoUrl = latestLogo?.url_256 || latestLogo?.url_128 || latestLogo?.url_64 || '';
  const brandUrl = typeof window !== 'undefined' ? `${window.location.origin}/brand/${brand.slug}` : '';

  const clicks = brand.click_count || 1;
  let hotness = '🌱 Mới nổi';
  if (clicks >= 500) hotness = '🚀 Siêu Hot';
  else if (clicks >= 200) hotness = '🔥 Hot';
  else if (clicks >= 50) hotness = '⭐ Đang lên';

  useEffect(() => {
    if (mode === 'mobile') {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [mode]);

  useEffect(() => {
    fetch(`/api/track?brandId=${brand.id}`).catch(() => {});
  }, [brand.id]);

  const handleCopy = () => {
    navigator.clipboard.writeText(brandUrl);
    alert('Đã copy link!');
  };

  const tier = (brand.package_type || 'free').toLowerCase();

  const panelContent = (
    <div className={`${styles.panelInnerWrapper} ${styles[tier]}`}>
      <div className={styles.cover}>
        {tier === 'standard' && <div className={styles.standardScanline}></div>}
        {tier === 'diamond' && (
          <>
            <div className={styles.diamondSpotlight}></div>
            <TwinklingStars />
          </>
        )}
        {brand.cover_url ? (
          <img src={brand.cover_url} alt="Cover" className={styles.coverImg} />
        ) : (
          <div className={styles.coverPlaceholder}></div>
        )}
        <button onClick={onClose} className={styles.closeBtn}>✕</button>
      </div>
      
      <div className={`${styles.logoWrap} ${styles[`${tier}LogoWrap`] || ''}`}>
        <div className={styles.borderWrapper}>
          {tier === 'standard' && <div className={styles.standardBorderFlow}></div>}
          {tier === 'premium' && <div className={styles.premiumBorderFlow}></div>}
          {tier === 'diamond' && <div className={styles.diamondBorderFlow}></div>}
        </div>

        {tier === 'premium' && <div className={styles.premiumShine}></div>}
        {tier === 'diamond' && <div className={styles.diamondHalo}></div>}

        <div className={styles.logoInner}>
          {logoUrl
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={logoUrl} alt={brand.name} className={tier === 'diamond' ? styles.breathingLogo : ''} />
            : <div className={`${styles.placeholder} ${tier === 'diamond' ? styles.breathingLogo : ''}`}>{brand.name?.charAt(0)?.toUpperCase()}</div>
          }
        </div>

        {/* Badges */}
        {tier === 'standard' && <div className={styles.badgeStandard}>✓ Verified</div>}
        {tier === 'premium' && <div className={styles.badgePremium}><span className={styles.starGlow}>⭐</span> Featured Brand</div>}
        {tier === 'diamond' && <div className={styles.badgeDiamond}>💎 Elite Partner</div>}
      </div>

      <div className={styles.content}>
        <div className={styles.name}>{brand.name}</div>
        <div className={styles.meta}>
          {brand.province && <span>📍 {brand.province}</span>}
          {brand.industry && <span>🏷️ {brand.industry}</span>}
        </div>

        <div className={styles.statsRow}>
          <div className={`${styles.statItem} ${styles.view} ${tier === 'diamond' ? styles.diamondStat : ''}`}>
            <div className={styles.statValue}>
              {tier === 'diamond' ? <AnimatedCounter end={clicks} /> : clicks}
            </div>
            <div className={styles.statLabel}>Lượt xem</div>
          </div>
          <div className={`${styles.statItem} ${styles.hot}`}>
            <div className={styles.statValue} style={{ fontSize: '1rem', color: tier === 'diamond' ? '#10b981' : '#d97706' }}>{hotness}</div>
            <div className={styles.statLabel}>Độ hot</div>
          </div>
        </div>

        {brand.description && <p className={styles.desc}>{brand.description}</p>}

        <div className={styles.grid2}>
          {brand.website && (
            <a href={brand.website} target="_blank" rel="noopener noreferrer" className={styles.btn}>🌐 Website</a>
          )}
          {brand.phone && (
            <a href={`tel:${brand.phone}`} className={styles.btn}>📞 Gọi điện</a>
          )}
          {brand.google_maps_url && (
            <a href={brand.google_maps_url} target="_blank" rel="noopener noreferrer" className={styles.btn}>🗺️ Bản đồ</a>
          )}
          {brand.fanpage && (
            <a href={brand.fanpage} target="_blank" rel="noopener noreferrer" className={styles.btn} style={{ background: '#eef2ff', color: '#4f46e5' }}>👍 Fanpage</a>
          )}
          {brand.zalo && (
            <a href={`https://zalo.me/${brand.zalo.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className={styles.btn} style={{ background: '#e0f2fe', color: '#0ea5e9' }}>💬 Chat Zalo</a>
          )}
        </div>

        <div className={styles.grid2} style={{ marginTop: 8 }}>
          <button className={styles.btn} onClick={() => {
            navigator.clipboard.writeText(`https://logo.dichvupro.net/brand/${brand.slug}`);
            alert('Đã copy link!');
          }}>🔗 Copy Link</button>
        </div>

        <Link href={`/brand/${brand.slug}`} className={`${styles.primaryBtn} ${styles[`${tier}Btn`] || ''}`}>
          Xem chi tiết & Claim Brand
        </Link>
      </div>
    </div>
  );

  if (mode === 'desktop') {
    return (
      <div className={styles.desktopPanel}>
        {panelContent}
      </div>
    );
  }

  return (
    <div className={styles.mobileOverlay} onClick={onClose}>
      <div className={styles.mobilePanel} onClick={e => e.stopPropagation()}>
        <div className={styles.handle} />
        {panelContent}
      </div>
    </div>
  );
}
