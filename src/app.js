// src/app.js — Main entry point
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const bookRoutes = require('./routes/bookRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));
app.use(express.json());

// API Endpoints
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/booking', bookRoutes);

// Health check
app.get('/', (req, res) => {
    res.json({ status: 'ok', message: 'Herland Laundry API is running' });
});

app.listen(PORT, () => console.log(`🚀 Herland API running on http://localhost:${PORT}`));