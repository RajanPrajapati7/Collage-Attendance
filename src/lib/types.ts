export type Role = 'student' | 'teacher' | 'admin' | 'parent';
export type ThemeMode = 'light' | 'dark';

export interface Student {
  id: string;
  name: string;
  roll_no: string;
  class: string;
  section: string;
  photo: string | null;
  blood_group: string | null;
  address: string | null;
  emergency_contact: string | null;
  parent_name: string | null;
  parent_phone: string | null;
  parent_email: string | null;
  gpa: number;
  attendance_pct: number;
  risk_level: string;
  created_at: string;
}

export interface Teacher {
  id: string;
  name: string;
  subject: string;
  email: string | null;
  phone: string | null;
  experience_years: number;
  salary_status: string;
  photo: string | null;
  created_at: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  class: string;
  teacher_id: string | null;
}

export interface AttendanceRecord {
  id: string;
  student_id: string;
  subject_name: string | null;
  date: string;
  status: 'present' | 'absent' | 'late';
  method: string;
}

export interface Mark {
  id: string;
  student_id: string;
  subject_name: string;
  exam_type: string;
  marks_obtained: number;
  max_marks: number;
  created_at: string;
}

export interface Assignment {
  id: string;
  student_id: string;
  title: string;
  subject: string;
  deadline: string;
  status: 'pending' | 'submitted' | 'late';
  plagiarism_pct: number;
}

export interface Fee {
  id: string;
  student_id: string;
  description: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  due_date: string | null;
}

export interface EventItem {
  id: string;
  title: string;
  type: string;
  date: string;
  location: string | null;
  description: string | null;
}

export interface NotificationItem {
  id: string;
  recipient_role: string;
  title: string;
  body: string | null;
  priority: string;
  created_at: string;
}

export interface TimetableEntry {
  id: string;
  day: string;
  period: number;
  class: string;
  subject: string;
  teacher_name: string | null;
  room: string | null;
  start_time: string | null;
  end_time: string | null;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string | null;
  category: string | null;
  total_copies: number;
  available_copies: number;
  issued_to_student_id: string | null;
}

export interface StudentWithStats extends Student {
  avg_marks: number;
  pending_assignments: number;
  pending_fees: number;
}
