const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all students
router.get('/', async (req, res) => {
    try {
        const { rows } = await db.query('SELECT * FROM students');
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Get a student by id
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { rows } = await db.query('SELECT * FROM students WHERE id = $1', [id]);
        if (rows.length === 0) {
            return res.status(404).send('Student not found');
        }
        res.json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Create a new student
router.post('/', async (req, res) => {
    try {
        const { student_number, nickname, first_name, last_name, phone_number, school_level, activity_status } = req.body;
        const { rows } = await db.query(
            'INSERT INTO students (student_number, nickname, first_name, last_name, phone_number, school_level, activity_status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [student_number, nickname, first_name, last_name, phone_number, school_level, activity_status]
        );
        res.status(201).json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Update a student
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { student_number, nickname, first_name, last_name, phone_number, school_level, activity_status } = req.body;
        const { rows } = await db.query(
            'UPDATE students SET student_number = $1, nickname = $2, first_name = $3, last_name = $4, phone_number = $5, school_level = $6, activity_status = $7 WHERE id = $8 RETURNING *',
            [student_number, nickname, first_name, last_name, phone_number, school_level, activity_status, id]
        );
        if (rows.length === 0) {
            return res.status(404).send('Student not found');
        }
        res.json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Delete a student
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { rowCount } = await db.query('DELETE FROM students WHERE id = $1', [id]);
        if (rowCount === 0) {
            return res.status(404).send('Student not found');
        }
        res.status(204).send();
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
