// src/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

// Register
// Register
router.post('/register', async (req, res) => {
    try {
        const { email, password, phone, metadata } = req.body;
        
        // Prepare Supabase SignUp Options
        let signUpOptions = {
            password,
            options: {
                data: metadata,
            }
        };

        // If email is provided, use it
        if (email && email.trim() !== '') {
            signUpOptions.email = email;
            signUpOptions.options.emailRedirectTo = 'http://localhost:5173/login';
        } else if (phone) {
            // If no email, try phone. Supabase requires E.164 format (e.g., +639...)
            // Assuming input is 09xxxxxxxxx, convert to +639xxxxxxxxx
            let formattedPhone = phone.replace(/^0/, '+63');
            if (!formattedPhone.startsWith('+')) {
                formattedPhone = `+${formattedPhone}`; // Fallback/Safety
            }
            signUpOptions.phone = formattedPhone;
        } else {
            return res.status(400).json({ error: 'Email or Phone Number is required.' });
        }

        const { data, error } = await supabase.auth.signUp(signUpOptions);

        if (error) return res.status(400).json({ error: error.message });
        res.status(201).json({ message: 'User registered successfully', data });
    } catch (err) {
        console.error("Register Error:", err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) return res.status(401).json({ error: error.message });
        res.status(200).json({ token: data.session.access_token, user: data.user });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;