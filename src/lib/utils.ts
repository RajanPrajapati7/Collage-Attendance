export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function daysUntil(date: string | Date): number {
  const target = new Date(date);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function relativeDate(date: string | Date): string {
  const diff = daysUntil(date);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  if (diff > 0) return `In ${diff} days`;
  return `${Math.abs(diff)} days ago`;
}

export function getGrade(pct: number): string {
  if (pct >= 90) return 'A+';
  if (pct >= 80) return 'A';
  if (pct >= 70) return 'B+';
  if (pct >= 60) return 'B';
  if (pct >= 50) return 'C';
  if (pct >= 40) return 'D';
  return 'F';
}

export function getGradeColor(grade: string): string {
  if (grade.startsWith('A')) return 'text-brand-600 dark:text-brand-400';
  if (grade.startsWith('B')) return 'text-accent-600 dark:text-accent-400';
  if (grade.startsWith('C')) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-600 dark:text-red-400';
}

export function initials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function avatarColor(name: string): string {
  const colors = [
    'bg-brand-500', 'bg-accent-500', 'bg-amber-500', 'bg-rose-500',
    'bg-teal-500', 'bg-indigo-500', 'bg-cyan-500', 'bg-orange-500',
  ];
  const idx = name.charCodeAt(0) % colors.length;
  return colors[idx];
}
