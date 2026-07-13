import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { fetchDemoData } from '../lib/api';
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
      const data = await fetchDemoData();
      setData({
        students: (data.students || []) as Student[],
        teachers: (data.teachers || []) as Teacher[],
        subjects: (data.subjects || []) as Subject[],
        attendance: (data.attendance || []) as AttendanceRecord[],
        marks: (data.marks || []) as Mark[],
        assignments: (data.assignments || []) as Assignment[],
        fees: (data.fees || []) as Fee[],
        events: (data.events || []) as EventItem[],
        notifications: (data.notifications || []) as NotificationItem[],
        timetable: (data.timetable || []) as TimetableEntry[],
        books: (data.books || []) as Book[],
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
