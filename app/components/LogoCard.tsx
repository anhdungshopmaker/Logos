import Image from 'next/image';
import styles from './LogoCard.module.css';

interface LogoCardProps {
  name: string;
  logoUrl: string;
  onClick: () => void;
  style?: React.CSSProperties;
}

export default function LogoCard({ name, logoUrl, onClick, style }: LogoCardProps) {
  return (
    <div className={styles.card} onClick={onClick} style={style} title={name}>
      {logoUrl ? (
        <Image
          src={logoUrl}
          alt={`Logo of ${name}`}
          width={64}
          height={64}
          className={styles.logo}
          unoptimized // Remove this if using external domains that are configured in next.config.js
        />
      ) : (
        <div className={styles.placeholder}>{name.charAt(0).toUpperCase()}</div>
      )}
    </div>
  );
}
