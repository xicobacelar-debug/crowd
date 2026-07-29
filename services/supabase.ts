import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Publishable key — safe to ship in the client; row-level security on the
// server restricts every request to the signed-in user's own rows.
const SUPABASE_URL = 'https://dqtonjdjqvzoqgrhfatv.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_kA4WqDj9xPGWkozBOlH63A_4HrEavkz';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
