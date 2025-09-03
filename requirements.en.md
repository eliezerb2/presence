
> Build a presence application for a single school (<100 students), with school-level presence (no classes).
>
> One tablet is used by students at the entrance door (no login); a **presence manager** logs in from any computer/phone.
>
> No personal QR codes — student identification is by **student number**, **nickname**, **first name**, or **last name** on the kiosk screen.

---

## Statuses

*   **Main Status:** Not Reported, Present, Left, "I Don't Feel Like It" Day, Approved Absence, Permanent Absence Approval
*   **Sub-status (`sub_status`):** None, Late, Automatically Closed

---

## Data Schema (with IDs)

**students**

*   `id` (PK)
*   `student_number` (Unique, required) – internal school student number
*   `nickname` (Unique, editable in the management interface)
*   `first_name`, `last_name`, `phone_number`
*   `school_level` ∈ {Elementary, High School}
*   `activity_status` ∈ {Active, Inactive, Suspended}

**attendance** (daily record)

*   `id` (PK)
*   `student_id` (FK → students.id)
*   `date` (date; together with `student_id` defines daily uniqueness)
*   `status` ∈ {Not Reported, Present, Left, "I Don't Feel Like It" Day, Approved Absence, Permanent Absence Approval}
*   `sub_status` ∈ {None, Late, Automatically Closed}
*   `reported_by` ∈ {student, manager, auto}
*   `check_in_time` (optional)
*   `check_out_time` (optional)
*   `closed_reason` ∈ {n/a, manual, auto_16}
*   `override_locked` (boolean, default `false`)
*   `override_locked_at` (timestamp, optional)
*   **Constraint:** Uniqueness on (`student_id`, `date`)

**permanent_absences** (permanent absence approvals)

*   `id` (PK)
*   `student_id` (FK)
*   `weekday` ∈ {Sun, Mon, Tue, Wed, Thu}
*   `reason` (text)
*   **Constraint:** Uniqueness on (`student_id`, `weekday`)

**school_holidays**

*   `id` (PK)
*   `date`, `description`

**settings** (global defaults)

*   `id` (PK, single row)
*   `lateness_threshold_per_month_default` (allowed lateness/month)
*   `max_yom_lo_ba_li_per_month_default` (allowed "I don't feel like it" days/month; default 2)
*   `court_chair_name`, `court_chair_phone`

**student_monthly_overrides** (Overrides per student and month)

*   `id` (PK)
*   `student_id` (FK → students.id)
*   `year_month` (YYYY-MM)
*   `lateness_threshold_override` (allowed lateness/month for this student this month)
*   `max_yom_lo_ba_li_override` (allowed "I don't feel like it" days/month for this student this month)
*   **Constraint:** Uniqueness on (`student_id`, `year_month`)

**claims** ("Court")

*   `id` (PK)
*   `student_id` (FK)
*   `date_opened`
*   `reason` ∈ {late_threshold, third_yom_lo_ba_li, other}
*   `notified_to` (array/json: {manager, student, court_chair})
*   `status` ∈ {open, closed}

**audit_log**

*   `id` (PK), `actor` (manager/auto/student), `action`, `entity`, `entity_id`, `before`, `after`, `timestamp`

---

## School Year and Activity Days Rules

*   **High School** students learn until **June 20th** (inclusive); **Elementary School** until **June 30th** (inclusive).
*   The school is active **Sunday–Thursday** only.
*   On `school_holidays`, Fridays/Saturdays, or after the end date according to `school_level` — **do not send reminders and do not run automations**.

---

## Business Logic and Automations (Execution Order)

1.  **Permanent Absence in the Morning**
    *   If a `permanent_absences` record exists for the current day → create/update `attendance` with
        `status='Permanent Absence Approval'`, `sub_status='None'`, `reported_by='auto'`.
    *   These students **do not receive the 09:30 reminder**.
2.  **09:30 — WhatsApp Reminder**
    *   Send **only** to students with `activity_status='Active'` whose `status='Not Reported'` (not by student or manager),
        **and** do not have `permanent_absences` for this day.
3.  **10:00–10:30 — Automatic Lateness**
    *   If still "Not Reported": `status='Present'`, `sub_status='Late'`, `reported_by='auto'`, `check_in_time=now()`.
    *   The manager can manually change (Override).
4.  **After 10:30 — Automatic "I Don't Feel Like It" Day**
    *   If still "Not Reported" at 10:30: `status='"I Don't Feel Like It" Day'`, `sub_status='None'`, `reported_by='auto'`.
    *   The manager can manually change.
5.  **16:00 — Automatic Day Closing**
    *   If no `check_out_time`: `status='Left'`, `sub_status='Automatically Closed'`,
        `reported_by='auto'`, `check_out_time='16:00'`, `closed_reason='auto_16'`.
6.  **Monthly Counts and "Court"**
    *   For each student, monthly calculation:
        *   `late_count` = days with `sub_status='Late'`
        *   `yom_lo_ba_li_count` = days with `status='"I Don't Feel Like It" Day'`
    *   Determining thresholds:
        *   If a `student_monthly_overrides` record exists for the same `student_id` and `year_month` → use its values.
        *   Otherwise → use `settings.lateness_threshold_per_month_default` and `settings.max_yom_lo_ba_li_per_month_default`.
    *   Triggering a claim:
        *   If `late_count >` lateness threshold → create `claims` (`reason='late_threshold'`) + WhatsApp to manager, student, and court chair.
        *   If `yom_lo_ba_li_count >=` allowed threshold → create `claims` (`reason='third_yom_lo_ba_li'`) + WhatsApp to the same recipients.
    *   Keep a history of all claims and notifications.

---

## Presence Manager Override Capability

*   The manager can **update/replace any field in the report** (`status`, `sub_status`, `reported_by`, `check_in_time`, `check_out_time`, `closed_reason`) at any time, even retroactively.
*   When overriding:
    *   `override_locked=true`, `override_locked_at=now()`
    *   Future automations **do not change** locked records.
    *   The lock can be manually opened (documented in `audit_log`).
*   Every manual change is documented in `audit_log` with `actor='manager'`, `action='override_update'`.

---

## Interfaces

**Kiosk Tablet for Students**

*   A single search field that filters by: `student_number` or `nickname` or `first_name` or `last_name`.
*   Displaying the result → large "Check-in"/"Check-out" buttons; no login.

**Manager Interface (Mobile/Desktop)**

*   Daily attendance board: status, `sub_status`, who reported, times, search/filters.
*   Manual change (Override) of any field in the attendance.
*   Monthly counts, opening/closing of claims, viewing claim history.
*   CSV export.

**Management**

*   Students: CRUD, change `nickname`/`student_number`, change `activity_status`.
*   Permanent absence approvals: CRUD.
*   Holidays: CRUD.
*   Global settings: Update default lateness and "I don't feel like it" day thresholds.
*   Monthly Overrides: CRUD for `student_monthly_overrides`.
