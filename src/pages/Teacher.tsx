import { useState, useMemo } from 'react';
import {
  Users, CalendarCheck, ClipboardList, FileText, TrendingUp,
  Check, X, Clock, Upload, BookOpen, AlertTriangle, GraduationCap,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Card, StatCard, SectionHeader, EmptyState, Avatar, ProgressBar, Modal } from '../components/ui';
import { BarChart } from '../components/charts';
import { supabase } from '../lib/supabase';
import { cn, formatDate, getGrade } from '../lib/utils';

export function TeacherDashboard() {
  const { students, teachers, attendance, marks, assignments, selectedTeacherId } = useApp();
  const teacher = teachers.find((t) => t.id === selectedTeacherId);

  if (!teacher) return <EmptyState icon={<GraduationCap size={24} />} title="No teacher selected" />;

  const classStudents = students.filter((s) => s.class === '10-A');
  const todayAttendance = attendance.filter((a) => a.date === new Date().toISOString().slice(0, 10)).length;
  const totalMarks = marks.filter((m) => m.subject_name === teacher.subject).length;
  const pendingAssignments = assignments.filter((a) => a.subject === teacher.subject && a.status === 'pending').length;

  const subjectMarks = marks.filter((m) => m.subject_name === teacher.subject);
  const avgScore = subjectMarks.length > 0
    ? Math.round(subjectMarks.reduce((s, m) => s + (m.marks_obtained / m.max_marks) * 100, 0) / subjectMarks.length)
    : 0;

  const classPerformance = useMemo(() => {
    const studentAvgs: { name: string; avg: number }[] = [];
    classStudents.forEach((s) => {
      const sMarks = subjectMarks.filter((m) => m.student_id === s.id);
      if (sMarks.length > 0) {
        const avg = Math.round(sMarks.reduce((sum, m) => sum + (m.marks_obtained / m.max_marks) * 100, 0) / sMarks.length);
        studentAvgs.push({ name: s.name.split(' ')[0], avg });
      }
    });
    return studentAvgs.sort((a, b) => b.avg - a.avg);
  }, [classStudents, subjectMarks]);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-r from-accent-600 to-accent-500 p-6 text-white shadow-lg shadow-accent-600/20 animate-slide-up">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-white/80">Welcome,</p>
            <h1 className="font-display text-2xl font-bold">{teacher.name}</h1>
            <p className="mt-1 text-sm text-white/80">{teacher.subject} · {teacher.experience_years} years experience</p>
          </div>
          <div className="hidden sm:block">
            <Avatar name={teacher.name} size="lg" />
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="My Students" value={classStudents.length} icon={<Users size={20} />} color="brand" />
        <StatCard label="Today's Attendance" value={todayAttendance} icon={<CalendarCheck size={20} />} trend="Records today" color="accent" />
        <StatCard label="Marks Uploaded" value={totalMarks} icon={<ClipboardList size={20} />} trend={`Avg: ${avgScore}%`} color="amber" />
        <StatCard label="Pending Reviews" value={pendingAssignments} icon={<BookOpen size={20} />} color="rose" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <SectionHeader title="Class Performance" subtitle={`${teacher.subject} — student averages`} />
          {classPerformance.length > 0 ? (
            <BarChart
              data={classPerformance.map((s) => s.avg)}
              labels={classPerformance.map((s) => s.name)}
              height={240}
              color="#3b82f6"
            />
          ) : (
            <EmptyState icon={<TrendingUp size={24} />} title="No marks uploaded yet" />
          )}
        </Card>

        <Card>
          <SectionHeader title="My Students" />
          <div className="space-y-2 max-h-80 overflow-y-auto scrollbar-thin">
            {classStudents.map((s) => (
              <div key={s.id} className="flex items-center gap-3 rounded-xl border border-ink-200 p-3 dark:border-ink-700">
                <Avatar name={s.name} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-semibold text-ink-900 dark:text-ink-100">{s.name}</p>
                  <p className="text-xs text-ink-500 dark:text-ink-400">{s.roll_no} · GPA {s.gpa.toFixed(2)}</p>
                </div>
                <span className={cn(
                  'badge',
                  s.risk_level === 'low' ? 'badge-success' : s.risk_level === 'medium' ? 'badge-warning' : 'badge-danger'
                )}>{s.risk_level}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

export function TeacherAttendance() {
  const { students, selectedTeacherId, teachers, refresh } = useApp();
  const teacher = teachers.find((t) => t.id === selectedTeacherId);
  const classStudents = students.filter((s) => s.class === '10-A');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [statuses, setStatuses] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!teacher) return <EmptyState icon={<GraduationCap size={24} />} title="No teacher selected" />;

  const markAll = (status: string) => {
    const all: Record<string, string> = {};
    classStudents.forEach((s) => { all[s.id] = status; });
    setStatuses(all);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const records = classStudents.map((s) => ({
        student_id: s.id,
        subject_name: teacher.subject,
        date,
        status: statuses[s.id] || 'present',
        method: 'manual',
      }));
      const { error } = await supabase.from('attendance').insert(records);
      if (error) throw error;
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      await refresh();
    } catch (err) {
      console.error('Failed to save attendance:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-xl font-bold text-ink-900 dark:text-ink-50">Take Attendance</h2>
            <p className="mt-0.5 text-sm text-ink-500 dark:text-ink-400">{teacher.subject} · Class 10-A</p>
          </div>
          <div className="flex items-center gap-2">
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input w-auto" />
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <button onClick={() => markAll('present')} className="btn-secondary text-xs">
            <Check size={14} /> Mark all present
          </button>
          <button onClick={() => markAll('absent')} className="btn-secondary text-xs">
            <X size={14} /> Mark all absent
          </button>
        </div>
      </Card>

      <Card>
        <SectionHeader title="Student List" subtitle={`${classStudents.length} students`} />
        <div className="space-y-2">
          {classStudents.map((s) => (
            <div key={s.id} className="flex items-center gap-3 rounded-xl border border-ink-200 p-3 dark:border-ink-700">
              <Avatar name={s.name} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-semibold text-ink-900 dark:text-ink-100">{s.name}</p>
                <p className="text-xs text-ink-500 dark:text-ink-400">{s.roll_no}</p>
              </div>
              <div className="flex gap-1.5">
                {['present', 'late', 'absent'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatuses({ ...statuses, [s.id]: status })}
                    className={cn(
                      'flex h-9 w-9 items-center justify-center rounded-lg transition-all',
                      statuses[s.id] === status
                        ? status === 'present' ? 'bg-brand-500 text-white' : status === 'late' ? 'bg-amber-500 text-white' : 'bg-red-500 text-white'
                        : 'bg-ink-100 text-ink-400 hover:bg-ink-200 dark:bg-ink-800 dark:hover:bg-ink-700'
                    )}
                    title={status}
                  >
                    {status === 'present' ? <Check size={16} /> : status === 'late' ? <Clock size={16} /> : <X size={16} />}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-ink-500">
            {Object.keys(statuses).length} of {classStudents.length} marked
          </p>
          <button onClick={handleSave} disabled={saving || Object.keys(statuses).length === 0} className="btn-primary">
            {saving ? 'Saving…' : saved ? 'Saved!' : 'Save Attendance'}
            {!saving && !saved && <Upload size={16} />}
            {saved && <Check size={16} />}
          </button>
        </div>
      </Card>
    </div>
  );
}

export function TeacherMarks() {
  const { students, selectedTeacherId, teachers, refresh } = useApp();
  const teacher = teachers.find((t) => t.id === selectedTeacherId);
  const classStudents = students.filter((s) => s.class === '10-A');
  const [examType, setExamType] = useState('Unit Test');
  const [maxMarks, setMaxMarks] = useState(100);
  const [scores, setScores] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!teacher) return <EmptyState icon={<GraduationCap size={24} />} title="No teacher selected" />;

  const handleSave = async () => {
    setSaving(true);
    try {
      const records = classStudents
        .filter((s) => scores[s.id] && scores[s.id] !== '')
        .map((s) => ({
          student_id: s.id,
          subject_name: teacher.subject,
          exam_type: examType,
          marks_obtained: parseFloat(scores[s.id]),
          max_marks: maxMarks,
        }));
      if (records.length === 0) return;
      const { error } = await supabase.from('marks').insert(records);
      if (error) throw error;
      setSaved(true);
      setScores({});
      setTimeout(() => setSaved(false), 3000);
      await refresh();
    } catch (err) {
      console.error('Failed to save marks:', err);
    } finally {
      setSaving(false);
    }
  };

  const examTypes = ['Unit Test', 'Mid Term', 'Practical', 'Viva', 'Assignment', 'Project', 'Final Exam'];

  return (
    <div className="space-y-6">
      <Card>
        <SectionHeader title="Upload Marks" subtitle={`${teacher.subject} · Class 10-A`} />
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Exam Type</label>
            <select value={examType} onChange={(e) => setExamType(e.target.value)} className="input">
              {examTypes.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Max Marks</label>
            <input type="number" value={maxMarks} onChange={(e) => setMaxMarks(parseInt(e.target.value) || 100)} className="input" />
          </div>
        </div>
      </Card>

      <Card>
        <SectionHeader title="Enter Scores" subtitle={`${Object.values(scores).filter(v => v && v !== '').length} students scored`} />
        <div className="space-y-2">
          {classStudents.map((s) => (
            <div key={s.id} className="flex items-center gap-3 rounded-xl border border-ink-200 p-3 dark:border-ink-700">
              <Avatar name={s.name} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-semibold text-ink-900 dark:text-ink-100">{s.name}</p>
                <p className="text-xs text-ink-500 dark:text-ink-400">{s.roll_no}</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max={maxMarks}
                  placeholder="0"
                  value={scores[s.id] || ''}
                  onChange={(e) => setScores({ ...scores, [s.id]: e.target.value })}
                  className="input w-20 text-center"
                />
                <span className="text-xs text-ink-400">/ {maxMarks}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-end">
          <button onClick={handleSave} disabled={saving} className="btn-primary">
            {saving ? 'Saving…' : saved ? 'Saved!' : 'Save Marks'}
            {!saving && !saved && <Upload size={16} />}
            {saved && <Check size={16} />}
          </button>
        </div>
      </Card>
    </div>
  );
}

export function TeacherAssignments() {
  const { assignments, students, selectedTeacherId, teachers, refresh } = useApp();
  const teacher = teachers.find((t) => t.id === selectedTeacherId);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [deadline, setDeadline] = useState(new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);

  if (!teacher) return <EmptyState icon={<GraduationCap size={24} />} title="No teacher selected" />;

  const subjectAssignments = assignments.filter((a) => a.subject === teacher.subject);
  const classStudents = students.filter((s) => s.class === '10-A');

  const handleCreate = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      const records = classStudents.map((s) => ({
        student_id: s.id,
        title: title.trim(),
        subject: teacher.subject,
        deadline,
        status: 'pending',
        plagiarism_pct: 0,
      }));
      const { error } = await supabase.from('assignments').insert(records);
      if (error) throw error;
      setTitle('');
      setShowCreate(false);
      await refresh();
    } catch (err) {
      console.error('Failed to create assignments:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-bold text-ink-900 dark:text-ink-50">Assignments</h2>
        <button onClick={() => setShowCreate(true)} className="btn-primary">
          <BookOpen size={16} /> Create Assignment
        </button>
      </div>

      <Card>
        <SectionHeader title="Assignment Overview" subtitle={`${teacher.subject} assignments`} />
        <div className="space-y-2">
          {subjectAssignments.length > 0 ? [...subjectAssignments].reverse().map((a) => {
            const student = students.find((s) => s.id === a.student_id);
            return (
              <div key={a.id} className="flex items-center gap-3 rounded-xl border border-ink-200 p-4 dark:border-ink-700">
                <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg',
                  a.status === 'submitted' ? 'bg-brand-100 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400' :
                  a.status === 'late' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
                  'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
                )}>
                  <BookOpen size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-semibold text-ink-900 dark:text-ink-100">{a.title}</p>
                  <p className="text-xs text-ink-500 dark:text-ink-400">
                    {student?.name || 'Unknown'} · Due {formatDate(a.deadline)}
                  </p>
                </div>
                <span className={cn(
                  a.status === 'submitted' ? 'badge-success' : a.status === 'late' ? 'badge-danger' : 'badge-warning'
                )}>{a.status}</span>
              </div>
            );
          }) : <EmptyState icon={<BookOpen size={24} />} title="No assignments created yet" />}
        </div>
      </Card>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Assignment">
        <div className="space-y-4">
          <div>
            <label className="label">Assignment Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Chapter 5 Exercises" className="input" />
          </div>
          <div>
            <label className="label">Subject</label>
            <input value={teacher.subject} disabled className="input opacity-60" />
          </div>
          <div>
            <label className="label">Deadline</label>
            <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="input" />
          </div>
          <p className="text-xs text-ink-500">This will be assigned to all {classStudents.length} students in Class 10-A.</p>
          <button onClick={handleCreate} disabled={saving || !title.trim()} className="btn-primary w-full">
            {saving ? 'Creating…' : 'Create & Assign'}
          </button>
        </div>
      </Modal>
    </div>
  );
}

export function TeacherReports() {
  const { students, marks, selectedTeacherId, teachers } = useApp();
  const teacher = teachers.find((t) => t.id === selectedTeacherId);
  if (!teacher) return <EmptyState icon={<GraduationCap size={24} />} title="No teacher selected" />;

  const classStudents = students.filter((s) => s.class === '10-A');
  const subjectMarks = marks.filter((m) => m.subject_name === teacher.subject);

  const reportData = classStudents.map((s) => {
    const sMarks = subjectMarks.filter((m) => m.student_id === s.id);
    const avg = sMarks.length > 0
      ? Math.round(sMarks.reduce((sum, m) => sum + (m.marks_obtained / m.max_marks) * 100, 0) / sMarks.length)
      : 0;
    return { student: s, avg, examCount: sMarks.length, grade: getGrade(avg) };
  }).sort((a, b) => b.avg - a.avg);

  const classAvg = reportData.length > 0 ? Math.round(reportData.reduce((s, r) => s + r.avg, 0) / reportData.length) : 0;
  const topStudent = reportData[0];
  const atRisk = reportData.filter((r) => r.avg < 50);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label="Class Average" value={`${classAvg}%`} icon={<TrendingUp size={20} />} color="brand" />
        <StatCard label="Top Score" value={topStudent ? `${topStudent.avg}%` : '—'} icon={<GraduationCap size={20} />} trend={topStudent?.student.name} color="accent" />
        <StatCard label="Total Exams" value={subjectMarks.length} icon={<ClipboardList size={20} />} color="amber" />
        <StatCard label="At-Risk Students" value={atRisk.length} icon={<AlertTriangle size={20} />} color="rose" />
      </div>

      <Card>
        <SectionHeader title="Class Report" subtitle={`${teacher.subject} — ranked by performance`} />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-200 text-left text-xs font-semibold uppercase tracking-wide text-ink-500 dark:border-ink-700">
                <th className="pb-3 pr-4">Rank</th>
                <th className="pb-3 pr-4">Student</th>
                <th className="pb-3 pr-4">Exams</th>
                <th className="pb-3 pr-4">Average</th>
                <th className="pb-3">Grade</th>
              </tr>
            </thead>
            <tbody>
              {reportData.map((r, i) => (
                <tr key={r.student.id} className="border-b border-ink-100 last:border-0 dark:border-ink-800">
                  <td className="py-3 pr-4">
                    <span className={cn(
                      'flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold',
                      i === 0 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' : 'bg-ink-100 text-ink-500 dark:bg-ink-800'
                    )}>{i + 1}</span>
                  </td>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      <Avatar name={r.student.name} size="sm" />
                      <span className="font-medium text-ink-900 dark:text-ink-100">{r.student.name}</span>
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-ink-600 dark:text-ink-400">{r.examCount}</td>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      <ProgressBar value={r.avg} color={r.avg >= 75 ? 'brand' : r.avg >= 50 ? 'amber' : 'rose'} />
                      <span className="w-10 text-right text-xs font-semibold text-ink-700 dark:text-ink-300">{r.avg}%</span>
                    </div>
                  </td>
                  <td className="py-3">
                    <span className={cn(
                      'badge',
                      r.avg >= 75 ? 'badge-success' : r.avg >= 50 ? 'badge-warning' : 'badge-danger'
                    )}>{r.grade}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {atRisk.length > 0 && (
        <Card className="border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-900/10">
          <div className="flex items-start gap-3">
            <AlertTriangle size={24} className="shrink-0 text-red-600 dark:text-red-400" />
            <div>
              <h3 className="font-semibold text-red-900 dark:text-red-200">At-Risk Students Detected</h3>
              <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                {atRisk.map((r) => r.student.name).join(', ')} — scoring below 50% in {teacher.subject}. Consider additional support.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

export function TeacherTimetable() {
  const { timetable, selectedTeacherId, teachers } = useApp();
  const teacher = teachers.find((t) => t.id === selectedTeacherId);
  if (!teacher) return <EmptyState icon={<GraduationCap size={24} />} title="No teacher selected" />;

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const myClasses = timetable.filter((t) => t.teacher_name === teacher.name);

  return (
    <div className="space-y-6">
      <Card>
        <SectionHeader title="My Timetable" subtitle={`${teacher.name} — weekly schedule`} />
        <div className="grid gap-4 md:grid-cols-5">
          {days.map((day) => {
            const dayEntries = myClasses.filter((t) => t.day === day).sort((a, b) => a.period - b.period);
            return (
              <div key={day}>
                <h3 className="mb-2 text-sm font-bold text-ink-900 dark:text-ink-100">{day}</h3>
                <div className="space-y-2">
                  {dayEntries.length > 0 ? dayEntries.map((entry) => (
                    <div key={entry.id} className="rounded-xl border border-ink-200 bg-ink-50 p-3 dark:border-ink-700 dark:bg-ink-800/50">
                      <p className="text-xs font-semibold text-brand-600 dark:text-brand-400">Period {entry.period}</p>
                      <p className="mt-1 text-sm font-semibold text-ink-900 dark:text-ink-100">{entry.subject}</p>
                      <p className="text-xs text-ink-500 dark:text-ink-400">Class {entry.class}</p>
                      <div className="mt-1 text-xs text-ink-500">
                        {entry.start_time} - {entry.end_time} · {entry.room}
                      </div>
                    </div>
                  )) : <p className="text-xs text-ink-400">Free</p>}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

export function TeacherNotifications() {
  const { notifications } = useApp();
  const teacherNotifs = notifications.filter((n) => n.recipient_role === 'teacher');

  return (
    <div className="space-y-6">
      <Card>
        <SectionHeader title="Notifications" />
        <div className="space-y-2">
          {teacherNotifs.map((n) => (
            <div key={n.id} className="flex items-start gap-3 rounded-xl border border-ink-200 p-4 dark:border-ink-700">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-100 text-accent-600 dark:bg-accent-900/30 dark:text-accent-400">
                <FileText size={16} />
              </div>
              <div>
                <p className="text-sm font-semibold text-ink-900 dark:text-ink-100">{n.title}</p>
                {n.body && <p className="mt-0.5 text-xs text-ink-600 dark:text-ink-400">{n.body}</p>}
              </div>
            </div>
          ))}
          {teacherNotifs.length === 0 && <EmptyState icon={<FileText size={24} />} title="No notifications" />}
        </div>
      </Card>
    </div>
  );
}
