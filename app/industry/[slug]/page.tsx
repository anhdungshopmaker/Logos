import { Metadata } from 'next';
import BrandWall from '@/app/components/BrandWall';

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const decoded = decodeURIComponent(slug).replace(/-/g, ' ');
  const titleName = decoded.charAt(0).toUpperCase() + decoded.slice(1);
  return {
    title: `Top Thương hiệu ${titleName} tốt nhất - Brand Wall Vietnam`,
    description: `Khám phá danh sách các thương hiệu ${titleName} hàng đầu, uy tín nhất tại Việt Nam trên Brand Wall.`,
  };
}

export default async function IndustryPage({ params }: Props) {
  const { slug } = await params;
  const decoded = decodeURIComponent(slug).replace(/-/g, ' ');
  return (
    <main>
      <BrandWall initialIndustry={decoded} />
    </main>
  );
}
