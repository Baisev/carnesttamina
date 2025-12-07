import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

export const SUPABASE_URL = 'https://bagilcaibwidyewiqqzd.supabase.co'
export const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhZ2lsY2FpYndpZHlld2lxcXpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwMjY3NDEsImV4cCI6MjA3NDYwMjc0MX0.VsVsH8c9fpjKxgmuNWYUCqE8e8DDcXicUELTexNJaAU'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
