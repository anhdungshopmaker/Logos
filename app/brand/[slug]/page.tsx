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
  const logoUrl = brand.logo_uploads?.[0]?.url_256 || brand.logo_uploads?.[0]?.url_128 || '';

  return (
    <div className={styles.container}>
      <Link href="/" className={styles.back}>← Quay lại Brand Wall</Link>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.logoWrap}>
            {logoUrl
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={logoUrl} alt={brand.name} className={styles.logo} />
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
          {brand.website && <a href={brand.website} target="_blank" rel="noopener noreferrer" className={styles.item}><span>🌐</span><span>{brand.website.replace(/^https?:\/\//, '')}</span></a>}
          {brand.fanpage && <a href={brand.fanpage} target="_blank" rel="noopener noreferrer" className={styles.item}><span>👍</span><span>Fanpage</span></a>}
          {brand.phone && <a href={`tel:${brand.phone}`} className={styles.item}><span>📞</span><span>{brand.phone}</span></a>}
          {brand.google_maps_url && <a href={brand.google_maps_url} target="_blank" rel="noopener noreferrer" className={styles.item}><span>🗺️</span><span>Xem bản đồ</span></a>}
        </div>
        <div style={{ marginTop: 32 }}>
          <Link href={`/claim?id=${brand.id}`} className={styles.claimBtn}>Tôi là chủ thương hiệu này</Link>
        </div>
      </div>
    </div>
  );
}
