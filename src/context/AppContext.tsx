import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type {
  Role, ThemeMode, Student, Teacher, Subject,
  AttendanceRecord, Mark, Assignment, Fee,
  EventItem, NotificationItem, TimetableEntry, Book,
} from '../lib/types';

interface AppData {
  students: Student[];
  teachers: Teacher[];
  subjects: Subject[];
  attendance: AttendanceRecord[];
  marks: Mark[];
  assignments: Assignment[];
  fees: Fee[];
  events: EventItem[];
  notifications: NotificationItem[];
  timetable: TimetableEntry[];
  books: Book[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

interface AppContextValue extends AppData {
  role: Role | null;
  setRole: (role: Role | null) => void;
  selectedStudentId: string | null;
  setSelectedStudentId: (id: string | null) => void;
  selectedTeacherId: string | null;
  setSelectedTeacherId: (id: string | null) => void;
  theme: ThemeMode;
  toggleTheme: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);
  const [theme, setTheme] = useState<ThemeMode>('light');

  const [data, setData] = useState<AppData>({
    students: [], teachers: [], subjects: [], attendance: [], marks: [],
    assignments: [], fees: [], events: [], notifications: [], timetable: [], books: [],
    loading: true, error: null, refresh: async () => {},
  });

  const loadAll = useCallback(async () => {
    setData((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const [
        studentsR, teachersR, subjectsR, attendanceR, marksR,
        assignmentsR, feesR, eventsR, notificationsR, timetableR, booksR,
      ] = await Promise.all([
        supabase.from('students').select('*').order('name'),
        supabase.from('teachers').select('*').order('name'),
        supabase.from('subjects').select('*'),
        supabase.from('attendance').select('*').order('date', { ascending: false }),
        supabase.from('marks').select('*'),
        supabase.from('assignments').select('*').order('deadline'),
        supabase.from('fees').select('*').order('due_date', { ascending: false }),
        supabase.from('events').select('*').order('date'),
        supabase.from('notifications').select('*').order('created_at', { ascending: false }),
        supabase.from('timetable').select('*').order('day').order('period'),
        supabase.from('books').select('*').order('title'),
      ]);

      const errors = [
        studentsR, teachersR, subjectsR, attendanceR, marksR,
        assignmentsR, feesR, eventsR, notificationsR, timetableR, booksR,
      ].filter((r) => r.error);

      if (errors.length > 0) {
        throw new Error(errors[0].error?.message || 'Failed to load data');
      }

      setData({
        students: studentsR.data || [],
        teachers: teachersR.data || [],
        subjects: subjectsR.data || [],
        attendance: attendanceR.data || [],
        marks: marksR.data || [],
        assignments: assignmentsR.data || [],
        fees: feesR.data || [],
        events: eventsR.data || [],
        notifications: notificationsR.data || [],
        timetable: timetableR.data || [],
        books: booksR.data || [],
        loading: false, error: null, refresh: loadAll,
      });
    } catch (err) {
      setData((prev) => ({
        ...prev, loading: false,
        error: err instanceof Error ? err.message : 'An error occurred',
        refresh: loadAll,
      }));
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === 'light' ? 'dark' : 'light'));
  }, []);

  const value: AppContextValue = {
    ...data,
    role, setRole,
    selectedStudentId, setSelectedStudentId,
    selectedTeacherId, setSelectedTeacherId,
    theme, toggleTheme,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
