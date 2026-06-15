'use client';
import styles from './LogoCard.module.css';

interface Props {
  brand: any;
  onClick: () => void;
}

export default function LogoCard({ brand, onClick }: Props) {
  const uploads = brand.logo_uploads || [];
  const latestLogo = uploads[uploads.length - 1];
  const logoUrl = latestLogo?.url_256 || latestLogo?.url_128 || latestLogo?.url_64 || '';

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
      <div className={styles.infoIcon}>i</div>
    </div>
  );
}
