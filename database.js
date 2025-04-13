const mysql = require('mysql2/promise');
require('dotenv').config();

// Create a connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hero_token',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Initialize the database
async function initDatabase() {
  try {
    const connection = await pool.getConnection();
    
    // Create applications table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS applications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        screenname VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        country VARCHAR(100) NOT NULL,
        kaspa_address VARCHAR(255) NOT NULL,
        age INT DEFAULT NULL,
        about LONGTEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create stats table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS stats (
        id INT PRIMARY KEY DEFAULT 1,
        heroes_enlisted INT DEFAULT 0,
        spots_remaining INT DEFAULT 100,
        countries INT DEFAULT 0,
        tokens_per_hero VARCHAR(50) DEFAULT '1B',
        last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Initialize stats if not present
    const [stats] = await connection.query('SELECT * FROM stats');
    if (stats.length === 0) {
      await connection.query(`
        INSERT INTO stats (heroes_enlisted, spots_remaining, countries, tokens_per_hero)
        VALUES (0, 100, 0, '1B')
      `);
    }
    
    connection.release();
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
  }
}

// fetch applications for admin panel
async function getApplicants(page = 1, limit = 10, search = '') {
  const offset = (page - 1) * limit;
  try {
    let query = 'SELECT * FROM applications ORDER BY timestamp DESC LIMIT ? OFFSET ?';
    let params = [limit, offset];

    if (search && search.trim() !== '') {
      query = `
        SELECT * FROM applications 
        WHERE screenname LIKE ? OR email LIKE ? OR country LIKE ? 
        ORDER BY timestamp DESC LIMIT ? OFFSET ?
      `;
      const wildcard = `%${search}%`;
      params = [wildcard, wildcard, wildcard, limit, offset];
    }

    const [rows] = await pool.query(query, params);
    return rows;
  } catch (error) {
    console.error('Error fetching applicants:', error);
    return [];
  }
}


// Get current stats
async function getStats() {
  try {
    const [rows] = await pool.query('SELECT * FROM stats WHERE id = 1');
    return rows[0] || { heroes_enlisted: 0, spots_remaining: 100, countries: 0, tokens_per_hero: '1B' };
  } catch (error) {
    console.error('Error fetching stats:', error);
    return { heroes_enlisted: 0, spots_remaining: 100, countries: 0, tokens_per_hero: '1B' };
  }
}

// Update stats with new application
async function updateStatsWithNewApplication(country) {
  try {
    // Begin transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    
    try {
      // Get current stats
      const [currentStats] = await connection.query('SELECT * FROM stats WHERE id = 1');
      const stats = currentStats[0];
      
      // Get count of unique countries
      const [countryResult] = await connection.query(
        'SELECT COUNT(DISTINCT country) AS country_count FROM applications'
      );
      const countryCount = countryResult[0].country_count;
      
      // Update stats
      await connection.query(
        `UPDATE stats SET 
          heroes_enlisted = heroes_enlisted + 1,
          spots_remaining = spots_remaining - 1,
          countries = ?,
          last_updated = NOW()
        WHERE id = 1`,
        [countryCount]
      );
      
      await connection.commit();
      connection.release();
      
      return true;
    } catch (err) {
      await connection.rollback();
      connection.release();
      throw err;
    }
  } catch (error) {
    console.error('Error updating stats:', error);
    return false;
  }
}

// Save application to database
async function saveApplication(application) {
  try {
    // Insert application
    const result = await pool.query(
      `INSERT INTO applications (screenname, email, country, kaspa_address, age, about) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        application.screenname, 
        application.email, 
        application.country, 
        application['kaspa-address'],
        application.age || null,
        application.introduction || null
      ]
    );
    
    // Update stats based on this application
    await updateStatsWithNewApplication(application.country);
    
    return { success: true, id: result[0].insertId };
  } catch (error) {
    console.error('Error saving application:', error);
    return { success: false, error: error.message };
  }
}

// Get distinct countries from applications table
async function getDistinctCountries() {
  try {
    const [rows] = await pool.query(
      'SELECT DISTINCT country FROM applications ORDER BY country ASC'
    );
    
    // Extract just the country names into an array
    const countries = rows.map(row => row.country);
    
    return { success: true, countries };
  } catch (error) {
    console.error('Error fetching distinct countries:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  pool,
  initDatabase,
  getStats,
  saveApplication,
  getApplicants,
  getDistinctCountries  
};
