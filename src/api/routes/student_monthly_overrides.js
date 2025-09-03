const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all student monthly overrides
router.get('/', async (req, res) => {
    try {
        const { rows } = await db.query('SELECT * FROM student_monthly_overrides');
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Get student monthly overrides for a student
router.get('/:studentId', async (req, res) => {
    try {
        const { studentId } = req.params;
        const { rows } = await db.query('SELECT * FROM student_monthly_overrides WHERE student_id = $1', [studentId]);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Create a new student monthly override
router.post('/', async (req, res) => {
    try {
        const { student_id, year_month, lateness_threshold_override, max_yom_lo_ba_li_override } = req.body;
        const { rows } = await db.query(
            'INSERT INTO student_monthly_overrides (student_id, year_month, lateness_threshold_override, max_yom_lo_ba_li_override) VALUES ($1, $2, $3, $4) RETURNING *',
            [student_id, year_month, lateness_threshold_override, max_yom_lo_ba_li_override]
        );
        res.status(201).json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Update a student monthly override
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { student_id, year_month, lateness_threshold_override, max_yom_lo_ba_li_override } = req.body;
        const { rows } = await db.query(
            'UPDATE student_monthly_overrides SET student_id = $1, year_month = $2, lateness_threshold_override = $3, max_yom_lo_ba_li_override = $4 WHERE id = $5 RETURNING *',
            [student_id, year_month, lateness_threshold_override, max_yom_lo_ba_li_override, id]
        );
        if (rows.length === 0) {
            return res.status(404).send('Student monthly override not found');
        }
        res.json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Delete a student monthly override
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { rowCount } = await db.query('DELETE FROM student_monthly_overrides WHERE id = $1', [id]);
        if (rowCount === 0) {
            return res.status(404).send('Student monthly override not found');
        }
        res.status(204).send();
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
