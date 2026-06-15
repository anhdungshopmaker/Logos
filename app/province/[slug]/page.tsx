import { Metadata } from 'next';
import BrandWall from '@/app/components/BrandWall';

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const decoded = decodeURIComponent(slug).replace(/-/g, ' ');
  const titleName = decoded.charAt(0).toUpperCase() + decoded.slice(1);
  return {
    title: `Khám phá các Thương hiệu tại ${titleName} - Brand Wall Vietnam`,
    description: `Danh bạ các doanh nghiệp và thương hiệu uy tín đang hoạt động tại ${titleName}.`,
  };
}

export default async function ProvincePage({ params }: Props) {
  const { slug } = await params;
  const decoded = decodeURIComponent(slug).replace(/-/g, ' ');
  return (
    <main>
      <BrandWall initialProvince={decoded} />
    </main>
  );
}
