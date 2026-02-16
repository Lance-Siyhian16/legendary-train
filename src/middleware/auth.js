const supabase = require('../config/supabase');

const requireAuth = async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1]; // Get token from Frontend

    if (!token) return res.status(401).json({ error: 'No token provided' });

    // Ask Supabase who this token belongs to
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) return res.status(401).json({ error: 'Unauthorized' });

    req.user = user; // Pass user info to the next function
    next();
};

const verifyRole = (allowedRole) => {
    return async (req, res, next) => {
        const token = req.headers.authorization?.split(' ')[1]; // Get token from Frontend

        if (!token) return res.status(401).json({ error: 'No token provided' });

        // Ask Supabase who this token belongs to
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) return res.status(401).json({ error: 'Unauthorized' });

        // 🔑 The Isolation Step: Check the user's role in your 'profiles' table
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== allowedRole && profile?.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied: Insufficient permissions' });
        }

        req.user = user; // Pass user info to the next function
        next();
    };
};

module.exports = { requireAuth, verifyRole };