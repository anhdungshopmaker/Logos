import { Metadata } from 'next';
import Link from 'next/link';
import BrandWall from '@/app/components/BrandWall';

interface Props { params: Promise<{ province: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { province } = await params;
  const name = decodeURIComponent(province).replace(/-/g, ' ').replace(/(^\w|\s\w)/g, m => m.toUpperCase());
  return {
    title: `Thương hiệu tại ${name} - Brand Wall Vietnam`,
    description: `Khám phá các doanh nghiệp nổi bật tại ${name} trên Brand Wall Vietnam.`,
  };
}

export default async function ProvincePage({ params }: Props) {
  const { province } = await params;
  const name = decodeURIComponent(province).replace(/-/g, ' ').replace(/(^\w|\s\w)/g, m => m.toUpperCase());
  return (
    <main style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '12px 20px', background: '#fff', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', gap: 16 }}>
        <Link href="/" style={{ color: '#666' }}>← Trang chủ</Link>
        <h1 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Thương hiệu tại {name}</h1>
      </div>
      <div style={{ flex: 1 }}><BrandWall initialProvince={name} /></div>
    </main>
  );
}
