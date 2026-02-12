// src/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

// Register
router.post('/register', async (req, res) => {
    try {
        const { email, password, metadata } = req.body;
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: metadata,
                emailRedirectTo: 'http://localhost:5173/login'
            }
        });

        if (error) return res.status(400).json({ error: error.message });
        res.status(201).json({ message: 'User registered successfully', data });
    } catch (err) {
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
