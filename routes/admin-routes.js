// admin-routes.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const path = require('path');
const { getApplicants, getDashboardStats } = require('../database'); // Use your existing database functions

// Secret for JWT - should be in an environment variable in production
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

// Admin credentials - in production, these should be stored securely in a database
// with properly hashed passwords
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'heroAdmin2024';

// Middleware to authenticate JWT token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid token.' });
    }
};

console.log("🧠 RUNNING admin-routes.js FILE FROM:", __filename);


// Serve the admin login page
router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/admin-login.html'));
});

// Serve the admin dashboard (protected route)
router.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/admin-dashboard.html'));
});

// Login endpoint
router.post('/api/admin/login', async (req, res) => {
    const { username, password } = req.body;
    
    try {
        if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
            // Create token with 24-hour expiration
            const token = jwt.sign(
                { username: username, role: 'admin' },
                JWT_SECRET,
                { expiresIn: '24h' }
            );
            
            res.json({ success: true, token });
        } else {
            res.status(401).json({ message: 'Invalid username or password' });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get dashboard statistics
router.get('/api/admin/stats', authenticateToken, async (req, res) => {
    try {
        // Use your existing database function to get dashboard stats
        const stats = await getDashboardStats();
        res.json(stats);
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ message: 'Failed to fetch dashboard statistics' });
    }
});

// Get applicants with pagination and search
router.get('/api/admin/applicants', authenticateToken, async (req, res) => {
    try {
        console.log("=== RAW QUERY PARAMS ===", req.query);
        
        const page = 1; // hardcoded to isolate bug
        const limit = 10;
        const offset = 0;

        const result = await getApplicants(offset, limit);

        console.log(`📦 DB Query → LIMIT ${limit} OFFSET ${offset}`);
        console.log(`📄 DB returned ${result.length} rows`);

        res.json({ applications: result });
    } catch (error) {
        console.error('Error fetching applicants:', error);
        res.status(500).json({ message: 'Failed to fetch applicants' });
    }
});

module.exports = router;
