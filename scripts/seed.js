import { createClient } from '@supabase/supabase-js';
import { faker } from '@faker-js/faker/locale/vi';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  console.log("Seeding 10000 mock brands...");
  const brands = [];
  const logoUploads = [];
  const industries = ['Spa', 'Nail', 'Barber', 'Khách sạn', 'Nhà hàng', 'Công nghệ', 'Bán lẻ', 'Thời trang', 'Giáo dục'];

  for (let i = 0; i < 10000; i++) {
    const name = faker.company.name();
    const slug = faker.helpers.slugify(name).toLowerCase() + '-' + faker.string.alphanumeric(4);
    const isFeatured = Math.random() > 0.8; // ~20% featured
    
    // We generate a fake ID here to associate with logo_uploads
    const id = faker.string.uuid();

    const packageType = isFeatured ? faker.helpers.arrayElement(['premium', 'diamond']) : faker.helpers.arrayElement(['free', 'standard']);
    let priority = 1;
    if (packageType === 'standard') priority = 5;
    if (packageType === 'premium') priority = 20;
    if (packageType === 'diamond') priority = 50;

    brands.push({
      id,
      slug,
      name,
      province: faker.location.city(),
      description: faker.company.catchPhrase(),
      website: faker.internet.url(),
      fanpage: `https://facebook.com/${slug}`,
      phone: faker.phone.number(),
      google_maps_url: `https://maps.google.com/?q=${name}`,
      industry: faker.helpers.arrayElement(industries),
      package_type: packageType,
      priority,
      featured: isFeatured,
      status: 'approved',
      view_count: faker.number.int({ min: 0, max: 1000 }),
      click_count: faker.number.int({ min: 0, max: 500 }),
      expires_at: isFeatured ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() : null
    });

    // Mock logo urls using unpkg or dummyimage, wait, we can just use fake urls or placeholder images
    // Since we need to display it, let's use a reliable placeholder service
    const bgColor = faker.color.rgb({ format: 'hex', casing: 'lower' }).substring(1);
    const txtColor = 'ffffff';
    const init = name.charAt(0).toUpperCase();
    const mockLogoUrl = `https://ui-avatars.com/api/?name=${init}&background=${bgColor}&color=${txtColor}&size=256&font-size=0.6`;
    
    logoUploads.push({
      brand_id: id,
      original_url: mockLogoUrl,
      url_64: `https://ui-avatars.com/api/?name=${init}&background=${bgColor}&color=${txtColor}&size=64&font-size=0.6`,
      url_128: `https://ui-avatars.com/api/?name=${init}&background=${bgColor}&color=${txtColor}&size=128&font-size=0.6`,
      url_256: mockLogoUrl
    });
  }

  // Insert in chunks of 100 to avoid payload size issues
  const chunkSize = 100;
  for (let i = 0; i < brands.length; i += chunkSize) {
    const brandChunk = brands.slice(i, i + chunkSize);
    const { error: brandErr } = await supabase.from('brands').insert(brandChunk);
    if (brandErr) {
      console.error("Error inserting brands chunk:", brandErr);
      return;
    }
  }

  for (let i = 0; i < logoUploads.length; i += chunkSize) {
    const logoChunk = logoUploads.slice(i, i + chunkSize);
    const { error: logoErr } = await supabase.from('logo_uploads').insert(logoChunk);
    if (logoErr) {
      console.error("Error inserting logos chunk:", logoErr);
      return;
    }
  }

  console.log(`Successfully seeded ${brands.length} brands and their logos.`);
}

seed();
