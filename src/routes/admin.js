const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const { verifyRole } = require('../middleware/auth');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Route: Get total revenue and booking counts
router.get('/dashboard-stats', verifyRole('admin'), async (req, res) => {
    try {
        // 1. Fetch all bookings that are 'delivered' (completed)
        const { data: bookings, error } = await supabase
            .from('bookings')
            .select('service_type, weight, status');

        if (error) throw error;

        // 2. Simple logic to calculate stats (Assuming a flat rate for this example)
        const totalBookings = bookings.length;
        const completedBookings = bookings.filter(b => b.status === 'delivered').length;
        
        // Example: $5 per kg calculation
        const estimatedRevenue = bookings
            .filter(b => b.status === 'delivered')
            .reduce((sum, b) => sum + (b.weight * 5), 0);

        res.json({
            total_bookings: totalBookings,
            completed_bookings: completedBookings,
            estimated_revenue: `₱${estimatedRevenue.toFixed(2)}`
        });

    } catch (error) {
        console.error('Admin Stats Error:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;