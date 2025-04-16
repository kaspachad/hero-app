const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { getApplicants, getStats } = require('../database');

// Get dashboard stats
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const stats = await getStats();
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

    const result = await getApplicants(offset, limit);

    // Ensure we have data even if social_media field isn't in every record
    const applications = result.map(app => ({
      ...app,
      social_media: app.social_media || '', // Ensure social_media is never null/undefined
      age: app.age || '',  // Ensure age is never null/undefined
      about: app.about || '' // Ensure about is never null/undefined
    }));

    res.json({ applications });
  } catch (error) {
    console.error('Error fetching applicants:', error);
    res.status(500).json({ message: 'Failed to fetch applicants' });
  }
});

// Approve application endpoint
router.post('/approve/:id', authenticateToken, async (req, res) => {
  console.log(`Approve triggered for ID: ${req.params.id}`);
  res.status(200).json({ message: 'Approved (dummy)' });
});

// Deny application endpoint
router.post('/deny/:id', authenticateToken, async (req, res) => {
  console.log(`Deny triggered for ID: ${req.params.id}`);
  res.status(200).json({ message: 'Denied (dummy)' });
});

module.exports = router;
