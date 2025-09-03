const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all attendance records
router.get('/', async (req, res) => {
    try {
        const { rows } = await db.query('SELECT * FROM attendance');
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Get attendance for a specific student and date
router.get('/:studentId/:date', async (req, res) => {
    try {
        const { studentId, date } = req.params;
        const { rows } = await db.query('SELECT * FROM attendance WHERE student_id = $1 AND date = $2', [studentId, date]);
        if (rows.length === 0) {
            return res.status(404).send('Attendance record not found');
        }
        res.json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Create a new attendance record
router.post('/', async (req, res) => {
    try {
        const { student_id, date, status, sub_status, reported_by, check_in_time, check_out_time, closed_reason, override_locked, override_locked_at } = req.body;
        const { rows } = await db.query(
            'INSERT INTO attendance (student_id, date, status, sub_status, reported_by, check_in_time, check_out_time, closed_reason, override_locked, override_locked_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *',
            [student_id, date, status, sub_status, reported_by, check_in_time, check_out_time, closed_reason, override_locked, override_locked_at]
        );
        res.status(201).json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Update an attendance record
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { student_id, date, status, sub_status, reported_by, check_in_time, check_out_time, closed_reason, override_locked, override_locked_at } = req.body;
        const { rows } = await db.query(
            'UPDATE attendance SET student_id = $1, date = $2, status = $3, sub_status = $4, reported_by = $5, check_in_time = $6, check_out_time = $7, closed_reason = $8, override_locked = $9, override_locked_at = $10 WHERE id = $11 RETURNING *',
            [student_id, date, status, sub_status, reported_by, check_in_time, check_out_time, closed_reason, override_locked, override_locked_at, id]
        );
        if (rows.length === 0) {
            return res.status(404).send('Attendance record not found');
        }
        res.json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Delete an attendance record
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { rowCount } = await db.query('DELETE FROM attendance WHERE id = $1', [id]);
        if (rowCount === 0) {
            return res.status(404).send('Attendance record not found');
        }
        res.status(204).send();
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
