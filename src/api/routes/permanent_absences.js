const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all permanent absences
router.get('/', async (req, res) => {
    try {
        const { rows } = await db.query('SELECT * FROM permanent_absences');
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Get permanent absences for a student
router.get('/:studentId', async (req, res) => {
    try {
        const { studentId } = req.params;
        const { rows } = await db.query('SELECT * FROM permanent_absences WHERE student_id = $1', [studentId]);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Create a new permanent absence
router.post('/', async (req, res) => {
    try {
        const { student_id, weekday, reason } = req.body;
        const { rows } = await db.query(
            'INSERT INTO permanent_absences (student_id, weekday, reason) VALUES ($1, $2, $3) RETURNING *',
            [student_id, weekday, reason]
        );
        res.status(201).json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Update a permanent absence
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { student_id, weekday, reason } = req.body;
        const { rows } = await db.query(
            'UPDATE permanent_absences SET student_id = $1, weekday = $2, reason = $3 WHERE id = $4 RETURNING *',
            [student_id, weekday, reason, id]
        );
        if (rows.length === 0) {
            return res.status(404).send('Permanent absence not found');
        }
        res.json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Delete a permanent absence
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { rowCount } = await db.query('DELETE FROM permanent_absences WHERE id = $1', [id]);
        if (rowCount === 0) {
            return res.status(404).send('Permanent absence not found');
        }
        res.status(204).send();
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
