import { useMemo } from 'react';
import {
  CalendarCheck, ClipboardList, Wallet, TrendingUp, BookOpen,
  Sparkles, AlertTriangle, Trophy, CalendarClock, Clock,
  FileWarning, ArrowUp, ArrowDown, Minus, GraduationCap, Target, Bell,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Card, StatCard, SectionHeader, ProgressBar, EmptyState, Avatar } from '../components/ui';
import { LineChart, BarChart, DonutChart, RadarChart, HeatmapGrid } from '../components/charts';
import {
  calculateSubjectAverages, predictExamPerformance, generateAIInsights,
  generateStudyPlan, suggestCareer,
} from '../lib/ai';
import { cn, formatDate, relativeDate, daysUntil, getGrade, formatCurrency } from '../lib/utils';

const ICON_MAP: Record<string, React.ReactNode> = {
  AlertTriangle: <AlertTriangle size={18} />,
  Trophy: <Trophy size={18} />,
  CalendarX: <CalendarCheck size={18} />,
  CalendarClock: <CalendarClock size={18} />,
  Clock: <Clock size={18} />,
  FileWarning: <FileWarning size={18} />,
  TrendingUp: <TrendingUp size={18} />,
};

const INSIGHT_STYLES = {
  success: 'border-brand-200 bg-brand-50 dark:border-brand-800 dark:bg-brand-900/20',
  warning: 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20',
  danger: 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20',
  info: 'border-accent-200 bg-accent-50 dark:border-accent-800 dark:bg-accent-900/20',
};

const INSIGHT_ICONS = {
  success: 'text-brand-600 dark:text-brand-400',
  warning: 'text-amber-600 dark:text-amber-400',
  danger: 'text-red-600 dark:text-red-400',
  info: 'text-accent-600 dark:text-accent-400',
};

export function StudentDashboard({ onNavigate }: { onNavigate: (page: string) => void }) {
  const { students, attendance, marks, assignments, fees, selectedStudentId } = useApp();
  const student = students.find((s) => s.id === selectedStudentId);

  const studentAttendance = useMemo(() => attendance.filter((a) => a.id === selectedStudentId || a.student_id === selectedStudentId), [attendance, selectedStudentId]);
  const studentMarks = useMemo(() => marks.filter((m) => m.student_id === selectedStudentId), [marks, selectedStudentId]);
  const studentAssignments = useMemo(() => assignments.filter((a) => a.student_id === selectedStudentId), [assignments, selectedStudentId]);
  const studentFees = useMemo(() => fees.filter((f) => f.student_id === selectedStudentId), [fees, selectedStudentId]);

  if (!student) return <EmptyState icon={<GraduationCap size={24} />} title="No student selected" />;

  const subjectAvgs = calculateSubjectAverages(studentMarks);
  const prediction = predictExamPerformance(studentMarks, student.attendance_pct);
  const insights = generateAIInsights(studentMarks, studentAttendance, studentAssignments, student);
  const pendingAssignments = studentAssignments.filter((a) => a.status === 'pending');
  const pendingFees = studentFees.filter((f) => f.status !== 'paid');
  const totalPendingFees = studentFees.filter((f) => f.status !== 'paid').reduce((s, f) => s + f.amount, 0);

  const presentCount = studentAttendance.filter((a) => a.status === 'present').length;
  const lateCount = studentAttendance.filter((a) => a.status === 'late').length;
  const absentCount = studentAttendance.filter((a) => a.status === 'absent').length;
  const totalClasses = studentAttendance.length;

  const monthlyData = useMemo(() => {
    const months: Record<string, number[]> = {};
    studentMarks.forEach((m) => {
      const month = new Date(m.created_at).toLocaleDateString('en-US', { month: 'short' });
      if (!months[month]) months[month] = [];
      months[month].push((m.marks_obtained / m.max_marks) * 100);
    });
    return Object.entries(months).slice(-6).map(([month, vals]) => ({
      label: month,
      value: Math.round(vals.reduce((a, b) => a + b, 0) / vals.length),
    }));
  }, [studentMarks]);

  const heatmapData = useMemo(() => {
    const byDate: Record<string, { present: number; total: number }> = {};
    studentAttendance.forEach((a) => {
      const d = a.date;
      if (!byDate[d]) byDate[d] = { present: 0, total: 0 };
      byDate[d].total++;
      if (a.status === 'present') byDate[d].present++;
    });
    return Object.entries(byDate)
      .map(([date, v]) => ({ date, ...v }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [studentAttendance]);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl gradient-brand p-6 text-white shadow-lg shadow-brand-600/20 animate-slide-up">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-white/80">Welcome back,</p>
            <h1 className="font-display text-2xl font-bold">{student.name}</h1>
            <p className="mt-1 text-sm text-white/80">{student.class} · Roll No {student.roll_no}</p>
          </div>
          <div className="hidden sm:block">
            <Avatar name={student.name} size="lg" />
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Attendance" value={`${student.attendance_pct}%`} icon={<CalendarCheck size={20} />} trend={`${presentCount}/${totalClasses} classes attended`} color="brand" />
        <StatCard label="GPA" value={student.gpa.toFixed(2)} icon={<TrendingUp size={20} />} trend={`Predicted: ${prediction.predictedGrade}`} color="accent" />
        <StatCard label="Pending Assignments" value={pendingAssignments.length} icon={<BookOpen size={20} />} trend={`${studentAssignments.filter(a => a.status === 'late').length} overdue`} color="amber" />
        <StatCard label="Pending Fees" value={formatCurrency(totalPendingFees)} icon={<Wallet size={20} />} trend={`${pendingFees.length} pending`} color="rose" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <SectionHeader title="Performance Trend" subtitle="Monthly average across all subjects" />
          {monthlyData.length > 0 ? (
            <LineChart data={monthlyData.map(d => d.value)} labels={monthlyData.map(d => d.label)} height={240} />
          ) : (
            <EmptyState icon={<TrendingUp size={24} />} title="No performance data yet" />
          )}
        </Card>

        <Card>
          <SectionHeader title="AI Exam Predictor" />
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-xl bg-ink-50 p-4 dark:bg-ink-800/50">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Current</p>
                <p className="font-display text-2xl font-bold text-ink-900 dark:text-ink-50">{prediction.currentPct}%</p>
              </div>
              <ArrowUp size={20} className="text-brand-500" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Predicted</p>
                <p className="font-display text-2xl font-bold text-brand-600 dark:text-brand-400">{prediction.predictedPct}%</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-ink-200 p-3 dark:border-ink-700">
                <p className="text-xs text-ink-500">Expected Grade</p>
                <p className="font-display text-lg font-bold text-ink-900 dark:text-ink-50">{prediction.predictedGrade}</p>
              </div>
              <div className="rounded-xl border border-ink-200 p-3 dark:border-ink-700">
                <p className="text-xs text-ink-500">Pass Probability</p>
                <p className="font-display text-lg font-bold text-brand-600 dark:text-brand-400">{prediction.passProbability}%</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-ink-500 dark:text-ink-400">
              <Sparkles size={14} className="text-brand-500" />
              <span>AI confidence: {prediction.confidence}%</span>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <SectionHeader title="AI Insights" subtitle="Personalized recommendations" />
          <div className="space-y-3">
            {insights.slice(0, 5).map((insight, i) => (
              <div key={i} className={cn('flex items-start gap-3 rounded-xl border p-3', INSIGHT_STYLES[insight.type])}>
                <div className={cn('mt-0.5 shrink-0', INSIGHT_ICONS[insight.type])}>
                  {ICON_MAP[insight.icon] || <Sparkles size={18} />}
                </div>
                <div>
                  <p className="text-sm font-semibold text-ink-900 dark:text-ink-100">{insight.title}</p>
                  <p className="mt-0.5 text-xs text-ink-600 dark:text-ink-400">{insight.message}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <SectionHeader title="Subject Performance" />
          {subjectAvgs.length > 0 ? (
            <div className="space-y-3">
              {subjectAvgs.map((s) => (
                <div key={s.subject}>
                  <div className="mb-1 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-ink-700 dark:text-ink-300">{s.subject}</span>
                      {s.trend === 'up' && <ArrowUp size={14} className="text-brand-500" />}
                      {s.trend === 'down' && <ArrowDown size={14} className="text-red-500" />}
                      {s.trend === 'stable' && <Minus size={14} className="text-ink-400" />}
                    </div>
                    <span className={cn(
                      'text-sm font-bold',
                      s.level === 'strong' ? 'text-brand-600 dark:text-brand-400' :
                      s.level === 'medium' ? 'text-accent-600 dark:text-accent-400' :
                      'text-red-600 dark:text-red-400'
                    )}>{s.avgPct}%</span>
                  </div>
                  <ProgressBar
                    value={s.avgPct}
                    color={s.level === 'strong' ? 'brand' : s.level === 'medium' ? 'accent' : 'rose'}
                  />
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={<ClipboardList size={24} />} title="No marks data yet" />
          )}
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <SectionHeader title="Attendance Breakdown" />
          <DonutChart
            segments={[
              { label: 'Present', value: Math.round((presentCount / totalClasses) * 100) || 0, color: '#16b87e' },
              { label: 'Late', value: Math.round((lateCount / totalClasses) * 100) || 0, color: '#f59e0b' },
              { label: 'Absent', value: Math.round((absentCount / totalClasses) * 100) || 0, color: '#ef4444' },
            ]}
          />
        </Card>

        <Card className="lg:col-span-2">
          <SectionHeader title="Subject Radar" subtitle="Performance across all subjects" />
          {subjectAvgs.length > 0 ? (
            <RadarChart data={subjectAvgs.map(s => ({ subject: s.subject, value: s.avgPct }))} />
          ) : (
            <EmptyState icon={<Target size={24} />} title="No data for radar" />
          )}
        </Card>
      </div>

      <Card>
        <SectionHeader title="Attendance Heatmap" subtitle="Last 30 days — greener means better attendance" />
        <HeatmapGrid data={heatmapData} />
        <div className="mt-4 flex items-center justify-end gap-2 text-xs text-ink-500">
          <span>Less</span>
          <div className="h-3 w-3 rounded bg-ink-200 dark:bg-ink-800" />
          <div className="h-3 w-3 rounded bg-red-400" />
          <div className="h-3 w-3 rounded bg-amber-400" />
          <div className="h-3 w-3 rounded bg-brand-400" />
          <div className="h-3 w-3 rounded bg-brand-500" />
          <span>More</span>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <SectionHeader title="Upcoming Assignments" action={<button onClick={() => onNavigate('assignments')} className="btn-ghost text-xs">View all</button>} />
          <div className="space-y-2">
            {pendingAssignments.length > 0 ? pendingAssignments.slice(0, 4).map((a) => {
              const days = daysUntil(a.deadline);
              return (
                <div key={a.id} className="flex items-center gap-3 rounded-xl border border-ink-200 p-3 dark:border-ink-700">
                  <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg',
                    days <= 1 ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
                    days <= 3 ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' :
                    'bg-accent-100 text-accent-600 dark:bg-accent-900/30 dark:text-accent-400'
                  )}>
                    <BookOpen size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-semibold text-ink-900 dark:text-ink-100">{a.title}</p>
                    <p className="text-xs text-ink-500 dark:text-ink-400">{a.subject} · {relativeDate(a.deadline)}</p>
                  </div>
                </div>
              );
            }) : <EmptyState icon={<BookOpen size={24} />} title="No pending assignments" message="You're all caught up!" />}
          </div>
        </Card>

        <Card>
          <SectionHeader title="Fee Status" action={<button onClick={() => onNavigate('fees')} className="btn-ghost text-xs">View all</button>} />
          <div className="space-y-2">
            {studentFees.length > 0 ? studentFees.slice(0, 4).map((f) => (
              <div key={f.id} className="flex items-center gap-3 rounded-xl border border-ink-200 p-3 dark:border-ink-700">
                <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg',
                  f.status === 'paid' ? 'bg-brand-100 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400' :
                  f.status === 'overdue' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
                  'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
                )}>
                  <Wallet size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-semibold text-ink-900 dark:text-ink-100">{f.description}</p>
                  <p className="text-xs text-ink-500 dark:text-ink-400">{formatCurrency(f.amount)} · {f.due_date ? relativeDate(f.due_date) : ''}</p>
                </div>
                <span className={cn(
                  f.status === 'paid' ? 'badge-success' : f.status === 'overdue' ? 'badge-danger' : 'badge-warning'
                )}>{f.status}</span>
              </div>
            )) : <EmptyState icon={<Wallet size={24} />} title="No fee records" />}
          </div>
        </Card>
      </div>
    </div>
  );
}

export function StudentAttendance() {
  const { attendance, selectedStudentId, students } = useApp();
  const student = students.find((s) => s.id === selectedStudentId);
  const records = useMemo(() => attendance.filter((a) => a.student_id === selectedStudentId), [attendance, selectedStudentId]);

  const bySubject = useMemo(() => {
    const map: Record<string, { present: number; late: number; absent: number; total: number }> = {};
    records.forEach((r) => {
      const subj = r.subject_name || 'General';
      if (!map[subj]) map[subj] = { present: 0, late: 0, absent: 0, total: 0 };
      map[subj].total++;
      if (r.status === 'present') map[subj].present++;
      else if (r.status === 'late') map[subj].late++;
      else map[subj].absent++;
    });
    return Object.entries(map).map(([subject, v]) => ({
      subject,
      pct: Math.round((v.present / v.total) * 100),
      ...v,
    }));
  }, [records]);

  if (!student) return <EmptyState icon={<GraduationCap size={24} />} title="No student selected" />;

  const lateCount = records.filter((r) => r.status === 'late').length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Overall Attendance" value={`${student.attendance_pct}%`} icon={<CalendarCheck size={20} />} color="brand" />
        <StatCard label="Late Entries" value={lateCount} icon={<Clock size={20} />} trend="This month" color="amber" />
        <StatCard label="Total Classes" value={records.length} icon={<CalendarCheck size={20} />} color="accent" />
      </div>

      <Card>
        <SectionHeader title="Attendance by Subject" subtitle="Present percentage per subject" />
        <div className="space-y-4">
          {bySubject.map((s) => (
            <div key={s.subject}>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-sm font-medium text-ink-700 dark:text-ink-300">{s.subject}</span>
                <span className={cn(
                  'text-sm font-bold',
                  s.pct >= 90 ? 'text-brand-600 dark:text-brand-400' :
                  s.pct >= 75 ? 'text-accent-600 dark:text-accent-400' :
                  'text-red-600 dark:text-red-400'
                )}>{s.pct}%</span>
              </div>
              <ProgressBar value={s.pct} color={s.pct >= 90 ? 'brand' : s.pct >= 75 ? 'accent' : 'rose'} />
              <p className="mt-1 text-xs text-ink-500">{s.present} present · {s.late} late · {s.absent} absent</p>
            </div>
          ))}
        </div>
      </Card>

      {student.attendance_pct < 75 && (
        <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
          <div className="flex items-start gap-3">
            <AlertTriangle size={24} className="shrink-0 text-red-600 dark:text-red-400" />
            <div>
              <h3 className="font-semibold text-red-900 dark:text-red-200">Attendance Shortage Risk</h3>
              <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                Your attendance is {student.attendance_pct}%, below the 75% minimum requirement.
                You need approximately {Math.ceil((75 - student.attendance_pct) / 100 * 100)} more classes to be safe.
              </p>
            </div>
          </div>
        </Card>
      )}

      <Card>
        <SectionHeader title="Recent Attendance" subtitle="Latest attendance records" />
        <div className="space-y-2">
          {records.slice(0, 15).map((r) => (
            <div key={r.id} className="flex items-center gap-3 rounded-xl border border-ink-200 p-3 dark:border-ink-700">
              <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg',
                r.status === 'present' ? 'bg-brand-100 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400' :
                r.status === 'late' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' :
                'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
              )}>
                {r.status === 'present' ? <CalendarCheck size={16} /> : r.status === 'late' ? <Clock size={16} /> : <AlertTriangle size={16} />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-ink-900 dark:text-ink-100">{r.subject_name || 'General'}</p>
                <p className="text-xs text-ink-500 dark:text-ink-400">{formatDate(r.date)} · via {r.method}</p>
              </div>
              <span className={cn(
                r.status === 'present' ? 'badge-success' : r.status === 'late' ? 'badge-warning' : 'badge-danger'
              )}>{r.status}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export function StudentMarks() {
  const { marks, selectedStudentId, students } = useApp();
  const student = students.find((s) => s.id === selectedStudentId);
  const studentMarks = useMemo(() => marks.filter((m) => m.student_id === selectedStudentId), [marks, selectedStudentId]);
  const subjectAvgs = calculateSubjectAverages(studentMarks);
  const overallPct = subjectAvgs.length > 0 ? Math.round(subjectAvgs.reduce((s, a) => s + a.avgPct, 0) / subjectAvgs.length) : 0;

  if (!student) return <EmptyState icon={<GraduationCap size={24} />} title="No student selected" />;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label="Overall Average" value={`${overallPct}%`} icon={<TrendingUp size={20} />} color="brand" />
        <StatCard label="Grade" value={getGrade(overallPct)} icon={<Trophy size={20} />} color="accent" />
        <StatCard label="GPA" value={student.gpa.toFixed(2)} icon={<GraduationCap size={20} />} color="brand" />
        <StatCard label="Total Exams" value={studentMarks.length} icon={<ClipboardList size={20} />} color="amber" />
      </div>

      <Card>
        <SectionHeader title="Subject-wise Marks" subtitle="Average percentage by subject" />
        {subjectAvgs.length > 0 ? (
          <BarChart data={subjectAvgs.map(s => Math.round(s.avgPct))} labels={subjectAvgs.map(s => s.subject.slice(0, 4))} height={240} />
        ) : (
          <EmptyState icon={<ClipboardList size={24} />} title="No marks recorded yet" />
        )}
      </Card>

      <Card>
        <SectionHeader title="All Marks" subtitle="Complete exam-wise breakdown" />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-200 text-left text-xs font-semibold uppercase tracking-wide text-ink-500 dark:border-ink-700">
                <th className="pb-3 pr-4">Subject</th>
                <th className="pb-3 pr-4">Exam Type</th>
                <th className="pb-3 pr-4">Marks</th>
                <th className="pb-3 pr-4">Percentage</th>
                <th className="pb-3">Grade</th>
              </tr>
            </thead>
            <tbody>
              {studentMarks.map((m) => {
                const pct = Math.round((m.marks_obtained / m.max_marks) * 100);
                return (
                  <tr key={m.id} className="border-b border-ink-100 last:border-0 dark:border-ink-800">
                    <td className="py-3 pr-4 font-medium text-ink-900 dark:text-ink-100">{m.subject_name}</td>
                    <td className="py-3 pr-4 text-ink-600 dark:text-ink-400">{m.exam_type}</td>
                    <td className="py-3 pr-4 text-ink-600 dark:text-ink-400">{m.marks_obtained}/{m.max_marks}</td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <ProgressBar value={pct} color={pct >= 75 ? 'brand' : pct >= 50 ? 'amber' : 'rose'} />
                        <span className="w-10 text-right text-xs font-semibold text-ink-700 dark:text-ink-300">{pct}%</span>
                      </div>
                    </td>
                    <td className="py-3">
                      <span className={cn(
                        'badge',
                        pct >= 75 ? 'badge-success' : pct >= 50 ? 'badge-warning' : 'badge-danger'
                      )}>{getGrade(pct)}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

export function StudentAICoach() {
  const { marks, selectedStudentId, students } = useApp();
  const student = students.find((s) => s.id === selectedStudentId);
  const studentMarks = useMemo(() => marks.filter((m) => m.student_id === selectedStudentId), [marks, selectedStudentId]);

  if (!student) return <EmptyState icon={<GraduationCap size={24} />} title="No student selected" />;

  const subjectAvgs = calculateSubjectAverages(studentMarks);
  const studyPlan = generateStudyPlan(studentMarks);
  const careers = suggestCareer(studentMarks);
  const prediction = predictExamPerformance(studentMarks, student.attendance_pct);
  const weakSubjects = subjectAvgs.filter((s) => s.level === 'weak');
  const strongSubjects = subjectAvgs.filter((s) => s.level === 'strong');

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <div className="relative">
          <div className="absolute inset-0 gradient-mesh" />
          <div className="relative flex items-center gap-4 p-6">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl gradient-brand shadow-lg shadow-brand-600/30">
              <Sparkles size={28} className="text-white" />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-ink-900 dark:text-ink-50">AI Study Coach</h2>
              <p className="text-sm text-ink-600 dark:text-ink-400">Personalized recommendations based on your performance data</p>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <SectionHeader title="Personalized Study Plan" subtitle="AI-generated weekly schedule targeting weak areas" />
          <div className="space-y-2">
            {studyPlan.map((day) => (
              <div key={day.day} className="flex items-center gap-4 rounded-xl border border-ink-200 p-3 dark:border-ink-700">
                <div className="w-20 shrink-0">
                  <p className="text-sm font-bold text-ink-900 dark:text-ink-100">{day.day}</p>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-100 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400">
                  <BookOpen size={16} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-ink-900 dark:text-ink-100">{day.subject}</p>
                  <p className="text-xs text-ink-500 dark:text-ink-400">{day.focus}</p>
                </div>
                <span className="badge-neutral">{day.duration}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <SectionHeader title="Exam Prediction" />
          <div className="space-y-3">
            <div className="rounded-xl bg-brand-50 p-4 dark:bg-brand-900/20">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Expected Final Score</p>
              <p className="font-display text-3xl font-bold text-brand-600 dark:text-brand-400">{prediction.predictedPct}%</p>
              <p className="mt-1 text-xs text-ink-600 dark:text-ink-400">Grade {prediction.predictedGrade} · {prediction.passProbability}% pass probability</p>
            </div>
            <div className="rounded-xl border border-ink-200 p-4 dark:border-ink-700">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Confidence Level</p>
              <div className="mt-2 flex items-center gap-2">
                <ProgressBar value={prediction.confidence} />
                <span className="text-sm font-bold text-ink-700 dark:text-ink-300">{prediction.confidence}%</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <SectionHeader title="Weak & Strong Subjects" subtitle="AI classification based on your marks" />
          <div className="space-y-4">
            <div>
              <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-red-600 dark:text-red-400">
                <AlertTriangle size={16} /> Weak Subjects
              </p>
              {weakSubjects.length > 0 ? (
                <div className="space-y-2">
                  {weakSubjects.map((s) => (
                    <div key={s.subject} className="flex items-center justify-between rounded-xl bg-red-50 px-4 py-2 dark:bg-red-900/20">
                      <span className="text-sm font-medium text-ink-700 dark:text-ink-300">{s.subject}</span>
                      <span className="text-sm font-bold text-red-600 dark:text-red-400">{s.avgPct}%</span>
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-ink-500">No weak subjects — great job!</p>}
            </div>
            <div>
              <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-brand-600 dark:text-brand-400">
                <Trophy size={16} /> Strong Subjects
              </p>
              {strongSubjects.length > 0 ? (
                <div className="space-y-2">
                  {strongSubjects.map((s) => (
                    <div key={s.subject} className="flex items-center justify-between rounded-xl bg-brand-50 px-4 py-2 dark:bg-brand-900/20">
                      <span className="text-sm font-medium text-ink-700 dark:text-ink-300">{s.subject}</span>
                      <span className="text-sm font-bold text-brand-600 dark:text-brand-400">{s.avgPct}%</span>
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-ink-500">Keep working to build strengths!</p>}
            </div>
          </div>
        </Card>

        <Card>
          <SectionHeader title="AI Career Suggestions" subtitle="Based on your subject performance" />
          <div className="space-y-3">
            {careers.slice(0, 4).map((c) => (
              <div key={c.field} className="rounded-xl border border-ink-200 p-3 dark:border-ink-700">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-ink-900 dark:text-ink-100">{c.field}</span>
                  <span className={cn(
                    'badge',
                    c.match >= 75 ? 'badge-success' : c.match >= 50 ? 'badge-info' : 'badge-neutral'
                  )}>{c.match}% match</span>
                </div>
                <p className="mt-1 text-xs text-ink-500 dark:text-ink-400">{c.description}</p>
                <div className="mt-2">
                  <ProgressBar value={c.match} color={c.match >= 75 ? 'brand' : 'accent'} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

export function StudentAssignments() {
  const { assignments, selectedStudentId } = useApp();
  const studentAssignments = useMemo(() => assignments.filter((a) => a.student_id === selectedStudentId), [assignments, selectedStudentId]);

  const pending = studentAssignments.filter((a) => a.status === 'pending');
  const submitted = studentAssignments.filter((a) => a.status === 'submitted');
  const late = studentAssignments.filter((a) => a.status === 'late');

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Pending" value={pending.length} icon={<BookOpen size={20} />} color="amber" />
        <StatCard label="Submitted" value={submitted.length} icon={<ClipboardList size={20} />} color="brand" />
        <StatCard label="Late" value={late.length} icon={<FileWarning size={20} />} color="rose" />
      </div>

      <Card>
        <SectionHeader title="All Assignments" />
        <div className="space-y-2">
          {studentAssignments.map((a) => {
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
                  <p className="text-xs text-ink-500 dark:text-ink-400">{a.subject} · Due {formatDate(a.deadline)}</p>
                </div>
                <div className="text-right">
                  <span className={cn(
                    a.status === 'submitted' ? 'badge-success' : a.status === 'late' ? 'badge-danger' : 'badge-warning'
                  )}>{a.status}</span>
                  {a.plagiarism_pct > 0 && (
                    <p className="mt-1 text-xs text-ink-500">Plagiarism: {a.plagiarism_pct}%</p>
                  )}
                </div>
              </div>
            );
          })}
          {studentAssignments.length === 0 && <EmptyState icon={<BookOpen size={24} />} title="No assignments" />}
        </div>
      </Card>
    </div>
  );
}

export function StudentFees() {
  const { fees, selectedStudentId } = useApp();
  const studentFees = useMemo(() => fees.filter((f) => f.student_id === selectedStudentId), [fees, selectedStudentId]);
  const totalPaid = studentFees.filter((f) => f.status === 'paid').reduce((s, f) => s + f.amount, 0);
  const totalPending = studentFees.filter((f) => f.status !== 'paid').reduce((s, f) => s + f.amount, 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total Paid" value={formatCurrency(totalPaid)} icon={<Wallet size={20} />} color="brand" />
        <StatCard label="Pending" value={formatCurrency(totalPending)} icon={<Clock size={20} />} color="amber" />
        <StatCard label="Total Records" value={studentFees.length} icon={<ClipboardList size={20} />} color="accent" />
      </div>

      <Card>
        <SectionHeader title="Fee History" />
        <div className="space-y-2">
          {studentFees.map((f) => (
            <div key={f.id} className="flex items-center gap-3 rounded-xl border border-ink-200 p-4 dark:border-ink-700">
              <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg',
                f.status === 'paid' ? 'bg-brand-100 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400' :
                f.status === 'overdue' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
                'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
              )}>
                <Wallet size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-semibold text-ink-900 dark:text-ink-100">{f.description}</p>
                <p className="text-xs text-ink-500 dark:text-ink-400">
                  {formatCurrency(f.amount)} · Due {f.due_date ? formatDate(f.due_date) : 'N/A'}
                </p>
              </div>
              <span className={cn(
                f.status === 'paid' ? 'badge-success' : f.status === 'overdue' ? 'badge-danger' : 'badge-warning'
              )}>{f.status}</span>
            </div>
          ))}
          {studentFees.length === 0 && <EmptyState icon={<Wallet size={24} />} title="No fee records" />}
        </div>
      </Card>
    </div>
  );
}

export function StudentTimetable() {
  const { timetable } = useApp();
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const classTimetable = timetable.filter((t) => t.class === '10-A');

  return (
    <div className="space-y-6">
      <Card>
        <SectionHeader title="Weekly Timetable" subtitle="Class 10-A schedule" />
        <div className="grid gap-4 md:grid-cols-5">
          {days.map((day) => {
            const dayEntries = classTimetable.filter((t) => t.day === day).sort((a, b) => a.period - b.period);
            return (
              <div key={day}>
                <h3 className="mb-2 text-sm font-bold text-ink-900 dark:text-ink-100">{day}</h3>
                <div className="space-y-2">
                  {dayEntries.map((entry) => (
                    <div key={entry.id} className="rounded-xl border border-ink-200 bg-ink-50 p-3 dark:border-ink-700 dark:bg-ink-800/50">
                      <p className="text-xs font-semibold text-brand-600 dark:text-brand-400">Period {entry.period}</p>
                      <p className="mt-1 text-sm font-semibold text-ink-900 dark:text-ink-100">{entry.subject}</p>
                      <p className="text-xs text-ink-500 dark:text-ink-400">{entry.teacher_name}</p>
                      <div className="mt-1 flex items-center gap-2 text-xs text-ink-500">
                        <span>{entry.start_time} - {entry.end_time}</span>
                        <span>· {entry.room}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

export function StudentLibrary() {
  const { books } = useApp();
  return (
    <div className="space-y-6">
      <Card>
        <SectionHeader title="Library" subtitle="Search and browse available books" />
        <div className="grid gap-3 sm:grid-cols-2">
          {books.map((b) => (
            <div key={b.id} className="flex items-center gap-3 rounded-xl border border-ink-200 p-4 dark:border-ink-700">
              <div className="flex h-12 w-10 items-center justify-center rounded-lg bg-brand-100 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400">
                <BookOpen size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-semibold text-ink-900 dark:text-ink-100">{b.title}</p>
                <p className="text-xs text-ink-500 dark:text-ink-400">{b.author} · {b.category}</p>
              </div>
              <div className="text-right">
                <span className={cn('badge', b.available_copies > 0 ? 'badge-success' : 'badge-danger')}>
                  {b.available_copies > 0 ? `${b.available_copies} avail` : 'Out'}
                </span>
                <p className="mt-1 text-xs text-ink-500">{b.total_copies} total</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export function StudentEvents() {
  const { events } = useApp();
  const typeColors: Record<string, string> = {
    sports: 'bg-brand-100 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400',
    seminar: 'bg-accent-100 text-accent-600 dark:bg-accent-900/30 dark:text-accent-400',
    workshop: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
    holiday: 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400',
    event: 'bg-accent-100 text-accent-600 dark:bg-accent-900/30 dark:text-accent-400',
  };

  return (
    <div className="space-y-6">
      <Card>
        <SectionHeader title="Campus Events" subtitle="Upcoming activities and holidays" />
        <div className="grid gap-3 sm:grid-cols-2">
          {events.map((e) => (
            <div key={e.id} className="rounded-xl border border-ink-200 p-4 dark:border-ink-700">
              <div className="flex items-start justify-between">
                <span className={cn('badge', typeColors[e.type] || 'badge-neutral')}>{e.type}</span>
                <span className="text-xs text-ink-500">{relativeDate(e.date)}</span>
              </div>
              <h3 className="mt-2 text-sm font-bold text-ink-900 dark:text-ink-100">{e.title}</h3>
              {e.location && <p className="mt-1 text-xs text-ink-500">{e.location}</p>}
              {e.description && <p className="mt-1 text-xs text-ink-600 dark:text-ink-400">{e.description}</p>}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export function StudentNotifications() {
  const { notifications } = useApp();
  const studentNotifs = notifications.filter((n) => n.recipient_role === 'student');

  return (
    <div className="space-y-6">
      <Card>
        <SectionHeader title="Notifications" subtitle="Your recent alerts and updates" />
        <div className="space-y-2">
          {studentNotifs.map((n) => (
            <div key={n.id} className={cn(
              'flex items-start gap-3 rounded-xl border p-4 dark:border-ink-700',
              n.priority === 'high' ? 'border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-900/10' : 'border-ink-200'
            )}>
              <div className={cn(
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                n.priority === 'high' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-accent-100 text-accent-600 dark:bg-accent-900/30 dark:text-accent-400'
              )}>
                <Bell size={16} />
              </div>
              <div>
                <p className="text-sm font-semibold text-ink-900 dark:text-ink-100">{n.title}</p>
                {n.body && <p className="mt-0.5 text-xs text-ink-600 dark:text-ink-400">{n.body}</p>}
              </div>
            </div>
          ))}
          {studentNotifs.length === 0 && <EmptyState icon={<Bell size={24} />} title="No notifications" />}
        </div>
      </Card>
    </div>
  );
}
