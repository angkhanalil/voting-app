import {createClient} from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Client-side: ใช้สำหรับ Real-time subscription เท่านั้น
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
 realtime: {
  params: {
   eventsPerSecond: 10,
  },
 },
});
