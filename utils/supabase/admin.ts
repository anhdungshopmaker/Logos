import { createClient } from '@supabase/supabase-js';

// WARNING: This client bypasses Row Level Security (RLS).
// NEVER use this client on the frontend or expose it to users.
// ONLY use this inside Next.js Server Components, Server Actions, or API Route Handlers
// where the user's permissions have already been manually verified.

export const adminAuthClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy_key',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
