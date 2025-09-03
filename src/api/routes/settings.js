const express = require('express');
const router = express.Router();
const db = require('../db');

// Get settings
router.get('/', async (req, res) => {
    try {
        const { rows } = await db.query('SELECT * FROM settings LIMIT 1');
        if (rows.length === 0) {
            // Create default settings if they don't exist
            const { rows: defaultRows } = await db.query(
                'INSERT INTO settings (lateness_threshold_per_month_default, max_yom_lo_ba_li_per_month_default) VALUES (0, 2) RETURNING *'
            );
            return res.json(defaultRows[0]);
        }
        res.json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Update settings
router.put('/', async (req, res) => {
    try {
        const { lateness_threshold_per_month_default, max_yom_lo_ba_li_per_month_default, court_chair_name, court_chair_phone } = req.body;
        const { rows } = await db.query(
            'UPDATE settings SET lateness_threshold_per_month_default = $1, max_yom_lo_ba_li_per_month_default = $2, court_chair_name = $3, court_chair_phone = $4 WHERE id = 1 RETURNING *',
            [lateness_threshold_per_month_default, max_yom_lo_ba_li_per_month_default, court_chair_name, court_chair_phone]
        );
        if (rows.length === 0) {
            return res.status(404).send('Settings not found');
        }
        res.json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
