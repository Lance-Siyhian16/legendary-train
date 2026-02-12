// src/routes/bookRoutes.js
const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

// Create a booking
router.post('/', async (req, res) => {
    try {
        const { userId, serviceType, schedule } = req.body;
        const { data, error } = await supabase
            .from('bookings')
            .insert([{ user_id: userId, service_type: serviceType, status: 'pending', schedule }])
            .select();

        if (error) return res.status(500).json({ error: error.message });

        // Create a notification for the booking
        await supabase.from('notifications').insert([{
            user_id: userId,
            message: `New booking for ${serviceType} confirmed!`
        }]);

        res.status(201).json(data);
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get notifications for a user
router.get('/notifications/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) return res.status(500).json({ error: error.message });
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
