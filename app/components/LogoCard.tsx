'use client';
import { useEffect, useRef, useState } from 'react';
import styles from './LogoCard.module.css';

interface Props {
  brand: any;
  onClick: () => void;
}

export default function LogoCard({ brand, onClick }: Props) {
  const [inView, setInView] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
      },
      { 
        threshold: 0,
        rootMargin: '150px' 
      }
    );

    const currentRef = cardRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, []);

  const uploads = brand.logo_uploads || [];
  const latestLogo = uploads[uploads.length - 1];
  const logoUrl = latestLogo?.url_256 || latestLogo?.url_128 || latestLogo?.url_64 || '';
  
  const tier = (brand.package_type || 'free').toLowerCase();

  return (
    <div 
      ref={cardRef}
      className={`${styles.card} ${styles[tier] || styles.free}`} 
      onClick={onClick} 
      title={brand.name}
      data-in-view={inView}
    >
      <div className={styles.borderWrapper}>
        <div className={styles.borderFlow}></div>
      </div>
      
      <div className={styles.inner}>
        {tier === 'premium' && <div className={styles.shineSweep}></div>}
        {tier === 'diamond' && <div className={styles.diamondSpotlight}></div>}

        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className={styles.logoImage} src={logoUrl} alt={brand.name} loading="lazy" />
        ) : (
          <div className={styles.placeholder}>
            {brand.name?.charAt(0)?.toUpperCase() || '?'}
          </div>
        )}
      </div>

      <div className={styles.infoIcon}>i</div>
    </div>
  );
}
