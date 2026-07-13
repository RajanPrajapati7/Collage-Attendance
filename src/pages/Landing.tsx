import { useState } from 'react';
import {
  GraduationCap, Users, Shield, Heart, Sparkles,
  TrendingUp, Brain, Bell, ArrowRight, Moon, Sun, Check,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { Role } from '../lib/types';
import { cn } from '../lib/utils';

const ROLES: {
  id: Role; label: string; description: string; icon: React.ReactNode; color: string;
}[] = [
  { id: 'student', label: 'Student', description: 'View attendance, marks, AI study coach, and assignments', icon: <GraduationCap size={28} />, color: 'from-brand-500 to-brand-600' },
  { id: 'teacher', label: 'Teacher', description: 'Take attendance, upload marks, create assignments', icon: <Users size={28} />, color: 'from-accent-500 to-accent-600' },
  { id: 'admin', label: 'Admin', description: 'Manage students, teachers, fees, and generate reports', icon: <Shield size={28} />, color: 'from-amber-500 to-orange-500' },
  { id: 'parent', label: 'Parent', description: 'Track your child\'s progress with AI-powered summaries', icon: <Heart size={28} />, color: 'from-rose-500 to-pink-500' },
];

const FEATURES = [
  { icon: <Brain size={20} />, title: 'AI Study Coach', desc: 'Personalized study plans based on performance' },
  { icon: <TrendingUp size={20} />, title: 'Exam Predictor', desc: 'AI predicts final scores and pass probability' },
  { icon: <Sparkles size={20} />, title: 'Smart Report Cards', desc: 'AI-generated strengths, weaknesses & suggestions' },
  { icon: <Bell size={20} />, title: 'Smart Notifications', desc: 'Real-time alerts for exams, assignments & attendance' },
];

export function Landing() {
  const { setRole, setSelectedStudentId, setSelectedTeacherId, theme, toggleTheme, students, teachers } = useApp();
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  const handleEnter = () => {
    if (!selectedRole) return;
    if (selectedRole === 'student' && selectedUser) setSelectedStudentId(selectedUser);
    if (selectedRole === 'parent' && selectedUser) setSelectedStudentId(selectedUser);
    if (selectedRole === 'teacher' && selectedUser) setSelectedTeacherId(selectedUser);
    setRole(selectedRole);
  };

  return (
    <div className="min-h-screen bg-ink-50 dark:bg-ink-950">
      <div className="gradient-mesh dark:gradient-mesh-dark min-h-screen">
        <nav className="flex items-center justify-between px-6 py-5 lg:px-10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-brand shadow-lg shadow-brand-600/30">
              <GraduationCap size={22} className="text-white" />
            </div>
            <div>
              <h1 className="font-display text-lg font-bold text-ink-900 dark:text-white">EduPilot AI</h1>
              <p className="text-xs font-medium text-brand-600 dark:text-brand-400">Smart Student Management</p>
            </div>
          </div>
          <button onClick={toggleTheme} className="btn-ghost h-9 w-9 rounded-lg p-0">
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
        </nav>

        <div className="mx-auto max-w-6xl px-6 pb-16 lg:px-10">
          <div className="text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-4 py-1.5 text-xs font-semibold text-brand-700 dark:border-brand-800 dark:bg-brand-900/30 dark:text-brand-300 animate-fade-in">
              <Sparkles size={14} /> Next-Generation AI Campus Platform
            </div>
            <h1 className="font-display text-4xl font-extrabold tracking-tight text-ink-900 dark:text-white sm:text-5xl lg:text-6xl animate-slide-up text-balance">
              The future of <span className="bg-gradient-to-r from-brand-600 to-accent-600 bg-clip-text text-transparent">student management</span>, powered by AI
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base text-ink-600 dark:text-ink-400 sm:text-lg animate-slide-up">
              Track attendance, analyze marks, predict exam performance, generate personalized study plans, and keep parents informed — all in one intelligent platform.
            </p>
          </div>

          {!selectedRole ? (
            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {ROLES.map((r, i) => (
                <button
                  key={r.id}
                  onClick={() => {
                    setSelectedRole(r.id);
                    setSelectedUser(null);
                  }}
                  className="group relative overflow-hidden rounded-2xl border border-ink-200 bg-white p-6 text-left shadow-sm transition-all hover:-translate-y-1 hover:border-brand-300 hover:shadow-xl dark:border-ink-800 dark:bg-ink-900 dark:hover:border-brand-700 animate-slide-up"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <div className={cn('mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg', r.color)}>
                    {r.icon}
                  </div>
                  <h3 className="font-display text-lg font-bold text-ink-900 dark:text-white">{r.label}</h3>
                  <p className="mt-1.5 text-sm text-ink-500 dark:text-ink-400">{r.description}</p>
                  <div className="mt-4 flex items-center gap-1 text-sm font-semibold text-brand-600 opacity-0 transition-opacity group-hover:opacity-100 dark:text-brand-400">
                    Continue <ArrowRight size={14} />
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="mx-auto mt-12 max-w-md animate-scale-in">
              <div className="rounded-2xl border border-ink-200 bg-white p-6 shadow-xl dark:border-ink-800 dark:bg-ink-900">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-display text-lg font-bold text-ink-900 dark:text-white">
                    Select {selectedRole === 'parent' ? 'your child' : selectedRole === 'student' ? 'your profile' : selectedRole === 'teacher' ? 'your profile' : 'to continue'}
                  </h3>
                  <button onClick={() => setSelectedRole(null)} className="btn-ghost h-8 px-3 text-xs">Back</button>
                </div>

                {(selectedRole === 'student' || selectedRole === 'parent') && (
                  <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin">
                    {students.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => setSelectedUser(s.id)}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all',
                          selectedUser === s.id
                            ? 'border-brand-500 bg-brand-50 dark:border-brand-500 dark:bg-brand-900/20'
                            : 'border-ink-200 hover:border-brand-300 dark:border-ink-700 dark:hover:border-brand-700'
                        )}
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500 text-sm font-semibold text-white">
                          {s.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="truncate text-sm font-semibold text-ink-900 dark:text-ink-100">{s.name}</p>
                          <p className="text-xs text-ink-500 dark:text-ink-400">{s.roll_no} · {s.class}</p>
                        </div>
                        {selectedUser === s.id && <Check size={18} className="text-brand-600 dark:text-brand-400" />}
                      </button>
                    ))}
                  </div>
                )}

                {selectedRole === 'teacher' && (
                  <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin">
                    {teachers.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setSelectedUser(t.id)}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all',
                          selectedUser === t.id
                            ? 'border-brand-500 bg-brand-50 dark:border-brand-500 dark:bg-brand-900/20'
                            : 'border-ink-200 hover:border-brand-300 dark:border-ink-700 dark:hover:border-brand-700'
                        )}
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-500 text-sm font-semibold text-white">
                          {t.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="truncate text-sm font-semibold text-ink-900 dark:text-ink-100">{t.name}</p>
                          <p className="text-xs text-ink-500 dark:text-ink-400">{t.subject}</p>
                        </div>
                        {selectedUser === t.id && <Check size={18} className="text-brand-600 dark:text-brand-400" />}
                      </button>
                    ))}
                  </div>
                )}

                {selectedRole === 'admin' && (
                  <div className="py-4 text-center text-sm text-ink-500 dark:text-ink-400">
                    <Shield size={32} className="mx-auto mb-3 text-amber-500" />
                    Admin access provides full control over students, teachers, fees, and reports.
                  </div>
                )}

                <button
                  onClick={handleEnter}
                  disabled={selectedRole !== 'admin' && !selectedUser}
                  className="btn-primary mt-5 w-full"
                >
                  Enter Dashboard <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f, i) => (
              <div
                key={i}
                className="rounded-2xl border border-ink-200 bg-white/60 p-5 backdrop-blur-sm dark:border-ink-800 dark:bg-ink-900/60 animate-slide-up"
                style={{ animationDelay: `${200 + i * 80}ms` }}
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-600 dark:bg-brand-900/40 dark:text-brand-400">
                  {f.icon}
                </div>
                <h4 className="text-sm font-bold text-ink-900 dark:text-ink-100">{f.title}</h4>
                <p className="mt-1 text-xs text-ink-500 dark:text-ink-400">{f.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 grid grid-cols-3 gap-4 text-center">
            {[
              { label: 'Students', value: '8' },
              { label: 'AI Features', value: '12+' },
              { label: 'Real-time Data', value: 'Live' },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="font-display text-2xl font-bold text-brand-600 dark:text-brand-400 sm:text-3xl">{stat.value}</p>
                <p className="text-xs text-ink-500 dark:text-ink-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
