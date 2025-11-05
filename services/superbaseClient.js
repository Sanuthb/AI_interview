import { createClient } from "@supabase/supabase-js";

const  superbaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const  superbaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
export const supabase = createClient(superbaseUrl, superbaseKey);