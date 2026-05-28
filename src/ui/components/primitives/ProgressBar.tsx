import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/ui/cn';

const progressBarTrackVariants = cva('w-full rounded-full overflow-hidden', {
  variants: {
    size: {
      sm: 'h-1',
      md: 'h-2',
      lg: 'h-3',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

const progressBarFillVariants = cva('h-full rounded-full transition-all duration-500 ease-out', {
  variants: {
    color: {
      primary: 'bg-primary-500',
      success: 'bg-success-500',
      warning: 'bg-warning-500',
      error: 'bg-error-500',
      info: 'bg-info-500',
    },
  },
  defaultVariants: {
    color: 'primary',
  },
});

export interface ProgressBarProps extends VariantProps<typeof progressBarTrackVariants> {
  value: number; // 0-100
  max?: number;
  color?: VariantProps<typeof progressBarFillVariants>['color'];
  label?: string;
  showValue?: boolean;
  className?: string;
}

export function ProgressBar({
  value,
  max = 100,
  color,
  size,
  label,
  showValue = false,
  className,
}: ProgressBarProps) {
  const percent = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={cn('w-full', className)}>
      {(label || showValue) && (
        <div className="flex items-center justify-between mb-1.5">
          {label && <span className="text-2xs font-medium text-slate-400">{label}</span>}
          {showValue && (
            <span className="text-2xs font-medium text-slate-500">{Math.round(percent)}%</span>
          )}
        </div>
      )}
      <div className={cn(progressBarTrackVariants({ size }))}>
        <div
          className={cn(progressBarFillVariants({ color }))}
          style={{ width: `${percent}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        />
      </div>
    </div>
  );
}
