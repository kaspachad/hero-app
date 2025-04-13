const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3001;
const db = require('./database');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Middleware to parse JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Initialize the database on startup
db.initDatabase().catch(console.error);

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

// Admin credentials - in production, these should be stored securely in a database
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

// API endpoint to get current stats
app.get('/api/stats', async (req, res) => {
  try {
    const stats = await db.getStats();
    res.json({ success: true, stats });
  } catch (error) {
    console.error('Error retrieving stats:', error);
    res.status(500).json({ success: false, message: 'Error retrieving stats' });
  }
});

// get distinct countries of actual users from 'applications' table
app.get('/api/countries', async (req, res) => {
  try {
    const result = await db.getDistinctCountries();
    
    if (result.success) {
      res.json({ success: true, countries: result.countries });
    } else {
      res.status(500).json({ success: false, message: 'Failed to fetch countries' });
    }
  } catch (error) {
    console.error('Error in /api/countries endpoint:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// API endpoint to handle form submissions
app.post('/api/submit-application', async (req, res) => {
  try {
    const formData = req.body;
    
    // Add timestamp to the data
    formData.timestamp = new Date().toISOString();
    
    // Simple validation
    if (!formData.screenname || !formData.email || !formData.country || !formData['kaspa-address']) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }
    
    // Save to database
    const dbResult = await db.saveApplication(formData);
    
    if (!dbResult.success) {
      return res.status(500).json({ success: false, message: 'Database error: ' + dbResult.error });
    }
    
    // Create a backup in file system
    const fileName = `${Date.now()}-${formData.screenname.replace(/[^a-z0-9]/gi, '-')}.json`;
    const dataDir = path.join(__dirname, 'data');
    
    // Create data directory if it doesn't exist
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir);
    }
    
    const filePath = path.join(dataDir, fileName);
    fs.writeFileSync(filePath, JSON.stringify(formData, null, 2));
    
    // Get updated stats
    const updatedStats = await db.getStats();
    
    // Return success response with updated stats
    res.status(200).json({ 
      success: true, 
      message: 'Application submitted successfully',
      application: {
        id: dbResult.id,
        screenname: formData.screenname,
        timestamp: formData.timestamp
      },
      stats: updatedStats
    });
  } catch (error) {
    console.error('Error handling form submission:', error);
    res.status(500).json({ success: false, message: 'Server error processing your application' });
  }
});

// Get all applications (for admin purposes)
app.get('/api/applications', async (req, res) => {
  try {
    // This should be protected with authentication in a real app
    const [applications] = await db.pool.query(
      'SELECT * FROM applications ORDER BY timestamp DESC'
    );
    
    res.json({ success: true, applications });
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ success: false, message: 'Server error fetching applications' });
  }
});

// ===== ADMIN ROUTES =====

// Serve the admin login page
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin-login.html'));
});

// Serve the admin dashboard (for client-side routing)
app.get('/admin/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin-dash.html'));
});

// Login endpoint
app.post('/api/admin/login', async (req, res) => {
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
app.get('/api/admin/stats', authenticateToken, async (req, res) => {
    try {
        // Use the function from database.js to get dashboard stats
        const stats = await db.getStats();
        res.json(stats);
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ message: 'Failed to fetch dashboard statistics' });
    }
});

// Get applicants with pagination and search
app.get('/api/admin/applicants', authenticateToken, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        
        // Use the function from database.js to get applicants
        const result = await db.getApplicants(page, limit, search);
        res.json(result);
    } catch (error) {
        console.error('Error fetching applicants:', error);
        res.status(500).json({ message: 'Failed to fetch applicants' });
    }
});

// Middleware to handle all other routes and serve index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Backup data will be stored in ${path.join(__dirname, 'data')}`);
  console.log(`Admin panel available at http://localhost:${PORT}/admin`);
});
