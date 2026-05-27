import React from 'react';
import { cn } from '../../cn';

interface LineDatum {
  label: string;
  value: number;
}

interface ChartLineProps {
  data: LineDatum[];
  height?: number;
  className?: string;
  color?: string;
  showDots?: boolean;
  showValues?: boolean;
}

export function ChartLine({
  data,
  height = 120,
  className,
  color = '#14b8a6',
  showDots = true,
  showValues = false,
}: ChartLineProps) {
  if (data.length < 2) return null;

  const padding = { top: 16, right: 8, bottom: 24, left: 8 };
  const maxVal = Math.max(...data.map(d => d.value), 1);
  const svgWidth = 400;
  const svgHeight = height;
  const plotWidth = svgWidth - padding.left - padding.right;
  const plotHeight = svgHeight - padding.top - padding.bottom;

  const points = data.map((d, i) => ({
    x: padding.left + (i / (data.length - 1)) * plotWidth,
    y: padding.top + plotHeight - (d.value / maxVal) * plotHeight,
    ...d,
  }));

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaD = `${pathD} L ${points[points.length - 1].x} ${padding.top + plotHeight} L ${points[0].x} ${padding.top + plotHeight} Z`;

  return (
    <div className={cn('w-full', className)}>
      <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full" style={{ height }}>
        <defs>
          <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.2" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map(frac => {
          const y = padding.top + plotHeight * (1 - frac);
          return (
            <line
              key={frac}
              x1={padding.left}
              y1={y}
              x2={padding.left + plotWidth}
              y2={y}
              stroke="rgba(148,163,184,0.08)"
              strokeWidth="1"
            />
          );
        })}

        {/* Area fill */}
        <path d={areaD} fill="url(#lineGrad)" />

        {/* Line */}
        <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

        {/* Dots */}
        {showDots && points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3" fill={color} stroke="rgba(15,23,42,0.8)" strokeWidth="1.5" />
        ))}

        {/* Values */}
        {showValues && points.map((p, i) => (
          <text key={i} x={p.x} y={p.y - 8} textAnchor="middle" className="text-3xs" fill="rgba(148,163,184,0.6)">
            {p.value}
          </text>
        ))}
      </svg>

      {/* X labels */}
      <div className="flex justify-between px-2 mt-1">
        {data.map((d, i) => (
          <span key={i} className="text-3xs text-slate-500 truncate" style={{ maxWidth: `${100 / data.length}%` }}>
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
}
