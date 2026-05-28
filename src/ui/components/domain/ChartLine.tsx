import React, { useState } from 'react';
import { cn } from '@/ui/cn';

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
  onPointClick?: (datum: LineDatum, index: number) => void;
}

export function ChartLine({
  data,
  height = 120,
  className,
  color = '#14b8a6',
  showDots = true,
  showValues = false,
  onPointClick,
}: ChartLineProps) {
  const [hovered, setHovered] = useState<number | null>(null);

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

        {/* Hover crosshair */}
        {hovered !== null && (
          <line
            x1={points[hovered].x}
            y1={padding.top}
            x2={points[hovered].x}
            y2={padding.top + plotHeight}
            stroke="rgba(148,163,184,0.2)"
            strokeWidth="1"
            strokeDasharray="4 3"
          />
        )}

        {/* Dots */}
        {showDots && points.map((p, i) => (
          <g key={i}>
            {/* Invisible larger hit target */}
            <circle
              cx={p.x}
              cy={p.y}
              r="12"
              fill="transparent"
              className={cn(onPointClick && 'cursor-pointer')}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => onPointClick?.(data[i], i)}
            />
            {/* Visible dot */}
            <circle
              cx={p.x}
              cy={p.y}
              r={hovered === i ? 5 : 3}
              fill={color}
              stroke="rgba(15,23,42,0.8)"
              strokeWidth="1.5"
              className="transition-all duration-200 pointer-events-none"
            />
            {/* Tooltip */}
            {hovered === i && (
              <g className="pointer-events-none">
                <rect
                  x={p.x - 28}
                  y={p.y - 30}
                  width="56"
                  height="20"
                  rx="4"
                  fill="rgba(30,41,59,0.95)"
                  stroke="rgba(71,85,105,0.5)"
                  strokeWidth="0.5"
                />
                <text
                  x={p.x}
                  y={p.y - 17}
                  textAnchor="middle"
                  fill="rgba(226,232,240,1)"
                  fontSize="10"
                  fontWeight="600"
                >
                  {p.label}: {p.value}
                </text>
              </g>
            )}
          </g>
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
