const express = require('express');
const router = express.Router();
const db = require('../db/database');

// 1. Get current system settings
router.get('/', (req, res) => {
    try {
        const settings = db.prepare('SELECT * FROM system_settings WHERE id = 1').get();
        settings.is_open = settings.is_open === 1; // Convert 1/0 back to true/false for React
        res.status(200).json({ status: 'success', data: settings });
    } catch (error) {
        res.status(500).json({ status: 'error', error: error.message });
    }
});

// 2. Update system settings (Open/Close, change SY/Sem)
router.post('/', (req, res) => {
    const { school_year, semester, is_open } = req.body;
    const statusInt = is_open ? 1 : 0;
    
    try {
        db.prepare('UPDATE system_settings SET school_year = ?, semester = ?, is_open = ? WHERE id = 1')
          .run(school_year, semester, statusInt);
        res.status(200).json({ status: 'success', message: 'Settings updated' });
    } catch (error) {
        res.status(500).json({ status: 'error', error: error.message });
    }
});

// 3. ARCHIVE all current applications
router.post('/archive', (req, res) => {
    try {
        // Changes is_archived from 0 to 1 for all visible applications
        db.prepare('UPDATE applications SET is_archived = 1 WHERE is_archived = 0').run();
        res.status(200).json({ status: 'success', message: 'Semester Archived Successfully' });
    } catch (error) {
        res.status(500).json({ status: 'error', error: error.message });
    }
});
app.post('/api/settings', (req, res) => {
    const { school_year, semester, is_open } = req.body;
    const stmt = db.prepare('UPDATE settings SET school_year = ?, semester = ?, is_open = ? WHERE id = 1');
    stmt.run(school_year, semester, is_open ? 1 : 0);
    res.json({ status: 'success', message: 'Settings updated' });
});
module.exports = router;