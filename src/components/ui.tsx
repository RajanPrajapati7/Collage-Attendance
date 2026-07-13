import type { ReactNode } from 'react';
import { cn, avatarColor, initials } from '../lib/utils';

export function Card({ className, children, hover }: { className?: string; children: ReactNode; hover?: boolean }) {
  return <div className={cn('card', hover && 'card-hover', className)}>{children}</div>;
}

export function StatCard({
  label, value, icon, trend, color = 'brand',
}: {
  label: string; value: ReactNode; icon: ReactNode; trend?: string; color?: 'brand' | 'accent' | 'amber' | 'rose';
}) {
  const colors = {
    brand: 'bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400',
    accent: 'bg-accent-50 text-accent-600 dark:bg-accent-900/30 dark:text-accent-400',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
    rose: 'bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400',
  };
  return (
    <Card hover className="animate-slide-up">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-500 dark:text-ink-400">{label}</p>
          <p className="mt-2 font-display text-2xl font-bold text-ink-900 dark:text-ink-50">{value}</p>
          {trend && <p className="mt-1 text-xs text-ink-500 dark:text-ink-400">{trend}</p>}
        </div>
        <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl', colors[color])}>
          {icon}
        </div>
      </div>
    </Card>
  );
}

export function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-14 w-14 text-lg',
  };
  return (
    <div className={cn('flex shrink-0 items-center justify-center rounded-full font-semibold text-white', avatarColor(name), sizes[size])}>
      {initials(name)}
    </div>
  );
}

export function ProgressBar({ value, max = 100, color = 'brand' }: { value: number; max?: number; color?: 'brand' | 'accent' | 'amber' | 'rose' }) {
  const pct = Math.min(100, (value / max) * 100);
  const colors = {
    brand: 'bg-brand-500',
    accent: 'bg-accent-500',
    amber: 'bg-amber-500',
    rose: 'bg-rose-500',
  };
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-ink-100 dark:bg-ink-800">
      <div className={cn('h-full rounded-full transition-all duration-500', colors[color])} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function SectionHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        <h2 className="font-display text-xl font-bold text-ink-900 dark:text-ink-50">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-ink-500 dark:text-ink-400">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ icon, title, message }: { icon: ReactNode; title: string; message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-ink-100 text-ink-400 dark:bg-ink-800 dark:text-ink-500">
        {icon}
      </div>
      <p className="font-semibold text-ink-700 dark:text-ink-300">{title}</p>
      {message && <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">{message}</p>}
    </div>
  );
}

export function LoadingState({ message = 'Loading…' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="h-10 w-10 animate-spin rounded-full border-3 border-ink-200 border-t-brand-500 dark:border-ink-700 dark:border-t-brand-400" />
      <p className="mt-4 text-sm text-ink-500 dark:text-ink-400">{message}</p>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500 dark:bg-red-900/30 dark:text-red-400">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      </div>
      <p className="font-semibold text-ink-700 dark:text-ink-300">Something went wrong</p>
      <p className="mt-1 max-w-sm text-sm text-ink-500 dark:text-ink-400">{message}</p>
      {onRetry && <button onClick={onRetry} className="btn-secondary mt-4">Try again</button>}
    </div>
  );
}

export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink-950/50 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg animate-scale-in rounded-2xl border border-ink-200 bg-white p-6 shadow-xl dark:border-ink-800 dark:bg-ink-900 max-h-[90vh] overflow-y-auto scrollbar-thin">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-lg font-bold text-ink-900 dark:text-ink-50">{title}</h3>
          <button onClick={onClose} className="btn-ghost h-8 w-8 rounded-lg p-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
