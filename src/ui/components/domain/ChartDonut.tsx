import React, { useState } from 'react';
import { cn } from '@/ui/cn';

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
  onSegmentClick?: (datum: DonutDatum, index: number) => void;
}

export function ChartDonut({
  data,
  size = 140,
  thickness = 20,
  className,
  centerLabel,
  centerValue,
  onSegmentClick,
}: ChartDonutProps) {
  const [hovered, setHovered] = useState<number | null>(null);

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

  const hoveredItem = hovered !== null ? data[hovered] : null;
  const hoveredPercent = hovered !== null ? Math.round(segments[hovered].fraction * 100) : null;

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
            strokeWidth={hovered === i ? thickness + 3 : thickness}
            strokeDasharray={`${seg.dashLength} ${circumference - seg.dashLength}`}
            strokeDashoffset={seg.dashOffset}
            className={cn(
              'transition-all duration-300',
              onSegmentClick && 'cursor-pointer'
            )}
            style={{ opacity: hovered !== null && hovered !== i ? 0.5 : 1 }}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            onClick={() => onSegmentClick?.(seg, i)}
          />
        ))}
      </svg>
      {(centerLabel || centerValue) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          {hoveredItem ? (
            <>
              <span className="text-lg font-bold font-display" style={{ color: hoveredItem.color }}>{hoveredItem.value}</span>
              <span className="text-3xs text-slate-400">{hoveredItem.label}</span>
              <span className="text-3xs text-slate-500">{hoveredPercent}%</span>
            </>
          ) : (
            <>
              {centerValue && <span className="text-lg font-bold text-slate-100 font-display">{centerValue}</span>}
              {centerLabel && <span className="text-3xs text-slate-500">{centerLabel}</span>}
            </>
          )}
        </div>
      )}
      </div>
      <div className="space-y-1.5">
        {data.map((d, i) => (
          <div
            key={i}
            className={cn(
              'flex items-center gap-2 transition-opacity',
              hovered !== null && hovered !== i && 'opacity-50',
              onSegmentClick && 'cursor-pointer'
            )}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            onClick={() => onSegmentClick?.(d, i)}
          >
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
            <span className="text-3xs text-slate-400">{d.label}</span>
            <span className="text-3xs text-slate-500 ml-auto font-medium">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
