import React, { useState, useMemo } from 'react';
import { cn } from '@/ui/cn';

export interface GanttItem {
  id: string;
  label: string;
  start: string;   // ISO date string
  end: string;     // ISO date string
  color?: string;
  progress?: number; // 0-100
}

interface ChartGanttProps {
  items: GanttItem[];
  height?: number;
  className?: string;
  onItemClick?: (item: GanttItem) => void;
}

const defaultColors = [
  '#14b8a6', '#3b82f6', '#f97316', '#8b5cf6', '#ef4444', '#eab308', '#06b6d4', '#ec4899',
];

export function ChartGantt({ items, height = 200, className, onItemClick }: ChartGanttProps) {
  const [hovered, setHovered] = useState<string | null>(null);

  const { bars, todayX, minTs, maxTs, range } = useMemo(() => {
    if (items.length === 0) {
      return { bars: [], todayX: 0, minTs: 0, maxTs: 0, range: 1 };
    }

    const now = new Date();
    const todayTs = now.getTime();

    let minTs = Infinity;
    let maxTs = -Infinity;

    for (const item of items) {
      const s = new Date(item.start).getTime();
      const e = new Date(item.end).getTime();
      if (!isNaN(s) && s < minTs) minTs = s;
      if (!isNaN(e) && e > maxTs) maxTs = e;
      if (!isNaN(s) && s > maxTs) maxTs = s;
    }

    // Add 5% padding on each side
    const range = maxTs - minTs || 1;
    const pad = range * 0.05;
    const adjMin = minTs - pad;
    const adjMax = maxTs + pad;
    const adjRange = adjMax - adjMin;

    const toX = (ts: number) => ((ts - adjMin) / adjRange) * 100;

    const bars = items.map((item, i) => {
      const s = new Date(item.start).getTime();
      const e = new Date(item.end).getTime();
      const startPct = toX(s);
      const endPct = toX(Math.max(e, s));
      const width = Math.max(endPct - startPct, 0.8); // min width for visibility
      return {
        ...item,
        startPct,
        width,
        color: item.color || defaultColors[i % defaultColors.length],
      };
    });

    const todayX = toX(todayTs);

    return { bars, todayX, minTs: adjMin, maxTs: adjMax, range: adjRange };
  }, [items]);

  if (items.length === 0) return null;

  const rowHeight = Math.max(28, Math.min(40, height / items.length));
  const totalHeight = items.length * rowHeight + 30; // 30 for top axis area
  const padding = { left: 0, right: 0, top: 24, bottom: 0 };
  const barHeight = rowHeight * 0.55;

  // Generate month tick labels
  const ticks = useMemo(() => {
    const result: { x: number; label: string }[] = [];
    const start = new Date(minTs);
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    const end = new Date(maxTs);

    const current = new Date(start);
    while (current <= end) {
      const ts = current.getTime();
      const x = ((ts - minTs) / range) * 100;
      if (x >= 0 && x <= 100) {
        const label = current.toLocaleString('default', { month: 'short', year: '2-digit' });
        result.push({ x, label });
      }
      current.setMonth(current.getMonth() + 1);
    }
    return result;
  }, [minTs, maxTs, range]);

  return (
    <div className={cn('w-full', className)}>
      <svg
        viewBox={`0 0 100 ${totalHeight}`}
        className="w-full"
        preserveAspectRatio="none"
        style={{ minHeight: Math.max(height, items.length * 32 + 40) }}
      >
        {/* Grid lines */}
        {ticks.map((tick, i) => (
          <line
            key={i}
            x1={tick.x}
            y1={padding.top - 4}
            x2={tick.x}
            y2={totalHeight}
            stroke="rgba(148,163,184,0.08)"
            strokeWidth="0.3"
            vectorEffect="non-scaling-stroke"
          />
        ))}

        {/* Tick labels */}
        {ticks.map((tick, i) => (
          <text
            key={`label-${i}`}
            x={tick.x}
            y={padding.top - 8}
            textAnchor="middle"
            fill="rgba(148,163,184,0.5)"
            fontSize="3"
            fontWeight="500"
          >
            {tick.label}
          </text>
        ))}

        {/* Today marker */}
        {todayX >= 0 && todayX <= 100 && (
          <line
            x1={todayX}
            y1={padding.top - 4}
            x2={todayX}
            y2={totalHeight}
            stroke="rgba(239,68,68,0.4)"
            strokeWidth="0.4"
            strokeDasharray="1 1"
            vectorEffect="non-scaling-stroke"
          />
        )}

        {/* Bars */}
        {bars.map((bar, i) => {
          const y = padding.top + i * rowHeight + (rowHeight - barHeight) / 2;
          const isHovered = hovered === bar.id;
          const progressWidth = bar.progress != null ? bar.width * (bar.progress / 100) : 0;

          return (
            <g
              key={bar.id}
              onMouseEnter={() => setHovered(bar.id)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => onItemClick?.(bar)}
              className={onItemClick ? 'cursor-pointer' : undefined}
            >
              {/* Background bar */}
              <rect
                x={bar.startPct}
                y={y}
                width={bar.width}
                height={barHeight}
                rx={1.5}
                fill={bar.color}
                opacity={isHovered ? 0.35 : 0.18}
                className="transition-opacity duration-200"
              />
              {/* Progress fill */}
              {progressWidth > 0 && (
                <rect
                  x={bar.startPct}
                  y={y}
                  width={progressWidth}
                  height={barHeight}
                  rx={1.5}
                  fill={bar.color}
                  opacity={isHovered ? 0.9 : 0.6}
                  className="transition-opacity duration-200"
                />
              )}
              {/* No progress: solid thin bar */}
              {bar.progress == null && (
                <rect
                  x={bar.startPct}
                  y={y + barHeight * 0.3}
                  width={bar.width}
                  height={barHeight * 0.4}
                  rx={1}
                  fill={bar.color}
                  opacity={isHovered ? 0.9 : 0.6}
                  className="transition-opacity duration-200"
                />
              )}
              {/* Label */}
              <text
                x={bar.startPct + bar.width + 1}
                y={y + barHeight * 0.65}
                fill={isHovered ? 'rgba(226,232,240,0.9)' : 'rgba(148,163,184,0.7)'}
                fontSize="2.8"
                fontWeight="500"
                className="transition-colors duration-200 pointer-events-none"
              >
                {bar.label.length > 20 ? bar.label.slice(0, 20) + '...' : bar.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
