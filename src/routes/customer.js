const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const { verifyRole } = require('../middleware/auth');

// Initialize Supabase (Use your variables from .env)
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

router.post('/book', verifyRole('customer'), async (req, res) => {
    // 1. Destructure the booking details sent from the frontend
    const { service_type, weight, pickup_address, delivery_address, notes } = req.body;

    // 2. Validate essential data
    if (!service_type || !pickup_address) {
        return res.status(400).json({ error: 'Missing required booking information' });
    }

    try {
        // 3. Insert into the "bookings" table
        // req.user.id comes from your verifyRole middleware
        const { data, error } = await supabase
            .from('bookings')
            .insert([
                {
                    customer_id: req.user.id, // Links the booking to the logged-in user
                    service_type,
                    weight,
                    pickup_address,
                    delivery_address,
                    notes,
                    status: 'pending' // Default status for new bookings
                }
            ])
            .select(); // Returns the created booking record

        if (error) throw error;

        // 4. Send success response
        res.status(201).json({
            message: 'Booking created successfully!',
            booking: data[0]
        });

    } catch (error) {
        console.error('Error creating booking:', error.message);
        res.status(500).json({ error: 'Failed to create booking. Please try again.' });
    }
});

module.exports = router;