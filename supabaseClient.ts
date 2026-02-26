
import { createClient } from '@supabase/supabase-js';

// Accessing via process.env because of the vite.config.ts 'define' block
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://azipjstcwvwrqiujhyph.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6aXBqc3Rjd3Z3cnFpdWpoeXBoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0ODI0MjIsImV4cCI6MjA4NTA1ODQyMn0.SCLCruByQCt80MdvUbe0_bRYp-qq5KoEpETu9zf25no';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const isSupabaseConfigured = () => !!process.env.VITE_SUPABASE_URL;
