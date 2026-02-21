// src/config/supabase.js
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Use service role key on the backend to bypass RLS
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

module.exports = supabase;