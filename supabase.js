import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = "https://tsjooishylasseijkard.supabase.co";
const SUPABASE_KEY = "TU_ANON_KEY";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
