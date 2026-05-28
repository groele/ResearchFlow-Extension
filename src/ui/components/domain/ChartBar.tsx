import React, { useState } from 'react';
import { cn } from '@/ui/cn';

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
  onBarClick?: (datum: BarDatum, index: number) => void;
}

const defaultColors = [
  'bg-primary-500',
  'bg-info-500',
  'bg-success-500',
  'bg-warning-500',
  'bg-error-500',
  'bg-slate-500',
];

export function ChartBar({ data, height = 160, className, showValues = true, maxValue, onBarClick }: ChartBarProps) {
  const [hovered, setHovered] = useState<number | null>(null);

  if (data.length === 0) return null;

  const max = maxValue ?? Math.max(...data.map(d => d.value), 1);

  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-end gap-1.5 relative" style={{ height }}>
        {data.map((d, i) => {
          const barHeight = Math.max((d.value / max) * 100, 2);
          const color = d.color || defaultColors[i % defaultColors.length];
          const isHovered = hovered === i;
          return (
            <div
              key={d.label}
              className={cn(
                'flex-1 flex flex-col items-center justify-end h-full relative',
                onBarClick && 'cursor-pointer'
              )}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => onBarClick?.(d, i)}
            >
              {/* Tooltip */}
              {isHovered && (
                <div className="absolute z-50 bottom-full mb-2 px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-md shadow-lg pointer-events-none whitespace-nowrap animate-fade-in">
                  <p className="text-2xs font-medium text-slate-200">{d.label}</p>
                  <p className="text-xs font-bold text-primary-400">{d.value}</p>
                </div>
              )}
              {showValues && d.value > 0 && (
                <span className={cn(
                  'text-3xs mb-1 font-medium transition-opacity',
                  isHovered ? 'text-primary-400' : 'text-slate-400'
                )}>{d.value}</span>
              )}
              <div
                className={cn(
                  'w-full rounded-t transition-all duration-500',
                  color,
                  isHovered && 'brightness-125 scale-x-105'
                )}
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
