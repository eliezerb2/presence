const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all school holidays
router.get('/', async (req, res) => {
    try {
        const { rows } = await db.query('SELECT * FROM school_holidays');
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Create a new school holiday
router.post('/', async (req, res) => {
    try {
        const { date, description } = req.body;
        const { rows } = await db.query(
            'INSERT INTO school_holidays (date, description) VALUES ($1, $2) RETURNING *',
            [date, description]
        );
        res.status(201).json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Update a school holiday
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { date, description } = req.body;
        const { rows } = await db.query(
            'UPDATE school_holidays SET date = $1, description = $2 WHERE id = $3 RETURNING *',
            [date, description, id]
        );
        if (rows.length === 0) {
            return res.status(404).send('School holiday not found');
        }
        res.json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Delete a school holiday
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { rowCount } = await db.query('DELETE FROM school_holidays WHERE id = $1', [id]);
        if (rowCount === 0) {
            return res.status(404).send('School holiday not found');
        }
        res.status(204).send();
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
