'use client';
import styles from './LogoCard.module.css';

interface Props {
  brand: any;
  onClick: () => void;
}

export default function LogoCard({ brand, onClick }: Props) {
  const logoUrl = brand.logo_uploads?.[0]?.url_64 || brand.logo_uploads?.[0]?.url_128 || '';

  return (
    <div className={styles.card} onClick={onClick} title={brand.name}>
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoUrl} alt={brand.name} loading="lazy" />
      ) : (
        <div className={styles.placeholder}>
          {brand.name?.charAt(0)?.toUpperCase() || '?'}
        </div>
      )}
    </div>
  );
}
