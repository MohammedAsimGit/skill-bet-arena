// Supabase client configuration for frontend
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.43.0/+esm';

// Supabase configuration - Using actual credentials from backend .env
const SUPABASE_URL = 'https://qipyygpexuonfjhpgcju.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFpcHl5Z3BleHVvbmZqaHBnY2p1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzMjk1MDcsImV4cCI6MjA3OTkwNTUwN30.6nx12em0zoI_ZOWD-lqKaqcvQlI8puqzwgDNJXjLULY';

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export { supabase };