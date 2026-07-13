import { useId } from 'react';

export function LineChart({
  data, labels, height = 200, color = '#16b87e',
}: {
  data: number[];
  labels: string[];
  height?: number;
  color?: string;
}) {
  const id = useId();
  const width = 600;
  const padding = { top: 20, right: 20, bottom: 30, left: 40 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const max = Math.max(...data, 100);
  const min = Math.min(...data, 0);
  const range = max - min || 1;

  const points = data.map((v, i) => ({
    x: padding.left + (i / Math.max(1, data.length - 1)) * chartW,
    y: padding.top + chartH - ((v - min) / range) * chartH,
    value: v,
  }));

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaD = `${pathD} L ${padding.left + chartW} ${padding.top + chartH} L ${padding.left} ${padding.top + chartH} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id={`area-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 25, 50, 75, 100].map((pct) => {
        const y = padding.top + chartH - (pct / 100) * chartH;
        return (
          <g key={pct}>
            <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="currentColor" className="text-ink-200 dark:text-ink-800" strokeWidth="1" strokeDasharray="4 4" />
            <text x={padding.left - 8} y={y + 4} textAnchor="end" className="fill-ink-400 text-[10px]">{pct}</text>
          </g>
        );
      })}
      <path d={areaD} fill={`url(#area-${id})`} />
      <path d={pathD} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="4" fill="white" stroke={color} strokeWidth="2" />
          <text x={p.x} y={padding.top + chartH + 18} textAnchor="middle" className="fill-ink-400 text-[10px]">{labels[i]}</text>
        </g>
      ))}
    </svg>
  );
}

export function BarChart({
  data, labels, height = 200, color = '#16b87e', max = 100,
}: {
  data: number[];
  labels: string[];
  height?: number;
  color?: string;
  max?: number;
}) {
  const width = 600;
  const padding = { top: 20, right: 20, bottom: 40, left: 40 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;
  const barW = chartW / data.length * 0.6;
  const gap = chartW / data.length * 0.4;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" preserveAspectRatio="xMidYMid meet">
      {[0, 25, 50, 75, 100].map((pct) => {
        const y = padding.top + chartH - (pct / 100) * chartH;
        return (
          <g key={pct}>
            <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="currentColor" className="text-ink-200 dark:text-ink-800" strokeWidth="1" strokeDasharray="4 4" />
            <text x={padding.left - 8} y={y + 4} textAnchor="end" className="fill-ink-400 text-[10px]">{Math.round((pct / 100) * max)}</text>
          </g>
        );
      })}
      {data.map((v, i) => {
        const h = (v / max) * chartH;
        const x = padding.left + i * (barW + gap) + gap / 2;
        const y = padding.top + chartH - h;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={h} rx="4" fill={color} opacity={0.85} />
            <text x={x + barW / 2} y={y - 6} textAnchor="middle" className="fill-ink-600 dark:fill-ink-300 text-[10px] font-semibold">{v}</text>
            <text x={x + barW / 2} y={padding.top + chartH + 18} textAnchor="middle" className="fill-ink-400 text-[10px]">{labels[i]}</text>
          </g>
        );
      })}
    </svg>
  );
}

export function DonutChart({
  segments, size = 160, strokeWidth = 16,
}: {
  segments: { label: string; value: number; color: string }[];
  size?: number;
  strokeWidth?: number;
}) {
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="flex items-center gap-6">
      <svg width={size} height={size} className="shrink-0 -rotate-90">
        {segments.map((seg, i) => {
          const dash = (seg.value / total) * circumference;
          const circle = (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-offset}
              strokeLinecap="round"
            />
          );
          offset += dash;
          return circle;
        })}
        <text x="50%" y="50%" textAnchor="middle" className="rotate-90 fill-ink-700 dark:fill-ink-200" style={{ transformOrigin: 'center', fontSize: '24px', fontWeight: 700 }} dy="0.35em">
          {total}%
        </text>
      </svg>
      <div className="space-y-2">
        {segments.map((seg, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <div className="h-3 w-3 rounded-full" style={{ background: seg.color }} />
            <span className="text-ink-600 dark:text-ink-300">{seg.label}</span>
            <span className="font-semibold text-ink-900 dark:text-ink-100">{seg.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function RadarChart({
  data, size = 220,
}: {
  data: { subject: string; value: number }[];
  size?: number;
}) {
  const center = size / 2;
  const maxR = size / 2 - 40;
  const angleStep = (2 * Math.PI) / data.length;

  const points = data.map((d, i) => {
    const angle = i * angleStep - Math.PI / 2;
    const r = (d.value / 100) * maxR;
    return { x: center + r * Math.cos(angle), y: center + r * Math.sin(angle), value: d.value, subject: d.subject };
  });

  const labelPoints = data.map((d, i) => {
    const angle = i * angleStep - Math.PI / 2;
    return {
      x: center + (maxR + 20) * Math.cos(angle),
      y: center + (maxR + 20) * Math.sin(angle),
      subject: d.subject,
    };
  });

  const polygonPoints = points.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-xs mx-auto">
      {[0.25, 0.5, 0.75, 1].map((scale) => (
        <polygon
          key={scale}
          points={data.map((_, i) => {
            const angle = i * angleStep - Math.PI / 2;
            const r = maxR * scale;
            return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
          }).join(' ')}
          fill="none"
          stroke="currentColor"
          className="text-ink-200 dark:text-ink-800"
          strokeWidth="1"
        />
      ))}
      {data.map((_, i) => {
        const angle = i * angleStep - Math.PI / 2;
        return (
          <line
            key={i}
            x1={center}
            y1={center}
            x2={center + maxR * Math.cos(angle)}
            y2={center + maxR * Math.sin(angle)}
            stroke="currentColor"
            className="text-ink-200 dark:text-ink-800"
            strokeWidth="1"
          />
        );
      })}
      <polygon points={polygonPoints} fill="#16b87e" fillOpacity="0.2" stroke="#16b87e" strokeWidth="2" />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill="#16b87e" />
      ))}
      {labelPoints.map((p, i) => (
        <text key={i} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle" className="fill-ink-500 dark:fill-ink-400 text-[9px] font-medium">
          {p.subject.length > 10 ? p.subject.slice(0, 8) + '…' : p.subject}
        </text>
      ))}
    </svg>
  );
}

export function HeatmapGrid({ data }: { data: { date: string; present: number; total: number }[] }) {
  const getColor = (pct: number) => {
    if (pct >= 90) return 'bg-brand-500';
    if (pct >= 75) return 'bg-brand-400';
    if (pct >= 50) return 'bg-amber-400';
    if (pct > 0) return 'bg-red-400';
    return 'bg-ink-200 dark:bg-ink-800';
  };

  return (
    <div className="grid grid-cols-7 gap-1.5">
      {data.map((d, i) => {
        const pct = d.total > 0 ? (d.present / d.total) * 100 : 0;
        return (
          <div
            key={i}
            className={`aspect-square rounded-md ${getColor(pct)} transition-all hover:scale-110 cursor-default`}
            title={`${d.date}: ${d.present}/${d.total} classes (${Math.round(pct)}%)`}
          />
        );
      })}
    </div>
  );
}
