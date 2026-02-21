const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { verifyRole } = require('../middleware/auth');

// Route: Get total revenue and booking counts
router.get('/dashboard-stats', verifyRole('Admin'), async (req, res) => {
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
router.get('/users', verifyRole('Admin'), async (req, res) => {
    try {
        // Fetch auth users (has email and phone)
        const { data: { users: authUsers }, error: authError } = await supabase.auth.admin.listUsers();
        if (authError) throw authError;

        // Fetch profiles (has role, full_name)
        const { data: profiles, error: profileError } = await supabase
            .from('profiles')
            .select('*');
        if (profileError) throw profileError;

        // Merge auth users with their profiles
        const mergedUsers = authUsers.map(authUser => {
            const profile = profiles.find(p => p.id === authUser.id) || {};
            return {
                id: authUser.id,
                email: authUser.email || null,
                phone: authUser.phone || profile.phone_number || null,
                full_name: profile.full_name || null,
                role: profile.role || 'Customer',
                updated_at: profile.updated_at || authUser.created_at,
                created_at: authUser.created_at,
            };
        });

        res.json(mergedUsers);
    } catch (error) {
        console.error('Fetch Users Error:', error.message);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// Route: Update user details (role, phone, email, name)
router.put('/users/:id/role', verifyRole('Admin'), async (req, res) => {
    const { id } = req.params;
    const { role, phone, email, name } = req.body;

    if (role && !['Customer', 'Staff', 'Rider', 'Admin'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role' });
    }

    try {
        // Update profile fields (role, phone_number, full_name)
        const profileUpdate = {};
        if (role) profileUpdate.role = role;
        if (phone !== undefined) profileUpdate.phone_number = phone;
        if (name !== undefined) profileUpdate.full_name = name;

        if (Object.keys(profileUpdate).length > 0) {
            const { error } = await supabase
                .from('profiles')
                .update(profileUpdate)
                .eq('id', id);

            if (error) throw error;
        }

        // Update auth user phone/email if provided
        if (phone !== undefined || email !== undefined) {
            const authUpdate = {};

            // Convert phone to E.164 format for Supabase auth
            if (phone !== undefined && phone) {
                let e164Phone = phone;
                // Philippine format: 09xx -> +639xx
                if (e164Phone.startsWith('0')) {
                    e164Phone = '+63' + e164Phone.substring(1);
                }
                // Only update auth if phone is in E.164 format
                if (e164Phone.startsWith('+')) {
                    authUpdate.phone = e164Phone;
                }
            }

            if (email !== undefined) authUpdate.email = email;

            if (Object.keys(authUpdate).length > 0) {
                const { error: authError } = await supabase.auth.admin.updateUserById(id, authUpdate);
                if (authError) console.error('Auth update warning:', authError.message);
            }
        }

        res.json({ message: 'User updated successfully' });
    } catch (error) {
        console.error('Update User Error:', error.message);
        res.status(500).json({ error: 'Failed to update user' });
    }
});

// Route: Delete user
router.delete('/users/:id', verifyRole('Admin'), async (req, res) => {
    const { id } = req.params;

    try {
        // Delete profile first
        const { error: profileError } = await supabase
            .from('profiles')
            .delete()
            .eq('id', id);

        if (profileError) {
            console.error('Profile delete warning:', profileError.message);
        }

        // Delete from auth.users
        const { error: authError } = await supabase.auth.admin.deleteUser(id);
        if (authError) throw authError;

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Delete User Error:', error.message);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

module.exports = router;