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
router.get('/bookings', verifyRole(['Admin', 'Staff']), async (req, res) => {
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
router.put('/bookings/:id/status', verifyRole(['Admin', 'Staff']), async (req, res) => {
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
router.put('/bookings/:id/amount', verifyRole(['Admin', 'Staff']), async (req, res) => {
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

// ─── Services Management Routes ─────────────────────────────────────────────────

// Route: Get all services, add-ons, and schedule
router.get('/services', verifyRole('Admin'), async (req, res) => {
    try {
        // Fetch service items (services + add-ons)
        const { data: items, error: itemsError } = await supabase
            .from('service_items')
            .select('*')
            .order('sort_order', { ascending: true });

        if (itemsError) throw itemsError;

        // Fetch schedule
        const { data: scheduleRows, error: schedError } = await supabase
            .from('shop_schedule')
            .select('*')
            .limit(1);

        if (schedError) throw schedError;

        const services = (items || [])
            .filter(i => i.type === 'service')
            .map(i => ({
                id: i.id,
                name: i.name,
                currentPrice: Number(i.current_price),
                previousPrice: i.previous_price != null ? Number(i.previous_price) : null,
            }));

        const addOns = (items || [])
            .filter(i => i.type === 'addon')
            .map(i => ({
                id: i.id,
                name: i.name,
                currentPrice: Number(i.current_price),
                previousPrice: i.previous_price != null ? Number(i.previous_price) : null,
            }));

        const schedule = scheduleRows && scheduleRows.length > 0
            ? {
                opens: scheduleRows[0].opens,
                closes: scheduleRows[0].closes,
                previousOpens: scheduleRows[0].previous_opens || null,
                previousCloses: scheduleRows[0].previous_closes || null,
            }
            : null;

        res.json({ services, addOns, schedule });
    } catch (error) {
        console.error('Fetch Services Error:', error.message);
        res.status(500).json({ error: 'Failed to fetch services' });
    }
});

// Route: Add a new service or add-on
router.post('/services/items', verifyRole('Admin'), async (req, res) => {
    const { type, name, currentPrice } = req.body;

    if (!type || !name || currentPrice === undefined) {
        return res.status(400).json({ error: 'type, name, and currentPrice are required' });
    }
    if (!['service', 'addon'].includes(type)) {
        return res.status(400).json({ error: 'type must be "service" or "addon"' });
    }

    try {
        // Get max sort_order for ordering
        const { data: existing } = await supabase
            .from('service_items')
            .select('sort_order')
            .eq('type', type)
            .order('sort_order', { ascending: false })
            .limit(1);

        const nextOrder = (existing && existing.length > 0 ? existing[0].sort_order : 0) + 1;

        const { data, error } = await supabase
            .from('service_items')
            .insert({
                type,
                name: name.trim(),
                current_price: Number(currentPrice),
                previous_price: null,
                sort_order: nextOrder,
            })
            .select()
            .single();

        if (error) throw error;

        res.json({
            id: data.id,
            name: data.name,
            currentPrice: Number(data.current_price),
            previousPrice: null,
        });
    } catch (error) {
        console.error('Add Service Item Error:', error.message);
        res.status(500).json({ error: 'Failed to add item' });
    }
});

// Route: Update a service or add-on price
router.put('/services/items/:id', verifyRole('Admin'), async (req, res) => {
    const { id } = req.params;
    const { currentPrice, previousPrice } = req.body;

    if (currentPrice === undefined) {
        return res.status(400).json({ error: 'currentPrice is required' });
    }

    try {
        const updateData = {
            current_price: Number(currentPrice),
        };
        if (previousPrice !== undefined) {
            updateData.previous_price = previousPrice !== null ? Number(previousPrice) : null;
        }

        const { error } = await supabase
            .from('service_items')
            .update(updateData)
            .eq('id', id);

        if (error) throw error;

        res.json({ message: 'Item updated successfully' });
    } catch (error) {
        console.error('Update Service Item Error:', error.message);
        res.status(500).json({ error: 'Failed to update item' });
    }
});

// Route: Delete a service or add-on
router.delete('/services/items/:id', verifyRole('Admin'), async (req, res) => {
    const { id } = req.params;

    try {
        const { error } = await supabase
            .from('service_items')
            .delete()
            .eq('id', id);

        if (error) throw error;

        res.json({ message: 'Item deleted successfully' });
    } catch (error) {
        console.error('Delete Service Item Error:', error.message);
        res.status(500).json({ error: 'Failed to delete item' });
    }
});

// Route: Update shop schedule
router.put('/services/schedule', verifyRole('Admin'), async (req, res) => {
    const { opens, closes, previousOpens, previousCloses } = req.body;

    if (!opens || !closes) {
        return res.status(400).json({ error: 'opens and closes are required' });
    }

    try {
        // Upsert: check if a schedule row exists
        const { data: existing } = await supabase
            .from('shop_schedule')
            .select('id')
            .limit(1);

        if (existing && existing.length > 0) {
            const updateData = { opens, closes, updated_at: new Date().toISOString() };
            if (previousOpens !== undefined) updateData.previous_opens = previousOpens;
            if (previousCloses !== undefined) updateData.previous_closes = previousCloses;

            const { error } = await supabase
                .from('shop_schedule')
                .update(updateData)
                .eq('id', existing[0].id);

            if (error) throw error;
        } else {
            const { error } = await supabase
                .from('shop_schedule')
                .insert({
                    opens,
                    closes,
                    previous_opens: previousOpens || null,
                    previous_closes: previousCloses || null,
                });

            if (error) throw error;
        }

        res.json({ message: 'Schedule updated successfully' });
    } catch (error) {
        console.error('Update Schedule Error:', error.message);
        res.status(500).json({ error: 'Failed to update schedule' });
    }
});

// Route: Get all FAQs
router.get('/services/faqs', verifyRole('Admin'), async (req, res) => {
    try {
        const { data: faqs, error } = await supabase
            .from('faqs')
            .select('*')
            .order('sort_order', { ascending: true });

        if (error) throw error;

        const mapped = (faqs || []).map(f => ({
            id: f.id,
            question: f.question,
            answer: f.answer,
            sortOrder: f.sort_order,
        }));

        res.json(mapped);
    } catch (error) {
        console.error('Fetch FAQs Error:', error.message);
        res.status(500).json({ error: 'Failed to fetch FAQs' });
    }
});

// Route: Add or update a FAQ
router.post('/services/faqs', verifyRole('Admin'), async (req, res) => {
    const { id, question, answer } = req.body;

    if (!question || !answer) {
        return res.status(400).json({ error: 'question and answer are required' });
    }

    try {
        if (id) {
            // Update existing
            const { error } = await supabase
                .from('faqs')
                .update({ question: question.trim(), answer: answer.trim() })
                .eq('id', id);

            if (error) throw error;
            res.json({ message: 'FAQ updated successfully' });
        } else {
            // Add new
            const { data: existing } = await supabase
                .from('faqs')
                .select('sort_order')
                .order('sort_order', { ascending: false })
                .limit(1);

            const nextOrder = (existing && existing.length > 0 ? existing[0].sort_order : 0) + 1;

            const { data, error } = await supabase
                .from('faqs')
                .insert({
                    question: question.trim(),
                    answer: answer.trim(),
                    sort_order: nextOrder,
                })
                .select()
                .single();

            if (error) throw error;
            res.json({ id: data.id, question: data.question, answer: data.answer });
        }
    } catch (error) {
        console.error('Save FAQ Error:', error.message);
        res.status(500).json({ error: 'Failed to save FAQ' });
    }
});

// Route: Reorder FAQs
router.put('/services/faqs/reorder', verifyRole('Admin'), async (req, res) => {
    const { orderedIds } = req.body;

    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
        return res.status(400).json({ error: 'orderedIds array is required' });
    }

    try {
        const updates = orderedIds.map((id, index) =>
            supabase.from('faqs').update({ sort_order: index }).eq('id', id)
        );

        await Promise.all(updates);
        res.json({ message: 'FAQs reordered successfully' });
    } catch (error) {
        console.error('Reorder FAQs Error:', error.message);
        res.status(500).json({ error: 'Failed to reorder FAQs' });
    }
});

// Route: Delete a FAQ
router.delete('/services/faqs/:id', verifyRole('Admin'), async (req, res) => {
    const { id } = req.params;

    try {
        const { error } = await supabase
            .from('faqs')
            .delete()
            .eq('id', id);

        if (error) throw error;

        res.json({ message: 'FAQ deleted successfully' });
    } catch (error) {
        console.error('Delete FAQ Error:', error.message);
        res.status(500).json({ error: 'Failed to delete FAQ' });
    }
});

module.exports = router;