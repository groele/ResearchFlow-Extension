import React from 'react';
import { cn } from '../../cn';
import { Card } from '../primitives/Card';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    value: string;
    positive: boolean;
  };
  className?: string;
  onClick?: () => void;
}

export function StatCard({ label, value, icon, trend, className, onClick }: StatCardProps) {
  return (
    <Card
      variant="solid"
      padding="md"
      className={cn(
        'relative overflow-hidden',
        onClick && 'cursor-pointer hover:ring-1 hover:ring-primary-600/30 transition-all',
        className
      )}
      hover={onClick ? 'subtle' : undefined}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-2xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
          <p className="mt-1.5 text-xl font-bold text-slate-100 font-display">{value}</p>
          {trend && (
            <p className={cn('mt-1 text-2xs font-medium', trend.positive ? 'text-success-400' : 'text-error-400')}>
              {trend.positive ? '+' : ''}{trend.value}
            </p>
          )}
        </div>
        {icon && (
          <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-primary-950 text-primary-400 border border-primary-800">
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}
