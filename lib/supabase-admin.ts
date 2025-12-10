import { createClient } from '@supabase/supabase-js';

// Esse cliente tem SUPER PODERES. Só use em rotas de API (backend).
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, 
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);