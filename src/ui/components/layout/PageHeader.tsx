import React from 'react';
import { cn } from '../../cn';

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, description, icon, actions, className }: PageHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between mb-6', className)}>
      <div className="flex items-center gap-3">
        {icon && (
          <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-primary-950 text-primary-400 border border-primary-800">
            {icon}
          </div>
        )}
        <div>
          <h1 className="text-lg font-semibold text-slate-100 font-display">{title}</h1>
          {description && <p className="text-xs text-slate-400 mt-0.5">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
