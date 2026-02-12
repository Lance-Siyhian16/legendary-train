/*
// backend/server.js
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors()); // Allows your Frontend to talk to this Backend
app.use(express.json());

// Supabase Initialization
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// --- API Endpoints ---

// 1. Register
app.post('/api/v1/auth/register', async (req, res) => {
    const { email, password, metadata } = req.body;
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: metadata }
    });
    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json({ message: 'User registered successfully', data });
});

// 2. Login
app.post('/api/v1/auth/login', async (req, res) => {
    const { email, password } = req.body;
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return res.status(401).json({ error: error.message });
    res.status(200).json({ token: data.session.access_token, user: data.user });
});

// 3. Booking
app.post('/api/v1/bookings', async (req, res) => {
    const { userId, serviceType, schedule } = req.body;
    const { data, error } = await supabase
        .from('bookings')
        .insert([{ user_id: userId, service_type: serviceType, status: 'pending', schedule }])
        .select();

    if (error) return res.status(500).json({ error: error.message });

    // Logic for Notification Bin
    await supabase.from('notifications').insert([{ user_id: userId, message: `New booking for ${serviceType} confirmed!` }]);

    res.status(201).json(data);
});

// 4. Notifications Fetch
app.get('/api/v1/notifications/:userId', async (req, res) => {
    const { userId } = req.params;
    const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    res.status(200).json(data);
});

app.listen(PORT, () => console.log(`🚀 Herland Backend running on http://localhost:${PORT}`));
*/

// backend/src/server.js
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.https://pipjndxdustaobgonnam.supabase.co, process.env.eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBpcGpuZHhkdXN0YW9iZ29ubmFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMzQyMzksImV4cCI6MjA2OTgxMDIzOX0.781w3201-717-449-844-1754234239);

async function testConnection() {
    console.log("🔍 Checking Supabase connection...");
    const { data, error } = await supabase.from('profiles').select('*').limit(1);
    
    if (error) {
        console.error("❌ Connection Failed:", error.message);
    } else {
        console.log("✅ Connection Successful! Database is talking to the Backend.");
    }
}

testConnection();