import { useState, type ReactNode } from 'react';
import {
  GraduationCap, LayoutDashboard, CalendarCheck, ClipboardList,
  Wallet, Sparkles, Users, Library, CalendarDays, Bell,
  Moon, Sun, LogOut, Menu, X, BookOpen, TrendingUp,
  FileText, Award, MessageCircle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { cn } from '../lib/utils';
import type { Role } from '../lib/types';

interface NavItem {
  id: string;
  label: string;
  icon: ReactNode;
}

const NAV_CONFIG: Record<Role, NavItem[]> = {
  student: [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { id: 'attendance', label: 'Attendance', icon: <CalendarCheck size={18} /> },
    { id: 'marks', label: 'Marks & Results', icon: <ClipboardList size={18} /> },
    { id: 'assignments', label: 'Assignments', icon: <BookOpen size={18} /> },
    { id: 'fees', label: 'Fees', icon: <Wallet size={18} /> },
    { id: 'timetable', label: 'Timetable', icon: <CalendarDays size={18} /> },
    { id: 'ai-coach', label: 'AI Study Coach', icon: <Sparkles size={18} /> },
    { id: 'library', label: 'Library', icon: <Library size={18} /> },
    { id: 'events', label: 'Events', icon: <CalendarDays size={18} /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={18} /> },
  ],
  teacher: [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { id: 'attendance', label: 'Take Attendance', icon: <CalendarCheck size={18} /> },
    { id: 'marks', label: 'Upload Marks', icon: <ClipboardList size={18} /> },
    { id: 'assignments', label: 'Assignments', icon: <BookOpen size={18} /> },
    { id: 'reports', label: 'Reports', icon: <FileText size={18} /> },
    { id: 'timetable', label: 'Timetable', icon: <CalendarDays size={18} /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={18} /> },
  ],
  admin: [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { id: 'students', label: 'Students', icon: <Users size={18} /> },
    { id: 'teachers', label: 'Teachers', icon: <GraduationCap size={18} /> },
    { id: 'fees', label: 'Fees Management', icon: <Wallet size={18} /> },
    { id: 'reports', label: 'Reports', icon: <TrendingUp size={18} /> },
    { id: 'library', label: 'Library', icon: <Library size={18} /> },
    { id: 'events', label: 'Events', icon: <CalendarDays size={18} /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={18} /> },
  ],
  parent: [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { id: 'attendance', label: 'Attendance', icon: <CalendarCheck size={18} /> },
    { id: 'marks', label: 'Marks', icon: <ClipboardList size={18} /> },
    { id: 'fees', label: 'Fees', icon: <Wallet size={18} /> },
    { id: 'ai-summary', label: 'AI Summary', icon: <MessageCircle size={18} /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={18} /> },
  ],
};

const ROLE_LABELS: Record<Role, string> = {
  student: 'Student',
  teacher: 'Teacher',
  admin: 'Admin',
  parent: 'Parent',
};

export function Layout({
  activePage, onNavigate, children,
}: {
  activePage: string;
  onNavigate: (page: string) => void;
  children: ReactNode;
}) {
  const { role, setRole, theme, toggleTheme, notifications, students, selectedStudentId } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!role) return <>{children}</>;

  const navItems = NAV_CONFIG[role];
  const unreadCount = notifications.filter((n) => n.recipient_role === role).length;
  const currentStudent = students.find((s) => s.id === selectedStudentId);

  const handleLogout = () => setRole(null);

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-brand shadow-lg shadow-brand-600/30">
          <GraduationCap size={22} className="text-white" />
        </div>
        <div>
          <h1 className="font-display text-lg font-bold text-ink-900 dark:text-white">EduPilot</h1>
          <p className="text-xs font-medium text-brand-600 dark:text-brand-400">AI Campus</p>
        </div>
      </div>

      <div className="mx-4 mb-4 flex items-center gap-2 rounded-xl bg-ink-100 px-3 py-2 dark:bg-ink-800/50">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-500 text-xs font-bold text-white">
          {ROLE_LABELS[role][0]}
        </div>
        <span className="text-sm font-semibold text-ink-700 dark:text-ink-200">{ROLE_LABELS[role]} Portal</span>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto scrollbar-thin px-3">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              onNavigate(item.id);
              setSidebarOpen(false);
            }}
            className={cn(
              'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
              activePage === item.id
                ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300'
                : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900 dark:text-ink-400 dark:hover:bg-ink-800 dark:hover:text-ink-100'
            )}
          >
            {item.icon}
            <span>{item.label}</span>
            {item.id === 'notifications' && unreadCount > 0 && (
              <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </nav>

      <div className="border-t border-ink-200 p-3 dark:border-ink-800">
        <button
          onClick={toggleTheme}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-600 transition-all hover:bg-ink-100 dark:text-ink-400 dark:hover:bg-ink-800"
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
        </button>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-600 transition-all hover:bg-red-50 hover:text-red-600 dark:text-ink-400 dark:hover:bg-red-900/20 dark:hover:text-red-400"
        >
          <LogOut size={18} />
          <span>Switch Role</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-ink-50 dark:bg-ink-950">
      <aside className="hidden w-64 shrink-0 border-r border-ink-200 bg-white dark:border-ink-800 dark:bg-ink-900 lg:block">
        {sidebar}
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-ink-950/50 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 border-r border-ink-200 bg-white dark:border-ink-800 dark:bg-ink-900 animate-slide-in">
            {sidebar}
          </aside>
        </div>
      )}

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex items-center justify-between border-b border-ink-200 bg-white/80 px-4 py-3 backdrop-blur-md dark:border-ink-800 dark:bg-ink-900/80 lg:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="btn-ghost h-9 w-9 rounded-lg p-0 lg:hidden"
            >
              <Menu size={18} />
            </button>
            <div>
              <h2 className="font-display text-base font-bold text-ink-900 dark:text-ink-50">
                {navItems.find((n) => n.id === activePage)?.label || 'Dashboard'}
              </h2>
              {(role === 'parent' || role === 'student') && currentStudent && (
                <p className="text-xs text-ink-500 dark:text-ink-400">{currentStudent.name} · {currentStudent.class}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="btn-ghost h-9 w-9 rounded-lg p-0"
            >
              {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            </button>
            <button
              onClick={() => onNavigate('notifications')}
              className="btn-ghost relative h-9 w-9 rounded-lg p-0"
            >
              <Bell size={16} />
              {unreadCount > 0 && (
                <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </button>
            <div className="hidden items-center gap-2 rounded-xl bg-ink-100 px-3 py-1.5 dark:bg-ink-800 sm:flex">
              <Award size={16} className="text-brand-600 dark:text-brand-400" />
              <span className="text-xs font-semibold text-ink-700 dark:text-ink-200">{ROLE_LABELS[role]}</span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="mx-auto max-w-7xl p-4 lg:p-6">
            {children}
          </div>
        </main>
      </div>

      {sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(false)}
          className="fixed right-4 top-4 z-50 rounded-lg bg-white p-2 shadow-lg lg:hidden dark:bg-ink-800"
        >
          <X size={18} />
        </button>
      )}
    </div>
  );
}
