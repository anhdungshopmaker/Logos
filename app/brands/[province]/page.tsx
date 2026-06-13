import { Metadata } from 'next';
import { createClient } from '@/utils/supabase/server';
import BrandWall from '@/app/components/BrandWall';
import Link from 'next/link';

interface Props {
  params: Promise<{ province: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const provinceStr = decodeURIComponent(resolvedParams.province).replace(/-/g, ' ');
  const capitalized = provinceStr.replace(/(^\w|\s\w)/g, m => m.toUpperCase());

  return {
    title: `Thương hiệu tại ${capitalized} - Brand Wall Vietnam`,
    description: `Khám phá các doanh nghiệp và thương hiệu nổi bật tại ${capitalized} trên Brand Wall Vietnam.`,
  };
}

export default async function ProvincePage({ params }: Props) {
  const resolvedParams = await params;
  const provinceStr = decodeURIComponent(resolvedParams.province).replace(/-/g, ' ');
  const capitalized = provinceStr.replace(/(^\w|\s\w)/g, m => m.toUpperCase());

  return (
    <main style={{ width: '100vw', height: '100vh', margin: 0, padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '16px 24px', background: '#fff', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', gap: '16px', zIndex: 10 }}>
        <Link href="/" style={{ color: '#666', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6"/>
          </svg>
          Trang chủ
        </Link>
        <h1 style={{ margin: 0, fontSize: '1.2rem' }}>Thương hiệu tại {capitalized}</h1>
      </div>
      <div style={{ flex: 1, position: 'relative' }}>
        <BrandWall initialProvince={capitalized} />
      </div>
    </main>
  );
}
