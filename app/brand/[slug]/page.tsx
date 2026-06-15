import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';
import styles from './page.module.css';

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from('brands').select('name,description').eq('slug', slug).single();
  if (!data) return { title: 'Không tìm thấy - Brand Wall Vietnam' };
  return {
    title: `${data.name} - Brand Wall Vietnam`,
    description: data.description || `Xem thông tin ${data.name} trên Brand Wall Vietnam`,
  };
}

export default async function BrandPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: brand } = await supabase
    .from('brands').select('*, logo_uploads(url_128, url_256)').eq('slug', slug).single();
  if (!brand) notFound();
  
  const uploads = brand.logo_uploads || [];
  const latestLogo = uploads[uploads.length - 1];
  const logoUrl = latestLogo?.url_256 || latestLogo?.url_128 || '';

  // Generate JSON-LD
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: brand.name,
    image: logoUrl || undefined,
    description: brand.description || undefined,
    telephone: brand.phone || undefined,
    url: brand.website || undefined,
    address: brand.province ? {
      '@type': 'PostalAddress',
      addressRegion: brand.province,
      addressCountry: 'VN'
    } : undefined
  };

  return (
    <div className={styles.container}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Link href="/" className={styles.back}>← Quay lại Brand Wall</Link>
      <div className={styles.card}>
        {brand.cover_url && (
          <div style={{ width: '100%', height: 160, borderRadius: '24px 24px 0 0', overflow: 'hidden', marginBottom: '-40px' }}>
            <img src={brand.cover_url} alt="Cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        )}
        <div className={styles.header}>
          <div className={styles.logoWrap} style={{ position: 'relative', zIndex: 2, background: '#fff', border: '4px solid #fff', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
            {logoUrl
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={logoUrl} alt={brand.name} className={styles.logo} style={{ objectFit: 'contain' }} />
              : <div className={styles.ph}>{brand.name?.charAt(0)}</div>}
          </div>
          <h1 className={styles.name}>{brand.name}</h1>
          <div className={styles.meta}>
            {brand.province && <span>📍 {brand.province}</span>}
            {brand.industry && <span>🏷️ {brand.industry}</span>}
          </div>
        </div>
        {brand.description && <p className={styles.desc}>{brand.description}</p>}
        <div className={styles.grid}>
          {brand.website && <a href={brand.website} target="_blank" rel="noopener noreferrer" className={styles.item}><span>🌐</span><span className={styles.itemText}>{brand.website.replace(/^https?:\/\//, '')}</span></a>}
          {brand.phone && <a href={`tel:${brand.phone}`} className={styles.item}><span>📞</span><span className={styles.itemText}>{brand.phone}</span></a>}
          {brand.zalo && <a href={`https://zalo.me/${brand.zalo.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className={styles.item} style={{ borderColor: '#e0f2fe', background: '#f0f9ff', color: '#0ea5e9' }}><span>💬</span><span className={styles.itemText}>Chat Zalo</span></a>}
          {brand.fanpage && <a href={brand.fanpage} target="_blank" rel="noopener noreferrer" className={styles.item} style={{ borderColor: '#eef2ff', background: '#f5f7ff', color: '#4f46e5' }}><span>👍</span><span className={styles.itemText}>Fanpage</span></a>}
          {brand.google_maps_url && <a href={brand.google_maps_url} target="_blank" rel="noopener noreferrer" className={styles.item}><span>🗺️</span><span className={styles.itemText}>Xem bản đồ</span></a>}
        </div>
        <div style={{ marginTop: 32 }}>
          <Link href={`/claim?id=${brand.id}`} className={styles.claimBtn}>Tôi là chủ thương hiệu này</Link>
        </div>
      </div>
    </div>
  );
}
