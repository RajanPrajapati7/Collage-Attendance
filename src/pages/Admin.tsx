import { useState } from 'react';
import {
  Users, GraduationCap, Wallet, TrendingUp, Library,
  Bell, Plus, Search, Trash2, Shield,
  AlertTriangle, FileText, DollarSign,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Card, StatCard, SectionHeader, EmptyState, Avatar, Modal } from '../components/ui';
import { BarChart, DonutChart } from '../components/charts';
import { supabase } from '../lib/supabase';
import { cn, formatCurrency, formatDate, relativeDate, getGrade } from '../lib/utils';
import { calculateSubjectAverages, predictExamPerformance } from '../lib/ai';

export function AdminDashboard() {
  const { students, teachers, fees } = useApp();

  const totalFeesCollected = fees.filter((f) => f.status === 'paid').reduce((s, f) => s + f.amount, 0);
  const totalPendingFees = fees.filter((f) => f.status !== 'paid').reduce((s, f) => s + f.amount, 0);
  const atRiskCount = students.filter((s) => s.risk_level === 'high').length;
  const avgAttendance = students.length > 0
    ? Math.round(students.reduce((s, st) => s + st.attendance_pct, 0) / students.length)
    : 0;

  const topStudents = [...students].sort((a, b) => b.gpa - a.gpa).slice(0, 5);
  const gpaDistribution = [
    { label: 'Excellent (3.5+)', value: students.filter((s) => s.gpa >= 3.5).length, color: '#16b87e' },
    { label: 'Good (3.0-3.5)', value: students.filter((s) => s.gpa >= 3.0 && s.gpa < 3.5).length, color: '#3b82f6' },
    { label: 'Average (<3.0)', value: students.filter((s) => s.gpa < 3.0).length, color: '#f59e0b' },
  ];

  const attendanceByStudent = students.map((s) => ({
    name: s.name.split(' ')[0],
    pct: Math.round(s.attendance_pct),
  })).sort((a, b) => b.pct - a.pct);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-r from-amber-600 to-orange-500 p-6 text-white shadow-lg shadow-amber-600/20 animate-slide-up">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-white/80">Admin Dashboard</p>
            <h1 className="font-display text-2xl font-bold">EduPilot AI Campus Overview</h1>
            <p className="mt-1 text-sm text-white/80">{students.length} students · {teachers.length} teachers · Class 10-A</p>
          </div>
          <div className="hidden sm:block">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20">
              <Shield size={28} className="text-white" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Students" value={students.length} icon={<Users size={20} />} color="brand" />
        <StatCard label="Total Teachers" value={teachers.length} icon={<GraduationCap size={20} />} color="accent" />
        <StatCard label="Fees Collected" value={formatCurrency(totalFeesCollected)} icon={<Wallet size={20} />} trend={`${formatCurrency(totalPendingFees)} pending`} color="amber" />
        <StatCard label="At-Risk Students" value={atRiskCount} icon={<AlertTriangle size={20} />} trend={`Avg attendance ${avgAttendance}%`} color="rose" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <SectionHeader title="Attendance by Student" subtitle="Overall attendance percentage" />
          <BarChart data={attendanceByStudent.map((s) => s.pct)} labels={attendanceByStudent.map((s) => s.name)} height={240} color="#16b87e" />
        </Card>

        <Card>
          <SectionHeader title="GPA Distribution" />
          <DonutChart
            segments={gpaDistribution.map((d) => ({ ...d, value: Math.round((d.value / students.length) * 100) }))}
          />
        </Card>
      </div>

      <Card>
        <SectionHeader title="Top Students" subtitle="Ranked by GPA" />
        <div className="space-y-2">
          {topStudents.map((s, i) => (
            <div key={s.id} className="flex items-center gap-3 rounded-xl border border-ink-200 p-3 dark:border-ink-700">
              <span className={cn(
                'flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold',
                i === 0 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' : 'bg-ink-100 text-ink-500 dark:bg-ink-800'
              )}>{i + 1}</span>
              <Avatar name={s.name} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-semibold text-ink-900 dark:text-ink-100">{s.name}</p>
                <p className="text-xs text-ink-500 dark:text-ink-400">{s.roll_no} · {s.class}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-brand-600 dark:text-brand-400">{s.gpa.toFixed(2)}</p>
                <p className="text-xs text-ink-500">{s.attendance_pct}% att</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export function AdminStudents() {
  const { students, refresh } = useApp();
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', roll_no: '', class: '10-A', parent_name: '', parent_phone: '', blood_group: 'O+' });
  const [saving, setSaving] = useState(false);

  const filtered = students.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.roll_no.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = async () => {
    if (!form.name.trim() || !form.roll_no.trim()) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('students').insert({
        name: form.name.trim(),
        roll_no: form.roll_no.trim(),
        class: form.class,
        section: 'A',
        parent_name: form.parent_name,
        parent_phone: form.parent_phone,
        blood_group: form.blood_group,
        gpa: 0,
        attendance_pct: 100,
        risk_level: 'low',
      });
      if (error) throw error;
      setForm({ name: '', roll_no: '', class: '10-A', parent_name: '', parent_phone: '', blood_group: 'O+' });
      setShowAdd(false);
      await refresh();
    } catch (err) {
      console.error('Failed to add student:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await supabase.from('students').delete().eq('id', id);
      await refresh();
    } catch (err) {
      console.error('Failed to delete student:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search students…"
            className="input pl-9"
          />
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary">
          <Plus size={16} /> Add Student
        </button>
      </div>

      <Card>
        <SectionHeader title="All Students" subtitle={`${filtered.length} students`} />
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map((s) => (
            <div key={s.id} className="rounded-xl border border-ink-200 p-4 dark:border-ink-700">
              <div className="flex items-start gap-3">
                <Avatar name={s.name} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-semibold text-ink-900 dark:text-ink-100">{s.name}</p>
                  <p className="text-xs text-ink-500 dark:text-ink-400">{s.roll_no} · {s.class}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="badge-neutral">GPA {s.gpa.toFixed(2)}</span>
                    <span className={cn(
                      'badge',
                      s.risk_level === 'low' ? 'badge-success' : s.risk_level === 'medium' ? 'badge-warning' : 'badge-danger'
                    )}>{s.risk_level}</span>
                  </div>
                </div>
                <button onClick={() => handleDelete(s.id)} className="btn-ghost h-8 w-8 rounded-lg p-0 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
                  <Trash2 size={16} />
                </button>
              </div>
              {s.parent_name && (
                <div className="mt-3 border-t border-ink-100 pt-2 dark:border-ink-800">
                  <p className="text-xs text-ink-500">Parent: {s.parent_name}</p>
                  {s.parent_phone && <p className="text-xs text-ink-500">{s.parent_phone}</p>}
                </div>
              )}
            </div>
          ))}
        </div>
        {filtered.length === 0 && <EmptyState icon={<Users size={24} />} title="No students found" />}
      </Card>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add New Student">
        <div className="space-y-3">
          <div>
            <label className="label">Full Name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" placeholder="Student name" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Roll No</label>
              <input value={form.roll_no} onChange={(e) => setForm({ ...form, roll_no: e.target.value })} className="input" placeholder="STU009" />
            </div>
            <div>
              <label className="label">Class</label>
              <input value={form.class} onChange={(e) => setForm({ ...form, class: e.target.value })} className="input" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Parent Name</label>
              <input value={form.parent_name} onChange={(e) => setForm({ ...form, parent_name: e.target.value })} className="input" />
            </div>
            <div>
              <label className="label">Parent Phone</label>
              <input value={form.parent_phone} onChange={(e) => setForm({ ...form, parent_phone: e.target.value })} className="input" />
            </div>
          </div>
          <div>
            <label className="label">Blood Group</label>
            <select value={form.blood_group} onChange={(e) => setForm({ ...form, blood_group: e.target.value })} className="input">
              {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <button onClick={handleAdd} disabled={saving || !form.name.trim() || !form.roll_no.trim()} className="btn-primary w-full">
            {saving ? 'Adding…' : 'Add Student'}
          </button>
        </div>
      </Modal>
    </div>
  );
}

export function AdminTeachers() {
  const { teachers, refresh } = useApp();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', subject: '', email: '', phone: '', experience_years: 0 });
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    if (!form.name.trim() || !form.subject.trim()) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('teachers').insert({
        name: form.name.trim(),
        subject: form.subject.trim(),
        email: form.email,
        phone: form.phone,
        experience_years: form.experience_years,
        salary_status: 'paid',
      });
      if (error) throw error;
      setForm({ name: '', subject: '', email: '', phone: '', experience_years: 0 });
      setShowAdd(false);
      await refresh();
    } catch (err) {
      console.error('Failed to add teacher:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await supabase.from('teachers').delete().eq('id', id);
      await refresh();
    } catch (err) {
      console.error('Failed to delete teacher:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-bold text-ink-900 dark:text-ink-50">Teachers</h2>
        <button onClick={() => setShowAdd(true)} className="btn-primary">
          <Plus size={16} /> Add Teacher
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {teachers.map((t) => (
          <Card key={t.id} hover>
            <div className="flex items-start gap-3">
              <Avatar name={t.name} size="md" />
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-semibold text-ink-900 dark:text-ink-100">{t.name}</p>
                <p className="text-xs text-ink-500 dark:text-ink-400">{t.subject}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="badge-info">{t.experience_years} yrs exp</span>
                  <span className={cn('badge', t.salary_status === 'paid' ? 'badge-success' : 'badge-warning')}>
                    {t.salary_status}
                  </span>
                </div>
                {t.email && <p className="mt-2 text-xs text-ink-500">{t.email}</p>}
              </div>
              <button onClick={() => handleDelete(t.id)} className="btn-ghost h-8 w-8 rounded-lg p-0 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
                <Trash2 size={16} />
              </button>
            </div>
          </Card>
        ))}
      </div>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add New Teacher">
        <div className="space-y-3">
          <div>
            <label className="label">Full Name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" />
          </div>
          <div>
            <label className="label">Subject</label>
            <input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="input" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Email</label>
              <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input" />
            </div>
            <div>
              <label className="label">Phone</label>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input" />
            </div>
          </div>
          <div>
            <label className="label">Experience (years)</label>
            <input type="number" value={form.experience_years} onChange={(e) => setForm({ ...form, experience_years: parseInt(e.target.value) || 0 })} className="input" />
          </div>
          <button onClick={handleAdd} disabled={saving || !form.name.trim()} className="btn-primary w-full">
            {saving ? 'Adding…' : 'Add Teacher'}
          </button>
        </div>
      </Modal>
    </div>
  );
}

export function AdminFees() {
  const { fees, students, refresh } = useApp();
  const [filter, setFilter] = useState('all');

  const totalCollected = fees.filter((f) => f.status === 'paid').reduce((s, f) => s + f.amount, 0);
  const totalPending = fees.filter((f) => f.status === 'pending').reduce((s, f) => s + f.amount, 0);
  const totalOverdue = fees.filter((f) => f.status === 'overdue').reduce((s, f) => s + f.amount, 0);

  const filtered = filter === 'all' ? fees : fees.filter((f) => f.status === filter);

  const handleMarkPaid = async (id: string) => {
    try {
      await supabase.from('fees').update({ status: 'paid' }).eq('id', id);
      await refresh();
    } catch (err) {
      console.error('Failed to update fee:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Collected" value={formatCurrency(totalCollected)} icon={<DollarSign size={20} />} color="brand" />
        <StatCard label="Pending" value={formatCurrency(totalPending)} icon={<Wallet size={20} />} color="amber" />
        <StatCard label="Overdue" value={formatCurrency(totalOverdue)} icon={<AlertTriangle size={20} />} color="rose" />
      </div>

      <Card>
        <div className="flex items-center justify-between">
          <SectionHeader title="Fee Records" />
          <div className="flex gap-1.5">
            {['all', 'paid', 'pending', 'overdue'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-all',
                  filter === f ? 'bg-brand-500 text-white' : 'bg-ink-100 text-ink-600 hover:bg-ink-200 dark:bg-ink-800 dark:text-ink-400'
                )}
              >{f}</button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-200 text-left text-xs font-semibold uppercase tracking-wide text-ink-500 dark:border-ink-700">
                <th className="pb-3 pr-4">Student</th>
                <th className="pb-3 pr-4">Description</th>
                <th className="pb-3 pr-4">Amount</th>
                <th className="pb-3 pr-4">Due Date</th>
                <th className="pb-3 pr-4">Status</th>
                <th className="pb-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((f) => {
                const student = students.find((s) => s.id === f.student_id);
                return (
                  <tr key={f.id} className="border-b border-ink-100 last:border-0 dark:border-ink-800">
                    <td className="py-3 pr-4 font-medium text-ink-900 dark:text-ink-100">{student?.name || '—'}</td>
                    <td className="py-3 pr-4 text-ink-600 dark:text-ink-400">{f.description}</td>
                    <td className="py-3 pr-4 font-semibold text-ink-900 dark:text-ink-100">{formatCurrency(f.amount)}</td>
                    <td className="py-3 pr-4 text-ink-600 dark:text-ink-400">{f.due_date ? formatDate(f.due_date) : '—'}</td>
                    <td className="py-3 pr-4">
                      <span className={cn(
                        'badge',
                        f.status === 'paid' ? 'badge-success' : f.status === 'overdue' ? 'badge-danger' : 'badge-warning'
                      )}>{f.status}</span>
                    </td>
                    <td className="py-3">
                      {f.status !== 'paid' && (
                        <button onClick={() => handleMarkPaid(f.id)} className="btn-ghost text-xs text-brand-600 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-900/20">
                          Mark Paid
                        </button>
                      )}
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

export function AdminReports() {
  const { students, marks } = useApp();

  const reportData = students.map((s) => {
    const sMarks = marks.filter((m) => m.student_id === s.id);
    const subjectAvgs = calculateSubjectAverages(sMarks);
    const overall = subjectAvgs.length > 0
      ? Math.round(subjectAvgs.reduce((sum, a) => sum + a.avgPct, 0) / subjectAvgs.length)
      : 0;
    const prediction = predictExamPerformance(sMarks, s.attendance_pct);
    return {
      student: s,
      overall,
      grade: getGrade(overall),
      prediction,
      weakCount: subjectAvgs.filter((a) => a.level === 'weak').length,
    };
  }).sort((a, b) => b.overall - a.overall);

  const classAvg = reportData.length > 0 ? Math.round(reportData.reduce((s, r) => s + r.overall, 0) / reportData.length) : 0;
  const passRate = reportData.length > 0 ? Math.round((reportData.filter((r) => r.overall >= 40).length / reportData.length) * 100) : 0;
  const atRisk = reportData.filter((r) => r.student.risk_level === 'high');

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label="Class Average" value={`${classAvg}%`} icon={<TrendingUp size={20} />} color="brand" />
        <StatCard label="Pass Rate" value={`${passRate}%`} icon={<FileText size={20} />} color="accent" />
        <StatCard label="Top Student" value={reportData[0]?.overall ? `${reportData[0].overall}%` : '—'} icon={<GraduationCap size={20} />} trend={reportData[0]?.student.name} color="amber" />
        <StatCard label="At-Risk" value={atRisk.length} icon={<AlertTriangle size={20} />} color="rose" />
      </div>

      <Card>
        <SectionHeader title="Smart Report Card" subtitle="AI-enhanced student performance overview" />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-200 text-left text-xs font-semibold uppercase tracking-wide text-ink-500 dark:border-ink-700">
                <th className="pb-3 pr-4">Rank</th>
                <th className="pb-3 pr-4">Student</th>
                <th className="pb-3 pr-4">Current</th>
                <th className="pb-3 pr-4">AI Predicted</th>
                <th className="pb-3 pr-4">Grade</th>
                <th className="pb-3 pr-4">Weak Subs</th>
                <th className="pb-3">Risk</th>
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
                  <td className="py-3 pr-4 text-ink-700 dark:text-ink-300">{r.overall}%</td>
                  <td className="py-3 pr-4">
                    <span className="font-semibold text-brand-600 dark:text-brand-400">{r.prediction.predictedPct}%</span>
                    <span className="ml-1 text-xs text-ink-400">({r.prediction.predictedGrade})</span>
                  </td>
                  <td className="py-3 pr-4">
                    <span className={cn(
                      'badge',
                      r.overall >= 75 ? 'badge-success' : r.overall >= 50 ? 'badge-warning' : 'badge-danger'
                    )}>{r.grade}</span>
                  </td>
                  <td className="py-3 pr-4 text-ink-600 dark:text-ink-400">{r.weakCount}</td>
                  <td className="py-3">
                    <span className={cn(
                      'badge',
                      r.student.risk_level === 'low' ? 'badge-success' : r.student.risk_level === 'medium' ? 'badge-warning' : 'badge-danger'
                    )}>{r.student.risk_level}</span>
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
              <h3 className="font-semibold text-red-900 dark:text-red-200">AI Dropout Risk Alert</h3>
              <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                {atRisk.map((r) => r.student.name).join(', ')} — identified as high-risk based on attendance and academic performance patterns. Immediate intervention recommended.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

export function AdminLibrary() {
  const { books, students, refresh } = useApp();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: '', author: '', category: '', total_copies: 1 });
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    if (!form.title.trim() || !form.author.trim()) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('books').insert({
        title: form.title.trim(),
        author: form.author.trim(),
        category: form.category,
        total_copies: form.total_copies,
        available_copies: form.total_copies,
      });
      if (error) throw error;
      setForm({ title: '', author: '', category: '', total_copies: 1 });
      setShowAdd(false);
      await refresh();
    } catch (err) {
      console.error('Failed to add book:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-bold text-ink-900 dark:text-ink-50">Library</h2>
        <button onClick={() => setShowAdd(true)} className="btn-primary">
          <Plus size={16} /> Add Book
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {books.map((b) => {
          const issuedTo = students.find((s) => s.id === b.issued_to_student_id);
          return (
            <Card key={b.id} hover>
              <div className="flex items-start gap-3">
                <div className="flex h-14 w-11 items-center justify-center rounded-lg bg-brand-100 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400">
                  <Library size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-semibold text-ink-900 dark:text-ink-100">{b.title}</p>
                  <p className="text-xs text-ink-500 dark:text-ink-400">{b.author}</p>
                  {b.category && <span className="badge-neutral mt-2">{b.category}</span>}
                  <div className="mt-2 flex items-center gap-2">
                    <span className={cn('badge', b.available_copies > 0 ? 'badge-success' : 'badge-danger')}>
                      {b.available_copies}/{b.total_copies} available
                    </span>
                  </div>
                  {issuedTo && <p className="mt-1 text-xs text-amber-600">Issued to: {issuedTo.name}</p>}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Book">
        <div className="space-y-3">
          <div>
            <label className="label">Title</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input" />
          </div>
          <div>
            <label className="label">Author</label>
            <input value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} className="input" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Category</label>
              <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input" />
            </div>
            <div>
              <label className="label">Total Copies</label>
              <input type="number" min="1" value={form.total_copies} onChange={(e) => setForm({ ...form, total_copies: parseInt(e.target.value) || 1 })} className="input" />
            </div>
          </div>
          <button onClick={handleAdd} disabled={saving || !form.title.trim()} className="btn-primary w-full">
            {saving ? 'Adding…' : 'Add Book'}
          </button>
        </div>
      </Modal>
    </div>
  );
}

export function AdminEvents() {
  const { events, refresh } = useApp();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: '', type: 'event', date: new Date().toISOString().slice(0, 10), location: '', description: '' });
  const [saving, setSaving] = useState(false);

  const typeColors: Record<string, string> = {
    sports: 'bg-brand-100 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400',
    seminar: 'bg-accent-100 text-accent-600 dark:bg-accent-900/30 dark:text-accent-400',
    workshop: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
    holiday: 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400',
    event: 'bg-accent-100 text-accent-600 dark:bg-accent-900/30 dark:text-accent-400',
  };

  const handleAdd = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('events').insert({
        title: form.title.trim(),
        type: form.type,
        date: form.date,
        location: form.location,
        description: form.description,
      });
      if (error) throw error;
      setForm({ title: '', type: 'event', date: new Date().toISOString().slice(0, 10), location: '', description: '' });
      setShowAdd(false);
      await refresh();
    } catch (err) {
      console.error('Failed to add event:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-bold text-ink-900 dark:text-ink-50">Campus Events</h2>
        <button onClick={() => setShowAdd(true)} className="btn-primary">
          <Plus size={16} /> Add Event
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {events.map((e) => (
          <Card key={e.id} hover>
            <div className="flex items-start justify-between">
              <span className={cn('badge', typeColors[e.type] || 'badge-neutral')}>{e.type}</span>
              <span className="text-xs text-ink-500">{relativeDate(e.date)}</span>
            </div>
            <h3 className="mt-2 text-sm font-bold text-ink-900 dark:text-ink-100">{e.title}</h3>
            {e.location && <p className="mt-1 text-xs text-ink-500">{e.location}</p>}
            {e.description && <p className="mt-1 text-xs text-ink-600 dark:text-ink-400">{e.description}</p>}
            <p className="mt-2 text-xs font-medium text-ink-400">{formatDate(e.date)}</p>
          </Card>
        ))}
      </div>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Event">
        <div className="space-y-3">
          <div>
            <label className="label">Event Title</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="input">
                {['event', 'sports', 'seminar', 'workshop', 'holiday'].map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Date</label>
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="input" />
            </div>
          </div>
          <div>
            <label className="label">Location</label>
            <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="input" />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input min-h-20" />
          </div>
          <button onClick={handleAdd} disabled={saving || !form.title.trim()} className="btn-primary w-full">
            {saving ? 'Adding…' : 'Add Event'}
          </button>
        </div>
      </Modal>
    </div>
  );
}

export function AdminNotifications() {
  const { notifications } = useApp();
  return (
    <div className="space-y-6">
      <Card>
        <SectionHeader title="All Notifications" />
        <div className="space-y-2">
          {notifications.map((n) => (
            <div key={n.id} className="flex items-start gap-3 rounded-xl border border-ink-200 p-4 dark:border-ink-700">
              <div className={cn(
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                n.priority === 'high' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-accent-100 text-accent-600 dark:bg-accent-900/30 dark:text-accent-400'
              )}>
                <Bell size={16} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-ink-900 dark:text-ink-100">{n.title}</p>
                  <span className="badge-neutral capitalize">{n.recipient_role}</span>
                </div>
                {n.body && <p className="mt-0.5 text-xs text-ink-600 dark:text-ink-400">{n.body}</p>}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
