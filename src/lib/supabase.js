import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://xlhdakujfjmsmyvdrdcc.supabase.co";
const supabaseKey = "sb_publishable_3Ad22S20Hs03zOImKluyuA_7eRKZip8";

export const supabase = createClient(supabaseUrl, supabaseKey);