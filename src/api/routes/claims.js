const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all claims
router.get('/', async (req, res) => {
    try {
        const { rows } = await db.query('SELECT * FROM claims');
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Get claims for a student
router.get('/:studentId', async (req, res) => {
    try {
        const { studentId } = req.params;
        const { rows } = await db.query('SELECT * FROM claims WHERE student_id = $1', [studentId]);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Create a new claim
router.post('/', async (req, res) => {
    try {
        const { student_id, date_opened, reason, notified_to, status } = req.body;
        const { rows } = await db.query(
            'INSERT INTO claims (student_id, date_opened, reason, notified_to, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [student_id, date_opened, reason, notified_to, status]
        );
        res.status(201).json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Update a claim
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { student_id, date_opened, reason, notified_to, status } = req.body;
        const { rows } = await db.query(
            'UPDATE claims SET student_id = $1, date_opened = $2, reason = $3, notified_to = $4, status = $5 WHERE id = $6 RETURNING *',
            [student_id, date_opened, reason, notified_to, status, id]
        );
        if (rows.length === 0) {
            return res.status(404).send('Claim not found');
        }
        res.json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Delete a claim
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { rowCount } = await db.query('DELETE FROM claims WHERE id = $1', [id]);
        if (rowCount === 0) {
            return res.status(404).send('Claim not found');
        }
        res.status(204).send();
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
