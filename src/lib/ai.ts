import type { Mark, AttendanceRecord, Assignment, Student } from './types';

export interface SubjectAnalysis {
  subject: string;
  avgPct: number;
  trend: 'up' | 'down' | 'stable';
  level: 'weak' | 'medium' | 'strong';
}

export interface AIPrediction {
  currentPct: number;
  predictedPct: number;
  predictedGrade: string;
  passProbability: number;
  confidence: number;
}

export interface StudyPlanDay {
  day: string;
  subject: string;
  focus: string;
  duration: string;
}

export interface AIInsight {
  type: 'success' | 'warning' | 'danger' | 'info';
  title: string;
  message: string;
  icon: string;
}

export function calculateSubjectAverages(marks: Mark[]): SubjectAnalysis[] {
  const bySubject: Record<string, Mark[]> = {};
  marks.forEach((m) => {
    if (!bySubject[m.subject_name]) bySubject[m.subject_name] = [];
    bySubject[m.subject_name].push(m);
  });

  return Object.entries(bySubject)
    .map(([subject, subjectMarks]) => {
      const avgPct =
        (subjectMarks.reduce((s, m) => s + (m.marks_obtained / m.max_marks) * 100, 0) /
          subjectMarks.length);

      const recentExams = [...subjectMarks].slice(-3);
      const olderExams = subjectMarks.slice(0, Math.max(0, subjectMarks.length - 3));
      const recentAvg = recentExams.length
        ? recentExams.reduce((s, m) => s + (m.marks_obtained / m.max_marks) * 100, 0) / recentExams.length
        : avgPct;
      const olderAvg = olderExams.length
        ? olderExams.reduce((s, m) => s + (m.marks_obtained / m.max_marks) * 100, 0) / olderExams.length
        : avgPct;

      const trend: 'up' | 'down' | 'stable' =
        recentAvg - olderAvg > 3 ? 'up' : recentAvg - olderAvg < -3 ? 'down' : 'stable';

      const level: 'weak' | 'medium' | 'strong' =
        avgPct < 55 ? 'weak' : avgPct < 75 ? 'medium' : 'strong';

      return { subject, avgPct: Math.round(avgPct * 10) / 10, trend, level };
    })
    .sort((a, b) => b.avgPct - a.avgPct);
}

export function predictExamPerformance(marks: Mark[], attendancePct: number): AIPrediction {
  const subjectAvgs = calculateSubjectAverages(marks);
  if (subjectAvgs.length === 0) {
    return { currentPct: 0, predictedPct: 0, predictedGrade: 'F', passProbability: 0, confidence: 0 };
  }

  const currentPct = subjectAvgs.reduce((s, a) => s + a.avgPct, 0) / subjectAvgs.length;

  const upTrends = subjectAvgs.filter((s) => s.trend === 'up').length;
  const downTrends = subjectAvgs.filter((s) => s.trend === 'down').length;

  let predictedPct = currentPct;
  predictedPct += upTrends * 1.5;
  predictedPct -= downTrends * 1.2;

  if (attendancePct >= 90) predictedPct += 2;
  else if (attendancePct < 75) predictedPct -= 3;

  predictedPct = Math.max(0, Math.min(100, predictedPct));

  const predictedGrade =
    predictedPct >= 90 ? 'A+' :
    predictedPct >= 80 ? 'A' :
    predictedPct >= 70 ? 'B+' :
    predictedPct >= 60 ? 'B' :
    predictedPct >= 50 ? 'C' :
    predictedPct >= 40 ? 'D' : 'F';

  const passProbability = Math.round(
    Math.min(99, Math.max(5, predictedPct * 0.95 + (attendancePct >= 75 ? 5 : -10)))
  );

  const confidence = Math.round(Math.min(95, 60 + subjectAvgs.length * 5 + (upTrends + downTrends === 0 ? 10 : 0)));

  return {
    currentPct: Math.round(currentPct * 10) / 10,
    predictedPct: Math.round(predictedPct * 10) / 10,
    predictedGrade,
    passProbability,
    confidence,
  };
}

export function generateStudyPlan(marks: Mark[]): StudyPlanDay[] {
  const subjects = calculateSubjectAverages(marks);
  const weak = subjects.filter((s) => s.level === 'weak');
  const medium = subjects.filter((s) => s.level === 'medium');
  const strong = subjects.filter((s) => s.level === 'strong');

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const plan: StudyPlanDay[] = [];

  const pool = [
    ...weak, ...weak, ...medium, ...strong,
    ...weak, ...medium, ...strong,
  ];

  days.forEach((day, i) => {
    const subj = pool[i % pool.length] || subjects[0];
    if (!subj) return;
    const isWeak = subj.level === 'weak';
    plan.push({
      day,
      subject: subj.subject,
      focus: isWeak
        ? 'Core concepts + practice problems'
        : subj.level === 'medium'
        ? 'Practice & revision'
        : 'Advanced problems & speed practice',
      duration: isWeak ? '90 min' : subj.level === 'medium' ? '60 min' : '45 min',
    });
  });

  return plan;
}

export function generateAIInsights(
  marks: Mark[],
  attendance: AttendanceRecord[],
  assignments: Assignment[],
  student: Student
): AIInsight[] {
  const insights: AIInsight[] = [];
  const subjectAvgs = calculateSubjectAverages(marks);
  const weakSubjects = subjectAvgs.filter((s) => s.level === 'weak');
  const strongSubjects = subjectAvgs.filter((s) => s.level === 'strong');
  if (weakSubjects.length > 0) {
    const weak = weakSubjects[0];
    insights.push({
      type: 'danger',
      title: `${weak.subject} needs attention`,
      message: `Your average in ${weak.subject} is ${weak.avgPct}%. Focus on daily practice — aim for 1 hour of problem-solving every day.`,
      icon: 'AlertTriangle',
    });
  }

  if (strongSubjects.length > 0) {
    const strong = strongSubjects[0];
    insights.push({
      type: 'success',
      title: `Excelling in ${strong.subject}`,
      message: `Outstanding performance at ${strong.avgPct}%! Consider advanced topics or peer tutoring to push further.`,
      icon: 'Trophy',
    });
  }

  if (student.attendance_pct < 75) {
    const deficit = Math.ceil((75 - student.attendance_pct) / 100 * 100);
    insights.push({
      type: 'danger',
      title: 'Attendance shortage risk',
      message: `Your attendance is ${student.attendance_pct}%, below the 75% threshold. You need approximately ${deficit} more classes to be safe.`,
      icon: 'CalendarX',
    });
  } else if (student.attendance_pct < 85) {
    insights.push({
      type: 'warning',
      title: 'Attendance could be better',
      message: `Your attendance is ${student.attendance_pct}%. Aim for 90%+ to stay on track and avoid risk.`,
      icon: 'CalendarClock',
    });
  }

  const lateCount = attendance.filter((a) => a.status === 'late').length;
  if (lateCount > 8) {
    insights.push({
      type: 'warning',
      title: 'Frequent late entries',
      message: `You've been late ${lateCount} times this month. Try to arrive 10 minutes early to settle in.`,
      icon: 'Clock',
    });
  }

  const overdueAssignments = assignments.filter((a) => a.status === 'late');
  if (overdueAssignments.length > 0) {
    insights.push({
      type: 'danger',
      title: `${overdueAssignments.length} overdue assignment${overdueAssignments.length > 1 ? 's' : ''}`,
      message: `Submit pending assignments soon. Late submissions affect your overall grade.`,
      icon: 'FileWarning',
    });
  }

  const upTrends = subjectAvgs.filter((s) => s.trend === 'up');
  if (upTrends.length > 0) {
    insights.push({
      type: 'success',
      title: `Improving in ${upTrends.length} subject${upTrends.length > 1 ? 's' : ''}`,
      message: `Your performance is trending upward in ${upTrends.map((s) => s.subject).join(', ')}. Keep it up!`,
      icon: 'TrendingUp',
    });
  }

  return insights;
}

export function generateParentSummary(
  marks: Mark[],
  student: Student
): string {
  const subjectAvgs = calculateSubjectAverages(marks);
  const overall = subjectAvgs.reduce((s, a) => s + a.avgPct, 0) / Math.max(1, subjectAvgs.length);
  const weak = subjectAvgs.filter((s) => s.level === 'weak');
  const strong = subjectAvgs.filter((s) => s.level === 'strong');

  let summary = `${student.name} is currently maintaining an overall average of ${Math.round(overall)}% with a GPA of ${student.gpa}. `;

  if (student.attendance_pct >= 90) {
    summary += `Attendance is excellent at ${student.attendance_pct}%. `;
  } else if (student.attendance_pct >= 75) {
    summary += `Attendance is satisfactory at ${student.attendance_pct}%, but could improve. `;
  } else {
    summary += `Attendance is a concern at ${student.attendance_pct}%, below the required 75%. `;
  }

  if (strong.length > 0) {
    summary += `Strong performance in ${strong.map((s) => `${s.subject} (${s.avgPct}%)`).join(', ')}. `;
  }
  if (weak.length > 0) {
    summary += `Needs support in ${weak.map((s) => `${s.subject} (${s.avgPct}%)`).join(', ')}. `;
  }

  const prediction = predictExamPerformance(marks, student.attendance_pct);
  summary += `Based on current trends, predicted final score is ${prediction.predictedPct}% (Grade ${prediction.predictedGrade}) with ${prediction.passProbability}% pass probability.`;

  return summary;
}

export function suggestCareer(marks: Mark[]): { field: string; match: number; description: string }[] {
  const subjects = calculateSubjectAverages(marks);
  const getAvg = (name: string) =>
    subjects.find((s) => s.subject.toLowerCase().includes(name.toLowerCase()))?.avgPct ?? 50;

  const math = getAvg('mathematics');
  const physics = getAvg('physics');
  const cs = getAvg('computer');
  const bio = getAvg('biology');
  const eng = getAvg('english');

  const careers = [
    {
      field: 'Engineering',
      match: Math.round((math * 0.4 + physics * 0.35 + cs * 0.25)),
      description: 'Strong analytical and problem-solving foundation for mechanical, electrical, or civil engineering.',
    },
    {
      field: 'Data Science & AI',
      match: Math.round((math * 0.45 + cs * 0.4 + eng * 0.15)),
      description: 'Excellent fit for machine learning, data analytics, and AI research careers.',
    },
    {
      field: 'Medicine',
      match: Math.round((bio * 0.5 + physics * 0.3 + eng * 0.2)),
      description: 'Medical, dental, or biomedical fields — requires dedication to biology and life sciences.',
    },
    {
      field: 'Commerce & Business',
      match: Math.round((math * 0.3 + eng * 0.5 + (100 - physics) * 0.2)),
      description: 'Business management, finance, or accounting — leverages communication and quantitative skills.',
    },
    {
      field: 'Arts & Humanities',
      match: Math.round((eng * 0.6 + (100 - math) * 0.2 + (100 - physics) * 0.2)),
      description: 'Literature, journalism, design, or creative writing — ideal for strong communicators.',
    },
  ];

  return careers.sort((a, b) => b.match - a.match);
}
