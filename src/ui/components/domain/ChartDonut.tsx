import React from 'react';
import { cn } from '../../cn';

interface DonutDatum {
  label: string;
  value: number;
  color: string;
}

interface ChartDonutProps {
  data: DonutDatum[];
  size?: number;
  thickness?: number;
  className?: string;
  centerLabel?: string;
  centerValue?: string;
}

export function ChartDonut({
  data,
  size = 140,
  thickness = 20,
  className,
  centerLabel,
  centerValue,
}: ChartDonutProps) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return null;

  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const cx = size / 2;
  const cy = size / 2;

  let cumulative = 0;
  const segments = data.map(d => {
    const fraction = d.value / total;
    const dashLength = fraction * circumference;
    const dashOffset = -cumulative * circumference;
    cumulative += fraction;
    return { ...d, dashLength, dashOffset, fraction };
  });

  return (
    <div className={cn('inline-flex items-center gap-4', className)}>
      <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90 absolute inset-0">
        {segments.map((seg, i) => (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke={seg.color}
            strokeWidth={thickness}
            strokeDasharray={`${seg.dashLength} ${circumference - seg.dashLength}`}
            strokeDashoffset={seg.dashOffset}
            className="transition-all duration-700"
          />
        ))}
      </svg>
      {(centerLabel || centerValue) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          {centerValue && <span className="text-lg font-bold text-slate-100 font-display">{centerValue}</span>}
          {centerLabel && <span className="text-3xs text-slate-500">{centerLabel}</span>}
        </div>
      )}
      </div>
      <div className="space-y-1.5">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
            <span className="text-3xs text-slate-400">{d.label}</span>
            <span className="text-3xs text-slate-500 ml-auto font-medium">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
