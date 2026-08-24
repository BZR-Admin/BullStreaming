import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

export const supabase = createClient(
  "https://TU_PROJECT.supabase.co",
  "TU_ANON_KEY",
  {
    auth: {
      persistSession: true,       // guarda la sesión en localStorage
      autoRefreshToken: true      // la renueva automáticamente
    }
  }
);

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = "https://tsjooishylasseijkard.supabase.co";
const SUPABASE_KEY = "sb_publishable_i4drihcN_x3GTKpm3Ayptg_Pp3LzWPf";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
