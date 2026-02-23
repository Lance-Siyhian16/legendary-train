const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Express App
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors()); // Allows your Frontend to talk to this Backend
app.use(express.json());

// Default Route
app.get('/', (req, res) => {
    res.send('Welcome to Herland Laundry System API');
});

// Middleware Imports
const { requireAuth } = require('./middleware/auth');

// Supabase Initialization --> THE LINK is in .env

const supabase = require('./config/supabase');

// Import Modular Routes (Domain Isolation)
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/admin');
const staffRoutes = require('./routes/staff');
const customerRoutes = require('./routes/customer');

// Mount Admin Routes
app.use('/api/v1/admin', adminRoutes);

// Mount Customer Routes
app.use('/api/v1/customer', customerRoutes);

// --- Existing API Endpoints (Preserved) ---

// 1. Register
app.post('/api/v1/auth/register', async (req, res) => {
    const { email, phone, password, metadata } = req.body;

    // Convert phone to E.164 format for Supabase auth
    let e164Phone = phone;
    if (e164Phone && e164Phone.startsWith('0')) {
        e164Phone = '+63' + e164Phone.substring(1);
    }

    const { data, error } = await supabase.auth.signUp({
        email: email || undefined,
        phone: (e164Phone && e164Phone.startsWith('+')) ? e164Phone : undefined,
        password,
        options: { data: metadata }
    });
    if (error) return res.status(400).json({ error: error.message });

    // Save phone number and full name to the profiles table
    const userId = data.user?.id;
    if (userId) {
        const profileUpdate = {};
        if (metadata?.phone) profileUpdate.phone_number = metadata.phone;
        if (metadata?.full_name) profileUpdate.full_name = metadata.full_name;

        if (Object.keys(profileUpdate).length > 0) {
            const { error: profileError } = await supabase
                .from('profiles')
                .upsert({ id: userId, ...profileUpdate }, { onConflict: 'id' });

            if (profileError) {
                console.error('Profile update error:', profileError.message);
            }
        }
    }

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
app.post('/api/v1/bookings', requireAuth, async (req, res) => {
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
app.get('/api/v1/notifications/:userId', requireAuth, async (req, res) => {
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

async function testConnection() {
    console.log("🔍 Checking Supabase connection...");
    // Use 'profiles' or another small table to test connection. 
    // If 'profiles' doesn't exist, this might fail, but connection itself is tested.
    const { data, error } = await supabase.from('profiles').select('*').limit(1);
    
    if (error) {
        console.error("❌ Connection Failed:", error.message);
    } else {
        console.log("✅ Connection Successful! Database is talking to the Backend.");
    }
}

testConnection();