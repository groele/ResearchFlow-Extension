import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../cn';

const iconButtonVariants = cva(
  'inline-flex items-center justify-center transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        ghost: 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/60',
        subtle: 'text-slate-400 hover:text-slate-200 hover:bg-slate-800',
        danger: 'text-slate-500 hover:text-error-400 hover:bg-error-950',
      },
      size: {
        xs: 'h-5 w-5 rounded',
        sm: 'h-7 w-7 rounded-md',
        md: 'h-8 w-8 rounded-lg',
        lg: 'h-10 w-10 rounded-xl',
      },
    },
    defaultVariants: {
      variant: 'ghost',
      size: 'md',
    },
  }
);

export interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof iconButtonVariants> {
  icon: React.ReactNode;
  'aria-label': string;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, variant, size, icon, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(iconButtonVariants({ variant, size, className }))}
        {...props}
      >
        {icon}
      </button>
    );
  }
);
IconButton.displayName = 'IconButton';
