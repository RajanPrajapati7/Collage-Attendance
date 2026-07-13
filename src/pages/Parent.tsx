import { useMemo } from 'react';
import {
  CalendarCheck, TrendingUp, Wallet, Heart, Sparkles,
  AlertTriangle, Trophy, ArrowUp, BookOpen, Bell, MessageCircle,
  GraduationCap, Clock,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Card, StatCard, SectionHeader, EmptyState, Avatar, ProgressBar } from '../components/ui';
import { LineChart, DonutChart } from '../components/charts';
import {
  calculateSubjectAverages, predictExamPerformance, generateParentSummary,
  generateAIInsights,
} from '../lib/ai';
import { cn, formatCurrency, formatDate, getGrade } from '../lib/utils';

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

const ICON_MAP: Record<string, React.ReactNode> = {
  AlertTriangle: <AlertTriangle size={18} />,
  Trophy: <Trophy size={18} />,
  CalendarX: <CalendarCheck size={18} />,
  CalendarClock: <Clock size={18} />,
  Clock: <Clock size={18} />,
  FileWarning: <AlertTriangle size={18} />,
  TrendingUp: <TrendingUp size={18} />,
};

export function ParentDashboard() {
  const { students, marks, attendance, fees, assignments, selectedStudentId } = useApp();
  const student = students.find((s) => s.id === selectedStudentId);

  const studentMarks = useMemo(() => marks.filter((m) => m.student_id === selectedStudentId), [marks, selectedStudentId]);
  const studentAttendance = useMemo(() => attendance.filter((a) => a.student_id === selectedStudentId), [attendance, selectedStudentId]);
  const studentFees = useMemo(() => fees.filter((f) => f.student_id === selectedStudentId), [fees, selectedStudentId]);
  const studentAssignments = useMemo(() => assignments.filter((a) => a.student_id === selectedStudentId), [assignments, selectedStudentId]);

  if (!student) return <EmptyState icon={<Heart size={24} />} title="No child selected" />;

  const subjectAvgs = calculateSubjectAverages(studentMarks);
  const prediction = predictExamPerformance(studentMarks, student.attendance_pct);
  const insights = generateAIInsights(studentMarks, studentAttendance, studentAssignments, student);
  const pendingFees = studentFees.filter((f) => f.status !== 'paid');
  const totalPendingFees = pendingFees.reduce((s, f) => s + f.amount, 0);
  const overallPct = subjectAvgs.length > 0 ? Math.round(subjectAvgs.reduce((s, a) => s + a.avgPct, 0) / subjectAvgs.length) : 0;

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

  const presentCount = studentAttendance.filter((a) => a.status === 'present').length;
  const lateCount = studentAttendance.filter((a) => a.status === 'late').length;
  const absentCount = studentAttendance.filter((a) => a.status === 'absent').length;
  const totalClasses = studentAttendance.length;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 p-6 text-white shadow-lg shadow-rose-500/20 animate-slide-up">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-white/80">Parent Portal</p>
            <h1 className="font-display text-2xl font-bold">{student.parent_name || 'Parent'}'s Dashboard</h1>
            <p className="mt-1 text-sm text-white/80">Tracking {student.name} · {student.class}</p>
          </div>
          <div className="hidden sm:block">
            <Avatar name={student.name} size="lg" />
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Overall Score" value={`${overallPct}%`} icon={<TrendingUp size={20} />} trend={`Grade ${getGrade(overallPct)}`} color="brand" />
        <StatCard label="Attendance" value={`${student.attendance_pct}%`} icon={<CalendarCheck size={20} />} trend={`${presentCount}/${totalClasses} classes`} color="accent" />
        <StatCard label="GPA" value={student.gpa.toFixed(2)} icon={<GraduationCap size={20} />} color="amber" />
        <StatCard label="Pending Fees" value={formatCurrency(totalPendingFees)} icon={<Wallet size={20} />} trend={`${pendingFees.length} pending`} color="rose" />
      </div>

      <Card className="border-brand-200 bg-brand-50/50 dark:border-brand-800 dark:bg-brand-900/10">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl gradient-brand shadow-lg shadow-brand-600/20">
            <MessageCircle size={24} className="text-white" />
          </div>
          <div>
            <h3 className="font-display text-base font-bold text-ink-900 dark:text-ink-50">AI Weekly Summary</h3>
            <p className="mt-1 text-sm text-ink-700 dark:text-ink-300">{generateParentSummary(studentMarks, student)}</p>
          </div>
        </div>
      </Card>

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
          <SectionHeader title="AI Prediction" />
          <div className="space-y-3">
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
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <SectionHeader title="AI Insights" subtitle="Recommendations for your child" />
          <div className="space-y-3">
            {insights.slice(0, 4).map((insight, i) => (
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
          <div className="space-y-3">
            {subjectAvgs.map((s) => (
              <div key={s.subject}>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm font-medium text-ink-700 dark:text-ink-300">{s.subject}</span>
                  <span className={cn(
                    'text-sm font-bold',
                    s.level === 'strong' ? 'text-brand-600 dark:text-brand-400' :
                    s.level === 'medium' ? 'text-accent-600 dark:text-accent-400' :
                    'text-red-600 dark:text-red-400'
                  )}>{s.avgPct}%</span>
                </div>
                <ProgressBar value={s.avgPct} color={s.level === 'strong' ? 'brand' : s.level === 'medium' ? 'accent' : 'rose'} />
              </div>
            ))}
          </div>
        </Card>
      </div>

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
    </div>
  );
}

export function ParentAttendance() {
  const { attendance, selectedStudentId, students } = useApp();
  const student = students.find((s) => s.id === selectedStudentId);
  const records = useMemo(() => attendance.filter((a) => a.student_id === selectedStudentId), [attendance, selectedStudentId]);

  if (!student) return <EmptyState icon={<Heart size={24} />} title="No child selected" />;

  const lateCount = records.filter((r) => r.status === 'late').length;
  const absentCount = records.filter((r) => r.status === 'absent').length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Overall Attendance" value={`${student.attendance_pct}%`} icon={<CalendarCheck size={20} />} color="brand" />
        <StatCard label="Late Entries" value={lateCount} icon={<Clock size={20} />} color="amber" />
        <StatCard label="Absences" value={absentCount} icon={<AlertTriangle size={20} />} color="rose" />
      </div>

      {student.attendance_pct < 75 && (
        <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
          <div className="flex items-start gap-3">
            <AlertTriangle size={24} className="shrink-0 text-red-600 dark:text-red-400" />
            <div>
              <h3 className="font-semibold text-red-900 dark:text-red-200">Attendance Alert</h3>
              <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                {student.name}'s attendance is {student.attendance_pct}%, below the 75% minimum requirement. Please ensure regular attendance.
              </p>
            </div>
          </div>
        </Card>
      )}

      <Card>
        <SectionHeader title="Recent Attendance Records" />
        <div className="space-y-2">
          {records.slice(0, 20).map((r) => (
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
                <p className="text-xs text-ink-500 dark:text-ink-400">{formatDate(r.date)}</p>
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

export function ParentMarks() {
  const { marks, selectedStudentId, students } = useApp();
  const student = students.find((s) => s.id === selectedStudentId);
  const studentMarks = useMemo(() => marks.filter((m) => m.student_id === selectedStudentId), [marks, selectedStudentId]);
  const subjectAvgs = calculateSubjectAverages(studentMarks);
  const overallPct = subjectAvgs.length > 0 ? Math.round(subjectAvgs.reduce((s, a) => s + a.avgPct, 0) / subjectAvgs.length) : 0;

  if (!student) return <EmptyState icon={<Heart size={24} />} title="No child selected" />;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Overall Average" value={`${overallPct}%`} icon={<TrendingUp size={20} />} color="brand" />
        <StatCard label="Grade" value={getGrade(overallPct)} icon={<Trophy size={20} />} color="accent" />
        <StatCard label="GPA" value={student.gpa.toFixed(2)} icon={<GraduationCap size={20} />} color="amber" />
      </div>

      <Card>
        <SectionHeader title="Subject Performance" />
        <div className="space-y-4">
          {subjectAvgs.map((s) => (
            <div key={s.subject}>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-sm font-medium text-ink-700 dark:text-ink-300">{s.subject}</span>
                <span className={cn(
                  'text-sm font-bold',
                  s.level === 'strong' ? 'text-brand-600 dark:text-brand-400' :
                  s.level === 'medium' ? 'text-accent-600 dark:text-accent-400' :
                  'text-red-600 dark:text-red-400'
                )}>{s.avgPct}%</span>
              </div>
              <ProgressBar value={s.avgPct} color={s.level === 'strong' ? 'brand' : s.level === 'medium' ? 'accent' : 'rose'} />
              <p className="mt-1 text-xs text-ink-500">
                {s.level === 'weak' ? 'Needs improvement' : s.level === 'medium' ? 'Good progress' : 'Excellent performance'}
              </p>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <SectionHeader title="Recent Exam Results" />
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
              {studentMarks.slice(0, 15).map((m) => {
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

export function ParentFees() {
  const { fees, selectedStudentId, students } = useApp();
  const student = students.find((s) => s.id === selectedStudentId);
  const studentFees = useMemo(() => fees.filter((f) => f.student_id === selectedStudentId), [fees, selectedStudentId]);

  if (!student) return <EmptyState icon={<Heart size={24} />} title="No child selected" />;

  const totalPaid = studentFees.filter((f) => f.status === 'paid').reduce((s, f) => s + f.amount, 0);
  const totalPending = studentFees.filter((f) => f.status !== 'paid').reduce((s, f) => s + f.amount, 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total Paid" value={formatCurrency(totalPaid)} icon={<Wallet size={20} />} color="brand" />
        <StatCard label="Pending" value={formatCurrency(totalPending)} icon={<Clock size={20} />} color="amber" />
        <StatCard label="Records" value={studentFees.length} icon={<BookOpen size={20} />} color="accent" />
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
        </div>
      </Card>
    </div>
  );
}

export function ParentAISummary() {
  const { students, marks, attendance, assignments, selectedStudentId } = useApp();
  const student = students.find((s) => s.id === selectedStudentId);

  const studentMarks = useMemo(() => marks.filter((m) => m.student_id === selectedStudentId), [marks, selectedStudentId]);
  const studentAttendance = useMemo(() => attendance.filter((a) => a.student_id === selectedStudentId), [attendance, selectedStudentId]);
  const studentAssignments = useMemo(() => assignments.filter((a) => a.student_id === selectedStudentId), [assignments, selectedStudentId]);

  if (!student) return <EmptyState icon={<Heart size={24} />} title="No child selected" />;

  const subjectAvgs = calculateSubjectAverages(studentMarks);
  const prediction = predictExamPerformance(studentMarks, student.attendance_pct);
  const insights = generateAIInsights(studentMarks, studentAttendance, studentAssignments, student);
  const summary = generateParentSummary(studentMarks, student);
  const weak = subjectAvgs.filter((s) => s.level === 'weak');
  const strong = subjectAvgs.filter((s) => s.level === 'strong');

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <div className="relative">
          <div className="absolute inset-0 gradient-mesh" />
          <div className="relative flex items-center gap-4 p-6">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-pink-500 shadow-lg shadow-rose-500/30">
              <MessageCircle size={28} className="text-white" />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-ink-900 dark:text-ink-50">AI Parent Summary</h2>
              <p className="text-sm text-ink-600 dark:text-ink-400">Automated weekly insights for {student.name}</p>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <SectionHeader title="Weekly Summary" subtitle="AI-generated overview" />
        <div className="rounded-xl bg-brand-50 p-5 dark:bg-brand-900/20">
          <p className="text-sm leading-relaxed text-ink-800 dark:text-ink-200">{summary}</p>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <SectionHeader title="Strengths & Weaknesses" />
          <div className="space-y-4">
            <div>
              <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-brand-600 dark:text-brand-400">
                <Trophy size={16} /> Strengths
              </p>
              {strong.length > 0 ? (
                <div className="space-y-2">
                  {strong.map((s) => (
                    <div key={s.subject} className="flex items-center justify-between rounded-xl bg-brand-50 px-4 py-2 dark:bg-brand-900/20">
                      <span className="text-sm font-medium text-ink-700 dark:text-ink-300">{s.subject}</span>
                      <span className="text-sm font-bold text-brand-600 dark:text-brand-400">{s.avgPct}%</span>
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-ink-500">Building strengths — keep encouraging!</p>}
            </div>
            <div>
              <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-red-600 dark:text-red-400">
                <AlertTriangle size={16} /> Areas to Improve
              </p>
              {weak.length > 0 ? (
                <div className="space-y-2">
                  {weak.map((s) => (
                    <div key={s.subject} className="flex items-center justify-between rounded-xl bg-red-50 px-4 py-2 dark:bg-red-900/20">
                      <span className="text-sm font-medium text-ink-700 dark:text-ink-300">{s.subject}</span>
                      <span className="text-sm font-bold text-red-600 dark:text-red-400">{s.avgPct}%</span>
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-ink-500">No weak areas — excellent!</p>}
            </div>
          </div>
        </Card>

        <Card>
          <SectionHeader title="AI Recommendations" />
          <div className="space-y-3">
            {insights.map((insight, i) => (
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
      </div>

      <Card>
        <SectionHeader title="Exam Prediction" />
        <div className="grid gap-4 sm:grid-cols-4">
          <div className="rounded-xl bg-ink-50 p-4 text-center dark:bg-ink-800/50">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Current</p>
            <p className="font-display text-2xl font-bold text-ink-900 dark:text-ink-50">{prediction.currentPct}%</p>
          </div>
          <div className="rounded-xl bg-brand-50 p-4 text-center dark:bg-brand-900/20">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Predicted</p>
            <p className="font-display text-2xl font-bold text-brand-600 dark:text-brand-400">{prediction.predictedPct}%</p>
          </div>
          <div className="rounded-xl bg-ink-50 p-4 text-center dark:bg-ink-800/50">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Grade</p>
            <p className="font-display text-2xl font-bold text-ink-900 dark:text-ink-50">{prediction.predictedGrade}</p>
          </div>
          <div className="rounded-xl bg-ink-50 p-4 text-center dark:bg-ink-800/50">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Pass Prob.</p>
            <p className="font-display text-2xl font-bold text-brand-600 dark:text-brand-400">{prediction.passProbability}%</p>
          </div>
        </div>
      </Card>
    </div>
  );
}

export function ParentNotifications() {
  const { notifications } = useApp();
  const parentNotifs = notifications.filter((n) => n.recipient_role === 'parent');

  return (
    <div className="space-y-6">
      <Card>
        <SectionHeader title="Notifications" subtitle="Updates about your child" />
        <div className="space-y-2">
          {parentNotifs.map((n) => (
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
          {parentNotifs.length === 0 && <EmptyState icon={<Bell size={24} />} title="No notifications" />}
        </div>
      </Card>
    </div>
  );
}
