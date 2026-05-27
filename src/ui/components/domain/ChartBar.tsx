import React from 'react';
import { cn } from '../../cn';

interface BarDatum {
  label: string;
  value: number;
  color?: string;
}

interface ChartBarProps {
  data: BarDatum[];
  height?: number;
  className?: string;
  showValues?: boolean;
  maxValue?: number;
}

const defaultColors = [
  'bg-primary-500',
  'bg-info-500',
  'bg-success-500',
  'bg-warning-500',
  'bg-error-500',
  'bg-slate-500',
];

export function ChartBar({ data, height = 160, className, showValues = true, maxValue }: ChartBarProps) {
  if (data.length === 0) return null;

  const max = maxValue ?? Math.max(...data.map(d => d.value), 1);

  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-end gap-1.5" style={{ height }}>
        {data.map((d, i) => {
          const barHeight = Math.max((d.value / max) * 100, 2);
          const color = d.color || defaultColors[i % defaultColors.length];
          return (
            <div key={d.label} className="flex-1 flex flex-col items-center justify-end h-full">
              {showValues && d.value > 0 && (
                <span className="text-3xs text-slate-400 mb-1 font-medium">{d.value}</span>
              )}
              <div
                className={cn('w-full rounded-t transition-all duration-500', color)}
                style={{ height: `${barHeight}%`, minHeight: d.value > 0 ? 4 : 0 }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex gap-1.5 mt-1.5">
        {data.map(d => (
          <div key={d.label} className="flex-1 text-center">
            <span className="text-3xs text-slate-500 truncate block">{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
