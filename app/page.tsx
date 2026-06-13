import BrandWall from './components/BrandWall';

export const metadata = {
  title: 'Brand Wall Vietnam - Khám phá Hàng Ngàn Thương Hiệu',
  description: 'Trang chủ Brand Wall Vietnam. Khám phá logo và thông tin chi tiết của hàng chục ngàn thương hiệu uy tín trải khắp Việt Nam.',
}

export default function Home() {
  return (
    <main style={{ width: '100vw', height: '100vh', margin: 0, padding: 0, overflow: 'hidden' }}>
      <BrandWall />
    </main>
  );
}
