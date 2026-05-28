import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/ui/cn';

const badgeVariants = cva(
  'inline-flex items-center gap-1 font-medium select-none',
  {
    variants: {
      variant: {
        default: 'bg-slate-800 text-slate-300 border border-slate-700',
        primary: 'bg-primary-950 text-primary-400 border border-primary-800',
        success: 'bg-success-950 text-success-400 border border-success-600/30',
        warning: 'bg-warning-950 text-warning-400 border border-warning-600/30',
        error: 'bg-error-950 text-error-400 border border-error-600/30',
        info: 'bg-info-950 text-info-400 border border-info-600/30',
      },
      size: {
        sm: 'px-1.5 py-0.5 text-3xs rounded',
        md: 'px-2 py-0.5 text-2xs rounded-md',
        lg: 'px-2.5 py-1 text-xs rounded-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, size, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, size, className }))} {...props} />;
}
