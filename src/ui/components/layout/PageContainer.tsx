import React from 'react';
import { cn } from '@/ui/cn';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <main className={cn('flex-1 overflow-y-auto p-6', className)}>
      <div className="max-w-7xl mx-auto animate-fade-in">
        {children}
      </div>
    </main>
  );
}
