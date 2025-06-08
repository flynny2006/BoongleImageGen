import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bvgoomywluxsnyzpeegp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2Z29vbXl3bHV4c255enBlZWdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkzOTM4NDMsImV4cCI6MjA2NDk2OTg0M30.Bwafx5Qxm45YdxMIdKIyJn3qw6Pi_9DSNgJrPrr7qDc';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL or Anon Key is missing. Check your environment variables or configuration.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
