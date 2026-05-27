import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../cn';
import { Spinner } from './Spinner';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:pointer-events-none disabled:opacity-50 select-none',
  {
    variants: {
      variant: {
        primary: 'bg-primary-600 text-white hover:bg-primary-500 active:bg-primary-700 shadow-sm',
        secondary: 'bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-750 hover:border-slate-650 active:bg-slate-700',
        ghost: 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 active:bg-slate-800',
        danger: 'bg-error-600 text-white hover:bg-error-500 active:bg-error-600 shadow-sm',
        success: 'bg-success-600 text-white hover:bg-success-500 active:bg-success-600 shadow-sm',
      },
      size: {
        xs: 'h-6 px-2 text-2xs rounded',
        sm: 'h-8 px-3 text-xs rounded-md',
        md: 'h-9 px-4 text-sm rounded-lg',
        lg: 'h-11 px-6 text-base rounded-lg',
        icon: 'h-8 w-8 rounded-lg',
        'icon-sm': 'h-6 w-6 rounded-md',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, leftIcon, rightIcon, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? <Spinner size="sm" /> : leftIcon}
        {children}
        {rightIcon}
      </button>
    );
  }
);
Button.displayName = 'Button';
