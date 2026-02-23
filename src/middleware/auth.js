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

const verifyRole = (allowedRoles) => {
    return async (req, res, next) => {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) return res.status(401).json({ error: 'No token provided' });

        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) return res.status(401).json({ error: 'Unauthorized' });

        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profileError || !profile) {
            console.error('Profile lookup failed:', profileError?.message);
            return res.status(403).json({ error: 'Access denied: Could not verify role' });
        }

        const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

        // Admin always has access, or if the user's role is in the allowed list
        const hasAccess = profile.role === 'Admin' || roles.includes(profile.role);

        if (!hasAccess) {
            return res.status(403).json({ error: 'Access denied: Insufficient permissions' });
        }

        req.user = user;
        next();
    };
};

module.exports = { requireAuth, verifyRole };