export interface Student {
  id: number;
  student_number: string;
  nickname: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  school_level: 'יסודי' | 'תיכון';
  activity_status: 'פעיל' | 'לא פעיל' | 'מושעה';
}

export interface Attendance {
  id: number;
  student_id: number;
  date: string;
  status: 'לא דיווח' | 'נוכח' | 'יצא' | 'יום לא בא לי' | 'חיסור מאושר' | 'אישור היעדרות קבוע';
  sub_status: 'ללא' | 'איחור' | 'נסגר אוטומטית';
  reported_by: 'student' | 'manager' | 'auto';
  check_in_time?: string;
  check_out_time?: string;
  closed_reason: 'n/a' | 'manual' | 'auto_16';
  override_locked: boolean;
  override_locked_at?: string;
  student?: Student;
}

export interface Settings {
  id: number;
  lateness_threshold_per_month_default: number;
  max_yom_lo_ba_li_per_month_default: number;
  court_chair_name: string;
  court_chair_phone: string;
}