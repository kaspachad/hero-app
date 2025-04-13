const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { getApplicants, getDashboardStats } = require('../database');

console.log("🧠 admin-routes.js IS LOADED");


// Get dashboard stats
router.get('/api/admin/stats', authenticateToken, async (req, res) => {
  try {
    const stats = await getDashboardStats();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Failed to fetch stats' });
  }
});

// Get applicants with pagination and search
router.get('/applicants', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    console.log('✅ Parsed params →', { page, limit, offset });

    const result = await getApplicants(offset, limit); // THIS is the key line

    console.log(`📦 DB Query → LIMIT ${limit} OFFSET ${offset}`);
    console.log(`📄 DB returned ${result.length} rows`);

    res.json({ applications: result });
  } catch (error) {
    console.error('❌ Error fetching applicants:', error);
    res.status(500).json({ message: 'Failed to fetch applicants' });
  }
});

// Dummy approval endpoint
router.post('/api/admin/approve/:id', authenticateToken, async (req, res) => {
  console.log(`✅ Approve triggered for ID: ${req.params.id}`);
  res.status(200).json({ message: 'Approved (dummy)' });
});

// Dummy denial endpoint
router.post('/api/admin/deny/:id', authenticateToken, async (req, res) => {
  console.log(`❌ Deny triggered for ID: ${req.params.id}`);
  res.status(200).json({ message: 'Denied (dummy)' });
});

module.exports = router;

