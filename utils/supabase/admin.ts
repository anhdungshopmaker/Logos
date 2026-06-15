import { createClient } from '@supabase/supabase-js';

// WARNING: This client bypasses Row Level Security (RLS).
// NEVER use this client on the frontend or expose it to users.
// ONLY use this inside Next.js Server Components, Server Actions, or API Route Handlers
// where the user's permissions have already been manually verified.

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL');
}
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing env.SUPABASE_SERVICE_ROLE_KEY');
}

export const adminAuthClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
