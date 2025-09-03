-- Test data for presence system

-- Insert settings
INSERT INTO settings (id, lateness_threshold_per_month_default, max_yom_lo_ba_li_per_month_default, court_chair_name, court_chair_phone)
VALUES (1, 3, 2, 'יו"ר בית המשפט', '050-1234567');

-- Insert test students
INSERT INTO students (student_number, nickname, first_name, last_name, phone_number, school_level, activity_status) VALUES
('001', 'יוסי123', 'יוסף', 'כהן', '050-1111111', 'תיכון', 'פעיל'),
('002', 'שרה456', 'שרה', 'לוי', '050-2222222', 'יסודי', 'פעיל'),
('003', 'דוד789', 'דוד', 'אברהם', '050-3333333', 'תיכון', 'פעיל'),
('004', 'רחל321', 'רחל', 'יעקב', '050-4444444', 'יסודי', 'פעיל'),
('005', 'משה654', 'משה', 'ישראל', '050-5555555', 'תיכון', 'לא פעיל');

-- Insert permanent absences (example: student 1 has permanent absence on Wednesdays)
INSERT INTO permanent_absences (student_id, weekday, reason) VALUES
(1, 'ג', 'טיפול רפואי'),
(3, 'ה', 'פעילות חוץ');

-- Insert school holidays
INSERT INTO school_holidays (date, description) VALUES
('2024-01-01', 'ראש השנה האזרחית'),
('2024-04-15', 'פסח'),
('2024-05-14', 'יום העצמאות'),
('2024-09-16', 'ראש השנה'),
('2024-09-25', 'יום כיפור');

-- Insert sample attendance records for today
INSERT INTO attendance (student_id, date, status, sub_status, reported_by, check_in_time) VALUES
(1, CURRENT_DATE, 'נוכח', 'ללא', 'student', '08:30:00'),
(2, CURRENT_DATE, 'נוכח', 'איחור', 'auto', '10:15:00'),
(3, CURRENT_DATE, 'לא דיווח', 'ללא', 'auto', NULL),
(4, CURRENT_DATE, 'יום לא בא לי', 'ללא', 'auto', NULL);

-- Insert monthly overrides (example: student 2 gets extra allowances for current month)
INSERT INTO student_monthly_overrides (student_id, year_month, lateness_threshold_override, max_yom_lo_ba_li_override) VALUES
(2, TO_CHAR(CURRENT_DATE, 'YYYY-MM'), 5, 3);