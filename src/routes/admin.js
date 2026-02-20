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

// Route: Get all users
router.get('/users', verifyRole('admin'), async (req, res) => {
    try {
        const { data: users, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.json(users);
    } catch (error) {
        console.error('Fetch Users Error:', error.message);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// Route: Update user role
router.put('/users/:id/role', verifyRole('admin'), async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;

    if (!['customer', 'staff', 'admin'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role' });
    }

    try {
        const { data, error } = await supabase
            .from('profiles')
            .update({ role })
            .eq('id', id)
            .select();

        if (error) throw error;

        res.json({ message: 'User role updated successfully', user: data[0] });
    } catch (error) {
        console.error('Update Role Error:', error.message);
        res.status(500).json({ error: 'Failed to update role' });
    }
});

module.exports = router;