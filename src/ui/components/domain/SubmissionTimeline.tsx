import React from 'react';
import { cn } from '@/ui/cn';
import type { SubmissionAnalysis, Milestone } from '@features/dashboard/useDashboardData';

interface SubmissionTimelineProps {
  analysis: SubmissionAnalysis;
  manuscriptTitle?: string;
  journal?: string;
  className?: string;
  onClick?: () => void;
}

export function SubmissionTimeline({ analysis, manuscriptTitle, journal, className, onClick }: SubmissionTimelineProps) {
  const { display } = analysis;
  const milestones = display.milestones;

  if (milestones.length === 0) return null;

  return (
    <div
      className={cn(
        'p-4 rounded-xl border',
        onClick && 'cursor-pointer hover:ring-1 hover:ring-primary-600/30 transition-all',
        className
      )}
      style={{ backgroundColor: display.bg, borderColor: display.border }}
      onClick={onClick}
    >
      {/* Header */}
      {manuscriptTitle && (
        <div className="mb-3">
          <h4 className="text-xs font-semibold text-slate-200 truncate">{manuscriptTitle}</h4>
          {journal && <p className="text-2xs text-slate-500 mt-0.5">{journal}</p>}
        </div>
      )}

      {/* Timeline Track */}
      <div className="relative flex items-center gap-0 py-3">
        {/* Background track line */}
        <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-slate-800 -translate-y-1/2 z-0" />

        {/* Progress line */}
        {milestones.length >= 2 && (
          <div
            className="absolute top-1/2 left-4 h-0.5 -translate-y-1/2 z-[1] transition-all duration-700"
            style={{
              backgroundColor: display.color,
              width: `${Math.max(0, Math.min(100, (milestones.filter(m => m.date).length / milestones.length) * 100))}%`,
              maxWidth: 'calc(100% - 2rem)',
            }}
          />
        )}

        {/* Milestone nodes */}
        {milestones.map((ms, i) => (
          <MilestoneNode key={i} milestone={ms} color={display.color} index={i} total={milestones.length} />
        ))}
      </div>

      {/* Metric display */}
      <div className="flex items-center justify-between mt-2">
        <p className="text-2xs text-slate-400">{display.label}</p>
        <div className="flex items-center gap-1.5">
          {display.value !== null && (
            <span className="text-sm font-bold font-display" style={{ color: display.color }}>
              {display.value}d
            </span>
          )}
          {display.pending && (
            <span className="inline-block w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: display.color }} />
          )}
        </div>
      </div>
      <p className="text-3xs text-slate-500 mt-0.5">{display.caption}</p>
    </div>
  );
}

function MilestoneNode({ milestone, color, index, total }: { milestone: Milestone; color: string; index: number; total: number }) {
  const hasDate = !!milestone.date;
  const isToday = milestone.today;

  return (
    <div className="flex-1 flex flex-col items-center relative z-[2]">
      {/* Node dot */}
      <div
        className={cn(
          'w-3.5 h-3.5 rounded-full border-2 transition-all',
          hasDate ? 'scale-100' : 'scale-75 opacity-50',
          isToday && 'animate-pulse'
        )}
        style={{
          backgroundColor: hasDate ? milestone.color : 'transparent',
          borderColor: milestone.color,
        }}
      />

      {/* Label */}
      <div className="mt-2 text-center max-w-[72px]">
        <p className={cn(
          'text-3xs font-medium leading-tight',
          hasDate ? 'text-slate-300' : 'text-slate-600'
        )}>
          {milestone.name}
        </p>
        {milestone.date && (
          <p className="text-3xs text-slate-500 font-mono mt-0.5">
            {new Date(milestone.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </p>
        )}
      </div>
    </div>
  );
}
