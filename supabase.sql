-- Supabase Schema for Brand Wall Vietnam (V2)

-- 1. Table: brands
CREATE TABLE public.brands (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  province TEXT,
  description TEXT,
  website TEXT,
  fanpage TEXT,
  phone TEXT,
  google_maps_url TEXT,
  industry TEXT,
  package_type TEXT DEFAULT 'free', -- 'free', 'standard', 'premium', 'diamond'
  priority INTEGER DEFAULT 1, -- Free=1, Standard=5, Premium=20, Diamond=50
  featured BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  expires_at TIMESTAMP WITH TIME ZONE,
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Table: brand_submissions
CREATE TABLE public.brand_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id UUID REFERENCES public.brands(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Table: logo_uploads
CREATE TABLE public.logo_uploads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id UUID REFERENCES public.brands(id) ON DELETE CASCADE,
  original_url TEXT,
  url_64 TEXT,
  url_128 TEXT,
  url_256 TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Table: click_logs (Keep 30 days detailed logs)
CREATE TABLE public.click_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id UUID REFERENCES public.brands(id) ON DELETE CASCADE,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Note: To keep click_logs for 30 days, we should set up a pg_cron task, e.g.:
-- SELECT cron.schedule('0 0 * * *', $$DELETE FROM click_logs WHERE created_at < NOW() - INTERVAL '30 days'$$);

-- 5. RPC: increment_click_count
CREATE OR REPLACE FUNCTION public.increment_click_count(p_brand_id UUID, p_ip TEXT, p_user_agent TEXT)
RETURNS void AS $$
BEGIN
  -- Insert detailed log
  INSERT INTO public.click_logs (brand_id, ip_address, user_agent) 
  VALUES (p_brand_id, p_ip, p_user_agent);
  
  -- Increment summary count
  UPDATE public.brands SET click_count = click_count + 1 WHERE id = p_brand_id;
END;
$$ LANGUAGE plpgsql;

-- 6. RPC: get_random_brands (Weight by Priority & Random)
-- This will return brands ordered by a calculated weight (priority * random factor).
CREATE OR REPLACE FUNCTION public.get_random_brands(limit_count INT)
RETURNS SETOF public.brands AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM public.brands 
  WHERE status = 'approved'
  -- ORDER BY (priority * random()) DESC
  ORDER BY priority DESC, random()
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- 7. Set up RLS (Row Level Security)
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logo_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.click_logs ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read-only access to approved brands" ON public.brands FOR SELECT USING (status = 'approved');
CREATE POLICY "Allow public read access to logos" ON public.logo_uploads FOR SELECT USING (true);
CREATE POLICY "Users can read own submissions" ON public.brand_submissions FOR SELECT USING (auth.uid() = user_id);
-- Insert click logs is allowed via RPC typically, or direct insert
CREATE POLICY "Allow anon to insert click log" ON public.click_logs FOR INSERT WITH CHECK (true);
