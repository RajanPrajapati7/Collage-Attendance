/*
# EduPilot AI — Core Schema

## Purpose
Single-tenant demo schema for EduPilot AI Smart Student Management System.
No auth screen; role selection is a UI concept. All tables intentionally shared/public.

## New Tables
1. `students` — student profiles
2. `teachers` — teacher profiles
3. `subjects` — subject catalog
4. `attendance` — per-day per-subject attendance
5. `marks` — exam marks per student per subject
6. `assignments` — assignments + submissions + plagiarism
7. `fees` — fee records
8. `events` — campus events
9. `notifications` — in-app notifications
10. `timetable` — weekly schedule
11. `books` — library books

## Security
- RLS enabled on every table.
- `TO anon, authenticated` with `USING (true)` — intentionally public single-tenant demo.
*/

CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  roll_no text NOT NULL,
  class text NOT NULL,
  section text NOT NULL DEFAULT 'A',
  photo text,
  blood_group text,
  address text,
  emergency_contact text,
  parent_name text,
  parent_phone text,
  parent_email text,
  gpa numeric(3,2) DEFAULT 0.00,
  attendance_pct numeric(5,2) DEFAULT 0.00,
  risk_level text DEFAULT 'low',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS teachers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  subject text NOT NULL,
  email text,
  phone text,
  experience_years integer DEFAULT 0,
  salary_status text DEFAULT 'paid',
  photo text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text NOT NULL,
  class text NOT NULL,
  teacher_id uuid REFERENCES teachers(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  subject_id uuid REFERENCES subjects(id) ON DELETE SET NULL,
  subject_name text,
  date date NOT NULL,
  status text NOT NULL DEFAULT 'present',
  method text DEFAULT 'manual',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS marks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  subject_name text NOT NULL,
  exam_type text NOT NULL,
  marks_obtained numeric(6,2) NOT NULL,
  max_marks numeric(6,2) NOT NULL DEFAULT 100,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  title text NOT NULL,
  subject text NOT NULL,
  deadline date NOT NULL,
  status text DEFAULT 'pending',
  plagiarism_pct numeric(5,2) DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS fees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  description text NOT NULL,
  amount numeric(10,2) NOT NULL,
  status text DEFAULT 'pending',
  due_date date,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  type text NOT NULL,
  date date NOT NULL,
  location text,
  description text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_role text NOT NULL,
  title text NOT NULL,
  body text,
  priority text DEFAULT 'normal',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS timetable (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  day text NOT NULL,
  period integer NOT NULL,
  class text NOT NULL,
  subject text NOT NULL,
  teacher_name text,
  room text,
  start_time text,
  end_time text
);

CREATE TABLE IF NOT EXISTS books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  author text NOT NULL,
  isbn text,
  category text,
  total_copies integer DEFAULT 1,
  available_copies integer DEFAULT 1,
  issued_to_student_id uuid REFERENCES students(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance(student_id, date);
CREATE INDEX IF NOT EXISTS idx_marks_student ON marks(student_id);
CREATE INDEX IF NOT EXISTS idx_assignments_student ON assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_fees_student ON fees(student_id);
CREATE INDEX IF NOT EXISTS idx_students_class ON students(class);

ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE marks ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE timetable ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;

-- Students policies
DROP POLICY IF EXISTS "anon_select_students" ON students;
CREATE POLICY "anon_select_students" ON students FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_students" ON students;
CREATE POLICY "anon_insert_students" ON students FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_students" ON students;
CREATE POLICY "anon_update_students" ON students FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_students" ON students;
CREATE POLICY "anon_delete_students" ON students FOR DELETE TO anon, authenticated USING (true);

-- Teachers policies
DROP POLICY IF EXISTS "anon_select_teachers" ON teachers;
CREATE POLICY "anon_select_teachers" ON teachers FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_teachers" ON teachers;
CREATE POLICY "anon_insert_teachers" ON teachers FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_teachers" ON teachers;
CREATE POLICY "anon_update_teachers" ON teachers FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_teachers" ON teachers;
CREATE POLICY "anon_delete_teachers" ON teachers FOR DELETE TO anon, authenticated USING (true);

-- Subjects policies
DROP POLICY IF EXISTS "anon_select_subjects" ON subjects;
CREATE POLICY "anon_select_subjects" ON subjects FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_subjects" ON subjects;
CREATE POLICY "anon_insert_subjects" ON subjects FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_subjects" ON subjects;
CREATE POLICY "anon_update_subjects" ON subjects FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_subjects" ON subjects;
CREATE POLICY "anon_delete_subjects" ON subjects FOR DELETE TO anon, authenticated USING (true);

-- Attendance policies
DROP POLICY IF EXISTS "anon_select_attendance" ON attendance;
CREATE POLICY "anon_select_attendance" ON attendance FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_attendance" ON attendance;
CREATE POLICY "anon_insert_attendance" ON attendance FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_attendance" ON attendance;
CREATE POLICY "anon_update_attendance" ON attendance FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_attendance" ON attendance;
CREATE POLICY "anon_delete_attendance" ON attendance FOR DELETE TO anon, authenticated USING (true);

-- Marks policies
DROP POLICY IF EXISTS "anon_select_marks" ON marks;
CREATE POLICY "anon_select_marks" ON marks FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_marks" ON marks;
CREATE POLICY "anon_insert_marks" ON marks FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_marks" ON marks;
CREATE POLICY "anon_update_marks" ON marks FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_marks" ON marks;
CREATE POLICY "anon_delete_marks" ON marks FOR DELETE TO anon, authenticated USING (true);

-- Assignments policies
DROP POLICY IF EXISTS "anon_select_assignments" ON assignments;
CREATE POLICY "anon_select_assignments" ON assignments FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_assignments" ON assignments;
CREATE POLICY "anon_insert_assignments" ON assignments FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_assignments" ON assignments;
CREATE POLICY "anon_update_assignments" ON assignments FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_assignments" ON assignments;
CREATE POLICY "anon_delete_assignments" ON assignments FOR DELETE TO anon, authenticated USING (true);

-- Fees policies
DROP POLICY IF EXISTS "anon_select_fees" ON fees;
CREATE POLICY "anon_select_fees" ON fees FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_fees" ON fees;
CREATE POLICY "anon_insert_fees" ON fees FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_fees" ON fees;
CREATE POLICY "anon_update_fees" ON fees FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_fees" ON fees;
CREATE POLICY "anon_delete_fees" ON fees FOR DELETE TO anon, authenticated USING (true);

-- Events policies
DROP POLICY IF EXISTS "anon_select_events" ON events;
CREATE POLICY "anon_select_events" ON events FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_events" ON events;
CREATE POLICY "anon_insert_events" ON events FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_events" ON events;
CREATE POLICY "anon_update_events" ON events FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_events" ON events;
CREATE POLICY "anon_delete_events" ON events FOR DELETE TO anon, authenticated USING (true);

-- Notifications policies
DROP POLICY IF EXISTS "anon_select_notifications" ON notifications;
CREATE POLICY "anon_select_notifications" ON notifications FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_notifications" ON notifications;
CREATE POLICY "anon_insert_notifications" ON notifications FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_notifications" ON notifications;
CREATE POLICY "anon_update_notifications" ON notifications FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_notifications" ON notifications;
CREATE POLICY "anon_delete_notifications" ON notifications FOR DELETE TO anon, authenticated USING (true);

-- Timetable policies
DROP POLICY IF EXISTS "anon_select_timetable" ON timetable;
CREATE POLICY "anon_select_timetable" ON timetable FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_timetable" ON timetable;
CREATE POLICY "anon_insert_timetable" ON timetable FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_timetable" ON timetable;
CREATE POLICY "anon_update_timetable" ON timetable FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_timetable" ON timetable;
CREATE POLICY "anon_delete_timetable" ON timetable FOR DELETE TO anon, authenticated USING (true);

-- Books policies
DROP POLICY IF EXISTS "anon_select_books" ON books;
CREATE POLICY "anon_select_books" ON books FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_books" ON books;
CREATE POLICY "anon_insert_books" ON books FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_books" ON books;
CREATE POLICY "anon_update_books" ON books FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_books" ON books;
CREATE POLICY "anon_delete_books" ON books FOR DELETE TO anon, authenticated USING (true);