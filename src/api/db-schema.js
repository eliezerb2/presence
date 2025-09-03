const db = require('./db');

async function createSchema() {
  const createTablesQueries = `
    CREATE TABLE IF NOT EXISTS students (
      id SERIAL PRIMARY KEY,
      student_number VARCHAR(255) UNIQUE NOT NULL,
      nickname VARCHAR(255) UNIQUE,
      first_name VARCHAR(255),
      last_name VARCHAR(255),
      phone_number VARCHAR(255),
      school_level VARCHAR(50) CHECK (school_level IN ('Elementary', 'High School')),
      activity_status VARCHAR(50) CHECK (activity_status IN ('Active', 'Inactive', 'Suspended'))
    );

    CREATE TABLE IF NOT EXISTS attendance (
      id SERIAL PRIMARY KEY,
      student_id INTEGER REFERENCES students(id),
      date DATE NOT NULL,
      status VARCHAR(50),
      sub_status VARCHAR(50) CHECK (sub_status IN ('None', 'Late', 'Automatically Closed')),
      reported_by VARCHAR(50) CHECK (reported_by IN ('student', 'manager', 'auto')),
      check_in_time TIMESTAMP,
      check_out_time TIMESTAMP,
      closed_reason VARCHAR(50) CHECK (closed_reason IN ('n/a', 'manual', 'auto_16')),
      override_locked BOOLEAN DEFAULT false,
      override_locked_at TIMESTAMP,
      UNIQUE (student_id, date)
    );

    CREATE TABLE IF NOT EXISTS permanent_absences (
      id SERIAL PRIMARY KEY,
      student_id INTEGER REFERENCES students(id),
      weekday INTEGER CHECK (weekday >= 0 AND weekday <= 4),
      reason TEXT,
      UNIQUE (student_id, weekday)
    );

    CREATE TABLE IF NOT EXISTS school_holidays (
      id SERIAL PRIMARY KEY,
      date DATE NOT NULL,
      description VARCHAR(255)
    );

    CREATE TABLE IF NOT EXISTS settings (
      id SERIAL PRIMARY KEY,
      lateness_threshold_per_month_default INTEGER,
      max_yom_lo_ba_li_per_month_default INTEGER DEFAULT 2,
      court_chair_name VARCHAR(255),
      court_chair_phone VARCHAR(255)
    );

    CREATE TABLE IF NOT EXISTS student_monthly_overrides (
      id SERIAL PRIMARY KEY,
      student_id INTEGER REFERENCES students(id),
      year_month VARCHAR(7),
      lateness_threshold_override INTEGER,
      max_yom_lo_ba_li_override INTEGER,
      UNIQUE (student_id, year_month)
    );

    CREATE TABLE IF NOT EXISTS claims (
      id SERIAL PRIMARY KEY,
      student_id INTEGER REFERENCES students(id),
      date_opened DATE,
      reason VARCHAR(50) CHECK (reason IN ('late_threshold', 'third_yom_lo_ba_li', 'other')),
      notified_to JSONB,
      status VARCHAR(50) CHECK (status IN ('open', 'closed'))
    );

    CREATE TABLE IF NOT EXISTS audit_log (
      id SERIAL PRIMARY KEY,
      actor VARCHAR(50),
      action VARCHAR(255),
      entity VARCHAR(255),
      entity_id INTEGER,
      before JSONB,
      after JSONB,
      "timestamp" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  try {
    await db.query(createTablesQueries);
    console.log('Tables created successfully');
  } catch (err) {
    console.error('Error creating tables', err.stack);
    // Do not exit process, let the health check handle it
  }
}

module.exports = createSchema;
