const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { requireAuth } = require('../middleware/auth');

// ─── Table schema (from Supabase error details) ────────────────────────────────
// bookings: id, user_id, service_type (NOT NULL), status, schedule (timestamptz),
//           created_at, reference_number, stage (CHECK: received|payment|preparation|shipping|final|done),
//           timeline (jsonb), service_details (jsonb), collection_details (jsonb),
//           payment_details (jsonb), notes, collection_option

// ─── Create a booking ──────────────────────────────────────────────────────────
router.post('/book', requireAuth, async (req, res) => {
    const {
        reference_number,
        collection_option,
        service_details,
        collection_details,
        payment_details,
        notes,
    } = req.body;

    if (!reference_number) {
        return res.status(400).json({ error: 'Missing reference number' });
    }

    try {
        const nowIso = new Date().toISOString();

        // Build a human-readable service_type string
        const serviceNames =
            service_details?.selectedServices?.join(', ') || 'Laundry Service';

        const { data, error } = await supabase
            .from('bookings')
            .insert([
                {
                    user_id: req.user.id,
                    service_type: serviceNames,
                    status: 'pending',
                    schedule: nowIso,
                    reference_number,
                    stage: 'received',
                    collection_option: collection_option || 'dropOffPickUpLater',
                    timeline: [{ status: 'Booking Received', timestamp: nowIso }],
                    service_details: service_details || null,
                    collection_details: collection_details || null,
                    payment_details: payment_details || null,
                    notes: notes || '',
                },
            ])
            .select()
            .single();

        if (error) {
            console.error('Supabase insert error:', JSON.stringify(error, null, 2));
            return res.status(500).json({ error: 'Failed to create booking. ' + error.message });
        }

        res.status(201).json({
            message: 'Booking created successfully!',
            booking: data,
        });
    } catch (error) {
        console.error('Error creating booking:', error.message || error);
        res.status(500).json({ error: 'Failed to create booking. Please try again.' });
    }
});

// ─── Helper: normalize a DB row into the frontend shape ─────────────────────────
function normalizeBooking(b) {
    return {
        id: b.reference_number || b.id,
        dbId: b.id,
        userId: b.user_id,
        customerName: b.service_type || 'Laundry Service',
        date: b.created_at
            ? new Date(b.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
              })
            : '-',
        collectionOption: b.collection_option || 'dropOffPickUpLater',
        stage: b.stage || 'received',
        timeline: b.timeline || [
            { status: 'Booking Received', timestamp: b.created_at || new Date().toISOString() },
        ],
        serviceDetails: b.service_details || null,
        collectionDetails: b.collection_details || null,
        paymentDetails: b.payment_details || null,
        status: b.status || 'pending',
        notes: b.notes || '',
    };
}

// ─── Get my bookings ────────────────────────────────────────────────────────────
router.get('/my-bookings', requireAuth, async (req, res) => {
    try {
        const { data: bookings, error } = await supabase
            .from('bookings')
            .select('*')
            .eq('user_id', req.user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        const mapped = (bookings || []).map(normalizeBooking);
        res.json(mapped);
    } catch (error) {
        console.error('Fetch My Bookings Error:', error.message);
        res.status(500).json({ error: 'Failed to fetch bookings' });
    }
});

// ─── Helper: find a booking by reference_number or ID ──────────────────────────
async function getBookingByIdOrRef(id, userId, hasBypass = false) {
    // 1. Check if it's a numeric ID
    const isNumeric = /^\d+$/.test(id);
    
    let query = supabase.from('bookings').select('*');
    
    // 2. Build OR filter
    if (isNumeric) {
        query = query.or(`reference_number.eq.${id},id.eq.${id}`);
    } else {
        query = query.eq('reference_number', id);
    }

    // 3. Ownership check if not bypassed
    if (!hasBypass) {
        query = query.eq('user_id', userId);
    }

    const { data, error } = await query.maybeSingle();
    if (error) console.error('[DEBUG] getBookingByIdOrRef error:', error);
    return data;
}

// ─── Get a single booking ──────────────────────────────────────────────────────
router.get('/my-bookings/:id', requireAuth, async (req, res) => {
    const { id } = req.params;
    console.log(`[DEBUG] Fetching booking: ${id} for user: ${req.user.id}`);

    try {
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', req.user.id)
            .maybeSingle();

        const hasBypass = profile?.role === 'Admin' || profile?.role === 'Staff';
        const booking = await getBookingByIdOrRef(id, req.user.id, hasBypass);

        if (!booking) {
            console.log(`[DEBUG] Booking ${id} not found for user ${req.user.id}`);
            return res.status(404).json({ error: 'Booking not found' });
        }

        res.json(normalizeBooking(booking));
    } catch (error) {
        console.error('Fetch Single Booking Error:', error.message);
        res.status(500).json({ error: 'Failed to fetch booking' });
    }
});

// ─── Update payment reference ──────────────────────────────────────────────────
router.post('/my-bookings/:id/payment-reference', requireAuth, async (req, res) => {
    const { id } = req.params;
    const { referenceNumber } = req.body;

    if (!referenceNumber) {
        return res.status(400).json({ error: 'Reference number is required' });
    }

    try {
        const booking = await getBookingByIdOrRef(id, req.user.id);

        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        const currentPayment = booking.payment_details || {};
        const updatedPayment = {
            ...currentPayment,
            referenceNumber: referenceNumber,
        };

        const { error: updateError } = await supabase
            .from('bookings')
            .update({ payment_details: updatedPayment })
            .eq('id', booking.id);

        if (updateError) throw updateError;

        res.json({ message: 'Payment reference updated successfully' });
    } catch (error) {
        console.error('Update Payment Reference Error:', error.message);
        res.status(500).json({ error: 'Failed to update payment reference' });
    }
});

module.exports = router;