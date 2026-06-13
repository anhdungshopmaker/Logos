import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import styles from './page.module.css';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;
  const supabase = await createClient();
  const { data: brand } = await supabase
    .from('brands')
    .select('name, description')
    .eq('slug', slug)
    .single();

  if (!brand) {
    return {
      title: 'Không tìm thấy thương hiệu - Brand Wall Vietnam',
    };
  }

  return {
    title: `${brand.name} - Brand Wall Vietnam`,
    description: brand.description || `Xem thông tin chi tiết về ${brand.name} trên Brand Wall Vietnam.`,
  };
}

export default async function BrandPage({ params }: Props) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;
  const supabase = await createClient();
  const { data: brand } = await supabase
    .from('brands')
    .select('*, logo_uploads(url_256)')
    .eq('slug', slug)
    .single();

  if (!brand) {
    notFound();
  }

  const logoUrl = brand.logo_uploads?.[0]?.url_256 || '';

  // Increment view count could be done via RPC here or client side. For now, we skip or assume trigger.

  return (
    <div className={styles.container}>
      <Link href="/" className={styles.backLink}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m15 18-6-6 6-6"/>
        </svg>
        Quay lại Brand Wall
      </Link>

      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.logoWrapper}>
             {logoUrl ? (
              <Image 
                src={logoUrl} 
                alt={brand.name} 
                width={120} 
                height={120} 
                className={styles.logo}
                unoptimized
              />
            ) : (
              <div style={{width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5', color: '#888', fontSize: '40px', fontWeight: 'bold'}}>
                {brand.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <h1 className={styles.title}>{brand.name}</h1>
          <div className={styles.meta}>
            <div className={styles.metaItem}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
              </svg>
              {brand.province}
            </div>
            {brand.industry && (
              <div className={styles.metaItem}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                </svg>
                {brand.industry}
              </div>
            )}
          </div>
        </div>

        {brand.description && (
          <div className={styles.description}>
            {brand.description}
          </div>
        )}

        <div className={styles.details}>
          {brand.website && (
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Website</span>
              <a href={brand.website} target="_blank" rel="noopener noreferrer" className={styles.detailValue}>
                {brand.website.replace(/^https?:\/\//, '')}
              </a>
            </div>
          )}
          {brand.fanpage && (
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Fanpage</span>
              <a href={brand.fanpage} target="_blank" rel="noopener noreferrer" className={styles.detailValue}>
                {brand.fanpage.replace(/^https?:\/\//, '')}
              </a>
            </div>
          )}
          {brand.phone && (
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Điện thoại</span>
              <a href={`tel:${brand.phone}`} className={styles.detailValue}>
                {brand.phone}
              </a>
            </div>
          )}
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Trạng thái gói</span>
            <span className={styles.detailValue} style={{ textTransform: 'capitalize' }}>
              {brand.package_type}
            </span>
          </div>
        </div>

        <div className={styles.actions}>
          <Link href={`/claim?id=${brand.id}`} className={styles.claimButton}>
            Tôi là chủ thương hiệu này
          </Link>
        </div>
      </div>
    </div>
  );
}
