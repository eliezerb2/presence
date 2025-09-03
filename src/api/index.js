const express = require('express');
const app = express();
const port = 3000;

// Create DB schema
const db = require('./db');
const createSchema = require('./db-schema');

async function initialize() {
  let retries = 5;
  while (retries) {
    try {
      await createSchema();
      break;
    } catch (err) {
      console.error('Failed to create schema, retrying...', err.message);
      retries -= 1;
      await new Promise(res => setTimeout(res, 5000)); // Wait 5 seconds before retrying
    }
  }
  if (!retries) {
    console.error('Failed to create schema after multiple retries, exiting.');
    process.exit(1);
  }

  app.use(express.json());

  app.get('/', (req, res) => {
    res.send('Hello World!');
  });

  app.use('/students', require('./routes/students'));
  app.use('/attendance', require('./routes/attendance'));
  app.use('/permanent-absences', require('./routes/permanent_absences'));
  app.use('/school-holidays', require('./routes/school_holidays'));
  app.use('/settings', require('./routes/settings'));
  app.use('/student-monthly-overrides', require('./routes/student_monthly_overrides'));
  app.use('/claims', require('./routes/claims'));
  app.use('/audit-log', require('./routes/audit_log'));

  app.get('/healthz', async (req, res) => {
  res.status(200).send('OK');
});

  app.listen(port, () => {
    console.log(`API server listening at http://localhost:${port}`);
  });
}
