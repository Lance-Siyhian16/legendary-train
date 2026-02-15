const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const { verifyRole } = require('../middleware/auth');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Route: Update booking status (e.g., pending -> washing -> ready)
router.patch('/update-status/:id', verifyRole('staff'), async (req, res) => {
    const { id } = req.params; // Get the booking ID from the URL
    const { new_status } = req.body; // Get the new status from the frontend

    // 1. List of valid statuses to prevent accidental typos in the database
    const validStatuses = ['pending', 'picked_up', 'washing', 'ready', 'delivered'];

    if (!validStatuses.includes(new_status)) {
        return res.status(400).json({ error: 'Invalid status update' });
    }

    try {
        // 2. Update the specific booking in Supabase
        const { data, error } = await supabase
            .from('bookings')
            .update({ status: new_status })
            .eq('id', id) // Ensure we only update the booking with this specific ID
            .select();

        if (error) throw error;

        if (data.length === 0) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        // 3. Success response
        res.json({
            message: `Order status successfully updated to ${new_status}`,
            updatedBooking: data[0]
        });

    } catch (error) {
        console.error('Staff Update Error:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;