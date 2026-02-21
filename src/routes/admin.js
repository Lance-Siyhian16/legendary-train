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

// ─── Bookings Management Routes ────────────────────────────────────────────────

// Route: Get all bookings (with customer name from profiles)
router.get('/bookings', verifyRole('Admin'), async (req, res) => {
    try {
        const { data: bookings, error } = await supabase
            .from('bookings')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Fetch profiles for customer names
        const userIds = [...new Set((bookings || []).map(b => b.user_id).filter(Boolean))];
        let profilesMap = {};

        if (userIds.length > 0) {
            const { data: profiles, error: profileError } = await supabase
                .from('profiles')
                .select('id, full_name')
                .in('id', userIds);

            if (!profileError && profiles) {
                profilesMap = Object.fromEntries(profiles.map(p => [p.id, p.full_name]));
            }
        }

        // Map DB rows to the frontend booking model
        const mapped = (bookings || []).map(b => ({
            id: b.reference_number || b.id,
            dbId: b.id,
            customerName: profilesMap[b.user_id] || 'Unknown Customer',
            userId: b.user_id,
            date: b.created_at ? new Date(b.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-',
            collectionOption: b.collection_option || 'dropOffPickUpLater',
            stage: b.stage || 'received',
            timeline: b.timeline || [{ status: 'Booking Received', timestamp: b.created_at || new Date().toISOString() }],
            serviceDetails: b.service_details || null,
            collectionDetails: b.collection_details || null,
            paymentDetails: b.payment_details || null,
            notes: b.notes || '',
        }));

        res.json(mapped);
    } catch (error) {
        console.error('Fetch Bookings Error:', error.message);
        res.status(500).json({ error: 'Failed to fetch bookings' });
    }
});

// Route: Update booking status (when admin clicks action buttons)
router.put('/bookings/:id/status', verifyRole('Admin'), async (req, res) => {
    const { id } = req.params;
    const { status, nextStage, timeline } = req.body;

    if (!status || !nextStage) {
        return res.status(400).json({ error: 'status and nextStage are required' });
    }

    try {
        const updateData = {
            status: status,
            stage: nextStage,
        };

        // If the frontend sends the full updated timeline array, store it
        if (timeline) {
            updateData.timeline = timeline;
        }

        // Also update payment_details status for payment-related actions
        if (status === 'Payment Confirmed' || status === 'Payment Flagged') {
            // Fetch current payment_details to merge
            const { data: current, error: fetchError } = await supabase
                .from('bookings')
                .select('payment_details')
                .eq('id', id)
                .single();

            if (!fetchError && current) {
                const currentPayment = current.payment_details || {};
                updateData.payment_details = {
                    ...currentPayment,
                    status: status,
                };
            }
        }

        const { error } = await supabase
            .from('bookings')
            .update(updateData)
            .eq('id', id);

        if (error) throw error;

        res.json({ message: 'Booking status updated successfully' });
    } catch (error) {
        console.error('Update Booking Status Error:', error.message);
        res.status(500).json({ error: 'Failed to update booking status' });
    }
});

// Route: Save amount to pay for a booking
router.put('/bookings/:id/amount', verifyRole('Admin'), async (req, res) => {
    const { id } = req.params;
    const { amountToPay } = req.body;

    if (amountToPay === undefined || amountToPay === null || Number(amountToPay) <= 0) {
        return res.status(400).json({ error: 'A valid amountToPay is required' });
    }

    try {
        // Fetch current payment_details to merge
        const { data: current, error: fetchError } = await supabase
            .from('bookings')
            .select('payment_details')
            .eq('id', id)
            .single();

        if (fetchError) throw fetchError;

        const currentPayment = current?.payment_details || {};
        const updatedPayment = {
            ...currentPayment,
            amountToPay: Number(amountToPay),
        };

        const { error } = await supabase
            .from('bookings')
            .update({
                payment_details: updatedPayment,
                amount_to_pay: Number(amountToPay),
            })
            .eq('id', id);

        if (error) throw error;

        res.json({ message: 'Amount saved successfully' });
    } catch (error) {
        console.error('Save Amount Error:', error.message);
        res.status(500).json({ error: 'Failed to save amount' });
    }
});

module.exports = router;