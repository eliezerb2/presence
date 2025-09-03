const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all audit logs
router.get('/', async (req, res) => {
    try {
        const { rows } = await db.query('SELECT * FROM audit_log');
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Get audit logs for an entity
router.get('/:entity/:entityId', async (req, res) => {
    try {
        const { entity, entityId } = req.params;
        const { rows } = await db.query('SELECT * FROM audit_log WHERE entity = $1 AND entity_id = $2', [entity, entityId]);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
